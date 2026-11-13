"""Build an explicit, deterministic AstrBot plugin ZIP without a second SDK."""

import argparse
import ast
import hashlib
import json
import os
import re
import stat
import subprocess
import tempfile
import zipfile
from importlib.util import module_from_spec, spec_from_file_location
from io import BytesIO
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

QUERY_TOOLS = {
    "steam": {
        "search": ("search", "query"),
        "app": ("app", "app_id"),
        **{
            name: (name + "_explicit", "account")
            for name in ("profile", "recent", "games")
        },
        "wall": ("wall_explicit", "account"),
        "wishlist": ("wishlist_explicit", "account"),
    },
    "dota2": {
        name: (
            name + "_explicit",
            "match_id" if name in ("match", "analyze") else "account",
        )
        for name in ("profile", "recent", "stats", "last", "match", "analyze")
    },
    "deadlock": {
        name: (name + "_explicit", "match_id" if name == "match" else "account")
        for name in ("profile", "recent", "stats", "last", "match")
    },
    "cs2": {
        name: (name + "_explicit", "match_id" if name == "match" else "account")
        for name in ("profile", "recent", "stats", "last", "match")
    },
}
MODEL_TOOL_NAMES = {module_id: f"steam_dlc_{module_id}" for module_id in QUERY_TOOLS}
MODEL_TOOL_DESCRIPTIONS = {
    "steam": "查询 Steam 商店、应用详情、公开玩家资料、近期游戏、游戏样本、游戏生涯拼图与公开愿望单。",
    "dota2": "查询 Dota 2 玩家资料、近期比赛、统计、单场详情与比赛分析。",
    "cs2": "查询 CS2 完美、官匹与 5E 的玩家资料、近期比赛、统计和单场详情。",
    "deadlock": "查询 Deadlock 社区公开玩家资料、近期比赛、统计和单场详情。",
}
ROOT_FILES = (
    "__init__.py",
    "main.py",
    "metadata.yaml",
    "requirements.txt",
    "LICENSE",
    "README.md",
    "THIRD_PARTY_NOTICES.md",
    "ygl-plugin.json",
)
LOCAL_PROCESS_PATHS = {"agents.md", "docs/plan.md", "docs/collaboration.md"}
FORBIDDEN_IMPORTS = {
    "requests",
    "httpx",
    "socket",
    "aiohttp",
    "core",
    "services",
    "infra",
    "infrastructure",
    "adapters",
    "extensions",
    "astrbot",
}


def validate_public_paths(paths):
    for path in paths:
        normalized = str(path).replace("\\", "/").casefold()
        if (
            any(
                part
                in {
                    ".local-dev",
                    ".agent-workspace",
                    ".git",
                    "node_modules",
                    ".venv",
                    "venv",
                }
                for part in normalized.split("/")
            )
            or normalized in LOCAL_PROCESS_PATHS
        ):
            raise ValueError(f"local development material is not public input: {path}")


def validate_tracked_paths(root):
    tracked = subprocess.check_output(["git", "-C", str(root), "ls-files", "-z"])
    validate_public_paths(tracked.decode("utf-8").split("\0"))


def validate_version_declarations(files):
    """Check public version declarations without importing the plugin."""
    manifest = json.loads(files["packages/steam_dlc/yomihime.manifest.json"])
    version = manifest.get("package_version")
    if not isinstance(version, str) or not re.fullmatch(
        r"0\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?", version
    ):
        raise ValueError("manifest package version is invalid")
    if manifest.get("release") != version:
        raise ValueError("manifest release differs from package version")
    module_versions = [module.get("module_version") for module in manifest["modules"]]
    if not module_versions or any(item != version for item in module_versions):
        raise ValueError("manifest module versions differ from package version")

    main = ast.parse(files["main.py"], filename="main.py")
    registrations = []
    for node in ast.walk(main):
        if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            continue
        for decorator in node.decorator_list:
            if (
                isinstance(decorator, ast.Call)
                and isinstance(decorator.func, ast.Name)
                and decorator.func.id == "register"
            ):
                if len(decorator.args) >= 4 and isinstance(
                    decorator.args[3], ast.Constant
                ):
                    registrations.append(decorator.args[3].value)
    if registrations != [version]:
        raise ValueError(
            "plugin register version differs from manifest package version"
        )

    metadata = files["metadata.yaml"].decode("utf-8")
    metadata_versions = re.findall(r"(?m)^version:\s*['\"]?v?([^'\"\s]+)", metadata)
    if metadata_versions != [version]:
        raise ValueError("metadata version differs from manifest package version")
    readme = files["README.md"].decode("utf-8")
    if f"当前版本 `{version}`" not in readme:
        raise ValueError("README version differs from manifest package version")


def source_bytes(path, root):
    relative = path.relative_to(root).as_posix()
    validate_public_paths((relative,))
    for part in (path, *path.parents):
        if not part.is_relative_to(root):
            break
        info = part.lstat()
        if stat.S_ISLNK(info.st_mode) or getattr(info, "st_file_attributes", 0) & 0x400:
            raise ValueError(f"release source traverses a link: {relative}")
    if path.resolve(strict=True) != path.absolute():
        raise ValueError(f"release source traverses a link: {relative}")
    metadata = path.lstat()
    if not stat.S_ISREG(metadata.st_mode) or metadata.st_nlink > 1:
        raise ValueError(f"release source must be a regular file: {relative}")
    descriptor = os.open(path, os.O_RDONLY | getattr(os, "O_NOFOLLOW", 0))
    try:
        before = os.fstat(descriptor)
        if not stat.S_ISREG(before.st_mode) or before.st_nlink > 1:
            raise ValueError(f"release source must be a regular file: {relative}")
        with os.fdopen(descriptor, "rb", closefd=False) as stream:
            content = stream.read()

        def token(info):
            return (
                info.st_dev,
                info.st_ino,
                info.st_size,
                info.st_mtime_ns,
                info.st_nlink,
            )

        if (
            token(metadata) != token(before)
            or token(before) != token(os.fstat(descriptor))
            or token(before) != token(path.lstat())
        ):
            raise ValueError(f"release source changed during capture: {relative}")
        return content
    finally:
        os.close(descriptor)


def inventory(root):
    package = root / "packages/steam_dlc"
    manifest = json.loads(source_bytes(package / "yomihime.manifest.json", root))
    resources = {}
    for module in manifest["modules"]:
        declared = set()
        presentation = f"pages/dist/presentation-{module['module_id']}.js"
        for resource in module.get("resources", []):
            relative = resource["path"]
            page_resource = isinstance(relative, str) and relative in {
                f"pages/{module['module_id']}/entry.js",
                f"pages/{module['module_id']}/style.css",
            }
            logo_resource = relative == (
                f"{module['module_id']}/assets/{module['module_id']}.svg"
            )
            if (
                not isinstance(relative, str)
                or not (page_resource or logo_resource or relative == presentation)
                or relative.casefold() in resources
                or re.fullmatch(r"[0-9a-f]{64}", resource["sha256"]) is None
            ):
                raise ValueError("page resource is outside the release allowlist")
            resources[relative.casefold()] = resource["sha256"]
            declared.add(relative)
        pages = module.get("pages", [])
        referenced = {
            name for page in pages for name in (page["entry"], *page.get("styles", []))
        }
        if presentation in referenced:
            raise ValueError("presentation cannot be a business page resource")
        if presentation in declared:
            referenced.add(presentation)
        logo = module.get("display", {}).get("logo_resource")
        if logo is not None:
            if logo != f"{module['module_id']}/assets/{module['module_id']}.svg":
                raise ValueError("logo resource is outside the release allowlist")
            referenced.add(logo)
        if referenced != declared:
            raise ValueError("page resource declarations must match page references")
    files = [root / name for name in ROOT_FILES]
    files += [root / "packages/__init__.py", package / "yomihime.manifest.json"]
    if (package / "yomihime.source-policy.json").exists():
        files.append(package / "yomihime.source-policy.json")
    files += sorted(package.rglob("*.py"))
    files += [package / name for name in sorted(resources)]
    result = {}
    for path in files:
        relative = path.relative_to(root).as_posix()
        if "__pycache__" in path.parts:
            continue
        payload = source_bytes(path, root)
        resource_name = (
            path.relative_to(package).as_posix() if path.is_relative_to(package) else ""
        )
        if resource_name in resources and (
            len(payload) > 4 * 1024 * 1024
            or hashlib.sha256(payload).hexdigest() != resources[resource_name]
        ):
            raise ValueError(f"page resource bytes differ from manifest: {relative}")
        if path.suffix == ".py":
            tree = ast.parse(payload, filename=relative)
            if relative.startswith("packages/steam_dlc/"):
                for node in ast.walk(tree):
                    names = []
                    if isinstance(node, ast.Import):
                        names = [item.name.split(".")[0] for item in node.names]
                    elif isinstance(node, ast.ImportFrom) and not node.level:
                        names = [(node.module or "").split(".")[0]]
                    if FORBIDDEN_IMPORTS.intersection(names):
                        raise ValueError(f"module bypasses SDK boundary: {relative}")
        result[relative] = payload
    manifest = json.loads(result["packages/steam_dlc/yomihime.manifest.json"])
    if manifest["package_id"] != "steam_dlc" or manifest["contract_version"] != "2.0":
        raise ValueError("unsupported package identity")
    if {m["module_id"] for m in manifest["modules"]} != {
        "steam",
        "dota2",
        "cs2",
        "deadlock",
    }:
        raise ValueError("release must contain four modules")
    for module in manifest["modules"]:
        module_path = module["factory_entry"].split(":")[0].replace(".", "/") + ".py"
        if "packages/steam_dlc/" + module_path not in result:
            raise ValueError("factory is not contained in the captured package")
        validate_query_tools(module)
    if any(name.startswith("yomihime_game_link_sdk/") for name in result):
        raise ValueError("DLC must use the negotiated private Core facade")
    validate_version_declarations(result)
    return result


def validate_query_tools(module):
    module_id = module["module_id"]
    expected = {
        f"steam_dlc_{module_id}_{operation}": details
        for operation, details in QUERY_TOOLS[module_id].items()
    }
    tools = module["tools"]
    if len(tools) != len(expected) or {tool["name"] for tool in tools} != set(expected):
        raise ValueError("release exposes unsupported tools")
    model_tool_name = module.get("model_tool_name")
    model_tool_description = module.get("model_tool_description")
    if (model_tool_name is None) != (model_tool_description is None):
        raise ValueError("model tool name and description must be paired")
    if model_tool_name is None:
        raise ValueError("release requires one aggregate model tool per module")
    expected_actions = {
        f"steam_dlc_{module_id}_{operation}": operation
        for operation in QUERY_TOOLS[module_id]
    }
    actual_actions = {tool["name"]: tool.get("action") for tool in tools}
    if (
        model_tool_name != MODEL_TOOL_NAMES[module_id]
        or model_tool_description != MODEL_TOOL_DESCRIPTIONS[module_id]
        or actual_actions != expected_actions
        or len(set(actual_actions.values())) != len(actual_actions)
    ):
        raise ValueError("model tool declaration differs from the fixed mapping")
    capabilities = {item["capability_id"]: item for item in module["capabilities"]}
    for tool in tools:
        capability_id, required = expected[tool["name"]]
        capability = capabilities.get(capability_id)
        if (
            tool["capability_id"] != capability_id
            or capability is None
            or capability["effect"] != "read_only"
            or capability["invocation_policy"] != "natural_language_allowed"
            or required not in capability["input_schema"]["required"]
            or tool["parameter_mapping"].get(required) != required
            or any(
                item.get("capability_id") == "identity"
                for item in capability.get("required_capabilities", [])
                if isinstance(item, dict)
            )
        ):
            raise ValueError(
                "query tool requires an explicit public target and read-only capability"
            )


def build(
    root=ROOT,
    output=None,
    *,
    allow_dirty=False,
    signing_key=None,
    channel=None,
    sequence=None,
):
    root = Path(root).resolve(strict=True)
    validate_tracked_paths(root)
    files = inventory(root)
    version = json.loads(files["packages/steam_dlc/yomihime.manifest.json"])[
        "package_version"
    ]
    if not output:
        output = (
            root / f"dist/astrbot_plugin_yomihime_game_link_steam_dlc-v{version}.zip"
        )
    revision = subprocess.check_output(
        ["git", "-C", str(root), "rev-parse", "HEAD"], text=True
    ).strip()
    dirty = subprocess.check_output(
        ["git", "-C", str(root), "status", "--porcelain", "--untracked-files=normal"],
        text=True,
    ).strip()
    if dirty and not allow_dirty:
        raise ValueError("commit the reviewed source before a final release build")
    # No Core checkout or globally installed SDK is needed to build this ZIP.
    spec = spec_from_file_location(
        "dlc_release_envelope", Path(__file__).with_name("release_envelope.py")
    )
    module = module_from_spec(spec)
    spec.loader.exec_module(module)
    complete = module.complete

    payload = complete(
        files, root, "dlc", signing_key=signing_key, channel=channel, sequence=sequence
    )
    captured_sources = files
    with zipfile.ZipFile(BytesIO(payload)) as built:
        files = {name: built.read(name) for name in built.namelist()}
    output = Path(os.path.abspath(output))
    sums = output.parent / "SHA256SUMS"
    protected = {root / name for name in files}
    protected.update(Path(__file__).parent.glob("*.py"))
    if output == sums:
        raise ValueError("release outputs must be distinct")
    for destination in (output, sums):
        if destination in protected:
            raise ValueError("output overlaps release input")
        for component in (destination, *destination.parents):
            if component.is_symlink():
                raise ValueError("output traverses a link")
            if component.exists():
                info = component.lstat()
                if (
                    getattr(info, "st_file_attributes", 0) & 0x400
                    or info.st_nlink > 1
                    and stat.S_ISREG(info.st_mode)
                ):
                    raise ValueError("output traverses a link")
                if component == destination and not stat.S_ISREG(info.st_mode):
                    raise ValueError("output must be a regular file")
                if component != destination and not stat.S_ISDIR(info.st_mode):
                    raise ValueError("output parent must be a directory")
    reused = output.exists()
    if reused and output.read_bytes() != payload:
        raise ValueError("output already exists with different bytes")
    if inventory(root) != captured_sources:
        raise ValueError("DLC source changed before publication")
    output.parent.mkdir(parents=True, exist_ok=True)
    checksum = f"{hashlib.sha256(payload).hexdigest()}  {output.name}\n".encode("ascii")
    staged = []
    try:
        for destination, content in ((output, payload), (sums, checksum)):
            if destination == output and reused:
                continue
            fd, name = tempfile.mkstemp(prefix=".release-", dir=output.parent)
            temporary = Path(name)
            staged.append((temporary, destination))
            with os.fdopen(fd, "wb") as target:
                target.write(content)
        for temporary, destination in staged:
            temporary.replace(destination)
    finally:
        for temporary, _ in staged:
            temporary.unlink(missing_ok=True)
    report = {
        "path": str(output),
        "source_commit": revision,
        "dirty": bool(dirty),
        "bytes": len(payload),
        "members": len(files),
        "sha256": hashlib.sha256(payload).hexdigest(),
        "inspection": "passed",
        "reused": reused,
    }
    print(json.dumps(report, ensure_ascii=False))
    return output


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path)
    parser.add_argument(
        "--allow-dirty",
        action="store_true",
        help="interim local harness only; final packages require committed source",
    )
    signing = parser.add_mutually_exclusive_group()
    signing.add_argument(
        "--test-signing", action="store_true", help="legacy preview ZIP"
    )
    signing.add_argument("--signing-key", type=Path, help="legacy signed ZIP")
    parser.add_argument("--channel", choices=("preview", "stable"), help="legacy only")
    parser.add_argument("--sequence", type=int, help="legacy only")
    args = parser.parse_args()
    if args.test_signing and args.channel == "stable":
        parser.error("test signing is preview-only")
    if (args.channel is not None or args.sequence is not None) and not (
        args.test_signing or args.signing_key
    ):
        parser.error("--channel and --sequence require legacy signing")
    from release_envelope import signing_key

    build(
        output=args.output,
        allow_dirty=args.allow_dirty,
        signing_key=signing_key(args.signing_key, test=args.test_signing),
        channel=args.channel,
        sequence=args.sequence,
    )

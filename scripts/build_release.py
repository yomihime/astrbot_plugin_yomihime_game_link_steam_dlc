"""Build an explicit, deterministic AstrBot plugin ZIP without a second SDK."""

import argparse
import ast
import hashlib
import json
import re
import stat
import subprocess
import zipfile
from io import BytesIO
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SDK_VERSION = "0.1.0a15"
QUERY_TOOLS = {
    "steam": {
        "search": ("search", "query"),
        "app": ("app", "app_id"),
        **{
            name: (name + "_explicit", "account")
            for name in ("profile", "recent", "games")
        },
        "wall": ("wall_explicit", "account"),
    },
    "dota2": {
        name: (name + "_explicit", "match_id" if name == "match" else "account")
        for name in ("profile", "recent", "stats", "last", "match")
    },
    "deadlock": {
        name: (name + "_explicit", "match_id" if name == "match" else "account")
        for name in ("profile", "recent", "stats", "last", "match")
    },
    "cs2": {},
}
ROOT_FILES = (
    "__init__.py",
    "main.py",
    "metadata.yaml",
    "requirements.txt",
    "LICENSE",
    "README.md",
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
        if ".local-dev" in normalized.split("/") or normalized in LOCAL_PROCESS_PATHS:
            raise ValueError(f"local development material is not public input: {path}")


def validate_tracked_paths(root):
    tracked = subprocess.check_output(["git", "-C", str(root), "ls-files", "-z"])
    validate_public_paths(tracked.decode("utf-8").split("\0"))


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
    return path.read_bytes()


def inventory(root):
    package = root / "packages/steam_dlc"
    manifest = json.loads(source_bytes(package / "yomihime.manifest.json", root))
    resources = {}
    for module in manifest["modules"]:
        declared = set()
        for resource in module.get("resources", []):
            relative = resource["path"]
            if (
                not isinstance(relative, str)
                or re.fullmatch(
                    r"pages/(steam|dota2|cs2|deadlock)/(entry\.js|style\.css)",
                    relative,
                )
                is None
                or relative.split("/")[1] != module["module_id"]
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
        if referenced != declared:
            raise ValueError("page resource declarations must match page references")
    files = [root / name for name in ROOT_FILES]
    files += [root / "packages/__init__.py", package / "yomihime.manifest.json"]
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
        raise ValueError("release must reuse the canonical Core SDK")
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


def build(root=ROOT, output=None, *, allow_dirty=False):
    root = Path(root).resolve(strict=True)
    validate_tracked_paths(root)
    files = inventory(root)
    version = json.loads(files["packages/steam_dlc/yomihime.manifest.json"])[
        "package_version"
    ]
    revision = subprocess.check_output(
        ["git", "-C", str(root), "rev-parse", "HEAD"], text=True
    ).strip()
    dirty = subprocess.check_output(
        ["git", "-C", str(root), "status", "--porcelain", "--untracked-files=normal"],
        text=True,
    ).strip()
    if dirty and not allow_dirty:
        raise ValueError("commit the reviewed source before a final release build")
    receipt = {
        "source_commit": revision,
        "dirty": bool(dirty),
        "sdk_version": SDK_VERSION,
        "module_abi": "2.0",
        "bridge_version": 1,
        "files": {
            name: hashlib.sha256(payload).hexdigest()
            for name, payload in sorted(files.items())
        },
    }
    files["BUILD.json"] = (
        json.dumps(receipt, ensure_ascii=False, indent=2) + "\n"
    ).encode()
    stream = BytesIO()
    with zipfile.ZipFile(
        stream, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9
    ) as archive:
        for name, payload in sorted(files.items()):
            entry = zipfile.ZipInfo(name, (1980, 1, 1, 0, 0, 0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            entry.external_attr = (stat.S_IFREG | 0o644) << 16
            archive.writestr(entry, payload)
    payload = stream.getvalue()
    output = (
        Path(output)
        if output
        else root / f"dist/astrbot_plugin_yomihime_game_link_steam_dlc-v{version}.zip"
    )
    output = output.absolute()
    if output.is_symlink() or output.exists() and output.read_bytes() != payload:
        raise ValueError("output already exists with different bytes")
    for parent in output.parents:
        if parent.exists() and parent.resolve() != parent:
            raise ValueError("output traverses a link")
    output.parent.mkdir(parents=True, exist_ok=True)
    reused = output.exists()
    if not reused:
        with output.open("xb") as target:
            target.write(payload)
    with zipfile.ZipFile(output) as archive:
        if archive.testzip() is not None or set(archive.namelist()) != set(files):
            raise ValueError("built archive failed its content audit")
        for name, content in files.items():
            if archive.read(name) != content:
                raise ValueError("built archive source bytes differ")
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
    args = parser.parse_args()
    build(output=args.output, allow_dirty=args.allow_dirty)

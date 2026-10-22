"""Build an explicit, deterministic AstrBot plugin ZIP without a second SDK."""

import argparse
import ast
import hashlib
import json
import stat
import subprocess
import zipfile
from io import BytesIO
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SDK_VERSION = "0.1.0a12"
ROOT_FILES = ("__init__.py", "main.py", "metadata.yaml", "requirements.txt", "LICENSE", "README.md")
FORBIDDEN_IMPORTS = {"requests", "httpx", "socket", "aiohttp", "core", "services", "infra", "infrastructure", "adapters", "extensions", "astrbot"}


def inventory(root):
    package = root / "packages/steam_dlc"
    files = [root / name for name in ROOT_FILES]
    files += [root / "packages/__init__.py", package / "yomihime.manifest.json"]
    files += sorted(package.rglob("*.py"))
    result = {}
    for path in files:
        relative = path.relative_to(root).as_posix()
        if "__pycache__" in path.parts:
            continue
        if path.resolve(strict=True) != path.absolute():
            raise ValueError(f"release source traverses a link: {relative}")
        metadata = path.lstat()
        if not stat.S_ISREG(metadata.st_mode) or metadata.st_nlink > 1:
            raise ValueError(f"release source must be a regular file: {relative}")
        payload = path.read_bytes()
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
    if {m["module_id"] for m in manifest["modules"]} != {"steam", "dota2", "cs2", "deadlock"}:
        raise ValueError("release must contain four modules")
    for module in manifest["modules"]:
        module_path = module["factory_entry"].split(":")[0].replace(".", "/") + ".py"
        if "packages/steam_dlc/" + module_path not in result:
            raise ValueError("factory is not contained in the captured package")
        if module["module_id"] in {"steam", "cs2", "deadlock"} and module["tools"]:
            raise ValueError("release exposes unsupported tools")
    if any(name.startswith("yomihime_game_link_sdk/") for name in result):
        raise ValueError("release must reuse the canonical Core SDK")
    return result


def build(root=ROOT, output=None, *, allow_dirty=False):
    root = Path(root).resolve(strict=True)
    files = inventory(root)
    revision = subprocess.check_output(["git", "-C", str(root), "rev-parse", "HEAD"], text=True).strip()
    dirty = subprocess.check_output(["git", "-C", str(root), "status", "--porcelain", "--untracked-files=normal"], text=True).strip()
    if dirty and not allow_dirty:
        raise ValueError("commit the reviewed source before a final release build")
    receipt = {"source_commit": revision, "dirty": bool(dirty), "sdk_version": SDK_VERSION,
        "module_abi": "2.0", "bridge_version": 1,
        "files": {name: hashlib.sha256(payload).hexdigest() for name, payload in sorted(files.items())}}
    files["BUILD.json"] = (json.dumps(receipt, ensure_ascii=False, indent=2) + "\n").encode()
    stream = BytesIO()
    with zipfile.ZipFile(stream, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name, payload in sorted(files.items()):
            entry = zipfile.ZipInfo(name, (1980, 1, 1, 0, 0, 0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            entry.external_attr = (stat.S_IFREG | 0o644) << 16
            archive.writestr(entry, payload)
    payload = stream.getvalue()
    output = Path(output) if output else root / "dist/astrbot_plugin_yomihime_game_link_steam_dlc-v0.1.0-alpha.1.zip"
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
    report = {"path": str(output), "source_commit": revision, "dirty": bool(dirty), "bytes": len(payload),
        "members": len(files), "sha256": hashlib.sha256(payload).hexdigest(), "inspection": "passed", "reused": reused}
    print(json.dumps(report, ensure_ascii=False))
    return output


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--allow-dirty", action="store_true", help="interim local harness only; final packages require committed source")
    args = parser.parse_args()
    build(output=args.output, allow_dirty=args.allow_dirty)

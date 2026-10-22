"""Synchronize one page source into four disjoint, hash-pinned module scopes."""

import argparse
import hashlib
import json
import stat
from pathlib import Path

from build_release import ROOT, source_bytes

MODULES = {"steam": "Steam", "dota2": "Dota2", "cs2": "CS2", "deadlock": "Deadlock"}


def synchronize(root=ROOT, *, check=False):
    root = Path(root).resolve(strict=True)
    package = root / "packages/steam_dlc"
    sources = {
        name: source_bytes(package / "pages" / name, root)
        for name in ("entry.js", "style.css")
    }
    path = package / "yomihime.manifest.json"
    manifest = json.loads(source_bytes(path, root))
    if {module["module_id"] for module in manifest["modules"]} != set(MODULES):
        raise ValueError("expected exactly four DLC modules")
    drift = []
    for module in manifest["modules"]:
        module_id = module["module_id"]
        base = f"pages/{module_id}"
        for name, payload in sources.items():
            target = package / base / name
            if target.exists():
                current = source_bytes(target, root)
            else:
                current = None
            if current != payload:
                drift.append(target.relative_to(root).as_posix())
                if not check:
                    for parent in target.parents:
                        if not parent.is_relative_to(root):
                            break
                        if parent.exists() or parent.is_symlink():
                            info = parent.lstat()
                            if (
                                not stat.S_ISDIR(info.st_mode)
                                or getattr(info, "st_file_attributes", 0) & 0x400
                                or parent.resolve() != parent.absolute()
                            ):
                                raise ValueError(
                                    "page output parent must be a regular directory"
                                )
                    target.parent.mkdir(parents=True, exist_ok=True)
                    target.write_bytes(payload)
        common = {
            "entry": f"{base}/entry.js",
            "styles": [f"{base}/style.css"],
            "access": "public_web",
        }
        pages = [
            {
                "route_id": "home",
                "role": "home",
                "title": "帮助与状态",
                "order": 0,
                **common,
            },
            {
                "route_id": "settings",
                "role": "config",
                "title": "设置",
                "order": 10,
                "config_fields": (["timezone"] if module_id == "dota2" else [])
                + ["reply_theme"],
                **common,
            },
        ]
        resources = [
            {"path": f"{base}/{name}", "sha256": hashlib.sha256(payload).hexdigest()}
            for name, payload in sources.items()
        ]
        if module.get("pages") != pages or module.get("resources") != resources:
            drift.append(f"manifest:{module_id}")
            if not check:
                module["pages"] = pages
                module["resources"] = resources
    if drift and check:
        raise ValueError("page resource drift: " + ", ".join(drift))
    if not check:
        path.write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
    print(
        json.dumps(
            {
                "inspection": "passed",
                "mode": "check" if check else "sync",
                "changed": drift,
            }
        )
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    synchronize(check=parser.parse_args().check)

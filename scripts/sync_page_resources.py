"""Synchronize built page resources and styles into four hash-pinned scopes.

Run node scripts/build_pages.mjs first. This script never copies source modules
into production entries: each entry must be the externalized build output.
"""

import argparse
import hashlib
import json
import posixpath
import stat
from pathlib import Path

from build_release import ROOT, source_bytes

MODULES = {"steam": "Steam", "dota2": "Dota2", "cs2": "CS2", "deadlock": "Deadlock"}


def synchronize(root=ROOT, *, check=False):
    root = Path(root).resolve(strict=True)
    package = root / "packages/steam_dlc"
    style = source_bytes(package / "pages/style.css", root)
    path = package / "yomihime.manifest.json"
    manifest_bytes = source_bytes(path, root)
    manifest = json.loads(manifest_bytes)
    if {module["module_id"] for module in manifest["modules"]} != set(MODULES):
        raise ValueError("expected exactly four DLC modules")
    drift, writes = [], []
    for module in manifest["modules"]:
        module_id = module["module_id"]
        base = f"pages/{module_id}"
        sources = {
            "entry.js": source_bytes(package / base / "entry.js", root),
            "style.css": style,
        }
        # The digest changes a directory name, never projection depth.
        projected_entry = (
            f"module-assets/steam_dlc/{module_id}/pages/p{'0' * 64}/{base}/entry.js"
        )
        runtime_import = posixpath.relpath(
            "runtime.js", posixpath.dirname(projected_entry)
        )
        if runtime_import.encode("ascii") not in sources["entry.js"]:
            raise ValueError("page must be built against the external projection")
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
                    writes.append((target, payload))
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
                **(
                    {"capability_id": "wall_cache_status"}
                    if module_id == "steam"
                    else {"capability_id": "status"}
                ),
                **common,
            },
            {
                "route_id": "settings",
                "role": "config",
                "title": "设置",
                "order": 10,
                "config_fields": {
                    "steam": [
                        "reply_theme",
                        "poster_source",
                        "poster_mode",
                        "poster_preset",
                        "poster_aspect",
                        "poster_quality",
                        "poster_fit",
                        "poster_include_apps",
                        "poster_limit_mode",
                        "poster_limit",
                    ],
                    "dota2": [
                        "timezone",
                        "reply_theme",
                        "subscription_enabled",
                        "poll_interval_seconds",
                        "opendota_rph",
                        "commentary_enabled",
                    ],
                    "cs2": ["reply_theme", "default_platform"],
                    "deadlock": ["reply_theme"],
                }[module_id],
                "credential_fields": {
                    "steam": ["credential_steam_key"],
                    "dota2": ["credential_opendota_key"],
                    "cs2": ["credential_perfect", "credential_fivee"],
                    "deadlock": [],
                }[module_id],
                **common,
            },
        ]
        if module_id in {"steam", "cs2"}:
            pages.append(
                {
                    "route_id": "collage" if module_id == "steam" else "query",
                    "role": "aux",
                    "title": "游戏生涯拼图" if module_id == "steam" else "平台查询",
                    "order": 5,
                    "capability_id": "wall_preview"
                    if module_id == "steam"
                    else "query",
                    **common,
                }
            )
        page_resource_paths = {f"{base}/{name}" for name in sources}
        resources = [
            resource
            for resource in module.get("resources", [])
            if resource["path"] not in page_resource_paths
        ] + [
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
        if source_bytes(path, root) != manifest_bytes:
            raise ValueError("manifest changed during page resource synchronization")
        # Validate every module before mutating any output. A missed/invalid
        # build in a later module must leave all earlier styles untouched.
        for target, payload in writes:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(payload)
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

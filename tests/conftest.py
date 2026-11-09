"""Development-only binding to the actual Core SDK graph; never shipped in DLC."""

import importlib
import importlib.util
import os
import sys
from pathlib import Path

CORE = Path(
    os.environ.get(
        "YGL_CORE_ROOT", Path(__file__).resolve().parents[2] / "ff14-news-cloud"
    )
).resolve()
spec = importlib.util.spec_from_file_location(
    "sl07_core", CORE / "__init__.py", submodule_search_locations=[str(CORE)]
)
assert spec is not None and spec.loader is not None
package = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = package
spec.loader.exec_module(package)
api = importlib.import_module("sl07_core.yomihime_game_link_sdk")
sys.modules["yomihime_game_link_sdk"] = api  # Existing tests assert canonical DTOs.
sys.modules["packages.steam_dlc._api_v2"] = api
for name in (
    "cards",
    "contexts",
    "declarations",
    "display",
    "errors",
    "host",
    "jobs",
    "results",
    "services",
    "storage",
    "subscriptions",
    "version",
):
    module = importlib.import_module(f"sl07_core.yomihime_game_link_sdk.{name}")
    sys.modules[f"yomihime_game_link_sdk.{name}"] = module
    sys.modules[f"packages.steam_dlc._api_v2.{name}"] = module

# Existing consumer fixtures load the same checkout under these private names.
# Bind their SDK imports to the same graph before those fixtures load Core code.
for namespace in (
    "ygl_test_subject",
    "steam_dlc_frozen_core_test",
    "dlc_dota_frozen_core",
):
    sys.modules[namespace] = package
    sys.modules[f"{namespace}.yomihime_game_link_sdk"] = api
    for name in (
        "cards",
        "contexts",
        "declarations",
        "display",
        "errors",
        "host",
        "jobs",
        "results",
        "services",
        "storage",
        "subscriptions",
        "version",
    ):
        sys.modules[f"{namespace}.yomihime_game_link_sdk.{name}"] = sys.modules[
            f"sl07_core.yomihime_game_link_sdk.{name}"
        ]

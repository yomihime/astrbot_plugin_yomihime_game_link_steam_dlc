"""Model-tool declaration coverage independent of a running AstrBot instance."""

import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "packages/steam_dlc/yomihime.manifest.json"
MODEL_TOOL_DOC = ROOT / "docs/model-tools.md"
EXPECTED = {
    "steam": {
        "aggregate": "steam_dlc_steam",
        "tools": {
            "steam_dlc_steam_search": ("search", "search"),
            "steam_dlc_steam_app": ("app", "app"),
            "steam_dlc_steam_profile": ("profile", "profile_explicit"),
            "steam_dlc_steam_recent": ("recent", "recent_explicit"),
            "steam_dlc_steam_games": ("games", "games_explicit"),
            "steam_dlc_steam_wall": ("wall", "wall_explicit"),
            "steam_dlc_steam_wishlist": ("wishlist", "wishlist_explicit"),
        },
    },
    "dota2": {
        "aggregate": "steam_dlc_dota2",
        "tools": {
            "steam_dlc_dota2_recent": ("recent", "recent_explicit"),
            "steam_dlc_dota2_profile": ("profile", "profile_explicit"),
            "steam_dlc_dota2_match": ("match", "match_explicit"),
            "steam_dlc_dota2_stats": ("stats", "stats_explicit"),
            "steam_dlc_dota2_last": ("last", "last_explicit"),
            "steam_dlc_dota2_analyze": ("analyze", "analyze_explicit"),
        },
    },
    "cs2": {
        "aggregate": "steam_dlc_cs2",
        "tools": {
            "steam_dlc_cs2_profile": ("profile", "profile_explicit"),
            "steam_dlc_cs2_recent": ("recent", "recent_explicit"),
            "steam_dlc_cs2_stats": ("stats", "stats_explicit"),
            "steam_dlc_cs2_last": ("last", "last_explicit"),
            "steam_dlc_cs2_match": ("match", "match_explicit"),
        },
    },
    "deadlock": {
        "aggregate": "steam_dlc_deadlock",
        "tools": {
            "steam_dlc_deadlock_profile": ("profile", "profile_explicit"),
            "steam_dlc_deadlock_recent": ("recent", "recent_explicit"),
            "steam_dlc_deadlock_stats": ("stats", "stats_explicit"),
            "steam_dlc_deadlock_last": ("last", "last_explicit"),
            "steam_dlc_deadlock_match": ("match", "match_explicit"),
        },
    },
}


class ModelToolManifestTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest = json.loads(MANIFEST.read_bytes())

    def test_all_modules_have_one_aggregate_with_exact_legacy_action_mapping(self):
        modules = {module["module_id"]: module for module in self.manifest["modules"]}
        self.assertEqual(set(modules), set(EXPECTED))
        for module_id, expected in EXPECTED.items():
            with self.subTest(module=module_id):
                module = modules[module_id]
                self.assertEqual(module["model_tool_name"], expected["aggregate"])
                self.assertTrue(module["model_tool_description"].strip())
                actual = {
                    tool["name"]: (tool["action"], tool["capability_id"])
                    for tool in module["tools"]
                }
                self.assertEqual(actual, expected["tools"])
                actions = [tool["action"] for tool in module["tools"]]
                self.assertEqual(len(set(actions)), len(actions))

    def test_fixed_mapping_catalog_matches_legacy_declarations_and_user_docs(self):
        documented = MODEL_TOOL_DOC.read_text(encoding="utf-8")
        modules = {module["module_id"]: module for module in self.manifest["modules"]}
        self.assertEqual(set(modules), set(EXPECTED))
        for module_id, expected in EXPECTED.items():
            with self.subTest(module=module_id):
                module = modules[module_id]
                legacy = {
                    tool["name"]: (tool.get("action"), tool["capability_id"])
                    for tool in module["tools"]
                }
                self.assertEqual(set(legacy), set(expected["tools"]))
                self.assertIn(f"`{expected['aggregate']}`", documented)
                for name, (action, capability_id) in expected["tools"].items():
                    self.assertEqual(legacy[name][1], capability_id)
                    if legacy[name][0] is not None:
                        self.assertEqual(legacy[name][0], action)
                    row = f"`{action}` | `{name}` | `{capability_id}`"
                    self.assertIn(row, documented)

        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        self.assertIn("`full`", readme)
        self.assertIn("`skills_like`", readme)
        self.assertIn("canonical SDK `0.1.0a23`", readme)

    def test_cs2_and_deadlock_action_help_survives_top_level_description_removal(self):
        modules = {module["module_id"]: module for module in self.manifest["modules"]}
        cs2 = {tool["action"]: tool["description"] for tool in modules["cs2"]["tools"]}
        self.assertEqual(len(set(cs2.values())), len(cs2))
        for action in ("profile", "recent", "stats", "last"):
            with self.subTest(module="cs2", action=action):
                self.assertIn("account", cs2[action])
                self.assertIn("省略时使用配置默认", cs2[action])
                self.assertNotIn("match 必须", cs2[action])
        self.assertIn("match_id", cs2["match"])
        self.assertIn("official/5e 还需 account", cs2["match"])

        deadlock = {
            tool["action"]: tool["description"] for tool in modules["deadlock"]["tools"]
        }
        self.assertEqual(len(set(deadlock.values())), len(deadlock))
        for action in ("profile", "recent", "stats", "last"):
            with self.subTest(module="deadlock", action=action):
                self.assertIn("account", deadlock[action])
        self.assertIn("match_id", deadlock["match"])
        self.assertIn("account 可选", deadlock["match"])


if __name__ == "__main__":
    unittest.main()

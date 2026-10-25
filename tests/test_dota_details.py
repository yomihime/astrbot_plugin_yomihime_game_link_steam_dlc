"""Basic response details use exact IDs and distinguish zero from absence."""

import unittest

from packages.steam_dlc.dota2.labels import mode_label, rank_label
from packages.steam_dlc.dota2.normalization import normalize_match


class TestDotaDetails(unittest.TestCase):
    def test_optional_fields_zero_slots_and_literal_names(self):
        payload = {
            "radiant_win": True,
            "players": [
                {
                    "account_id": 123,
                    "player_slot": 0,
                    "hero_id": 1,
                    "personaname": "<b>literal & name</b>",
                    "name": "pro tag",
                    "level": 0,
                    "gold_per_min": 0,
                    "xp_per_min": 0,
                    "last_hits": 0,
                    "denies": 0,
                    "hero_damage": 0,
                    "tower_damage": 0,
                    "hero_healing": 0,
                    "item_0": 0,
                    "item_1": 42,
                    "item_2": None,
                    "item_3": -1,
                    "item_4": True,
                    "item_5": "7",
                    "backpack_0": 0,
                    "backpack_1": 9,
                    "backpack_2": None,
                    "item_neutral": 0,
                },
                {"account_id": None, "player_slot": 128},
            ],
        }
        result = normalize_match(payload, "12345")
        player, anonymous = result.players
        self.assertEqual(player.account_id32, 123)
        self.assertEqual(player.name, "<b>literal & name</b>")
        for field in (
            "level",
            "gold_per_min",
            "xp_per_min",
            "last_hits",
            "denies",
            "hero_damage",
            "tower_damage",
            "hero_healing",
            "neutral_item",
        ):
            self.assertEqual(getattr(player, field), 0)
            self.assertIsNone(getattr(anonymous, field))
        self.assertEqual(player.items, (0, 42, None, None, None, 7))
        self.assertEqual(player.backpack, (0, 9, None))
        self.assertEqual(anonymous.items, (None,) * 6)
        self.assertEqual(anonymous.backpack, (None,) * 3)
        self.assertEqual((player.outcome, anonymous.outcome), ("win", "loss"))

    def test_name_cannot_select_identity_and_bad_fields_remain_missing(self):
        players = [
            {
                "account_id": "123",
                "player_slot": 4,
                "personaname": "same",
                "level": 31,
                "gold_per_min": "700",
                "item_0": 0,
            },
            {"account_id": 456, "player_slot": 132, "personaname": "same"},
            {
                "account_id": 0,
                "player_slot": 127,
                "personaname": "same",
                "name": "fallback",
                "level": True,
                "hero_damage": -1,
            },
            {
                "account_id": 1 << 32,
                "player_slot": 5,
                "personaname": "bad\nname",
                "name": "safe tag",
            },
            {"account_id": True, "personaname": "x" * 81},
        ]
        result = normalize_match({"players": players}, "999")
        self.assertEqual(
            [p.account_id32 for p in result.players], [123, 456, None, None, None]
        )
        self.assertEqual(
            [p.player_slot for p in result.players], [4, 132, None, None, None]
        )
        self.assertEqual(result.players[0].gold_per_min, 700)
        self.assertIsNone(result.players[2].level)
        self.assertIsNone(result.players[2].hero_damage)
        self.assertEqual(result.players[3].name, "safe tag")
        self.assertIsNone(result.players[4].name)
        # Names/heroes cannot turn anonymous rows into account matches.
        self.assertEqual([p for p in result.players if p.account_id32 == 789], [])
        self.assertEqual(len([p for p in result.players if p.account_id32 == 123]), 1)

    def test_old_basic_response_and_bound(self):
        summary = normalize_match({"players": [{"account_id": 123, "kills": 0}]}, "9")
        player = summary.players[0]
        self.assertEqual(player.kills, 0)
        self.assertIsNone(player.level)
        self.assertEqual(player.items, (None,) * 6)
        self.assertEqual(normalize_match({}, "9").players, ())
        self.assertEqual(len(normalize_match({"players": [{}] * 100}, "9").players), 10)

    def test_rank_and_mode_finite_labels(self):
        self.assertIn("Herald", rank_label(11))
        self.assertIn("1 星", rank_label(11))
        self.assertIn("Divine", rank_label(75))
        self.assertIn("5 星", rank_label(75))
        self.assertIn("Immortal", rank_label(80))
        self.assertNotIn("星", rank_label(80))
        self.assertIn("Uncalibrated", rank_label(0))
        for rank in (10, 16, 81, 99, -1):
            self.assertIn(str(rank), rank_label(rank))
            self.assertIn("未知", rank_label(rank))
        self.assertEqual(rank_label(None), "未知段位")
        self.assertEqual(rank_label(True), "未知段位")
        self.assertIn("Turbo", mode_label(23))
        self.assertIn("All Draft", mode_label(22))
        self.assertIn("999", mode_label(999))
        self.assertIn("未知", mode_label(0))
        self.assertEqual(mode_label(None), "未知模式")


if __name__ == "__main__":
    unittest.main()

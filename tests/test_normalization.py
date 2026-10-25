import json
import unittest
from pathlib import Path

from packages.steam_dlc.dota2.normalization import (
    normalize_match,
    normalize_profile,
    normalize_recent,
)

FIXTURES = Path(__file__).parent / "fixtures"


def fixture(name):
    return json.loads((FIXTURES / name).read_text(encoding="utf-8"))


class DotaNormalizationTests(unittest.TestCase):
    def test_recent_preserves_zero_turbo_and_unknown_outcomes(self):
        recent = normalize_recent(fixture("dota_recent.json"), limit=5)
        self.assertEqual(len(recent), 5)
        self.assertEqual(
            (recent[0].start_time, recent[0].hero_id, recent[0].kills), (0, 0, 0)
        )
        self.assertEqual(recent[0].outcome, "win")
        self.assertEqual(recent[1].outcome, "win")
        self.assertEqual(recent[2].outcome, "unknown")
        self.assertEqual(recent[3].outcome, "unknown")
        self.assertEqual(recent[4].outcome, "loss")
        self.assertEqual(recent[1].hero_id, None)

    def test_recent_is_bounded_and_rejects_bad_top_level(self):
        rows = [{"match_id": i + 1} for i in range(25)]
        self.assertEqual(len(normalize_recent(rows)), 5)
        self.assertEqual(len(normalize_recent(rows, limit=20)), 20)
        for payload in ({}, None, "not a list"):
            with self.subTest(payload=payload), self.assertRaises(ValueError):
                normalize_recent(payload)
        for limit in (0, 21, True, 1.5):
            with self.subTest(limit=limit), self.assertRaises(ValueError):
                normalize_recent([], limit=limit)

    def test_profile_has_bounded_fields_and_only_trusted_https_homepage(self):
        profile = normalize_profile(fixture("dota_profile.json"), 123)
        self.assertEqual(profile.account_id32, 123)
        self.assertEqual(profile.steam_id64, "76561197960265851")
        self.assertEqual(profile.rank_tier, 0)
        self.assertIsNone(profile.leaderboard_rank)
        self.assertEqual(profile.name, "Fixture Player")
        malicious = {
            "profile": {
                "personaname": "x" * 81,
                "steamid": "76561197960265851",
                "profileurl": "https://user@steamcommunity.com/profiles/76561197960265851",
            }
        }
        result = normalize_profile(malicious, 123)
        self.assertIsNone(result.name)
        self.assertIsNone(result.profile_url)

    def test_match_caps_players_and_keeps_anonymous_and_zero_distinct(self):
        match = normalize_match(fixture("dota_match.json"), "9000000001")
        self.assertEqual(match.start_time, 0)
        self.assertEqual(match.duration, 0)
        self.assertEqual(len(match.players), 3)
        self.assertEqual(match.players[0].account_id32, 123)
        self.assertEqual(match.players[0].kills, 0)
        self.assertEqual(match.players[0].outcome, "loss")
        self.assertIsNone(match.players[1].account_id32)
        self.assertEqual(match.players[1].outcome, "win")
        self.assertIsNone(match.players[2].player_slot)
        self.assertEqual(match.players[2].outcome, "unknown")
        payload = {"players": [{"account_id": 1, "player_slot": 0}] * 20}
        self.assertEqual(len(normalize_match(payload, "123").players), 10)

    def test_match_rejects_malformed_top_level_and_identifier(self):
        with self.assertRaises(ValueError):
            normalize_match([], "123")
        with self.assertRaises(ValueError):
            normalize_match({"players": {}}, "123")
        for match_id in ("0", "../12", "9000000000000000000000000"):
            with self.subTest(match_id=match_id), self.assertRaises(ValueError):
                normalize_match({}, match_id)


if __name__ == "__main__":
    unittest.main()

"""Upstream identities must agree with the requested public identity."""

import unittest

from packages.steam_dlc.dota2.cache_validation import valid_projection
from packages.steam_dlc.dota2.normalization import normalize_match, normalize_profile
from packages.steam_dlc.shared.steam_ids import steam_id64_from_account


class DotaIdentityIntegrityTests(unittest.TestCase):
    def test_cached_profile_must_preserve_the_same_identity(self):
        profile = {
            "account_id32": "123",
            "name": "player",
            "steam_id64": steam_id64_from_account(456),
            "profile_url": None,
            "rank_tier": None,
            "leaderboard_rank": None,
        }
        self.assertFalse(
            valid_projection(
                "profile", {"account_id32": "123", "profile": profile}, 123, None, None
            )
        )
        profile["steam_id64"] = steam_id64_from_account(123)
        self.assertTrue(
            valid_projection(
                "profile", {"account_id32": "123", "profile": profile}, 123, None, None
            )
        )

    def test_profile_rejects_conflicting_account_steam_and_url(self):
        variants = (
            {"account_id": 456},
            {"profile": {"account_id": 456}},
            {"profile": {"steamid": steam_id64_from_account(456)}},
            {"profile": {"steamid": "invalid"}},
            {"profile": {"profileurl": "https://www.opendota.com/players/456"}},
            {
                "profile": {
                    "profileurl": "https://steamcommunity.com/profiles/"
                    + steam_id64_from_account(456)
                }
            },
            {"profile": {"account_id": True}},
        )
        for payload in variants:
            with self.subTest(payload=payload), self.assertRaises(ValueError):
                normalize_profile(payload, 123)

    def test_optional_missing_identity_does_not_become_a_conflict(self):
        profile = normalize_profile({"profile": {"personaname": "Public player"}}, 123)
        self.assertEqual(profile.account_id32, 123)
        self.assertIsNone(profile.steam_id64)
        self.assertEqual(normalize_match({"duration": 300}, "12").match_id, "12")

    def test_matching_identities_accept_numeric_and_text_account(self):
        steam = steam_id64_from_account(123)
        profile = normalize_profile(
            {
                "account_id": "123",
                "profile": {
                    "account_id": 123,
                    "steamid": steam,
                    "profileurl": f"https://steamcommunity.com/profiles/{steam}",
                },
            },
            123,
        )
        self.assertEqual(profile.steam_id64, steam)
        self.assertEqual(normalize_match({"match_id": 12}, "12").match_id, "12")

    def test_match_rejects_conflicting_or_malformed_present_id(self):
        for value in (13, "13", True, "bad", 0):
            with self.subTest(value=value), self.assertRaises(ValueError):
                normalize_match({"match_id": value}, "12")

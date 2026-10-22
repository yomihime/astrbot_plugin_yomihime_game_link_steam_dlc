import unittest

from packages.steam_dlc.shared.steam_ids import (
    account_id32,
    parse_dota_account,
    parse_steam_id,
    steam_id64_from_account,
)


class SteamIdTests(unittest.TestCase):
    def test_round_trip_preserves_decimal_string(self):
        steam_id = "76561197960265851"
        self.assertEqual(parse_steam_id(steam_id), steam_id)
        self.assertEqual(account_id32(steam_id), 123)
        self.assertEqual(steam_id64_from_account("123"), steam_id)
        self.assertEqual(parse_dota_account(steam_id), 123)

    def test_accepts_only_strict_profiles_url(self):
        self.assertEqual(
            parse_steam_id("https://steamcommunity.com/profiles/76561197960265851"),
            "76561197960265851",
        )
        for url in (
            "https://evil.example/profiles/76561197960265851",
            "https://user@steamcommunity.com/profiles/76561197960265851",
            "https://steamcommunity.com:444/profiles/76561197960265851",
            "https://steamcommunity.com/profiles/76561197960265851/extra",
            "https://steamcommunity.com/id/76561197960265851",
            "http://steamcommunity.com/profiles/76561197960265851",
        ):
            with self.subTest(url=url), self.assertRaises(ValueError):
                parse_steam_id(url)

    def test_rejects_non_individual_or_noncanonical_values(self):
        for value in (
            "76561197960265728",
            "76561197960265729 ",
            "076561197960265729",
            "76561197960265729.0",
            "18446744073709551616",
            "76561197960265729x",
        ):
            with self.subTest(value=value), self.assertRaises(ValueError):
                parse_steam_id(value)
        for value in (True, 0, -1, "0", "01", 1.0):
            with self.subTest(account=value), self.assertRaises(ValueError):
                steam_id64_from_account(value)

    def test_dota_account_rejects_bool_and_out_of_range(self):
        for value in (True, False, 0, "0001", "abc", 1 << 32):
            with self.subTest(value=value), self.assertRaises(ValueError):
                parse_dota_account(value)


if __name__ == "__main__":
    unittest.main()

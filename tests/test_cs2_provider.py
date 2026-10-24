"""Synthetic, minimized fixtures derived from the pinned source field names."""

import json
import unittest
from copy import deepcopy

from yomihime_game_link_sdk.errors import SourceHttpError
from yomihime_game_link_sdk.services import HttpResponse

from packages.steam_dlc.cs2.contracts import (
    SchemaError,
    account_id,
    game_id,
    match_request,
    profile_request,
    recent_request,
    season_value,
)
from packages.steam_dlc.cs2.normalization import (
    normalize_match,
    normalize_profile,
    normalize_recent,
)
from packages.steam_dlc.cs2.provider import PlatformProvider, ProviderError

PLAYER = "76561197960265851"
OTHER = "76561197960265852"
DOMAIN = "synthetic-player"
GAME = "PVP@10001"


def profile(platform="perfect"):
    return {
        "steamId": PLAYER,
        "seasonId": "S16",
        "name": "Synthetic",
        "nickName": "Synthetic official",
        "pvpRank": 8,
        "rank": 12,
        "pvpScore": 1800,
        "cnt": 0,
        "rating": 1.2,
    }


def summary(game=GAME, source=3):
    return {
        "matchId": game,
        "playerId": PLAYER,
        "dataSource": source,
        "mapName": "Synthetic map",
        "endTime": "2026-01-02 00:00:00",
        "score1": 13,
        "score2": 5,
        "kill": 0,
        "rating": 1.2,
        "team": 1,
        "winTeam": 1,
    }


def fivee_home():
    return {
        "user": {"domain": DOMAIN, "username": "Synthetic 5E"},
        "career_data": {"match_total": "10", "rating": "1.25"},
        "season_data": {
            "now_season_v1": "2026 S5",
            "season_list": [{"match_type": 9, "level_name": "A+", "elo": "1800"}],
        },
        "match_data": [
            {
                "match_id": "fivee-10001",
                "kill": "0",
                "death": "12",
                "assist": "3",
                "end_time": "1767312000",
                "rating": "1.1",
                "group1_all_score": "13",
                "group2_all_score": "5",
                "is_win": "1",
                "season": "2026s5",
                "map": "de_synthetic",
            }
        ],
    }


def full_match():
    return {
        "base": {"matchId": GAME, "mapEn": "de_synthetic", "score1": 13},
        "players": [{"playerId": PLAYER, "nickName": "Synthetic", "kill": 0}],
    }


class Http:
    def __init__(self, data, platform="perfect"):
        self.data, self.platform = data, platform
        self.calls = []
        self.error = None

    async def fetch(self, request):
        self.calls.append(request)
        if self.error:
            raise self.error
        data = (
            self.data[request.path]
            if callable(getattr(self.data, "get", None)) and request.path in self.data
            else self.data
        )
        wrapper = (
            {"success": True, "errcode": 0}
            if self.platform == "5e"
            else {"statusCode": 0}
        )
        return HttpResponse(200, {}, json.dumps({**wrapper, "data": data}).encode())


class ContractTests(unittest.TestCase):
    def test_exact_public_request_fields_and_no_secret_placeholders(self):
        request = profile_request("perfect", PLAYER, season="16")
        self.assertEqual(request.source_id, "perfect_api")
        self.assertEqual(
            json.loads(request.body), {"toSteamId": PLAYER, "csgoSeasonId": "S16"}
        )
        for platform, source in (("perfect", 3), ("official", 1)):
            request = recent_request(platform, PLAYER)
            self.assertEqual(json.loads(request.body)["dataSource"], source)
            self.assertNotIn("mySteamId", json.loads(request.body))
            self.assertNotIn("token", request.headers)
        self.assertEqual(
            json.loads(match_request("perfect", GAME).body)["dataSource"], 3
        )
        with self.assertRaises(ValueError):
            match_request("official", GAME)

    def test_source_identity_validation_and_old_uuid_migration(self):
        self.assertEqual(account_id(DOMAIN, "5e"), DOMAIN)
        self.assertEqual(season_value("2026 S5", "5e"), "2026S5")
        for value in ("../x", "https://example.invalid", "a?x=1", "a%2fb", True):
            with self.subTest(value=value), self.assertRaises(ValueError):
                account_id(value, "5e")
        with self.assertRaisesRegex(ValueError, "Legacy"):
            game_id("00000000-0000-4000-8000-000000000001")

    def test_source_ranks_nulls_and_zero_are_distinct(self):
        perfect = normalize_profile(profile(), PLAYER)
        official = normalize_profile(profile(), PLAYER, platform="official")
        fivee = normalize_profile(fivee_home(), DOMAIN, platform="5e")
        self.assertEqual(perfect["data"]["metrics"]["matches"], 0)
        self.assertIsNone(perfect["data"]["metrics"]["adr"])
        self.assertEqual(perfect["field_availability"]["metrics"]["adr"], "unknown")
        self.assertEqual(perfect["data"]["rank"]["value"], 8)
        self.assertEqual(official["data"]["rank"]["value"], 12)
        self.assertEqual(fivee["data"]["rank"]["value"], "A+")
        self.assertIsNone(fivee["data"]["steam_id64"])
        self.assertEqual(fivee["target"]["id_type"], "fivee_domain")

    def test_profile_identity_and_season_mismatch_fail_closed(self):
        for data, target, platform in (
            (profile(), OTHER, "perfect"),
            (fivee_home(), "other", "5e"),
        ):
            with self.assertRaises(SchemaError):
                normalize_profile(data, target, platform=platform)
        with self.assertRaises(SchemaError):
            normalize_profile(profile(), PLAYER, season="S17")

    def test_recent_source_identity_privacy_dedup_and_order(self):
        newer = summary("PVP@10002")
        newer["endTime"] = "2026-01-03 00:00:00"
        data = {"dataPublic": True, "matchList": [summary(), newer, summary()]}
        recent = normalize_recent(data, PLAYER, limit=1)
        self.assertEqual(recent["data"]["available_matches"], 2)
        self.assertEqual(recent["data"]["matches"][0]["match_id"], "PVP@10002")
        for changed in (
            {"dataPublic": False, "matchList": []},
            {"matchList": [summary(source=1)]},
            {"matchList": [{**summary(), "playerId": OTHER}]},
            {"matchList": [summary(), {**summary(), "kill": 99}]},
        ):
            with self.subTest(changed=changed), self.assertRaises(SchemaError):
                normalize_recent(changed, PLAYER)

    def test_full_match_validates_match_and_roster_identity(self):
        result = normalize_match(full_match(), GAME, focus=PLAYER)
        self.assertEqual(result["data"]["focus"]["kills"], 0)
        self.assertIsNone(result["data"]["focus"]["deaths"])
        self.assertEqual(result["detail_level"], "full_match")
        for changed in (
            {**full_match(), "base": {"matchId": "PVP@wrong"}},
            {**full_match(), "players": full_match()["players"] * 2},
            {**full_match(), "players": [{"playerId": "wrong"}]},
        ):
            with self.assertRaises(SchemaError):
                normalize_match(changed, GAME, focus=PLAYER)
        with self.assertRaises(SchemaError):
            normalize_match(full_match(), GAME, focus=OTHER)


class ProviderTests(unittest.IsolatedAsyncioTestCase):
    async def test_perfect_end_to_end_mock_slice_and_invocation_dedup(self):
        http = Http(
            {
                "/api/csgo/home/pvp/detailStats": profile(),
                "/api/csgo/home/match/list": {
                    "dataPublic": True,
                    "matchList": [summary()],
                },
                "/api/v1/csgo/match": full_match(),
            }
        )
        provider = PlatformProvider(http)
        self.assertEqual((await provider.profile(PLAYER))["platform"], "perfect")
        self.assertEqual(
            (await provider.last(PLAYER))["data"]["focus"]["account_id"], PLAYER
        )
        self.assertEqual((await provider.stats(PLAYER))["kind"], "stats")
        self.assertEqual(len(http.calls), 3)

    async def test_fivee_bounded_match_stats_and_no_implicit_steam_mapping(self):
        http = Http(
            {
                f"/v0/mars/api/csgo/data/player_home/{DOMAIN}": fivee_home(),
                f"/v0/mars/api/csgo/data/player_match_v1/{DOMAIN}": {
                    "match_detail": {"match_total": "5", "rating": "1.1"}
                },
            },
            "5e",
        )
        provider = PlatformProvider(http, "5e")
        last = await provider.last(DOMAIN)
        self.assertEqual(last["detail_level"], "player_summary")
        self.assertEqual(last["coverage"], "recent_player_summary")
        self.assertEqual(last["unavailable_reason"], "full_match_detail_unavailable")
        self.assertIsNone(last["data"]["players"])
        stats = await provider.stats(DOMAIN)
        self.assertEqual(stats["season"], "2026S5")
        self.assertEqual(stats["data"]["metrics"]["matches"], 5)
        self.assertEqual(len(http.calls), 2)
        with self.assertRaisesRegex(ProviderError, "match_not_in_recent_sample"):
            await provider.match("fivee-missing", target=DOMAIN)
        with self.assertRaises(ValueError):
            await provider.match("fivee-10001")

    async def test_official_last_remains_bounded_summary(self):
        http = Http({"dataPublic": True, "matchList": [summary(source=1)]})
        result = await PlatformProvider(http, "official").last(PLAYER)
        self.assertEqual(result["platform"], "official")
        self.assertEqual(result["detail_level"], "player_summary")
        self.assertEqual(len(http.calls), 1)

    async def test_http_errors_preserve_retry_and_omit_raw_error_details(self):
        http = Http(profile())
        http.error = SourceHttpError(
            "rate_limited", status_code=429, retry_after_seconds=12
        )
        with self.assertRaises(ProviderError) as caught:
            await PlatformProvider(http).profile(PLAYER)
        self.assertEqual(caught.exception.code, "rate_limited")
        self.assertEqual(caught.exception.retry_after_seconds, 12)
        self.assertNotIn(PLAYER, str(caught.exception))

    async def test_bad_success_envelope_and_wrong_identity_are_rejected(self):
        data = deepcopy(profile())
        data["steamId"] = OTHER
        with self.assertRaisesRegex(ProviderError, "schema_changed"):
            await PlatformProvider(Http(data)).profile(PLAYER)

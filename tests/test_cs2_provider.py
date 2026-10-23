"""Synthetic data only. Never capture real Leetify API payloads here."""

import asyncio
import json
import unittest

from yomihime_game_link_sdk.errors import SourceHttpError
from yomihime_game_link_sdk.services import HttpResponse

from packages.steam_dlc.cs2.contracts import (
    SchemaError,
    normalize_match,
    normalize_profile,
)
from packages.steam_dlc.cs2.provider import LeetifyProvider, ProviderError

PLAYER = "76561197960265851"
OTHER = "76561197960265852"
GAME = "00000000-0000-4000-8000-000000000001"
OLDER = "00000000-0000-4000-8000-000000000002"


def match(game=GAME, finished="2026-01-02T00:00:00Z"):
    return {
        "id": game,
        "finished_at": finished,
        "map_name": "de_synthetic",
        "data_source": "synthetic_test",
        "team_scores": [{"team_number": 2, "score": 13}],
        "stats": [
            {
                "steam64_id": PLAYER,
                "name": "Synthetic Player",
                "total_kills": 0,
                "leetify_rating": 0.015,
                "reaction_time": 0.4,
            }
        ],
    }


def profile():
    return {
        "steam64_id": PLAYER,
        "name": "Synthetic Player",
        "privacy_mode": "public",
        "ranks": {
            "premier": 15000,
            "faceit": 8,
            "faceit_elo": None,
            "leetify": 2.1,
            "competitive": [{"map_name": "de_synthetic", "rank": 12}],
        },
        "rating": {"aim": 55.5},
        "stats": {"reaction_time_ms": 400},
    }


class Http:
    def __init__(self):
        self.calls = []
        self.error = None
        self.payloads = {
            "/v3/profile": profile(),
            "/v3/profile/matches": [match(OLDER, "2026-01-01T00:00:00Z"), match()],
            f"/v2/matches/{GAME}": match(),
        }

    async def fetch(self, request):
        self.calls.append(request)
        if self.error:
            raise self.error
        return HttpResponse(200, {}, json.dumps(self.payloads[request.path]).encode())


class ProviderTests(unittest.IsolatedAsyncioTestCase):
    async def test_synthetic_profile_recent_last_detail_and_stats_contract(self):
        http = Http()
        provider = LeetifyProvider(http)
        card = await provider.profile(PLAYER)
        history = await provider.recent(PLAYER)
        last = await provider.last(PLAYER)
        detail = await provider.match(GAME, focus=PLAYER)
        stats = await provider.stats(PLAYER)
        self.assertEqual(history["data"]["matches"][0], last["data"])
        self.assertEqual(last, detail)
        self.assertEqual(last["data"]["focus"]["steam_id64"], PLAYER)
        self.assertEqual(last["data"]["focus"]["total_kills"], 0)
        self.assertIsNone(last["data"]["focus"]["total_deaths"])
        self.assertEqual(last["field_availability"]["focus"]["total_deaths"], "unknown")
        self.assertEqual(last["data"]["focus"]["leetify_rating"], 0.015)
        self.assertEqual(last["data"]["focus"]["reaction_time"], 0.4)
        self.assertEqual(card["data"]["rating"]["aim"], 55.5)
        self.assertEqual(card["data"]["ranks"]["premier_cs_rating"], 15000)
        self.assertEqual(card["data"]["ranks"]["leetify_rating"], 2.1)
        self.assertIsNone(card["data"]["ranks"]["faceit_elo"])
        self.assertEqual(stats["data"]["sample_match_count"], 2)
        for result in (card, history, last, stats):
            self.assertEqual(result["source"], "leetify")
            self.assertEqual(result["cache"], "disabled_provider_no_retention")
            self.assertEqual(result["attribution"], "Data Provided by Leetify")
            self.assertEqual(result["fetched_at"], card["fetched_at"])
        self.assertEqual(len(http.calls), 3)  # Invocation-only request reuse.
        self.assertTrue(all(call.source_id == "leetify" for call in http.calls))
        self.assertTrue(all(not call.headers for call in http.calls))
        self.assertEqual(http.calls[0].query, (("steam64_id", PLAYER),))

    async def test_failures_are_distinct_no_retries_and_retry_after_preserved(self):
        for status, code in (
            (401, "authentication_required"),
            (403, "access_denied_reason_unavailable"),
            (404, "not_found_or_not_registered"),
            (429, "rate_limited"),
            (503, "upstream_error"),
        ):
            http = Http()
            http.error = SourceHttpError(
                "upstream_error", status_code=status, retry_after_seconds=60
            )
            with self.assertRaises(ProviderError) as caught:
                await LeetifyProvider(http).profile(PLAYER)
            self.assertEqual(caught.exception.code, code)
            self.assertEqual(caught.exception.retry_after_seconds, 60)
            self.assertEqual(len(http.calls), 1)

    async def test_empty_history_not_zero_stats_or_arbitrary_last(self):
        http = Http()
        http.payloads["/v3/profile/matches"] = []
        with self.assertRaises(ProviderError) as caught:
            await LeetifyProvider(http).last(PLAYER)
        self.assertEqual(caught.exception.code, "no_recorded_matches")
        self.assertEqual(len(http.calls), 1)

    async def test_identity_mismatch_private_and_schema_fail_closed(self):
        for body, code in (
            ({"privacy_mode": "private"}, "not_public_or_visibility_unknown"),
            ([], "schema_changed"),
            ({**profile(), "steam64_id": OTHER}, "schema_changed"),
        ):
            http = Http()
            http.payloads["/v3/profile"] = body
            with self.assertRaises(ProviderError) as caught:
                await LeetifyProvider(http).profile(PLAYER)
            self.assertEqual(caught.exception.code, code)

    async def test_cancellation_propagates(self):
        http = Http()
        http.error = asyncio.CancelledError()
        with self.assertRaises(asyncio.CancelledError):
            await LeetifyProvider(http).profile(PLAYER)

    async def test_invalid_ids_never_request(self):
        http = Http()
        provider = LeetifyProvider(http)
        for target in (
            int(PLAYER),
            "123",
            "https://steamcommunity.com/profiles/" + PLAYER,
        ):
            with self.assertRaises(ValueError):
                await provider.profile(target)
        with self.assertRaises(ValueError):
            await provider.match("not-a-uuid")
        with self.assertRaises(ValueError):
            await provider.recent(PLAYER, limit=True)
        self.assertFalse(http.calls)

    def test_focus_must_be_exact_member_and_unknown_is_not_zero(self):
        with self.assertRaises(SchemaError):
            normalize_match(match(), focus=OTHER)
        duplicated = match()
        duplicated["stats"].append(duplicated["stats"][0])
        with self.assertRaises(SchemaError):
            normalize_match(duplicated)
        result = normalize_profile({"steam64_id": PLAYER}, PLAYER)
        self.assertIsNone(result["data"]["total_matches"])
        self.assertIsNone(result["data"]["avatar"])
        self.assertIsNone(result["data"]["ranks"]["premier_cs_rating"])
        result = normalize_profile(
            {
                "steam64_id": PLAYER,
                "total_matches": 10**400,
                "rating": {"aim": float("nan")},
            },
            PLAYER,
        )
        self.assertIsNone(result["data"]["total_matches"])
        self.assertIsNone(result["data"]["rating"]["aim"])

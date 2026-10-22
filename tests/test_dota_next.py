"""Integration risks: bounded requests, cache versions, focus and privacy."""

import json
import unittest
from dataclasses import fields, is_dataclass
from datetime import UTC, datetime, timedelta

import test_dota_module as legacy
import yomihime_game_link_sdk as ygl
from test_dota_module import identity_result, invocation
from yomihime_game_link_sdk import cards
from yomihime_game_link_sdk.contexts import InvocationOrigin
from yomihime_game_link_sdk.services import HttpResponse
from yomihime_game_link_sdk.storage import CacheEntry, CacheLookup, CacheLookupStatus


class MemoryCache:
    def __init__(self):
        self.entries = {}
        self.keys = []

    async def lookup(self, query):
        self.keys.append(query.key)
        return (
            CacheLookup(CacheLookupStatus.HIT, self.entries[query.key])
            if query.key in self.entries
            else CacheLookup(CacheLookupStatus.MISS)
        )

    async def put(self, key, payload, **kwargs):
        self.entries[key] = CacheEntry(
            key=key,
            payload=payload,
            expires_at=datetime.now(UTC) + timedelta(minutes=5),
        )


class SequenceHttp:
    def __init__(self, *responses):
        self.responses = list(responses)
        self.requests = []

    async def fetch(self, request):
        self.requests.append(request)
        response = self.responses.pop(0)
        return (
            response
            if isinstance(response, HttpResponse)
            else HttpResponse(200, {}, json.dumps(response).encode())
        )


def recent():
    return [
        {
            "match_id": 9001,
            "start_time": 20,
            "hero_id": 1,
            "game_mode": 23,
            "player_slot": 0,
            "radiant_win": True,
            "kills": 0,
        },
        {
            "match_id": 9002,
            "start_time": 10,
            "hero_id": 2,
            "game_mode": 22,
            "player_slot": 128,
            "radiant_win": True,
            "deaths": 2,
        },
    ]


def match():
    return {
        "match_id": 9001,
        "duration": 0,
        "game_mode": 23,
        "radiant_win": False,
        "players": [
            {
                "account_id": 123,
                "player_slot": 0,
                "hero_id": 1,
                "kills": 0,
                "deaths": 2,
                "assists": 0,
                "level": 0,
                "gold_per_min": 0,
                "hero_damage": 0,
                "item_0": 0,
                "personaname": "[gold]外部昵称[/gold]\u202e",
            },
            {"account_id": None, "player_slot": 128, "hero_id": 999, "kills": 1},
        ],
    }


def shown(result):
    return "\n".join(
        getattr(block, "text", None) or block.fallback_text or ""
        for block in result.document.ordered_blocks
    )


class TestDotaNext(unittest.IsolatedAsyncioTestCase):
    asyncSetUp = legacy.TestDotaModule.asyncSetUp

    def setup_sources(self, *responses):
        self.scope.cache = self.cache = MemoryCache()
        self.scope.http = self.http = SequenceHttp(*responses)

    async def call(self, operation, parameters, origin=InvocationOrigin.LLM_TOOL):
        return await self.handlers[operation].invoke(
            invocation(origin, operation), parameters
        )

    async def test_stats_one_request_then_cache_and_no_old_recent_projection(self):
        self.setup_sources(recent())
        first = await self.call("stats_explicit", {"account": "123", "limit": 2})
        self.assertEqual(first.status, ygl.ResultStatus.SUCCESS)
        stats = first.model_facts.facts["stats"]
        self.assertEqual(
            (stats["wins"], stats["losses"], stats["win_rate"]), (1, 1, 50)
        )
        self.assertEqual(stats["averages"]["kills"]["value"], 0)
        self.assertEqual(stats["averages"]["kills"]["sample_count"], 1)
        self.assertEqual(len(self.http.requests), 1)
        request = self.http.requests[0]
        self.assertEqual(
            (request.path, request.query),
            ("/api/players/123/matches", (("significant", "0"), ("limit", "2"))),
        )
        self.assertIn("本次网络取数", shown(first))
        second = await self.call("stats_explicit", {"account": "123", "limit": 2})
        self.assertEqual(len(self.http.requests), 1)
        self.assertIn("缓存命中", shown(second))
        self.assertEqual(self.cache.keys, ["opendota:stats:v1:123:2"] * 2)
        self.assertEqual(self.dependencies.calls, [])

    async def test_last_selects_first_valid_at_most_one_detail_and_caches_both(self):
        self.setup_sources([{"match_id": 0}, *recent()], match())
        result = await self.call("last_explicit", {"account": "123"})
        self.assertEqual(result.status, ygl.ResultStatus.SUCCESS)
        self.assertEqual(
            [r.path for r in self.http.requests],
            ["/api/players/123/matches", "/api/matches/9001"],
        )
        self.assertEqual(result.model_facts.facts["focus"]["status"], "found")
        self.assertEqual(result.model_facts.facts["selection"]["invalid_count"], 1)
        self.assertIn("无效1", shown(result))
        cached = await self.call("last_explicit", {"account": "123"})
        self.assertEqual(len(self.http.requests), 2)
        self.assertEqual(shown(cached).count("缓存命中"), 2)
        self.assertIn("opendota:match:v2:9001", self.cache.keys)

    async def test_defaults_suppress_whole_facts_but_explicit_cache_reuse_is_public(
        self,
    ):
        for operation in ("stats", "last"):
            with self.subTest(operation=operation):
                self.setup_sources(recent(), match())
                self.dependencies.result = identity_result()
                self.dependencies.calls.clear()
                result = await self.call(
                    operation, {"command": ""}, InvocationOrigin.COMMAND
                )
                self.assertEqual(result.status, ygl.ResultStatus.SUCCESS)
                self.assertIsNone(result.model_facts)
                self.assertEqual(len(self.dependencies.calls), 1)
                self.assertNotIn("76561197960265851", shown(result))
                self.assertNotIn("binding_revision", shown(result))
                explicit = await self.call(operation + "_explicit", {"account": "123"})
                self.assertIsNotNone(explicit.model_facts)
                self.assertEqual(len(self.dependencies.calls), 1)

    async def test_legacy_match_has_no_default_identity_focus_exact_and_missing_not_zero(
        self,
    ):
        self.setup_sources(match())
        overview = await self.call(
            "match", {"command": "9001"}, InvocationOrigin.COMMAND
        )
        self.assertEqual(overview.status, ygl.ResultStatus.SUCCESS)
        self.assertNotIn("focus", overview.model_facts.facts)
        self.assertEqual(self.dependencies.calls, [])
        focused = await self.call(
            "match", {"command": "9001 --account 123"}, InvocationOrigin.COMMAND
        )
        player = focused.model_facts.facts["focus"]["player"]
        self.assertEqual(player["gold_per_min"], 0)
        self.assertIsNone(player["xp_per_min"])
        self.assertIn("0 / 未提供", shown(focused))
        self.assertIn("槽1：空；槽2：未提供", shown(focused))
        self.assertIn("不是购买顺序", shown(focused))
        absent = await self.call("match", {"match_id": "9001", "account": "124"})
        self.assertEqual(absent.model_facts.facts["focus"]["status"], "not_found")
        self.assertIn("可能不在比赛中或账号未公开", shown(absent))
        self.assertEqual(self.dependencies.calls, [])
        self.assertEqual(len(self.http.requests), 1)

    async def test_invalid_arguments_and_tool_omissions_never_resolve_private_identity(
        self,
    ):
        cases = [
            ("stats_explicit", {}),
            ("last_explicit", {}),
            ("stats", {"account": "123", "limit": 21}),
            ("stats", {"account": "123", "limit": True}),
            ("match", {"match_id": "9001", "account": 123}),
        ]
        for operation, parameters in cases:
            result = await self.call(operation, parameters)
            self.assertEqual(result.error.code, ygl.ErrorCode.PARAMETER_ERROR)
        for operation, raw in (
            ("stats", "123 --limit 1 --limit 2"),
            ("last", "123 --limit 1"),
            ("match", "9001 --account 123 --account 124"),
        ):
            result = await self.call(
                operation, {"command": raw}, InvocationOrigin.COMMAND
            )
            self.assertEqual(result.error.code, ygl.ErrorCode.PARAMETER_ERROR)
        self.assertEqual(self.dependencies.calls, [])
        self.assertEqual(self.http.requests, [])

    async def test_last_empty_invalid_and_detail_failure_never_falls_back(self):
        for payload in ([], [{"match_id": 0}]):
            self.setup_sources(payload)
            result = await self.call("last_explicit", {"account": "123"})
            self.assertEqual(result.error.code, ygl.ErrorCode.NO_RECORDS)
            self.assertEqual(len(self.http.requests), 1)
        self.setup_sources(recent(), HttpResponse(404, {}, b"{}"))
        result = await self.call("last_explicit", {"account": "123"})
        self.assertEqual(result.error.code, ygl.ErrorCode.NOT_FOUND)
        self.assertIn("未改查更早比赛", result.error.message)
        self.assertEqual(len(self.http.requests), 2)

    async def test_empty_stats_and_safe_literal_cards_have_complete_fallback(self):
        self.setup_sources([])
        empty = await self.call("stats_explicit", {"account": "123"})
        self.assertEqual(empty.status, ygl.ResultStatus.SUCCESS)
        self.assertIn("未知（n=0）", shown(empty))
        self.assertIn("没有有效样本", shown(empty))
        self.setup_sources(match())
        result = await self.call("match", {"match_id": "9001", "account": "123"})
        self.assertIsNotNone(result.document.card)
        self.assertIn("[gold]外部昵称[/gold]", shown(result))
        self.assertNotIn("\u202e", shown(result))
        self.assertIn("GPM / XPM", shown(result))
        self.assertIn("英雄 / 建筑伤害", shown(result))
        self.assertIn("全场核心结算", shown(result))

        def walk(value):
            self.assertNotIsInstance(value, cards.TaggedText)
            if is_dataclass(value):
                for field in fields(value):
                    walk(getattr(value, field.name))
            elif isinstance(value, tuple):
                for child in value:
                    walk(child)

        walk(result.document.card)


if __name__ == "__main__":
    unittest.main()

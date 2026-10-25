import asyncio
import json
import unittest
from types import SimpleNamespace

import yomihime_game_link_sdk as ygl
from yomihime_game_link_sdk.contexts import InvocationOrigin, InvocationView
from yomihime_game_link_sdk.errors import (
    AccessDenied,
    InvalidInvocation,
    SourceHttpError,
)
from yomihime_game_link_sdk.services import HttpResponse
from yomihime_game_link_sdk.storage import CacheLookupStatus

from packages.steam_dlc.deadlock import normalization as norm
from packages.steam_dlc.deadlock.module import Module, avatar_asset, load, valid_cached


def context(operation, origin=InvocationOrigin.LLM_TOOL):
    return InvocationView(
        invocation_id="test-deadlock",
        origin=origin,
        actor_id="actor",
        conversation_id="private",
        module_id="steam_dlc/deadlock",
        module_epoch=1,
        registry_revision=1,
        capability_id=operation,
    )


def history():
    return [
        {
            "match_id": 901,
            "account_id": 123,
            "start_time": 100,
            "player_match_outcome": 1,
            "player_kills": 0,
        },
        {
            "match_id": 902,
            "account_id": 123,
            "start_time": 200,
            "player_match_outcome": 5,
            "player_deaths": 2,
        },
    ]


def metadata(mid=902, count=12):
    return {
        "match_info": {
            "match_id": mid,
            "duration_s": 1800,
            "game_mode": 1,
            "match_mode": 2,
            "winning_team": 0,
            "players": [
                {
                    "account_id": 123 if i == 0 else 1000 + i,
                    "team": i % 2,
                    "hero_id": i + 1,
                    "kills": i,
                    "deaths": 0,
                    "assists": 3,
                }
                for i in range(count)
            ],
        }
    }


class Http:
    def __init__(self):
        self.requests = []
        self.fail_detail = False
        self.rate_limit = False

    async def fetch(self, request):
        self.requests.append(request)
        if self.rate_limit:
            raise SourceHttpError(
                "upstream_error", status_code=429, retry_after_seconds=30
            )
        if "metadata" in request.path:
            if self.fail_detail:
                raise SourceHttpError("upstream_error", status_code=404)
            payload = metadata()
        elif request.path.endswith("/rank"):
            payload = {"badge": 0, "rank": 0, "subrank": 0, "last_match": None}
        elif request.path.endswith("/steam"):
            payload = []
        else:
            payload = history()
        return HttpResponse(200, {}, json.dumps(payload).encode())


class Cache:
    def __init__(self):
        self.values = {}

    async def lookup(self, query):
        payload = self.values.get(query.key)
        return SimpleNamespace(
            status=CacheLookupStatus.HIT
            if payload is not None
            else CacheLookupStatus.MISS,
            entry=SimpleNamespace(payload=payload) if payload else None,
        )

    async def put(self, key, payload, **kwargs):
        self.values[key] = payload


class Queries(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.http, self.cache = Http(), Cache()
        self.dependency_calls = []

        async def dep(ctx, ref, parameters):
            self.dependency_calls.append((ctx, ref, parameters))
            return ygl.CapabilityResult(
                "identity",
                ygl.ResultStatus.SUCCESS,
                document=ygl.DisplayDocument(
                    "identity",
                    "identity",
                    (
                        ygl.FieldsBlock(
                            {
                                "identity": {
                                    "steam_id64": "76561197960265851",
                                    "account_id32": 123,
                                    "binding_revision": 1,
                                    "association": "self_asserted",
                                }
                            }
                        ),
                    ),
                    privacy=ygl.Privacy.PRIVATE,
                ),
                privacy=ygl.Privacy.PRIVATE,
            )

        self.scope = SimpleNamespace(
            http=self.http, cache=self.cache, dependencies=SimpleNamespace(invoke=dep)
        )

        async def bind(ctx):
            return self.scope

        self.module = Module(SimpleNamespace(scopes=SimpleNamespace(bind=bind)))
        await self.module.start()

    async def invoke(self, operation, params, origin=InvocationOrigin.LLM_TOOL):
        return (
            await self.module.handlers()
            .capabilities[operation]
            .invoke(context(operation, origin), params)
        )

    async def test_tool_never_reads_default_identity(self):
        r = await self.invoke("recent_explicit", {})
        self.assertEqual(r.error.code, ygl.ErrorCode.PARAMETER_ERROR)
        self.assertEqual(self.dependency_calls, [])
        self.assertEqual(self.http.requests, [])

    async def test_command_dependency_explicit_account_ignores_root_command(self):
        result = await self.invoke(
            "recent_explicit",
            {"account": "123", "command": "unrelated root command"},
            InvocationOrigin.COMMAND,
        )
        self.assertEqual(result.status, ygl.ResultStatus.SUCCESS)
        self.assertEqual(self.dependency_calls, [])
        self.assertIn("/players/123/", self.http.requests[0].path)
        self.assertIsNotNone(result.model_facts)

    async def test_default_command_whole_facts_absent(self):
        r = await self.invoke("stats", {"command": ""}, InvocationOrigin.COMMAND)
        self.assertEqual(r.status, ygl.ResultStatus.SUCCESS)
        self.assertIsNone(r.model_facts)
        self.assertEqual(len(self.dependency_calls), 1)
        self.assertIsNotNone(r.document.card)

    async def test_match_no_account_does_not_bind(self):
        r = await self.invoke("match", {"match_id": "902"})
        self.assertEqual(r.status, ygl.ResultStatus.SUCCESS)
        self.assertEqual(self.dependency_calls, [])
        self.assertEqual(self.http.requests[0].query, (("disable_steam", "true"),))

    async def test_last_and_focus_same_match_not_dota_ten(self):
        r = await self.invoke("last_explicit", {"account": "123"})
        self.assertEqual(r.status, ygl.ResultStatus.SUCCESS)
        self.assertEqual(r.model_facts.facts["match"]["player_count"], 12)
        self.assertEqual(r.model_facts.facts["focus"]["status"], "found")
        self.assertEqual(r.model_facts.facts["selection"]["match_id"], "902")
        self.assertEqual(self.dependency_calls, [])

    async def test_last_detail_failure_does_not_change_match(self):
        self.http.fail_detail = True
        r = await self.invoke("last_explicit", {"account": "123"})
        self.assertEqual(r.status, ygl.ResultStatus.ERROR)
        self.assertIn("902", r.error.message)
        self.assertEqual(len(self.http.requests), 2)

    async def test_recent_stats_reuse_same_recorded_window(self):
        a = await self.invoke("recent_explicit", {"account": "123"})
        b = await self.invoke("stats_explicit", {"account": "123"})
        self.assertEqual(len(self.http.requests), 1)
        self.assertEqual(
            a.model_facts.facts["fetched_at"], b.model_facts.facts["fetched_at"]
        )
        self.assertTrue(b.model_facts.facts["cache_hit"])
        self.assertEqual(b.model_facts.facts["stats"]["outcome_denominator"], 1)

    async def test_429_preserves_retry_and_does_not_parse_error_body(self):
        self.http.rate_limit = True
        r = await self.invoke("recent_explicit", {"account": "123"})
        self.assertEqual(r.error.code, ygl.ErrorCode.RATE_LIMITED)
        self.assertEqual(r.error.retry_after_seconds, 30)
        self.assertEqual(self.cache.values, {})

    async def test_unrecorded_profile_keeps_zero_semantics(self):
        r = await self.invoke("profile_explicit", {"account": "123"})
        p = r.model_facts.facts["profile"]
        self.assertEqual(p["profile_status"], "not_recorded")
        self.assertEqual(p["rank"]["status"], "unranked_or_unavailable")
        self.assertIsNone(p["name"])

    async def test_avatar_rejects_other_host_and_path_before_request(self):
        for url in (
            "https://evil.example/a.jpg",
            "https://avatars.steamstatic.com/a.jpg",
            "https://avatars.steamstatic.com/" + "a" * 40 + ".jpg?token=x",
        ):
            self.assertIsNone(await avatar_asset(self.scope, url))
        self.assertEqual(self.http.requests, [])

    async def test_corrupted_cached_projection_self_heals(self):
        await self.invoke("recent_explicit", {"account": "123"})
        entry = next(iter(self.cache.values.values()))
        entry["projection"]["history"] = {"matches": [{"match_id": "902"}]}
        r = await self.invoke("stats_explicit", {"account": "123"})
        self.assertEqual(r.status, ygl.ResultStatus.SUCCESS)
        self.assertEqual(len(self.http.requests), 2)

    async def test_complete_history_cache_schema_self_heals_once(self):
        mutations = {
            "numeric": lambda p: p["history"]["matches"][0].update(
                kills="broken-numeric-field"
            ),
            "metadata": lambda p: p["history"].pop("sample_count"),
            "boolean_counter": lambda p: p["history"].update(received_count=True),
            "count_relationship": lambda p: p["history"].update(valid_count=999),
            "timestamp": lambda p: p.update(fetched_at="2026-10-23T12:00:00"),
            "availability": lambda p: p["field_availability"]["kills"].update(
                available="broken"
            ),
        }
        for name, mutate in mutations.items():
            with self.subTest(name=name):
                self.cache.values.clear()
                await self.invoke("recent_explicit", {"account": "123"})
                projection = next(iter(self.cache.values.values()))["projection"]
                mutate(projection)
                self.assertFalse(valid_cached(projection, "history", 123, None, 20))
                before = len(self.http.requests)
                first = await self.invoke("stats_explicit", {"account": "123"})
                second = await self.invoke("stats_explicit", {"account": "123"})
                self.assertEqual(
                    (first.status, second.status), (ygl.ResultStatus.SUCCESS,) * 2
                )
                self.assertEqual(len(self.http.requests) - before, 1)
                self.assertFalse(first.model_facts.facts["cache_hit"])
                self.assertTrue(second.model_facts.facts["cache_hit"])

    async def test_nested_profile_and_match_cache_values_are_validated(self):
        cases = (
            (
                "profile_explicit",
                {"account": "123"},
                "profile",
                123,
                None,
                lambda p: p["profile"]["rank"].update(badge="broken"),
                2,
            ),
            (
                "match_explicit",
                {"match_id": "902"},
                "match",
                None,
                "902",
                lambda p: p["match"].update(player_count=10),
                1,
            ),
            (
                "match_explicit",
                {"match_id": "902"},
                "match",
                None,
                "902",
                lambda p: p["match"]["players"][0].update(deaths=[]),
                1,
            ),
        )
        for (
            operation,
            parameters,
            kind,
            account,
            mid,
            mutate,
            expected_fetches,
        ) in cases:
            with self.subTest(operation=operation, expected_fetches=expected_fetches):
                self.cache.values.clear()
                await self.invoke(operation, parameters)
                projection = next(iter(self.cache.values.values()))["projection"]
                self.assertTrue(valid_cached(projection, kind, account, mid, 20))
                mutate(projection)
                self.assertFalse(valid_cached(projection, kind, account, mid, 20))
                before = len(self.http.requests)
                for _ in range(2):
                    self.assertEqual(
                        (await self.invoke(operation, parameters)).status,
                        ygl.ResultStatus.SUCCESS,
                    )
                self.assertEqual(len(self.http.requests) - before, expected_fetches)

    async def test_cache_authorization_and_cancellation_are_not_misses(self):
        for exception in (
            AccessDenied(),
            InvalidInvocation(),
            asyncio.CancelledError(),
        ):
            with self.subTest(exception=type(exception).__name__):

                async def denied_lookup(query):
                    raise exception

                scope = SimpleNamespace(
                    http=self.http, cache=SimpleNamespace(lookup=denied_lookup)
                )
                before = len(self.http.requests)
                with self.assertRaises(type(exception)):
                    await load(scope, "history", 123, 20, None)
                self.assertEqual(len(self.http.requests), before)

    async def test_child_command_cannot_resolve_private_default(self):
        from dataclasses import replace

        ctx = replace(context("profile", InvocationOrigin.COMMAND), parent_id="parent")
        r = (
            await self.module.handlers()
            .capabilities["profile"]
            .invoke(ctx, {"command": ""})
        )
        self.assertEqual(r.error.code, ygl.ErrorCode.PARAMETER_ERROR)
        self.assertEqual(self.dependency_calls, [])

    async def test_controlled_avatar_uses_only_declared_source_bytes(self):
        async def image(request):
            self.http.requests.append(request)
            return HttpResponse(
                200, {"content-type": "image/jpeg"}, b"\xff\xd8\xfftest"
            )

        self.scope.http = SimpleNamespace(fetch=image)
        asset = await avatar_asset(
            self.scope, "https://avatars.steamstatic.com/" + "a" * 40 + "_full.jpg"
        )
        self.assertEqual(asset.content, b"\xff\xd8\xfftest")
        self.assertFalse(asset.required)
        self.assertEqual(self.http.requests[0].source_id, "steam_avatar")
        self.assertNotIn("://", self.http.requests[0].path)

    async def test_fastly_avatar_accepts_exact_host_and_rejects_url_escapes(self):
        async def image(request):
            self.http.requests.append(request)
            return HttpResponse(200, {}, b"\xff\xd8\xffsynthetic")

        self.scope.http = SimpleNamespace(fetch=image)
        path = "/" + "b" * 40 + "_full.jpg"
        asset = await avatar_asset(
            self.scope, "https://avatars.fastly.steamstatic.com" + path
        )
        self.assertEqual(asset.content, b"\xff\xd8\xffsynthetic")
        self.assertEqual(self.http.requests[0].source_id, "steam_avatar_fastly")
        self.assertEqual(self.http.requests[0].path, path)
        for prefix, suffix in (
            ("http://avatars.fastly.steamstatic.com", ""),
            ("https://avatars.fastly.steamstatic.com.evil.invalid", ""),
            ("https://user@avatars.fastly.steamstatic.com", ""),
            ("https://avatars.fastly.steamstatic.com:8443", ""),
            ("https://avatars.fastly.steamstatic.com", "?credential=synthetic"),
            ("https://avatars.fastly.steamstatic.com", "#fragment"),
        ):
            self.assertIsNone(await avatar_asset(self.scope, prefix + path + suffix))
        self.assertEqual(len(self.http.requests), 1)


class Normalization(unittest.TestCase):
    def test_missing_fields_and_valid_denominators(self):
        rows = norm.recent(history(), 123)["matches"]
        stats = norm.statistics(rows)
        self.assertEqual(stats["unknown"], 1)
        self.assertEqual(stats["win_rate"], 100)
        self.assertEqual(stats["averages"]["kills"], {"value": 0.0, "sample_count": 1})
        self.assertIsNone(rows[0]["kills"])

    def test_history_filters_wrong_account_and_deduplicates(self):
        data = history() + history() + [{"match_id": 999, "account_id": 456}]
        p = norm.recent(data, 123)
        self.assertEqual(p["sample_count"], 2)
        self.assertEqual(p["duplicate_count"], 2)
        self.assertEqual(p["invalid_count"], 1)

    def test_exact_focus_and_match_identity(self):
        report = norm.match(metadata(), "902")
        self.assertEqual(norm.focus(report, 12)["status"], "not_found")
        report["players"].append(report["players"][0])
        self.assertEqual(norm.focus(report, 123)["status"], "ambiguous")
        with self.assertRaises(ValueError):
            norm.match(metadata(), "903")

    def test_eternus_and_unknown_rank_are_not_zero_mmr(self):
        p = norm.profile([], {"badge": 116, "rank": 11, "subrank": 6}, 123)
        self.assertIn("percentile", p["rank"]["semantics"])
        self.assertIsNone(norm.profile([], {}, 123)["rank"]["badge"])

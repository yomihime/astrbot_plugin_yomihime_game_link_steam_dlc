import asyncio
import json
import unittest
from datetime import UTC, datetime, timedelta
from types import MappingProxyType, SimpleNamespace
from unittest.mock import patch

import yomihime_game_link_sdk as ygl
from yomihime_game_link_sdk.contexts import InvocationOrigin, InvocationView
from yomihime_game_link_sdk.display import DisplayDocument, FieldsBlock
from yomihime_game_link_sdk.errors import (
    AccessDenied,
    CacheUnavailable,
    InvalidInvocation,
    ServiceUnavailable,
    SourceHttpError,
)
from yomihime_game_link_sdk.results import CapabilityResult, ErrorCode, ResultStatus
from yomihime_game_link_sdk.services import (
    ConfigSnapshot,
    HttpBudgetStatus,
    HttpResponse,
)
from yomihime_game_link_sdk.storage import (
    CacheEntry,
    CacheLookup,
    CacheLookupStatus,
    CacheVisibility,
)

from packages.steam_dlc.dota2 import module as dota_module
from packages.steam_dlc.dota2.module import Factory


def invocation(origin, capability):
    return InvocationView(
        invocation_id=f"test-{capability}",
        origin=origin,
        actor_id="actor-a",
        conversation_id="private-a",
        module_id="steam_dlc/dota2",
        module_epoch=1,
        registry_revision=1,
        capability_id=capability,
    )


class Cache:
    def __init__(self):
        self.queries = []
        self.puts = []
        self.error = None
        self.cached = None

    async def lookup(self, query):
        self.queries.append(query)
        if self.error:
            raise self.error
        if self.cached is not None:
            return CacheLookup(CacheLookupStatus.HIT, self.cached)
        return CacheLookup(CacheLookupStatus.MISS)

    async def put(self, key, payload, *, ttl_seconds, visibility):
        if self.error:
            raise self.error
        self.puts.append((key, payload, ttl_seconds, visibility))
        return None


class Http:
    def __init__(self, body=None, status=200, headers=None):
        self.body = body if isinstance(body, bytes) else json.dumps(body or {}).encode()
        self.status = status
        self.headers = headers or {}
        self.requests = []
        self.error = None

    async def fetch(self, request):
        if self.error:
            raise self.error
        self.requests.append(request)
        return HttpResponse(self.status, self.headers, self.body)


class Dependencies:
    def __init__(self, result=None):
        self.calls = []
        self.result = result

    async def invoke(self, context, reference, parameters):
        self.calls.append((context, reference, parameters))
        return self.result


def identity_result():
    return CapabilityResult(
        "identity",
        ResultStatus.SUCCESS,
        document=DisplayDocument(
            "Steam identity",
            "Steam account",
            (
                FieldsBlock(
                    {
                        "identity": {
                            "steam_id64": "76561197960265851",
                            "account_id32": 123,
                            "binding_revision": 7,
                            "association": "self_asserted",
                        }
                    }
                ),
            ),
            privacy=ygl.Privacy.PRIVATE,
        ),
        privacy=ygl.Privacy.PRIVATE,
    )


class TestDotaModule(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.cache = Cache()
        self.http = Http()
        self.dependencies = Dependencies()
        self.scope = SimpleNamespace(
            cache=self.cache, http=self.http, dependencies=self.dependencies
        )

        async def bind(context):
            self.bound_contexts.append(context)
            return self.scope

        self.bound_contexts = []

        async def config():
            return ConfigSnapshot(revision=1, values={"timezone": "UTC"})

        services = SimpleNamespace(
            scopes=SimpleNamespace(bind=bind), config=SimpleNamespace(current=config)
        )
        self.module = await Factory().create(services)
        await self.module.start()
        self.handlers = self.module.handlers().capabilities

    @staticmethod
    def _recent_payload():
        return [
            {
                "match_id": 800000001,
                "start_time": 0,
                "hero_id": 0,
                "game_mode": 23,
                "player_slot": 0,
                "radiant_win": True,
                "kills": 0,
                "deaths": 2,
                "assists": 5,
                "duration": 1800,
            }
        ]

    async def test_tool_requires_explicit_account_and_never_invokes_identity(self):
        result = await self.handlers["recent"].invoke(
            invocation(InvocationOrigin.LLM_TOOL, "recent"), {"limit": 1}
        )
        self.assertEqual(result.error.code, ErrorCode.PARAMETER_ERROR)
        self.assertEqual(self.dependencies.calls, [])

        self.http = self.scope.http = Http(self._recent_payload())
        result = await self.handlers["recent"].invoke(
            invocation(InvocationOrigin.LLM_TOOL, "recent"),
            {"account": "123", "limit": 1},
        )
        self.assertEqual(result.status, ResultStatus.SUCCESS)
        self.assertEqual(self.dependencies.calls, [])
        request = self.http.requests[0]
        self.assertEqual(
            (request.source_id, request.path, request.method),
            ("opendota", "/api/players/123/matches", "GET"),
        )
        self.assertEqual(request.query, (("significant", "0"), ("limit", "1")))
        self.assertIs(self.cache.queries[0].visibility, CacheVisibility.PUBLIC)
        self.assertIs(self.cache.puts[0][3], CacheVisibility.PUBLIC)
        self.assertIn("800000001", str(result.model_facts.facts))
        self.assertEqual(result.model_facts.facts["matches"][0]["outcome"], "win")
        self.assertTrue(
            any("胜利" in block.text for block in result.document.ordered_blocks)
        )

    async def test_cache_hit_accepts_deep_frozen_mapping_and_tuples(self):
        row = MappingProxyType(
            {
                "match_id": "800000001",
                "start_time": 0,
                "hero_id": 1,
                "game_mode": 23,
                "outcome": "win",
                "kills": 0,
                "deaths": 1,
                "assists": 2,
                "duration": 1800,
            }
        )
        projection = MappingProxyType({"account_id32": "123", "matches": (row,)})
        self.cache.cached = CacheEntry(
            key="opendota:recent:123:5",
            payload={"schema_version": 2, "projection": projection},
            expires_at=datetime.now(UTC) + timedelta(minutes=1),
        )
        result = await self.handlers["recent"].invoke(
            invocation(InvocationOrigin.LLM_TOOL, "recent"), {"account": "123"}
        )
        self.assertEqual(result.status, ResultStatus.SUCCESS)
        self.assertEqual(self.cache.queries[0].key, "opendota:recent:123:5")
        self.assertEqual(self.http.requests, [])
        self.assertIn("敌法师", result.document.ordered_blocks[1].text)

    async def test_command_default_uses_only_the_declared_identity_dependency(self):
        self.dependencies.result = identity_result()
        self.http = self.scope.http = Http(self._recent_payload())
        context = invocation(InvocationOrigin.COMMAND, "recent")
        result = await self.handlers["recent"].invoke(context, {"command": "--limit 1"})
        self.assertEqual(result.status, ResultStatus.SUCCESS)
        self.assertEqual(len(self.dependencies.calls), 1)
        called_context, reference, parameters = self.dependencies.calls[0]
        self.assertIs(called_context, context)
        self.assertEqual(
            (reference.module_id, reference.capability_id),
            ("steam_dlc/steam", "identity"),
        )
        self.assertEqual(dict(parameters), {})
        self.assertIsNone(result.model_facts)
        self.assertEqual(result.privacy, ygl.Privacy.PUBLIC)
        self.assertEqual(result.document.privacy, ygl.Privacy.PUBLIC)
        shown = "\n".join(block.text for block in result.document.ordered_blocks)
        self.assertIn("本次查询账号 123", shown)
        self.assertNotIn("76561197960265851", shown)
        self.assertNotIn("修订", shown)
        self.assertNotIn("self_asserted", shown)

    async def test_default_profile_is_public_without_identity_details_or_facts(self):
        self.dependencies.result = identity_result()
        self.http = self.scope.http = Http(
            {
                "rank_tier": 0,
                "profile": {
                    "personaname": "Player",
                    "steamid": "76561197960265851",
                    "profileurl": "https://steamcommunity.com/profiles/76561197960265851",
                },
            }
        )
        result = await self.handlers["profile"].invoke(
            invocation(InvocationOrigin.COMMAND, "profile"), {"command": ""}
        )
        self.assertEqual(result.status, ResultStatus.SUCCESS)
        self.assertEqual(result.privacy, ygl.Privacy.PUBLIC)
        self.assertEqual(result.document.privacy, ygl.Privacy.PUBLIC)
        self.assertIsNone(result.model_facts)
        shown = "\n".join(block.text for block in result.document.ordered_blocks)
        self.assertIn("本次查询账号 123", shown)
        self.assertNotIn("76561197960265851", shown)
        self.assertNotIn("self_asserted", shown)
        self.assertNotIn("修订", shown)

    async def test_profile_and_match_use_fixed_routes_and_string_account_ids(self):
        self.http = self.scope.http = Http(
            {
                "rank_tier": 0,
                "profile": {
                    "account_id": 123,
                    "personaname": "Player",
                    "steamid": "76561197960265851",
                    "profileurl": "https://steamcommunity.com/profiles/76561197960265851",
                },
            }
        )
        profile = await self.handlers["profile"].invoke(
            invocation(InvocationOrigin.LLM_TOOL, "profile"), {"account": "123"}
        )
        self.assertEqual(profile.status, ResultStatus.SUCCESS)
        self.assertEqual(profile.model_facts.facts["profile"]["account_id32"], "123")
        self.assertEqual(self.http.requests[0].path, "/api/players/123")
        self.assertEqual(self.dependencies.calls, [])

        self.http = self.scope.http = Http(
            {
                "match_id": 9001,
                "players": [
                    {
                        "account_id": None,
                        "player_slot": 0,
                        "hero_id": 1,
                        "kills": 0,
                        "deaths": 0,
                        "assists": 0,
                    }
                ],
            }
        )
        match = await self.handlers["match"].invoke(
            invocation(InvocationOrigin.LLM_TOOL, "match"), {"match_id": "9001"}
        )
        self.assertEqual(match.status, ResultStatus.SUCCESS)
        self.assertEqual(self.http.requests[0].path, "/api/matches/9001")
        self.assertIsNone(
            match.model_facts.facts["match"]["players"][0]["account_id32"]
        )

    async def test_unbound_and_rate_limit_are_clear_and_do_not_leak_source_text(self):
        self.dependencies.result = CapabilityResult(
            "identity",
            ResultStatus.ERROR,
            error=ygl.ErrorDetail(ErrorCode.UNBOUND, "unbound"),
            privacy=ygl.Privacy.PRIVATE,
        )
        unbound = await self.handlers["profile"].invoke(
            invocation(InvocationOrigin.COMMAND, "profile"), {"command": ""}
        )
        self.assertEqual(unbound.error.code, ErrorCode.UNBOUND)
        self.assertEqual(unbound.privacy, ygl.Privacy.PUBLIC)
        self.assertIn("绑定", unbound.error.message)

        self.dependencies.result = CapabilityResult(
            "identity",
            ResultStatus.SUCCESS,
            model_facts=ygl.FactDocument({"identity": {"account_id32": 123}}),
            privacy=ygl.Privacy.PRIVATE,
        )
        invalid_private_facts = await self.handlers["profile"].invoke(
            invocation(InvocationOrigin.COMMAND, "profile"), {"command": ""}
        )
        self.assertEqual(invalid_private_facts.error.code, ErrorCode.MODULE_UNAVAILABLE)
        self.assertEqual(invalid_private_facts.privacy, ygl.Privacy.PUBLIC)

        self.http = self.scope.http = Http(
            {}, status=429, headers={"Retry-After": "30"}
        )
        limited = await self.handlers["match"].invoke(
            invocation(InvocationOrigin.LLM_TOOL, "match"), {"match_id": "9001"}
        )
        self.assertEqual(limited.error.code, ErrorCode.RATE_LIMITED)
        self.assertIn("30", limited.error.message)

    def test_source_http_errors_keep_bounded_retry_after_and_classify_upstream(self):
        observed = {}

        def capture_failure(
            code, message, *, privacy=ygl.Privacy.PUBLIC, retry_after_seconds=None
        ):
            observed.update(
                code=code,
                message=message,
                privacy=privacy,
                retry_after_seconds=retry_after_seconds,
            )
            return SimpleNamespace(error=SimpleNamespace(code=code), privacy=privacy)

        rate_limited = SourceHttpError("upstream_error", status_code=429)
        rate_limited.retry_after_seconds = 120
        with patch.object(dota_module, "failure", capture_failure):
            result = dota_module._source_failure(rate_limited)
        self.assertEqual(result.error.code, ErrorCode.RATE_LIMITED)
        self.assertEqual(observed["retry_after_seconds"], 120)
        self.assertEqual(observed["privacy"], ygl.Privacy.PUBLIC)

        too_long = SourceHttpError("upstream_error", status_code=429)
        too_long.retry_after_seconds = 90_000
        with patch.object(dota_module, "failure", capture_failure):
            dota_module._source_failure(too_long)
        self.assertIsNone(observed["retry_after_seconds"])

        server_error = SourceHttpError("upstream_error", status_code=500)
        with patch.object(dota_module, "failure", capture_failure):
            result = dota_module._source_failure(server_error)
        self.assertEqual(result.error.code, ErrorCode.UPSTREAM_ERROR)

    async def test_cache_backend_failure_bypasses_but_permission_failure_is_returned(
        self,
    ):
        self.cache.error = CacheUnavailable()
        self.http = self.scope.http = Http(self._recent_payload())
        result = await self.handlers["recent"].invoke(
            invocation(InvocationOrigin.LLM_TOOL, "recent"), {"account": "123"}
        )
        self.assertEqual(result.status, ResultStatus.SUCCESS)
        self.assertEqual(len(self.http.requests), 1)

        self.cache.error = AccessDenied("access_denied")
        denied = await self.handlers["recent"].invoke(
            invocation(InvocationOrigin.LLM_TOOL, "recent"), {"account": "123"}
        )
        self.assertEqual(denied.error.code, ErrorCode.MODULE_UNAVAILABLE)

        self.cache.error = InvalidInvocation()
        invalid = await self.handlers["recent"].invoke(
            invocation(InvocationOrigin.LLM_TOOL, "recent"), {"account": "123"}
        )
        self.assertEqual(invalid.error.code, ErrorCode.MODULE_UNAVAILABLE)

    async def test_cancellation_propagates(self):
        self.http = self.scope.http = Http(self._recent_payload())
        self.http.error = asyncio.CancelledError()
        with self.assertRaises(asyncio.CancelledError):
            await self.handlers["recent"].invoke(
                invocation(InvocationOrigin.LLM_TOOL, "recent"), {"account": "123"}
            )

    async def test_lifecycle_health_and_subscription_handlers(self):
        self.assertEqual(set(self.module.handlers().collectors), {"dota2.matches"})
        self.assertEqual(set(self.module.handlers().evaluators), {"dota2.matches"})
        self.assertEqual(
            set(self.module.handlers().event_composers), {"dota2.match_report"}
        )
        self.assertTrue(
            all(
                item.status is ygl.HealthStatus.AVAILABLE
                for item in (await self.module.check_health()).capabilities.values()
            )
        )
        await self.module.stop()
        self.assertTrue(
            all(
                item.status is ygl.HealthStatus.UNAVAILABLE
                for item in (await self.module.check_health()).capabilities.values()
            )
        )

    async def _status_with_budget(self, value):
        async def budget(source_id):
            self.assertEqual(source_id, "opendota")
            if isinstance(value, Exception):
                raise value
            return value

        self.http.budget = budget
        result = await self.handlers["status"].invoke(
            invocation(InvocationOrigin.WEB_PUBLIC, "status"), {}
        )
        self.assertEqual(result.status, ResultStatus.SUCCESS)
        self.assertEqual(result.privacy, ygl.Privacy.PUBLIC)
        self.assertEqual(self.http.requests, [])
        self.assertEqual(self.dependencies.calls, [])
        text = "\n".join(
            block.text
            for block in result.document.ordered_blocks
            if isinstance(block, ygl.TextBlock)
        )
        return result, text

    async def test_public_status_document_displays_normal_shared_hour_budget(self):
        result, text = await self._status_with_budget(
            HttpBudgetStatus("opendota", 100, 7, 93)
        )
        for value in ("正常", "RPH 100", "已用 7", "剩余 93", "恢复时间 无需等待"):
            self.assertIn(value, text)
        self.assertEqual(result.model_facts.facts["opendota_budget"]["remaining"], 93)

    async def test_public_status_document_displays_exhaustion_and_recovery_time(self):
        recovery = datetime(2026, 10, 24, 23, 59, tzinfo=UTC)
        result, text = await self._status_with_budget(
            HttpBudgetStatus("opendota", 100, 100, 0, recovery)
        )
        for value in (
            "预算耗尽",
            "RPH 100",
            "已用 100",
            "剩余 0",
            recovery.isoformat(),
        ):
            self.assertIn(value, text)
        self.assertNotIn("无需等待", text)
        self.assertEqual(result.model_facts.facts["opendota_budget"]["remaining"], 0)

    async def test_public_status_document_displays_cooldown_with_remaining_budget(self):
        recovery = datetime(2026, 10, 24, 23, 59, tzinfo=UTC)
        _, text = await self._status_with_budget(
            HttpBudgetStatus("opendota", 100, 7, 93, recovery)
        )
        for value in ("来源冷却", "剩余 93", "恢复时间", recovery.isoformat()):
            self.assertIn(value, text)
        self.assertNotIn("正常", text)
        self.assertNotIn("无需等待", text)

    async def test_public_status_document_marks_missing_or_unreadable_budget_unknown(
        self,
    ):
        for value in (
            None,
            RuntimeError("private-storage-detail-must-not-leak"),
            ServiceUnavailable(),
            SimpleNamespace(requests_per_hour=100),
            HttpBudgetStatus("different", 100, 0, 100),
            HttpBudgetStatus("opendota", 100, 1, -1),
            HttpBudgetStatus("opendota", 100, 1, 99, datetime(2026, 10, 24)),
        ):
            with self.subTest(value=value):
                result, text = await self._status_with_budget(value)
                self.assertIn("RPH 未知；已用 未知；剩余 未知；恢复时间 未知", text)
                self.assertIsNone(result.model_facts.facts["opendota_budget"])
                self.assertNotIn("剩余 100", text)
                self.assertNotIn("private-storage-detail", text)

    async def test_public_status_document_does_not_invent_unknown_recovery_or_limit(
        self,
    ):
        _, exhausted = await self._status_with_budget(
            HttpBudgetStatus("opendota", 100, 100, 0)
        )
        self.assertIn("预算耗尽", exhausted)
        self.assertIn("恢复时间 未知", exhausted)
        _, unspecified = await self._status_with_budget(
            HttpBudgetStatus("opendota", None, 7, None)
        )
        self.assertIn("RPH 未知；已用 7；剩余 未知；恢复时间 未知", unspecified)


if __name__ == "__main__":
    unittest.main()

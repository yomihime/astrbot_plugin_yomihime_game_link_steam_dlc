"""Cache recovery and source-window reuse across distinct Dota projections."""

import asyncio
import unittest
from datetime import UTC, datetime, timedelta

import test_dota_next as next_fixture
import yomihime_game_link_sdk as ygl
from test_dota_next import match, recent, shown
from yomihime_game_link_sdk.contexts import InvocationOrigin
from yomihime_game_link_sdk.errors import (
    AccessDenied,
    InvalidInvocation,
    SourceHttpError,
)
from yomihime_game_link_sdk.storage import CacheEntry, CacheLookup, CacheLookupStatus

from packages.steam_dlc.dota2.module import _load_projection


class TestDotaBatchA(unittest.IsolatedAsyncioTestCase):
    asyncSetUp = next_fixture.TestDotaNext.asyncSetUp
    setup_sources = next_fixture.TestDotaNext.setup_sources
    call = next_fixture.TestDotaNext.call

    async def test_explicit_aliases_never_resolve_default_even_from_command(self):
        self.setup_sources()
        for operation in (
            "recent_explicit",
            "profile_explicit",
            "stats_explicit",
            "last_explicit",
            "match_explicit",
        ):
            result = await self.call(operation, {}, InvocationOrigin.COMMAND)
            self.assertEqual(result.error.code, ygl.ErrorCode.PARAMETER_ERROR)
        self.assertEqual(self.dependencies.calls, [])
        self.assertEqual(self.http.requests, [])

    async def test_stats_and_last_reuse_same_validated_source_window(self):
        self.setup_sources([{"match_id": 0}, *recent()], match())
        stats = await self.call("stats_explicit", {"account": "123", "limit": 20})
        last = await self.call("last_explicit", {"account": "123"})
        self.assertEqual(stats.status, ygl.ResultStatus.SUCCESS)
        self.assertEqual(last.status, ygl.ResultStatus.SUCCESS)
        self.assertEqual(len(self.http.requests), 2)
        self.assertEqual(last.model_facts.facts["selection"]["invalid_count"], 1)
        self.assertIn("缓存命中", shown(last))
        selection = self.cache.entries["opendota:last:v1:123:20"].payload["projection"]
        statistics = self.cache.entries["opendota:stats:v1:123:20"].payload[
            "projection"
        ]
        self.assertEqual(selection["fetched_at"], statistics["fetched_at"])

    async def test_different_window_expiry_and_source_failure_do_not_mix(self):
        self.setup_sources(recent(), recent(), match())
        await self.call("stats_explicit", {"account": "123", "limit": 2})
        await self.call("last_explicit", {"account": "123"})
        self.assertEqual(len(self.http.requests), 3)
        self.setup_sources(recent(), recent(), match())
        await self.call("stats_explicit", {"account": "123", "limit": 20})
        key = "opendota:window:v1:123:20"
        entry = self.cache.entries[key]
        self.cache.entries[key] = CacheEntry(
            key, entry.payload, datetime.now(UTC) - timedelta(seconds=1)
        )
        lookup = self.cache.lookup

        async def expiry(query):
            cached = self.cache.entries.get(query.key)
            if cached is not None and cached.expires_at < datetime.now(UTC):
                return CacheLookup(CacheLookupStatus.EXPIRED)
            return await lookup(query)

        self.cache.lookup = expiry
        await self.call("last_explicit", {"account": "123"})
        self.assertEqual(len(self.http.requests), 3)

    async def test_malformed_projection_recovers_once_and_overwrites(self):
        for projection in (
            {},
            {"account_id32": "123", "stats": {}},
            {"account_id32": "wrong"},
        ):
            with self.subTest(projection=projection):
                self.setup_sources(recent())
                key = "opendota:stats:v1:123:20"
                self.cache.entries[key] = CacheEntry(
                    key,
                    {"schema_version": 1, "projection": projection},
                    datetime.now(UTC) + timedelta(minutes=5),
                )
                first = await self.call("stats_explicit", {"account": "123"})
                second = await self.call("stats_explicit", {"account": "123"})
                self.assertEqual(
                    (first.status, second.status), (ygl.ResultStatus.SUCCESS,) * 2
                )
                self.assertEqual(len(self.http.requests), 1)
                self.assertIn("stats", self.cache.entries[key].payload["projection"])

    async def test_bad_window_does_not_poison_last_or_swallow_authority(self):
        self.setup_sources(recent(), match())
        key = "opendota:window:v1:123:20"
        self.cache.entries[key] = CacheEntry(
            key,
            {"schema_version": 1, "projection": {"rows": [{}]}},
            datetime.now(UTC) + timedelta(minutes=5),
        )
        result = await self.call("last_explicit", {"account": "123"})
        self.assertEqual(result.status, ygl.ResultStatus.SUCCESS)
        self.assertEqual(len(self.http.requests), 2)
        for error in (
            AccessDenied("source_revoked"),
            InvalidInvocation("expired"),
            asyncio.CancelledError(),
        ):

            async def fail(query, failure=error):
                raise failure

            self.cache.lookup = fail
            with self.assertRaises(type(error)):
                await _load_projection(self.scope, "stats", 123, 20, None)

    async def test_failed_refetch_leaves_bad_projection_a_miss(self):
        self.setup_sources()

        async def fail(request):
            raise SourceHttpError("http_status", status_code=503)

        self.http.fetch = fail
        result = await self.call("stats_explicit", {"account": "123"})
        self.assertEqual(result.status, ygl.ResultStatus.ERROR)
        self.assertEqual(result.error.code, ygl.ErrorCode.UPSTREAM_ERROR)
        self.assertEqual(self.cache.entries, {})

    async def test_unexpected_diagnostics_keep_only_operation_and_exception_type(self):
        self.setup_sources()

        async def fail(query):
            raise RuntimeError("sensitive-user-text-and-upstream-body")

        self.cache.lookup = fail
        with self.assertLogs(
            "packages.steam_dlc.dota2.module", level="WARNING"
        ) as logs:
            result = await self.call("stats_explicit", {"account": "123"})
        self.assertEqual(result.error.code, ygl.ErrorCode.MODULE_UNAVAILABLE)
        self.assertIn("operation=stats type=RuntimeError", logs.output[0])
        self.assertNotIn("sensitive", logs.output[0])


if __name__ == "__main__":
    unittest.main()

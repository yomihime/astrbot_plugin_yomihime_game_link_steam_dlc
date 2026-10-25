"""Real frozen Core public-web boundary with synthetic anonymous Steam ports."""

import json
import time
import unittest
from dataclasses import replace
from types import SimpleNamespace
from unittest.mock import AsyncMock

import test_frozen_core_consumers as core
import test_steam_wishlist as wishlist_ports
import yomihime_game_link_sdk as ygl

from packages.steam_dlc.steam.module import SteamModule


@unittest.skipUnless(core.AVAILABLE, "frozen Core source required (YGL_CORE_ROOT)")
class FrozenWishlistConsumers(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.ports = wishlist_ports.WishlistTests()
        await self.ports.asyncSetUp()
        self.dependencies = AsyncMock(side_effect=AssertionError("no default identity"))

        async def bind(context):
            self.assertIs(context.origin, ygl.InvocationOrigin.WEB_PUBLIC)
            self.assertIsNone(context.actor_id)
            self.assertIsNone(context.conversation_id)
            self.assertIsNone(context.adapter_id)
            return SimpleNamespace(
                http=self.ports.scope.http,
                cache=self.ports.scope.cache,
                dependencies=SimpleNamespace(invoke=self.dependencies),
            )

        self.module = SteamModule(
            SimpleNamespace(
                scopes=SimpleNamespace(bind=bind),
                config=SimpleNamespace(
                    current=AsyncMock(return_value=ygl.ConfigSnapshot(1, {}))
                ),
            )
        )
        manifest = core.parse_manifest(
            (core.ROOT / "packages/steam_dlc/yomihime.manifest.json").read_bytes()
        )
        lease = SimpleNamespace(
            _complete=True,
            active=True,
            _candidate=SimpleNamespace(package=SimpleNamespace(manifest=manifest)),
        )
        bindings = core.ExternalPackageHost.public_web_page_bindings(
            SimpleNamespace(_packages={"steam_dlc": lease})
        )
        self.endpoint, binding = next(
            (key, value)
            for key, value in bindings.items()
            if key == ("steam_dlc/steam", "wishlist", "wishlist_explicit")
        )
        marker = object()
        self.validator = core.HostPublicWebValidator(
            1, lambda value, generation: value is marker and generation == 1
        )
        self.validator.replace_external_bindings(
            {self.endpoint: (binding.target, binding, binding.current)}
        )
        self.validator.attach(marker)
        issuer = core.ContextIssuer(
            public_web_validator=self.validator,
            public_web_capabilities=frozenset((binding.target,)),
        )
        registry = core.Registry()
        self.lifecycle = core.LifecycleController(registry, issuer=issuer)
        steam = next(item for item in manifest.modules if item.module_id == "steam")
        registry.register_package(
            replace(manifest, modules=(steam,), module_order=("steam",)),
            {"steam": self.module.handlers()},
        )
        self.owner = "steam_dlc/steam"
        dormant = registry.snapshot().module(self.owner)
        captured = self.lifecycle.adopt_candidate(
            "steam_dlc", dormant.manifest, "wishlist-consumer-install", self.module
        )
        self.lifecycle.install_dormant(
            "steam_dlc", self.owner, "wishlist-consumer-install", self.module, captured
        )
        identity, _ = await self.lifecycle.start_candidate(
            self.owner, "wishlist-consumer-start"
        )
        self.lifecycle.publish_committed_intent(
            self.owner,
            "wishlist-consumer-start",
            identity,
            True,
            registry.snapshot().revision,
        )
        self.gateway = core.Gateway(
            registry,
            issuer,
            admission=self.lifecycle.admission,
            lifecycle=self.lifecycle,
        )

    async def asyncTearDown(self):
        self.gateway.fence_public_web()
        self.assertTrue(await self.gateway.drain_public_web(5))
        await self.lifecycle.stop(self.owner)
        self.validator.close()
        self.dependencies.assert_not_awaited()

    async def invoke(self, parameters):
        ticket = self.validator.begin(
            self.endpoint, "synthetic-wishlist-bearer", int(time.time()) + 30
        )
        try:
            result = await self.gateway.invoke_public_web(
                self.validator.mint(ticket), self.owner, "wishlist_explicit", parameters
            )
        finally:
            self.validator.revoke(ticket)
        return json.loads(json.dumps(core.project_result(result), allow_nan=False))

    def wishlist(self, response):
        return next(
            block["fields"]["wishlist"]
            for block in response["document"]["blocks"]
            if block["kind"] == "fields"
        )

    async def test_anonymous_current_page_only_price_region_and_source_time_cross_gateway(
        self,
    ):
        response = await self.invoke({"account": "1", "page": 2, "country": "CN"})
        self.assertEqual(response["status"], "success")
        data = self.wishlist(response)
        expected = [str(index) for index in range(25, 5, -1)]
        self.assertEqual([item["app_id"] for item in data["items"]], expected)
        self.assertEqual(
            (data["total"], data["page_size"], data["region"]), (45, 20, "CN")
        )
        self.assertTrue(data["fetched_at"])
        self.assertTrue(data["store_fetched_at"])
        self.assertTrue(all(item["currency"] == "CNY" for item in data["items"]))
        self.assertEqual(len(self.ports.requests), 2)
        first, prices = self.ports.requests
        self.assertEqual(first.source_id, "steam_wishlist")
        self.assertEqual(dict(first.query), {"steamid": "76561197960265729"})
        for request in self.ports.requests:
            self.assertFalse(
                {key.lower() for key in request.headers or {}}
                & {"cookie", "authorization"}
            )
            self.assertNotEqual(request.source_id, "steam_api")
        payload = json.loads(dict(prices.query)["input_json"])
        self.assertEqual([str(item["appid"]) for item in payload["ids"]], expected)
        self.assertEqual(payload["context"]["country_code"], "CN")
        await self.invoke({"account": "1", "page": 2, "country": "CN"})
        self.assertEqual(
            sum(r.source_id == "steam_browse" for r in self.ports.requests), 1
        )

    async def test_empty_private_rate_limited_failed_and_missing_account_stay_distinct(
        self,
    ):
        self.ports.raw = {"response": {"items": []}}
        empty = await self.invoke({"account": "1"})
        self.assertEqual(empty["status"], "success")
        self.assertEqual(self.wishlist(empty)["state"], "empty")
        self.ports.raw = {"response": {}}
        private = await self.invoke({"account": "1"})
        self.assertEqual(private["error"]["code"], "not_public")
        self.ports.status = 429
        limited = await self.invoke({"account": "1"})
        self.assertEqual(limited["error"]["code"], "rate_limited")
        self.ports.status = 503
        failed = await self.invoke({"account": "1"})
        self.assertEqual(failed["error"]["code"], "upstream_error")
        count = len(self.ports.requests)
        missing = await self.invoke({})
        self.assertEqual(missing["error"]["code"], "parameter_error")
        self.assertEqual(len(self.ports.requests), count)

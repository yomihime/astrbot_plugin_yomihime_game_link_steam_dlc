"""CS2 cards through the frozen production HTTP/cache/resource SDK boundaries."""

import importlib.util
import json
import sys
import tempfile
import unittest
from dataclasses import replace
from io import BytesIO
from pathlib import Path
from types import SimpleNamespace

import yomihime_game_link_sdk as ygl
from test_cs2_provider import PLAYER, profile
from test_frozen_core_consumers import AVAILABLE, CORE
from yomihime_game_link_sdk import cards
from yomihime_game_link_sdk.declarations import SourceDeclaration

from packages.steam_dlc.cs2.module import Factory

if AVAILABLE:
    from ygl_test_subject.core.contracts.validation_boundary import validate_contract
    from ygl_test_subject.core.invocation import Gateway
    from ygl_test_subject.core.registry import Registry

    # Reuse the frozen Core's real SQLite service assembly without importing its
    # top-level tests package, which would conflict with this consumer suite.
    name = "cs2_sdk_boundary_fixture"
    if name not in sys.modules:
        spec = importlib.util.spec_from_file_location(
            name, CORE / "tests/fixtures/b03_runtime.py"
        )
        assert spec is not None and spec.loader is not None
        fixture = importlib.util.module_from_spec(spec)
        sys.modules[name] = fixture
        spec.loader.exec_module(fixture)
    fixture = sys.modules[name]

PATH = "/pvp/ab/cd/" + "a" * 42 + ".png"
AVATAR = "https://img.wmpvp.com" + PATH + "?v=12345678"


@unittest.skipUnless(AVAILABLE, "frozen Core source required (YGL_CORE_ROOT)")
class RealSDKAvatarTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        from PIL import Image

        stream = BytesIO()
        Image.new("RGBA", (4, 4), (30, 80, 140, 255)).save(stream, format="PNG")
        self.png = stream.getvalue()
        self.requests = []
        registry = Registry()
        alpha = fixture._manifest("alpha")
        alpha = replace(
            alpha,
            sources=alpha.sources
            + (
                SourceDeclaration("perfect_api", "api.wmpvp.com"),
                SourceDeclaration("perfect_avatar", "img.wmpvp.com"),
            ),
            capabilities=tuple(
                replace(c, required_sources=("perfect_api", "perfect_avatar"))
                if c.capability_id == "read"
                else c
                for c in alpha.capabilities
            ),
        )
        registry.register_package(
            validate_contract(
                ygl.PackageManifest(
                    "sample",
                    "1.0.0",
                    ygl.MODULE_ABI_VERSION,
                    (alpha, fixture._manifest("beta")),
                    "tests",
                    "MIT",
                    "offline CS2 public SDK consumer",
                )
            ),
            {
                "alpha": ygl.ModuleHandlers(
                    {
                        "read": fixture._Handler(),
                        "private.read": fixture._Handler("private.read"),
                    },
                    {"account-collector": fixture._Collector()},
                    {},
                ),
                "beta": ygl.ModuleHandlers({"read": fixture._Handler()}, {}, {}),
            },
        )
        self.temp = tempfile.TemporaryDirectory()
        self.runtime = await fixture.build_runtime(
            Path(self.temp.name), registry=registry
        )
        owner = self

        class OfflineTransport:
            async def request(self, request):
                # Only the wire is synthetic. Issuer, lifecycle, declaration
                # checks, response normalization, cache and binary resources
                # remain the frozen Core production implementations.
                owner.requests.append(request)
                if request.source_id == "perfect_avatar":
                    return ygl.HttpResponse(
                        200, {"Content-Type": "image/png"}, owner.png
                    )
                payload = {"statusCode": 0, "data": {**profile(), "avatar": AVATAR}}
                return ygl.HttpResponse(200, {}, json.dumps(payload).encode())

        self.runtime.services._http_transport = OfflineTransport()
        registered = self.runtime.registry.snapshot().module("sample/alpha")
        self.view = self.runtime.issuer.issue(
            origin=ygl.InvocationOrigin.COMMAND,
            module_id="sample/alpha",
            module_epoch=registered.epoch,
            registry_revision=self.runtime.registry.snapshot().revision,
            actor_id="alice",
            conversation_id="room",
            adapter_id="test-adapter",
            capability_id="read",
        )
        self.lease = self.runtime.lifecycle.admission.admit(self.view, "read")
        services = self.runtime.services.for_module("sample/alpha")
        self.scope = await services.scopes.bind(self.view)

        async def config():
            # Credential readiness only; no real secret or injection policy is
            # needed for the synthetic provider response in this offline run.
            return ygl.ConfigSnapshot(
                1,
                {"default_platform": "perfect"},
                (
                    ygl.SecretMetadata(
                        "credential_perfect", None, 1, ygl.SecretMetadataState.ACTIVE
                    ),
                ),
            )

        self.module = await Factory().create(
            SimpleNamespace(
                scopes=services.scopes, config=SimpleNamespace(current=config)
            )
        )
        await self.module.start()

    async def asyncTearDown(self):
        self.runtime.issuer.release(self.view)
        self.runtime.lifecycle.admission.release(self.lease)
        await self.runtime.services.close_credentials()
        await self.runtime.database.executor.close(timeout=2)
        self.temp.cleanup()

    async def invoke(self):
        result = (
            await self.module.handlers()
            .capabilities["profile_explicit"]
            .invoke(self.view, {"account": PLAYER})
        )
        Gateway._valid_result(result, expected_privacy=ygl.Privacy.PUBLIC)
        self.assertIs(result.status, ygl.ResultStatus.SUCCESS)
        return result

    def image(self, result):
        images = [b for b in result.document.card.blocks if isinstance(b, cards.Image)]
        self.assertEqual(len(images), 1)
        self.assertFalse(images[0].asset.required)
        self.assertEqual(images[0].asset.content, self.png)

    async def test_actual_http_normalization_and_final_url_allow_profile_card_image(
        self,
    ):
        request = ygl.HttpRequest("perfect_avatar", PATH, query=(("v", "12345678"),))
        self.assertIsNone(request.headers)
        response = await self.scope.http.fetch(request)
        self.assertEqual(dict(request.headers), {})
        self.assertEqual(response.final_url, "https://img.wmpvp.com" + PATH)
        self.assertNotIn("?", response.final_url)
        self.assertEqual(response.body, self.png)
        result = await self.invoke()
        self.image(result)
        for sent in self.requests:
            if sent.source_id == "perfect_avatar":
                self.assertEqual(dict(sent.headers), {})
                self.assertIsNone(sent.body)
                self.assertIsNone(sent.credential_ref)

    async def test_actual_sdk_resource_cache_roundtrip_reuses_avatar_without_download(
        self,
    ):
        self.image(await self.invoke())
        # The handler binds its own scope; a later binding fences earlier
        # handles, so inspect resources through a newly current SDK scope.
        scope = await self.runtime.services.for_module("sample/alpha").scopes.bind(
            self.view
        )
        stats = await scope.resources.stats(visibility=ygl.CacheVisibility.PUBLIC)
        self.assertEqual((stats.items, stats.bytes), (1, len(self.png)))
        self.image(await self.invoke())
        self.assertEqual(
            len([r for r in self.requests if r.source_id == "perfect_avatar"]), 1
        )
        self.assertEqual(
            len([r for r in self.requests if r.source_id == "perfect_api"]), 2
        )

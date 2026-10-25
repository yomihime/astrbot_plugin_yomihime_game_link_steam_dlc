"""Synthetic CS2 profiles through the frozen public Gateway and serializer."""

import json
import time
import unittest
from dataclasses import replace
from types import SimpleNamespace
from unicodedata import category

import yomihime_game_link_sdk as ygl
from test_cs2_provider import DOMAIN, PLAYER, Http, fivee_home, profile
from test_frozen_core_consumers import AVAILABLE, ROOT
from yomihime_game_link_sdk import cards

from packages.steam_dlc.cs2.module import Factory, _result
from packages.steam_dlc.cs2.normalization import normalize_profile

if AVAILABLE:
    from ygl_test_subject.adapters.astrbot.web_public import (
        HostPublicWebValidator,
        project_result,
    )
    from ygl_test_subject.core.context_issuer import ContextIssuer
    from ygl_test_subject.core.invocation import Gateway
    from ygl_test_subject.core.lifecycle import LifecycleController
    from ygl_test_subject.core.registry import Registry
    from ygl_test_subject.extensions.disk_manifest import parse_manifest
    from ygl_test_subject.services.external_packages import ExternalPackageHost


@unittest.skipUnless(AVAILABLE, "frozen Core source required (YGL_CORE_ROOT)")
class ProfileCardGatewayTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.http = None

        async def bind(context):
            self.assertIs(context.origin, ygl.InvocationOrigin.WEB_PUBLIC)
            self.assertIsNone(context.actor_id)
            return SimpleNamespace(http=self.http)

        async def config():
            return ygl.ConfigSnapshot(
                1,
                {"default_platform": "perfect"},
                tuple(
                    ygl.SecretMetadata(alias, None, 1, ygl.SecretMetadataState.ACTIVE)
                    for alias in ("credential_perfect", "credential_fivee")
                ),
            )

        self.module = await Factory().create(
            SimpleNamespace(
                scopes=SimpleNamespace(bind=bind),
                config=SimpleNamespace(current=config),
            )
        )
        manifest = parse_manifest(
            (ROOT / "packages/steam_dlc/yomihime.manifest.json").read_bytes()
        )
        lease = SimpleNamespace(
            _complete=True,
            active=True,
            _candidate=SimpleNamespace(package=SimpleNamespace(manifest=manifest)),
        )
        bindings = ExternalPackageHost.public_web_page_bindings(
            SimpleNamespace(_packages={"steam_dlc": lease})
        )
        self.endpoint, binding = next(
            (key, value)
            for key, value in bindings.items()
            if key[0] == "steam_dlc/cs2" and key[2] == "query"
        )
        marker = object()
        self.validator = HostPublicWebValidator(
            1, lambda value, generation: value is marker and generation == 1
        )
        self.validator.replace_external_bindings(
            {self.endpoint: (binding.target, binding, binding.current)}
        )
        self.validator.attach(marker)
        issuer = ContextIssuer(
            public_web_validator=self.validator,
            public_web_capabilities=frozenset((binding.target,)),
        )
        registry = Registry()
        self.lifecycle = LifecycleController(registry, issuer=issuer)
        cs2 = next(item for item in manifest.modules if item.module_id == "cs2")
        registry.register_package(
            replace(manifest, modules=(cs2,), module_order=("cs2",)),
            {"cs2": self.module.handlers()},
        )
        self.owner = "steam_dlc/cs2"
        dormant = registry.snapshot().module(self.owner)
        captured = self.lifecycle.adopt_candidate(
            "steam_dlc", dormant.manifest, "card-install", self.module
        )
        self.lifecycle.install_dormant(
            "steam_dlc", self.owner, "card-install", self.module, captured
        )
        identity, _ = await self.lifecycle.start_candidate(self.owner, "card-start")
        self.lifecycle.publish_committed_intent(
            self.owner, "card-start", identity, True, registry.snapshot().revision
        )
        self.gateway = Gateway(
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

    async def invoke_result(self, platform, payload):
        # Only provider HTTP is synthetic. Issuance, lifecycle, admission,
        # result receiving validation and public serialization are real Core.
        self.http = Http(payload, platform)
        target = DOMAIN if platform == "5e" else PLAYER
        ticket = self.validator.begin(
            self.endpoint, "synthetic-card-consumer", int(time.time()) + 30
        )
        try:
            result = await self.gateway.invoke_public_web(
                self.validator.mint(ticket),
                self.owner,
                "query",
                {"action": "profile", "platform": platform, "account": target},
            )
        finally:
            self.validator.revoke(ticket)
        self.assertIs(result.status, ygl.ResultStatus.SUCCESS)
        self.assertIsNone(result.error)
        return result

    async def invoke_profile(self, platform, payload):
        result = await self.invoke_result(platform, payload)
        target = DOMAIN if platform == "5e" else PLAYER
        response = json.loads(json.dumps(project_result(result), allow_nan=False))
        self.assertEqual(response["status"], "success")
        self.assertIsNotNone(response["model_facts"])
        self.assertIsNotNone(result.document.card)
        self.assertFalse(
            any(isinstance(block, cards.Image) for block in result.document.card.blocks)
        )
        self.assert_card_text(result.document.card)
        display = next(
            block["fields"]["cs2"]
            for block in response["document"]["blocks"]
            if block["kind"] == "fields"
        )
        self.assertEqual(display["target"]["id"], target)
        self.assertEqual(display["data"]["account_id"], target)
        self.assertEqual(response["model_facts"]["target"]["id"], target)
        return result, response, display

    def assert_card_text(self, card):
        texts = [card.title, card.brand, *card.sources]
        texts.extend(
            block.content for block in card.blocks if isinstance(block, cards.Text)
        )
        for text in texts:
            self.assertFalse(
                any(
                    char != "\n"
                    and (category(char).startswith("C") or char in "\u2028\u2029")
                    for char in text
                ),
                repr(text),
            )

    async def test_no_avatar_unicode_profiles_keep_raw_facts_and_identity(self):
        names = (
            "Synthetic 玩家",
            "Player👩\u200d💻",
            "Player\u200bName",
            "Player\nName",
            "Player✈\ufe0f",
            "Player\x00\t\r\x85Name",
            "Player\u202e\u2066Name",
            "Player\ue000\u0378Name",
            "Player\u2028\u2029Name",
        )
        for platform in ("perfect", "official", "5e"):
            for nickname in names:
                with self.subTest(platform=platform, nickname=repr(nickname)):
                    payload = fivee_home() if platform == "5e" else profile()
                    if platform == "5e":
                        payload["user"]["username"] = nickname
                    else:
                        payload["name"] = payload["nickName"] = nickname
                    result, response, display = await self.invoke_profile(
                        platform, payload
                    )
                    self.assertEqual(display["data"]["nickname"], nickname)
                    self.assertEqual(
                        response["model_facts"]["data"]["nickname"], nickname
                    )
                    self.assertTrue(
                        any(
                            nickname in block.text
                            for block in result.document.ordered_blocks
                            if isinstance(block, ygl.TextBlock)
                        )
                    )
                    if nickname in (names[0], names[3], names[4]):
                        self.assertTrue(
                            any(
                                nickname in block.content
                                for block in result.document.card.blocks
                                if isinstance(block, cards.Text)
                            )
                        )

    async def test_rank_and_season_use_card_adapter_without_changing_source_fields(
        self,
    ):
        value = "Synthetic\u200d\u200b\u2028\x00值"
        perfect = {**profile(), "seasonId": value}
        result, response, display = await self.invoke_profile("perfect", perfect)
        self.assertEqual(display["season"], value)
        self.assertEqual(response["model_facts"]["season"], value)
        fivee = fivee_home()
        fivee["season_data"]["season_list"][0]["level_name"] = value
        result, response, display = await self.invoke_profile("5e", fivee)
        self.assertEqual(display["data"]["rank"]["value"], value)
        self.assertEqual(response["model_facts"]["data"]["rank"]["value"], value)

    def test_card_title_and_source_also_cross_real_receiving_contract(self):
        title = "Synthetic\u200d\u200b\u2028\x00值✈\ufe0f"
        projection = normalize_profile(profile(), PLAYER)
        result = Gateway._valid_result(
            _result(title, projection, ("Synthetic\n玩家",)),
            expected_privacy=ygl.Privacy.PUBLIC,
        )
        self.assert_card_text(result.document.card)
        self.assertIn("值✈\ufe0f", result.document.card.title)
        response = json.loads(json.dumps(project_result(result), allow_nan=False))
        self.assertEqual(response["status"], "success")
        self.assertIn(title, response["document"]["title"])

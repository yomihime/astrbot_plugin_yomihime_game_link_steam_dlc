"""Controlled CS2 image requests and handler results at the frozen SDK boundary."""

import asyncio
import json
import unittest
from datetime import UTC, datetime, timedelta
from io import BytesIO
from pathlib import Path
from types import SimpleNamespace

import yomihime_game_link_sdk as ygl
from test_cs2_module import identity_result, invocation
from test_cs2_provider import DOMAIN, PLAYER, fivee_home, profile
from test_frozen_core_consumers import AVAILABLE
from yomihime_game_link_sdk import cards

from packages.steam_dlc.cs2.avatar import MAX_BYTES, avatar_asset, avatar_request
from packages.steam_dlc.cs2.module import Factory

if AVAILABLE:
    from ygl_test_subject.adapters.astrbot.web_public import project_result
    from ygl_test_subject.core.invocation import Gateway
    from ygl_test_subject.presentation.card_bitmap import BitmapUnavailable
    from ygl_test_subject.presentation.layout_assets import rasterize_asset

PATH = "/pvp/ab/cd/" + "a" * 40 + ".png"
AVATAR = "https://img.wmpvp.com" + PATH + "?v=12345678"


@unittest.skipUnless(AVAILABLE, "frozen Core source required (YGL_CORE_ROOT)")
class AvatarTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        from PIL import Image

        output = BytesIO()
        Image.new("RGBA", (4, 4), (80, 100, 120, 255)).save(output, format="PNG")
        self.png = output.getvalue()
        self.image_body, self.media, self.image_status = self.png, "image/png", 200
        self.avatar_url, self.image_error = AVATAR, None
        self.final_url, self.read_error = None, None
        self.requests, self.contexts, self.dependencies = [], [], []
        self.entries, self.resources, self.writes = {}, {}, []
        self.cache_unavailable = False

        async def fetch(request):
            self.requests.append(request)
            if request.source_id == "perfect_avatar":
                if self.image_error is not None:
                    raise self.image_error
                return ygl.HttpResponse(
                    self.image_status,
                    {"Content-Type": self.media},
                    self.image_body,
                    final_url=self.final_url,
                )
            if request.source_id == "fivee_api":
                body = fivee_home()
                body["user"]["avatar_url"] = self.avatar_url
                envelope = {"errcode": 0, "success": True, "data": body}
            else:
                body = {**profile(), "avatar": self.avatar_url, "pwRating": 0.0}
                envelope = {"statusCode": 0, "data": body}
            return ygl.HttpResponse(200, {}, json.dumps(envelope).encode())

        async def lookup(query):
            self.assertEqual(query.visibility, ygl.CacheVisibility.PUBLIC)
            if self.cache_unavailable:
                raise ygl.CacheUnavailable()
            entry = self.entries.get(query.key)
            return ygl.CacheLookup(
                ygl.CacheLookupStatus.HIT if entry else ygl.CacheLookupStatus.MISS,
                entry,
            )

        async def put(key, payload, **kwargs):
            self.assertEqual(kwargs["visibility"], ygl.CacheVisibility.PUBLIC)
            if self.cache_unavailable:
                raise ygl.CacheUnavailable()
            self.entries[key] = ygl.CacheEntry(
                key, payload, datetime.now(UTC) + timedelta(days=1)
            )

        async def read(asset_id, **kwargs):
            self.assertEqual(kwargs["visibility"], ygl.CacheVisibility.PUBLIC)
            if self.read_error:
                raise self.read_error
            if asset_id not in self.resources:
                raise FileNotFoundError()
            return self.resources[asset_id]

        async def store(media, content, **kwargs):
            self.assertEqual(media, "image/png")
            self.assertEqual(kwargs["visibility"], ygl.CacheVisibility.PUBLIC)
            self.assertEqual(kwargs["cache_class"], ygl.ResourceCacheClass.RAW)
            # The harness retains the Host's actual decoder, rather than
            # accepting a PNG signature as proof of a valid image.
            try:
                raster = rasterize_asset(cards.Asset("png", content), 96, 96, "#ffffff")
                raster.close()
            except BitmapUnavailable:
                raise ygl.ParameterError("parameters are invalid") from None
            asset_id = "synthetic-avatar"
            self.resources[asset_id] = content
            self.writes.append(kwargs)
            return SimpleNamespace(asset_id=asset_id)

        async def dependency(context, reference, parameters):
            self.dependencies.append(reference)
            return identity_result()

        self.scope = SimpleNamespace(
            http=SimpleNamespace(fetch=fetch),
            cache=SimpleNamespace(lookup=lookup, put=put),
            resources=SimpleNamespace(store=store, read=read),
            dependencies=SimpleNamespace(invoke=dependency),
        )

        async def bind(context):
            self.contexts.append(context)
            return self.scope

        async def config():
            return ygl.ConfigSnapshot(
                1,
                {"default_platform": "perfect"},
                tuple(
                    ygl.SecretMetadata(name, None, 1, ygl.SecretMetadataState.ACTIVE)
                    for name in ("credential_perfect", "credential_fivee")
                ),
            )

        self.module = await Factory().create(
            SimpleNamespace(
                scopes=SimpleNamespace(bind=bind),
                config=SimpleNamespace(current=config),
            )
        )
        await self.module.start()

    async def invoke(self, capability="profile_explicit", parameters=None):
        parameters = {"account": PLAYER} if parameters is None else parameters
        origin = (
            ygl.InvocationOrigin.WEB_PUBLIC
            if capability == "query"
            else ygl.InvocationOrigin.COMMAND
        )
        context = invocation(
            capability, origin, actor_id=None if capability == "query" else "actor"
        )
        result = (
            await self.module.handlers()
            .capabilities[capability]
            .invoke(context, parameters)
        )
        expected = ygl.Privacy.PRIVATE if not parameters else ygl.Privacy.PUBLIC
        checked = Gateway._valid_result(result, expected_privacy=expected)
        self.assertIs(checked.status, ygl.ResultStatus.SUCCESS)
        return result

    def images(self, result):
        return [b for b in result.document.card.blocks if isinstance(b, cards.Image)]

    def assert_text_and_metrics(self, result):
        text = "\n".join(
            b.text
            for b in result.document.ordered_blocks
            if isinstance(b, ygl.TextBlock)
        )
        self.assertIn("Synthetic", text)
        self.assertIn("完美平台", text)
        self.assertIn("perfect_pvp_rank", text)
        self.assertIn("rating=1.2", text)
        self.assertIn("pw_rating=0.0", text)
        projection = result.document.ordered_blocks[-1].fields["cs2"]
        metrics = projection["data"]["metrics"]
        self.assertEqual(metrics["matches"], 0)
        self.assertEqual(metrics["rating"], "1.2")
        self.assertEqual(metrics["pw_rating"], "0.0")
        self.assertIsNone(metrics["adr"])
        self.assertEqual(
            tuple(
                b.content
                for b in result.document.card.blocks
                if isinstance(b, cards.Text)
            ),
            tuple(
                b.text
                for b in result.document.ordered_blocks
                if isinstance(b, ygl.TextBlock)
            ),
        )

    async def test_profile_handlers_and_page_query_keep_context_and_original_data(self):
        for capability in ("profile", "profile_explicit", "query"):
            with self.subTest(capability=capability):
                self.entries.clear()
                self.requests.clear()
                parameters = {"account": PLAYER}
                if capability == "query":
                    parameters["action"] = "profile"
                result = await self.invoke(capability, parameters)
                self.assert_text_and_metrics(result)
                self.assertEqual(self.contexts[-1].capability_id, capability)
                self.assertEqual(len(self.requests), 2)
                image = self.images(result)[0]
                self.assertEqual(image.asset.content, self.png)
                self.assertFalse(image.asset.required)
                self.assertIs(result.privacy, ygl.Privacy.PUBLIC)
                self.assertEqual(
                    result.model_facts.facts["data"]["metrics"]["rating"], 1.2
                )
                projected = project_result(result)
                self.assertEqual(projected["status"], "success")
                request = self.requests[-1]
                self.assertEqual(request.source_id, "perfect_avatar")
                self.assertEqual(request.path, PATH)
                self.assertEqual(request.query, (("v", "12345678"),))
                self.assertIsNone(request.headers)
                self.assertIsNone(request.body)

    async def test_default_avatar_preserves_private_document_and_absent_model_facts(
        self,
    ):
        result = await self.invoke("profile", {})
        self.assertIs(result.privacy, ygl.Privacy.PRIVATE)
        self.assertIs(result.document.privacy, ygl.Privacy.PRIVATE)
        self.assertIsNone(result.model_facts)
        self.assertEqual(len(self.dependencies), 1)
        self.assertEqual(len(self.images(result)), 1)
        self.assert_text_and_metrics(result)

    async def test_missing_unknown_and_fivee_avatars_never_request_cdn(self):
        for url in (None, "https://unknown.invalid/avatar.png"):
            self.avatar_url = url
            self.requests.clear()
            result = await self.invoke()
            self.assert_text_and_metrics(result)
            self.assertFalse(self.images(result))
            self.assertEqual(len(self.requests), 1)
        self.avatar_url = AVATAR
        self.requests.clear()
        result = await self.invoke(parameters={"account": DOMAIN, "platform": "5e"})
        self.assertFalse(self.images(result))
        self.assertEqual([r.source_id for r in self.requests], ["fivee_api"])

    async def test_official_profile_reuses_approved_origin_and_stats_does_not_fetch_image(
        self,
    ):
        result = await self.invoke(
            parameters={"account": PLAYER, "platform": "official"}
        )
        self.assertEqual(len(self.images(result)), 1)
        self.assertEqual(self.requests[-1].source_id, "perfect_avatar")
        self.requests.clear()
        result = await self.invoke("stats_explicit")
        self.assertIsNone(result.document.card)
        self.assertEqual(len(self.requests), 1)

    async def test_denied_timeout_and_upstream_failures_preserve_text(self):
        for error in (
            ygl.AccessDenied("source_revoked"),
            ygl.InvalidInvocation(),
            ygl.OperationTimeout(),
            ygl.ServiceUnavailable(),
            ygl.SourceHttpError("redirect_disallowed"),
        ):
            with self.subTest(error=type(error).__name__):
                self.image_error = error
                result = await self.invoke()
                self.assertFalse(self.images(result))
                self.assert_text_and_metrics(result)

    async def test_bad_format_mime_dimensions_size_and_decoder_failures_degrade(self):
        too_wide = self.png[:16] + (2049).to_bytes(4, "big") + self.png[20:]
        for body, media in (
            (b"not an image", "image/png"),
            (self.png, "image/jpeg"),
            (too_wide, "image/png"),
            (self.png + b"x" * MAX_BYTES, "image/png"),
            (self.png[:33], "image/png"),
        ):
            with self.subTest(size=len(body), media=media):
                self.image_body, self.media = body, media
                result = await self.invoke()
                self.assertFalse(self.images(result))
                self.assert_text_and_metrics(result)
        self.assertFalse(self.entries)
        self.assertFalse(self.writes)
        self.image_body, self.media, self.image_status = self.png, "image/png", 302
        result = await self.invoke()
        self.assertFalse(self.images(result))
        self.assert_text_and_metrics(result)

    async def test_public_sdk_cache_reuses_validated_bytes_and_recovers_missing_resource(
        self,
    ):
        first = await self.invoke()
        self.assertEqual(len(self.writes), 1)
        self.requests.clear()
        second = await self.invoke()
        self.assertEqual(self.images(first), self.images(second))
        self.assertEqual(len(self.requests), 1)
        self.resources.clear()
        self.requests.clear()
        third = await self.invoke()
        self.assertEqual(len(self.images(third)), 1)
        self.assertEqual(len(self.requests), 2)

    async def test_malformed_cache_values_and_resource_failures_refetch_optional_avatar(
        self,
    ):
        await self.invoke()
        key = next(iter(self.entries))
        for payload in (None, [], "bad", {"asset_id": 9}):
            with self.subTest(payload=payload):
                self.entries[key] = SimpleNamespace(payload=payload)
                self.requests.clear()
                result = await self.invoke()
                self.assertEqual(len(self.images(result)), 1)
                self.assertEqual(len(self.requests), 2)
                self.assert_text_and_metrics(result)
        for error in (ygl.ParameterError(), ygl.ServiceUnavailable()):
            with self.subTest(error=type(error).__name__):
                self.read_error = error
                self.requests.clear()
                result = await self.invoke()
                self.assertEqual(len(self.images(result)), 1)
                self.assertEqual(len(self.requests), 2)

    async def test_unexpected_final_url_is_rejected_without_redirect_followup(self):
        for final_url in (
            "https://unknown.invalid" + PATH,
            "https://img.wmpvp.com" + PATH + "?v=999",
        ):
            self.final_url = final_url
            self.requests.clear()
            result = await self.invoke()
            self.assertFalse(self.images(result))
            self.assert_text_and_metrics(result)
            self.assertEqual(len(self.requests), 2)

    async def test_cache_outage_does_not_lose_avatar_or_text_and_cancellation_propagates(
        self,
    ):
        self.cache_unavailable = True
        result = await self.invoke()
        self.assertEqual(len(self.images(result)), 1)
        self.assert_text_and_metrics(result)
        self.image_error = asyncio.CancelledError()
        with self.assertRaises(asyncio.CancelledError):
            await avatar_asset(self.scope, AVATAR)

    def test_url_inputs_reject_escapes_credentials_ports_queries_and_fragments(self):
        for url in (
            "http://img.wmpvp.com" + PATH,
            "https://img.wmpvp.com.evil.invalid" + PATH,
            "https://user:secret@img.wmpvp.com" + PATH,
            "https://img.wmpvp.com:8443" + PATH,
            "https://img.wmpvp.com:443" + PATH,
            "https://img.wmpvp.com" + PATH + "?token=secret",
            "https://img.wmpvp.com" + PATH + "?v=1&token=secret",
            "https://img.wmpvp.com" + PATH + "?v=1&v=2",
            "https://img.wmpvp.com" + PATH + "?v=%31",
            "https://img.wmpvp.com" + PATH + "#fragment",
            "https://img.wmpvp.com/pvp/ab/cd/../" + "a" * 40 + ".png",
            "https://img.wmpvp.com" + PATH.replace("/ab/", "/%61b/"),
            "https://img.wmpvp.com" + PATH + "\n",
            "https://img.wmpvp.com" + PATH + "?v=" + "1" * 21,
        ):
            with self.subTest(url=url):
                self.assertIsNone(avatar_request(url))
        request = avatar_request("https://img.wmpvp.com" + PATH)
        self.assertEqual(request.query, ())

    def test_manifest_authorizes_only_profile_contexts_and_never_injects_cdn_credentials(
        self,
    ):
        package = Path(__file__).resolve().parents[1] / "packages/steam_dlc"
        manifest = json.loads((package / "yomihime.manifest.json").read_text("utf-8"))
        module = next(m for m in manifest["modules"] if m["module_id"] == "cs2")
        source = next(
            s for s in module["sources"] if s["source_id"] == "perfect_avatar"
        )
        self.assertEqual(
            source,
            {
                "source_id": "perfect_avatar",
                "host": "img.wmpvp.com",
                "timeout_seconds": 8,
                "requests_per_minute": 30,
            },
        )
        contexts = {
            c["capability_id"]
            for c in module["capabilities"]
            if "perfect_avatar" in c.get("required_sources", ())
        }
        self.assertEqual(contexts, {"profile", "profile_explicit", "query"})
        policy = json.loads(
            (package / "yomihime.source-policy.json").read_text("utf-8")
        )
        self.assertLessEqual(
            set(policy),
            {
                "schema_version",
                "credentials",
                "authorizations",
                "config_migrations",
                "capability_timeouts",
            },
        )
        self.assertFalse(
            any(
                credential["source"] == "perfect_avatar"
                for credential in policy["credentials"]
            )
        )

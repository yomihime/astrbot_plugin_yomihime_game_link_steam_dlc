"""Synthetic Steam source, privacy, cache and optional Web API contracts."""

import asyncio
import copy
import json
import struct
import unittest
import zlib
from dataclasses import replace
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace

import yomihime_game_link_sdk as ygl
from yomihime_game_link_sdk.errors import CacheUnavailable
from yomihime_game_link_sdk.storage import CacheLookup, CacheLookupStatus

from packages.steam_dlc.steam import normalization as norm
from packages.steam_dlc.steam import queries, webapi
from packages.steam_dlc.steam.module import Factory

SID = "76561197960265729"
OTHER = "76561197960265730"


def profile_html(sid=SID, level="23", count=3):
    rows = "".join(
        f'<div class="recent_game"><div class="game_info_details">1,234.5 hrs on record<br>last played on 1 Oct</div>'
        f'<div class="game_name"><a href="https://store.steampowered.com/app/{570 + i}/">Game &lt;b&gt;{i}&lt;/b&gt;</a></div></div>'
        for i in range(count)
    )
    return (
        "<html><script>g_rgProfileData = "
        + json.dumps({"steamid": sid, "personaname": "Synthetic [gold]"})
        + ";</script>"
        '<span class="actual_persona_name">Synthetic [gold]</span>'
        f'<div class="persona_level"><span class="friendPlayerLevelNum">{level}</span></div>'
        '<span class="friendPlayerLevelNum">9999</span>'
        '<div class="playerAvatarAutoSizeInner"><img src="https://avatars.steamstatic.com/'
        + "a" * 40
        + '_full.jpg"></div>'
        + rows
        + "</html>"
    )


def legacy_xml(sid=SID, count=5):
    rows = "".join(
        f"<mostPlayedGame><gameName>Legacy{i}</gameName><gameLink>https://steamcommunity.com/app/{570 + i}</gameLink>"
        "<hoursPlayed>1.5</hoursPlayed><hoursOnRecord>3,999.25</hoursOnRecord></mostPlayedGame>"
        for i in range(count)
    )
    return (
        f"<profile><steamID64>{sid}</steamID64><steamID>Synthetic</steamID><steamRating>10</steamRating>"
        "<privacyState>public</privacyState><hoursPlayed2Wk>0</hoursPlayed2Wk><mostPlayedGames>"
        + rows
        + "</mostPlayedGames></profile>"
    ).encode()


def app_json(target="620", **updates):
    data = {
        "steam_appid": int(target),
        "name": "Synthetic Game",
        "type": "game",
        "is_free": False,
        "price_overview": {
            "currency": "USD",
            "initial": 999,
            "final": 499,
            "discount_percent": 50,
            "final_formatted": "$4.99",
        },
        "release_date": {"coming_soon": False, "date": "Apr 18, 2011"},
        "developers": ["Synthetic Dev"],
        "publishers": ["Synthetic Pub"],
    }
    data.update(updates)
    return {target: {"success": True, "data": data}}


REVIEW_HTML = '<a href="https://store.steampowered.com/app/620/">App</a><a class="user_reviews_summary_row" data-tooltip-html="90% of 10 reviews in English are positive."><div class="subtitle column">English Reviews:</div><span class="game_review_summary positive">Very Positive</span></a>'


class NormalizationTests(unittest.TestCase):
    def test_profile_real_level_not_unrelated_badge_and_hours_precision(self):
        result = norm.normalize_profile(profile_html(), SID)
        self.assertEqual(result["profile"]["level"], 23)
        self.assertEqual(len(result["games"]), 3)
        row = result["games"][0]
        self.assertEqual(row["hours_on_record"], "1234.5")
        self.assertIsNone(row["hours_recent"])
        self.assertEqual(row["availability"]["hours_recent"], "not_provided")
        self.assertFalse(result["complete_library"])
        self.assertFalse(result["complete_recent_period"])
        self.assertEqual(row["name"], "Game <b>0</b>")

    def test_identity_mismatch_and_login_wall_rejected(self):
        with self.assertRaises(ValueError):
            norm.normalize_profile(profile_html(OTHER), SID)
        with self.assertRaises(PermissionError):
            norm.normalize_profile("<title>Sign In</title>", SID)
        with self.assertRaises(ValueError):
            norm.normalize_profile("<html>No identity</html>", SID)

    def test_private_and_missing_level_are_not_zero(self):
        with self.assertRaises(PermissionError):
            norm.normalize_profile(
                profile_html() + '<div class="profile_private_info">private</div>', SID
            )
        result = norm.normalize_profile(profile_html(level="unknown", count=0), SID)
        self.assertIsNone(result["profile"]["level"])
        self.assertEqual(result["availability"]["games"], "not_provided")

    def test_legacy_sample_scope_and_rating_not_level(self):
        result = norm.normalize_legacy(legacy_xml(count=7), SID)
        self.assertEqual(len(result["games"]), 5)
        self.assertEqual(result["sample_kind"], "legacy_most_played_games")
        self.assertIsNone(result["profile"]["level"])
        self.assertIsNone(result["aggregate_hours_2wk"])
        self.assertEqual(result["games"][0]["hours_on_record"], "3999.25")
        self.assertFalse(result["complete_library"])
        with self.assertRaises(ValueError):
            norm.normalize_legacy(legacy_xml(OTHER), SID)
        with self.assertRaises(ValueError):
            norm.normalize_legacy(
                b'<!DOCTYPE profile [<!ENTITY x "evil">]><profile/>', SID
            )

    def test_malformed_legacy_is_a_controlled_parse_failure(self):
        with self.assertRaises(ValueError):
            norm.normalize_legacy(b"<profile>", SID)

    def test_public_final_url_metadata_accepts_only_declared_origin_page_kind(self):
        raw = SimpleNamespace(
            final_url="https://steamcommunity.com/id/synthetic_name/?l=english"
        )
        queries.validate_final_url(raw, "steam_community", f"/profiles/{SID}/")
        for url in (
            "http://steamcommunity.com/id/synthetic/",
            "https://evil.example/id/synthetic/",
            "https://steamcommunity.com/login/",
            "https://steamcommunity.com/profiles/" + OTHER + "/",
            "https://user@steamcommunity.com/id/synthetic/",
            "https://steamcommunity.com:8443/id/synthetic/",
        ):
            with self.assertRaises(queries.QueryFailure):
                queries.validate_final_url(
                    SimpleNamespace(final_url=url),
                    "steam_community",
                    f"/profiles/{SID}/",
                )

    def test_search_candidates_are_bounded_apps_and_not_false_ids(self):
        result = norm.normalize_search(
            {
                "total": 100,
                "items": [
                    {"id": 620 + i, "type": "app", "name": "Game"} for i in range(15)
                ],
            }
        )
        self.assertEqual(len(result["candidates"]), 10)
        self.assertIsInstance(result["candidates"][0]["app_id"], str)
        self.assertEqual(
            norm.normalize_search({"items": [{"id": True, "type": "app"}]})[
                "candidates"
            ],
            [],
        )

    def test_store_price_free_unreleased_absent_and_zero_are_distinct(self):
        priced = norm.normalize_app(app_json(), "620")
        self.assertEqual(
            (priced["price_state"], priced["final_minor"], priced["currency"]),
            ("priced", 499, "USD"),
        )
        for updates, state in (
            ({"is_free": True, "price_overview": None}, "free"),
            (
                {"price_overview": None, "release_date": {"coming_soon": True}},
                "unreleased",
            ),
            ({"price_overview": None}, "no_local_price"),
            ({"price_overview": {"final": 0, "currency": "USD"}}, "priced"),
        ):
            self.assertEqual(
                norm.normalize_app(app_json(**updates), "620")["price_state"], state
            )
        with self.assertRaises(LookupError):
            norm.normalize_app({"620": {"success": False}}, "620")
        with self.assertRaises(ValueError):
            norm.normalize_app(app_json(steam_appid=570), "620")

    def test_reviews_keep_exact_scope_and_literal_names(self):
        result = norm.normalize_reviews(REVIEW_HTML, "620")
        self.assertEqual(result[0]["scope"], "English Reviews:")
        self.assertIn("in English", result[0]["description"])
        with self.assertRaises(ValueError):
            norm.normalize_reviews(REVIEW_HTML, "570")
        self.assertEqual(norm.literal("bad\x00 [gold] name"), "bad [gold] name")

    def test_image_urls_and_budget_headers_are_bounded(self):
        good = "https://avatars.steamstatic.com/" + "a" * 40 + "_full.jpg"
        self.assertIsNotNone(queries.image_request(good, "profile", SID))
        for url in (
            good.replace("https:", "http:"),
            good.replace("avatars.steamstatic.com", "evil.example"),
            good + "?key=x",
            "https://u:p@avatars.steamstatic.com/" + "a" * 40 + ".jpg",
            good + "#x",
        ):
            self.assertIsNone(queries.image_request(url, "profile", SID))
        store = (
            "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/620/"
            + "a" * 40
            + "/header.jpg?t=123"
        )
        self.assertIsNotNone(queries.image_request(store, "app", "620"))
        self.assertIsNone(queries.image_request(store, "app", "570"))
        png = (
            b"\x89PNG\r\n\x1a\n"
            + b"\0\0\0\rIHDR"
            + (10).to_bytes(4, "big")
            + (20).to_bytes(4, "big")
        )
        self.assertEqual(queries._dimensions(png, "image/png"), (10, 20))
        self.assertIsNone(queries._dimensions(b"HTML", "image/png"))


class _Cache:
    def __init__(self):
        self.rows, self.puts = {}, []
        self.unavailable = False

    async def lookup(self, query):
        if self.unavailable:
            raise CacheUnavailable()
        payload = self.rows.get((query.key, query.visibility))
        return (
            CacheLookup(CacheLookupStatus.MISS)
            if payload is None
            else CacheLookup(
                CacheLookupStatus.HIT,
                ygl.CacheEntry(
                    query.key, payload, datetime.now(UTC) + timedelta(minutes=5)
                ),
            )
        )

    async def put(self, key, payload, *, ttl_seconds, visibility=None):
        if self.unavailable:
            raise CacheUnavailable()
        self.rows[key, visibility] = copy.deepcopy(payload)
        self.puts.append((key, visibility))


class _HTTP:
    def __init__(self):
        self.calls, self.override, self.block_images = [], None, True

    async def fetch(self, request):
        self.calls.append(request)
        if self.override:
            return self.override(request)
        if request.source_id in ("steam_avatar", "steam_store_image"):
            raise ygl.SourceHttpError("transport_failed")
        if request.path == "/api/storesearch/":
            return response(
                {
                    "total": 2,
                    "items": [
                        {"id": 620, "name": "Game A", "type": "app"},
                        {"id": 570, "name": "Game B", "type": "app"},
                    ],
                }
            )
        if request.path == "/api/appdetails":
            return response(app_json(dict(request.query)["appids"]))
        if request.path.startswith("/app/"):
            return response(REVIEW_HTML, "text/html")
        if dict(request.query).get("xml") == "1":
            return response(legacy_xml(), "text/xml")
        return response(profile_html(), "text/html")


def response(value, media="application/json", status=200):
    body = (
        value
        if isinstance(value, bytes)
        else value.encode()
        if isinstance(value, str)
        else json.dumps(value).encode()
    )
    return ygl.HttpResponse(status, {"Content-Type": media}, body)


class _Scopes:
    def __init__(self):
        self.http, self.cache, self.binds, self.record_reads = _HTTP(), _Cache(), 0, 0
        self.row = ygl.VersionedRecord(
            "default", 3, {"steam_id64": SID, "association": "self_asserted"}
        )

    async def bind(self, context):
        self.binds += 1

        async def collection(name):
            if name != "binding":
                raise AssertionError(name)

            async def get(key):
                self.record_reads += 1
                return self.row if context.actor_id == "alice" else None

            return SimpleNamespace(get=get)

        return SimpleNamespace(
            http=self.http,
            cache=self.cache,
            records=SimpleNamespace(collection=collection),
        )


class QueryTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.scopes = _Scopes()
        self.module = await Factory().create(SimpleNamespace(scopes=self.scopes))
        await self.module.start()
        self.context = ygl.InvocationView(
            "steam-test",
            ygl.InvocationOrigin.COMMAND,
            "alice",
            "dm",
            "steam_dlc/steam",
            1,
            1,
            adapter_id="test",
        )

    async def call(self, operation, parameters=None, context=None):
        return (
            await self.module.handlers()
            .capabilities[operation]
            .invoke(context or self.context, parameters or {})
        )

    async def test_tool_requires_explicit_account_without_records_or_http(self):
        for operation in ("profile", "recent", "games", "profile_explicit"):
            result = await self.call(
                operation,
                context=replace(self.context, origin=ygl.InvocationOrigin.LLM_TOOL),
            )
            self.assertEqual(result.error.code, ygl.ErrorCode.PARAMETER_ERROR)
        self.assertEqual(self.scopes.binds, 0)
        self.assertEqual(self.scopes.http.calls, [])

    async def test_default_query_public_contract_facts_none_identity_stays_private(
        self,
    ):
        for operation in ("profile", "recent", "games"):
            result = await self.call(operation, {"command": ""})
            self.assertIsNone(result.model_facts)
            self.assertEqual(result.privacy, ygl.Privacy.PUBLIC)
            self.assertEqual(result.document.privacy, ygl.Privacy.PUBLIC)
            self.assertIsNotNone(result.document.card)
        other = await self.call(
            "profile", context=replace(self.context, actor_id="bob")
        )
        self.assertEqual(other.error.code, ygl.ErrorCode.UNBOUND)
        self.assertEqual(other.privacy, ygl.Privacy.PUBLIC)
        self.assertIsNone(other.model_facts)
        identity = await self.call("identity")
        self.assertEqual(identity.privacy, ygl.Privacy.PRIVATE)
        self.assertEqual(identity.document.privacy, ygl.Privacy.PRIVATE)
        self.assertIsNone(identity.model_facts)

    async def test_derived_command_and_explicit_capability_never_default(self):
        for context, name in (
            (replace(self.context, parent_id="parent"), "profile"),
            (self.context, "profile_explicit"),
        ):
            result = await self.call(name, context=context)
            self.assertEqual(result.error.code, ygl.ErrorCode.PARAMETER_ERROR)
        self.assertEqual(self.scopes.record_reads, 0)

    async def test_explicit_id32_same_facts_projection_and_literal_fallback(self):
        context = replace(self.context, origin=ygl.InvocationOrigin.LLM_TOOL)
        result = await self.call("recent_explicit", {"account": "1"}, context)
        facts = result.model_facts.facts
        self.assertEqual(facts["target"], SID)
        self.assertEqual(facts["data"]["profile"]["steam_id64"], SID)
        self.assertEqual(facts["region"], "GLOBAL")
        self.assertEqual(facts["language"], "english")
        self.assertEqual(self.scopes.record_reads, 0)
        self.assertIn(
            "1234.5", " ".join(block.text for block in result.document.ordered_blocks)
        )
        self.assertFalse(
            any(
                isinstance(block.content, ygl.cards.TaggedText)
                for block in result.document.card.blocks
                if isinstance(block, ygl.cards.Text)
            )
        )

    async def test_account_url_and_malformed_inputs_fail_before_network(self):
        tool = replace(self.context, origin=ygl.InvocationOrigin.LLM_TOOL)
        for account in (
            "https://steamcommunity.com/profiles/" + SID,
            "0",
            "01",
            OTHER + "x",
            True,
        ):
            result = await self.call("profile_explicit", {"account": account}, tool)
            self.assertEqual(result.error.code, ygl.ErrorCode.PARAMETER_ERROR)
        self.assertEqual(self.scopes.http.calls, [])

    async def test_search_selection_and_numeric_app_lookup(self):
        result = await self.call(
            "search", {"query": "Portal --country US --language english"}
        )
        self.assertEqual(result.status, ygl.ResultStatus.NEEDS_SELECTION)
        self.assertIn(
            "/ygl steam app 620",
            " ".join(b.text for b in result.document.ordered_blocks),
        )
        result = await self.call("search", {"query": "620"})
        self.assertEqual(result.model_facts.facts["operation"], "app")
        self.assertEqual(self.scopes.record_reads, 0)

    async def test_cache_preserves_time_region_language_and_repairs_corruption(self):
        first = await self.call(
            "app", {"app_id": "620", "country": "US", "language": "english"}
        )
        count = len(self.scopes.http.calls)
        second = await self.call(
            "app", {"app_id": "620", "country": "US", "language": "english"}
        )
        self.assertEqual(len(self.scopes.http.calls), count)
        self.assertEqual(second.model_facts.facts["cache"]["status"], "hit")
        self.assertEqual(
            first.model_facts.facts["fetched_at"],
            second.model_facts.facts["fetched_at"],
        )
        await self.call(
            "app", {"app_id": "620", "country": "CN", "language": "schinese"}
        )
        self.assertGreater(len(self.scopes.http.calls), count)
        key = queries.cache_key("app", "620", "US", "english")
        self.scopes.cache.rows[key, ygl.CacheVisibility.PUBLIC]["data"] = {}
        repaired = await self.call(
            "app", {"app_id": "620", "country": "US", "language": "english"}
        )
        self.assertEqual(repaired.model_facts.facts["data"]["app_id"], "620")
        self.assertEqual(repaired.model_facts.facts["cache"]["status"], "rejected")

    async def test_optional_reviews_and_image_failure_preserve_text(self):
        original = self.scopes.http.fetch

        async def fetch(request):
            if request.path.startswith("/app/"):
                raise ygl.SourceHttpError("redirect_disallowed", status_code=302)
            return await original(request)

        self.scopes.http.fetch = fetch
        result = await self.call("app", {"app_id": "620"})
        self.assertEqual(result.status, ygl.ResultStatus.SUCCESS)
        self.assertEqual(
            result.model_facts.facts["data"]["availability"]["review_summaries"],
            "not_provided",
        )
        self.assertTrue(result.warnings)
        result = await self.call("profile", {"command": "1"})
        self.assertIsNotNone(result.document)
        self.assertFalse(
            any(
                isinstance(block, ygl.cards.Image)
                for block in result.document.card.blocks
            )
        )

    async def test_nested_bad_app_cache_refetches_once_then_hot_hit(self):
        await self.call("app", {"app_id": "620"})
        entry = next(iter(self.scopes.cache.rows.values()))
        entry["data"]["developers"] = [1]
        self.assertFalse(
            queries.valid_projection(entry, "app", "620", "CN", "schinese")
        )
        before = len(self.scopes.http.calls)
        first = await self.call("app", {"app_id": "620"})
        after = len(self.scopes.http.calls)
        second = await self.call("app", {"app_id": "620"})
        self.assertEqual(first.status, ygl.ResultStatus.SUCCESS)
        self.assertEqual(second.status, ygl.ResultStatus.SUCCESS)
        self.assertEqual(after - before, 2)  # appdetails + optional review HTML
        self.assertEqual(len(self.scopes.http.calls), after)
        self.assertEqual(first.model_facts.facts["cache"]["status"], "rejected")
        self.assertEqual(second.model_facts.facts["cache"]["status"], "hit")
        self.assertEqual(
            first.model_facts.facts["fetched_at"],
            second.model_facts.facts["fetched_at"],
        )
        self.assertEqual(second.model_facts.facts["region"], "CN")
        self.assertEqual(second.model_facts.facts["language"], "schinese")

    async def test_normal_account_projections_hit_cache_preserve_time_and_sample_types(
        self,
    ):
        for operation in ("profile", "recent", "games"):
            first = await self.call(operation, {"command": "1"})
            count = sum(
                request.source_id == "steam_community"
                for request in self.scopes.http.calls
            )
            second = await self.call(operation, {"command": "1"})
            self.assertEqual(
                sum(
                    request.source_id == "steam_community"
                    for request in self.scopes.http.calls
                ),
                count,
            )
            self.assertEqual(second.model_facts.facts["cache"]["status"], "hit")
            self.assertEqual(
                first.model_facts.facts["fetched_at"],
                second.model_facts.facts["fetched_at"],
            )

    async def test_valid_asset_fetch_uses_explicit_source_path_query(self):
        def chunk(tag, content):
            return (
                struct.pack("!I", len(content))
                + tag
                + content
                + struct.pack("!I", zlib.crc32(tag + content))
            )

        png = (
            b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", struct.pack("!2I5B", 1, 1, 8, 2, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(b"\0\0\0\0"))
            + chunk(b"IEND", b"")
        )
        seen = []

        async def bounded(request):
            seen.append(request)
            return response(png, "image/png")

        projection = {
            "operation": "app",
            "target": "620",
            "data": {
                "header_image_url": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/620/header.png?t=123"
            },
        }
        asset = await queries.image(
            SimpleNamespace(http=SimpleNamespace(fetch=bounded)), projection
        )
        self.assertEqual(asset.kind, "png")
        self.assertEqual(asset.content, png)
        self.assertEqual(seen[0].source_id, "steam_store_image")
        self.assertEqual(seen[0].query, (("t", "123"),))

    async def test_content_type_identity_loginwall_rate_limit_fail_distinctly(self):
        cases = (
            (response("<title>Sign In</title>", "text/html"), ygl.ErrorCode.NOT_PUBLIC),
            (response(profile_html(OTHER), "text/html"), ygl.ErrorCode.UNPARSED),
            (response("{}", "application/json"), ygl.ErrorCode.UNPARSED),
            (response("", "text/html", status=429), ygl.ErrorCode.RATE_LIMITED),
        )
        for raw, code in cases:
            self.scopes.http.override = lambda request, raw=raw: raw
            result = await self.call("profile", {"command": "1"})
            self.assertEqual(result.error.code, code)

    async def test_cache_backend_failure_bypasses_but_authority_failure_propagates_as_error(
        self,
    ):
        self.scopes.cache.unavailable = True
        result = await self.call("app", {"app_id": "620"})
        self.assertEqual(result.model_facts.facts["cache"]["status"], "unavailable")

        async def denied(query):
            raise ygl.InvalidInvocation()

        self.scopes.cache.lookup = denied
        result = await self.call("profile", {"command": "1"})
        self.assertEqual(result.error.code, ygl.ErrorCode.MODULE_UNAVAILABLE)

    async def test_stopped_module_and_query_input_bounds(self):
        for value in ("0", "4294967296", "x"):
            result = await self.call("app", {"app_id": value})
            self.assertEqual(result.error.code, ygl.ErrorCode.PARAMETER_ERROR)
        await self.module.stop()
        result = await self.call("app", {"app_id": "620"})
        self.assertEqual(result.error.code, ygl.ErrorCode.MODULE_UNAVAILABLE)

    async def test_redirect_metadata_plus_embedded_identity_are_both_required(self):
        def fetch(request):
            if request.source_id == "steam_avatar":
                return response("", "image/jpeg")
            return SimpleNamespace(
                status_code=200,
                headers={"Content-Type": "text/html"},
                body=profile_html().encode(),
                final_url="https://steamcommunity.com/id/synthetic_name/",
            )

        self.scopes.http.override = fetch
        result = await self.call("profile", {"command": "1"})
        self.assertIsNotNone(result.model_facts)
        self.scopes.cache.rows.clear()
        self.scopes.http.override = lambda request: SimpleNamespace(
            status_code=200,
            headers={"Content-Type": "text/html"},
            body=profile_html().encode(),
            final_url="https://steamcommunity.com/login/",
        )
        result = await self.call("profile", {"command": "1"})
        self.assertEqual(result.error.code, ygl.ErrorCode.UNPARSED)

    async def test_cancellation_propagates_and_images_reject_large_pixels(self):
        async def cancelled(request):
            raise asyncio.CancelledError()

        self.scopes.http.fetch = cancelled
        with self.assertRaises(asyncio.CancelledError):
            await self.call("profile", {"command": "1"})
        png = (
            b"\x89PNG\r\n\x1a\n"
            + b"\0\0\0\rIHDR"
            + (3000).to_bytes(4, "big")
            + (3000).to_bytes(4, "big")
        )

        async def huge(request):
            return response(png, "image/png")

        scope = SimpleNamespace(http=SimpleNamespace(fetch=huge))
        projection = {
            "operation": "profile",
            "target": SID,
            "data": {
                "profile": {
                    "avatar_url": "https://avatars.steamstatic.com/"
                    + "a" * 40
                    + "_full.jpg"
                }
            },
        }
        self.assertIsNone(await queries.image(scope, projection))


class WebAPITests(unittest.TestCase):
    def test_requests_never_accept_secret_and_include_played_free_games(self):
        for operation in ("profile", "level", "recent", "games"):
            request = webapi.request(operation, SID)
            self.assertEqual(request.source_id, "steam_api")
            self.assertIsNone(request.headers)
            self.assertNotIn("key", dict(request.query))
        self.assertEqual(
            dict(webapi.request("games", SID).query)["include_played_free_games"],
            "true",
        )

    def test_owned_games_hidden_empty_unknown_precision_are_distinct(self):
        hidden = webapi.normalize("games", {"response": {}}, SID)
        empty = webapi.normalize("games", {"response": {"game_count": 0}}, SID)
        self.assertIsNone(hidden["games"])
        self.assertEqual(empty["games"], [])
        self.assertTrue(empty["complete_library"])
        data = webapi.normalize(
            "games",
            {
                "response": {
                    "game_count": 1,
                    "games": [{"appid": 570, "playtime_forever": 12345}],
                }
            },
            SID,
        )
        self.assertEqual(data["games"][0]["precision"], "api_minutes")
        self.assertIsNone(data["games"][0]["minutes_2weeks"])
        self.assertEqual(data["games"][0]["minutes_on_record"], 12345)

    def test_profile_identity_and_missing_level_never_zero(self):
        data = webapi.normalize(
            "profile",
            {"response": {"players": [{"steamid": OTHER, "personaname": "Other"}]}},
            SID,
        )
        self.assertEqual(data["state"], "not_visible")
        self.assertIsNone(webapi.normalize("level", {"response": {}}, SID)["level"])
        self.assertEqual(
            webapi.normalize("level", {"response": {"player_level": 0}}, SID)["level"],
            0,
        )


if __name__ == "__main__":
    unittest.main()

"""Synthetic first-party responses, page-only enrichment and explicit target guards."""

import json
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock

import yomihime_game_link_sdk as ygl
from test_steam_wall_materials import Cache

from packages.steam_dlc.steam.wishlist import WishlistHandler, normalize


class WishlistTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.requests = []
        self.raw = {
            "response": {
                "items": [
                    {"appid": index, "date_added": 1000 + index}
                    for index in range(1, 46)
                ]
            }
        }
        self.status = 200

        async def fetch(request):
            self.requests.append(request)
            if request.source_id == "steam_wishlist":
                return ygl.HttpResponse(
                    self.status,
                    {"Content-Type": "application/json", "Retry-After": "7"},
                    json.dumps(self.raw).encode(),
                )
            payload = json.loads(dict(request.query)["input_json"])
            return ygl.HttpResponse(
                200,
                {"Content-Type": "application/json"},
                json.dumps(
                    {
                        "response": {
                            "store_items": [
                                {
                                    "appid": item["appid"],
                                    "id": item["appid"],
                                    "item_type": 0,
                                    "success": 1,
                                    "name": "Synthetic",
                                    "best_purchase_option": {
                                        "formatted_final_price": "¥ 12",
                                        "currency_code": "CNY",
                                        "discount_pct": 20,
                                    },
                                }
                                for item in payload["ids"]
                            ]
                        }
                    }
                ).encode(),
            )

        self.scope = SimpleNamespace(
            http=SimpleNamespace(fetch=AsyncMock(side_effect=fetch)), cache=Cache()
        )
        self.owner = SimpleNamespace(
            _running=True,
            _services=SimpleNamespace(
                scopes=SimpleNamespace(bind=AsyncMock(return_value=self.scope))
            ),
        )
        self.handler = WishlistHandler(self.owner, explicit=True)
        self.context = SimpleNamespace(
            origin=ygl.InvocationOrigin.LLM_TOOL, parent_id=None
        )

    async def test_current_page_twenty_in_one_store_request_and_stable_order(self):
        result = await self.handler.invoke(self.context, {"account": "1", "page": 2})
        self.assertEqual(result.status, ygl.ResultStatus.SUCCESS)
        data = result.document.ordered_blocks[1].fields["wishlist"]
        self.assertEqual((data["total"], data["page"], data["pages"]), (45, 2, 3))
        self.assertEqual(
            [row["app_id"] for row in data["items"]],
            [str(index) for index in range(25, 5, -1)],
        )
        self.assertEqual(len(self.requests), 2)
        request = self.requests[0]
        self.assertEqual(request.source_id, "steam_wishlist")
        self.assertEqual(dict(request.query), {"steamid": "76561197960265729"})
        self.assertNotIn("Cookie", request.headers or {})
        enriched = json.loads(dict(self.requests[1].query)["input_json"])
        self.assertEqual(len(enriched["ids"]), 20)
        again = await self.handler.invoke(self.context, {"account": "1", "page": 2})
        self.assertEqual(again.status, ygl.ResultStatus.SUCCESS)
        self.assertEqual(
            sum(request.source_id == "steam_browse" for request in self.requests), 1
        )

    async def test_long_language_and_ten_digit_appids_split_only_current_page_with_real_counts(
        self,
    ):
        self.raw = {
            "response": {
                "items": [
                    {"appid": value, "date_added": value}
                    for value in range(4294967000, 4294967045)
                ]
            }
        }
        original = self.scope.http.fetch.side_effect
        observed = []

        async def bounded(request):
            if request.source_id == "steam_browse":
                value = dict(request.query)["input_json"]
                observed.append(value)
                if len(value) > 512:
                    raise ygl.SourceHttpError("request_too_large")
            return await original(request)

        self.scope.http.fetch.side_effect = bounded
        response = await self.handler.invoke(
            self.context, {"account": "1", "page": 2, "language": "a" * 24}
        )
        self.assertEqual(response.status, ygl.ResultStatus.SUCCESS)
        data = response.document.ordered_blocks[1].fields["wishlist"]
        expected = [str(value) for value in range(4294967024, 4294967004, -1)]
        self.assertEqual([item["app_id"] for item in data["items"]], expected)
        self.assertTrue(all(item["name"] == "Synthetic" for item in data["items"]))
        self.assertGreater(len(observed), 1)
        self.assertTrue(all(len(value) <= 512 for value in observed))
        self.assertEqual(
            [
                str(item["appid"])
                for value in observed
                for item in json.loads(value)["ids"]
            ],
            expected,
        )
        self.assertEqual(data["store_requests"], len(observed))
        before = len(observed)
        repeated = await self.handler.invoke(
            self.context, {"account": "1", "page": 2, "language": "a" * 24}
        )
        self.assertEqual(
            repeated.document.ordered_blocks[1].fields["wishlist"]["store_requests"], 0
        )
        self.assertEqual(len(observed), before)

    async def test_split_enrichment_stops_on_rate_limit_counts_attempts_and_propagates_authority(
        self,
    ):
        self.raw = {
            "response": {
                "items": [
                    {"appid": value, "date_added": value}
                    for value in range(4294967000, 4294967020)
                ]
            }
        }
        original = self.scope.http.fetch.side_effect
        calls = 0

        async def limited(request):
            nonlocal calls
            if request.source_id == "steam_browse":
                calls += 1
                return ygl.HttpResponse(
                    429, {"Content-Type": "application/json", "Retry-After": "7"}, b"{}"
                )
            return await original(request)

        self.scope.http.fetch.side_effect = limited
        response = await self.handler.invoke(
            self.context, {"account": "1", "language": "a" * 24}
        )
        self.assertEqual(response.status, ygl.ResultStatus.PARTIAL_SUCCESS)
        self.assertEqual(calls, 1)
        self.assertEqual(
            response.document.ordered_blocks[1].fields["wishlist"]["store_requests"], 1
        )
        calls = 0

        async def revoked(request):
            nonlocal calls
            if request.source_id == "steam_browse":
                calls += 1
                raise ygl.SourceHttpError("request_rejected")
            return await original(request)

        self.scope.http.fetch.side_effect = revoked
        denied = await self.handler.invoke(
            self.context, {"account": "1", "language": "a" * 24}
        )
        self.assertEqual(denied.status, ygl.ResultStatus.ERROR)
        self.assertEqual(denied.error.code, ygl.ErrorCode.MODULE_UNAVAILABLE)
        self.assertEqual(calls, 1)

    async def test_empty_private_limited_failed_are_distinct(self):
        self.raw = {"response": {"items": []}}
        empty = await self.handler.invoke(self.context, {"account": "1"})
        self.assertEqual(empty.status, ygl.ResultStatus.SUCCESS)
        self.assertEqual(
            empty.document.ordered_blocks[1].fields["wishlist"]["state"], "empty"
        )
        self.raw = {"response": {}}
        private = await self.handler.invoke(self.context, {"account": "1"})
        self.assertEqual(private.error.code, ygl.ErrorCode.NOT_PUBLIC)
        self.status = 429
        limited = await self.handler.invoke(self.context, {"account": "1"})
        self.assertEqual(limited.error.code, ygl.ErrorCode.RATE_LIMITED)
        self.status = 503
        failed = await self.handler.invoke(self.context, {"account": "1"})
        self.assertEqual(failed.error.code, ygl.ErrorCode.UPSTREAM_ERROR)

    async def test_tool_missing_account_and_invalid_page_do_no_http(self):
        for parameters in (
            {},
            {"account": "1", "page": True},
            {"account": "1", "page": 0},
        ):
            response = await self.handler.invoke(self.context, parameters)
            self.assertEqual(response.status, ygl.ResultStatus.ERROR)
        self.assertEqual(self.requests, [])

    async def test_enrichment_failure_preserves_wishlist_items_and_marks_partial(self):
        original = self.scope.http.fetch.side_effect

        async def fail_store(request):
            if request.source_id == "steam_browse":
                raise ygl.SourceHttpError("transport_failed")
            return await original(request)

        self.scope.http.fetch.side_effect = fail_store
        response = await self.handler.invoke(self.context, {"account": "1"})
        self.assertEqual(response.status, ygl.ResultStatus.PARTIAL_SUCCESS)
        data = response.document.ordered_blocks[1].fields["wishlist"]
        self.assertEqual(len(data["items"]), 20)
        self.assertTrue(data["enrichment_failed"])
        self.assertTrue(
            all(item["price_state"] == "fetch_failed" for item in data["items"])
        )

    async def test_malformed_duplicates_never_claim_complete_or_empty(self):
        for items in (
            [{"appid": True, "date_added": 1}],
            [{"appid": 1, "date_added": 1}] * 2,
        ):
            with self.assertRaises(ValueError):
                normalize({"response": {"items": items}})

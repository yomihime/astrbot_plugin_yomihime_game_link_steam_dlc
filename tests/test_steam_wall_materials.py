"""Offline SDK-port lifecycle probes; no real account/source bytes or Host claims."""

import asyncio
import hashlib
import json
import struct
import unittest
from types import MappingProxyType, SimpleNamespace

import yomihime_game_link_sdk as ygl
from yomihime_game_link_sdk.storage import (
    CacheLookup,
    CacheLookupStatus,
    CacheVisibility,
)

from packages.steam_dlc.steam.wall_materials import MaterialPreparer


def freeze(value):
    if isinstance(value, dict):
        return MappingProxyType({key: freeze(child) for key, child in value.items()})
    if isinstance(value, list):
        return tuple(freeze(child) for child in value)
    return value


class Cache:
    def __init__(self):
        self.values = {}
        self.puts = []

    async def lookup(self, query):
        value = self.values.get((query.visibility, query.key))
        return (
            CacheLookup(CacheLookupStatus.HIT, SimpleNamespace(payload=freeze(value)))
            if value is not None
            else CacheLookup(CacheLookupStatus.MISS)
        )

    async def put(self, key, payload, *, ttl_seconds, visibility=None):
        self.values[visibility, key] = json.loads(json.dumps(payload))
        self.puts.append((visibility, key, payload))


class Resources:
    def __init__(self):
        self.values = {}
        self.denied = False

    async def metadata(self, asset_id, *, visibility=None):
        if self.denied:
            raise ygl.AccessDenied()
        assert visibility is CacheVisibility.PUBLIC
        return SimpleNamespace(asset_id=asset_id) if asset_id in self.values else None

    async def store(self, media, content, *, visibility=None, ttl_seconds=None):
        assert visibility is CacheVisibility.PUBLIC
        asset_id = "opaque-" + hashlib.sha256(content).hexdigest()
        self.values[asset_id] = content
        return SimpleNamespace(asset_id=asset_id)

    async def stats(self, *, visibility=None):
        return ygl.ResourceCacheStats(
            sum(map(len, self.values.values())), len(self.values), 64000000, 512, 0
        )


class Http:
    def __init__(self):
        self.requests = []
        self.version = 1
        self.offline = False
        self.image_status = 200
        self.body_override = None
        self.gate = None
        self.denied = False

    async def fetch(self, request):
        self.requests.append(request)
        if self.denied:
            raise ygl.SourceHttpError("request_rejected")
        if self.gate:
            await self.gate.wait()
        if self.offline:
            raise ygl.SourceHttpError("transport_failed")
        if request.source_id == "steam_browse":
            payload = json.loads(dict(request.query)["input_json"])
            tag = f'"metadata-{self.version}"'
            if request.headers.get("If-None-Match") == tag:
                return ygl.HttpResponse(304, {}, b"")
            items = []
            for item in payload["ids"]:
                appid = item["appid"]
                items.append(
                    {
                        "appid": appid,
                        "id": appid,
                        "item_type": 0,
                        "success": 1,
                        "name": "Synthetic",
                        "type": 6 if appid == 2 else 0,
                        "assets": {
                            "asset_url_format": f"steam/apps/{appid}/${{FILENAME}}?t={self.version}",
                            "library_capsule": "library_600x900.jpg",
                            "library_capsule_2x": "library_600x900_2x.jpg",
                            "last_modified": self.version,
                        },
                    }
                )
            return ygl.HttpResponse(
                200,
                {"Content-Type": "application/json", "ETag": tag},
                json.dumps({"response": {"store_items": items}}).encode(),
            )
        tag = f'"image-{self.version}"'
        if self.image_status != 200:
            return ygl.HttpResponse(self.image_status, {"Retry-After": "7"}, b"")
        if request.headers.get("If-None-Match") == tag:
            return ygl.HttpResponse(304, {}, b"")
        # Header-only fixture deliberately tests DLC preflight, not Core decoder verification.
        body = self.body_override or b"\x89PNG\r\n\x1a\n" + struct.pack(
            ">I", 13
        ) + b"IHDR" + struct.pack(">II", 300, 450) + bytes([self.version])
        return ygl.HttpResponse(200, {"Content-Type": "image/png", "ETag": tag}, body)


def scope():
    return SimpleNamespace(cache=Cache(), resources=Resources(), http=Http())


class MaterialTests(unittest.IsolatedAsyncioTestCase):
    async def test_two_phases_hot_frozen_cache_new_preparer_and_source_update(self):
        target = scope()
        first = MaterialPreparer()
        metadata = await first.prepare(target, ["1", "2"], phase="metadata")
        self.assertEqual(metadata["counters"]["image_requests"], 0)
        self.assertEqual(metadata["items"][1]["app_type"], "software")
        image = await first.prepare(target, ["1"], phase="images")
        self.assertEqual(image["counters"]["metadata_requests"], 0)
        self.assertEqual(image["counters"]["image_requests"], 1)
        second = MaterialPreparer()
        hot = await second.prepare(target, ["1"], phase="images")
        self.assertEqual(hot["counters"]["image_requests"], 0)
        self.assertEqual(hot["items"], image["items"])
        target.http.version = 2
        await second.prepare(target, ["1"], phase="metadata", refresh=True)
        updated = await second.prepare(target, ["1"], phase="images")
        self.assertNotEqual(
            updated["items"][0]["asset_id"], image["items"][0]["asset_id"]
        )
        self.assertEqual(updated["counters"]["image_requests"], 1)

    async def test_conditional304_damage_heal_and_offline_stale(self):
        target, service = scope(), MaterialPreparer()
        first = await service.prepare(target, ["1"])
        await service.prepare(target, ["1"], phase="metadata", refresh=True)
        refreshed = await service.prepare(target, ["1"], refresh=True)
        self.assertEqual(refreshed["items"], first["items"])
        self.assertIn("If-None-Match", target.http.requests[-1].headers)
        target.resources.values.clear()
        repaired = await service.prepare(target, ["1"])
        self.assertEqual(repaired["counters"]["corrupt_or_missing"], 1)
        self.assertNotIn("If-None-Match", target.http.requests[-1].headers)
        target.http.offline = True
        stale = await service.prepare(target, ["1"], refresh=True)
        self.assertEqual(stale["items"], first["items"])
        self.assertEqual(stale["counters"]["stale_images"], 1)

    async def test_negative_cache_refresh_recovery_and_rate_limit_no_retry(self):
        target, service = scope(), MaterialPreparer()
        target.http.image_status = 404
        failed = await service.prepare(target, ["1"])
        self.assertIsNone(failed["items"][0]["asset_id"])
        self.assertEqual(failed["counters"]["image_requests"], 2)
        hot = await service.prepare(target, ["1"])
        self.assertEqual(hot["counters"]["image_requests"], 0)
        target.http.image_status = 200
        recovered = await service.prepare(target, ["1"], refresh=True)
        self.assertIsNotNone(recovered["items"][0]["asset_id"])
        target.resources.values.clear()
        target.http.image_status = 429
        limited = await service.prepare(target, ["1"], refresh=True)
        self.assertEqual(limited["counters"]["image_requests"], 1)
        self.assertEqual(limited["counters"]["retry_after"], 7)

    async def test_schema_rejection_byte_pixel_limits_and_authority_propagation(self):
        target, service = scope(), MaterialPreparer()
        await service.prepare(target, ["1"])
        for key in list(target.cache.values):
            target.cache.values[key]["schema"] = "poisoned"
        rebuilt = await service.prepare(target, ["1"])
        self.assertEqual(rebuilt["counters"]["metadata_requests"], 1)
        self.assertEqual(rebuilt["counters"]["image_requests"], 1)
        target.resources.denied = True
        with self.assertRaises(ygl.AccessDenied):
            await service.prepare(target, ["1"])
        for body in (
            b"x" * 1_000_001,
            b"\x89PNG\r\n\x1a\n"
            + struct.pack(">I", 13)
            + b"IHDR"
            + struct.pack(">II", 99999, 99999),
        ):
            fresh = scope()
            fresh.http.body_override = body
            invalid = await service.prepare(fresh, ["1"])
            self.assertIsNone(invalid["items"][0]["asset_id"])
            self.assertFalse(fresh.resources.values)

    async def test_singleflight_and_cancellation_stop_drains(self):
        target, service = scope(), MaterialPreparer()
        await service.prepare(target, ["1"], phase="metadata")
        target.http.gate = asyncio.Event()
        first = asyncio.create_task(service.prepare(target, ["1"]))
        second = asyncio.create_task(service.prepare(target, ["1"]))
        for _ in range(20):
            await asyncio.sleep(0)
        target.http.gate.set()
        results = await asyncio.gather(first, second)
        self.assertEqual(sum(v["counters"]["image_requests"] for v in results), 1)
        self.assertEqual(results[0]["items"], results[1]["items"])
        target.resources.values.clear()
        target.http.gate.clear()
        blocked = asyncio.create_task(service.prepare(target, ["1"]))
        for _ in range(20):
            await asyncio.sleep(0)
        await service.stop()
        with self.assertRaises(asyncio.CancelledError):
            await blocked
        self.assertFalse(service._flights)

    async def test_http_authority_never_becomes_stale_and_negative_expiry_recovers(
        self,
    ):
        target, service = scope(), MaterialPreparer()
        await service.prepare(target, ["1"])
        target.http.denied = True
        with self.assertRaises(ygl.AccessDenied):
            await service.prepare(target, ["1"], phase="metadata", refresh=True)
        target = scope()
        target.http.image_status = 404
        await service.prepare(target, ["1"])
        for value in target.cache.values.values():
            if value.get("negative"):
                value["checked"] -= 301
        target.http.image_status = 200
        recovered = await service.prepare(target, ["1"])
        self.assertEqual(recovered["counters"]["image_requests"], 1)
        self.assertIsNotNone(recovered["items"][0]["asset_id"])

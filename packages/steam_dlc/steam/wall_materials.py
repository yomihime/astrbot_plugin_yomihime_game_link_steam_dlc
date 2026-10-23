"""Bounded public Steam metadata/material preparation through canonical SDK ports."""

from __future__ import annotations

import asyncio
import hashlib
import json
import re
import time
from collections.abc import Mapping

import yomihime_game_link_sdk as ygl
from yomihime_game_link_sdk.storage import CacheQuery, CacheVisibility

from .cache_validation import mutable_json
from .normalization import app_id, literal
from .queries import QueryFailure, _dimensions

PUBLIC = CacheVisibility.PUBLIC
VERSION = "steam-wall-materials-v1"
TTL = 7 * 86400
METADATA_AGE = 3600
NEGATIVE_AGE = 300
MAX_IMAGE_BYTES = 1_000_000
MAX_TOTAL_BYTES = 16_000_000
_EXPECTED = (ygl.SourceHttpError, ygl.OperationTimeout, QueryFailure)


def _header(response, name):
    return next((v for k, v in response.headers.items() if k.lower() == name), "")


def _etag(value):
    return (
        value
        if isinstance(value, str)
        and len(value) <= 256
        and not any(ord(c) < 32 or ord(c) == 127 for c in value)
        else ""
    )


def material_request(assets, target, *, large=False):
    """Accept exactly the observed official relative format, never arbitrary URLs."""
    if not isinstance(assets, Mapping):
        return None
    template = assets.get("asset_url_format")
    if not isinstance(template, str) or not re.fullmatch(
        rf"steam/apps/{re.escape(target)}/\$\{{FILENAME\}}(?:\?t=[0-9]{{1,20}})?",
        template,
    ):
        return None
    kinds = ("library_capsule_2x", "library_capsule") if large else ("library_capsule",)
    for kind in kinds:
        filename = assets.get(kind)
        if not isinstance(filename, str) or not re.fullmatch(
            r"(?:[0-9a-f]{40}/)?(?:library_capsule(?:_2x)?|library_600x900(?:_2x)?)\.(?:jpg|png)",
            filename,
        ):
            continue
        value = template.replace("${FILENAME}", filename)
        path, _, query = value.partition("?")
        return {
            "path": "/store_item_assets/" + path,
            "query": [["t", query[2:]]] if query else [],
            "kind": kind,
            "version": str(assets["last_modified"])
            if type(assets.get("last_modified")) is int
            else "",
        }
    return None


def normalize_items(raw, appids):
    if not isinstance(raw, Mapping) or not isinstance(raw.get("response"), Mapping):
        raise ValueError("Invalid StoreBrowse response")
    items = raw["response"].get("store_items")
    if not isinstance(items, (list, tuple)) or len(items) > 200:
        raise ValueError("Invalid bounded store_items")
    result = {}
    wanted = set(appids)
    for item in items:
        if not isinstance(item, Mapping):
            continue
        target = str(item.get("appid"))
        if target not in wanted or target in result:
            continue
        if (
            type(item.get("appid")) is not int
            or type(item.get("id")) is not int
            or item.get("id") != int(target)
            or type(item.get("item_type")) is not int
            or item["item_type"] != 0
            or type(item.get("success")) is not int
            or item["success"] != 1
        ):
            continue
        raw_type = item.get("type")
        raw_type = raw_type if type(raw_type) is int and raw_type >= 0 else None
        assets = item.get("assets")
        result[target] = {
            "app_id": target,
            "name": literal(item.get("name")),
            "app_type": "game"
            if raw_type == 0
            else "software"
            if raw_type == 6
            else "unknown",
            "raw_type": raw_type,
            "normal": material_request(assets, target),
            "large": material_request(assets, target, large=True),
        }
    return result


def _valid_item(item, target):
    if (
        not isinstance(item, dict)
        or item.get("app_id") != target
        or set(item) != {"app_id", "name", "app_type", "raw_type", "normal", "large"}
    ):
        return False
    raw = item.get("raw_type")
    if raw is not None and (type(raw) is not int or not 0 <= raw <= 2**31):
        return False
    if item.get("app_type") != (
        "game" if raw == 0 else "software" if raw == 6 else "unknown"
    ):
        return False
    if item.get("name") is not None and literal(item["name"]) != item["name"]:
        return False
    for kind in ("normal", "large"):
        request = item.get(kind)
        if request is None:
            continue
        if not isinstance(request, dict) or not isinstance(request.get("path"), str):
            return False
        if not re.fullmatch(
            rf"/store_item_assets/steam/apps/{re.escape(target)}/(?:[0-9a-f]{{40}}/)?(?:library_capsule(?:_2x)?|library_600x900(?:_2x)?)\.(?:jpg|png)",
            request["path"],
        ):
            return False
        query = request.get("query")
        if query != [] and not (
            isinstance(query, list)
            and len(query) == 1
            and isinstance(query[0], list)
            and len(query[0]) == 2
            and query[0][0] == "t"
            and isinstance(query[0][1], str)
            and re.fullmatch(r"[0-9]{1,20}", query[0][1])
        ):
            return False
        if request.get("kind") not in (
            "library_capsule",
            "library_capsule_2x",
        ) or not isinstance(request.get("version"), str):
            return False
    return True


class MaterialPreparer:
    """Only in-flight PUBLIC work lives in memory; persisted bytes belong to Core."""

    def __init__(self):
        self._flights = {}
        self._semaphore = asyncio.Semaphore(4)
        self._stopped = False

    def start(self):
        self._stopped = False

    async def stop(self):
        self._stopped = True
        tasks = [entry[0] for entry in self._flights.values()]
        for task in tasks:
            task.cancel()
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
        self._flights.clear()

    async def _flight(self, key, work):
        if self._stopped:
            raise ygl.ServiceUnavailable()
        entry = self._flights.get(key)
        if entry is None:
            entry = [asyncio.create_task(work()), 0]
            self._flights[key] = entry
        entry[1] += 1
        try:
            return await asyncio.shield(entry[0])
        finally:
            entry[1] -= 1
            if entry[1] == 0:
                if not entry[0].done():
                    entry[0].cancel()
                    await asyncio.gather(entry[0], return_exceptions=True)
                if self._flights.get(key) is entry:
                    del self._flights[key]

    async def _cached(self, scope, key):
        try:
            lookup = await scope.cache.lookup(CacheQuery(key, PUBLIC))
            if lookup.entry is not None:
                return mutable_json(lookup.entry.payload)
        except (ygl.CacheUnavailable, ValueError):
            pass
        return None

    async def _put(self, scope, key, value):
        try:
            await scope.cache.put(key, value, ttl_seconds=TTL, visibility=PUBLIC)
        except ygl.CacheUnavailable:
            pass

    async def _fetch(self, scope, request, counters, kind):
        async with self._semaphore:
            if counters["rate_limited"]:
                raise QueryFailure(
                    ygl.ErrorCode.RATE_LIMITED,
                    "Steam 素材请求限流。",
                    counters["retry_after"] or None,
                )
            counters[kind + "_requests"] += 1
            try:
                response = await scope.http.fetch(request)
            except ygl.SourceHttpError as exc:
                if exc.code in ("request_rejected", "source_not_declared"):
                    # The HTTP boundary also uses request_rejected for revoked
                    # invocation/source authority. Never call that a cache miss.
                    raise ygl.AccessDenied() from exc
                if exc.status_code == 429 or exc.code == "rate_limited":
                    counters["rate_limited"] += 1
                    counters["retry_after"] = exc.retry_after_seconds or 0
                raise
        if response.status_code == 429:
            retry = _header(response, "retry-after")
            counters["rate_limited"] += 1
            counters["retry_after"] = (
                int(retry) if re.fullmatch(r"[0-9]{1,5}", retry) else 0
            )
            raise QueryFailure(
                ygl.ErrorCode.RATE_LIMITED,
                "Steam 素材请求限流。",
                counters["retry_after"] or None,
            )
        return response

    async def _metadata(self, scope, appids, country, language, refresh, counters):
        identity = json.dumps([list(appids), country, language], separators=(",", ":"))
        key = VERSION + ":metadata:" + hashlib.sha256(identity.encode()).hexdigest()
        cached = await self._cached(scope, key)
        if not (
            cached
            and cached.get("schema") == VERSION
            and isinstance(cached.get("items"), dict)
            and type(cached.get("checked")) in (int, float)
            and 0 <= cached["checked"] <= time.time() + 300
            and all(
                _valid_item(item, target) for target, item in cached["items"].items()
            )
            and set(cached["items"]).issubset(set(appids))
        ):
            cached = None
        now = time.time()
        individual = {}
        stale_individual = {}
        for target in appids:
            entry = await self._cached(
                scope, VERSION + ":app:" + country + ":" + language + ":" + target
            )
            if (
                entry
                and entry.get("schema") == VERSION
                and _valid_item(entry.get("item"), target)
                and type(entry.get("checked")) in (int, float)
            ):
                stale_individual[target] = entry["item"]
                age = (
                    NEGATIVE_AGE if entry["item"]["raw_type"] is None else METADATA_AGE
                )
                if -300 <= now - entry["checked"] < age:
                    individual[target] = entry["item"]
        if len(individual) == len(appids) and not refresh:
            counters["metadata_hits"] += 1
            return individual
        payload = {
            "ids": [{"appid": int(v)} for v in appids],
            "context": {"language": language, "country_code": country},
            "data_request": {"include_assets": True},
        }
        headers = {}
        if cached and _etag(cached.get("etag")):
            headers["If-None-Match"] = _etag(cached["etag"])
        try:
            response = await self._fetch(
                scope,
                ygl.HttpRequest(
                    "steam_browse",
                    "/IStoreBrowseService/GetItems/v1/",
                    query=(("input_json", json.dumps(payload, separators=(",", ":"))),),
                    headers=headers,
                ),
                counters,
                "metadata",
            )
            if (
                response.status_code == 304
                and cached
                and isinstance(cached.get("items"), dict)
            ):
                cached["checked"] = now
                await self._put(scope, key, cached)
                result = cached["items"]
            else:
                if response.status_code != 200:
                    raise QueryFailure(
                        ygl.ErrorCode.UPSTREAM_ERROR, "Steam 元数据暂不可用。"
                    )
                if (
                    _header(response, "content-type").split(";")[0].lower()
                    != "application/json"
                    or not isinstance(response.body, bytes)
                    or len(response.body) > 2_000_000
                ):
                    raise ValueError("Invalid metadata body")
                result = normalize_items(json.loads(response.body), appids)
                for target in appids:
                    result.setdefault(
                        target,
                        {
                            "app_id": target,
                            "name": None,
                            "app_type": "unknown",
                            "raw_type": None,
                            "normal": None,
                            "large": None,
                        },
                    )
                await self._put(
                    scope,
                    key,
                    {
                        "schema": VERSION,
                        "items": result,
                        "checked": now,
                        "etag": _etag(_header(response, "etag")),
                    },
                )
            for target, item in result.items():
                await self._put(
                    scope,
                    VERSION + ":app:" + country + ":" + language + ":" + target,
                    {"schema": VERSION, "item": item, "checked": now},
                )
            return result
        except (*_EXPECTED, ValueError):
            if cached and isinstance(cached.get("items"), dict):
                counters["stale_metadata"] += 1
                return cached["items"]
            counters["metadata_failed"] += 1
            if stale_individual:
                counters["stale_metadata"] += 1
            return stale_individual

    async def _image(self, scope, target, request, counters, refresh):
        # Include region/language-selected source path, exact variant and version.
        identity = json.dumps(request, sort_keys=True, separators=(",", ":"))
        key = VERSION + ":image:" + hashlib.sha256(identity.encode()).hexdigest()

        async def work():
            cached = await self._cached(scope, key)
            if not (
                cached
                and cached.get("schema") == VERSION
                and cached.get("request") == request
                and type(cached.get("checked")) in (int, float)
                and (
                    cached.get("negative") is True
                    or (
                        isinstance(cached.get("asset_id"), str)
                        and 0 < len(cached["asset_id"]) <= 256
                    )
                )
            ):
                cached = None
            now = time.time()
            usable = None
            if cached and isinstance(cached.get("asset_id"), str):
                meta = await scope.resources.metadata(
                    cached["asset_id"], visibility=PUBLIC
                )
                if meta is not None:
                    usable = cached["asset_id"]
                else:
                    counters["corrupt_or_missing"] += 1
            if usable and not refresh:
                counters["image_hits"] += 1
                return usable
            if (
                cached
                and cached.get("negative") is True
                and type(cached.get("checked")) in (int, float)
                and -300 <= now - cached["checked"] < NEGATIVE_AGE
                and not refresh
            ):
                counters["negative_hits"] += 1
                return None
            if counters["image_bytes"] >= MAX_TOTAL_BYTES:
                counters["budget_skipped"] += 1
                return usable
            headers = {}
            if usable and _etag(cached.get("etag")):
                headers["If-None-Match"] = _etag(cached["etag"])
            try:
                response = await self._fetch(
                    scope,
                    ygl.HttpRequest(
                        "steam_store_image",
                        request["path"],
                        query=tuple(tuple(v) for v in request["query"]),
                        headers=headers,
                    ),
                    counters,
                    "image",
                )
                if response.status_code == 304 and usable:
                    counters["image_hits"] += 1
                    return usable
                if response.status_code == 404:
                    if usable:
                        # Retain the verified positive record and its original
                        # source metadata. A failed refresh must not make the
                        # next invocation forget a still-readable local image.
                        counters["stale_images"] += 1
                        return usable
                    await self._put(
                        scope,
                        key,
                        {
                            "schema": VERSION,
                            "request": request,
                            "negative": True,
                            "checked": now,
                        },
                    )
                    return usable
                media = _header(response, "content-type").split(";")[0].strip().lower()
                body = response.body
                if (
                    response.status_code != 200
                    or media not in ("image/jpeg", "image/png")
                    or not isinstance(body, bytes)
                    or len(body) > MAX_IMAGE_BYTES
                ):
                    return usable
                size = _dimensions(body, media)
                if (
                    size is None
                    or not all(0 < v <= 2048 for v in size)
                    or size[0] * size[1] > 16_000_000
                ):
                    return usable
                counters["image_bytes"] += len(body)
                if counters["image_bytes"] > MAX_TOTAL_BYTES:
                    counters["budget_skipped"] += 1
                    return usable
                try:
                    reference = await scope.resources.store(
                        media, body, visibility=PUBLIC, ttl_seconds=TTL
                    )
                except ygl.ParameterError:
                    # Core performs the full decoder validation after this
                    # adapter's header preflight. Reject only this candidate;
                    # authority, cancellation and unexpected failures propagate.
                    counters["image_rejected"] += 1
                    if usable:
                        counters["stale_images"] += 1
                    return usable
                except ygl.ServiceUnavailable:
                    counters["budget_skipped"] += 1
                    return usable
                await self._put(
                    scope,
                    key,
                    {
                        "schema": VERSION,
                        "request": request,
                        "asset_id": reference.asset_id,
                        "etag": _etag(_header(response, "etag")),
                        "checked": now,
                    },
                )
                return reference.asset_id
            except _EXPECTED:
                if usable:
                    counters["stale_images"] += 1
                return usable

        return await self._flight(key, work)

    async def prepare(
        self,
        scope,
        appids,
        country="CN",
        language="schinese",
        refresh=False,
        *,
        phase="images",
    ):
        appids = tuple(sorted({app_id(v) for v in appids}, key=int))
        if not appids or len(appids) > 200:
            raise ValueError("Material appids must contain 1..200 unique AppIDs")
        if (
            not isinstance(country, str)
            or not re.fullmatch(r"[A-Z]{2}", country)
            or not isinstance(language, str)
            or not re.fullmatch(r"[a-z_]{2,24}", language)
            or type(refresh) is not bool
            or phase not in ("metadata", "images")
        ):
            raise ValueError("Invalid material locale/refresh")
        counters = {
            key: 0
            for key in (
                "metadata_requests",
                "image_requests",
                "metadata_hits",
                "image_hits",
                "negative_hits",
                "corrupt_or_missing",
                "stale_metadata",
                "metadata_failed",
                "stale_images",
                "image_bytes",
                "budget_skipped",
                "image_rejected",
                "rate_limited",
                "retry_after",
            )
        }
        metadata_refresh = refresh and phase == "metadata"
        metadata = await self._flight(
            (appids, country, language, metadata_refresh),
            lambda: self._metadata(
                scope, appids, country, language, metadata_refresh, counters
            ),
        )
        if phase == "metadata":
            return {
                "schema": VERSION,
                "items": [
                    metadata.get(
                        target,
                        {
                            "app_id": target,
                            "name": None,
                            "app_type": "unknown",
                            "raw_type": None,
                            "normal": None,
                            "large": None,
                        },
                    )
                    for target in appids
                ],
                "counters": counters,
            }
        large = len(appids) <= 12

        async def item(target):
            data = metadata.get(
                target,
                {
                    "app_id": target,
                    "name": None,
                    "app_type": "unknown",
                    "raw_type": None,
                },
            )
            request = data.get("large" if large else "normal")
            reference = None
            if isinstance(request, dict):
                reference = await self._image(scope, target, request, counters, refresh)
            # One bounded official legacy fallback, then a local renderer placeholder.
            if reference is None:
                fallback = {
                    "path": f"/store_item_assets/steam/apps/{target}/library_600x900.jpg",
                    "query": [],
                    "kind": "legacy_fallback",
                    "version": "legacy",
                }
                if request != fallback:
                    reference = await self._image(
                        scope, target, fallback, counters, refresh
                    )
            return {
                "app_id": target,
                "name": data.get("name"),
                "app_type": data.get("app_type", "unknown"),
                "raw_type": data.get("raw_type"),
                "asset_id": reference,
            }

        items = await asyncio.gather(*(item(target) for target in appids))
        return {"schema": VERSION, "items": items, "counters": counters}

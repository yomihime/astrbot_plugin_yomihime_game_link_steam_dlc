"""Official Steam queries using only invocation-bound canonical SDK ports."""

from __future__ import annotations

import json
import re
from datetime import UTC, datetime
from urllib.parse import urlencode, urlsplit

import yomihime_game_link_sdk as ygl
from yomihime_game_link_sdk import cards
from yomihime_game_link_sdk.errors import CacheUnavailable, SourceHttpError
from yomihime_game_link_sdk.storage import (
    CacheLookupStatus,
    CacheQuery,
    CacheVisibility,
)

from .cache_validation import mutable_json, valid_projection
from .normalization import (
    VERSION,
    normalize_app,
    normalize_legacy,
    normalize_profile,
    normalize_reviews,
    normalize_search,
)


class QueryFailure(Exception):
    def __init__(self, code, message, retry_after=None):
        self.code, self.message, self.retry_after = code, message, retry_after


def _header(response, name):
    return next(
        (value for key, value in response.headers.items() if key.lower() == name), ""
    )


def validate_final_url(response, source, path):
    """Consume optional public response metadata, never internal HTTP objects.

    SDK13 omits final_url and rejects redirects. A newer source-declared
    redirect policy may expose it; validate its origin and narrow page kind.
    Embedded profile/AppID checks remain mandatory regardless of metadata.
    """
    value = getattr(response, "final_url", None)
    if value is None:
        return
    hosts = {
        "steam_store": "store.steampowered.com",
        "steam_community": "steamcommunity.com",
        "steam_avatar": "avatars.steamstatic.com",
        "steam_store_image": "shared.akamai.steamstatic.com",
    }
    try:
        parsed = urlsplit(value)
        if (
            parsed.scheme != "https"
            or parsed.hostname != hosts.get(source)
            or parsed.username
            or parsed.password
            or parsed.port not in (None, 443)
            or parsed.fragment
        ):
            raise ValueError
        if source == "steam_community":
            if not re.fullmatch(
                r"/(?:profiles/[1-9][0-9]{0,19}|id/[A-Za-z0-9_-]{1,64})/?", parsed.path
            ):
                raise ValueError
            if parsed.path.startswith("/profiles/") and parsed.path.rstrip(
                "/"
            ) != path.rstrip("/"):
                raise ValueError
        elif parsed.path != path:
            raise ValueError
    except (TypeError, ValueError):
        raise QueryFailure(
            ygl.ErrorCode.UNPARSED, "Steam 最终响应地址未通过来源和路径验证。"
        ) from None


async def fetch(scope, source, path, query=(), *, expected="json", max_bytes=2_000_000):
    response = await scope.http.fetch(ygl.HttpRequest(source, path, query=query))
    if response.status_code == 429:
        retry = _header(response, "retry-after")
        retry = int(retry) if re.fullmatch(r"[0-9]{1,5}", retry) else None
        raise QueryFailure(
            ygl.ErrorCode.RATE_LIMITED, "Steam 请求过于频繁，请稍后重试。", retry
        )
    if response.status_code in (401, 403):
        raise QueryFailure(ygl.ErrorCode.NOT_PUBLIC, "Steam 此项资料不公开或需要登录。")
    if response.status_code == 404:
        raise QueryFailure(ygl.ErrorCode.NOT_FOUND, "Steam 未找到此项公开资料。")
    if response.status_code != 200:
        raise QueryFailure(ygl.ErrorCode.UPSTREAM_ERROR, "Steam 上游暂时无法完成查询。")
    if not isinstance(response.body, bytes) or len(response.body) > max_bytes:
        raise QueryFailure(ygl.ErrorCode.UNPARSED, "Steam 响应超过受限大小。")
    media = _header(response, "content-type").split(";", 1)[0].lower().strip()
    allowed = {
        "json": {"application/json"},
        "html": {"text/html"},
        "xml": {"text/xml", "application/xml"},
        "image": {"image/png", "image/jpeg"},
    }
    if media not in allowed[expected]:
        raise QueryFailure(
            ygl.ErrorCode.UNPARSED,
            "Steam 返回了意外的内容类型，未将登录页或网页视为空结果。",
        )
    validate_final_url(response, source, path)
    if expected == "json":
        return json.loads(response.body)
    if expected == "html":
        return response.body.decode("utf-8", errors="replace")
    if expected == "image":
        return response.body, media
    return response.body


def cache_key(operation, target, country, language):
    return (
        "steam:"
        + VERSION
        + ":"
        + urlencode(
            {
                "provider": "steam",
                "operation": operation,
                "target": target,
                "country": country,
                "language": language,
            }
        )
    )


async def load(scope, operation, target, country="CN", language="schinese"):
    key = cache_key(operation, target, country, language)
    # Public store data can be shared. Account samples remain in the authorized
    # invocation's owner partition; public visibility is not permission to share
    # a default binding or the user's derived selection.
    visibility = CacheVisibility.PUBLIC if operation in ("search", "app") else None
    cache_status = "miss"
    try:
        lookup = await scope.cache.lookup(CacheQuery(key, visibility))
        cache_status = lookup.status.value
        if lookup.status is CacheLookupStatus.HIT and lookup.entry is not None:
            try:
                payload = mutable_json(lookup.entry.payload)
            except ValueError:
                payload = None
            if valid_projection(payload, operation, target, country, language):
                payload["cache"] = {
                    "status": "hit",
                    "fetched_at": payload["fetched_at"],
                }
                return payload
            cache_status = "rejected"
    except CacheUnavailable:
        cache_status = "unavailable"
    warnings = []
    now = datetime.now(UTC).isoformat()
    if operation == "search":
        source, endpoint = "steam_store", "/api/storesearch/"
        raw = await fetch(
            scope,
            source,
            endpoint,
            (("term", target), ("cc", country), ("l", language)),
        )
        data = normalize_search(raw)
        scope_description = "bounded_store_candidates"
    elif operation == "app":
        source, endpoint = "steam_store", "/api/appdetails"
        raw = await fetch(
            scope,
            source,
            endpoint,
            (("appids", target), ("cc", country), ("l", language)),
        )
        data = normalize_app(raw, target)
        # Review HTML is optional. It cannot erase valid price/detail JSON.
        try:
            page = await fetch(
                scope,
                source,
                f"/app/{target}/",
                (("cc", country), ("l", "english")),
                expected="html",
            )
            data["review_summaries"] = normalize_reviews(page, target)
            data["availability"]["review_summaries"] = (
                "available" if data["review_summaries"] else "not_provided"
            )
        except (QueryFailure, SourceHttpError, ygl.OperationTimeout, ValueError):
            warnings.append(
                "官方商店评价摘要暂不可用；价格和详情仍来自当前地区的 appdetails。"
            )
        scope_description = "current_regional_store_details"
    elif operation in ("profile", "recent"):
        source, endpoint = "steam_community", f"/profiles/{target}/"
        text = await fetch(
            scope, source, endpoint, (("l", "english"),), expected="html"
        )
        data = normalize_profile(text, target)
        scope_description = "public_homepage_recent_display_sample"
        warnings.append(
            "主页最多3款最近展示游戏；不是完整两周列表或完整游戏库。时长为网页显示小时精度。"
        )
    else:
        source, endpoint = "steam_community", f"/profiles/{target}/"
        body = await fetch(scope, source, endpoint, (("xml", "1"),), expected="xml")
        data = normalize_legacy(body, target)
        scope_description = "deprecated_xml_most_played_sample"
        warnings.extend(
            (
                "这是已弃用 Community XML 的最多5款 mostPlayedGames 公开样本，不是全部游戏库或完整近期列表。",
                "子项时长与上游汇总口径可能不同；不据此计算完整两周总时长。完整库增强需要可选 Steam Web API Key。",
            )
        )
    result = {
        "schema_version": VERSION,
        "operation": operation,
        "target": target,
        "source": source,
        "source_endpoint": endpoint,
        "scope": scope_description,
        "fetched_at": now,
        "region": country,
        "language": language,
        "cache": {"status": cache_status, "fetched_at": now},
        "data": data,
        "availability": data.get("availability", {}),
        "warnings": warnings,
    }
    try:
        await scope.cache.put(key, result, ttl_seconds=300, visibility=visibility)
    except CacheUnavailable:
        result["cache"]["status"] = "unavailable"
    return result


def image_request(url, operation, target):
    """Map only known metadata URLs into a declared source and fixed paths."""
    if not isinstance(url, str) or len(url) > 1000:
        return None
    try:
        parsed = urlsplit(url)
        if (
            parsed.scheme != "https"
            or parsed.username
            or parsed.password
            or parsed.port not in (None, 443)
            or parsed.fragment
        ):
            return None
        if (
            parsed.hostname == "avatars.steamstatic.com"
            and re.fullmatch(r"/[0-9a-f]{40}(?:_full|_medium)?\.jpg", parsed.path)
            and not parsed.query
        ):
            return "steam_avatar", parsed.path, ()
        if (
            operation == "app"
            and parsed.hostname == "shared.akamai.steamstatic.com"
            and re.fullmatch(
                rf"/store_item_assets/steam/apps/{re.escape(target)}/(?:[0-9a-f]{{40}}/)?header\.(?:jpg|png)",
                parsed.path,
            )
            and (not parsed.query or re.fullmatch(r"t=[0-9]{1,20}", parsed.query))
        ):
            return (
                "steam_store_image",
                parsed.path,
                (("t", parsed.query[2:]),) if parsed.query else (),
            )
    except ValueError:
        return None
    return None


def _dimensions(body, media):
    # Reject dimensions before constructing a card. Core remains the decoder
    # and verifies format/pixel budgets; this adapter does not render images.
    if (
        media == "image/png"
        and body.startswith(b"\x89PNG\r\n\x1a\n")
        and len(body) >= 24
        and body[12:16] == b"IHDR"
    ):
        return int.from_bytes(body[16:20], "big"), int.from_bytes(body[20:24], "big")
    if media == "image/jpeg" and body.startswith(b"\xff\xd8"):
        index = 2
        while index + 4 <= len(body):
            if body[index] != 255:
                return None
            while index < len(body) and body[index] == 255:
                index += 1
            if index >= len(body):
                return None
            marker = body[index]
            index += 1
            if marker in (0xD8, 0xD9) or 0xD0 <= marker <= 0xD7:
                continue
            if index + 2 > len(body):
                return None
            length = int.from_bytes(body[index : index + 2], "big")
            if length < 2 or index + length > len(body):
                return None
            if marker in (0xC0, 0xC1, 0xC2) and length >= 8:
                return int.from_bytes(
                    body[index + 5 : index + 7], "big"
                ), int.from_bytes(body[index + 3 : index + 5], "big")
            if marker == 0xDA:
                return None
            index += length
    return None


async def image(scope, projection):
    data, operation, target = (
        projection["data"],
        projection["operation"],
        projection["target"],
    )
    url = (
        data.get("header_image_url")
        if operation == "app"
        else data.get("profile", {}).get("avatar_url")
    )
    request = image_request(url, operation, target)
    if request is None:
        return None
    try:
        source, path, query = request
        body, media = await fetch(
            scope, source, path, query=query, expected="image", max_bytes=512_000
        )
        size = _dimensions(body, media)
        if (
            size is None
            or not all(0 < n <= 2048 for n in size)
            or size[0] * size[1] > 2_000_000
        ):
            return None
        return cards.Asset(
            "png" if media == "image/png" else "jpeg",
            body,
            "Steam 官方图片",
            required=False,
        )
    except (QueryFailure, SourceHttpError, ygl.OperationTimeout):
        return None

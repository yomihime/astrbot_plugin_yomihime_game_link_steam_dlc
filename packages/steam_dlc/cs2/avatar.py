"""Optional Perfect avatars through the CS2-owned public SDK source only."""

import hashlib
import re
from collections.abc import Mapping
from urllib.parse import urlsplit

from yomihime_game_link_sdk import cards
from yomihime_game_link_sdk.errors import (
    AccessDenied,
    CacheUnavailable,
    OperationTimeout,
    ParameterError,
    ServiceUnavailable,
    SourceHttpError,
)
from yomihime_game_link_sdk.services import HttpRequest, ResourceCacheClass
from yomihime_game_link_sdk.storage import (
    CacheLookupStatus,
    CacheQuery,
    CacheVisibility,
)

PUBLIC = CacheVisibility.PUBLIC
MAX_BYTES = 262144
TTL = 86400


def avatar_request(url):
    """Map exactly the observed CDN form; never forward upstream headers."""
    if type(url) is not str or len(url) > 256:
        return None
    try:
        parsed = urlsplit(url)
        if (
            parsed.scheme != "https"
            or parsed.netloc != "img.wmpvp.com"
            or parsed.fragment
            or not re.fullmatch(
                r"/pvp/[0-9a-f]{2}/[0-9a-f]{2}/[0-9a-f]{42}\.png", parsed.path
            )
            or (parsed.query and not re.fullmatch(r"v=[0-9]{1,20}", parsed.query))
            or any(ord(char) <= 32 or ord(char) == 127 for char in url)
        ):
            return None
    except ValueError:
        return None
    return HttpRequest(
        "perfect_avatar",
        parsed.path,
        query=(("v", parsed.query[2:]),) if parsed.query else (),
    )


def _bounded_png(body):
    # Header preflight only; SDK resources.store performs the complete decoder
    # verification before the bytes can become a reusable cached resource.
    if (
        type(body) is not bytes
        or not 33 <= len(body) <= MAX_BYTES
        or not body.startswith(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR")
    ):
        return False
    width = int.from_bytes(body[16:20], "big")
    height = int.from_bytes(body[20:24], "big")
    return 0 < width <= 2048 and 0 < height <= 2048 and width * height <= 2_000_000


async def avatar_asset(scope, url, *, platform="perfect"):
    """Unknown platforms/hosts and optional image failures retain text results."""
    if platform not in ("perfect", "official"):
        return None
    request = avatar_request(url)
    if request is None:
        return None
    identity = request.path + ("?v=" + request.query[0][1] if request.query else "")
    key = "cs2-perfect-avatar:v1:" + hashlib.sha256(identity.encode()).hexdigest()
    try:
        try:
            lookup = await scope.cache.lookup(CacheQuery(key, PUBLIC))
            if lookup.status is CacheLookupStatus.HIT and lookup.entry is not None:
                payload = lookup.entry.payload
                asset_id = (
                    payload.get("asset_id") if isinstance(payload, Mapping) else None
                )
                if type(asset_id) is str and 0 < len(asset_id) <= 256:
                    body = await scope.resources.read(asset_id, visibility=PUBLIC)
                    if _bounded_png(body):
                        return cards.Asset("png", body, "玩家头像", required=False)
        except (ServiceUnavailable, FileNotFoundError, ParameterError):
            pass
        response = await scope.http.fetch(request)
        media = (
            next(
                (v for k, v in response.headers.items() if k.lower() == "content-type"),
                "",
            )
            .split(";", 1)[0]
            .strip()
            .lower()
        )
        final_request = (
            avatar_request(response.final_url)
            if response.final_url is not None
            else None
        )
        # Core final_url deliberately omits query values, and validation may
        # normalize the original request headers. Compare only the controlled
        # source and exact image path after validating the returned URL.
        if (
            response.status_code != 200
            or media != "image/png"
            or not _bounded_png(response.body)
            or (
                response.final_url is not None
                and (
                    final_request is None
                    or final_request.source_id != request.source_id
                    or final_request.path != request.path
                )
            )
        ):
            return None
        reference = await scope.resources.store(
            "image/png",
            response.body,
            visibility=PUBLIC,
            ttl_seconds=TTL,
            cache_class=ResourceCacheClass.RAW,
        )
        try:
            await scope.cache.put(
                key,
                {"asset_id": reference.asset_id},
                ttl_seconds=TTL,
                visibility=PUBLIC,
            )
        except CacheUnavailable:
            pass
        return cards.Asset("png", response.body, "玩家头像", required=False)
    except (
        AccessDenied,
        SourceHttpError,
        OperationTimeout,
        ServiceUnavailable,
        ParameterError,
    ):
        # This image is optional; no upstream error or credential enters output.
        # Cancellation remains outside this catch and the Host still fences the
        # enclosing result against identity/epoch/invocation revocation.
        return None

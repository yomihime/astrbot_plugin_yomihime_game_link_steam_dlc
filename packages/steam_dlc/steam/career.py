"""Steam playtime policy and full-library acquisition through public SDK only."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from decimal import ROUND_HALF_UP, Decimal

import yomihime_game_link_sdk as ygl
from yomihime_game_link_sdk.storage import (
    CacheLookupStatus,
    CacheQuery,
    CacheVisibility,
)

from . import webapi
from .cache_validation import mutable_json
from .normalization import avatar_source, literal
from .queries import QueryFailure, _header, validate_final_url

ANCHORS = {
    "single": (1, 5, 15, 30, 60, 100, 200, 500),
    "standard": (1, 20, 50, 100, 250, 500, 1000, 2000),
    "long": (1, 50, 200, 500, 1000, 2000, 4000, 8000),
}
ASPECT_HEIGHT = {"2:3": 81, "9:16": 96, "1:2": 108}


def span_for_minutes(minutes, preset="standard"):
    """Interpolate target area between fixed hour anchors, then quantize side.

    Square-root half-up rounding is deterministic and monotonic. No library
    maximum or neighboring game affects an individual work's target size.
    """
    anchors = ANCHORS[preset]
    hours = Decimal(str(minutes)) / 60
    if not hours.is_finite() or hours < 0:
        raise ValueError("Invalid cumulative minutes")
    if hours <= anchors[0]:
        return 1
    if hours >= anchors[-1]:
        return 8
    for index, (low, high) in enumerate(zip(anchors, anchors[1:]), 1):
        if hours <= high:
            area = Decimal(index * index) + (hours - low) / (high - low) * (
                (index + 1) ** 2 - index**2
            )
            return int(area.sqrt().to_integral_value(rounding=ROUND_HALF_UP))
    raise ValueError("Invalid playtime preset")


def grid_spec(aspect="2:3", quality="normal"):
    height = ASPECT_HEIGHT[aspect]
    return (54, height) if quality == "normal" else (72, height * 4 // 3)


def preflight(selection):
    """Reject impossible complete outputs before any cover image requests.

    Core performs exact packing and includes measured header/footer pixel work.
    This public-spec lower bound never claims to be the final page count.
    """
    if selection["mode"] == "legacy":
        return
    cell_width, cell_height = grid_spec(selection["aspect"], selection["quality"])
    width = 20 * cell_width
    rows = min(32, max(0, ((128 * 1024 * 1024) // 36 // width) // cell_height))
    if (
        rows < max((row["span"] for row in selection["rows"]), default=1)
        or sum(row["span"] ** 2 for row in selection["rows"]) > 8 * 20 * rows
    ):
        raise QueryFailure(
            ygl.ErrorCode.PARAMETER_ERROR,
            "拼图超过8页像素预算；请减小数量、选择较小倍率预设或普通清晰度。",
        )


async def load_full(scope, target, *, credential_revision=0, cache=True, refresh=False):
    """Full library remains a distinct source, never an anonymous sample fallback."""
    key = f"steam-full-v1:{target}:{credential_revision}"
    if cache and not refresh:
        try:
            found = await scope.cache.lookup(CacheQuery(key, CacheVisibility.USER))
            if found.status is CacheLookupStatus.HIT and found.entry is not None:
                payload = mutable_json(found.entry.payload, max_nodes=400000)
                data = payload["data"]
                rows = data["games"]
                if (
                    payload.get("schema_version") == "steam-full-v1"
                    and payload.get("target") == target
                    and type(rows) is list
                    and len(rows) <= 20000
                ):
                    # Rebuild the same closed adapter shape; do not trust a
                    # mutable cache's claimed count, completeness or precision.
                    raw = {
                        "response": {
                            "game_count": data["count"],
                            "games": [
                                {
                                    "appid": int(row["app_id"]),
                                    "name": row["name"],
                                    "playtime_forever": row["minutes_on_record"],
                                    "playtime_2weeks": row["minutes_2weeks"],
                                }
                                for row in rows
                            ],
                        }
                    }
                    rebuilt = webapi.normalize("games", raw, target)
                    profile = data.get("profile")
                    if (
                        profile is not None
                        and isinstance(profile, dict)
                        and set(profile) == {"nickname", "avatar_url"}
                        and (
                            profile["nickname"] is None
                            or literal(profile["nickname"], 64) == profile["nickname"]
                        )
                        and (
                            profile["avatar_url"] is None
                            or avatar_source(profile["avatar_url"]) is not None
                        )
                    ):
                        rebuilt["profile"] = profile
                    fetched = datetime.fromisoformat(payload["fetched_at"])
                    if (
                        json.dumps(rebuilt, sort_keys=True)
                        == json.dumps(data, sort_keys=True)
                        and fetched.tzinfo is not None
                        and -300 <= (datetime.now(UTC) - fetched).total_seconds() <= 300
                    ):
                        return {
                            "schema_version": "steam-full-v1",
                            "operation": "full",
                            "target": target,
                            "source": "steam_api",
                            "source_endpoint": webapi.request("games", target).path,
                            "scope": "webapi_owned_games",
                            "fetched_at": payload["fetched_at"],
                            "cache": {"status": "hit"},
                            "data": rebuilt,
                            "warnings": [],
                            "source_requests": 0,
                        }
        except (ygl.CacheUnavailable, ValueError, TypeError, KeyError, AttributeError):
            pass
    request = webapi.request("games", target)
    response = await scope.http.fetch(request)
    if response.status_code == 429:
        raise QueryFailure(
            ygl.ErrorCode.RATE_LIMITED, "Steam 完整库来源限流，请稍后重试。"
        )
    if response.status_code in (401, 403):
        raise QueryFailure(
            ygl.ErrorCode.NOT_PUBLIC,
            "Steam Key无效或游戏详情未公开；Key不能绕过隐私，未用公开样本替代。",
        )
    if response.status_code != 200:
        raise QueryFailure(
            ygl.ErrorCode.UPSTREAM_ERROR, "Steam 完整库请求失败，未用公开样本替代。"
        )
    if (
        not isinstance(response.body, bytes)
        or len(response.body) > 2_000_000
        or _header(response, "content-type").split(";", 1)[0].strip().lower()
        != "application/json"
    ):
        raise ValueError("Invalid full library response")
    validate_final_url(response, "steam_api", request.path)
    data = webapi.normalize("games", json.loads(response.body), target)
    if data.get("games") is None:
        raise QueryFailure(
            ygl.ErrorCode.NOT_PUBLIC,
            "Steam 未提供游戏库；可能私密或无权限，未视为空库。",
        )
    requests = 1
    profile_request = webapi.request("profile", target)
    try:
        requests += 1
        profile_response = await scope.http.fetch(profile_request)
        if profile_response.status_code in (401, 403):
            raise QueryFailure(
                ygl.ErrorCode.NOT_PUBLIC,
                "Steam Key或资料授权失效，请检查可信配置；未用公开样本替代。",
            )
        if (
            profile_response.status_code == 200
            and isinstance(profile_response.body, bytes)
            and len(profile_response.body) <= 128000
            and _header(profile_response, "content-type")
            .split(";", 1)[0]
            .strip()
            .lower()
            == "application/json"
        ):
            validate_final_url(profile_response, "steam_api", profile_request.path)
            profile = webapi.normalize(
                "profile", json.loads(profile_response.body), target
            )
            avatar = profile.get("avatar_url")
            data["profile"] = {
                "nickname": literal(profile.get("nickname"), 64),
                "avatar_url": avatar if avatar_source(avatar) is not None else None,
            }
    except ygl.SourceHttpError as exc:
        if exc.code in (
            "credentials_unavailable",
            "request_rejected",
            "source_not_declared",
        ):
            raise
    except (ygl.OperationTimeout, ValueError, TypeError):
        pass
    projection = {
        "schema_version": "steam-full-v1",
        "operation": "full",
        "target": target,
        "source": "steam_api",
        "source_endpoint": request.path,
        "scope": "webapi_owned_games",
        "fetched_at": datetime.now(UTC).isoformat(),
        "cache": {"status": "bypassed"},
        "data": data,
        "warnings": [],
        "source_requests": requests,
    }
    if cache:
        try:
            await scope.cache.put(
                key,
                {
                    "schema_version": "steam-full-v1",
                    "target": target,
                    "fetched_at": projection["fetched_at"],
                    "data": data,
                },
                ttl_seconds=300,
                visibility=CacheVisibility.USER,
            )
        except ygl.CacheUnavailable:
            pass
    return projection

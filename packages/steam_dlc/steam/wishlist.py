"""Anonymous first-party wishlist, with bounded local pages and store enrichment."""

from __future__ import annotations

import re
import shlex
from collections.abc import Mapping
from datetime import UTC, datetime

import yomihime_game_link_sdk as ygl
from yomihime_game_link_sdk.storage import (
    CacheLookupStatus,
    CacheQuery,
    CacheVisibility,
)

from ..shared.output import failure
from .cache_validation import mutable_json
from .normalization import app_id, literal
from .queries import QueryFailure, fetch
from .store_browse import batches as browse_batches
from .store_browse import input_json as browse_input_json

PATH = "/IWishlistService/GetWishlist/v1/"
PAGE_SIZE = 20
STORE_DATA_REQUEST = {"include_basic_info": True, "include_release": True}


def normalize(raw):
    if not isinstance(raw, Mapping) or not isinstance(raw.get("response"), Mapping):
        raise ValueError("愿望单响应结构无法验证。")
    data = raw["response"]
    if "items" not in data:
        raise QueryFailure(
            ygl.ErrorCode.NOT_PUBLIC, "来源未提供愿望单；可能未公开或受限，未视为空单。"
        )
    items = data["items"]
    if not isinstance(items, (list, tuple)):
        raise ValueError("愿望单条目结构无法验证。")
    unique = {}
    for item in items:
        if not isinstance(item, Mapping) or type(item.get("appid")) is not int:
            raise ValueError("愿望单含无法验证的条目，未标记全部完成。")
        target = app_id(str(item["appid"]))
        added = item.get("date_added")
        if type(added) is not int or not 0 <= added <= 253402300799:
            raise ValueError("愿望单添加时间无法验证。")
        if target in unique:
            raise ValueError("愿望单存在重复条目，无法验证完整范围。")
        unique[target] = {
            "app_id": target,
            "date_added": added,
            "store_url": f"https://store.steampowered.com/app/{target}/",
        }
    return sorted(
        unique.values(), key=lambda item: (-item["date_added"], int(item["app_id"]))
    )


async def _enrich(scope, rows, country, language, *, request_counter=None):
    if not rows:
        return [], 0, None
    if len(rows) > PAGE_SIZE:
        raise ValueError("Wishlist enrichment exceeds the current page")
    counter = request_counter if request_counter is not None else {"requests": 0}
    by_id = {row["app_id"]: row for row in rows}
    items, fetched_times = [], []
    for group, _encoded in browse_batches(
        [row["app_id"] for row in rows],
        country,
        language,
        STORE_DATA_REQUEST,
        max_items=PAGE_SIZE,
    ):
        enriched, _requests, fetched_at = await _enrich_batch(
            scope, [by_id[target] for target in group], country, language, counter
        )
        items.extend(enriched)
        if fetched_at is not None:
            fetched_times.append(fetched_at)
    return items, counter["requests"], min(fetched_times) if fetched_times else None


async def _enrich_batch(scope, rows, country, language, request_counter):
    if not rows:
        return [], 0, None
    ids = [row["app_id"] for row in rows]
    key = "steam-wishlist-store-v1:" + country + ":" + language + ":"
    by_id, fetched_times = {}, []
    # Public records contain one app's store facts, never a user's page order,
    # wishlist membership, added time, account, or selected group of app IDs.
    for target in ids:
        try:
            cached = await scope.cache.lookup(
                CacheQuery(key + target, CacheVisibility.PUBLIC)
            )
            if cached.status is not CacheLookupStatus.HIT or cached.entry is None:
                continue
            payload = mutable_json(cached.entry.payload)
            if _valid_enrichment(payload.get("item"), target) and isinstance(
                payload.get("fetched_at"), str
            ):
                fetched = datetime.fromisoformat(payload["fetched_at"])
                if (
                    fetched.tzinfo is not None
                    and -300 <= (datetime.now(UTC) - fetched).total_seconds() <= 300
                ):
                    by_id[target] = payload["item"]
                    fetched_times.append(fetched.astimezone(UTC).isoformat())
        except (ygl.CacheUnavailable, ValueError):
            pass
    missing = [target for target in ids if target not in by_id]
    if not missing:
        return [by_id[target] for target in ids], 0, min(fetched_times)
    encoded = browse_input_json(missing, country, language, STORE_DATA_REQUEST)
    request_counter["requests"] += 1
    try:
        raw = await fetch(
            scope,
            "steam_browse",
            "/IStoreBrowseService/GetItems/v1/",
            (("input_json", encoded),),
        )
    except ygl.SourceHttpError as exc:
        if exc.code in ("request_rejected", "source_not_declared"):
            raise ygl.AccessDenied() from exc
        raise
    items = raw.get("response", {}).get("store_items")
    if not isinstance(items, list) or len(items) > PAGE_SIZE:
        raise ValueError("商店补全返回范围无效。")
    for item in items:
        if not isinstance(item, Mapping) or type(item.get("appid")) is not int:
            continue
        target = str(item["appid"])
        if (
            target not in missing
            or type(item.get("id")) is not int
            or item.get("id") != int(target)
            or type(item.get("item_type")) is not int
            or item.get("item_type") != 0
            or type(item.get("success")) is not int
            or item.get("success") != 1
        ):
            continue
        purchase = item.get("best_purchase_option") or {}
        release = item.get("release") or {}
        if not isinstance(purchase, Mapping) or not isinstance(release, Mapping):
            continue
        price = literal(purchase.get("formatted_final_price"), 128)
        state = (
            "region_locked"
            if item.get("unvailable_for_country_restriction") is True
            else "free"
            if item.get("is_free") is True
            else "unreleased"
            if release.get("is_coming_soon") is True
            or item.get("is_coming_soon") is True
            else "priced"
            if price
            else "no_local_price"
        )
        discount = purchase.get("discount_pct")
        by_id[target] = {
            "app_id": target,
            "name": literal(item.get("name")),
            "price_state": state,
            "price": price,
            "currency": literal(purchase.get("currency_code"), 8),
            "discount_percent": discount
            if type(discount) is int and 0 <= discount <= 100
            else None,
            "release_state": "unreleased"
            if release.get("is_coming_soon") is True
            or item.get("is_coming_soon") is True
            else "released"
            if type(release.get("steam_release_date")) is int
            and release["steam_release_date"] > 0
            else "unknown",
        }
    enriched = [
        by_id.get(
            target,
            {
                "app_id": target,
                "name": None,
                "price_state": "region_or_store_unavailable",
                "price": None,
                "currency": None,
                "discount_percent": None,
                "release_state": "unknown",
            },
        )
        for target in missing
    ]
    fetched_at = datetime.now(UTC).isoformat()
    for item in enriched:
        by_id[item["app_id"]] = item
        try:
            await scope.cache.put(
                key + item["app_id"],
                {"item": item, "fetched_at": fetched_at},
                ttl_seconds=300,
                visibility=CacheVisibility.PUBLIC,
            )
        except ygl.CacheUnavailable:
            pass
    return [by_id[target] for target in ids], 1, min([fetched_at, *fetched_times])


def _valid_enrichment(item, target):
    if not isinstance(item, dict) or item.get("app_id") != target:
        return False
    if set(item) != {
        "app_id",
        "name",
        "price_state",
        "price",
        "currency",
        "discount_percent",
        "release_state",
    }:
        return False
    if item["price_state"] not in (
        "free",
        "unreleased",
        "priced",
        "no_local_price",
        "region_locked",
        "region_or_store_unavailable",
    ) or item["release_state"] not in ("unreleased", "released", "unknown"):
        return False
    for key, maximum in (("name", 300), ("price", 128), ("currency", 8)):
        if item[key] is not None and (
            not isinstance(item[key], str) or literal(item[key], maximum) != item[key]
        ):
            return False
    discount = item["discount_percent"]
    return discount is None or type(discount) is int and 0 <= discount <= 100


class WishlistHandler:
    def __init__(self, owner, *, explicit=False):
        self.owner, self.explicit = owner, explicit

    async def invoke(self, context, parameters):
        from .module import _account, _Handler

        try:
            if not self.owner._running:
                raise ygl.ServiceUnavailable()
            target, page = parameters.get("account"), parameters.get("page", 1)
            country, language = (
                parameters.get("country", "CN"),
                parameters.get("language", "schinese"),
            )
            command = parameters.get("command")
            if command is not None:
                if (
                    context.origin is not ygl.InvocationOrigin.COMMAND
                    or context.parent_id is not None
                    or not isinstance(command, str)
                    or len(command) > 512
                ):
                    raise ValueError("愿望单命令参数无效。")
                args, index, seen = shlex.split(command), 0, set()
                while index < len(args):
                    token = args[index]
                    if token in ("--page", "--country", "--language"):
                        if token in seen or index + 1 >= len(args):
                            raise ValueError("愿望单选项缺值或重复。")
                        seen.add(token)
                        index += 1
                        value = args[index]
                        if token == "--page":
                            if not re.fullmatch(r"[1-9][0-9]{0,8}", value):
                                raise ValueError("页码必须是正整数。")
                            page = int(value)
                        elif token == "--country":
                            country = value
                        else:
                            language = value
                    elif token.startswith("--") or target is not None:
                        raise ValueError("愿望单选项无效或账号重复。")
                    else:
                        target = token
                    index += 1
            if type(page) is not int or not 1 <= page <= 10**9:
                raise ValueError("页码必须是正整数。")
            if (
                not isinstance(country, str)
                or not re.fullmatch(r"[A-Z]{2}", country)
                or not isinstance(language, str)
                or not re.fullmatch(r"[a-z_]{2,24}", language)
            ):
                raise ValueError("地区或Steam语言无效。")
            default_target = target is None
            if default_target:
                if (
                    self.explicit
                    or context.origin is not ygl.InvocationOrigin.COMMAND
                    or context.parent_id is not None
                ):
                    raise ValueError("愿望单工具和页面必须明确提供account。")
                identity = await _Handler(self.owner, "identity").invoke(context, {})
                if identity.status is not ygl.ResultStatus.SUCCESS:
                    return identity
                target = identity.document.ordered_blocks[0].fields["identity"][
                    "steam_id64"
                ]
            target = _account(target)
            scope = await self.owner._services.scopes.bind(context)
            # This source is separate from credential-injected steam_api.
            # Never send a Cookie or require a Steam Key for anonymous reads.
            try:
                raw = await fetch(scope, "steam_wishlist", PATH, (("steamid", target),))
                rows = normalize(raw)
            except (ValueError, TypeError) as exc:
                raise QueryFailure(
                    ygl.ErrorCode.UNPARSED,
                    "愿望单来源结构无法验证，未视为空单或全部完成。",
                ) from exc
            total, pages = len(rows), max(1, (len(rows) + PAGE_SIZE - 1) // PAGE_SIZE)
            if page > pages:
                raise ValueError(f"页码超出当前愿望单范围1..{pages}。")
            current = rows[(page - 1) * PAGE_SIZE : page * PAGE_SIZE]
            store_requests, enrichment_failed, store_fetched_at = 0, False, None
            request_counter = {"requests": 0}
            try:
                metadata, store_requests, store_fetched_at = await _enrich(
                    scope, current, country, language, request_counter=request_counter
                )
                by_id = {row["app_id"]: row for row in metadata}
            except (
                QueryFailure,
                ygl.SourceHttpError,
                ygl.OperationTimeout,
                ValueError,
            ):
                by_id, enrichment_failed = {}, True
                store_requests = request_counter["requests"]
            current = [
                dict(
                    row,
                    **{
                        key: value
                        for key, value in by_id.get(
                            row["app_id"], {"price_state": "fetch_failed"}
                        ).items()
                        if key != "app_id"
                    },
                )
                for row in current
            ]
            sampled = datetime.now(UTC).isoformat()
            data = {
                "target": target,
                "state": "empty" if not rows else "available",
                "total": total,
                "page": page,
                "page_size": PAGE_SIZE,
                "pages": pages,
                "items": current,
                "region": country,
                "language": language,
                "fetched_at": sampled,
                "complete_source": True,
                "store_requests": store_requests,
                "store_fetched_at": store_fetched_at,
                "enrichment_failed": enrichment_failed,
            }
            lines = [
                f"愿望单{total}项 · 第{page}/{pages}页 · 最近添加优先",
                f"地区{country} · 来源时间{sampled}",
                f"商店价格来源时间{store_fetched_at or '未取得'}（当前地区，不表示历史最低价）",
            ]
            states = {
                "free": "免费",
                "unreleased": "未发售",
                "no_local_price": "本地区未提供价格",
                "region_or_store_unavailable": "商店或地区不可用",
                "region_locked": "来源明确标记地区受限",
                "fetch_failed": "商店补全失败",
            }
            for row in current:
                added = datetime.fromtimestamp(row["date_added"], UTC).isoformat()
                price = row.get("price") or states.get(
                    row.get("price_state"), "价格未知"
                )
                lines.append(
                    f"{row.get('name') or '名称未提供'} · AppID {row['app_id']} · 添加{added} · {price} · 币种{row.get('currency') or '未提供'} · 折扣{row.get('discount_percent') if row.get('discount_percent') is not None else '未知'}%\n{row['store_url']}"
                )
            if not rows:
                lines.append("来源明确返回空items；本次公开愿望单为空。")
            lines.append(
                "此第一方端点未保证稳定；价格为当前地区来源数据，不表示历史最低价。"
            )
            return ygl.CapabilityResult(
                "steam-wishlist",
                ygl.ResultStatus.PARTIAL_SUCCESS
                if enrichment_failed
                else ygl.ResultStatus.SUCCESS,
                document=ygl.DisplayDocument(
                    "Steam · 愿望单",
                    "Steam DLC",
                    (
                        ygl.TextBlock("\n".join(lines)),
                        ygl.FieldsBlock(
                            {"wishlist": data}, fallback_text="愿望单分页结果。"
                        ),
                    ),
                ),
                model_facts=None
                if default_target
                else ygl.FactDocument(
                    {
                        "target": target,
                        "total": total,
                        "page": page,
                        "pages": pages,
                        "items": current,
                        "region": country,
                        "fetched_at": sampled,
                    }
                ),
                provenance=("steam_wishlist", "steam_browse"),
            )
        except QueryFailure as exc:
            return failure(exc.code, exc.message, retry_after_seconds=exc.retry_after)
        except (ValueError, TypeError) as exc:
            return failure(
                ygl.ErrorCode.PARAMETER_ERROR,
                str(exc) or "愿望单参数或来源结构无法验证。",
            )
        except ygl.SourceHttpError as exc:
            return failure(
                ygl.ErrorCode.RATE_LIMITED
                if exc.status_code == 429
                else ygl.ErrorCode.UPSTREAM_ERROR,
                "愿望单来源限流。"
                if exc.status_code == 429
                else "愿望单来源请求失败，未视为空单。",
                retry_after_seconds=exc.retry_after_seconds,
            )
        except (
            ygl.ServiceUnavailable,
            ygl.InvalidInvocation,
            ygl.AccessDenied,
            ygl.OperationTimeout,
        ):
            return failure(
                ygl.ErrorCode.MODULE_UNAVAILABLE, "愿望单服务或本次授权暂不可用。"
            )

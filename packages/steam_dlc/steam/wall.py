"""Steam-only wall business decisions, independent of layout and image decoding."""

from __future__ import annotations

import hashlib
import json
import math
import re
import shlex
from collections.abc import Mapping
from decimal import Decimal, InvalidOperation
from typing import Any, TypedDict

from .normalization import app_id, literal

VERSION = "steam-wall-v1"


class _MaterialResult(TypedDict):
    items: list[dict[str, Any]]
    counters: dict[str, int]


def options(context, parameters, *, default_limit=60, default_apps=False):
    result = {
        "account": parameters.get("account"),
        "source": parameters.get("source", "games"),
        "limit": parameters.get("limit", default_limit),
        "all_apps": parameters.get("all_apps", default_apps),
        "refresh": parameters.get("refresh", False),
    }
    raw = parameters.get("command")
    if raw is not None:
        if not isinstance(raw, str) or len(raw) > 512:
            raise ValueError("海报命令参数过长。")
        args = shlex.split(raw)
        seen = set()
        index = 0
        while index < len(args):
            token = args[index]
            if token in ("--all-apps", "--refresh"):
                if token in seen:
                    raise ValueError("选项重复。")
                seen.add(token)
                result["all_apps" if token == "--all-apps" else "refresh"] = True
            elif token in ("--source", "--limit"):
                if token in seen or index + 1 >= len(args):
                    raise ValueError("选项缺值或重复。")
                seen.add(token)
                index += 1
                value = args[index]
                if token == "--limit":
                    if not re.fullmatch(r"[0-9]{1,3}", value):
                        raise ValueError("数量必须是1..200整数。")
                    result["limit"] = int(value)
                else:
                    result["source"] = value
            elif token.startswith("--"):
                raise ValueError("海报不支持此选项。")
            elif "account" in seen or result["account"] is not None:
                raise ValueError("请只提供一个账号。")
            else:
                seen.add("account")
                result["account"] = token
            index += 1
    if (
        result["source"] not in ("games", "recent", "full")
        or type(result["limit"]) is not int
        or not 1 <= result["limit"] <= 200
        or type(result["all_apps"]) is not bool
        or type(result["refresh"]) is not bool
    ):
        raise ValueError("来源为games/recent/full；数量必须是1..200整数。")
    return result


def cumulative(row):
    """Preserve missing/zero separately and keep displayed-hour precision explicit."""
    precision = row.get("precision")
    value = (
        row.get("minutes_on_record")
        if precision == "api_minutes"
        else row.get("hours_on_record")
    )
    if isinstance(value, bool) or not isinstance(value, (str, int, float, Decimal)):
        return None
    try:
        number = Decimal(str(value))
    except InvalidOperation:
        return None
    if not number.is_finite() or number < 0 or number > Decimal(10**12):
        return None
    if precision == "api_minutes":
        if number != number.to_integral_value():
            return None
        return number, f"{number} 分钟", "api_minutes"
    if precision == "displayed_hours":
        return number * 60, f"{value} 小时", "displayed_hours"
    return None


def source_rows(projection):
    rows = projection.get("data", {}).get("games")
    if not isinstance(rows, (list, tuple)) or len(rows) > 20000:
        raise ValueError("来源游戏列表缺失或超过受控范围。")
    unique: dict[str, dict[str, Any]] = {}
    counts = {
        "source_rows": len(rows),
        "invalid_appid": 0,
        "duplicates": 0,
        "duplicate_conflicts": 0,
    }
    for row in rows:
        if not isinstance(row, Mapping):
            counts["invalid_appid"] += 1
            continue
        try:
            target = app_id(row.get("app_id"))
        except (ValueError, TypeError):
            counts["invalid_appid"] += 1
            continue
        value = cumulative(row)
        candidate = {
            "app_id": target,
            "name": literal(row.get("name")) or f"AppID {target}",
            "minutes": str(value[0]) if value else None,
            "duration": value[1] if value else "时长未知",
            "precision": value[2] if value else "unknown",
        }
        previous = unique.get(target)
        if previous is not None:
            counts["duplicates"] += 1
            if previous["minutes"] != candidate["minutes"]:
                counts["duplicate_conflicts"] += 1
            # Never sum duplicate observations. Keep the greatest known cumulative value.
            if candidate["minutes"] is None or (
                previous["minutes"] is not None
                and Decimal(previous["minutes"]) >= Decimal(candidate["minutes"])
            ):
                continue
        unique[target] = candidate
    rows = sorted(
        unique.values(),
        key=lambda row: (
            -(Decimal(row["minutes"]) if row["minutes"] is not None else Decimal(-1)),
            int(row["app_id"]),
        ),
    )
    counts["unique"] = len(rows)
    return rows, counts


def select(projection, materials, *, limit=60, all_apps=False):
    if type(limit) is not int or not 1 <= limit <= 200 or type(all_apps) is not bool:
        raise ValueError("Invalid wall selection")
    rows, counts = source_rows(projection)
    metadata = {
        row["app_id"]: row
        for row in materials.get("items", [])
        if isinstance(row, Mapping) and isinstance(row.get("app_id"), str)
    }
    counts.update(
        {
            "unknown_duration": 0,
            "zero_duration": 0,
            "unknown_type": 0,
            "non_game": 0,
            "eligible": 0,
            "included": 0,
            "missing_images": 0,
        }
    )
    selected: list[dict[str, Any]] = []
    for row in rows:
        data = metadata.get(row["app_id"], {})
        kind = data.get("app_type", "unknown")
        if kind == "unknown":
            counts["unknown_type"] += 1
        elif kind != "game":
            counts["non_game"] += 1
        if row["minutes"] is None:
            counts["unknown_duration"] += 1
            continue
        minutes = Decimal(row["minutes"])
        if minutes == 0:
            counts["zero_duration"] += 1
            continue
        if not all_apps and kind != "game":
            continue
        counts["eligible"] += 1
        if len(selected) >= limit:
            continue
        row = dict(
            row,
            app_type=kind,
            raw_type=data.get("raw_type"),
            asset_id=data.get("asset_id"),
            weight=math.sqrt(float(minutes)),
        )
        if not row["asset_id"]:
            counts["missing_images"] += 1
        selected.append(row)
    counts["included"] = len(selected)
    counts["limited"] = counts["eligible"] - counts["included"]
    counts["filtered"] = counts["unique"] - counts["eligible"]
    counts["displayed_hours"] = sum(
        row["precision"] == "displayed_hours" for row in selected
    )
    counts["api_minutes"] = sum(row["precision"] == "api_minutes" for row in selected)
    counts["metadata_unexamined"] = max(0, len(rows) - 200)
    return {
        "schema": VERSION,
        "rows": selected,
        "counts": counts,
        "scope": projection.get("scope", "unknown"),
        "fetched_at": projection.get("fetched_at"),
        "complete_library": False,
        "rule": "sqrt(cumulative_minutes); equal minutes ordered by numeric AppID",
        "all_apps": all_apps,
        "limit": limit,
        "counters": dict(materials.get("counters", {})),
    }


def selection_key(target, selection, theme):
    # Owner partition is mandatory at the call site, even for explicit public accounts.
    canonical = json.dumps(
        [target, selection, theme],
        sort_keys=True,
        ensure_ascii=False,
        separators=(",", ":"),
    )
    return VERSION + ":result:" + hashlib.sha256(canonical.encode()).hexdigest()


class WallHandler:
    def __init__(self, owner, *, explicit=False):
        self.owner, self.explicit = owner, explicit

    async def invoke(self, context, parameters):
        import yomihime_game_link_sdk as ygl
        from yomihime_game_link_sdk.declarations import CapabilityReference
        from yomihime_game_link_sdk.storage import CacheVisibility

        from ..shared.output import failure
        from .cache_validation import mutable_json
        from .module import _account, _Handler
        from .queries import QueryFailure, load
        from .wall_materials import VERSION as MATERIAL_VERSION
        from .wall_presentation import result

        privacy = ygl.Privacy.PUBLIC if self.explicit else ygl.Privacy.PRIVATE
        if not self.owner._running:
            return failure(
                ygl.ErrorCode.MODULE_UNAVAILABLE, "Steam 模块未启用。", privacy=privacy
            )
        try:
            config = await self.owner._services.config.current()
            settings = config.values
            value = options(
                context,
                parameters,
                default_limit=settings.get("poster_limit", 60),
                default_apps=settings.get("poster_include_apps", False),
            )
            if value["source"] == "full":
                state = {
                    "status": "blocked",
                    "full_library": "optional_key_unconfigured",
                    "complete_library": False,
                    "sample_fallback": False,
                }
                return ygl.CapabilityResult(
                    "steam-wall-full-unconfigured",
                    ygl.ResultStatus.NEEDS_SELECTION,
                    document=ygl.DisplayDocument(
                        "Steam · 完整库海报未配置",
                        "Steam DLC",
                        (
                            ygl.TextBlock(
                                "完整库海报需要可选 Steam Web API user key；当前未配置受控凭据入口，完整库场景blocked/unrun，未用公开样本替代。请明确选择 --source games 或 recent 公开样本。"
                            ),
                            ygl.FieldsBlock({"availability": state}),
                        ),
                        privacy=privacy,
                    ),
                    privacy=privacy,
                    model_facts=ygl.FactDocument(state) if self.explicit else None,
                )
            if context.origin is not ygl.InvocationOrigin.COMMAND and not self.explicit:
                raise ValueError(
                    "默认海报只接受用户直接命令；工具必须明确提供account。"
                )
            target = value["account"]
            if target is None:
                if (
                    self.explicit
                    or context.origin is not ygl.InvocationOrigin.COMMAND
                    or context.parent_id is not None
                    or not context.actor_id
                ):
                    raise ValueError(
                        "工具海报查询必须明确提供account；默认账号只接受用户直接命令。"
                    )
                identity = await _Handler(self.owner, "identity").invoke(context, {})
                if identity.status is not ygl.ResultStatus.SUCCESS:
                    return failure(
                        identity.error.code
                        if identity.error
                        else ygl.ErrorCode.UNBOUND,
                        "尚未关联Steam账号，或身份服务暂不可用。",
                        privacy=privacy,
                    )
                target = identity.document.ordered_blocks[0].fields["identity"][
                    "steam_id64"
                ]
            target = _account(target)
            scope = await self.owner._services.scopes.bind(context)
            projection = await load(scope, value["source"], target)
            rows, _ = source_rows(projection)
            # Only a bounded public AppID set crosses the preparation capability.
            candidates = [row["app_id"] for row in rows[:200]]
            country, language = "CN", "schinese"
            combined: _MaterialResult = {"items": [], "counters": {}}

            async def materials(phase, appids):
                response = await scope.dependencies.invoke(
                    context,
                    CapabilityReference("steam_dlc/steam", "wall_materials"),
                    {
                        "phase": phase,
                        "app_ids": appids,
                        "country": country,
                        "language": language,
                        "refresh": value["refresh"],
                    },
                )
                if response.status is ygl.ResultStatus.ERROR:
                    raise ygl.ServiceUnavailable()
                if response.document is None or not response.document.ordered_blocks:
                    raise ValueError("Invalid material response")
                block = response.document.ordered_blocks[0]
                payload = mutable_json(block.fields["materials"])
                if (
                    payload.get("schema") != MATERIAL_VERSION
                    or not isinstance(payload.get("items"), list)
                    or len(payload["items"]) > len(appids)
                    or not isinstance(payload.get("counters"), dict)
                    or any(
                        type(v) is not int or v < 0
                        for v in payload["counters"].values()
                    )
                ):
                    raise ValueError("Invalid material DTO")
                for row in payload["items"]:
                    if not isinstance(row, dict) or row.get("app_id") not in appids:
                        raise ValueError("Unexpected material AppID")
                for key, count in payload["counters"].items():
                    combined["counters"][key] = (
                        max(combined["counters"].get(key, 0), count)
                        if key == "retry_after"
                        else combined["counters"].get(key, 0) + count
                    )
                return payload

            if candidates:
                metadata = await materials("metadata", candidates)
                chosen = select(
                    projection,
                    metadata,
                    limit=value["limit"],
                    all_apps=value["all_apps"],
                )
                if chosen["rows"]:
                    combined["items"] = (
                        await materials(
                            "images", [row["app_id"] for row in chosen["rows"]]
                        )
                    )["items"]
                # Retain classification for excluded rows so coverage counts stay truthful.
                returned = {row["app_id"]: row for row in combined["items"]}
                combined["items"] = [
                    dict(
                        row,
                        **(
                            {"asset_id": returned[row["app_id"]].get("asset_id")}
                            if row["app_id"] in returned
                            else {}
                        ),
                    )
                    for row in metadata["items"]
                ]
            combined["counters"]["list_requests"] = (
                0 if projection.get("cache", {}).get("status") == "hit" else 1
            )
            selection = select(
                projection, combined, limit=value["limit"], all_apps=value["all_apps"]
            )
            theme = settings.get("reply_theme", "warm_paper")
            if theme not in ("warm_paper", "cool_white", "deep_indigo"):
                theme = "warm_paper"
            try:
                await scope.cache.put(
                    selection_key(target, selection, theme),
                    selection,
                    ttl_seconds=300,
                    visibility=CacheVisibility.USER,
                )
            except ygl.CacheUnavailable:
                pass
            return result(selection, private=not self.explicit, theme=theme)
        except (ValueError, TypeError, KeyError, AttributeError):
            return failure(
                ygl.ErrorCode.PARAMETER_ERROR,
                "海报参数或来源结构无效；未将缺失资料视为零。",
                privacy=privacy,
            )
        except QueryFailure as exc:
            return failure(
                exc.code,
                exc.message,
                privacy=privacy,
                retry_after_seconds=exc.retry_after,
            )
        except ygl.SourceHttpError as exc:
            return failure(
                ygl.ErrorCode.RATE_LIMITED
                if exc.status_code == 429
                else ygl.ErrorCode.UPSTREAM_ERROR,
                "Steam 列表来源暂不可用。",
                privacy=privacy,
                retry_after_seconds=exc.retry_after_seconds,
            )
        except (ygl.ServiceUnavailable, ygl.InvalidInvocation, ygl.AccessDenied):
            return failure(
                ygl.ErrorCode.MODULE_UNAVAILABLE,
                "海报SDK服务或本次授权暂不可用。",
                privacy=privacy,
            )
        except ygl.OperationTimeout:
            return failure(
                ygl.ErrorCode.UPSTREAM_ERROR, "Steam海报准备超时。", privacy=privacy
            )
        except PermissionError:
            return failure(
                ygl.ErrorCode.NOT_PUBLIC, "Steam样本未公开或需要登录。", privacy=privacy
            )


class MaterialsHandler:
    def __init__(self, owner):
        self.owner = owner

    async def invoke(self, context, parameters):
        import yomihime_game_link_sdk as ygl

        from ..shared.output import failure

        if not self.owner._running:
            return failure(ygl.ErrorCode.MODULE_UNAVAILABLE, "Steam模块未启用。")
        try:
            phase = parameters.get("phase")
            appids = parameters.get("app_ids")
            if phase not in ("metadata", "images") or not isinstance(
                appids, (list, tuple)
            ):
                raise ValueError
            if not 1 <= len(appids) <= 200 or any(
                not isinstance(v, str) for v in appids
            ):
                raise ValueError
            scope = await self.owner._services.scopes.bind(context)
            payload = await self.owner._materials.prepare(
                scope,
                appids,
                parameters.get("country", "CN"),
                parameters.get("language", "schinese"),
                parameters.get("refresh", False),
                phase=phase,
            )
            return ygl.CapabilityResult(
                "steam-wall-materials",
                ygl.ResultStatus.SUCCESS,
                document=ygl.DisplayDocument(
                    "Steam公共素材",
                    "Steam DLC",
                    (
                        ygl.FieldsBlock(
                            {"materials": payload},
                            fallback_text="公开AppID素材准备结果。",
                        ),
                    ),
                ),
            )
        except ValueError:
            return failure(
                ygl.ErrorCode.PARAMETER_ERROR,
                "公开素材需要有效AppID列表、phase和地区语言。",
            )


class CacheStatusHandler:
    def __init__(self, owner):
        self.owner = owner

    async def invoke(self, context, parameters):
        import yomihime_game_link_sdk as ygl
        from yomihime_game_link_sdk.storage import CacheVisibility

        from ..shared.output import failure

        if not self.owner._running:
            return failure(ygl.ErrorCode.MODULE_UNAVAILABLE, "Steam模块未启用。")
        scope = await self.owner._services.scopes.bind(context)
        stats = await scope.resources.stats(visibility=CacheVisibility.PUBLIC)
        fields = {
            key: getattr(stats, key)
            for key in ("bytes", "items", "max_bytes", "max_items", "evictions")
        }
        return ygl.CapabilityResult(
            "steam-wall-cache",
            ygl.ResultStatus.SUCCESS,
            document=ygl.DisplayDocument(
                "公共海报素材缓存",
                "Steam DLC",
                (
                    ygl.FieldsBlock(
                        {"cache": fields},
                        fallback_text=f"已缓存{stats.items}项/{stats.bytes}字节。",
                    ),
                ),
            ),
        )

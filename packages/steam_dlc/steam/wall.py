"""Steam-only wall business decisions, independent of layout and image decoding."""

from __future__ import annotations

import math
import re
import shlex
from collections.abc import Mapping
from decimal import Decimal, InvalidOperation
from typing import Any

from .normalization import app_id, literal

VERSION = "steam-wall-v1"
MAX_SAFE_LIMIT = 2**53 - 1
_DECIMAL = re.compile(r"[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?\Z")


def parse_limit(value):
    """Full finite decimal, truncated toward zero, with JSON-safe integer output."""
    if isinstance(value, bool) or not isinstance(value, (str, int, float, Decimal)):
        raise ValueError("数量必须是完整有限数值。")
    raw = str(value).strip()
    if len(raw) > 128 or not _DECIMAL.fullmatch(raw):
        raise ValueError("数量必须是完整有限数值，不能为空或包含其他文字。")
    try:
        number = Decimal(raw)
    except InvalidOperation as exc:
        raise ValueError("数量必须是完整有限数值。") from exc
    if not number.is_finite() or number.copy_abs() >= Decimal(MAX_SAFE_LIMIT + 1):
        raise ValueError("数量超过安全数值范围，请选择不限。")
    converted = int(number)
    if converted < 20:
        raise ValueError("数量向零截断后至少为20。")
    return converted


def options(
    context, parameters, *, default_limit=500, default_apps=True, defaults=None
):
    defaults = defaults or {}
    result = {
        "account": parameters.get("account"),
        "source": parameters.get("source", defaults.get("poster_source", "games")),
        "limit": parameters.get("limit", default_limit),
        "limit_mode": parameters.get(
            "limit_mode", defaults.get("poster_limit_mode", "top")
        ),
        "all_apps": parameters.get("all_apps", default_apps),
        "refresh": parameters.get("refresh", False),
        **{
            key: parameters.get(key, defaults.get("poster_" + key, value))
            for key, value in (
                ("mode", "dense"),
                ("preset", "standard"),
                ("aspect", "2:3"),
                ("quality", "normal"),
                ("fit", "cover"),
            )
        },
    }
    raw = parameters.get("command")
    seen = set()
    if raw is not None:
        if not isinstance(raw, str) or len(raw) > 512:
            raise ValueError("海报命令参数过长。")
        args = shlex.split(raw)
        index = 0
        while index < len(args):
            token = args[index]
            if token in ("--all-apps", "--games-only", "--refresh"):
                if (
                    token in seen
                    or (token == "--games-only" and "--all-apps" in seen)
                    or (token == "--all-apps" and "--games-only" in seen)
                ):
                    raise ValueError("选项重复。")
                seen.add(token)
                if token == "--games-only":
                    result["all_apps"] = False
                else:
                    result["all_apps" if token == "--all-apps" else "refresh"] = True
            elif token in (
                "--source",
                "--limit",
                "--mode",
                "--preset",
                "--aspect",
                "--quality",
                "--fit",
            ):
                if token in seen or index + 1 >= len(args):
                    raise ValueError("选项缺值或重复。")
                seen.add(token)
                index += 1
                value = args[index]
                if token == "--limit":
                    if value == "all":
                        result["limit_mode"] = "all"
                    else:
                        result["limit_mode"] = "top"
                        result["limit"] = parse_limit(value)
                else:
                    result[token[2:]] = value
            elif token.startswith("--"):
                raise ValueError("海报不支持此选项。")
            elif "account" in seen or result["account"] is not None:
                raise ValueError("请只提供一个账号。")
            else:
                seen.add("account")
                result["account"] = token
            index += 1
    # Structured tools have an integer contract; only CLI/UI accept decimal text.
    if "limit" in parameters and raw is None:
        if type(parameters["limit"]) is not int:
            raise ValueError("结构化数量必须是整数；不限请使用limit_mode=all。")
    result["limit"] = parse_limit(result["limit"])
    if (
        result["mode"] == "legacy"
        and "limit" not in parameters
        and "--limit" not in seen
    ):
        result["limit"] = min(result["limit"], 200)
    if (
        result["source"] not in ("games", "recent", "full")
        or type(result["limit"]) is not int
        or result["limit"] < 20
        or result["limit_mode"] not in ("top", "all")
        or type(result["all_apps"]) is not bool
        or type(result["refresh"]) is not bool
        or result["mode"] not in ("dense", "legacy")
        or result["preset"] not in ("single", "standard", "long")
        or result["aspect"] not in ("2:3", "9:16", "1:2")
        or result["quality"] not in ("normal", "hd")
        or result["fit"] not in ("cover", "contain")
        or (
            result["mode"] == "legacy"
            and (result["limit"] > 200 or result["limit_mode"] == "all")
        )
    ):
        raise ValueError(
            "来源games/recent/full；数量至少20或不限，legacy最多200；请检查预设/比例/清晰度/裁剪选项。"
        )
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
    if not isinstance(rows, (list, tuple)):
        raise ValueError("来源游戏列表缺失；未将缺失资料视为空库。")
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


def select(
    projection,
    materials,
    *,
    limit=60,
    all_apps=False,
    mode="legacy",
    preset="standard",
    aspect="2:3",
    quality="normal",
    fit="cover",
    limit_mode="top",
):
    from .career import span_for_minutes

    if (
        type(limit) is not int
        or not 1 <= limit <= (MAX_SAFE_LIMIT if mode == "dense" else 200)
        or limit_mode not in ("top", "all")
        or type(all_apps) is not bool
    ):
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
            "names_truncated": 0,
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
        if limit_mode == "top" and len(selected) >= limit:
            continue
        row = dict(
            row,
            app_type=kind,
            raw_type=data.get("raw_type"),
            asset_id=data.get("asset_id"),
            weight=math.sqrt(float(minutes)),
            span=span_for_minutes(minutes, preset),
        )
        if mode == "dense" and len(row["name"]) > 56:
            row["name"] = row["name"][:56] + "…"
            counts["names_truncated"] += 1
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
    counts["metadata_unexamined"] = sum(
        (
            row["app_id"] not in metadata
            or metadata[row["app_id"]].get("app_type", "unknown") == "unknown"
        )
        and row["minutes"] is not None
        and Decimal(row["minutes"]) > 0
        for row in rows
    )
    counts["examined"] = sum(
        row["app_id"] in metadata
        and row["minutes"] is not None
        and Decimal(row["minutes"]) > 0
        for row in rows
    )
    counts["unexamined"] = sum(
        row["app_id"] not in metadata
        and row["minutes"] is not None
        and Decimal(row["minutes"]) > 0
        for row in rows
    )
    counts["classification_unknown"] = (
        counts["metadata_unexamined"] - counts["unexamined"]
    )
    if not all_apps:
        # Unknown types remain unresolved, rather than counted as filtered out.
        counts["filtered"] -= counts["metadata_unexamined"]
    counts["requested"] = "all" if limit_mode == "all" else limit
    counts["omitted"] = counts["limited"]
    return {
        "schema": VERSION,
        "rows": selected,
        "counts": counts,
        "scope": projection.get("scope", "unknown"),
        "fetched_at": projection.get("fetched_at"),
        "complete_library": projection.get("data", {}).get("complete_library") is True,
        "all_eligible_included": counts["limited"] == 0
        and (all_apps or counts["metadata_unexamined"] == 0),
        "eligible_complete": all_apps or counts["metadata_unexamined"] == 0,
        "mode": mode,
        "preset": preset,
        "aspect": aspect,
        "quality": quality,
        "fit": fit,
        "nickname": projection.get("data", {}).get("nickname"),
        "profile": projection.get("data", {}).get("profile"),
        "rule": "sqrt(cumulative_minutes); equal minutes ordered by numeric AppID",
        "all_apps": all_apps,
        "limit": limit,
        "limit_mode": limit_mode,
        "counters": dict(materials.get("counters", {})),
    }


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

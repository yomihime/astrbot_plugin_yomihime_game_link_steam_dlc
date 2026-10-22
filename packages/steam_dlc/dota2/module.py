"""SDK-backed Dota 2 public query capabilities."""

from __future__ import annotations

import json
import re
import shlex
from collections.abc import Mapping
from datetime import UTC, datetime
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import yomihime_game_link_sdk as ygl
from yomihime_game_link_sdk.contexts import InvocationOrigin, InvocationView
from yomihime_game_link_sdk.declarations import CapabilityReference
from yomihime_game_link_sdk.display import FieldsBlock
from yomihime_game_link_sdk.errors import (
    AccessDenied,
    CacheUnavailable,
    InvalidInvocation,
    OperationTimeout,
    ServiceUnavailable,
    SourceHttpError,
)
from yomihime_game_link_sdk.results import ErrorCode, ResultStatus
from yomihime_game_link_sdk.services import (
    CapabilityHealth,
    HealthReport,
    HealthStatus,
    HttpRequest,
    ModuleHandlers,
    ModuleServices,
)
from yomihime_game_link_sdk.storage import (
    CacheLookupStatus,
    CacheQuery,
    CacheVisibility,
)

from ..shared.contracts import MatchSummary, PlayerProfile, RecentMatch
from ..shared.hero_names import HERO_NAMES
from ..shared.output import failure, success
from ..shared.steam_ids import account_id32, parse_dota_account, parse_steam_id
from .normalization import normalize_match, normalize_profile, normalize_recent
from .presentation import report_result
from .statistics import project_stats

_SOURCE = "opendota"
_MAX_RESPONSE_BYTES = 1_000_000
_CACHE_TTL = 300
_MATCH_ID = re.compile(r"[1-9][0-9]{0,23}\Z")
_DECIMAL = re.compile(r"[0-9]+\Z")


class Factory:
    async def create(self, services: ModuleServices) -> "Dota2Module":
        return Dota2Module(services)


class Dota2Module:
    def __init__(self, services: ModuleServices) -> None:
        self._services = services
        self._started = False

    def handlers(self) -> ModuleHandlers:
        return ModuleHandlers(
            capabilities={
                "recent": _Query(self, "recent"),
                "profile": _Query(self, "profile"),
                "match": _Query(self, "match"),
                "stats": _Query(self, "stats"),
                "stats_explicit": _Query(self, "stats"),
                "last": _Query(self, "last"),
                "last_explicit": _Query(self, "last"),
                "status": _Status(),
            },
            collectors={},
            evaluators={},
        )

    async def start(self) -> None:
        self._started = True

    async def stop(self) -> None:
        self._started = False

    async def check_health(self) -> HealthReport:
        state = HealthStatus.AVAILABLE if self._started else HealthStatus.UNAVAILABLE
        reason = None if self._started else "Dota2 module is stopped"
        return HealthReport(
            capabilities={
                capability: CapabilityHealth(status=state, reason=reason)
                for capability in (
                    "recent",
                    "profile",
                    "match",
                    "stats",
                    "stats_explicit",
                    "last",
                    "last_explicit",
                    "status",
                )
            }
        )


class _Status:
    async def invoke(self, context: InvocationView, parameters: ygl.JsonObject):
        del context, parameters
        return success(
            "Dota 2 状态",
            [
                "最近战绩、近期样本统计、玩家资料、上一场和指定玩家战报已实现；使用 OpenDota 公开数据，不提交解析。"
            ],
            {"module": "dota2", "implemented": True, "source": _SOURCE},
        )


class _Query:
    def __init__(self, owner: Dota2Module, operation: str) -> None:
        self.owner = owner
        self.operation = operation

    async def invoke(self, context: InvocationView, parameters: ygl.JsonObject):
        if not self.owner._started:
            return failure(ErrorCode.MODULE_UNAVAILABLE, "Dota 2 模块当前未运行。")
        selected_last = False
        try:
            target, limit, match_id, default_target = await _resolve_input(
                self.owner._services, context, parameters, self.operation
            )
            scope = await self.owner._services.scopes.bind(context)
            if self.operation == "last":
                selection = await _load_projection(scope, "last", target, 20, None)
                selected_last = True
                projection = await _load_projection(
                    scope, "match", None, None, selection["match_id"]
                )
                projection = {**projection, "last": selection}
            else:
                projection = await _load_projection(
                    scope, self.operation, target, limit, match_id
                )
            if self.operation in ("last", "match") and target is not None:
                projection = {
                    **projection,
                    "focus": _focus(projection["match"], target),
                }
            timezone_name = await _timezone_name(self.owner._services)
            return _result(self.operation, projection, default_target, timezone_name)
        except _QueryFailure as exc:
            message = exc.message
            if selected_last:
                message += " 最近列表首条有效比赛的详情未能取得；未改查更早比赛。"
            return failure(exc.code, message)
        except SourceHttpError as exc:
            return _source_failure(exc)
        except OperationTimeout:
            return failure(ErrorCode.UPSTREAM_ERROR, "OpenDota 查询超时，请稍后重试。")
        except (InvalidInvocation, AccessDenied):
            return failure(
                ErrorCode.MODULE_UNAVAILABLE, "本次调用授权已失效，请重新发起查询。"
            )
        except ServiceUnavailable:
            return failure(ErrorCode.MODULE_UNAVAILABLE, "Dota 2 查询服务暂不可用。")
        except (ValueError, TypeError, json.JSONDecodeError):
            return failure(ErrorCode.UNPARSED, "OpenDota 返回的数据格式无法识别。")
        except Exception:
            return failure(ErrorCode.MODULE_UNAVAILABLE, "Dota 2 查询服务暂不可用。")


class _QueryFailure(Exception):
    def __init__(self, code: ErrorCode, message: str):
        self.code = code
        self.message = message


def _source_failure(exc: SourceHttpError):
    if exc.status_code == 404:
        return failure(ErrorCode.NOT_FOUND, "OpenDota 没有找到该比赛或账号。")
    if exc.status_code == 429:
        retry_after = _retry_after_seconds(getattr(exc, "retry_after_seconds", None))
        return failure(
            ErrorCode.RATE_LIMITED,
            "OpenDota 请求过于频繁，请稍后重试。",
            retry_after_seconds=retry_after,
        )
    if exc.status_code is not None:
        return failure(ErrorCode.UPSTREAM_ERROR, "OpenDota 暂时无法完成查询。")
    if exc.code == "timeout":
        return failure(ErrorCode.UPSTREAM_ERROR, "OpenDota 查询超时，请稍后重试。")
    if exc.code == "rate_limited":
        return failure(
            ErrorCode.RATE_LIMITED, "OpenDota 请求额度暂不可用，请稍后重试。"
        )
    return failure(ErrorCode.MODULE_UNAVAILABLE, "OpenDota 数据源暂时不可用。")


async def _resolve_input(services, context, parameters, operation):
    if operation == "match":
        if context.origin is InvocationOrigin.COMMAND:
            raw = parameters.get("command")
            if not isinstance(raw, str):
                raise _QueryFailure(ErrorCode.PARAMETER_ERROR, "请提供比赛 ID。")
            args = _command_tokens(raw)
            if (
                len(args) not in (1, 3)
                or not _MATCH_ID.fullmatch(args[0])
                or (len(args) == 3 and args[1] != "--account")
            ):
                raise _QueryFailure(
                    ErrorCode.PARAMETER_ERROR,
                    "用法：/ygl dota2 match <比赛ID> [--account <账号>]",
                )
            target = _explicit_account(args[2]) if len(args) == 3 else None
            return target, None, args[0], False
        match_id = parameters.get("match_id")
        if not isinstance(match_id, (str, int)) or isinstance(match_id, bool):
            raise _QueryFailure(
                ErrorCode.PARAMETER_ERROR, "比赛查询需要明确提供比赛 ID。"
            )
        match_id = str(match_id)
        if not _MATCH_ID.fullmatch(match_id):
            raise _QueryFailure(ErrorCode.PARAMETER_ERROR, "比赛 ID 必须是正整数。")
        target = (
            _explicit_account(parameters["account"])
            if "account" in parameters
            else None
        )
        return target, None, match_id, False

    if context.origin is InvocationOrigin.COMMAND:
        raw = parameters.get("command")
        if not isinstance(raw, str):
            raise _QueryFailure(ErrorCode.PARAMETER_ERROR, "命令参数格式无效。")
        args = _command_tokens(raw)
        if operation in ("recent", "stats"):
            account_text, limit = _parse_recent_args(
                args,
                default=20 if operation == "stats" else 5,
                operation=operation,
            )
        else:
            if len(args) > 1:
                raise _QueryFailure(
                    ErrorCode.PARAMETER_ERROR, f"用法：/ygl dota2 {operation} [账号]"
                )
            account_text, limit = (
                (args[0] if args else None),
                20 if operation == "last" else 5,
            )
        if account_text is None:
            identity = await _default_identity(services, context)
            return identity["account_id32"], limit or 5, None, True
        try:
            return parse_dota_account(account_text), limit or 5, None, False
        except ValueError:
            raise _QueryFailure(
                ErrorCode.PARAMETER_ERROR, "账号必须是合法 Dota ID32 或 SteamID64。"
            ) from None

    account = parameters.get("account")
    if not isinstance(account, str):
        raise _QueryFailure(ErrorCode.PARAMETER_ERROR, "工具查询必须明确提供账号。")
    try:
        account_id = parse_dota_account(account)
    except ValueError:
        raise _QueryFailure(
            ErrorCode.PARAMETER_ERROR, "账号必须是合法 Dota ID32 或 SteamID64。"
        ) from None
    limit = 20 if operation in ("stats", "last") else 5
    if operation in ("recent", "stats"):
        value = parameters.get("limit", limit)
        if isinstance(value, bool):
            raise _QueryFailure(
                ErrorCode.PARAMETER_ERROR, "场次数量必须是 1 到 20 的整数。"
            )
        if isinstance(value, str) and _DECIMAL.fullmatch(value):
            value = int(value)
        if not isinstance(value, int) or not 1 <= value <= 20:
            raise _QueryFailure(
                ErrorCode.PARAMETER_ERROR, "场次数量必须是 1 到 20 的整数。"
            )
        limit = value
    return account_id, limit, None, False


def _command_tokens(raw: str) -> list[str]:
    if len(raw) > 256:
        raise _QueryFailure(ErrorCode.PARAMETER_ERROR, "命令参数过长。")
    try:
        return shlex.split(raw, posix=True)
    except ValueError:
        raise _QueryFailure(ErrorCode.PARAMETER_ERROR, "命令参数格式无效。") from None


def _explicit_account(value):
    if not isinstance(value, str):
        raise _QueryFailure(
            ErrorCode.PARAMETER_ERROR, "账号必须是 Dota ID32 或 SteamID64 字符串。"
        )
    try:
        return parse_dota_account(value)
    except ValueError:
        raise _QueryFailure(
            ErrorCode.PARAMETER_ERROR, "账号必须是合法 Dota ID32 或 SteamID64。"
        ) from None


def _parse_recent_args(
    args: list[str], *, default=5, operation="recent"
) -> tuple[str | None, int]:
    account = None
    limit = default
    limit_seen = False
    index = 0
    while index < len(args):
        token = args[index]
        if (
            token == "--limit"
            and index + 1 < len(args)
            and _DECIMAL.fullmatch(args[index + 1])
        ):
            if limit_seen:
                raise _QueryFailure(ErrorCode.PARAMETER_ERROR, "--limit 只能指定一次。")
            limit = int(args[index + 1])
            limit_seen = True
            index += 2
        elif token.startswith("--"):
            raise _QueryFailure(ErrorCode.PARAMETER_ERROR, "支持的参数只有 --limit N。")
        elif account is None:
            account = token
            index += 1
        else:
            raise _QueryFailure(
                ErrorCode.PARAMETER_ERROR,
                f"用法：/ygl dota2 {operation} [账号] [--limit N]",
            )
    if not 1 <= limit <= 20:
        raise _QueryFailure(ErrorCode.PARAMETER_ERROR, "场次数量必须是 1 到 20。")
    return account, limit


async def _default_identity(services, context) -> dict[str, Any]:
    try:
        scope = await services.scopes.bind(context)
        result = await scope.dependencies.invoke(
            context,
            CapabilityReference("steam_dlc/steam", "identity"),
            {},
        )
    except (InvalidInvocation, AccessDenied):
        raise
    except (OperationTimeout, ServiceUnavailable):
        raise
    except Exception:
        raise _QueryFailure(
            ErrorCode.MODULE_UNAVAILABLE, "Steam 身份服务当前不可用。"
        ) from None
    if result.status is not ResultStatus.SUCCESS:
        code = result.error.code if result.error is not None else None
        if code is ErrorCode.UNBOUND:
            raise _QueryFailure(
                ErrorCode.UNBOUND, "你还没有绑定 Steam 账号，请先执行 /ygl steam bind。"
            )
        raise _QueryFailure(ErrorCode.MODULE_UNAVAILABLE, "Steam 身份服务当前不可用。")
    document = result.document
    if (
        result.model_facts is not None
        or document is None
        or result.privacy is not ygl.Privacy.PRIVATE
        or document.privacy is not ygl.Privacy.PRIVATE
    ):
        raise _QueryFailure(
            ErrorCode.MODULE_UNAVAILABLE, "Steam 身份服务返回了无效身份。"
        )
    fields_blocks = [
        block for block in document.ordered_blocks if isinstance(block, FieldsBlock)
    ]
    if len(fields_blocks) != 1 or set(fields_blocks[0].fields) != {"identity"}:
        raise _QueryFailure(
            ErrorCode.MODULE_UNAVAILABLE, "Steam 身份服务返回了无效身份。"
        )
    identity = fields_blocks[0].fields.get("identity")
    if not isinstance(identity, Mapping) or set(identity) != {
        "steam_id64",
        "account_id32",
        "binding_revision",
        "association",
    }:
        raise _QueryFailure(
            ErrorCode.MODULE_UNAVAILABLE, "Steam 身份服务返回了无效身份。"
        )
    try:
        steam_value = identity.get("steam_id64")
        if not isinstance(steam_value, str):
            raise ValueError
        steam_id64 = parse_steam_id(steam_value)
        account = identity.get("account_id32")
        revision = identity.get("binding_revision")
        if (
            isinstance(account, bool)
            or not isinstance(account, int)
            or account_id32(steam_id64) != account
        ):
            raise ValueError
        if isinstance(revision, bool) or not isinstance(revision, int) or revision < 0:
            raise ValueError
        association = identity.get("association")
        if not isinstance(association, str) or len(association) > 32:
            raise ValueError
    except (ValueError, TypeError):
        raise _QueryFailure(
            ErrorCode.MODULE_UNAVAILABLE, "Steam 身份服务返回了无效身份。"
        ) from None
    return {
        "steam_id64": steam_id64,
        "account_id32": account,
        "binding_revision": revision,
        "association": association,
    }


async def _fetch(scope, operation, target, limit, match_id):
    query: tuple[tuple[str, str], ...]
    if operation in ("recent", "stats", "last"):
        path = f"/api/players/{target}/matches"
        query = (("significant", "0"), ("limit", str(limit)))
    elif operation == "profile":
        path = f"/api/players/{target}"
        query = ()
    else:
        path = f"/api/matches/{match_id}"
        query = ()
    response = await scope.http.fetch(HttpRequest(_SOURCE, path, "GET", query))
    status = response.status_code
    if status == 404:
        raise _QueryFailure(ErrorCode.NOT_FOUND, "OpenDota 没有找到该比赛或账号。")
    if status == 429:
        retry = next(
            (v for k, v in response.headers.items() if k.lower() == "retry-after"), None
        )
        suffix = (
            f"（Retry-After: {_safe_retry_after(retry)}）"
            if _safe_retry_after(retry)
            else ""
        )
        raise _QueryFailure(
            ErrorCode.RATE_LIMITED, f"OpenDota 请求过于频繁，请稍后重试{suffix}。"
        )
    if status < 200 or status >= 300:
        raise _QueryFailure(ErrorCode.UPSTREAM_ERROR, "OpenDota 暂时无法完成查询。")
    body = response.body
    if not isinstance(body, bytes) or len(body) > _MAX_RESPONSE_BYTES:
        raise _QueryFailure(ErrorCode.UPSTREAM_ERROR, "OpenDota 响应超出安全读取上限。")
    try:
        return json.loads(body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        raise _QueryFailure(
            ErrorCode.UNPARSED, "OpenDota 返回的数据格式无法识别。"
        ) from None


def _safe_retry_after(value):
    if not isinstance(value, str):
        return None
    value = value.strip()
    return (
        value[:64]
        if value and len(value) <= 128 and all(ord(ch) >= 32 for ch in value)
        else None
    )


def _cache_key(operation, target, limit, match_id):
    if operation == "match":
        return f"opendota:match:v2:{match_id}"
    if operation in ("stats", "last"):
        return f"opendota:{operation}:v1:{target}:{limit}"
    return f"opendota:{operation}:{target if target is not None else match_id}:{limit if limit is not None else '-'}"


async def _load_projection(scope, operation, target, limit, match_id):
    key = _cache_key(operation, target, limit, match_id)
    projection = await _cache_get(scope, key)
    hit = projection is not None
    if projection is None:
        payload = await _fetch(scope, operation, target, limit, match_id)
        projection = _project(operation, payload, target, limit, match_id)
        if operation in ("stats", "last", "match"):
            projection["fetched_at"] = datetime.now(UTC).isoformat()
        await _cache_put(scope, key, projection)
    if operation in ("stats", "last", "match"):
        return {**projection, "cache_hit": hit}
    return projection


def _focus(match, target):
    account = str(target)
    found = [p for p in match["players"] if p["account_id32"] == account]
    status = "found" if len(found) == 1 else "ambiguous" if found else "not_found"
    return {
        "account_id32": account,
        "status": status,
        "player": found[0] if status == "found" else None,
        "anonymous_players": sum(p["account_id32"] is None for p in match["players"]),
    }


async def _cache_get(scope, key):
    try:
        result = await scope.cache.lookup(CacheQuery(key, CacheVisibility.PUBLIC))
    except CacheUnavailable:
        return None
    if result.status is not CacheLookupStatus.HIT or result.entry is None:
        return None
    projection = result.entry.payload.get("projection")
    return projection if isinstance(projection, Mapping) else None


async def _cache_put(scope, key, projection):
    try:
        await scope.cache.put(
            key,
            {"projection": projection},
            ttl_seconds=_CACHE_TTL,
            visibility=CacheVisibility.PUBLIC,
        )
    except CacheUnavailable:
        return


def _project(operation, payload, target, limit, match_id):
    if operation in ("stats", "last"):
        stats = project_stats(payload, limit=limit)
        if operation == "stats":
            return {"account_id32": str(target), "stats": stats}
        rows = normalize_recent(payload, limit=limit)
        if not rows:
            raise _QueryFailure(
                ErrorCode.NO_RECORDS,
                "OpenDota 返回的最近20场范围内没有有效比赛；未继续查找更早比赛。",
            )
        return {
            "account_id32": str(target),
            "match_id": rows[0].match_id,
            "requested_limit": limit,
            "received_count": stats["received_count"],
            "sample_count": stats["sample_count"],
            "invalid_count": stats["invalid_count"],
            "duplicate_count": stats["duplicate_count"],
            "coverage": stats["coverage"],
        }
    if operation == "recent":
        rows = normalize_recent(payload, limit=limit)
        if not rows:
            raise _QueryFailure(
                ErrorCode.NO_RECORDS, "OpenDota 当前没有可展示的公开战绩。"
            )
        return {
            "account_id32": str(target),
            "matches": [_recent_dict(row) for row in rows],
        }
    if operation == "profile":
        profile = normalize_profile(payload, target)
        if all(
            profile_value is None
            for profile_value in (
                profile.name,
                profile.steam_id64,
                profile.rank_tier,
                profile.leaderboard_rank,
                profile.profile_url,
            )
        ):
            raise _QueryFailure(
                ErrorCode.NO_RECORDS, "OpenDota 当前没有可展示的公开玩家资料。"
            )
        return {"account_id32": str(target), "profile": _profile_dict(profile)}
    match = normalize_match(payload, match_id)
    players = [_player_dict(player) for player in match.players]
    if (
        match.start_time is None
        and match.duration is None
        and match.game_mode is None
        and not players
    ):
        raise _QueryFailure(
            ErrorCode.NO_RECORDS, "OpenDota 当前没有可展示的公开比赛资料。"
        )
    return {"match": _match_dict(match)}


def _recent_dict(row: RecentMatch):
    return {
        name: getattr(row, name)
        for name in (
            "match_id",
            "start_time",
            "hero_id",
            "game_mode",
            "outcome",
            "kills",
            "deaths",
            "assists",
            "duration",
        )
    }


def _profile_dict(profile: PlayerProfile):
    result = {
        name: getattr(profile, name)
        for name in (
            "account_id32",
            "name",
            "steam_id64",
            "rank_tier",
            "leaderboard_rank",
            "profile_url",
        )
    }
    result["account_id32"] = str(profile.account_id32)
    return result


def _player_dict(player):
    result = {
        name: getattr(player, name)
        for name in (
            "account_id32",
            "player_slot",
            "hero_id",
            "kills",
            "deaths",
            "assists",
            "outcome",
            "name",
            "level",
            "gold_per_min",
            "xp_per_min",
            "last_hits",
            "denies",
            "hero_damage",
            "tower_damage",
            "hero_healing",
            "items",
            "backpack",
            "neutral_item",
        )
    }
    if result["account_id32"] is not None:
        result["account_id32"] = str(result["account_id32"])
    return result


def _match_dict(match: MatchSummary):
    return {
        "match_id": match.match_id,
        "start_time": match.start_time,
        "duration": match.duration,
        "game_mode": match.game_mode,
        "radiant_win": match.radiant_win,
        "players": [_player_dict(player) for player in match.players[:10]],
    }


def _result(operation, projection, default_target, timezone_name):
    if operation in ("stats", "last", "match"):
        return report_result(operation, projection, default_target, timezone_name)
    if operation == "recent":
        account = projection["account_id32"]
        label = "本次查询账号" if default_target else "账号"
        lines = [f"Dota 2 最近战绩（{label} {account}）："]
        facts = {"account_id32": account, "matches": projection["matches"][:20]}
        for row in facts["matches"]:
            hero = _hero(row["hero_id"])
            time_text = _format_time(row["start_time"], timezone_name)
            lines.append(
                f"{time_text} | 比赛 {row['match_id']} | {hero} | {_mode(row['game_mode'])} | "
                f"{_outcome_label(row['outcome'])} | {row['kills'] if row['kills'] is not None else '?'}-"
                f"{row['deaths'] if row['deaths'] is not None else '?'}-"
                f"{row['assists'] if row['assists'] is not None else '?'} | {_duration(row['duration'])}"
            )
        return success(
            "Dota 2 最近战绩",
            lines,
            None if default_target else facts,
            warnings=("未知胜负不会计作失败。",),
        )
    if operation == "profile":
        account = projection["account_id32"]
        profile = projection["profile"]
        label = "本次查询账号" if default_target else "账号"
        lines = [f"Dota 2 玩家资料（{label} {account}）"]
        lines.append(f"昵称：{profile['name'] or '未提供'}")
        if not default_target:
            lines.append(f"SteamID64：{profile['steam_id64'] or '未提供'}")
        from .labels import rank_label

        lines.append(
            f"段位：{rank_label(profile['rank_tier'])}（原始值 {profile['rank_tier'] if profile['rank_tier'] is not None else '未提供'}）"
        )
        lines.append(
            f"排行榜名次：{profile['leaderboard_rank'] if profile['leaderboard_rank'] is not None else '未提供'}"
        )
        if profile["profile_url"] and not default_target:
            lines.append(f"主页：{profile['profile_url']}")
        facts = {"account_id32": account, "profile": profile}
        return success("Dota 2 玩家资料", lines, None if default_target else facts)


async def _timezone_name(services):
    try:
        config = await services.config.current()
    except (InvalidInvocation, AccessDenied, OperationTimeout, ServiceUnavailable):
        raise
    except Exception:
        return "Asia/Shanghai"
    values = config.values if isinstance(config.values, Mapping) else {}
    candidate = values.get("timezone", values.get("display_timezone", "Asia/Shanghai"))
    if not isinstance(candidate, str) or len(candidate) > 64:
        return "Asia/Shanghai"
    try:
        ZoneInfo(candidate)
    except (ZoneInfoNotFoundError, ValueError):
        return "Asia/Shanghai"
    return candidate


def _format_time(value, timezone_name):
    if value is None:
        return "时间未提供"
    try:
        stamp = datetime.fromtimestamp(value, tz=UTC)
        return stamp.astimezone(ZoneInfo(timezone_name)).strftime(
            "%Y-%m-%d %H:%M:%S %Z"
        )
    except (OverflowError, OSError, ValueError, ZoneInfoNotFoundError):
        return "时间未提供"


def _duration(value):
    if value is None:
        return "时长未提供"
    return f"{value // 60}分{value % 60:02d}秒"


def _hero(value):
    if not isinstance(value, int) or isinstance(value, bool):
        return "英雄未提供"
    return HERO_NAMES.get(value, f"英雄#{value}")


def _outcome_label(value):
    return {"win": "胜利", "loss": "失败", "unknown": "未知"}.get(value, "未知")


def _retry_after_seconds(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    if not 0 <= value <= 86_400:
        return None
    return value


def _mode(value):
    from .labels import mode_label

    return mode_label(value)

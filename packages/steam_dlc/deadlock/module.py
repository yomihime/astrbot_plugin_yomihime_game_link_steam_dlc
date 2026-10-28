"""Canonical SDK-backed anonymous Deadlock queries."""

from __future__ import annotations

import json
import re
import shlex
from collections.abc import Mapping
from datetime import UTC, datetime
from urllib.parse import urlsplit

import yomihime_game_link_sdk as ygl
from yomihime_game_link_sdk import cards
from yomihime_game_link_sdk.contexts import InvocationOrigin
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
from yomihime_game_link_sdk.services import HttpRequest
from yomihime_game_link_sdk.storage import (
    CacheLookupStatus,
    CacheQuery,
    CacheVisibility,
)

from ..shared.output import failure, success
from ..shared.steam_ids import account_id32, parse_dota_account, parse_steam_id
from . import normalization as norm
from .cache_validation import valid_projection
from .presentation import result

SOURCE = "deadlock_api"
VERSION = 1
MAX_BYTES = 4_194_304
OPERATIONS = ("profile", "recent", "stats", "last", "match")


class QueryFailure(Exception):
    def __init__(self, code, message):
        self.code, self.message = code, message


class Factory:
    async def create(self, services):
        return Module(services)


class Module:
    def __init__(self, services=None):
        self.services, self.running = services, False

    def handlers(self):
        handlers: dict[str, _Status | Query] = {"status": _Status()}
        for operation in OPERATIONS:
            handlers[operation] = Query(self, operation)
            handlers[operation + "_explicit"] = Query(
                self, operation, explicit_only=True
            )
        return ygl.ModuleHandlers(handlers, {}, {})

    async def start(self):
        self.running = True

    async def stop(self):
        self.running = False

    async def check_health(self):
        state = (
            ygl.HealthStatus.AVAILABLE if self.running else ygl.HealthStatus.UNAVAILABLE
        )
        return ygl.HealthReport(
            {k: ygl.CapabilityHealth(state) for k in self.handlers().capabilities}
        )


class _Status:
    async def invoke(self, context, parameters):
        return success(
            "Deadlock 状态",
            (
                "玩家资料、近期战绩、样本统计、上一场和精确焦点已接入；社区 Deadlock API，仅已收录公开记录。",
            ),
            {"module": "deadlock", "implemented": True, "source": SOURCE},
        )


class Query:
    def __init__(self, owner, operation, *, explicit_only=False):
        self.owner, self.operation = owner, operation
        self.explicit_only = explicit_only

    async def invoke(self, context, parameters):
        if not self.owner.running:
            return failure(ygl.ErrorCode.MODULE_UNAVAILABLE, "Deadlock 来源暂不可用。")
        selected = None
        try:
            account, limit, mid, default = await resolve(
                self.owner.services,
                context,
                parameters,
                self.operation,
                explicit_only=self.explicit_only,
            )
            scope = await self.owner.services.scopes.bind(context)
            operation = self.operation
            if operation == "last":
                history = await load(scope, "history", account, 20, None)
                if not history["history"]["matches"]:
                    raise QueryFailure(
                        ygl.ErrorCode.NO_RECORDS,
                        "来源暂无已收录有效比赛，可稍后重新查询。",
                    )
                selected = history["history"]["matches"][0]["match_id"]
                projection = await load(scope, "match", None, None, selected)
                projection = {
                    **projection,
                    "selection": {
                        "match_id": selected,
                        "window": 20,
                        "fetched_at": history["fetched_at"],
                        "cache_hit": history["cache_hit"],
                    },
                }
            else:
                projection = await load(scope, operation, account, limit, mid)
            if operation in ("last", "match") and account is not None:
                projection = {
                    **projection,
                    "focus": norm.focus(projection["match"], account),
                }
            avatar = (
                await avatar_asset(
                    scope, projection.get("profile", {}).get("avatar_url")
                )
                if operation == "profile"
                else None
            )
            return result(operation, projection, default, avatar)
        except QueryFailure as exc:
            return failure(
                exc.code,
                exc.message
                + (
                    f" 已选择比赛 #{selected}，详情失败，未换查更早比赛。"
                    if selected
                    else ""
                ),
            )
        except SourceHttpError as exc:
            code = (
                ygl.ErrorCode.RATE_LIMITED
                if exc.status_code == 429 or exc.code == "rate_limited"
                else ygl.ErrorCode.NOT_FOUND
                if exc.status_code == 404
                else ygl.ErrorCode.UPSTREAM_ERROR
            )
            message = (
                "Deadlock 来源限流，请遵守退避后重试。"
                if code is ygl.ErrorCode.RATE_LIMITED
                else "账号受保护或来源端点不可用。"
                if exc.status_code == 403
                else "Deadlock 来源暂不可用。"
                if exc.status_code == 404
                else "Deadlock 来源暂不可用。"
            )
            if selected:
                message += f" 已选择比赛 #{selected}，未换查更早比赛。"
            retry = getattr(exc, "retry_after_seconds", None)
            return failure(
                code,
                message,
                retry_after_seconds=retry
                if type(retry) is int and retry >= 0
                else None,
            )
        except (AccessDenied, InvalidInvocation):
            return failure(
                ygl.ErrorCode.MODULE_UNAVAILABLE, "调用授权已失效，或来源数据尚未解析。"
            )
        except (OperationTimeout, ServiceUnavailable):
            return failure(
                ygl.ErrorCode.UPSTREAM_ERROR, "Deadlock 来源超时或服务暂不可用。"
            )
        except (ValueError, TypeError, UnicodeError):
            return failure(
                ygl.ErrorCode.UNPARSED,
                "Deadlock 来源尚未解析或格式无法识别。"
                + (f" 已选择比赛 #{selected}，未换查更早比赛。" if selected else ""),
            )


def explicit(value):
    if not isinstance(value, str) or len(value) > 20:
        raise QueryFailure(
            ygl.ErrorCode.PARAMETER_ERROR, "账号须为明确的 ID32 或 SteamID64 字符串。"
        )
    try:
        return parse_dota_account(value)
    except ValueError:
        raise QueryFailure(
            ygl.ErrorCode.PARAMETER_ERROR, "账号须为合法 ID32 或 SteamID64。"
        ) from None


async def resolve(services, context, parameters, operation, *, explicit_only=False):
    account, mid = None, None
    limit: str | int = 20
    if context.origin is InvocationOrigin.COMMAND and not explicit_only:
        raw = parameters.get("command", "")
        if not isinstance(raw, str) or len(raw) > 256:
            raise QueryFailure(
                ygl.ErrorCode.PARAMETER_ERROR, "命令参数或身份字段无效。"
            )
        try:
            args = shlex.split(raw)
        except ValueError:
            raise QueryFailure(
                ygl.ErrorCode.PARAMETER_ERROR, "命令参数或来源响应无效。"
            ) from None
        if operation == "match":
            if len(args) not in (1, 3) or (len(args) == 3 and args[1] != "--account"):
                raise QueryFailure(
                    ygl.ErrorCode.PARAMETER_ERROR,
                    "用法：match <比赛ID> [--account <账号>]",
                )
            mid = norm.identifier(args[0])
            account = explicit(args[2]) if len(args) == 3 else None
        else:
            if "--limit" in args:
                i = args.index("--limit")
                if operation not in ("recent", "stats") or i + 1 >= len(args):
                    raise QueryFailure(
                        ygl.ErrorCode.PARAMETER_ERROR,
                        "仅 recent/stats 支持 --limit 1..20。",
                    )
                limit = args[i + 1]
                args = args[:i] + args[i + 2 :]
            if len(args) > 1:
                raise QueryFailure(
                    ygl.ErrorCode.PARAMETER_ERROR,
                    "仅支持一个账号和可选 --limit 1..20。",
                )
            account = explicit(args[0]) if args else None
    else:
        if operation == "match":
            mid = norm.identifier(parameters.get("match_id"))
            account = (
                explicit(parameters["account"]) if "account" in parameters else None
            )
        else:
            if "account" not in parameters:
                raise QueryFailure(
                    ygl.ErrorCode.PARAMETER_ERROR,
                    "Tool 查询必须明确指定账号；不会读取默认绑定。",
                )
            account = explicit(parameters["account"])
            limit = parameters.get("limit", 20)
    if operation == "match" and (mid is None or len(mid) > 20):
        raise QueryFailure(ygl.ErrorCode.PARAMETER_ERROR, "必须提供合法正整数比赛 ID。")
    if (
        isinstance(limit, str)
        and limit.isascii()
        and limit.isdecimal()
        and len(limit) <= 2
    ):
        limit = int(limit)
    if type(limit) is not int or not 1 <= limit <= 20:
        raise QueryFailure(ygl.ErrorCode.PARAMETER_ERROR, "样本数量必须为1到20。")
    default = operation != "match" and account is None
    if default:
        account = await identity(services, context)
    return account, limit, mid, default


async def identity(services, context):
    # Root COMMAND only. Identity never enters model facts or a local binding store.
    if context.origin is not InvocationOrigin.COMMAND or context.parent_id is not None:
        raise QueryFailure(
            ygl.ErrorCode.PARAMETER_ERROR, "账号受保护或来源端点不可用。"
        )
    scope = await services.scopes.bind(context)
    response = await scope.dependencies.invoke(
        context, CapabilityReference("steam_dlc/steam", "identity"), {}
    )
    if response.status is not ygl.ResultStatus.SUCCESS:
        if response.error and response.error.code is ygl.ErrorCode.UNBOUND:
            raise QueryFailure(
                ygl.ErrorCode.UNBOUND, "请先执行 /ygl steam bind 绑定账号。"
            )
        raise QueryFailure(ygl.ErrorCode.MODULE_UNAVAILABLE, "Steam 身份服务不可用。")
    doc = response.document
    if (
        response.model_facts is not None
        or response.privacy is not ygl.Privacy.PRIVATE
        or doc is None
        or doc.privacy is not ygl.Privacy.PRIVATE
    ):
        raise QueryFailure(
            ygl.ErrorCode.MODULE_UNAVAILABLE, "Steam 身份服务返回无效身份。"
        )
    blocks = [b for b in doc.ordered_blocks if isinstance(b, FieldsBlock)]
    if len(blocks) != 1 or set(blocks[0].fields) != {"identity"}:
        raise QueryFailure(ygl.ErrorCode.MODULE_UNAVAILABLE, "Steam 身份校验失败。")
    row = blocks[0].fields["identity"]
    try:
        if not isinstance(row, Mapping) or set(row) != {
            "steam_id64",
            "account_id32",
            "binding_revision",
            "association",
        }:
            raise ValueError
        sid = parse_steam_id(row["steam_id64"])
        account = row["account_id32"]
        if (
            type(account) is not int
            or account != account_id32(sid)
            or type(row["binding_revision"]) is not int
            or row["binding_revision"] < 0
            or not isinstance(row["association"], str)
            or len(row["association"]) > 32
        ):
            raise ValueError
    except (ValueError, TypeError, KeyError):
        raise QueryFailure(
            ygl.ErrorCode.MODULE_UNAVAILABLE, "Steam 身份校验失败。"
        ) from None
    return account


async def fetch(scope, path, query=()):
    response = await scope.http.fetch(HttpRequest(SOURCE, path, query=query))
    if response.status_code == 403:
        raise QueryFailure(ygl.ErrorCode.UPSTREAM_ERROR, "账号受保护或来源端点不可用。")
    if response.status_code == 404:
        raise QueryFailure(
            ygl.ErrorCode.NOT_FOUND, "调用授权已失效，或来源数据尚未解析。"
        )
    if response.status_code in (429, 503):
        # SDK normally raises before this. Retry metadata never requires the body.
        retry = next(
            (v for k, v in response.headers.items() if k.lower() == "retry-after"), None
        )
        seconds = (
            int(retry)
            if isinstance(retry, str)
            and retry.isascii()
            and retry.isdecimal()
            and len(retry) <= 8
            else None
        )
        raise SourceHttpError(
            "upstream_error",
            status_code=response.status_code,
            retry_after_seconds=seconds,
        )
    if response.status_code != 200:
        raise QueryFailure(ygl.ErrorCode.UPSTREAM_ERROR, "Deadlock 来源暂不可用。")
    if not isinstance(response.body, bytes) or len(response.body) > MAX_BYTES:
        raise QueryFailure(
            ygl.ErrorCode.UPSTREAM_ERROR, "Deadlock 响应超过4MiB安全上限。"
        )
    return json.loads(response.body)


def valid_cached(candidate, kind, account, mid, limit):
    return valid_projection(
        candidate, kind, account, mid, limit, version=VERSION, source=SOURCE
    )


async def load(scope, operation, account, limit, mid):
    # recent/stats/last share one normalized recorded-history window, never raw responses.
    kind = "history" if operation in ("recent", "stats", "history") else operation
    key = f"deadlock_api:v{VERSION}:{kind}:{account if kind != 'match' else mid}:{limit if kind == 'history' else '-'}"
    cached = None
    try:
        lookup = await scope.cache.lookup(CacheQuery(key, CacheVisibility.PUBLIC))
        if lookup.status is CacheLookupStatus.HIT and lookup.entry is not None:
            candidate = lookup.entry.payload.get("projection")
            if (
                isinstance(candidate, Mapping)
                and candidate.get("schema_version") == VERSION
                and candidate.get("source") == SOURCE
                and isinstance(candidate.get("fetched_at"), str)
                and candidate.get("cache_key") == key
                and valid_cached(candidate, kind, account, mid, limit)
            ):
                cached = dict(candidate)
    except CacheUnavailable:
        pass
    if cached is not None:
        projection = {**cached, "cache_hit": True}
    else:
        if kind == "history":
            payload = await fetch(scope, f"/v1/players/{account}/match-history")
            fields = {
                "account_id32": str(account),
                "history": norm.recent(payload, account, limit),
            }
        elif kind == "profile":
            profiles = await fetch(
                scope, "/v1/players/steam", (("account_ids", str(account)),)
            )
            rank = await fetch(scope, f"/v1/players/{account}/rank")
            fields = {"profile": norm.profile(profiles, rank, account)}
        else:
            payload = await fetch(
                scope, f"/v1/matches/{mid}/metadata", (("disable_steam", "true"),)
            )
            fields = {"match": norm.match(payload, mid)}
        projection = {
            "schema_version": VERSION,
            "source": SOURCE,
            "scope": "recorded public community data; bounded window; completeness unknown",
            "fetched_at": datetime.now(UTC).isoformat(),
            "cache_hit": False,
            "cache_key": key,
            "field_availability": norm.availability(fields),
            "missing_semantics": "null=unknown/not supplied; zero preserved when actually reported",
            **fields,
        }
        try:
            await scope.cache.put(
                key,
                {"projection": projection},
                ttl_seconds=300,
                visibility=CacheVisibility.PUBLIC,
            )
        except CacheUnavailable:
            pass
    if kind == "history":
        projection = {
            **projection,
            "stats": norm.statistics(projection["history"]["matches"]),
        }
    return projection


async def avatar_asset(scope, url):
    if not isinstance(url, str):
        return None
    try:
        parsed = urlsplit(url)
        if (
            parsed.scheme != "https"
            or parsed.hostname
            not in {"avatars.steamstatic.com", "avatars.fastly.steamstatic.com"}
            or parsed.port not in (None, 443)
            or parsed.username
            or parsed.password
            or parsed.query
            or parsed.fragment
            or not re.fullmatch(r"/[0-9a-f]{40}(?:_full|_medium)?\.jpg", parsed.path)
        ):
            return None
        response = await scope.http.fetch(
            HttpRequest(
                "steam_avatar_fastly"
                if parsed.hostname == "avatars.fastly.steamstatic.com"
                else "steam_avatar",
                parsed.path,
            )
        )
        if (
            response.status_code != 200
            or not isinstance(response.body, bytes)
            or len(response.body) > 262144
            or not response.body.startswith(b"\xff\xd8\xff")
        ):
            return None
        return cards.Asset("jpeg", response.body, alt="玩家头像", required=False)
    except (SourceHttpError, ValueError, OperationTimeout, ServiceUnavailable):
        return None

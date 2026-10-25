"""CS2 platform queries through public SDK identity/config/HTTP boundaries."""

import math
import shlex
from collections.abc import Mapping

import yomihime_game_link_sdk as ygl
from yomihime_game_link_sdk.contexts import InvocationOrigin
from yomihime_game_link_sdk.declarations import CapabilityReference
from yomihime_game_link_sdk.errors import (
    AccessDenied,
    InvalidInvocation,
    OperationTimeout,
    ServiceUnavailable,
)
from yomihime_game_link_sdk.storage import SecretMetadataState

from ..shared.output import failure
from ..shared.steam_ids import account_id32
from .contracts import (
    PLATFORMS,
    PROVIDERS,
    SCHEMA_VERSION,
    account_id,
    game_id,
    limit_value,
    platform_id,
    season_value,
    steam_id,
)
from .facts import compact_facts
from .provider import PlatformProvider, ProviderError

DATA_CAPABILITIES = ("profile", "recent", "stats", "last", "match")
_ALIASES = {
    "perfect": "credential_perfect",
    "official": "credential_perfect",
    "5e": "credential_fivee",
}
_LABELS = {"perfect": "完美平台", "official": "完美收录官匹", "5e": "5E"}


class Factory:
    async def create(self, services):
        return Module(services)


class Module:
    def __init__(self, services):
        self._services = services
        self._running = False

    def handlers(self):
        return ygl.ModuleHandlers(
            {
                "status": self,
                "query": _PublicQuery(self),
                **{
                    name: _Query(self, operation)
                    for operation in DATA_CAPABILITIES
                    for name in (operation, operation + "_explicit")
                },
            },
            {},
            {},
        )

    async def start(self):
        self._running = True

    async def stop(self):
        self._running = False

    async def check_health(self):
        status = (
            ygl.HealthStatus.AVAILABLE
            if self._running
            else ygl.HealthStatus.UNAVAILABLE
        )
        # Credential readiness is source-specific and is reported by status.
        return ygl.HealthReport(
            {
                name: ygl.CapabilityHealth(status)
                for name in self.handlers().capabilities
            }
        )

    async def invoke(self, context, parameters):
        del parameters
        if not self._running:
            return failure(ygl.ErrorCode.MODULE_UNAVAILABLE, "CS2 模块当前未运行。")
        try:
            snapshot = await self._services.config.current()
            states = _credential_states(snapshot)
            default = _default_platform(snapshot)
        except (AccessDenied, InvalidInvocation, ServiceUnavailable, OperationTimeout):
            return failure(ygl.ErrorCode.MODULE_UNAVAILABLE, "CS2 设置服务当前不可用。")
        sources = [
            {
                "platform": platform,
                "provider": PROVIDERS[platform],
                "credential_state": "configured" if states[platform] else "missing",
                "authorized_subject": None,
                "capabilities": {
                    operation: (
                        "available"
                        if platform == "perfect" or operation not in ("last", "match")
                        else "bounded_player_summary"
                    )
                    if states[platform]
                    else "credentials_required"
                    for operation in DATA_CAPABILITIES
                },
                "coverage": "recent_player_summary"
                if platform == "5e"
                else "recorded_official"
                if platform == "official"
                else "platform_recorded",
                "unavailable_reason": None
                if states[platform]
                else "credentials_required",
            }
            for platform in PLATFORMS
        ]
        facts = {
            "schema_version": SCHEMA_VERSION,
            "module": "cs2",
            "default_platform": default,
            "sources": sources,
        }
        lines = [f"默认来源：{_LABELS[default]}。"]
        lines.extend(
            f"{_LABELS[platform]}：{'凭据已配置，查询时验证有效性' if states[platform] else '需要管理员授权'}。"
            for platform in PLATFORMS
        )
        lines.extend(
            (
                "完美扫码与 5E Token 只在可信管理页操作；登录账号不会替换玩家 Steam 绑定。",
                "官匹为完美收录口径；官匹与 5E 单场仅提供来源近期样本中的玩家摘要。",
                "查询：/ygl cs2 profile [SteamID64] --platform perfect；5E 请明确提供 domain。",
            )
        )
        return _result(
            "来源状态",
            facts,
            lines,
            model_facts=context.origin is not InvocationOrigin.COMMAND,
        )


def _default_platform(snapshot):
    value = snapshot.values.get("default_platform", "perfect")
    return value if value in PLATFORMS else "perfect"


def _credential_states(snapshot):
    active = {
        item.field
        for item in snapshot.secret_metadata
        if item.state is SecretMetadataState.ACTIVE
    }
    return {platform: alias in active for platform, alias in _ALIASES.items()}


class _Query:
    def __init__(self, owner, operation):
        self.owner, self.operation = owner, operation

    async def invoke(self, context, parameters):
        if not self.owner._running:
            return failure(ygl.ErrorCode.MODULE_UNAVAILABLE, "CS2 模块当前未运行。")
        try:
            snapshot = await self.owner._services.config.current()
            parsed = _input(
                context, parameters, self.operation, _default_platform(snapshot)
            )
            scope = await self.owner._services.scopes.bind(context)
            platform, target, match_id, focus, limit, season = parsed
            default_target = target is None and self.operation != "match"
            if default_target:
                if (
                    context.origin is not InvocationOrigin.COMMAND
                    or context.parent_id is not None
                    or not context.actor_id
                    or (context.capability_id or "").endswith("_explicit")
                ):
                    raise ValueError("工具和页面查询必须明确提供 account。")
                if platform == "5e":
                    raise ValueError(
                        "5E 查询需要明确提供 domain；Steam 绑定不会自动转换为 5E 账号。"
                    )
                target = await _default_steam(scope, context)
            if not _credential_states(snapshot)[platform]:
                return failure(
                    ygl.ErrorCode.AUTH_REQUIRED,
                    f"{_LABELS[platform]}凭据未配置，请先在可信管理页完成授权或设置 5E Token。",
                )
            provider = PlatformProvider(scope.http, platform)
            if self.operation == "profile":
                projection = await provider.profile(target, season=season)
            elif self.operation == "stats":
                projection = await provider.stats(target, season=season)
            elif self.operation == "recent":
                projection = await provider.recent(target, limit=limit)
            elif self.operation == "last":
                projection = await provider.last(target)
            else:
                projection = await provider.match(match_id, target=target, focus=focus)
            return _result(
                _LABELS[platform],
                projection,
                _lines(projection),
                model_facts=not default_target,
                private=default_target,
            )
        except _IdentityFailure as error:
            return failure(error.code, error.message, privacy=ygl.Privacy.PRIVATE)
        except ProviderError as error:
            return _provider_failure(error)
        except ValueError as error:
            return failure(ygl.ErrorCode.PARAMETER_ERROR, str(error))
        except (AccessDenied, InvalidInvocation):
            return failure(
                ygl.ErrorCode.MODULE_UNAVAILABLE, "本次调用授权已失效，请重新发起查询。"
            )
        except OperationTimeout:
            return failure(
                ygl.ErrorCode.UPSTREAM_ERROR, "CS2 来源查询超时，请稍后重试。"
            )
        except ServiceUnavailable:
            return failure(ygl.ErrorCode.MODULE_UNAVAILABLE, "CS2 查询服务当前不可用。")

        except Exception:
            # No raw exception/request/response goes into logs or model output.
            return failure(ygl.ErrorCode.MODULE_UNAVAILABLE, "CS2 查询服务当前不可用。")


class _PublicQuery:
    """One page capability, with explicit targets and no invented actor context."""

    def __init__(self, owner):
        self.owner = owner

    async def invoke(self, context, parameters):
        if not parameters:
            return await self.owner.invoke(context, {})
        operation = parameters.get("action")
        if operation not in DATA_CAPABILITIES:
            return failure(
                ygl.ErrorCode.PARAMETER_ERROR,
                "请选择 profile、recent、stats、last 或 match。",
            )
        values = {key: value for key, value in parameters.items() if key != "action"}
        if not isinstance(values.get("account"), str) or not values["account"]:
            return failure(
                ygl.ErrorCode.PARAMETER_ERROR,
                "页面查询必须明确提供 account，5E 使用 domain。",
            )
        return await _Query(self.owner, operation).invoke(context, values)


def _input(context, parameters, operation, default):
    values = dict(parameters)
    if "command" in values:
        if context.origin is not InvocationOrigin.COMMAND or (
            context.capability_id or ""
        ).endswith("_explicit"):
            raise ValueError("显式查询请使用结构化参数。")
        if set(values) != {"command"} or type(values["command"]) is not str:
            raise ValueError("命令参数格式无效。")
        values = _command(values["command"], operation)
    if set(values) - {
        "platform",
        "account",
        "steam_id",
        "match_id",
        "focus",
        "limit",
        "season",
    }:
        raise ValueError("查询包含未知参数。")
    if "steam_id" in values and "account" in values:
        raise ValueError("account 与旧 steam_id 参数不能同时提供。")
    platform = platform_id(values.get("platform", default))
    target = values.get("account", values.get("steam_id"))
    if target is not None:
        target = account_id(target, platform)
    match_id = (
        game_id(values.get("match_id"), platform) if operation == "match" else None
    )
    focus = values.get("focus")
    if focus is not None:
        focus = account_id(focus, platform)
    if operation != "match" and focus is not None:
        raise ValueError("focus 仅用于 match 查询。")
    if operation == "match" and platform != "perfect" and target is None:
        raise ValueError(
            "官匹和 5E 单场摘要需要明确 account，限定在该玩家近期样本中查找。"
        )
    limit = limit_value(values.get("limit", 5))
    season = season_value(values.get("season"), platform)
    if season and operation not in ("profile", "stats"):
        raise ValueError("season 仅用于 profile 或 stats 查询。")
    if (
        target is None
        and operation != "match"
        and context.origin is not InvocationOrigin.COMMAND
    ):
        raise ValueError("工具和页面查询必须明确提供 account。")
    return platform, target, match_id, focus, limit, season


def _command(raw, operation):
    try:
        tokens = shlex.split(raw)
    except ValueError:
        raise ValueError("命令引号不完整。") from None
    result, index = {}, 0
    while index < len(tokens):
        token = tokens[index]
        if token.startswith("--"):
            key = token[2:]
            if key not in (
                "account",
                "platform",
                "limit",
                "season",
                "focus",
            ) or index + 1 >= len(tokens):
                raise ValueError(
                    "支持 --platform、--account、--limit、--season 和 --focus。"
                )
            if key in result:
                raise ValueError("参数不能重复。")
            value = tokens[index + 1]
            if key == "limit":
                if not value.isascii() or not value.isdecimal():
                    raise ValueError("limit 必须是 1 到 20 的整数。")
            result[key] = int(value) if key == "limit" else value
            index += 2
        else:
            key = "match_id" if operation == "match" else "account"
            if key in result:
                raise ValueError("只能提供一个位置参数。")
            result[key] = token
            index += 1
    return result


class _IdentityFailure(Exception):
    def __init__(self, code, message):
        self.code, self.message = code, message


async def _default_steam(scope, context):
    result = await scope.dependencies.invoke(
        context,
        CapabilityReference("steam_dlc/steam", "identity"),
        {},
    )
    if result.status is not ygl.ResultStatus.SUCCESS:
        unbound = (
            result.error is not None and result.error.code is ygl.ErrorCode.UNBOUND
        )
        raise _IdentityFailure(
            ygl.ErrorCode.UNBOUND if unbound else ygl.ErrorCode.MODULE_UNAVAILABLE,
            "尚未关联 Steam 账号，请先执行 /ygl steam bind。"
            if unbound
            else "Steam 身份服务当前不可用。",
        )
    document = result.document
    if (
        result.privacy is not ygl.Privacy.PRIVATE
        or result.model_facts is not None
        or document is None
        or document.privacy is not ygl.Privacy.PRIVATE
    ):
        raise _IdentityFailure(
            ygl.ErrorCode.MODULE_UNAVAILABLE, "Steam 身份返回格式无效。"
        )
    blocks = [
        block for block in document.ordered_blocks if isinstance(block, ygl.FieldsBlock)
    ]
    try:
        if len(blocks) != 1 or set(blocks[0].fields) != {"identity"}:
            raise ValueError
        identity = blocks[0].fields["identity"]
        if set(identity) != {
            "steam_id64",
            "account_id32",
            "binding_revision",
            "association",
        }:
            raise ValueError
        target = steam_id(identity["steam_id64"])
        if (
            type(identity["account_id32"]) is not int
            or identity["account_id32"] != account_id32(target)
            or type(identity["binding_revision"]) is not int
            or identity["binding_revision"] < 0
            or type(identity["association"]) is not str
        ):
            raise ValueError
    except (ValueError, TypeError, KeyError):
        raise _IdentityFailure(
            ygl.ErrorCode.MODULE_UNAVAILABLE, "Steam 身份返回格式无效。"
        ) from None
    return target


def _provider_failure(error):
    code, message = {
        "authentication_required": (
            ygl.ErrorCode.AUTH_EXPIRED,
            "来源授权无效或已过期，请在可信管理页重新授权。",
        ),
        "private_profile": (ygl.ErrorCode.NOT_PUBLIC, "玩家战绩未公开。"),
        "not_found_or_not_registered": (
            ygl.ErrorCode.NOT_FOUND,
            "来源未返回该玩家的数据，可能未收录。",
        ),
        "no_recorded_matches": (ygl.ErrorCode.NO_RECORDS, "来源当前没有可见近期比赛。"),
        "match_not_in_recent_sample": (
            ygl.ErrorCode.NOT_FOUND,
            "该比赛不在玩家当前来源近期样本中；未查询更广历史。",
        ),
        "focus_not_in_sample": (
            ygl.ErrorCode.NOT_FOUND,
            "焦点玩家不在当前来源摘要样本中。",
        ),
        "schema_changed": (
            ygl.ErrorCode.UNPARSED,
            "来源字段变化或身份不一致，已拒绝混合数据。",
        ),
        "rate_limited": (
            ygl.ErrorCode.RATE_LIMITED,
            "来源请求额度暂不可用，请稍后重试。",
        ),
        "season_unavailable": (
            ygl.ErrorCode.NO_RECORDS,
            "来源未提供可识别赛季，请明确指定 5E 年份和赛季。",
        ),
    }.get(
        error.code, (ygl.ErrorCode.UPSTREAM_ERROR, "CS2 来源当前不可用，请稍后重试。")
    )
    return failure(code, message, retry_after_seconds=error.retry_after_seconds)


def _lines(projection):
    data, kind = projection["data"], projection["kind"]
    lines = [
        f"来源：{_LABELS[projection['platform']]} · 范围：{projection['coverage']}"
    ]
    if kind in ("profile", "stats"):
        lines.append(
            f"玩家：{data.get('nickname') or '未提供昵称'} · {data['account_id']}"
        )
        if projection["season"]:
            lines.append(f"赛季：{projection['season']}")
        rank = data.get("rank")
        if rank:
            lines.append(
                f"{rank['system']}：{rank['value'] if rank['value'] is not None else '未知'}；积分：{rank['score'] if rank['score'] is not None else '未知'}"
            )
        metrics = data.get("metrics", {})
        lines.append(
            " · ".join(
                f"{key}={value}" for key, value in metrics.items() if value is not None
            )
            or "来源未提供可用统计。"
        )
        lines.append(f"统计口径：{data['metric_scope']}")
    elif kind == "recent":
        matches = data["matches"]
        lines.append(
            f"当前样本 {data['available_matches']} 场，展示 {len(matches)} 场。"
        )
        lines.extend(
            f"{row['match_id']} · {row['map'] or '未知地图'} · {row['result'] or '未知胜负'} · K/D/A {row['kills']}/{row['deaths']}/{row['assists']}"
            for row in matches
        )
    else:
        lines.append(f"比赛：{data['match_id']} · {data.get('map') or '未知地图'}")
        lines.append(f"详情层级：{projection['detail_level']}")
        focus = data.get("focus")
        if isinstance(focus, dict):
            lines.append(
                f"焦点：{focus.get('account_id') or focus.get('id') or '未知'}"
            )
    if projection.get("unavailable_reason"):
        lines.append("此来源当前只提供有界玩家摘要，不含完整比赛名单与详情。")
    return lines


def _display_projection(value):
    # DisplayDocument has an exact numeric domain. Facts retain source numbers.
    if type(value) is float:
        if not math.isfinite(value):
            raise ValueError("non-finite CS2 statistic")
        return str(value)
    if isinstance(value, Mapping):
        return {key: _display_projection(child) for key, child in value.items()}
    if isinstance(value, (tuple, list)):
        return tuple(_display_projection(child) for child in value)
    return value


def _result(title, projection, lines, *, model_facts=True, private=False):
    privacy = ygl.Privacy.PRIVATE if private else ygl.Privacy.PUBLIC
    return ygl.CapabilityResult(
        result_id="steam-dlc-cs2",
        status=ygl.ResultStatus.SUCCESS,
        document=ygl.DisplayDocument(
            f"游戏连结 · CS2 · {title}",
            "CS2",
            (
                *tuple(ygl.TextBlock(line) for line in lines),
                ygl.FieldsBlock({"cs2": _display_projection(projection)}),
            ),
            privacy=privacy,
        ),
        model_facts=ygl.FactDocument(compact_facts(projection))
        if model_facts
        else None,
        privacy=privacy,
    )

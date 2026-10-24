"""Steam identity owner and official public store/account query capabilities."""

import re
import shlex

import yomihime_game_link_sdk as ygl

from ..shared.output import failure, success
from ..shared.steam_ids import (
    account_id32,
    parse_steam_binding_target,
    parse_steam_id,
    steam_id64_from_account,
)
from .normalization import app_id
from .presentation import result as query_result
from .queries import QueryFailure, image, load
from .wall import CacheStatusHandler, MaterialsHandler, WallHandler
from .wall_materials import MaterialPreparer

_PRIVATE = ygl.Privacy.PRIVATE
_QUERIES = (
    "search",
    "app",
    "profile",
    "recent",
    "games",
    "profile_explicit",
    "recent_explicit",
    "games_explicit",
)
_WALL = ("wall", "wall_explicit", "wall_preview", "wall_materials", "wall_cache_status")
_CAPABILITIES = ("bind", "binding", "unbind", "identity", "status") + _QUERIES + _WALL


class Factory:
    async def create(self, services):
        return SteamModule(services)


class SteamModule:
    def __init__(self, services):
        self._services = services
        self._running = False
        self._materials = MaterialPreparer()

    def handlers(self):
        return ygl.ModuleHandlers(
            {
                name: (
                    WallHandler(
                        self, explicit=name in ("wall_explicit", "wall_preview")
                    )
                    if name in ("wall", "wall_explicit", "wall_preview")
                    else MaterialsHandler(self)
                    if name == "wall_materials"
                    else CacheStatusHandler(self)
                    if name == "wall_cache_status"
                    else _Query(self, name)
                    if name in _QUERIES
                    else _Handler(self, name)
                )
                for name in _CAPABILITIES
            },
            {},
            {},
        )

    async def start(self):
        self._running = True
        self._materials.start()

    async def stop(self):
        self._running = False
        await self._materials.stop()

    async def check_health(self):
        status = (
            ygl.HealthStatus.AVAILABLE
            if self._running
            else ygl.HealthStatus.UNAVAILABLE
        )
        return ygl.HealthReport(
            {name: ygl.CapabilityHealth(status) for name in _CAPABILITIES}
        )


class _Handler:
    def __init__(self, module, action):
        self._module, self._action = module, action

    async def invoke(self, context, parameters):
        action = self._action
        if action == "status":
            return success(
                "游戏连结 · Steam · 状态",
                (
                    "商店 search/app 与公开账号 profile/recent/games 样本查询可用。",
                    "商店默认 CN/schinese；可用 --country CC --language english 指定。",
                    "recent 是主页展示样本，games 是 legacy mostPlayedGames 样本；都不是完整游戏库。",
                    "请在私聊使用 /ygl steam bind、binding、unbind。",
                    "手动关联为 self_asserted，不代表已验证 Steam 所有权。",
                ),
                {"module": "steam", "account_association": "self_asserted"},
            )
        if context.origin is not ygl.InvocationOrigin.COMMAND or not context.actor_id:
            return failure(
                ygl.ErrorCode.UNSUPPORTED,
                "账号操作需要真实用户命令。",
                privacy=_PRIVATE,
            )
        if action in ("bind", "unbind", "binding") and context.parent_id is not None:
            return failure(
                ygl.ErrorCode.UNSUPPORTED,
                "账号管理只接受用户直接命令。",
                privacy=_PRIVATE,
            )
        if not self._module._running:
            return failure(
                ygl.ErrorCode.MODULE_UNAVAILABLE, "Steam 模块未启用。", privacy=_PRIVATE
            )
        try:
            scope = await self._module._services.scopes.bind(context)
            collection = await scope.records.collection("binding")
            record = await collection.get("default")
            if action == "bind":
                value = parameters.get("steam_id")
                if not isinstance(value, str):
                    raise ValueError
                steam_id = parse_steam_binding_target(value.strip())
                payload = {"steam_id64": steam_id, "association": "self_asserted"}
                if record is None:
                    saved = await collection.create("default", payload)
                else:
                    saved = await collection.replace(
                        "default", payload, expected_revision=record.revision
                    )
                return success(
                    "游戏连结 · Steam · 关联",
                    (
                        f"已关联 SteamID64：{steam_id}",
                        f"Dota ID32：{account_id32(steam_id)}",
                        "关联方式：self_asserted（用户声明，未验证所有权）。",
                        f"绑定修订：{saved.revision}",
                    ),
                    privacy=_PRIVATE,
                )
            if action == "unbind":
                if record is None or record.value.get("steam_id64") is None:
                    return success(
                        "游戏连结 · Steam · 解绑",
                        ("当前没有关联 Steam 账号。",),
                        privacy=_PRIVATE,
                    )
                saved = await collection.replace(
                    "default",
                    {"steam_id64": None, "association": "self_asserted"},
                    expected_revision=record.revision,
                )
                return success(
                    "游戏连结 · Steam · 解绑",
                    (f"已解除关联；修订：{saved.revision}",),
                    privacy=_PRIVATE,
                )
            if record is None or record.value.get("steam_id64") is None:
                return failure(
                    ygl.ErrorCode.UNBOUND,
                    "尚未关联 Steam 账号，请私聊使用 /ygl steam bind <ID32|SteamID64>。",
                    privacy=_PRIVATE,
                )
            steam_id = parse_steam_id(record.value["steam_id64"])
            identity = {
                "steam_id64": steam_id,
                "account_id32": account_id32(steam_id),
                "binding_revision": record.revision,
                "association": "self_asserted",
            }
            if action == "identity":
                # Private SDK fields are data for the declared consumer, never
                # model facts. There is no command/Tool route for this handler.
                return ygl.CapabilityResult(
                    "steam-identity",
                    ygl.ResultStatus.SUCCESS,
                    document=ygl.DisplayDocument(
                        "Steam 当前身份",
                        "Steam DLC",
                        (
                            ygl.FieldsBlock(
                                {"identity": identity},
                                fallback_text="当前用户的 Steam 关联。",
                            ),
                        ),
                        privacy=_PRIVATE,
                    ),
                    privacy=_PRIVATE,
                )
            return success(
                "游戏连结 · Steam · 当前关联",
                (
                    f"SteamID64：{steam_id}",
                    f"Dota ID32：{identity['account_id32']}",
                    f"修订：{record.revision}；self_asserted（未验证所有权）。",
                ),
                privacy=_PRIVATE,
            )
        except (ygl.RevisionConflict, ygl.UniqueConstraintViolation):
            return failure(
                ygl.ErrorCode.UNKNOWN,
                "关联已被另一请求修改，请查看当前关联后重新操作。",
                privacy=_PRIVATE,
            )
        except ValueError:
            return failure(
                ygl.ErrorCode.PARAMETER_ERROR,
                "请输入有效的 Dota ID32（1..4294967295）、个人 SteamID64 "
                "或标准 https://steamcommunity.com/profiles/SteamID64 地址。",
                privacy=_PRIVATE,
            )
        except ygl.ServiceUnavailable:
            return failure(
                ygl.ErrorCode.MODULE_UNAVAILABLE, "账号服务暂不可用。", privacy=_PRIVATE
            )


def _account(value):
    if not isinstance(value, str) or not re.fullmatch(r"[1-9][0-9]*", value):
        raise ValueError("请输入 ID32 或 SteamID64；查询不接受任意 URL。")
    return (
        steam_id64_from_account(value)
        if int(value) <= 2**32 - 1
        else parse_steam_id(value)
    )


def _input(context, parameters, operation):
    target: str | None
    country, language = (
        parameters.get("country", "CN"),
        parameters.get("language", "schinese"),
    )
    if context.origin is ygl.InvocationOrigin.COMMAND and context.parent_id is None:
        raw = parameters.get(
            "command",
            parameters.get("query" if operation == "search" else "app_id", "")
            if operation in ("search", "app")
            else "",
        )
        if not isinstance(raw, str) or len(raw) > 256:
            raise ValueError("命令参数过长或格式错误。")
        args = shlex.split(raw)
        positional, seen = [], set()
        index = 0
        while index < len(args):
            token = args[index]
            if token in ("--country", "--language") and operation in ("search", "app"):
                if token in seen or index + 1 >= len(args):
                    raise ValueError("地区/语言参数缺值或重复。")
                seen.add(token)
                if token == "--country":
                    country = args[index + 1]
                else:
                    language = args[index + 1]
                index += 2
            elif token.startswith("--"):
                raise ValueError("不支持此选项。")
            else:
                positional.append(token)
                index += 1
        if operation == "search":
            target = " ".join(positional)
        else:
            if len(positional) > 1:
                raise ValueError("请只提供一个 AppID 或账号。")
            target = positional[0] if positional else None
    else:
        target = parameters.get(
            "query"
            if operation == "search"
            else "app_id"
            if operation == "app"
            else "account"
        )
    if operation in ("search", "app"):
        if not isinstance(country, str) or not re.fullmatch(r"[A-Za-z]{2}", country):
            raise ValueError("地区必须是两位国家代码，例如 CN/US。")
        if not isinstance(language, str) or not re.fullmatch(r"[a-z_]{2,24}", language):
            raise ValueError("语言必须是 Steam 语言标识，例如 schinese/english。")
        country = country.upper()
        if operation == "app":
            target = app_id(target)
        elif not isinstance(target, str) or not target.strip() or len(target) > 120:
            raise ValueError("请提供游戏名或 AppID（最多120字符）。")
        else:
            target = target.strip()
    else:
        country, language = "GLOBAL", "english"
        if target is not None:
            target = _account(target)
    return target, country, language


class _Query:
    def __init__(self, owner, action):
        self.owner, self.operation = owner, action.removesuffix("_explicit")
        self.explicit_only = action.endswith("_explicit")

    async def invoke(self, context, parameters):
        if not self.owner._running:
            return failure(ygl.ErrorCode.MODULE_UNAVAILABLE, "Steam 模块未启用。")
        default_target = False
        try:
            try:
                target, country, language = _input(context, parameters, self.operation)
            except (ValueError, TypeError) as exc:
                return failure(
                    ygl.ErrorCode.PARAMETER_ERROR, str(exc) or "参数格式错误。"
                )
            if target is None:
                if (
                    self.explicit_only
                    or context.origin is not ygl.InvocationOrigin.COMMAND
                    or context.parent_id is not None
                    or not context.actor_id
                ):
                    return failure(
                        ygl.ErrorCode.PARAMETER_ERROR,
                        "工具查询必须明确提供 account；默认账号只接受用户直接命令。",
                    )
                default_target = True
                identity = await _Handler(self.owner, "identity").invoke(context, {})
                if identity.status is not ygl.ResultStatus.SUCCESS:
                    unbound = (
                        identity.error is not None
                        and identity.error.code is ygl.ErrorCode.UNBOUND
                    )
                    return failure(
                        ygl.ErrorCode.UNBOUND
                        if unbound
                        else ygl.ErrorCode.MODULE_UNAVAILABLE,
                        "尚未关联 Steam 账号，请先执行 /ygl steam bind。"
                        if unbound
                        else "Steam 身份服务暂不可用。",
                    )
                target = parse_steam_id(
                    identity.document.ordered_blocks[0].fields["identity"]["steam_id64"]
                )
            scope = await self.owner._services.scopes.bind(context)
            operation = self.operation
            if operation == "search" and re.fullmatch(r"[0-9]+", target):
                try:
                    target = app_id(target)
                except ValueError:
                    return failure(
                        ygl.ErrorCode.PARAMETER_ERROR, "AppID 必须是有效正整数。"
                    )
                operation = "app"
            projection = await load(scope, operation, target, country, language)
            asset = await image(scope, projection) if operation != "search" else None
            return query_result(projection, default_target=default_target, asset=asset)
        except QueryFailure as exc:
            return failure(
                exc.code,
                exc.message,
                privacy=ygl.Privacy.PUBLIC,
                retry_after_seconds=exc.retry_after,
            )
        except ygl.SourceHttpError as exc:
            code = (
                ygl.ErrorCode.RATE_LIMITED
                if exc.status_code == 429 or exc.code == "rate_limited"
                else ygl.ErrorCode.UPSTREAM_ERROR
            )
            return failure(
                code,
                "Steam 来源暂不可用，请稍后重试。",
                privacy=ygl.Privacy.PUBLIC,
                retry_after_seconds=exc.retry_after_seconds,
            )
        except (ygl.ServiceUnavailable, ygl.InvalidInvocation, ygl.AccessDenied):
            return failure(
                ygl.ErrorCode.MODULE_UNAVAILABLE,
                "Steam 查询服务或本次授权暂不可用。",
                privacy=ygl.Privacy.PUBLIC,
            )
        except PermissionError:
            return failure(
                ygl.ErrorCode.NOT_PUBLIC,
                "Steam 资料需要登录或未公开；未视为空库。",
                privacy=ygl.Privacy.PUBLIC,
            )
        except LookupError:
            return failure(
                ygl.ErrorCode.NOT_FOUND,
                "该 AppID 未返回本地区商店资料；可能查无结果、下架或地区不可用，无法进一步区分。",
            )
        except (ValueError, TypeError):
            return failure(
                ygl.ErrorCode.UNPARSED,
                "Steam 数据结构或返回身份无法验证；未将缺失资料视为零。",
                privacy=ygl.Privacy.PUBLIC,
            )
        except ygl.OperationTimeout:
            return failure(
                ygl.ErrorCode.UPSTREAM_ERROR,
                "Steam 查询超时，请稍后重试。",
                privacy=ygl.Privacy.PUBLIC,
            )

"""Command-only Steam association backed by invocation-scoped USER records."""

import yomihime_game_link_sdk as ygl

from ..shared.output import failure, success
from ..shared.steam_ids import account_id32, parse_steam_id

_PRIVATE = ygl.Privacy.PRIVATE
_CAPABILITIES = ("bind", "binding", "unbind", "identity", "status")


class Factory:
    async def create(self, services):
        return SteamModule(services)


class SteamModule:
    def __init__(self, services):
        self._services = services
        self._running = False

    def handlers(self):
        return ygl.ModuleHandlers(
            {name: _Handler(self, name) for name in _CAPABILITIES}, {}, {}
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
                    "已接入；共享账号关联可用。",
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
                steam_id = parse_steam_id(value.strip())
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
                    "尚未关联 Steam 账号，请私聊使用 /ygl steam bind <SteamID64>。",
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
                "请输入有效的个人 SteamID64 或标准 https://steamcommunity.com/profiles/数字ID 地址。",
                privacy=_PRIVATE,
            )
        except ygl.ServiceUnavailable:
            return failure(
                ygl.ErrorCode.MODULE_UNAVAILABLE, "账号服务暂不可用。", privacy=_PRIVATE
            )

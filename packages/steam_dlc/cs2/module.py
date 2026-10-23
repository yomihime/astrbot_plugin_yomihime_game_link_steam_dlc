"""CS2 source policy gate: do not fetch Leetify data into a retaining Host."""

import yomihime_game_link_sdk as ygl
from yomihime_game_link_sdk.contexts import InvocationOrigin

from ..shared.output import failure, success
from .contracts import ATTRIBUTION, GUIDELINES, game_id, steam_id

DATA_CAPABILITIES = ("profile", "recent", "stats", "last", "match")
BLOCK_REASON = (
    "Leetify 匿名 API 已验证可用，但数据功能因来源留存规则暂时停用。"
    "当前 Host 会保存 Tool 结果、会话历史和图片附件，无法满足 Leetify 不存储 API 数据的要求。"
    "未发起数据请求；需要支持按来源禁止留存的 Host 路径后才能启用。"
)


class Factory:
    async def create(self, services):
        del services
        return Module()


class Module:
    def __init__(self):
        self._running = False

    def handlers(self):
        return ygl.ModuleHandlers(
            {"status": self, **{op: _Blocked(self, op) for op in DATA_CAPABILITIES}},
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
        return ygl.HealthReport(
            {
                "status": ygl.CapabilityHealth(status),
                **{
                    op: ygl.CapabilityHealth(ygl.HealthStatus.UNAVAILABLE, BLOCK_REASON)
                    for op in DATA_CAPABILITIES
                },
            }
        )

    async def invoke(self, context, parameters):
        del parameters
        return success(
            "游戏连结 · CS2 · 来源状态",
            (
                BLOCK_REASON,
                "范围：Leetify已收录可见数据；不覆盖全部官匹、完美或 5E。",
                f"{ATTRIBUTION} · https://leetify.com/",
                f"来源规则：{GUIDELINES}",
            ),
            None
            if context.origin is InvocationOrigin.COMMAND
            else {
                "module": "cs2",
                "provider": "leetify",
                "anonymous_api_verified": True,
                "game_data_enabled": False,
                "capabilities": {
                    op: "blocked_provider_retention" for op in DATA_CAPABILITIES
                },
            },
        )


class _Blocked:
    def __init__(self, owner, operation):
        self.owner, self.operation = owner, operation

    async def invoke(self, context, parameters):
        if not self.owner._running:
            return failure(ygl.ErrorCode.MODULE_UNAVAILABLE, "CS2 模块当前未运行。")
        try:
            if self.operation == "match":
                game_id(parameters.get("match_id"))
                if parameters.get("focus") is not None:
                    steam_id(parameters["focus"])
            elif parameters.get("steam_id") is not None:
                steam_id(parameters["steam_id"])
            elif context.origin is InvocationOrigin.LLM_TOOL:
                raise ValueError("Explicit SteamID64 required")
        except ValueError:
            return failure(
                ygl.ErrorCode.PARAMETER_ERROR,
                "请提供有效 SteamID64；match 使用 Leetify UUID 和可选 SteamID64 焦点。",
            )
        # No scope binding, dependency, HTTP or upstream data reaches Host.
        return failure(ygl.ErrorCode.MODULE_UNAVAILABLE, BLOCK_REASON)

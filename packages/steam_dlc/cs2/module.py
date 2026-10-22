"""Real CS2 module; game data capabilities remain outside this alpha."""

import yomihime_game_link_sdk as ygl

from ..shared.output import success


class Factory:
    async def create(self, services):
        del services
        return Module()


class Module:
    def __init__(self):
        self._running = False

    def handlers(self):
        return ygl.ModuleHandlers({"status": self}, {}, {})

    async def start(self):
        self._running = True

    async def stop(self):
        self._running = False

    async def check_health(self):
        status = ygl.HealthStatus.AVAILABLE if self._running else ygl.HealthStatus.UNAVAILABLE
        return ygl.HealthReport({"status": ygl.CapabilityHealth(status)})

    async def invoke(self, context, parameters):
        del context, parameters
        return success("游戏连结 · CS2 · 状态", (
            "已接入，游戏数据功能待实现。",
            "当前支持模块启停、卸载、帮助与运行状态。",
        ), {"module": "cs2", "game_data_implemented": False})

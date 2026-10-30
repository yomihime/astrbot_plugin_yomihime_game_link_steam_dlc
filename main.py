"""AstrBot outer plugin; SDK import waits for compatible Core bootstrap."""

import asyncio
from pathlib import Path

from astrbot.api import logger
from astrbot.api.event import filter
from astrbot.api.star import Context, Star, register

PLUGIN_NAME = "astrbot_plugin_yomihime_game_link_steam_dlc"
CORE_NAME = "astrbot_plugin_yomihime_game_link"
SDK_VERSION = "0.1.0a24"


@register(PLUGIN_NAME, "yomihime", "如月怜的游戏连结：Steam DLC", "0.2.0-beta.4")
class SteamDLC(Star):
    def __init__(self, context: Context):
        super().__init__(context)
        self._context = context
        self._lock = asyncio.Lock()
        self._closed = False
        self._core_instance = None
        self._host = None
        self._lease = None
        self.connection_state = "waiting_core"

    async def initialize(self):
        await self._connect()

    def _core(self):
        try:
            metadata = self._context.get_registered_star(CORE_NAME)
        except (KeyError, ValueError):
            return None
        if metadata is None or not metadata.activated:
            return None
        return metadata.star_cls

    async def _connect(self):
        async with self._lock:
            if self._closed:
                return
            core = self._core()
            if core is None:
                self.connection_state = "waiting_core"
                logger.info("Steam DLC 等待游戏连结 Core 加载。")
                return
            getter = getattr(core, "get_game_link_extension_host", None)
            if not callable(getter):
                self.connection_state = "incompatible_core"
                logger.warning("Steam DLC 需要带外部包桥接 v1 的游戏连结 Core。")
                return
            host = getter()
            if host is None:
                self.connection_state = "waiting_core"
                return
            if (
                host.bridge_version != 1
                or host.sdk_version != SDK_VERSION
                or host.module_abi_version != "2.0"
            ):
                self.connection_state = "incompatible_sdk"
                logger.warning(
                    "Steam DLC 与当前 Core/SDK 不兼容，需要安装匹配候选并重启。"
                )
                return
            # The compatible Core loaded and validated this canonical type graph.
            import yomihime_game_link_sdk as ygl
            from yomihime_game_link_sdk.host import ExtensionHostError

            if ygl.__version__ != SDK_VERSION or ygl.MODULE_ABI_VERSION != "2.0":
                self.connection_state = "incompatible_sdk"
                return
            if (
                self._core_instance is core
                and self._lease is not None
                and self._lease.active
            ):
                return
            try:
                lease = await host.register_package(
                    plugin_name=PLUGIN_NAME,
                    plugin_instance=self,
                    package_root=str(
                        Path(__file__).resolve().parent / "packages" / "steam_dlc"
                    ),
                )
            except ExtensionHostError as error:
                self.connection_state = error.code
                logger.warning("Steam DLC 接入被拒绝：%s", error.code)
                return
            if self._core() is not core or self._closed:
                await host.unregister_package(lease)
                self.connection_state = "waiting_core"
                return
            self._core_instance, self._host, self._lease = core, host, lease
            self.connection_state = "connected"
            logger.info("Steam DLC 已接入四个模块。")

    @filter.on_plugin_loaded()
    async def plugin_loaded(self, metadata):
        if metadata.name == CORE_NAME:
            await self._connect()

    @filter.on_plugin_unloaded()
    async def plugin_unloaded(self, metadata):
        async with self._lock:
            if metadata.name == CORE_NAME and metadata.star_cls is self._core_instance:
                self._host = self._lease = self._core_instance = None
                self.connection_state = "waiting_core"

    async def terminate(self):
        async with self._lock:
            self._closed = True
            host, lease = self._host, self._lease
            self._host = self._lease = self._core_instance = None
            self.connection_state = "unloaded"
            if host is not None and lease is not None:
                await host.unregister_package(lease)

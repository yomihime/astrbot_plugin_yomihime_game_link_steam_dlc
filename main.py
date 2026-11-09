"""Thin AstrBot lifecycle shell for the versioned YGL JSON control endpoint."""

import asyncio
import hashlib
import json
import re
import uuid
from pathlib import Path

from astrbot.api import logger
from astrbot.api.event import filter
from astrbot.api.star import Context, Star, register

PLUGIN_NAME = "astrbot_plugin_yomihime_game_link_steam_dlc"
CORE_NAME = "astrbot_plugin_yomihime_game_link"
PROTOCOL = "ygl.control/1"
ROOT = Path(__file__).resolve().parent


@register(PLUGIN_NAME, "yomihime", "如月怜的游戏连结：Steam DLC", "0.3.0")
class SteamDLC(Star):
    REQUEST_TIMEOUT = 3.0
    RETRY_INTERVAL = 2.0
    POLL_INTERVAL = 0.1

    def __init__(self, context: Context):
        super().__init__(context)
        self._context = context
        self._closed = False
        self._task = None
        self._wake = asyncio.Event()
        self._core_instance = None
        self._endpoint = None
        self._lease = None
        self._core_epoch = None
        self._package_epoch = None
        self._request_id = None
        self._operation_id = None
        self._retiring = None
        self.connection_state = "waiting_core"

    async def initialize(self):
        self._schedule()

    def _schedule(self):
        if self._closed:
            return
        self._wake.set()
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._run())

    def _core(self):
        # Resolve current activated instances each time; cached metadata is not authority.
        candidates = []
        try:
            preferred = self._context.get_registered_star(CORE_NAME)
            if preferred is not None:
                candidates.append(preferred)
            get_all = getattr(self._context, "get_all_stars", None)
            if callable(get_all):
                candidates.extend(get_all())
        except (KeyError, ValueError):
            return None
        for metadata in candidates:
            instance = getattr(metadata, "star_cls", None)
            if getattr(metadata, "activated", False) and callable(
                getattr(instance, "get_ygl_endpoint_v1", None)
            ):
                return instance
        return None

    def _forget(self):
        self._core_instance = self._endpoint = self._lease = None
        self._core_epoch = self._package_epoch = None
        self._request_id = self._operation_id = None

    async def _request(self, endpoint, op, **fields):
        message = {"protocol": PROTOCOL, "op": op, **fields}
        reply = await asyncio.wait_for(
            endpoint.request(self, message), self.REQUEST_TIMEOUT
        )
        # Keep the boundary JSON-only even when an endpoint misbehaves.
        encoded = json.dumps(reply, allow_nan=False).encode("utf-8")
        if len(encoded) > 65536:
            raise ValueError("oversized control reply")
        reply = json.loads(encoded)
        if (
            type(reply) is not dict
            or reply.get("protocol") != PROTOCOL
            or type(reply.get("ok")) is not bool
            or type(reply.get("state")) is not str
        ):
            raise ValueError("malformed control reply")
        return reply

    @staticmethod
    def _state(reply):
        if reply["ok"]:
            return reply["state"]
        error = reply.get("error", {})
        if type(error) is not dict or type(error.get("code")) is not str:
            raise ValueError("malformed control error")
        return error["code"]

    async def _disconnect(self, endpoint, lease):
        if endpoint is not None and lease is not None:
            self._retiring = (endpoint, lease)
            try:
                await self._request(endpoint, "disconnect", lease=lease)
            except Exception:
                # Exact opaque lease only: never fall back to a package-wide removal.
                logger.warning("Steam DLC lease disconnect did not complete.")
            finally:
                self._retiring = None

    async def _reconcile(self):
        core = self._core()
        if core is not self._core_instance:
            old_endpoint, old_lease = self._endpoint, self._lease
            self._forget()
            await self._disconnect(old_endpoint, old_lease)
        if core is None:
            self.connection_state = "waiting_core"
            return self.RETRY_INTERVAL
        endpoint = core.get_ygl_endpoint_v1()
        if endpoint is None:
            self.connection_state = "waiting_core"
            return self.RETRY_INTERVAL
        if self._endpoint is not endpoint:
            old_endpoint, old_lease = self._endpoint, self._lease
            self._forget()
            await self._disconnect(old_endpoint, old_lease)
            self._core_instance, self._endpoint = core, endpoint
        described = await self._request(endpoint, "describe")
        state = self._state(described)
        if state != "ready":
            self.connection_state = state
            return self.RETRY_INTERVAL
        epoch = described.get("core_epoch")
        if type(epoch) is not int or not 0 <= epoch <= 2**53 - 1:
            raise ValueError("invalid Core epoch")
        contract = described.get("module_contract")
        features = described.get("features")
        manifest = json.loads(
            (ROOT / "packages/steam_dlc/yomihime.manifest.json").read_bytes()
        )
        if (
            type(contract) is not dict
            or type(contract.get("major")) is not int
            or contract["major"] != 2
            or type(contract.get("minor")) is not int
            or contract["minor"] < manifest["module_contract"]["minimum_minor"]
            or type(features) is not list
            or any(type(item) is not str for item in features)
        ):
            self.connection_state = "incompatible_core"
            return self.RETRY_INTERVAL
        if not set(manifest["required_features"]) <= set(features):
            self.connection_state = "missing_feature"
            return self.RETRY_INTERVAL
        if self._core_epoch is not None and epoch != self._core_epoch:
            old_lease = self._lease
            self._lease = self._package_epoch = self._operation_id = None
            self._request_id = None
            await self._disconnect(endpoint, old_lease)
        self._core_epoch = epoch
        if self._lease is not None:
            reply = await self._request(endpoint, "status", lease=self._lease)
        else:
            if self._request_id is None:
                self._request_id = str(uuid.uuid4())
            if self._operation_id is None:
                reply = await self._request(
                    endpoint,
                    "connect",
                    request_id=self._request_id,
                    descriptor_digest=hashlib.sha256(
                        (ROOT / "ygl-plugin.json").read_bytes()
                    ).hexdigest(),
                )
                operation_id = reply.get("operation_id")
                if reply["ok"] and reply["state"] == "queued":
                    if (
                        type(operation_id) is not str
                        or not 0 < len(operation_id) <= 128
                    ):
                        raise ValueError("invalid operation identifier")
                    self._operation_id = operation_id
            else:
                reply = await self._request(
                    endpoint, "status", operation_id=self._operation_id
                )
        state = self._state(reply)
        if state == "active":
            lease = reply.get("lease")
            package_epoch = reply.get("package_epoch")
            if type(reply.get("core_epoch")) is int and reply["core_epoch"] != epoch:
                # A completed operation from an old Core generation is never adopted.
                self._lease = self._package_epoch = self._operation_id = None
                self._request_id = None
                self.connection_state = "environment_changed"
                if type(lease) is str and re.fullmatch(r"[0-9a-f]{64}", lease):
                    await self._disconnect(endpoint, lease)
                return self.POLL_INTERVAL
            if (
                type(lease) is not str
                or not re.fullmatch(r"[0-9a-f]{64}", lease)
                or type(reply.get("core_epoch")) is not int
                or reply["core_epoch"] != epoch
                or type(package_epoch) is not int
                or not 0 <= package_epoch <= 2**53 - 1
            ):
                raise ValueError("invalid active lease")
            if self._closed or self._core() is not core:
                await self._disconnect(endpoint, lease)
                self._forget()
                return self.POLL_INTERVAL
            self._lease, self._package_epoch = lease, package_epoch
            self.connection_state = "connected"
            return self.RETRY_INTERVAL
        self.connection_state = state
        if state not in {"queued", "preparing", "cleanup_pending"}:
            self._lease = self._package_epoch = self._operation_id = None
            self._request_id = None
            return self.RETRY_INTERVAL
        return self.POLL_INTERVAL

    async def _run(self):
        while not self._closed:
            self._wake.clear()
            delay = self.RETRY_INTERVAL
            try:
                delay = await self._reconcile()
            except asyncio.CancelledError:
                raise
            except Exception:
                self.connection_state = "endpoint_unavailable"
                logger.warning("Steam DLC control endpoint unavailable; retrying.")
            try:
                await asyncio.wait_for(self._wake.wait(), delay)
            except TimeoutError:
                pass

    @filter.on_plugin_loaded()
    async def plugin_loaded(self, metadata):
        self._schedule()

    @filter.on_plugin_unloaded()
    async def plugin_unloaded(self, metadata):
        self._schedule()

    async def terminate(self):
        # Close synchronously before the first await; lifecycle never waits for prepare.
        self._closed = True
        self._wake.set()
        task, self._task = self._task, None
        endpoint, lease = self._endpoint, self._lease
        retiring = self._retiring
        self._forget()
        self.connection_state = "unloaded"
        if task is not None:
            task.cancel()
            try:
                await asyncio.wait_for(task, self.REQUEST_TIMEOUT)
            except (TimeoutError, asyncio.CancelledError):
                pass
        await self._disconnect(endpoint, lease)
        if retiring is not None and retiring != (endpoint, lease):
            await self._disconnect(*retiring)

"""Offline lifecycle and real Core parser/facade integration contracts."""

import asyncio
import hashlib
import importlib.util
import json
import sys
import types
import unittest
from pathlib import Path
from unittest.mock import patch

from sl07_core.extensions.disk_manifest import parse_manifest
from sl07_core.extensions.hot_update_protocol import (
    ProtocolError,
    b05_manifest_bytes,
    negotiate_manifest,
    parse_control,
    parse_package_manifest,
    parse_plugin_descriptor,
)
from sl07_core.services.external_source_policies import parse_package_source_policy
from sl07_core.yomihime_game_link_sdk import ModuleHandlers

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = parse_package_manifest(
    (ROOT / "packages/steam_dlc/yomihime.manifest.json").read_bytes()
)


def load_shell():
    api = types.ModuleType("astrbot.api")
    api.logger = types.SimpleNamespace(info=lambda *a: None, warning=lambda *a: None)
    event = types.ModuleType("astrbot.api.event")
    event.filter = types.SimpleNamespace(
        on_plugin_loaded=lambda: lambda f: f,
        on_plugin_unloaded=lambda: lambda f: f,
    )
    star = types.ModuleType("astrbot.api.star")
    star.Context = object
    star.Star = type("Star", (), {"__init__": lambda self, context: None})
    star.register = lambda *a: lambda cls: cls
    with patch.dict(
        sys.modules,
        {
            "astrbot": types.ModuleType("astrbot"),
            "astrbot.api": api,
            "astrbot.api.event": event,
            "astrbot.api.star": star,
        },
    ):
        spec = importlib.util.spec_from_file_location("sl07_shell", ROOT / "main.py")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
    return module


SHELL = load_shell()


class Endpoint:
    def __init__(self, epoch=1):
        self.epoch = epoch
        self.calls = []
        self.preparing = False
        self.reply_override = None
        self.features = MANIFEST["required_features"]
        self.lease = str(epoch) * 64

    async def request(self, caller, message):
        parse_control(json.dumps(message).encode())
        self.calls.append((caller, message))
        base = {"protocol": "ygl.control/1", "ok": True}
        if self.reply_override:
            return self.reply_override
        if message["op"] == "describe":
            return {
                **base,
                "state": "ready",
                "core_epoch": self.epoch,
                "module_contract": {"major": 2, "minor": 0},
                "features": self.features,
            }
        if message["op"] == "connect":
            return {**base, "state": "queued", "operation_id": "operation"}
        if message["op"] == "disconnect":
            return {**base, "state": "already_detached"}
        if self.preparing:
            return {**base, "state": "preparing", "operation_id": "operation"}
        return {
            **base,
            "state": "active",
            "lease": self.lease,
            "core_epoch": self.epoch,
            "package_epoch": 1,
            "installed_version": "0.3.0",
            "running_version": "0.3.0",
        }


class Context:
    def __init__(self):
        self.current = None

    def get_registered_star(self, name):
        return self.current

    def get_all_stars(self):
        return [] if self.current is None else [self.current]

    def activate(self, endpoint):
        core = types.SimpleNamespace(get_ygl_endpoint_v1=lambda: endpoint)
        self.current = types.SimpleNamespace(activated=True, star_cls=core)
        return core


async def eventually(predicate):
    async with asyncio.timeout(1):
        while not predicate():
            await asyncio.sleep(0.002)


class LifecycleTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.context = Context()
        self.dlc = SHELL.SteamDLC(self.context)
        self.dlc.RETRY_INTERVAL = 0.01
        self.dlc.POLL_INTERVAL = 0.002
        self.dlc.REQUEST_TIMEOUT = 0.1
        self.addAsyncCleanup(self.dlc.terminate)

    async def test_dlc_before_core_and_delayed_core_without_event(self):
        await self.dlc.initialize()
        await asyncio.sleep(0)
        self.assertEqual(self.dlc.connection_state, "waiting_core")
        endpoint = Endpoint()
        self.context.activate(endpoint)
        await eventually(lambda: self.dlc.connection_state == "connected")
        connect = [m for _, m in endpoint.calls if m["op"] == "connect"]
        self.assertEqual(len(connect), 1)
        self.assertEqual(
            connect[0]["descriptor_digest"],
            hashlib.sha256((ROOT / "ygl-plugin.json").read_bytes()).hexdigest(),
        )
        self.assertTrue(all(caller is self.dlc for caller, _ in endpoint.calls))

    async def test_duplicate_events_one_pending_operation_and_nonblocking_callbacks(
        self,
    ):
        endpoint = Endpoint()
        endpoint.preparing = True
        self.context.activate(endpoint)
        await self.dlc.initialize()
        await eventually(lambda: self.dlc.connection_state == "preparing")
        for _ in range(15):
            await self.dlc.plugin_loaded(self.context.current)
            await self.dlc.plugin_unloaded(self.context.current)
        await asyncio.sleep(0.025)
        self.assertEqual(sum(m["op"] == "connect" for _, m in endpoint.calls), 1)
        self.assertIsNone(self.dlc._lease)
        endpoint.preparing = False
        await eventually(lambda: self.dlc.connection_state == "connected")

    async def test_core_changes_without_dlc_reload_and_old_exact_lease(self):
        old = Endpoint()
        self.context.activate(old)
        await self.dlc.initialize()
        await eventually(lambda: self.dlc.connection_state == "connected")
        new = Endpoint(2)
        self.context.activate(new)
        await eventually(lambda: self.dlc._lease == new.lease)
        disconnects = [m for _, m in old.calls if m["op"] == "disconnect"]
        self.assertEqual(
            disconnects,
            [{"protocol": "ygl.control/1", "op": "disconnect", "lease": old.lease}],
        )
        self.assertFalse(any(m["op"] == "disconnect" for _, m in new.calls))
        # Delayed old unloaded event cannot discard the current Core lease.
        await self.dlc.plugin_unloaded(types.SimpleNamespace(star_cls=old))
        await asyncio.sleep(0.02)
        self.assertEqual(self.dlc._lease, new.lease)
        await self.dlc.terminate()
        self.assertEqual(self.dlc.connection_state, "unloaded")
        self.assertEqual(
            [m["lease"] for _, m in new.calls if m["op"] == "disconnect"], [new.lease]
        )

    async def test_missing_feature_malformed_reply_and_recovery(self):
        endpoint = Endpoint()
        endpoint.features = []
        self.context.activate(endpoint)
        await self.dlc.initialize()
        await eventually(lambda: self.dlc.connection_state == "missing_feature")
        self.assertFalse(any(m["op"] == "connect" for _, m in endpoint.calls))
        endpoint.reply_override = {"protocol": "wrong", "ok": True, "state": "ready"}
        await eventually(lambda: self.dlc.connection_state == "endpoint_unavailable")
        endpoint.reply_override = None
        endpoint.features = MANIFEST["required_features"]
        await eventually(lambda: self.dlc.connection_state == "connected")

    async def test_approval_required_and_environment_change_recover(self):
        endpoint = Endpoint()
        self.context.activate(endpoint)
        endpoint.reply_override = {
            "protocol": "ygl.control/1",
            "ok": False,
            "state": "rejected",
            "error": {"code": "approval_required", "retryable": False},
        }
        await self.dlc.initialize()
        await eventually(lambda: self.dlc.connection_state == "approval_required")
        endpoint.reply_override = None
        await eventually(lambda: self.dlc.connection_state == "connected")
        endpoint.epoch = 2
        endpoint.lease = "2" * 64
        await eventually(
            lambda: self.dlc._core_epoch == 2 and self.dlc._lease == endpoint.lease
        )

    async def test_terminate_cancels_owned_pending_prepare(self):
        endpoint = Endpoint()
        endpoint.preparing = True
        self.context.activate(endpoint)
        await self.dlc.initialize()
        await eventually(lambda: self.dlc.connection_state == "preparing")
        await self.dlc.terminate()
        count = len(endpoint.calls)
        await self.dlc.plugin_loaded(self.context.current)
        await asyncio.sleep(0.025)
        self.assertEqual(len(endpoint.calls), count)
        self.assertTrue(self.dlc._closed)
        self.assertIsNone(self.dlc._task)

    async def test_timeout_connect_reuses_request_uuid(self):
        endpoint = Endpoint()
        original = endpoint.request
        timed_out = False

        async def request(caller, message):
            nonlocal timed_out
            reply = await original(caller, message)
            if message["op"] == "connect" and not timed_out:
                timed_out = True
                await asyncio.sleep(1)
            return reply

        endpoint.request = request
        self.context.activate(endpoint)
        await self.dlc.initialize()
        await eventually(lambda: self.dlc.connection_state == "connected")
        messages = [m for _, m in endpoint.calls if m["op"] == "connect"]
        self.assertEqual(len(messages), 2)
        self.assertEqual(messages[0], messages[1])

    async def test_stale_operation_epoch_is_discarded_then_reconnected(self):
        endpoint = Endpoint()
        original = endpoint.request
        stale_once = True

        async def request(caller, message):
            nonlocal stale_once
            reply = await original(caller, message)
            if message["op"] == "status" and stale_once:
                stale_once = False
                reply["core_epoch"] = 0
            return reply

        endpoint.request = request
        self.context.activate(endpoint)
        await self.dlc.initialize()
        await eventually(lambda: self.dlc.connection_state == "connected")
        connects = [m for _, m in endpoint.calls if m["op"] == "connect"]
        self.assertEqual(len(connects), 2)
        self.assertNotEqual(connects[0]["request_id"], connects[1]["request_id"])
        self.assertEqual(self.dlc._core_epoch, 1)

    async def test_terminate_during_disconnect_does_not_start_new_connect(self):
        old = Endpoint()
        self.context.activate(old)
        await self.dlc.initialize()
        await eventually(lambda: self.dlc.connection_state == "connected")
        entered = asyncio.Event()
        disconnects = []
        original = old.request

        async def request(caller, message):
            if message["op"] == "disconnect":
                disconnects.append(message)
                entered.set()
                if len(disconnects) == 1:
                    await asyncio.sleep(1)
            return await original(caller, message)

        old.request = request
        new = Endpoint(2)
        self.context.activate(new)
        await entered.wait()
        await self.dlc.terminate()
        self.assertFalse(any(m["op"] == "connect" for _, m in new.calls))
        self.assertEqual(self.dlc.connection_state, "unloaded")
        self.assertEqual(len(disconnects), 2)
        self.assertTrue(all(m["lease"] == old.lease for m in disconnects))


class ManifestTests(unittest.IsolatedAsyncioTestCase):
    def test_descriptor_b05_and_source_policy_real_parsers(self):
        descriptor = parse_plugin_descriptor((ROOT / "ygl-plugin.json").read_bytes())
        self.assertEqual(descriptor["package_id"], "steam_dlc")
        b05 = b05_manifest_bytes(MANIFEST)
        parsed = parse_manifest(b05)
        self.assertEqual(parsed.package_id, "steam_dlc")
        relative = MANIFEST["source_policy"]
        policy = (ROOT / relative).read_bytes()
        parsed_policy = parse_package_source_policy(
            policy,
            b05_manifest_bytes=b05,
            source_policy_path=relative,
            required_features=MANIFEST["required_features"],
            release_inventory=[
                {
                    "path": relative,
                    "size": len(policy),
                    "sha256": hashlib.sha256(policy).hexdigest(),
                }
            ],
        )
        self.assertTrue(parsed_policy)
        self.assertEqual(MANIFEST["release"], "0.3.0")
        with self.assertRaisesRegex(ProtocolError, "missing_feature"):
            negotiate_manifest(MANIFEST, 0, [])
        self.assertEqual(
            len(negotiate_manifest(MANIFEST, 0, MANIFEST["required_features"])), 10
        )

    async def test_plain_factories_produce_actual_core_graph_dtos(self):
        for name in ("steam", "dota2", "cs2", "deadlock"):
            module = __import__(
                f"packages.steam_dlc.{name}.module", fromlist=["Factory"]
            )
            instance = await module.Factory().create(types.SimpleNamespace())
            self.assertIsInstance(instance.handlers(), ModuleHandlers)

    def test_shell_has_no_business_or_sdk_imports_and_no_payload_facade(self):
        source = (ROOT / "main.py").read_text()
        self.assertNotIn("yomihime_game_link_sdk", source)
        self.assertNotIn("from packages", source)
        for file in (ROOT / "packages").rglob("*.py"):
            self.assertNotEqual(file.name, "_api_v2.py")
            self.assertNotIn("yomihime_game_link_sdk", file.read_text())

import unittest
from types import SimpleNamespace

import yomihime_game_link_sdk as ygl
from yomihime_game_link_sdk.contexts import InvocationOrigin

from packages.steam_dlc.cs2.module import DATA_CAPABILITIES, Factory


class NoServiceAccess:
    def __getattribute__(self, name):
        raise AssertionError(f"Blocked capability accessed service {name}")


class ModuleTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.module = await Factory().create(NoServiceAccess())
        await self.module.start()

    async def test_production_queries_fail_before_any_service_access(self):
        for origin in (
            InvocationOrigin.COMMAND,
            InvocationOrigin.LLM_TOOL,
            InvocationOrigin.WEB_PUBLIC,
        ):
            for operation in DATA_CAPABILITIES:
                args = {"steam_id": "76561197960265851"}
                if operation == "match":
                    args = {"match_id": "00000000-0000-4000-8000-000000000001"}
                result = (
                    await self.module.handlers()
                    .capabilities[operation]
                    .invoke(SimpleNamespace(origin=origin), args)
                )
                self.assertEqual(result.status, ygl.ResultStatus.ERROR)
                self.assertEqual(result.error.code, ygl.ErrorCode.MODULE_UNAVAILABLE)
                self.assertIn("未发起数据请求", result.error.message)
                self.assertIsNone(result.model_facts)
                self.assertIsNone(result.document)

    async def test_default_command_no_facts_and_tools_require_explicit_id(self):
        command = SimpleNamespace(origin=InvocationOrigin.COMMAND)
        tool = SimpleNamespace(origin=InvocationOrigin.LLM_TOOL)
        status = await self.module.invoke(command, {})
        self.assertIsNone(status.model_facts)
        for operation in ("profile", "recent", "stats", "last"):
            handler = self.module.handlers().capabilities[operation]
            self.assertEqual(
                (await handler.invoke(command, {})).error.code,
                ygl.ErrorCode.MODULE_UNAVAILABLE,
            )
            self.assertEqual(
                (await handler.invoke(tool, {})).error.code,
                ygl.ErrorCode.PARAMETER_ERROR,
            )

    async def test_health_reports_blocked_data_and_honest_status(self):
        health = await self.module.check_health()
        self.assertEqual(
            health.capabilities["status"].status, ygl.HealthStatus.AVAILABLE
        )
        for op in DATA_CAPABILITIES:
            self.assertEqual(
                health.capabilities[op].status, ygl.HealthStatus.UNAVAILABLE
            )
        await self.module.stop()
        self.assertEqual(
            (await self.module.check_health()).capabilities["status"].status,
            ygl.HealthStatus.UNAVAILABLE,
        )

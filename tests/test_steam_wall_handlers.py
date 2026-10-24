"""Synthetic handler/dependency/privacy integration against the canonical SDK DTOs."""

import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import yomihime_game_link_sdk as ygl
from test_steam_wall import projection, row
from test_steam_wall_materials import scope
from yomihime_game_link_sdk.storage import CacheVisibility

from packages.steam_dlc.steam.module import SteamModule
from packages.steam_dlc.steam.wall import select
from packages.steam_dlc.steam.wall_presentation import result as wall_result


class HandlerTests(unittest.IsolatedAsyncioTestCase):
    async def test_web_preview_requires_explicit_account_and_writes_only_public_materials(
        self,
    ):
        web = SimpleNamespace(
            origin=ygl.InvocationOrigin.WEB_PUBLIC, parent_id=None, actor_id=None
        )
        put = self.scope.cache.put

        async def public_only(*args, **kwargs):
            self.assertIs(kwargs.get("visibility"), CacheVisibility.PUBLIC)
            return await put(*args, **kwargs)

        with patch.object(self.scope.cache, "put", side_effect=public_only):
            result = (
                await self.module.handlers()
                .capabilities["wall_preview"]
                .invoke(web, {"account": "1"})
            )
        self.assertEqual(result.status, ygl.ResultStatus.PARTIAL_SUCCESS)
        self.assertIs(result.privacy, ygl.Privacy.PUBLIC)
        self.mock_load.assert_awaited_once_with(
            self.scope, "games", self.sid, cache=False
        )
        self.scope.records.collection.assert_not_awaited()
        denied = (
            await self.module.handlers().capabilities["wall_preview"].invoke(web, {})
        )
        self.assertEqual(denied.status, ygl.ResultStatus.ERROR)

    async def test_five_hundred_default_dense_items_are_selected_before_batched_images(
        self,
    ):
        self.data["data"]["games"] = [row(i, "1") for i in range(1, 501)]
        self.data["data"]["complete_library"] = True
        response = (
            await self.module.handlers().capabilities["wall"].invoke(self.context, {})
        )
        self.assertEqual(response.status, ygl.ResultStatus.SUCCESS)
        self.assertEqual(
            type(response.document.card.blocks[0]).__name__, "DenseCollage"
        )
        self.assertEqual(len(response.document.card.blocks[0].items), 500)
        phases = [parameters["phase"] for _, parameters in self.calls]
        self.assertEqual(phases, ["metadata"] * 5 + ["images"] * 5)
        self.assertTrue(
            all(len(parameters["app_ids"]) <= 100 for _, parameters in self.calls)
        )
        self.assertIsNone(response.model_facts)

    async def test_impossible_thousand_max_spans_fail_before_cover_fetches(self):
        self.data["data"]["games"] = [row(i, "80000") for i in range(1, 1001)]
        response = (
            await self.module.handlers()
            .capabilities["wall"]
            .invoke(self.context, {"limit": 1000})
        )
        self.assertEqual(response.status, ygl.ResultStatus.ERROR)
        self.assertIn("减小数量", response.error.message)
        self.assertTrue(self.calls)
        self.assertTrue(
            all(parameters["phase"] == "metadata" for _, parameters in self.calls)
        )

    async def test_configured_full_source_uses_public_key_metadata_without_binding_write(
        self,
    ):
        from yomihime_game_link_sdk.storage import SecretMetadataState

        self.services.config.current.return_value = SimpleNamespace(
            values={},
            secret_metadata=(
                SimpleNamespace(
                    field="credential_steam_key",
                    state=SecretMetadataState.ACTIVE,
                    revision=7,
                ),
            ),
        )
        self.data["operation"] = "full"
        self.data["scope"] = "webapi_owned_games"
        self.data["target"] = self.sid
        self.data["data"]["complete_library"] = True
        with patch(
            "packages.steam_dlc.steam.career.load_full",
            AsyncMock(return_value=self.data),
        ) as full:
            output = (
                await self.module.handlers()
                .capabilities["wall_explicit"]
                .invoke(
                    SimpleNamespace(
                        origin=ygl.InvocationOrigin.COMMAND,
                        parent_id="parent",
                        actor_id="synthetic-owner",
                    ),
                    {"account": "1", "source": "full"},
                )
            )
        self.assertEqual(output.status, ygl.ResultStatus.SUCCESS)
        full.assert_awaited_once_with(
            self.scope, self.sid, credential_revision=7, cache=False, refresh=False
        )
        self.mock_load.assert_not_awaited()
        self.scope.records.collection.assert_not_awaited()
        self.assertTrue(output.model_facts.facts["complete_library"])

    async def test_card_visible_summary_retains_coverage_counts_and_area_semantics(
        self,
    ):
        data = projection(
            [
                row(1, "10"),
                row(1, "10"),
                row(2, "1000"),
                row(3, None),
                row(4, "0"),
                row(5, "20"),
                row(6, "9"),
                row(7, "8"),
            ]
        )
        materials = {
            "items": [
                {"app_id": str(appid), "app_type": "software" if appid == 2 else "game"}
                for appid in (1, 2, 3, 4, 6, 7)
            ]
        }
        selection = select(data, materials, limit=1)
        response = wall_result(selection)
        card = response.document.card
        visible = "\n".join((card.title, card.subtitle, *card.sources))
        for text in (
            "公开样本",
            "不是完整游戏库",
            "仅已确认游戏",
            "XML",
            "来源8项",
            "去重后7项",
            "本次纳入1项",
            "筛除4项",
            "limit截取2项",
            "未知类型1项",
            "未知时长1项",
            "未游玩1项",
            "分类计数可交叉",
            "缺图1项",
            "sqrt(累计分钟)",
            "尺寸分档",
            "面积非递减",
            "非精确比例",
            "有界裁边",
            "不拉伸",
            "2026-01-01T00:00:00Z",
        ):
            self.assertIn(text, visible)
        self.assertIsNone(response.model_facts)
        all_apps = wall_result(select(data, materials, limit=1, all_apps=True))
        self.assertIn("全部应用（含软件及未知类型）", all_apps.document.card.subtitle)
        self.assertEqual(len(card.blocks), 1)

    async def asyncSetUp(self):
        self.scope = scope()
        self.context = SimpleNamespace(
            origin=ygl.InvocationOrigin.COMMAND,
            parent_id=None,
            actor_id="synthetic-owner",
        )
        self.sid = "76561197960265729"
        record = SimpleNamespace(value={"steam_id64": self.sid}, revision=1)
        self.scope.records = SimpleNamespace(
            collection=AsyncMock(
                return_value=SimpleNamespace(get=AsyncMock(return_value=record))
            )
        )
        self.services = SimpleNamespace(
            scopes=SimpleNamespace(bind=AsyncMock(return_value=self.scope)),
            config=SimpleNamespace(
                current=AsyncMock(return_value=SimpleNamespace(values={}))
            ),
        )
        self.module = SteamModule(self.services)
        await self.module.start()
        self.calls = []

        async def invoke(context, reference, parameters):
            self.calls.append((reference, parameters))
            return (
                await self.module.handlers()
                .capabilities[reference.capability_id]
                .invoke(context, parameters)
            )

        self.scope.dependencies = SimpleNamespace(invoke=invoke)
        self.data = projection([row(1, "10"), row(2, "1000")])
        self.data["cache"] = {"status": "hit"}
        self.loader = patch(
            "packages.steam_dlc.steam.queries.load", AsyncMock(return_value=self.data)
        )
        self.mock_load = self.loader.start()

    async def asyncTearDown(self):
        self.loader.stop()
        await self.module.stop()

    async def test_private_default_no_facts_public_dependency_has_only_selected_appids(
        self,
    ):
        result = (
            await self.module.handlers().capabilities["wall"].invoke(self.context, {})
        )
        self.assertEqual(result.status, ygl.ResultStatus.PARTIAL_SUCCESS)
        self.assertEqual(result.privacy, ygl.Privacy.PRIVATE)
        self.assertIsNone(result.model_facts)
        self.assertEqual(result.document.privacy, ygl.Privacy.PRIVATE)
        self.assertEqual(len(result.document.card.blocks), 1)
        self.assertEqual(len(result.document.card.blocks[0].items), 2)
        self.assertEqual(self.calls[0][1]["phase"], "metadata")
        self.assertEqual(self.calls[1][1]["app_ids"], ["2", "1"])
        for _, parameters in self.calls:
            self.assertNotIn("account", parameters)
            self.assertNotIn("minutes", parameters)
            self.assertNotIn(self.sid, repr(parameters))
        self.assertTrue(
            any(
                visibility is CacheVisibility.USER
                for visibility, _, _ in self.scope.cache.puts
            )
        )
        hot = await self.module.handlers().capabilities["wall"].invoke(self.context, {})
        self.assertIn("图片0", hot.document.ordered_blocks[0].text)
        self.assertIn("2026-01-01", hot.document.ordered_blocks[0].text)

    async def test_explicit_facts_summarized_and_tool_missing_account_never_reads_binding(
        self,
    ):
        tool = SimpleNamespace(
            origin=ygl.InvocationOrigin.LLM_TOOL,
            parent_id=None,
            actor_id="synthetic-owner",
        )
        result = (
            await self.module.handlers()
            .capabilities["wall_explicit"]
            .invoke(tool, {"account": "1"})
        )
        self.assertEqual(result.privacy, ygl.Privacy.PUBLIC)
        self.assertNotIn("rows", result.model_facts.facts)
        self.assertNotIn("asset_id", repr(result.model_facts.facts))
        self.assertNotIn(self.sid, repr(result.model_facts.facts))
        missing = (
            await self.module.handlers().capabilities["wall_explicit"].invoke(tool, {})
        )
        self.assertEqual(missing.status, ygl.ResultStatus.ERROR)
        self.scope.records.collection.assert_not_awaited()

    async def test_llm_explicit_wall_uses_no_account_or_selection_cache(self):
        tool = SimpleNamespace(
            origin=ygl.InvocationOrigin.LLM_TOOL,
            parent_id=None,
            actor_id="synthetic-owner",
        )
        put = self.scope.cache.put

        async def public_only(*args, **kwargs):
            if kwargs.get("visibility") is not CacheVisibility.PUBLIC:
                raise ygl.AccessDenied()
            return await put(*args, **kwargs)

        with patch.object(self.scope.cache, "put", side_effect=public_only):
            response = (
                await self.module.handlers()
                .capabilities["wall_explicit"]
                .invoke(tool, {"account": "2"})
            )
        self.assertEqual(response.status, ygl.ResultStatus.PARTIAL_SUCCESS)
        self.mock_load.assert_awaited_once_with(
            self.scope, "games", "76561197960265730", cache=False
        )
        self.assertTrue(self.scope.cache.puts)
        self.assertTrue(
            all(
                visibility is CacheVisibility.PUBLIC
                for visibility, _, _ in self.scope.cache.puts
            )
        )
        self.assertEqual(
            [
                key
                for _, key, _ in self.scope.cache.puts
                if key.startswith("steam-wall-v1:result:")
            ],
            [],
        )
        self.scope.records.collection.assert_not_awaited()

    async def test_full_blocked_visible_not_substituted_and_default_nested_guard(self):
        full = (
            await self.module.handlers()
            .capabilities["wall"]
            .invoke(self.context, {"command": "--source full"})
        )
        self.assertEqual(full.status, ygl.ResultStatus.NEEDS_SELECTION)
        self.assertIn("未用公开样本替代", full.document.ordered_blocks[0].text)
        self.assertIsNone(full.model_facts)
        self.mock_load.assert_not_awaited()
        self.assertFalse(self.calls)
        nested = SimpleNamespace(
            origin=ygl.InvocationOrigin.COMMAND,
            parent_id="parent",
            actor_id="synthetic-owner",
        )
        denied = await self.module.handlers().capabilities["wall"].invoke(nested, {})
        self.assertEqual(denied.status, ygl.ResultStatus.ERROR)
        self.scope.records.collection.assert_not_awaited()

    async def test_stats_carrier_health_and_lifecycle_include_all_handlers(self):
        status = (
            await self.module.handlers()
            .capabilities["wall_cache_status"]
            .invoke(self.context, {})
        )
        self.assertEqual(
            set(status.document.ordered_blocks[0].fields["cache"]),
            {"bytes", "items", "max_bytes", "max_items", "evictions"},
        )
        self.assertFalse(self.scope.http.requests)
        health = await self.module.check_health()
        for name in ("wall", "wall_explicit", "wall_materials", "wall_cache_status"):
            self.assertIn(name, health.capabilities)
        await self.module.stop()
        stopped = (
            await self.module.handlers().capabilities["wall"].invoke(self.context, {})
        )
        self.assertEqual(stopped.status, ygl.ResultStatus.ERROR)

"""Offline durable-handler probes; Core owns persistence/render acceptance."""

import json
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import yomihime_game_link_sdk as ygl
from test_steam_wall import projection, row
from yomihime_game_link_sdk.jobs import JobResultPage, JobStatus, JobView
from yomihime_game_link_sdk.storage import CacheLookup, CacheLookupStatus

from packages.steam_dlc.steam.career import load_full
from packages.steam_dlc.steam.jobs import JobHandler, SteamWallJob
from packages.steam_dlc.steam.module import SteamModule
from packages.steam_dlc.steam.queries import QueryFailure
from packages.steam_dlc.steam.wall_materials import MaterialPreparer


class HandlerTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.scope = SimpleNamespace(
            resources=SimpleNamespace(
                pin=AsyncMock(return_value="pin"), unpin=AsyncMock()
            ),
            jobs=SimpleNamespace(
                submit=AsyncMock(
                    return_value=JobView("job", 1, "steam_wall", JobStatus.QUEUED)
                )
            ),
        )
        self.services = SimpleNamespace(
            scopes=SimpleNamespace(bind=AsyncMock(return_value=self.scope)),
            config=SimpleNamespace(
                current=AsyncMock(
                    return_value=SimpleNamespace(values={}, secret_metadata=())
                )
            ),
        )
        self.module = SteamModule(self.services)
        await self.module.start()
        self.context = SimpleNamespace(
            origin=ygl.InvocationOrigin.JOB, parent_id=None, actor_id="owner"
        )
        self.control = SimpleNamespace(update=AsyncMock(), publish_document=AsyncMock())
        self.calls = []

        async def prepare(scope, appids, *, phase="images", refresh=False):
            self.calls.append((phase, list(appids)))
            return {
                "items": [
                    {
                        "app_id": str(appid),
                        "app_type": "game",
                        "asset_id": "asset-" + str(appid),
                    }
                    for appid in appids
                ],
                "counters": {"image_requests": len(appids) if phase == "images" else 0},
            }

        self.module._materials.prepare = AsyncMock(side_effect=prepare)

    async def asyncTearDown(self):
        await self.module.stop()

    async def test_finite_1001_1500_and_all_split_without_total_truncation(self):
        for count, limit, mode in (
            (1001, 1001, "top"),
            (1500, 1500, "top"),
            (2501, 500, "all"),
        ):
            with self.subTest(count=count):
                data = projection(
                    [row(index, "80000") for index in range(1, count + 1)]
                )
                data["data"]["complete_library"] = True
                self.control.publish_document.reset_mock()
                with patch(
                    "packages.steam_dlc.steam.jobs.load", AsyncMock(return_value=data)
                ):
                    summary = await SteamWallJob(self.module).run(
                        self.context,
                        {"account": "1", "limit": limit, "limit_mode": mode},
                        self.control,
                    )
                self.assertEqual(summary["selected"], count)
                self.assertEqual(summary["generated"], count)
                self.assertEqual(summary["pending"], 0)
                self.assertTrue(summary["completed_exactly"])
                documents = self.control.publish_document.await_args_list
                self.assertGreater(len(documents), 8)
                self.assertEqual(
                    sum(len(call.args[0].card.blocks[0].items) for call in documents),
                    count,
                )
                self.assertTrue(
                    all(
                        len(call.args[0].card.blocks[0].items) <= 32
                        for call in documents
                    )
                )
                self.assertEqual(documents[-1].kwargs["metadata"]["end"], count)
                self.assertEqual(
                    self.scope.resources.pin.await_count,
                    self.scope.resources.unpin.await_count,
                )
        self.assertTrue(
            all(
                len(ids) <= (100 if phase == "metadata" else 128)
                for phase, ids in self.calls
            )
        )

    async def test_filter_before_selection_and_cover_only_selected_items(self):
        data = projection([row(index, str(100 - index)) for index in range(1, 41)])
        with patch("packages.steam_dlc.steam.jobs.load", AsyncMock(return_value=data)):
            summary = await SteamWallJob(self.module).run(
                self.context, {"account": "2", "limit": 20}, self.control
            )
        self.assertEqual(summary["eligible"], 40)
        self.assertEqual(summary["selected"], 20)
        self.assertFalse(summary["complete_source"])
        self.assertFalse(summary["all_eligible_included"])
        self.assertEqual(
            [ids for phase, ids in self.calls if phase == "images"],
            [[str(index) for index in range(1, 21)]],
        )

    async def test_failed_later_batch_keeps_checkpoint_and_unpins(self):
        data = projection([row(index, "80000") for index in range(1, 66)])
        self.control.publish_document.side_effect = [
            None,
            RuntimeError("render failed"),
        ]
        with patch("packages.steam_dlc.steam.jobs.load", AsyncMock(return_value=data)):
            with self.assertRaisesRegex(RuntimeError, "render failed"):
                await SteamWallJob(self.module).run(
                    self.context, {"account": "2", "limit": 65}, self.control
                )
        self.assertEqual(self.control.publish_document.await_count, 2)
        self.assertEqual(self.scope.resources.unpin.await_count, 2)
        self.assertEqual(
            self.control.update.await_args_list[-1].kwargs["checkpoint"]["generated"],
            32,
        )

    async def test_real_metadata_failure_or_unknown_type_cannot_succeed_as_empty_games(
        self,
    ):
        data = projection([row(index, "100") for index in range(1, 21)])
        data["data"]["complete_library"] = True
        self.scope.cache = SimpleNamespace(
            lookup=AsyncMock(return_value=CacheLookup(CacheLookupStatus.MISS)),
            put=AsyncMock(),
        )
        for status, body in ((500, {}), (200, {"response": {"store_items": []}})):
            with self.subTest(status=status):
                self.scope.http = SimpleNamespace(
                    fetch=AsyncMock(
                        return_value=ygl.HttpResponse(
                            status,
                            {"Content-Type": "application/json"},
                            json.dumps(body).encode(),
                        )
                    )
                )
                self.module._materials = MaterialPreparer()
                try:
                    with patch(
                        "packages.steam_dlc.steam.jobs.load",
                        AsyncMock(return_value=data),
                    ):
                        with self.assertRaises(QueryFailure):
                            await SteamWallJob(self.module).run(
                                self.context,
                                {
                                    "account": "2",
                                    "limit_mode": "all",
                                    "all_apps": False,
                                },
                                self.control,
                            )
                    progress = self.control.update.await_args.args[0]
                    self.assertEqual(progress["reason"], "metadata_incomplete")
                    self.assertEqual(progress["metadata_unexamined"], 20)
                    self.assertIsNone(progress["selected"])
                    self.assertIsNone(progress["pending"])
                    self.control.publish_document.assert_not_awaited()
                finally:
                    await self.module._materials.stop()

    async def test_all_apps_preserves_selected_rows_and_reports_unknown_classification(
        self,
    ):
        data = projection([row(index, "100") for index in range(1, 21)])
        data["data"]["complete_library"] = True
        prepare = self.module._materials.prepare.side_effect

        async def unknown(scope, ids, **kwargs):
            payload = await prepare(scope, ids, **kwargs)
            for item in payload["items"]:
                item["app_type"] = "unknown"
            payload["counters"]["metadata_failed"] = 1
            return payload

        self.module._materials.prepare.side_effect = unknown
        with patch("packages.steam_dlc.steam.jobs.load", AsyncMock(return_value=data)):
            result = await SteamWallJob(self.module).run(
                self.context,
                {"account": "2", "limit_mode": "all", "all_apps": True},
                self.control,
            )
        self.assertEqual(result["selected"], 20)
        self.assertEqual(result["generated"], 20)
        self.assertTrue(result["complete_source"])
        self.assertFalse(result["classification_complete"])
        self.assertEqual(result["metadata_unexamined"], 20)
        self.assertGreater(result["metadata_failures"], 0)

    async def test_fresh_job_origin_and_explicit_target_required(self):
        for context, parameters in (
            (SimpleNamespace(origin=ygl.InvocationOrigin.COMMAND), {"account": "1"}),
            (self.context, {}),
        ):
            with self.assertRaises((ygl.AccessDenied, ValueError, TypeError)):
                await SteamWallJob(self.module).run(context, parameters, self.control)

    async def test_tool_receipt_never_resolves_binding_or_fetches_source(self):
        tool = SimpleNamespace(
            origin=ygl.InvocationOrigin.LLM_TOOL, parent_id=None, actor_id="owner"
        )
        handler = JobHandler(self.module, "submit", explicit=True)
        with patch("packages.steam_dlc.steam.jobs.load", AsyncMock()) as load:
            response = await handler.invoke(tool, {"account": "1", "limit": 1500})
        self.assertEqual(response.status, ygl.ResultStatus.SUCCESS)
        self.assertIs(response.privacy, ygl.Privacy.PUBLIC)
        self.assertIsNone(response.document.card)
        self.assertEqual(response.model_facts.facts["job_id"], "job")
        self.assertEqual(response.model_facts.facts["status"], "queued")
        self.assertNotIn("account", response.model_facts.facts)
        self.assertTrue(response.model_facts.facts["results_owner_bound"])
        request = self.scope.jobs.submit.await_args.args[0]
        self.assertEqual(request.parameters["account"], "76561197960265729")
        self.assertEqual(request.parameters["limit"], 1500)
        load.assert_not_awaited()
        denied = await handler.invoke(tool, {})
        self.assertEqual(denied.status, ygl.ResultStatus.ERROR)

    async def test_module_registers_real_job_and_stop_rejects_work(self):
        self.assertIsInstance(self.module.handlers().jobs["steam_wall"], SteamWallJob)
        self.assertIn("wishlist_explicit", self.module.handlers().capabilities)
        await self.module.stop()
        response = (
            await self.module.handlers().capabilities["wall"].invoke(self.context, {})
        )
        self.assertEqual(response.status, ygl.ResultStatus.ERROR)

    async def test_command_result_uses_opaque_cursor_and_selects_only_one_image(self):
        job = JobView(
            "job",
            7,
            "steam_wall",
            JobStatus.SUCCEEDED,
            summary={"generated": 21, "result_entries": 21},
        )
        self.scope.jobs.status = AsyncMock(return_value=job)
        self.scope.jobs.result = AsyncMock(
            side_effect=[
                JobResultPage(
                    job,
                    tuple(
                        {
                            "resource": {
                                "asset_id": f"asset-{index}",
                                "media_type": "image/png",
                            }
                        }
                        for index in range(20)
                    ),
                    "opaque-next",
                ),
                JobResultPage(
                    job,
                    (
                        {
                            "resource": {
                                "asset_id": "final-1",
                                "media_type": "image/png",
                            }
                        },
                        {
                            "resource": {
                                "asset_id": "final-2",
                                "media_type": "image/png",
                            }
                        },
                    ),
                ),
            ]
        )
        command = SimpleNamespace(
            origin=ygl.InvocationOrigin.COMMAND, parent_id=None, actor_id="owner"
        )
        response = (
            await self.module.handlers()
            .capabilities["wall"]
            .invoke(command, {"command": "result job --page 2 --image 2"})
        )
        self.assertEqual(response.status, ygl.ResultStatus.SUCCESS)
        images = [
            block
            for block in response.document.ordered_blocks
            if isinstance(block, ygl.ImageBlock)
        ]
        self.assertEqual(len(images), 1)
        self.assertEqual(images[0].asset_id, "final-2")
        self.assertIs(images[0].visibility, ygl.Privacy.PRIVATE)
        self.assertIsNone(response.model_facts)
        self.assertEqual(
            self.scope.jobs.result.await_args_list[0].kwargs,
            {"cursor": None, "page_size": 20},
        )
        self.assertEqual(
            self.scope.jobs.result.await_args_list[1].kwargs,
            {"cursor": "opaque-next", "page_size": 20},
        )
        self.services.config.current.assert_not_awaited()

    async def test_command_cancel_reads_revision_and_never_retries_conflict(self):
        job = JobView("job", 7, "steam_wall", JobStatus.RUNNING)
        self.scope.jobs.status = AsyncMock(return_value=job)
        self.scope.jobs.cancel = AsyncMock(
            side_effect=ygl.RevisionConflict("job", 7, 8)
        )
        command = SimpleNamespace(
            origin=ygl.InvocationOrigin.COMMAND, parent_id=None, actor_id="owner"
        )
        response = (
            await self.module.handlers()
            .capabilities["wall"]
            .invoke(command, {"command": "cancel job"})
        )
        self.assertEqual(response.status, ygl.ResultStatus.ERROR)
        self.assertIn("任务状态已变化", response.error.message)
        self.scope.jobs.cancel.assert_awaited_once_with("job", expected_revision=7)

    async def test_tool_cannot_supply_command_to_read_private_result(self):
        self.scope.jobs.status = AsyncMock()
        tool = SimpleNamespace(
            origin=ygl.InvocationOrigin.LLM_TOOL, parent_id=None, actor_id="owner"
        )
        response = (
            await self.module.handlers()
            .capabilities["wall_explicit"]
            .invoke(tool, {"command": "result job"})
        )
        self.assertEqual(response.status, ygl.ResultStatus.ERROR)
        self.scope.jobs.status.assert_not_awaited()

    async def test_rate_limit_stops_subsequent_batches_and_keeps_completed_progress(
        self,
    ):
        data = projection([row(index, "1") for index in range(1, 401)])
        original = self.module._materials.prepare.side_effect
        images = 0

        async def limited(scope, appids, *, phase="images", refresh=False):
            nonlocal images
            payload = await original(scope, appids, phase=phase, refresh=refresh)
            if phase == "images":
                images += 1
                if images == 2:
                    payload["counters"].update(rate_limited=1, retry_after=60)
            return payload

        self.module._materials.prepare.side_effect = limited
        with patch("packages.steam_dlc.steam.jobs.load", AsyncMock(return_value=data)):
            with self.assertRaises(QueryFailure):
                await SteamWallJob(self.module).run(
                    self.context, {"account": "1", "limit": 400}, self.control
                )
        self.assertEqual(images, 2)
        self.assertEqual(self.control.publish_document.await_count, 1)
        progress = self.control.update.await_args.args[0]
        self.assertEqual(progress["reason"], "rate_limited")
        self.assertEqual(progress["generated"], 128)
        self.assertEqual(progress["pending"], 272)

    async def test_large_full_source_remains_usable_when_optional_json_cache_is_too_small(
        self,
    ):
        target = "76561197960265729"
        self.scope.cache = SimpleNamespace(
            lookup=AsyncMock(return_value=CacheLookup(CacheLookupStatus.MISS)),
            put=AsyncMock(side_effect=ygl.ParameterError("bounded cache")),
        )

        async def fetch(request):
            body = (
                {
                    "response": {
                        "game_count": 1500,
                        "games": [
                            {"appid": index, "name": "Synthetic", "playtime_forever": 1}
                            for index in range(1, 1501)
                        ],
                    }
                }
                if request.path.endswith("GetOwnedGames/v1/")
                else {
                    "response": {
                        "players": [{"steamid": target, "personaname": "Synthetic"}]
                    }
                }
            )
            return ygl.HttpResponse(
                200, {"Content-Type": "application/json"}, json.dumps(body).encode()
            )

        self.scope.http = SimpleNamespace(fetch=AsyncMock(side_effect=fetch))
        projection = await load_full(self.scope, target)
        self.assertEqual(len(projection["data"]["games"]), 1500)
        self.assertTrue(projection["data"]["complete_library"])
        self.assertEqual(self.scope.http.fetch.await_count, 2)

    async def test_full_without_key_is_actionable_and_submits_no_fake_sample_job(self):
        tool = SimpleNamespace(
            origin=ygl.InvocationOrigin.LLM_TOOL, parent_id=None, actor_id="owner"
        )
        response = (
            await self.module.handlers()
            .capabilities["wall_explicit"]
            .invoke(tool, {"account": "1", "source": "full"})
        )
        self.assertEqual(response.status, ygl.ResultStatus.NEEDS_SELECTION)
        self.assertTrue(response.model_facts.facts["steam_key_required"])
        self.assertFalse(response.model_facts.facts["sample_fallback"])
        self.scope.jobs.submit.assert_not_awaited()

    async def test_default_binding_is_resolved_only_before_command_submit_and_stays_private(
        self,
    ):
        identity = ygl.CapabilityResult(
            "identity",
            ygl.ResultStatus.SUCCESS,
            document=ygl.DisplayDocument(
                "identity",
                "Steam",
                (ygl.FieldsBlock({"identity": {"steam_id64": "76561197960265729"}}),),
                privacy=ygl.Privacy.PRIVATE,
            ),
            privacy=ygl.Privacy.PRIVATE,
        )
        command = SimpleNamespace(
            origin=ygl.InvocationOrigin.COMMAND, parent_id=None, actor_id="owner"
        )
        with patch(
            "packages.steam_dlc.steam.module._Handler.invoke",
            AsyncMock(return_value=identity),
        ) as resolve:
            response = (
                await self.module.handlers().capabilities["wall"].invoke(command, {})
            )
        resolve.assert_awaited_once()
        self.assertIs(response.privacy, ygl.Privacy.PRIVATE)
        self.assertIsNone(response.model_facts)
        self.assertEqual(
            self.scope.jobs.submit.await_args.args[0].parameters["account"],
            "76561197960265729",
        )

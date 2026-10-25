"""Offline DLC handler -> frozen Core SQLite repository, never Host acceptance.

Set YGL_CORE_ROOT to the read-only compatible Core checkout to enable this
consumer test. SDK cache/resource/HTTP ports are synthetic; durable queue,
request matching, revisions and results are the real frozen implementation.
"""

import importlib
import importlib.util
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock

import yomihime_game_link_sdk as ygl
from test_steam_wall_materials import scope as material_scope
from yomihime_game_link_sdk.jobs import JobResultPage
from yomihime_game_link_sdk.storage import SecretMetadataState

from packages.steam_dlc.steam.jobs import JobHandler, SteamWallJob
from packages.steam_dlc.steam.module import SteamModule
from packages.steam_dlc.steam.queries import QueryFailure

CORE_ROOT = os.environ.get("YGL_CORE_ROOT")
NOW, EXPIRES = "2026-01-01T00:00:00+00:00", "2099-01-01T00:00:00+00:00"


def frozen_module(name):
    alias = "steam_dlc_frozen_core_test"
    if alias not in sys.modules:
        root = Path(CORE_ROOT).resolve()
        spec = importlib.util.spec_from_file_location(
            alias, root / "__init__.py", submodule_search_locations=[str(root)]
        )
        package = importlib.util.module_from_spec(spec)
        sys.modules[alias] = package
        spec.loader.exec_module(package)
    return importlib.import_module(f"{alias}.{name}")


@unittest.skipUnless(
    CORE_ROOT, "YGL_CORE_ROOT not provided; frozen Core consumer unrun"
)
class FrozenRepositoryTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        database_type = frozen_module("infrastructure.sqlite.database").SQLiteDatabase
        repositories = frozen_module("infrastructure.sqlite.repositories_jobs")
        self.view = repositories.view
        self.temporary = tempfile.TemporaryDirectory()
        self.database = database_type(Path(self.temporary.name) / "jobs.sqlite3")
        self.repository = repositories.SQLiteJobRepository(self.database)
        identities = frozen_module("infrastructure.sqlite.repositories_identity")
        principal = frozen_module("core.contracts.services").Principal
        await identities.SQLiteIdentityRepository(self.database).save_principal(
            principal("synthetic-owner", "synthetic-namespace", "synthetic-user")
        )
        self.scope = material_scope()
        self.scope.resources.pin = AsyncMock(return_value="synthetic-pin")
        self.scope.resources.unpin = AsyncMock()
        self.source_rows = [(1, 100), (3, 50)]
        self.source_calls = 0
        fetch_material = self.scope.http.fetch

        async def fetch(request):
            if request.source_id != "steam_api":
                return await fetch_material(request)
            self.scope.http.requests.append(request)
            if request.path.endswith("GetOwnedGames/v1/"):
                self.source_calls += 1
                payload = {
                    "response": {
                        "game_count": len(self.source_rows),
                        "games": [
                            {
                                "appid": appid,
                                "name": "Synthetic",
                                "playtime_forever": minutes,
                            }
                            for appid, minutes in self.source_rows
                        ],
                    }
                }
            else:
                payload = {"response": {"players": []}}
            return ygl.HttpResponse(
                200, {"Content-Type": "application/json"}, json.dumps(payload).encode()
            )

        self.scope.http.fetch = fetch
        self.scope.jobs = SimpleNamespace(
            submit=self.submit,
            status=self.status,
            result=self.result,
            cancel=lambda job_id, **kw: self.change(job_id, retry=False, **kw),
            retry=lambda job_id, **kw: self.change(job_id, retry=True, **kw),
        )
        self.module = SteamModule(
            SimpleNamespace(
                scopes=SimpleNamespace(bind=AsyncMock(return_value=self.scope)),
                config=SimpleNamespace(
                    current=AsyncMock(
                        return_value=SimpleNamespace(
                            values={},
                            secret_metadata=(
                                SimpleNamespace(
                                    field="credential_steam_key",
                                    state=SecretMetadataState.ACTIVE,
                                    revision=1,
                                ),
                            ),
                        )
                    )
                ),
            )
        )
        await self.module.start()
        self.command = SimpleNamespace(
            origin=ygl.InvocationOrigin.COMMAND,
            parent_id=None,
            actor_id="synthetic-owner",
        )
        self.invocation = SimpleNamespace(origin=ygl.InvocationOrigin.JOB)
        self.handler = JobHandler(self.module, "submit")

    async def asyncTearDown(self):
        await self.module.stop()
        await self.database.executor.close()
        self.temporary.cleanup()

    async def submit(self, request):
        row = await self.repository.submit(
            owner="synthetic-owner",
            module="steam_dlc/steam",
            handler=request.handler_id,
            declaration_digest="synthetic-declaration",
            parameters=request.parameters,
            request_key=request.idempotency_key,
            now=NOW,
            expires_at=EXPIRES,
            max_active=5,
            max_queued=100,
            check=lambda: None,
        )
        return self.view(row)

    async def status(self, job_id):
        return self.view(
            await self.repository.get("synthetic-owner", "steam_dlc/steam", job_id)
        )

    async def result(self, job_id, *, cursor=None, page_size=20):
        row, entries = await self.repository.results(
            "synthetic-owner", "steam_dlc/steam", job_id, int(cursor or 0), page_size
        )
        return JobResultPage(self.view(row), entries[:page_size], None)

    async def change(self, job_id, *, retry, expected_revision):
        return self.view(
            await self.repository.change(
                "synthetic-owner",
                "steam_dlc/steam",
                job_id,
                expected_revision,
                retry=retry,
                now=NOW,
                max_active=5,
                max_queued=100,
                check=lambda: None,
            )
        )

    async def request(self, *, refresh=False, **updates):
        output = await self.handler.invoke(
            self.command,
            {
                "account": "1",
                "source": "full",
                "limit": 20,
                "refresh": refresh,
                **updates,
            },
        )
        self.assertIs(output.status, ygl.ResultStatus.SUCCESS)
        return output.document.ordered_blocks[1].fields["job_result"]["job"]["job_id"]

    async def execute(self, job_id):
        row = await self.repository.get("synthetic-owner", "steam_dlc/steam", job_id)
        row = await self.repository.claim(row, NOW, lambda: None)
        self.assertIsNotNone(row)
        token = row["run_token"]

        async def update(progress, *, checkpoint=None):
            await self.repository.update(
                job_id, token, progress, checkpoint, NOW, lambda: None
            )

        async def publish(document, *, metadata):
            # This fixture asserts document production and persistence; no claim
            # is made about Core rendering/PNG decoder or live Host output.
            await self.repository.publish(
                job_id, token, ({"metadata": metadata},), NOW, lambda: None, 1024 * 1024
            )

        try:
            summary = await SteamWallJob(self.module).run(
                self.invocation,
                json.loads(row["parameters_json"]),
                SimpleNamespace(update=update, publish_document=publish),
            )
        except Exception:
            await self.repository.finish(job_id, token, "failed", {}, "job_failed", NOW)
            raise
        await self.repository.finish(job_id, token, "succeeded", summary, None, NOW)
        return summary

    async def test_real_http_access_denial_and_retry_after_reach_persisted_feedback(
        self,
    ):
        http = frozen_module("infrastructure.http")
        for operation in ("library", "profile"):
            for status in (401, 403, 429):
                with self.subTest(operation=operation, status=status):
                    requests = []

                    async def transport(request):
                        requests.append(request)
                        if operation == "profile" and request.path.endswith(
                            "GetOwnedGames/v1/"
                        ):
                            return ygl.HttpResponse(
                                200,
                                {"Content-Type": "application/json"},
                                b'{"response":{"game_count":0}}',
                            )
                        return ygl.HttpResponse(
                            status, {"Retry-After": "47"}, b"private upstream detail"
                        )

                    # Real frozen HTTP error/public boundary, synthetic policy
                    # and transport; this never obtains credentials or a socket.
                    self.scope.http = http.SourceHttpService(
                        (ygl.SourceDeclaration("steam_api", "api.steampowered.com"),),
                        transport,
                    )
                    job_id = await self.request(refresh=True)
                    with self.assertRaises(ygl.SourceHttpError) as caught:
                        await self.execute(job_id)
                    self.assertEqual(caught.exception.code, "upstream_error")
                    self.assertEqual(caught.exception.status_code, status)
                    job = await self.status(job_id)
                    self.assertEqual(job.status.value, "failed")
                    self.assertEqual(
                        job.progress["reason"],
                        "rate_limited"
                        if status == 429
                        else "steam_source_access_denied",
                    )
                    self.assertEqual(
                        job.progress.get("retry_after"), 47 if status == 429 else None
                    )
                    self.assertNotIn("selected", job.progress)
                    self.assertNotIn("missing_images", job.progress)
                    self.assertEqual(len((await self.result(job_id)).entries), 0)
                    response = await self.handler.command(
                        self.command, self.scope, f"status {job_id}"
                    )
                    text = response.document.ordered_blocks[0].text
                    if status in (401, 403):
                        self.assertIn("可信配置", text)
                        self.assertIn("公开设置", text)
                        self.assertNotIn("Key无效", text)
                    else:
                        self.assertIn("等待47秒", text)
                    self.assertNotIn("private upstream detail", text)
                    self.assertEqual(len(requests), 1 if operation == "library" else 2)

    async def test_partial_missing_cover_survives_later_rate_or_resource_stop(self):
        for reason in ("rate_limited", "resource_budget"):
            with self.subTest(reason=reason):
                self.scope.cache.values.clear()
                self.scope.resources.values.clear()
                self.source_rows = [(index, 1) for index in range(3, 153)]
                fetch = self.scope.http.fetch
                store = self.scope.resources.store

                async def failing_fetch(request):
                    if request.source_id == "steam_store_image":
                        appid = int(request.path.split("/apps/", 1)[1].split("/", 1)[0])
                        if appid == 3:
                            return ygl.HttpResponse(404, {}, b"")
                        if appid >= 131 and reason == "rate_limited":
                            return ygl.HttpResponse(429, {"Retry-After": "53"}, b"")
                    return await fetch(request)

                async def limited_store(media, content, **kwargs):
                    # The first published batch has one placeholder and 127
                    # stored originals; later storage denial is a real SDK port.
                    if (
                        reason == "resource_budget"
                        and len(self.scope.resources.values) >= 127
                    ):
                        raise ygl.ServiceUnavailable()
                    return await store(media, content, **kwargs)

                self.scope.http.fetch = failing_fetch
                self.scope.resources.store = limited_store
                try:
                    job_id = await self.request(refresh=True, limit=150, mode="legacy")
                    error = (
                        QueryFailure
                        if reason == "rate_limited"
                        else ygl.ServiceUnavailable
                    )
                    with self.assertRaises(error):
                        await self.execute(job_id)
                    job = await self.status(job_id)
                    progress = job.progress
                    self.assertEqual(progress["reason"], reason)
                    self.assertEqual(
                        tuple(
                            progress[key]
                            for key in (
                                "selected",
                                "generated",
                                "pending",
                                "missing_images",
                                "batches",
                            )
                        ),
                        (150, 128, 22, 1, 1),
                    )
                    self.assertEqual(progress["result_entries"], 1)
                    self.assertEqual(progress["source_returned"], 150)
                    self.assertEqual(progress["examined"], 150)
                    self.assertEqual(progress["counters"]["list_requests"], 2)
                    if reason == "rate_limited":
                        self.assertEqual(progress["retry_after"], 53)
                    page = await self.result(job_id)
                    self.assertEqual(len(page.entries), 1)
                    self.assertEqual(
                        dict(page.entries[0]["metadata"]),
                        {"batch_index": 0, "start": 0, "end": 128, "item_count": 128},
                    )
                    response = await self.handler.command(
                        self.command, self.scope, f"status {job_id}"
                    )
                    self.assertIn(
                        f"/ygl steam wall result {job_id}",
                        response.document.ordered_blocks[0].text,
                    )
                finally:
                    self.scope.http.fetch = fetch
                    self.scope.resources.store = store

    async def test_metadata_stop_retains_unknown_selection_and_observed_zero_output(
        self,
    ):
        fetch = self.scope.http.fetch

        async def limited_metadata(request):
            if request.source_id == "steam_browse":
                return ygl.HttpResponse(429, {"Retry-After": "37"}, b"")
            return await fetch(request)

        self.scope.http.fetch = limited_metadata
        job_id = await self.request(refresh=True)
        with self.assertRaises(QueryFailure):
            await self.execute(job_id)
        progress = (await self.status(job_id)).progress
        self.assertEqual(progress["reason"], "rate_limited")
        self.assertIsNone(progress["selected"])
        self.assertIsNone(progress["pending"])
        self.assertEqual(progress["generated"], 0)
        self.assertEqual(progress["missing_images"], 0)
        self.assertEqual(progress["batches"], 0)
        self.assertEqual(progress["result_entries"], 0)
        self.assertEqual(progress["examined"], 2)
        self.assertEqual(progress["retry_after"], 37)
        self.assertEqual(len((await self.result(job_id)).entries), 0)

    async def test_optional_profile_temporary_failure_still_allows_verified_library(
        self,
    ):
        http = frozen_module("infrastructure.http")
        for failure in (500, 503, "transport_failed"):
            with self.subTest(failure=failure):

                async def transport(request):
                    if request.path.endswith("GetOwnedGames/v1/"):
                        return ygl.HttpResponse(
                            200,
                            {"Content-Type": "application/json"},
                            b'{"response":{"game_count":0}}',
                        )
                    if isinstance(failure, str):
                        raise ygl.SourceHttpError(failure)
                    return ygl.HttpResponse(failure, {}, b"private upstream detail")

                self.scope.http = http.SourceHttpService(
                    (ygl.SourceDeclaration("steam_api", "api.steampowered.com"),),
                    transport,
                )
                job_id = await self.request(refresh=True)
                summary = await self.execute(job_id)
                self.assertEqual(summary["source_returned"], 0)
                self.assertEqual(summary["generated"], 0)
                self.assertTrue(summary["complete_source"])
                self.assertEqual((await self.status(job_id)).status.value, "succeeded")

    async def test_completed_refreshes_execute_again_and_reuse_valid_originals(self):
        first = await self.request()
        self.assertEqual(await self.request(), first)  # queued equivalent input joins
        initial = await self.execute(first)
        self.assertEqual(initial["generated"], 2)
        original_assets = dict(self.scope.resources.values)
        image_requests = sum(
            r.source_id == "steam_store_image" for r in self.scope.http.requests
        )
        self.assertEqual(image_requests, 2)
        second = await self.request(refresh=True)
        self.assertNotEqual(second, first)
        self.assertEqual(await self.request(refresh=True), second)
        await self.execute(second)
        self.assertEqual(self.source_calls, 2)
        self.assertEqual(
            sum(r.source_id == "steam_store_image" for r in self.scope.http.requests), 2
        )
        self.assertEqual(self.scope.resources.values, original_assets)
        self.source_rows = [(1, 300), (3, 50), (4, 25)]
        third = await self.request(refresh=True)
        self.assertNotIn(third, (first, second))
        changed = await self.execute(third)
        self.assertEqual((self.source_calls, changed["generated"]), (3, 3))
        self.assertEqual(
            sum(r.source_id == "steam_store_image" for r in self.scope.http.requests), 3
        )
        self.assertTrue(original_assets.items() <= self.scope.resources.values.items())
        self.assertEqual((await self.status(first)).status.value, "succeeded")
        self.assertEqual(len((await self.result(first)).entries), 1)

    async def test_old_job_status_result_cancel_and_retry_remain_owned_operations(self):
        job_id = await self.request()
        response = await self.handler.invoke(
            self.command, {"command": f"cancel {job_id}"}
        )
        self.assertIs(response.status, ygl.ResultStatus.SUCCESS)
        self.assertEqual((await self.status(job_id)).status.value, "cancelled")
        response = await self.handler.invoke(
            self.command, {"command": f"retry {job_id}"}
        )
        self.assertIs(response.status, ygl.ResultStatus.SUCCESS)
        self.assertEqual((await self.status(job_id)).status.value, "queued")
        await self.execute(job_id)
        self.assertEqual(len((await self.result(job_id)).entries), 1)
        response = await self.handler.invoke(
            self.command, {"command": f"status {job_id}"}
        )
        self.assertIs(response.status, ygl.ResultStatus.SUCCESS)

    async def test_layout_theme_cold_module_and_missing_original_keep_cache_boundaries(
        self,
    ):
        first = await self.request()
        await self.execute(first)
        originals = dict(self.scope.resources.values)
        config = self.module._services.config.current.return_value
        config.values["reply_theme"] = "deep_indigo"
        changed_layout = await self.request(aspect="1:2", fit="contain")
        self.assertNotEqual(first, changed_layout)
        await self.execute(changed_layout)
        self.assertEqual(self.scope.resources.values, originals)
        self.assertEqual(
            self.source_calls, 1
        )  # valid business cache survives layout changes
        services = self.module._services
        await self.module.stop()
        self.module = SteamModule(services)
        await self.module.start()
        self.handler = JobHandler(self.module, "submit")
        cold = await self.request()
        self.assertNotEqual(cold, first)
        summary = await self.execute(cold)
        self.assertEqual(summary["counters"]["image_requests"], 0)
        self.assertEqual(self.scope.resources.values, originals)
        self.scope.resources.values.pop(next(iter(originals)))
        damaged = await self.request()
        repaired = await self.execute(damaged)
        self.assertEqual(repaired["counters"]["corrupt_or_missing"], 1)
        self.assertEqual(repaired["counters"]["image_requests"], 1)
        self.assertEqual(self.scope.resources.values, originals)

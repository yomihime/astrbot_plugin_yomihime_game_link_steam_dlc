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

        summary = await SteamWallJob(self.module).run(
            self.invocation,
            json.loads(row["parameters_json"]),
            SimpleNamespace(update=update, publish_document=publish),
        )
        await self.repository.finish(job_id, token, "succeeded", summary, None, NOW)
        return summary

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

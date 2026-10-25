"""Steam module behavior with a USER-scoped SDK port; Core proof is tested separately."""

import unittest
from dataclasses import replace
from types import SimpleNamespace

import yomihime_game_link_sdk as ygl

from packages.steam_dlc.steam.module import Factory


class _Collection:
    def __init__(self):
        self.row = None
        self.conflict = False

    async def get(self, key):
        return self.row

    async def create(self, key, value):
        if self.row is not None:
            raise ygl.UniqueConstraintViolation("binding")
        self.row = ygl.VersionedRecord(key, 1, value)
        return self.row

    async def replace(self, key, value, *, expected_revision):
        if self.conflict or self.row.revision != expected_revision:
            raise ygl.RevisionConflict(
                "binding", expected_revision, expected_revision + 1
            )
        self.row = ygl.VersionedRecord(key, self.row.revision + 1, value)
        return self.row


class _Scopes:
    def __init__(self):
        self.collections = {}
        self.calls = 0

    async def bind(self, view):
        self.calls += 1
        # Test fixture simulates Core principal scoping. Product chooses no actor.
        collection = self.collections.setdefault(
            (view.adapter_id, view.actor_id), _Collection()
        )

        async def select(name):
            if name != "binding":
                raise AssertionError(name)
            return collection

        return SimpleNamespace(records=SimpleNamespace(collection=select))


class SteamModuleTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.scopes = _Scopes()
        self.services = SimpleNamespace(scopes=self.scopes)
        self.module = await Factory().create(self.services)
        await self.module.start()
        self.view = ygl.InvocationView(
            "test",
            ygl.InvocationOrigin.COMMAND,
            "alice",
            "dm",
            "steam_dlc/steam",
            1,
            1,
            adapter_id="platform-a",
        )

    async def call(self, action, parameters=None, view=None):
        return (
            await self.module.handlers()
            .capabilities[action]
            .invoke(view or self.view, parameters or {})
        )

    async def test_single_binding_rebind_unbind_revision_and_recreated_module(self):
        first = "76561197960265729"
        self.assertIs(
            (await self.call("bind", {"steam_id": first})).status,
            ygl.ResultStatus.SUCCESS,
        )
        self.assertIs(
            (await self.call("bind", {"steam_id": "76561197960265730"})).status,
            ygl.ResultStatus.SUCCESS,
        )
        identity = await self.call("identity")
        data = identity.document.ordered_blocks[0].fields["identity"]
        self.assertEqual((data["account_id32"], data["binding_revision"]), (2, 2))
        self.assertIsNone(identity.model_facts)
        await self.module.stop()
        self.module = await Factory().create(self.services)
        await self.module.start()
        self.assertIs((await self.call("identity")).status, ygl.ResultStatus.SUCCESS)
        await self.call("unbind")
        self.assertIs((await self.call("identity")).error.code, ygl.ErrorCode.UNBOUND)
        await self.call("bind", {"steam_id": first})
        row = self.scopes.collections[("platform-a", "alice")].row
        self.assertEqual(row.revision, 4)

    async def test_same_group_actor_and_platform_do_not_borrow_binding(self):
        await self.call("bind", {"steam_id": "76561197960265729"})
        for view in (
            replace(self.view, actor_id="bob"),
            replace(self.view, adapter_id="platform-b"),
        ):
            result = await self.call("identity", view=view)
            self.assertIs(result.error.code, ygl.ErrorCode.UNBOUND)

    async def test_tool_and_derived_management_fail_before_records(self):
        for action in ("bind", "unbind", "binding"):
            for view in (
                replace(self.view, origin=ygl.InvocationOrigin.LLM_TOOL),
                replace(self.view, parent_id="parent"),
            ):
                result = await self.call(
                    action, {"steam_id": "76561197960265729"}, view
                )
                self.assertIs(result.status, ygl.ResultStatus.ERROR)
        self.assertEqual(self.scopes.calls, 0)

    async def test_cas_conflict_is_not_success_and_invalid_id_does_not_write(self):
        await self.call("bind", {"steam_id": "76561197960265729"})
        row = self.scopes.collections[("platform-a", "alice")]
        row.conflict = True
        result = await self.call("bind", {"steam_id": "76561197960265730"})
        self.assertIs(result.status, ygl.ResultStatus.ERROR)
        self.assertEqual(row.row.value["steam_id64"], "76561197960265729")
        result = await self.call("bind", {"steam_id": "12345678901234567"})
        self.assertIs(result.error.code, ygl.ErrorCode.PARAMETER_ERROR)
        self.assertEqual(row.row.revision, 1)

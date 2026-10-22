"""Synthetic binding input tests; USER scoping itself remains an SDK contract."""

import json
import unittest
from dataclasses import replace
from types import SimpleNamespace

import yomihime_game_link_sdk as ygl
from test_steam_module import _Collection, _Scopes

from packages.steam_dlc.shared.steam_ids import (
    account_id32,
    parse_steam_binding_target,
    parse_steam_id,
)
from packages.steam_dlc.steam.module import Factory

_INVALID_TARGETS = (
    "0",
    "-1",
    "+1",
    "4294967296",
    "01",
    "0000000123",
    "１２３",
    "١٢٣",
    "1e2",
    "123.0",
    "123x",
    "https://evil.example/profiles/76561197960265851",
    "https://steamcommunity.com/profiles/123",
    "https://steamcommunity.com/profiles/4294967295",
    "https://steamcommunity.com/id/123",
    "http://steamcommunity.com/profiles/76561197960265851",
    "https://steamcommunity.com/profiles/76561197960265851?x=1",
    "https://steamcommunity.com/profiles/76561197960265851#x",
)


class BindingTargetTests(unittest.TestCase):
    def test_id32_boundaries_and_legacy_inputs_return_steam64_strings(self):
        for source, expected in (
            ("1", "76561197960265729"),
            ("123", "76561197960265851"),
            ("123456789", "76561198083722517"),
            ("1234567890", "76561199194833618"),
            ("4294967295", "76561202255233023"),
            ("76561197960265851", "76561197960265851"),
            (
                "https://steamcommunity.com/profiles/76561197960265851",
                "76561197960265851",
            ),
        ):
            with self.subTest(source=source):
                actual = parse_steam_binding_target(source)
                self.assertIsInstance(actual, str)
                self.assertEqual(actual, expected)
                self.assertEqual(json.loads(json.dumps(actual)), expected)

    def test_rejects_noncanonical_and_nontext_targets_without_trimming(self):
        for value in (*_INVALID_TARGETS, " 123", "123 ", None, True, 123, 123.0):
            with self.subTest(value=value), self.assertRaises(ValueError):
                parse_steam_binding_target(value)  # type: ignore[arg-type]

    def test_internal_steam_id_parser_remains_strict(self):
        for value in ("1", "123456789", "1234567890", "4294967295"):
            with self.subTest(value=value), self.assertRaises(ValueError):
                parse_steam_id(value)
        self.assertEqual(account_id32(parse_steam_binding_target("123")), 123)


class _RecordingCollection(_Collection):
    def __init__(self):
        super().__init__()
        self.writes = []

    async def create(self, key, value):
        self.writes.append(("create", key, dict(value), None))
        return await super().create(key, value)

    async def replace(self, key, value, *, expected_revision):
        self.writes.append(("replace", key, dict(value), expected_revision))
        return await super().replace(key, value, expected_revision=expected_revision)


class SteamBindingTargetTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.collection = _RecordingCollection()
        self.scopes = _Scopes()
        self.scopes.collections[("platform-a", "alice")] = self.collection
        self.module = await Factory().create(SimpleNamespace(scopes=self.scopes))
        await self.module.start()
        self.view = ygl.InvocationView(
            "binding-target-test",
            ygl.InvocationOrigin.COMMAND,
            "alice",
            "private-a",
            "steam_dlc/steam",
            1,
            1,
            adapter_id="platform-a",
        )

    async def call(self, action, value=None, *, view=None):
        parameters = {"steam_id": value} if action == "bind" else {}
        return (
            await self.module.handlers()
            .capabilities[action]
            .invoke(view or self.view, parameters)
        )

    def assert_private(self, result):
        self.assertIs(result.privacy, ygl.Privacy.PRIVATE)
        self.assertIsNone(result.model_facts)
        if result.document is not None:
            self.assertIs(result.document.privacy, ygl.Privacy.PRIVATE)

    async def test_id32_binding_stores_only_canonical_id_and_shows_both_privately(self):
        result = await self.call("bind", " \t123\n")
        self.assertIs(result.status, ygl.ResultStatus.SUCCESS)
        self.assert_private(result)
        self.assertEqual(
            self.collection.writes,
            [
                (
                    "create",
                    "default",
                    {
                        "steam_id64": "76561197960265851",
                        "association": "self_asserted",
                    },
                    None,
                )
            ],
        )
        shown = "\n".join(block.text for block in result.document.ordered_blocks)
        self.assertIn("SteamID64：76561197960265851", shown)
        self.assertIn("Dota ID32：123", shown)
        for action in ("binding", "identity"):
            result = await self.call(action)
            self.assert_private(result)
        identity = result.document.ordered_blocks[0].fields["identity"]
        self.assertEqual(
            dict(identity),
            {
                "steam_id64": "76561197960265851",
                "account_id32": 123,
                "binding_revision": 1,
                "association": "self_asserted",
            },
        )

    async def test_invalid_inputs_never_create_replace_or_advance_revision(self):
        for state in ("empty", "bound", "tombstone"):
            if state == "bound":
                await self.call("bind", "123")
            elif state == "tombstone":
                await self.call("unbind")
            before = self.collection.row
            writes = list(self.collection.writes)
            for value in (*_INVALID_TARGETS, None, True, 123, 123.0):
                with self.subTest(state=state, value=value):
                    result = await self.call("bind", value)
                    self.assertIs(result.error.code, ygl.ErrorCode.PARAMETER_ERROR)
                    self.assert_private(result)
                    self.assertIs(self.collection.row, before)
                    self.assertEqual(self.collection.writes, writes)
                    self.assertIn("ID32", result.error.message)

    async def test_equivalent_inputs_replace_with_cas_and_tombstone_rebind(self):
        for revision, value in enumerate(
            (
                "123",
                "76561197960265851",
                "https://steamcommunity.com/profiles/76561197960265851",
            ),
            start=1,
        ):
            result = await self.call("bind", value)
            self.assertIs(result.status, ygl.ResultStatus.SUCCESS)
            self.assert_private(result)
            self.assertEqual(self.collection.row.revision, revision)
            self.assertEqual(
                self.collection.row.value["steam_id64"], "76561197960265851"
            )
        self.assertEqual([row[3] for row in self.collection.writes], [None, 1, 2])
        self.assertEqual([row[1] for row in self.collection.writes], ["default"] * 3)
        self.assert_private(await self.call("unbind"))
        self.assertEqual(self.collection.row.revision, 4)
        self.assertIsNone(self.collection.row.value["steam_id64"])
        self.assertIs((await self.call("identity")).error.code, ygl.ErrorCode.UNBOUND)
        await self.call("bind", "123")
        self.assertEqual(self.collection.row.revision, 5)
        self.assertEqual(self.collection.writes[-1][3], 4)
        before = self.collection.row
        self.collection.conflict = True
        conflict = await self.call("bind", "123")
        self.assertIs(conflict.status, ygl.ResultStatus.ERROR)
        self.assert_private(conflict)
        self.assertIs(self.collection.row, before)
        self.assertEqual(self.collection.writes[-1][3], 5)

    async def test_owner_is_scoped_actor_and_dependency_identity_stays_private(self):
        await self.call("bind", "123")
        for view in (
            replace(self.view, actor_id="bob"),
            replace(self.view, adapter_id="platform-b"),
        ):
            result = await self.call("identity", view=view)
            self.assertIs(result.error.code, ygl.ErrorCode.UNBOUND)
            self.assert_private(result)
        dependency = await self.call(
            "identity", view=replace(self.view, parent_id="dota-parent")
        )
        self.assertIs(dependency.status, ygl.ResultStatus.SUCCESS)
        self.assert_private(dependency)
        self.assertEqual(
            dependency.document.ordered_blocks[0].fields["identity"]["account_id32"],
            123,
        )
        self.assertEqual(self.collection.row.revision, 1)

    async def test_invalid_origins_and_derived_management_fail_before_records(self):
        for action in ("bind", "binding", "unbind", "identity"):
            views = [
                replace(self.view, origin=ygl.InvocationOrigin.LLM_TOOL),
                replace(self.view, actor_id=None),
            ]
            if action != "identity":
                views.append(replace(self.view, parent_id="dota-parent"))
            for view in views:
                with self.subTest(action=action, view=view):
                    result = await self.call(action, "123", view=view)
                    self.assertIs(result.error.code, ygl.ErrorCode.UNSUPPORTED)
                    self.assert_private(result)
        self.assertEqual(self.scopes.calls, 0)
        self.assertEqual(self.collection.writes, [])

    async def test_stored_short_identity_is_rejected_instead_of_reinterpreted(self):
        self.collection.row = ygl.VersionedRecord(
            "default", 9, {"steam_id64": "123", "association": "self_asserted"}
        )
        for action in ("identity", "binding"):
            result = await self.call(action)
            self.assertIs(result.error.code, ygl.ErrorCode.PARAMETER_ERROR)
            self.assert_private(result)
        self.assertEqual(self.collection.row.revision, 9)
        self.assertEqual(self.collection.writes, [])


if __name__ == "__main__":
    unittest.main()

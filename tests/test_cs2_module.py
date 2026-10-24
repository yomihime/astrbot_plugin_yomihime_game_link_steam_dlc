"""SDK-bound query acceptance; credential injection itself is owned by Core."""

import json
import unittest
from types import SimpleNamespace

import yomihime_game_link_sdk as ygl
from yomihime_game_link_sdk.contexts import InvocationOrigin, InvocationView
from yomihime_game_link_sdk.services import ConfigSnapshot, HttpResponse
from yomihime_game_link_sdk.storage import SecretMetadata, SecretMetadataState

from packages.steam_dlc.cs2.module import DATA_CAPABILITIES, Factory

PLAYER = "76561197960265851"
OTHER = "76561197960265852"


def invocation(capability="profile", origin=InvocationOrigin.COMMAND, **kwargs):
    return InvocationView(
        invocation_id="test-cs2",
        origin=origin,
        actor_id=kwargs.pop("actor_id", "actor"),
        conversation_id="direct",
        module_id="steam_dlc/cs2",
        module_epoch=1,
        registry_revision=1,
        capability_id=capability,
        **kwargs,
    )


def identity_result(player=PLAYER):
    return ygl.CapabilityResult(
        "identity",
        ygl.ResultStatus.SUCCESS,
        document=ygl.DisplayDocument(
            "Steam identity",
            "Steam",
            (
                ygl.FieldsBlock(
                    {
                        "identity": {
                            "steam_id64": player,
                            "account_id32": 123,
                            "binding_revision": 7,
                            "association": "self_asserted",
                        }
                    }
                ),
            ),
            privacy=ygl.Privacy.PRIVATE,
        ),
        privacy=ygl.Privacy.PRIVATE,
    )


class ModuleTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.requests, self.dependencies = [], []
        self.configured = True
        self.identity = identity_result()
        self.profile_player = PLAYER
        self.error = None

        async def fetch(request):
            self.requests.append(request)
            if self.error is not None:
                raise self.error
            body = {
                "statusCode": 0,
                "data": {
                    "steamId": self.profile_player,
                    "name": "Synthetic Player",
                    "seasonId": "S16",
                    "pvpRank": 4,
                    "pvpScore": 1200,
                    "cnt": 0,
                    "rating": 1.1,
                },
            }
            return HttpResponse(200, {}, json.dumps(body).encode())

        async def dependency(context, reference, parameters):
            self.dependencies.append((context, reference, parameters))
            return self.identity

        async def bind(context):
            return SimpleNamespace(
                http=SimpleNamespace(fetch=fetch),
                dependencies=SimpleNamespace(invoke=dependency),
            )

        async def config():
            metadata = (
                (
                    SecretMetadata(
                        "credential_perfect", None, 1, SecretMetadataState.ACTIVE
                    ),
                )
                if self.configured
                else ()
            )
            return ConfigSnapshot(1, {"default_platform": "perfect"}, metadata)

        self.module = await Factory().create(
            SimpleNamespace(
                scopes=SimpleNamespace(bind=bind),
                config=SimpleNamespace(current=config),
            )
        )
        await self.module.start()

    async def invoke(
        self,
        params,
        *,
        capability="profile",
        origin=InvocationOrigin.COMMAND,
        **context,
    ):
        handler = self.module.handlers().capabilities[capability]
        return await handler.invoke(invocation(capability, origin, **context), params)

    async def test_shared_steam_default_is_private_and_does_not_become_model_default(
        self,
    ):
        result = await self.invoke({"command": ""})
        self.assertEqual(result.status, ygl.ResultStatus.SUCCESS)
        self.assertEqual(result.privacy, ygl.Privacy.PRIVATE)
        self.assertIsNone(result.model_facts)
        self.assertEqual(len(self.dependencies), 1)
        self.assertEqual(self.dependencies[0][1].module_id, "steam_dlc/steam")
        self.assertEqual(json.loads(self.requests[0].body)["toSteamId"], PLAYER)

    async def test_explicit_command_origin_dependency_keeps_structured_target(self):
        result = await self.invoke(
            {"account": PLAYER, "platform": "perfect"},
            capability="profile_explicit",
            parent_id="parent",
        )
        self.assertEqual(result.status, ygl.ResultStatus.SUCCESS)
        self.assertEqual(len(self.dependencies), 0)
        self.assertEqual(result.model_facts.facts["target"]["id"], PLAYER)

    async def test_model_and_nested_calls_never_infer_private_default(self):
        for origin, capability, kwargs in (
            (InvocationOrigin.LLM_TOOL, "profile_explicit", {}),
            (InvocationOrigin.WEB_PUBLIC, "profile_explicit", {}),
            (InvocationOrigin.COMMAND, "profile", {"parent_id": "parent"}),
            (InvocationOrigin.COMMAND, "profile_explicit", {}),
        ):
            with self.subTest(origin=origin, capability=capability):
                result = await self.invoke(
                    {}, capability=capability, origin=origin, **kwargs
                )
                self.assertEqual(result.error.code, ygl.ErrorCode.PARAMETER_ERROR)
        self.assertFalse(self.dependencies)
        self.assertFalse(self.requests)

    async def test_authorization_subject_does_not_replace_target_and_missing_credentials_help(
        self,
    ):
        self.configured = False
        result = await self.invoke(
            {"account": PLAYER},
            capability="profile_explicit",
            origin=InvocationOrigin.LLM_TOOL,
        )
        self.assertEqual(result.error.code, ygl.ErrorCode.AUTH_REQUIRED)
        self.assertIn("可信管理页", result.error.message)
        self.assertFalse(self.requests)
        self.assertFalse(self.dependencies)

    async def test_source_identity_mismatch_fails_without_raw_body(self):
        self.profile_player = OTHER
        result = await self.invoke({"account": PLAYER})
        self.assertEqual(result.error.code, ygl.ErrorCode.UNPARSED)
        self.assertNotIn(OTHER, result.error.message)

    async def test_fivee_no_implicit_conversion_and_old_uuid_rejected(self):
        result = await self.invoke({"command": "--platform 5e"})
        self.assertEqual(result.error.code, ygl.ErrorCode.PARAMETER_ERROR)
        self.assertIn("domain", result.error.message)
        result = await self.invoke(
            {"match_id": "00000000-0000-4000-8000-000000000001"},
            capability="match_explicit",
        )
        self.assertEqual(result.error.code, ygl.ErrorCode.PARAMETER_ERROR)
        self.assertFalse(self.dependencies)
        self.assertFalse(self.requests)

    async def test_status_is_actionable_and_retired_gate_is_absent(self):
        result = await self.invoke(
            {}, capability="status", origin=InvocationOrigin.WEB_PUBLIC
        )
        self.assertEqual(result.status, ygl.ResultStatus.SUCCESS)
        self.assertEqual(result.model_facts.facts["default_platform"], "perfect")
        self.assertEqual(
            [item["platform"] for item in result.model_facts.facts["sources"]],
            ["perfect", "official", "5e"],
        )
        self.assertNotIn("Leetify", repr(result))
        self.assertNotIn("private-final-token", repr(result))

    async def test_unbound_or_malformed_steam_identity_never_queries(self):
        self.identity = ygl.CapabilityResult(
            "identity",
            ygl.ResultStatus.ERROR,
            error=ygl.ErrorDetail(ygl.ErrorCode.UNBOUND, "unbound"),
        )
        result = await self.invoke({})
        self.assertEqual(result.error.code, ygl.ErrorCode.UNBOUND)
        self.identity = identity_result(
            OTHER
        )  # account_id32 still 123: mismatched proof.
        result = await self.invoke({})
        self.assertEqual(result.error.code, ygl.ErrorCode.MODULE_UNAVAILABLE)
        self.assertFalse(self.requests)

    async def test_stop_and_invalid_parameters_fail_before_http(self):
        for params in (
            {"command": "--limit 0"},
            {"command": "--platform perfect --platform official"},
            {"command": "--unknown x"},
            {"token": "not-accepted"},
        ):
            result = await self.invoke(params)
            self.assertEqual(result.error.code, ygl.ErrorCode.PARAMETER_ERROR)
        await self.module.stop()
        result = await self.invoke({"account": PLAYER})
        self.assertEqual(result.error.code, ygl.ErrorCode.MODULE_UNAVAILABLE)
        health = await self.module.check_health()
        for capability in DATA_CAPABILITIES:
            self.assertEqual(
                health.capabilities[capability].status, ygl.HealthStatus.UNAVAILABLE
            )

    async def test_public_query_without_actor_uses_explicit_account_and_empty_query_is_status(
        self,
    ):
        status = await self.invoke(
            {}, capability="query", origin=InvocationOrigin.WEB_PUBLIC, actor_id=None
        )
        self.assertEqual(status.status, ygl.ResultStatus.SUCCESS)
        self.assertFalse(self.requests)
        missing = await self.invoke(
            {"action": "profile"},
            capability="query",
            origin=InvocationOrigin.WEB_PUBLIC,
            actor_id=None,
        )
        self.assertEqual(missing.error.code, ygl.ErrorCode.PARAMETER_ERROR)
        result = await self.invoke(
            {"action": "profile", "account": PLAYER, "platform": "perfect"},
            capability="query",
            origin=InvocationOrigin.WEB_PUBLIC,
            actor_id=None,
        )
        self.assertEqual(result.status, ygl.ResultStatus.SUCCESS)
        self.assertEqual(result.privacy, ygl.Privacy.PUBLIC)
        self.assertFalse(self.dependencies)

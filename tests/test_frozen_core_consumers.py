"""DLC consumers against the actual frozen Core; all upstream data is synthetic."""

import importlib.util
import json
import os
import sys
import time
import unittest
from dataclasses import replace
from pathlib import Path
from types import SimpleNamespace

import yomihime_game_link_sdk as ygl
from test_cs2_facts import projections
from test_cs2_provider import GAME, OTHER, PLAYER, Http, full_match, profile, summary

from packages.steam_dlc.cs2.module import Factory, _result

ROOT = Path(__file__).resolve().parents[1]
CORE = Path(os.environ.get("YGL_CORE_ROOT", ROOT / "worktrees/game-link-dlc-support"))
if not CORE.is_absolute():
    CORE = ROOT / CORE
if not CORE.is_dir() and (ROOT / ".ci-core").is_dir():
    CORE = ROOT / ".ci-core"
AVAILABLE = (CORE / "core/invocation.py").is_file()

if AVAILABLE:
    # Import the installed canonical SDK first. Core is loaded in its own test
    # namespace, without changing sys.path or replacing any SDK modules/types.
    if "ygl_test_subject" not in sys.modules:
        spec = importlib.util.spec_from_file_location(
            "ygl_test_subject",
            CORE / "__init__.py",
            submodule_search_locations=[str(CORE)],
        )
        assert spec is not None and spec.loader is not None
        package = importlib.util.module_from_spec(spec)
        sys.modules[spec.name] = package
        spec.loader.exec_module(package)
    from ygl_test_subject.adapters.astrbot.web_public import (
        HostPublicWebValidator,
        WebPublicRejected,
        project_result,
    )
    from ygl_test_subject.core.context_issuer import ContextIssuer
    from ygl_test_subject.core.invocation import Gateway
    from ygl_test_subject.core.lifecycle import LifecycleController
    from ygl_test_subject.core.registry import Registry
    from ygl_test_subject.extensions.disk_manifest import parse_manifest
    from ygl_test_subject.services.external_packages import ExternalPackageHost


@unittest.skipUnless(AVAILABLE, "frozen Core source required (YGL_CORE_ROOT)")
class FrozenCoreCS2Consumers(unittest.IsolatedAsyncioTestCase):
    def test_all_existing_projection_shapes_cross_real_receiving_boundary(self):
        seen = set()
        for projection in projections():
            seen.add((projection["platform"], projection["kind"]))
            with self.subTest(platform=projection["platform"], kind=projection["kind"]):
                result = _result("Synthetic", projection, ())
                checked = Gateway._valid_result(
                    result, expected_privacy=ygl.Privacy.PUBLIC
                )
                if (
                    projection["kind"] == "match"
                    and len(projection["data"].get("players") or ()) == 64
                ):
                    # Gateway accepts bounded facts, while the page facade
                    # independently rejects this deliberately maximal display.
                    with self.assertRaises(WebPublicRejected):
                        project_result(checked)
                    continue
                serialized = json.loads(
                    json.dumps(project_result(checked), allow_nan=False)
                )
                self.assertEqual(serialized["status"], "success")
                self.assertIsNotNone(serialized["model_facts"])
        self.assertGreaterEqual(len(seen), 8)

    async def test_real_normalizers_handler_gateway_and_serialized_page_result(self):
        floats = {"rating": 1.2, "pwRating": 0.0, "adr": 88.5, "adpr": 88.5}
        http = Http(
            {
                "/api/csgo/home/pvp/detailStats": {**profile(), **floats},
                "/api/csgo/home/match/list": {
                    "dataPublic": True,
                    "matchList": [{**summary(), **floats}],
                },
                "/api/v1/csgo/match": {
                    **full_match(),
                    "players": [
                        {**full_match()["players"][0], **floats},
                        {
                            "playerId": OTHER,
                            "nickName": "Synthetic missing metrics",
                            "kill": 0,
                            "rating": "1.2bad",
                            "pwRating": True,
                            "adpr": " ",
                        },
                    ],
                },
            }
        )

        async def bind(context):
            self.assertIs(context.origin, ygl.InvocationOrigin.WEB_PUBLIC)
            self.assertIsNone(context.actor_id)
            return SimpleNamespace(http=http)

        async def config():
            return ygl.ConfigSnapshot(
                1,
                {"default_platform": "perfect"},
                (
                    ygl.SecretMetadata(
                        "credential_perfect", None, 1, ygl.SecretMetadataState.ACTIVE
                    ),
                ),
            )

        module = await Factory().create(
            SimpleNamespace(
                scopes=SimpleNamespace(bind=bind),
                config=SimpleNamespace(current=config),
            )
        )
        manifest = parse_manifest(
            (ROOT / "packages/steam_dlc/yomihime.manifest.json").read_bytes()
        )
        lease = SimpleNamespace(
            _complete=True,
            active=True,
            _candidate=SimpleNamespace(package=SimpleNamespace(manifest=manifest)),
        )
        bindings = ExternalPackageHost.public_web_page_bindings(
            SimpleNamespace(_packages={"steam_dlc": lease})
        )
        endpoint, binding = next(
            (key, value)
            for key, value in bindings.items()
            if key[0] == "steam_dlc/cs2" and key[2] == "query"
        )
        marker = object()
        validator = HostPublicWebValidator(
            1, lambda value, generation: value is marker and generation == 1
        )
        validator.replace_external_bindings(
            {endpoint: (binding.target, binding, binding.current)}
        )
        validator.attach(marker)
        issuer = ContextIssuer(
            public_web_validator=validator,
            public_web_capabilities=frozenset((binding.target,)),
        )
        registry = Registry()
        lifecycle = LifecycleController(registry, issuer=issuer)
        cs2 = next(item for item in manifest.modules if item.module_id == "cs2")
        cs2_manifest = replace(manifest, modules=(cs2,), module_order=("cs2",))
        registry.register_package(cs2_manifest, {"cs2": module.handlers()})
        owner = "steam_dlc/cs2"
        dormant = registry.snapshot().module(owner)
        captured = lifecycle.adopt_candidate(
            "steam_dlc", dormant.manifest, "consumer-install", module
        )
        lifecycle.install_dormant(
            "steam_dlc", owner, "consumer-install", module, captured
        )
        identity, _ = await lifecycle.start_candidate(owner, "consumer-start")
        lifecycle.publish_committed_intent(
            owner, "consumer-start", identity, True, registry.snapshot().revision
        )
        gateway = Gateway(
            registry, issuer, admission=lifecycle.admission, lifecycle=lifecycle
        )
        fixtures = []
        try:
            for action in ("profile", "stats", "recent", "last", "match"):
                with self.subTest(action=action):
                    parameters = {
                        "action": action,
                        "account": PLAYER,
                        "platform": "perfect",
                    }
                    if action == "match":
                        parameters.update(match_id=GAME, focus=PLAYER)
                    ticket = validator.begin(
                        endpoint, "synthetic-consumer-bearer", int(time.time()) + 30
                    )
                    proof = validator.mint(ticket)
                    try:
                        result = await gateway.invoke_public_web(
                            proof, owner, "query", parameters
                        )
                    finally:
                        validator.revoke(ticket)
                    self.assertIs(result.status, ygl.ResultStatus.SUCCESS)
                    response = json.loads(
                        json.dumps(project_result(result), allow_nan=False)
                    )
                    display = next(
                        block["fields"]["cs2"]
                        for block in response["document"]["blocks"]
                        if block["kind"] == "fields"
                    )
                    if action in ("profile", "stats"):
                        metric = display["data"]["metrics"]
                    elif action == "recent":
                        metric = display["data"]["matches"][0]
                    elif action in ("last", "match") and display["data"].get("players"):
                        metric = display["data"]["players"][0]
                    else:
                        metric = display["data"]
                    self.assertEqual(metric["rating"], "1.2")
                    self.assertEqual(metric["pw_rating"], "0.0")
                    if action in ("last", "match"):
                        invalid = display["data"]["players"][1]
                        for field in ("rating", "pw_rating", "adr"):
                            self.assertIsNone(invalid[field])
                    if action in ("profile", "stats", "match"):
                        self.assertEqual(metric["adr"], "88.5")
                    fixtures.append(
                        {"name": action, "action": action, "response": response}
                    )
        finally:
            gateway.fence_public_web()
            self.assertTrue(await gateway.drain_public_web(5))
            await lifecycle.stop(owner)
            validator.close()
        fixture_path = os.environ.get("CS2_GATEWAY_FIXTURE")
        if fixture_path:
            path = Path(fixture_path)
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(
                json.dumps(fixtures, ensure_ascii=False, indent=2), encoding="utf-8"
            )


if __name__ == "__main__":
    unittest.main()

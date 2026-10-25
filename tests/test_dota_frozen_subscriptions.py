"""Offline Dota replay through frozen Core operations and SQLite repositories.

Only synthetic subscriptions in a temporary database; no HTTP/model/message port.
Core's explicit test gate initializer is reused; this file issues no private SQL.
"""

import importlib.util
import sys
import tempfile
import unittest
from datetime import UTC, datetime, timedelta
from pathlib import Path
from types import SimpleNamespace

from test_dota_frozen_analysis import CORE_ROOT
from yomihime_game_link_sdk.contexts import InvocationOrigin
from yomihime_game_link_sdk.declarations import (
    CapabilityDescriptor,
    CapabilityEffect,
    CommandDescriptor,
    ConfigField,
    InvocationPolicy,
    ModuleCategory,
    ModuleManifest,
    PackageManifest,
    SourceDeclaration,
)
from yomihime_game_link_sdk.services import (
    CapabilityHealth,
    HealthReport,
    HealthStatus,
    ModuleHandlers,
)
from yomihime_game_link_sdk.storage import OwnershipKind
from yomihime_game_link_sdk.subscriptions import (
    ConversationKind,
    ConversationRef,
    Observation,
    ObservationCompleteness,
    ScheduleDescriptor,
    ScheduleTrigger,
    SubscriptionDescriptor,
    SubscriptionRequest,
)

from packages.steam_dlc.dota2.subscriptions import (
    COLLECTOR_ID,
    COMPOSER_ID,
    TYPE_ID,
    DotaMatchCollector,
    DotaMatchComposer,
    DotaMatchEvaluator,
    DotaMatchProjector,
)

if "ygl_test_subject" not in sys.modules:
    spec = importlib.util.spec_from_file_location(
        "ygl_test_subject",
        CORE_ROOT / "__init__.py",
        submodule_search_locations=[str(CORE_ROOT)],
    )
    assert spec is not None and spec.loader is not None
    core = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = core
    spec.loader.exec_module(core)

fixture_spec = importlib.util.spec_from_file_location(
    "dlc_dota_gate_fixture", CORE_ROOT / "tests/fixtures/b04_runtime.py"
)
assert fixture_spec is not None and fixture_spec.loader is not None
FIXTURE = importlib.util.module_from_spec(fixture_spec)
sys.modules[fixture_spec.name] = FIXTURE
fixture_spec.loader.exec_module(FIXTURE)

from ygl_test_subject.core.context_issuer import ContextIssuer  # noqa: E402
from ygl_test_subject.core.contracts.validation_boundary import (  # noqa: E402
    validate_contract,
)
from ygl_test_subject.core.lifecycle import LifecycleController  # noqa: E402
from ygl_test_subject.core.ports import CollectionRunRequest  # noqa: E402
from ygl_test_subject.core.registry import Registry  # noqa: E402
from ygl_test_subject.infrastructure.sqlite.database import SQLiteDatabase  # noqa: E402
from ygl_test_subject.infrastructure.sqlite.repositories_subscriptions import (  # noqa: E402
    SQLiteDeliveryRepository,
    SQLiteDigestWindowRepository,
    SQLiteSchedulerRepository,
    SQLiteSubscriptionJobRepository,
    SQLiteSubscriptionLifecycleRepository,
    SQLiteSubscriptionStore,
)
from ygl_test_subject.services.subscriptions import (  # noqa: E402
    SubscriptionOperationsService,
)

MODULE = "steam_dlc/dota2"


class Instance:
    def __init__(self, handlers):
        self._handlers = handlers

    def handlers(self):
        return self._handlers

    async def start(self):
        pass

    async def stop(self):
        pass

    async def check_health(self):
        return HealthReport({"manage": CapabilityHealth(HealthStatus.AVAILABLE)})


class FrozenDotaSubscriptionTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.now = datetime.now(UTC)
        self.db = SQLiteDatabase(Path(self.temp.name) / "synthetic.sqlite3")
        self.db.initialize()
        self.bindings = FIXTURE.synthetic_subscription_gate_bindings((MODULE,))
        await FIXTURE.initialize_subscription_gate_fixture(
            self.db, self.bindings, self.now
        )
        self.registry, self.issuer = Registry(), ContextIssuer()
        account_schema = {
            "type": "object",
            "properties": {"account_id32": {"type": "integer", "minimum": 1}},
            "required": ["account_id32"],
            "additionalProperties": False,
        }
        manifest = ModuleManifest(
            "dota2",
            "dota2",
            ModuleCategory.GAME,
            "offline:Instance",
            "1.0.0",
            (
                CapabilityDescriptor(
                    "manage",
                    {"type": "object"},
                    InvocationPolicy.COMMAND_ONLY,
                    CapabilityEffect.READ_ONLY,
                ),
            ),
            commands=(CommandDescriptor("watch", "manage", {}, "Synthetic replay"),),
            schedules=(
                ScheduleDescriptor(
                    COLLECTOR_ID,
                    1,
                    "opendota",
                    1,
                    account_schema,
                    OwnershipKind.PUBLIC,
                    ScheduleTrigger.PERIODIC,
                    30,
                    30,
                    "interval",
                ),
            ),
            subscriptions=(
                SubscriptionDescriptor(
                    TYPE_ID, COLLECTOR_ID, TYPE_ID, account_schema, ("instant",)
                ),
            ),
            sources=(
                SourceDeclaration(
                    "opendota", "api.opendota.com", requests_per_minute=60
                ),
            ),
            config_fields=(ConfigField("interval", default=30),),
        )
        handlers = ModuleHandlers(
            {"manage": SimpleNamespace(invoke=self.unused)},
            {COLLECTOR_ID: DotaMatchCollector(None)},
            {TYPE_ID: DotaMatchEvaluator()},
            event_composers={COMPOSER_ID: DotaMatchComposer()},
            event_projectors={COMPOSER_ID: DotaMatchProjector()},
        )
        self.registry.register_package(
            validate_contract(
                PackageManifest(
                    "steam_dlc", "1.0.0", "2.0", (manifest,), "tests", "MIT", "offline"
                )
            ),
            {"dota2": validate_contract(handlers)},
        )
        self.lifecycle = LifecycleController(self.registry, issuer=self.issuer)
        instance = Instance(handlers)
        owned = self.lifecycle.adopt_candidate(
            "steam_dlc", manifest, "install", instance
        )
        self.lifecycle.install_dormant("steam_dlc", MODULE, "install", instance, owned)
        identity, _ = await self.lifecycle.start_candidate(MODULE, "start")
        self.lifecycle.publish_committed_intent(
            MODULE, "start", identity, True, self.registry.snapshot().revision
        )
        await self.repositories()

    async def unused(self, *args):
        raise AssertionError(
            "Replay must not invoke Host/source/model/message adapters"
        )

    async def repositories(self):
        self.store = SQLiteSubscriptionStore(self.db)
        self.jobs = SQLiteSubscriptionJobRepository(self.db)
        self.scheduler = SQLiteSchedulerRepository(
            self.db,
            utc_clock=lambda: self.now,
            subscription_gate_bindings=self.bindings,
        )
        self.windows = SQLiteDigestWindowRepository(
            self.db, subscription_gate_bindings=self.bindings
        )
        self.delivery = SQLiteDeliveryRepository(
            self.db, subscription_gate_bindings=self.bindings
        )

        async def resolve(view):
            return ConversationRef(
                view.adapter_id,
                ConversationKind.GROUP,
                view.conversation_id,
                "route-" + view.conversation_id,
            )

        async def principal(view):
            return view.actor_id

        self.service = SubscriptionOperationsService(
            issuer=self.issuer,
            admission=self.lifecycle.admission,
            registry=self.registry,
            resolver=SimpleNamespace(resolve=resolve),
            cadence=SimpleNamespace(resolve=lambda *args: (30, 1)),
            subscriptions=self.store,
            lifecycle=SQLiteSubscriptionLifecycleRepository(
                self.db, subscription_gate_bindings=self.bindings
            ),
            jobs=self.jobs,
            scheduler=self.scheduler,
            digest_windows=self.windows,
            grants=SimpleNamespace(current=self.unused),
            principal_resolver=SimpleNamespace(principal_id=principal),
            now=lambda: self.now,
            max_subscriptions_per_owner=8,
        )

    async def asyncTearDown(self):
        await self.db.executor.close()
        self.temp.cleanup()

    def invocation(self, actor, group):
        module = self.registry.snapshot().module(MODULE)
        view = self.issuer.issue(
            origin=InvocationOrigin.COMMAND,
            module_id=MODULE,
            module_epoch=module.epoch,
            registry_revision=self.registry.snapshot().revision,
            actor_id=actor,
            conversation_id=group,
            adapter_id="offline-adapter",
            capability_id="manage",
        )
        self.lifecycle.admission.admit(view, "manage")
        return view

    async def create(self, actor, group, account):
        return await self.service.create_request(
            self.invocation(actor, group),
            SubscriptionRequest(
                TYPE_ID, {"account_id32": account}, {"account_id32": account}, "instant"
            ),
        )

    async def observation(self, view, *, mid=None, account=123):
        record = await self.store.current(view.subscription_id)
        facts = {}
        if mid:
            players = [
                {
                    "account_id32": value,
                    "player_slot": slot,
                    "hero_id": 1,
                    "name": f"Synthetic {value}",
                    "outcome": outcome,
                    "kills": 0,
                    "deaths": 0,
                    "assists": 0,
                }
                for value, slot, outcome in ((123, 0, "win"), (456, 128, "loss"))
            ]
            facts[mid] = {
                **next(row for row in players if row["account_id32"] == account),
                "match_id": mid,
                "start_time": int(self.now.timestamp()) - 1800,
                "duration": 1800,
                "ended_at": int(self.now.timestamp()),
                "settlement": {
                    "match_id": mid,
                    "start_time": int(self.now.timestamp()) - 1800,
                    "duration": 1800,
                    "players": players,
                },
            }
        return Observation(
            f"obs-{view.subscription_id}-{mid}-{self.now.timestamp()}",
            record.collection_key,
            1,
            None,
            self.now,
            ObservationCompleteness.COMPLETE,
            tuple(facts),
            {"known_ids": list(facts), "facts": facts, "omitted_count": 0},
        )

    async def prepare(self, observation):
        module = self.registry.snapshot().module(MODULE)
        lease = await self.scheduler.claim_due(
            CollectionRunRequest(
                observation.key,
                self.now - timedelta(seconds=1),
                30,
                1,
                module.epoch,
                self.registry.snapshot().revision,
            ),
            now=self.now,
        )
        self.assertIsNotNone(lease)
        return lease, await self.service.prepare_evaluations(lease, observation)

    async def evaluate(self, observation):
        lease, commit = await self.prepare(observation)
        try:
            self.assertTrue(
                await self.scheduler.commit_observation_with_evaluations(lease, commit)
            )
        finally:
            await self.scheduler.release(lease)

    async def test_baseline_same_match_staggered_multigroup_cancel_and_restart(self):
        first = await self.create("a", "group-one", 123)
        second = await self.create("b", "group-one", 456)
        other = await self.create("c", "group-two", 456)
        for view in (first, second, other):
            await self.evaluate(await self.observation(view))
            self.now += timedelta(seconds=31)
        self.assertEqual(await self.windows.list_due_routes(now=self.now, limit=10), ())
        await self.evaluate(await self.observation(first, mid="100"))
        projected = await self.delivery.current_event(
            "dota2.match:100",
            1,
            subscription_id=second.subscription_id,
            subscription_revision=1,
        )
        self.assertIsNotNone(projected)
        self.assertIsNone(
            await self.delivery.current_event(
                "dota2.match:100",
                1,
                subscription_id=other.subscription_id,
                subscription_revision=1,
            )
        )
        self.now += timedelta(seconds=45)
        # The other player's source list is delayed beyond the normal 30s window.
        await self.evaluate(await self.observation(second, mid="100", account=456))
        routes = await self.windows.list_due_routes(now=self.now, limit=10)
        self.assertEqual(len(routes), 1)
        window = await self.windows.get(routes[0].window_id)
        self.assertEqual(
            {m.subscription_id for m in window.members},
            {first.subscription_id, second.subscription_id},
        )
        first_event = await self.delivery.current_event(
            "dota2.match:100",
            1,
            subscription_id=first.subscription_id,
            subscription_revision=1,
        )
        composed = DotaMatchComposer().compose(
            (first_event.public_contribution, projected.public_contribution)
        )
        text = "\n".join(block.text for block in composed.display_data.ordered_blocks)
        self.assertEqual(text.count("Synthetic 123"), 1)
        self.assertEqual(text.count("Synthetic 456"), 1)
        # A separate group receives a separate immutable window when its own
        # source discovers the same match; it was never pulled into group one.
        self.now += timedelta(seconds=31)
        await self.evaluate(await self.observation(other, mid="100", account=456))
        self.now += timedelta(seconds=31)
        routes = await self.windows.list_due_routes(now=self.now, limit=10)
        self.assertEqual(len(routes), 2)
        self.assertEqual(
            {r.recipient.conversation_id for r in routes}, {"group-one", "group-two"}
        )
        self.assertEqual(len({r.window_id for r in routes}), 2)
        # Reopen the actual SQLite file and repository objects, preserving state.
        await self.db.executor.close()
        self.db = SQLiteDatabase(self.db.path)
        await self.repositories()
        self.now += timedelta(seconds=31)
        await self.evaluate(await self.observation(second, mid="100", account=456))
        self.assertEqual(
            len(await self.windows.list_due_routes(now=self.now, limit=10)), 2
        )
        # Cancellation between prepare and commit must fence the entire batch.
        self.now += timedelta(seconds=31)
        lease, pending = await self.prepare(await self.observation(first, mid="101"))
        try:
            await self.service.cancel(
                self.invocation("b", "group-one"),
                second.subscription_id,
                expected_revision=1,
            )
            self.assertFalse(
                await self.scheduler.commit_observation_with_evaluations(lease, pending)
            )
        finally:
            await self.scheduler.release(lease)
        self.assertIsNone(
            await self.delivery.current_event(
                "dota2.match:101",
                1,
                subscription_id=first.subscription_id,
                subscription_revision=1,
            )
        )
        recreated = await self.create("b", "group-one", 456)
        self.assertNotEqual(recreated.subscription_id, second.subscription_id)
        await self.evaluate(await self.observation(recreated, mid="100", account=456))
        self.assertIsNone(
            await self.delivery.current_event(
                "dota2.match:100",
                1,
                subscription_id=recreated.subscription_id,
                subscription_revision=1,
            )
        )


if __name__ == "__main__":
    unittest.main()

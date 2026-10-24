"""Baseline, restart, late ingestion and recipient-local public composition."""

import json
import unittest
from datetime import UTC, datetime
from types import SimpleNamespace

from yomihime_game_link_sdk.errors import SourceHttpError
from yomihime_game_link_sdk.services import HttpResponse
from yomihime_game_link_sdk.storage import OwnerScope
from yomihime_game_link_sdk.subscriptions import (
    CollectionKey,
    CollectionView,
    EvaluationState,
    NormalizedInput,
    Observation,
    ObservationCompleteness,
    PublicEventContribution,
    SubscriptionView,
)

from packages.steam_dlc.dota2.subscriptions import (
    COMPOSER_ID,
    DotaMatchCollector,
    DotaMatchComposer,
    DotaMatchEvaluator,
)

NOW = datetime(2026, 10, 24, 12, tzinfo=UTC)
KEY = CollectionKey(
    "steam_dlc/dota2",
    "dota2.matches",
    1,
    "opendota",
    NormalizedInput({"account_id32": 123}),
    OwnerScope.public(),
)


def sample(ids, facts=None, completeness=ObservationCompleteness.COMPLETE):
    return Observation(
        "observation",
        KEY,
        1,
        None,
        NOW,
        completeness,
        tuple(ids),
        {"known_ids": list(ids), "facts": facts or {}, "omitted_count": 0},
    )


def fact(mid, account=123, *, enabled=False):
    return {
        "match_id": mid,
        "account_id32": account,
        "start_time": int(NOW.timestamp()) - 3600,
        "duration": 1800,
        "ended_at": int(NOW.timestamp()) - 1800,
        "hero_id": 1,
        "outcome": "win",
        "name": f"Public {account}",
        "kills": 4,
        "deaths": None,
        "assists": 7,
        "commentary_enabled": enabled,
    }


class DotaSubscriptionTests(unittest.TestCase):
    def setUp(self):
        self.evaluator = DotaMatchEvaluator()
        self.subscription = SubscriptionView(
            "s1", 1, "owner", None, "group", {"account_id32": 123}
        )

    def test_complete_initial_baseline_never_replays_old_matches(self):
        decision = self.evaluator.evaluate(
            self.subscription, sample(["90"], {"90": fact("90")}), None
        )
        self.assertEqual(decision.events, ())
        self.assertTrue(decision.state["initialized"])
        self.assertEqual(decision.state["seen"], ["90"])
        for incomplete in (
            ObservationCompleteness.FAILED,
            ObservationCompleteness.PARTIAL,
        ):
            self.assertEqual(
                self.evaluator.evaluate(
                    self.subscription, sample(["90"], completeness=incomplete), None
                ).state,
                {},
            )

    def test_recovery_keeps_three_newest_by_time_and_records_older_omission(self):
        prior = EvaluationState(
            1,
            {
                "initialized": True,
                "baseline_at": int(NOW.timestamp()) - 7200,
                "seen": ["100"],
                "pending": [],
                "omitted_count": 0,
            },
        )
        ids = ["99", "101", "102", "103", "100"]
        facts = {mid: fact(mid) for mid in ids if mid != "100"}
        for mid, age in (("99", 100), ("101", 1000), ("102", 900), ("103", 800)):
            facts[mid]["ended_at"] = int(NOW.timestamp()) - age
        result = self.evaluator.evaluate(self.subscription, sample(ids, facts), prior)
        self.assertEqual(
            [event.event_key for event in result.events],
            ["dota2.match:102", "dota2.match:103", "dota2.match:99"],
        )
        self.assertEqual(result.state["pending"], [])
        self.assertEqual(result.state["omitted_count"], 1)
        resumed = self.evaluator.evaluate(
            self.subscription, sample(ids, facts), EvaluationState(2, result.state)
        )
        self.assertEqual(resumed.events, ())
        duplicate = self.evaluator.evaluate(
            self.subscription, sample(ids, facts), EvaluationState(3, resumed.state)
        )
        self.assertEqual(duplicate.events, ())

    def test_missing_details_remain_pending_until_a_later_sample(self):
        prior = EvaluationState(
            1,
            {
                "initialized": True,
                "baseline_at": int(NOW.timestamp()) - 7200,
                "seen": ["100"],
                "pending": [],
                "omitted_count": 0,
            },
        )
        waiting = self.evaluator.evaluate(
            self.subscription, sample(["100", "99"]), prior
        )
        self.assertEqual(waiting.state["pending"], ["99"])
        resumed = self.evaluator.evaluate(
            self.subscription,
            sample(["99", "100"], {"99": fact("99")}),
            EvaluationState(2, waiting.state),
        )
        self.assertEqual(len(resumed.events), 1)

    def test_different_target_facts_are_rejected(self):
        prior = EvaluationState(
            1, {"initialized": True, "baseline_at": 0, "seen": [], "pending": []}
        )
        with self.assertRaises(ValueError):
            self.evaluator.evaluate(
                self.subscription, sample(["99"], {"99": fact("99", 456)}), prior
            )

    def test_composer_has_only_received_focuses_and_retains_unknown_fields(self):
        composer = DotaMatchComposer()
        a = PublicEventContribution(COMPOSER_ID, "123", fact("99", enabled=True))
        b = PublicEventContribution(COMPOSER_ID, "456", fact("99", 456, enabled=True))
        combined = composer.compose((a, b, a))
        text = "\n".join(block.text for block in combined.display_data.ordered_blocks)
        self.assertEqual(text.count("Public 123"), 1)
        self.assertIn("Public 456", text)
        self.assertIn("4/未知/7", text)
        self.assertIsNotNone(combined.commentary)
        isolated = composer.compose((a,))
        self.assertNotIn("456", isolated.commentary.prompt)
        with self.assertRaises(ValueError):
            composer.compose(
                (a, PublicEventContribution(COMPOSER_ID, "123", fact("100")))
            )


class DotaCollectorTests(unittest.IsolatedAsyncioTestCase):
    async def test_empty_baseline_then_new_match_fetch_and_quota_defer(self):
        calls = []
        bodies = [[], [{"match_id": 99, "start_time": 1, "duration": 300}]]

        async def fetch(request):
            calls.append(request.path)
            if request.path.endswith("/matches"):
                return HttpResponse(200, {}, json.dumps(bodies.pop(0)).encode())
            raise SourceHttpError("rate_limited", next_available_at=NOW)

        scope = SimpleNamespace(http=SimpleNamespace(fetch=fetch))

        async def bind(context):
            return scope

        async def config():
            return SimpleNamespace(values={"subscription_enabled": True})

        collector = DotaMatchCollector(
            SimpleNamespace(
                scopes=SimpleNamespace(bind=bind),
                config=SimpleNamespace(current=config),
            ),
            now=lambda: NOW,
        )
        context = CollectionView(KEY, invocation=object())
        first = await collector.collect(context, KEY.parameters, None)
        self.assertEqual(first.payload["known_ids"], [])
        with self.assertRaises(SourceHttpError):
            await collector.collect(context, KEY.parameters, first)
        self.assertEqual(calls[-1], "/api/matches/99")

import hashlib
import json
import unittest
from dataclasses import replace
from datetime import timedelta

import test_dota_module as legacy
from test_dota_next import MemoryCache, SequenceHttp
from test_dota_subscriptions import COMPOSER_ID, NOW, fact
from yomihime_game_link_sdk.contexts import InvocationOrigin
from yomihime_game_link_sdk.subscriptions import (
    EvaluationState,
    PublicEventContribution,
    SubscriptionView,
)

from packages.steam_dlc.dota2.analysis import (
    FocusError,
    analysis_result,
    compact_analysis,
    normalize_analysis,
    plain,
    select_focus,
)
from packages.steam_dlc.dota2.subscriptions import DotaMatchComposer, DotaMatchProjector


def detailed():
    return {
        "match_id": 12345,
        "start_time": 1000,
        "duration": 3600,
        "game_mode": 22,
        "radiant_win": True,
        "players": [
            {
                "account_id": 123 + i,
                "player_slot": i if i < 5 else 128 + i - 5,
                "personaname": "same" if i < 2 else f"player{i}",
                "hero_id": i + 1,
                "kills": 0,
                "deaths": 0,
                "assists": 0,
                "gold_per_min": 0,
                "xp_per_min": 0,
                "gold_t": list(range(250)),
                "xp_t": list(range(250)),
                "purchase_log": [{"time": j, "key": "item"} for j in range(100)],
                "lane_role": 1,
                "lane_efficiency_pct": 0,
                "benchmarks": {f"b{j}": {"raw": 0, "pct": 0} for j in range(9)},
            }
            for i in range(10)
        ],
        "teamfights": [
            {
                "start": i * 60,
                "end": i * 60 + 30,
                "players": [{"damage": 0, "deaths": 0}] * 10,
            }
            for i in range(25)
        ],
        "objectives": [{"time": 0, "type": "tower", "team": 2, "player_slot": 0}],
        "radiant_gold_adv": [-10, 0, 10],
        "radiant_xp_adv": [0, 0, 0],
    }


class AnalysisNormalizationTests(unittest.TestCase):
    def test_display_section_labels_leave_raw_analysis_facts_unchanged(self):
        projection = normalize_analysis(detailed(), "12345")
        projection["truncated_sections"] = [
            "teamfights.invalid_rows",
            "gold_t.missing_points",
            "future_section",
        ]
        focus = select_focus(projection, "123")
        before = compact_analysis(projection, focus)
        response = analysis_result(projection, focus, command=True)
        text = "\n".join(
            block.text
            for block in response.document.ordered_blocks
            if hasattr(block, "text")
        )
        self.assertIn("团战（含无效记录）", text)
        self.assertIn("经济时间线（采样点缺失）", text)
        self.assertIn("未知分析段", text)
        self.assertNotIn("future_section", text)
        self.assertNotIn("lane_role", text)
        self.assertEqual(plain(response.model_facts.facts), plain(before))

    def test_serialized_cache_reorders_object_keys_without_changing_fact_hash(self):
        cold = normalize_analysis(detailed(), "12345")
        warm = json.loads(json.dumps(cold, sort_keys=True, allow_nan=False))
        cold_facts = analysis_result(
            cold, select_focus(cold, "123"), command=True
        ).model_facts
        warm_facts = analysis_result(
            warm, select_focus(warm, "123"), command=True
        ).model_facts
        self.assertEqual(plain(cold_facts.facts), plain(warm_facts.facts))
        self.assertEqual(cold_facts.sources, warm_facts.sources)

        def digest(facts):
            return hashlib.sha256(
                json.dumps(
                    plain(facts.facts),
                    sort_keys=True,
                    ensure_ascii=False,
                    allow_nan=False,
                    separators=(",", ":"),
                ).encode()
            ).hexdigest()

        self.assertEqual(digest(cold_facts), digest(warm_facts))
        self.assertEqual(
            cold_facts.facts["missing_fields"],
            sorted(cold_facts.facts["missing_fields"]),
        )

    def test_bounded_full_projection_preserves_zero_signed_values_and_focus_side(self):
        data = normalize_analysis(detailed(), "12345")
        self.assertEqual(len(data["teamfights"]), 20)
        self.assertEqual(len(data["players"][0]["timeline"]["gold"]), 181)
        self.assertEqual(len(data["players"][0]["purchases"]), 80)
        focus = select_focus(data, "76561197960265851")
        facts = compact_analysis(data, focus)
        self.assertEqual(facts["focus"]["kills"], 0)
        self.assertEqual(facts["team_advantage"]["gold"][0][1], -10)
        self.assertEqual(facts["benchmarks"]["b0"]["raw"], 0)
        self.assertEqual(select_focus(data, "128")["base"]["outcome"], "loss")
        self.assertIn("gold_t", facts["truncated_sections"])
        self.assertEqual(facts["data_completeness"], "partial")

    def test_unique_names_ambiguous_anonymous_and_nonparticipant(self):
        data = normalize_analysis(detailed(), "12345")
        with self.assertRaises(FocusError) as caught:
            select_focus(data, "same")
        self.assertEqual(caught.exception.status, "ambiguous")
        self.assertEqual(select_focus(data, "player2")["base"]["account_id32"], "125")
        with self.assertRaises(FocusError):
            select_focus(data, "999")
        raw = detailed()
        raw["players"][0].pop("account_id")
        data = normalize_analysis(raw, "12345")
        with self.assertRaises(FocusError) as caught:
            select_focus(data, "same")
        self.assertEqual(caught.exception.status, "anonymous")

    def test_basic_settlement_and_malformed_optional_numbers_do_not_invent_data(self):
        raw = detailed()
        for key in ("teamfights", "objectives", "radiant_gold_adv", "radiant_xp_adv"):
            raw.pop(key)
        raw["players"] = [
            {"account_id": 123, "player_slot": 0, "kills": 0, "gold_per_min": 0}
        ]
        data = normalize_analysis(raw, "12345")
        facts = compact_analysis(data, select_focus(data, "123"))
        self.assertEqual(facts["data_completeness"], "settlement_only")
        self.assertIsNone(facts["teamfight_totals"]["damage"])
        self.assertEqual(facts["focus"]["gold_per_min"], 0)
        raw["players"][0]["benchmarks"] = {"gpm": {"raw": "NaN", "pct": False}}
        data = normalize_analysis(raw, "12345")
        self.assertEqual(
            data["players"][0]["benchmarks"]["gpm"], {"raw": None, "percentile": None}
        )

    def test_command_and_tool_share_same_compact_facts_only_command_requests_model(
        self,
    ):
        data = normalize_analysis(detailed(), "12345")
        focus = select_focus(data, "123")
        command = analysis_result(data, focus, command=True)
        tool = analysis_result(data, focus, command=False)
        self.assertEqual(command.model_facts.facts, tool.model_facts.facts)
        self.assertIsNotNone(command.analysis_request)
        self.assertIsNone(tool.analysis_request)


class AnalysisModuleTests(unittest.IsolatedAsyncioTestCase):
    asyncSetUp = legacy.TestDotaModule.asyncSetUp

    async def test_explicit_focus_raw_cache_reuse_refresh_and_command_tool_parity(self):
        self.scope.cache = MemoryCache()
        self.scope.http = SequenceHttp(detailed(), detailed())
        first = await self.handlers["analyze_explicit"].invoke(
            legacy.invocation(InvocationOrigin.LLM_TOOL, "analyze_explicit"),
            {"match_id": "12345", "account": "123"},
        )
        self.assertIsNone(first.analysis_request)
        command = await self.handlers["analyze"].invoke(
            legacy.invocation(InvocationOrigin.COMMAND, "analyze"),
            {"command": "12345 --account 123"},
        )
        self.assertEqual(first.model_facts.facts, command.model_facts.facts)
        self.assertIsNotNone(command.analysis_request)
        second = await self.handlers["analyze_explicit"].invoke(
            legacy.invocation(InvocationOrigin.LLM_TOOL, "analyze_explicit"),
            {"match_id": "12345", "account": "128"},
        )
        self.assertNotEqual(
            first.model_facts.facts["focus"], second.model_facts.facts["focus"]
        )
        self.assertEqual(len(self.scope.http.requests), 1)
        await self.handlers["analyze_explicit"].invoke(
            legacy.invocation(InvocationOrigin.LLM_TOOL, "analyze_explicit"),
            {"match_id": "12345", "account": "123", "refresh": True},
        )
        self.assertEqual(len(self.scope.http.requests), 2)
        self.assertTrue(all(r.method == "GET" for r in self.scope.http.requests))

    async def test_tool_self_never_reads_binding_or_source_and_overlimit_is_error(self):
        self.scope.cache = MemoryCache()
        self.scope.http = SequenceHttp()
        result = await self.handlers["analyze_explicit"].invoke(
            legacy.invocation(InvocationOrigin.LLM_TOOL, "analyze_explicit"),
            {"match_id": "12345", "account": "我"},
        )
        self.assertIsNotNone(result.error)
        self.assertEqual(self.dependencies.calls, [])
        self.assertEqual(self.scope.http.requests, [])
        from yomihime_game_link_sdk.services import HttpResponse

        self.scope.http = SequenceHttp(HttpResponse(200, {}, b" " * 4_000_001))
        result = await self.handlers["analyze_explicit"].invoke(
            legacy.invocation(InvocationOrigin.LLM_TOOL, "analyze_explicit"),
            {"match_id": "12345", "account": "123"},
        )
        self.assertIsNotNone(result.error)
        self.assertIsNone(result.model_facts)


class PublicProjectionTests(unittest.TestCase):
    def test_malformed_public_settlement_is_rejected_before_focus_projection(self):
        seed = fact("100")
        settlement = {
            "match_id": "100",
            "duration": seed["duration"],
            "players": [fact("100", account=456)],
        }
        state = {"initialized": True, "baseline_at": 0, "seen": [], "pending": []}
        member = SubscriptionView(
            "b",
            1,
            "owner",
            None,
            "group",
            {"account_id32": 456},
            evaluation_state=EvaluationState(1, state),
        )
        projector, composer = DotaMatchProjector(), DotaMatchComposer()
        for players in (
            1,
            1.5,
            "players",
            {},
            [None],
            [1.5],
            [[]],
            [{"account_id32": True}],
            [{"account_id32": 456.0}],
            [{"account_id32": -1}],
            [fact("100", 456)] * 11,
        ):
            with self.subTest(players=players):
                contribution = PublicEventContribution(
                    COMPOSER_ID,
                    "123",
                    {**seed, "settlement": {**settlement, "players": players}},
                )
                with self.assertRaises(ValueError):
                    projector.project(member, contribution, observed_at=NOW)
                with self.assertRaises(ValueError):
                    composer.compose((contribution,))
        for malformed in (False, 1, 1.5, "settlement", []):
            contribution = PublicEventContribution(
                COMPOSER_ID, "123", {**seed, "settlement": malformed}
            )
            self.assertIsNone(projector.project(member, contribution, observed_at=NOW))
            with self.assertRaises(ValueError):
                composer.compose((contribution,))
        for players in ([], [fact("100", 789)], [fact("100", 456)] * 2):
            contribution = PublicEventContribution(
                COMPOSER_ID,
                "123",
                {**seed, "settlement": {**settlement, "players": players}},
            )
            self.assertIsNone(projector.project(member, contribution, observed_at=NOW))

    def test_projection_requires_valid_baseline_and_state_sequence_shapes(self):
        seed = fact("100")
        seed["settlement"] = {
            "match_id": "100",
            "duration": seed["duration"],
            "players": [fact("100", account=456)],
        }
        contribution = PublicEventContribution(COMPOSER_ID, "123", seed)
        base = {"initialized": True, "baseline_at": 0, "seen": [], "pending": []}
        for changed in (
            {"baseline_at": "0"},
            {"baseline_at": True},
            {"seen": {}},
            {"pending": "100"},
            {"seen": [1]},
            {"pending_since": []},
            {"pending_times": 1.5},
        ):
            with self.subTest(changed=changed):
                member = SubscriptionView(
                    "b",
                    1,
                    "owner",
                    None,
                    "group",
                    {"account_id32": 456},
                    evaluation_state=EvaluationState(1, {**base, **changed}),
                )
                with self.assertRaises(ValueError):
                    DotaMatchProjector().project(member, contribution, observed_at=NOW)

    def test_late_recent_focus_projects_without_baseline_bypass_and_is_idempotent(self):
        seed = fact("100", account=123)
        seed["settlement"] = {
            "match_id": "100",
            "start_time": seed["start_time"],
            "duration": seed["duration"],
            "players": [
                {
                    "account_id32": 456,
                    "player_slot": 128,
                    "hero_id": 2,
                    "name": "opponent",
                    "outcome": "loss",
                    "kills": 0,
                    "deaths": 0,
                    "assists": 0,
                }
            ],
        }
        contribution = PublicEventContribution(COMPOSER_ID, "123", seed)
        member = SubscriptionView("b", 1, "owner", None, "group", {"account_id32": 456})
        projector = DotaMatchProjector()
        self.assertIsNone(projector.project(member, contribution, observed_at=NOW))
        member = replace(
            member,
            evaluation_state=EvaluationState(
                1,
                {
                    "initialized": True,
                    "baseline_at": int(NOW.timestamp()) - 7200,
                    "seen": [],
                    "pending": [],
                },
            ),
        )
        decision = projector.project(
            member, contribution, observed_at=NOW + timedelta(seconds=45)
        )
        self.assertEqual(len(decision.events), 1)
        self.assertEqual(
            decision.events[0].public_contribution.payload["outcome"], "loss"
        )
        replay = replace(member, evaluation_state=EvaluationState(2, decision.state))
        self.assertIsNone(
            projector.project(
                replay, contribution, observed_at=NOW + timedelta(seconds=90)
            )
        )

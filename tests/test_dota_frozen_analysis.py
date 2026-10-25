"""REQ-05 consumer checks against the actual, read-only paired Core scanner."""

import asyncio
import importlib.util
import json
import os
import sys
import unittest
from collections.abc import Mapping
from pathlib import Path
from types import SimpleNamespace

from test_dota_analysis import detailed

from packages.steam_dlc.dota2.analysis import (
    analysis_result,
    compact_analysis,
    normalize_analysis,
    plain,
    select_focus,
    valid_cached_analysis,
)

ROOT = Path(__file__).resolve().parents[1]
CANDIDATES = (
    (ROOT / os.environ["YGL_CORE_ROOT"],)
    if os.environ.get("YGL_CORE_ROOT")
    else (ROOT / ".ci-core", ROOT / "worktrees/game-link-dlc-support")
)
CORE_ROOT = next(
    (p for p in CANDIDATES if (p / "core/public_result.py").is_file()), None
)
if CORE_ROOT is None:
    raise FileNotFoundError(
        "Paired frozen Core source required for Dota consumer checks"
    )
SPEC = importlib.util.spec_from_file_location(
    "dlc_dota_frozen_core",
    CORE_ROOT / "__init__.py",
    submodule_search_locations=[str(CORE_ROOT)],
)
assert SPEC is not None and SPEC.loader is not None
CORE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = CORE
SPEC.loader.exec_module(CORE)

from dlc_dota_frozen_core.core.contracts.validation_boundary import (  # noqa: E402
    validate_contract,
)
from dlc_dota_frozen_core.core.public_result import public_fact_strings  # noqa: E402
from dlc_dota_frozen_core.services.analysis import CommandAnalysisService  # noqa: E402


def maximum_parsed():
    raw = detailed()
    raw["duration"] = 11205
    for player in raw["players"]:
        player["personaname"] = "n" * 80
        player["times"] = [i * 45 for i in range(250)]
        player["purchase_log"] = [
            {"time": i * 113, "key": "i" * 80} for i in range(100)
        ]
        player["benchmarks"] = {
            str(i).zfill(64): {"raw": 10**12, "pct": 1} for i in range(9)
        }
    raw["teamfights"] = [
        {
            "start": i * 460,
            "end": i * 460 + 30,
            "players": [
                {
                    "damage": i * 1000,
                    "deaths": 0,
                    "healing": 1,
                    "gold_delta": -i,
                    "xp_delta": i,
                }
            ]
            * 10,
        }
        for i in range(25)
    ]
    raw["objectives"] = [
        {"time": i * 11, "type": "o" * 80, "team": 2, "player_slot": 0}
        for i in range(1000)
    ]
    # A brief middle-game reversal is invisible to start/middle/end sampling.
    raw["radiant_gold_adv"] = [0] * 181
    raw["radiant_gold_adv"][37] = -10000
    raw["radiant_xp_adv"] = [0] * 181
    raw["radiant_xp_adv"][72] = 9000
    return raw


def metrics(value, depth=0):
    children = (
        [*value.keys(), *value.values()]
        if isinstance(value, Mapping)
        else value
        if isinstance(value, (list, tuple))
        else ()
    )
    sub = [metrics(child, depth + 1) for child in children]
    return (
        1 + sum(row[0] for row in sub),
        max([depth, *(row[1] for row in sub)]),
        max([len(value) if isinstance(value, str) else 0, *(row[2] for row in sub)]),
    )


class FrozenAnalysisTests(unittest.TestCase):
    def test_maximum_legal_projection_fits_actual_scanner_and_request_contract(self):
        projection = normalize_analysis(maximum_parsed(), "12345")
        projection.update(fetched_at="2026-10-25T00:00:00+00:00", cached_at=None)
        self.assertTrue(valid_cached_analysis(projection, "12345"))
        focus = select_focus(projection, "123")
        result = analysis_result(projection, focus, command=True)
        validate_contract(result)
        strings = list(public_fact_strings(result.model_facts))
        self.assertIn("OpenDota", strings)
        nodes, depth, longest = metrics(result.model_facts.facts)
        self.assertLessEqual(nodes + len(result.model_facts.sources), 512)
        self.assertLessEqual(depth, 16)
        self.assertLessEqual(longest, 4096)
        self.assertLess(
            len(json.dumps(plain(result.model_facts.facts)).encode()), 256 * 1024
        )
        self.assertEqual(result.analysis_request.timeout_seconds, 55)
        self.assertEqual(result.analysis_request.template_version, 2)
        self.assertIn("1000–1800", result.analysis_request.instructions)

    def test_representative_phases_timed_events_and_short_reversal(self):
        projection = normalize_analysis(maximum_parsed(), "12345")
        focus = select_focus(projection, "123")
        facts = compact_analysis(projection, focus)
        purchases = facts["purchases"]["rows"]
        self.assertEqual(len(purchases), 9)
        self.assertEqual(purchases[0][0], 0)
        self.assertEqual(purchases[-1][0], 11187)
        self.assertTrue(any(3735 <= row[0] < 7470 for row in purchases))
        self.assertEqual(len(facts["teamfights"]["rows"]), 3)
        self.assertGreater(facts["teamfights"]["rows"][-1][0], 7470)
        self.assertEqual(len(facts["objectives"]["rows"]), 3)
        self.assertGreater(facts["objectives"]["rows"][-1][0], 7470)
        self.assertIn([2220, -10000], facts["team_advantage"]["gold"])
        self.assertIn([4320, 9000], facts["team_advantage"]["xp"])
        self.assertNotIn("price", facts["purchases"]["columns"])
        # Bounded normalization retains the late source rows too.
        self.assertEqual(focus["purchases"][-1]["time"], 11187)
        self.assertEqual(projection["teamfights"][-1]["start"], 11040)
        self.assertEqual(projection["objectives"][-1]["time"], 10989)

    def test_team_objectives_are_not_claimed_as_focus_and_unknown_times_stay_unknown(
        self,
    ):
        raw = detailed()
        raw["objectives"] = [{"time": 900, "type": "tower", "team": 2}]
        raw["players"][0]["purchase_log"] = [{"key": "unknown_time"}]
        projection = normalize_analysis(raw, "12345")
        facts = compact_analysis(projection, select_focus(projection, "123"))
        self.assertIsNone(facts["objectives"]["focus_explicit_count"])
        self.assertEqual(facts["objectives"]["rows"], [[900, "tower", 2, None]])
        self.assertEqual(facts["purchases"]["rows"], [])
        self.assertEqual(facts["purchases"]["available_count"], 1)
        self.assertIn("Untimed events", facts["sampling"])

    def test_focal_objective_priority_preserves_other_phases_team_context(self):
        raw = detailed()
        raw["objectives"] = [
            {"time": 300, "type": "tower", "team": 2},
            {"time": 1500, "type": "tower", "team": 3},
            {"time": 1700, "type": "focal_event", "player_slot": 0},
            {"time": 3000, "type": "barracks", "team": 2},
        ]
        projection = normalize_analysis(raw, "12345")
        facts = compact_analysis(projection, select_focus(projection, "123"))
        self.assertEqual(
            [row[0] for row in facts["objectives"]["rows"]], [300, 1700, 3000]
        )
        self.assertEqual(facts["objectives"]["focus_explicit_count"], 1)


class FrozenFailureTests(unittest.IsolatedAsyncioTestCase):
    async def test_actual_core_fallback_and_remaining_deadline_preserve_facts(self):
        projection = normalize_analysis(detailed(), "12345")
        result = analysis_result(
            projection, select_focus(projection, "123"), command=True
        )
        invocation = SimpleNamespace(deadline=0)

        async def current():
            pass

        async def prepare():
            await asyncio.sleep(0)
            raise AssertionError("expired invocation must stop prepare")

        for port, expected in (
            (None, "模型未配置"),
            (SimpleNamespace(prepare=prepare), "模型调用超时"),
        ):
            with self.subTest(expected=expected):
                applied = await CommandAnalysisService(port).apply(
                    invocation, "isolated", result, current=current
                )
                self.assertIsNone(applied.analysis_request)
                self.assertEqual(applied.model_facts, result.model_facts)
                self.assertEqual(
                    applied.document.ordered_blocks[:-1], result.document.ordered_blocks
                )
                self.assertIn(
                    "AI分析未生成：" + expected,
                    applied.document.ordered_blocks[-1].text,
                )


if __name__ == "__main__":
    unittest.main()

"""Synthetic bounded-sample tests, independent of HTTP and real accounts."""

import json
import unittest

from packages.steam_dlc.dota2.normalization import normalize_recent
from packages.steam_dlc.dota2.statistics import project_stats


def row(match_id, time, outcome="win", **fields):
    return {
        "match_id": match_id,
        "start_time": time,
        "player_slot": 0,
        "radiant_win": {"win": True, "loss": False}.get(outcome),
        **fields,
    }


class TestDotaStatistics(unittest.TestCase):
    def test_invalid_original_rows_block_streak_without_losing_valid_statistics(self):
        for gap in (None, {"match_id": 0}, {"match_id": True}):
            with self.subTest(gap=gap):
                result = project_stats([row(1, 30), gap, row(2, 10)])
                self.assertEqual(result["wins"], 2)
                self.assertEqual(result["invalid_count"], 1)
                self.assertEqual(result["streak"], {"outcome": None, "count": None})
        closed = project_stats([row(1, 40), row(2, 30, "loss"), None, row(3, 10)])
        self.assertEqual(closed["streak"], {"outcome": "win", "count": 1})

    def test_mixed_sample_independent_denominators_and_group_order(self):
        payload = [
            row(11, 300, kills=0, deaths=2, hero_id=2, game_mode=23),
            row(12, 200, "loss", kills=8, assists=4, hero_id=1, game_mode=22),
            row(13, 100, "unknown", deaths=0, assists=8, game_mode=999),
            row(11, 50, kills=999),
            {"match_id": 0},
            None,
        ]
        result = project_stats(payload)
        self.assertEqual(
            {
                k: result[k]
                for k in (
                    "received_count",
                    "sample_count",
                    "invalid_count",
                    "duplicate_count",
                    "wins",
                    "losses",
                    "unknown",
                    "win_rate",
                )
            },
            {
                "received_count": 6,
                "sample_count": 3,
                "invalid_count": 2,
                "duplicate_count": 1,
                "wins": 1,
                "losses": 1,
                "unknown": 1,
                "win_rate": 50.0,
            },
        )
        self.assertEqual(
            result["averages"],
            {
                "kills": {"total": 8, "sample_count": 2, "value": 4.0},
                "deaths": {"total": 2, "sample_count": 2, "value": 1.0},
                "assists": {"total": 12, "sample_count": 2, "value": 6.0},
                "duration": {"total": 0, "sample_count": 0, "value": None},
            },
        )
        self.assertEqual([g["hero_id"] for g in result["heroes"]], [2, 1, None])
        self.assertEqual([g["game_mode"] for g in result["modes"]], [23, 22, 999])
        self.assertEqual(
            [g["group"] for g in result["turbo_groups"]],
            ["turbo", "non_turbo", "unknown"],
        )
        self.assertEqual(
            [g["win_rate"] for g in result["turbo_groups"]], [100.0, 0.0, None]
        )
        self.assertEqual(
            result["coverage"],
            {
                "oldest_start_time": 100,
                "newest_start_time": 300,
                "known_time_count": 3,
                "chronology_confirmed": True,
            },
        )
        self.assertEqual(result["streak"], {"outcome": "win", "count": 1})
        json.dumps(result, allow_nan=False)

    def test_empty_and_all_unknown_never_invent_zero_rates(self):
        empty = project_stats([])
        self.assertEqual(empty["sample_count"], 0)
        self.assertEqual(empty["wins"], 0)
        self.assertEqual(empty["win_rate"], None)
        self.assertEqual(empty["heroes"], [])
        self.assertEqual(empty["turbo_groups"], [])
        self.assertEqual(empty["coverage"]["chronology_confirmed"], False)
        self.assertEqual(empty["streak"], {"outcome": None, "count": None})
        unknown = project_stats([{"match_id": 42}])
        self.assertEqual(
            (unknown["wins"], unknown["losses"], unknown["unknown"]), (0, 0, 1)
        )
        self.assertIsNone(unknown["win_rate"])
        self.assertEqual(unknown["turbo_groups"][0]["group"], "unknown")

    def test_first_n_raw_rows_not_refilled_and_numeric_id_dedup(self):
        payload = [row("0007", 30), row(7, 20, "loss"), False, row(8, 10)]
        result = project_stats(payload, limit=3)
        self.assertEqual(
            (
                result["received_count"],
                result["sample_count"],
                result["duplicate_count"],
                result["invalid_count"],
            ),
            (3, 1, 1, 1),
        )
        self.assertEqual(result["wins"], 1)
        self.assertEqual(result["losses"], 0)
        # The established recent projection still returns duplicate source rows.
        recent = normalize_recent(payload, limit=3)
        self.assertEqual([m.match_id for m in recent], ["0007", "7"])

    def test_bad_metrics_are_not_denominators_and_real_zero_is(self):
        payload = [
            row(1, 4, kills=True, deaths=-1, assists=float("nan"), duration=604801),
            row(2, 3, kills=2.5, deaths=float("inf"), assists="no", duration=-1),
            row(3, 2, kills=0, deaths="0", assists="3", duration="60"),
            row(4, 1, kills=1_000_001, deaths=1_000_001, assists=1_000_001),
        ]
        result = project_stats(payload)
        for metric, total in (
            ("kills", 0),
            ("deaths", 0),
            ("assists", 3),
            ("duration", 60),
        ):
            self.assertEqual(
                result["averages"][metric],
                {"total": total, "sample_count": 1, "value": float(total)},
            )

    def test_invalid_ids_and_match_slot_semantics(self):
        invalid = [
            None,
            {},
            {"match_id": True},
            {"match_id": -2},
            {"match_id": "1e9"},
            {"match_id": "9" * 25},
        ]
        self.assertEqual(project_stats(invalid)["invalid_count"], len(invalid))
        result = project_stats(
            [
                row(1, 4, player_slot=128, radiant_win=True),
                row(2, 3, player_slot=132, radiant_win=False),
                row(3, 2, player_slot=127),
                row(4, 1, radiant_win=1),
            ]
        )
        self.assertEqual(
            (result["wins"], result["losses"], result["unknown"]), (1, 1, 2)
        )

    def test_modes_zero_missing_and_unrecognized_are_unknown_turbo_group(self):
        result = project_stats(
            [
                row(1, 6, game_mode=0),
                row(2, 5),
                row(3, 4, game_mode=999),
                row(4, 3, game_mode=23),
                row(5, 2, game_mode=1),
                row(6, 1, game_mode=25),
            ]
        )
        self.assertEqual(
            [(g["group"], g["matches"]) for g in result["turbo_groups"]],
            [("unknown", 3), ("turbo", 1), ("non_turbo", 2)],
        )

    def test_chronology_and_streak_never_sort_unknown_data(self):
        for times in ([30, None, 10], [30, 30, 10], [10, 30, 20]):
            with self.subTest(times=times):
                result = project_stats(
                    [row(i + 1, time) for i, time in enumerate(times)]
                )
                self.assertFalse(result["coverage"]["chronology_confirmed"])
                self.assertEqual(result["streak"], {"outcome": None, "count": None})
                self.assertEqual(result["coverage"]["oldest_start_time"], 10)
                self.assertEqual(result["coverage"]["newest_start_time"], 30)
        for outcomes, expected in [
            (["win", "win", "loss"], {"outcome": "win", "count": 2}),
            (["loss", "loss"], {"outcome": "loss", "count": 2}),
            (["win", "unknown", "loss"], {"outcome": None, "count": None}),
            (["win", "loss", "unknown"], {"outcome": "win", "count": 1}),
            (["unknown", "win"], {"outcome": None, "count": None}),
            (["win", "unknown"], {"outcome": None, "count": None}),
        ]:
            with self.subTest(outcomes=outcomes):
                self.assertEqual(
                    project_stats(
                        [
                            row(i + 1, 100 - i, outcome)
                            for i, outcome in enumerate(outcomes)
                        ]
                    )["streak"],
                    expected,
                )

    def test_validate_payload_and_limit(self):
        for limit in (True, 0, 21, 1.0, "2", None):
            with self.subTest(limit=limit), self.assertRaises(ValueError):
                project_stats([], limit=limit)
        for payload in ({}, None, "[]", ()):
            with self.subTest(payload=payload), self.assertRaises(ValueError):
                project_stats(payload)


if __name__ == "__main__":
    unittest.main()

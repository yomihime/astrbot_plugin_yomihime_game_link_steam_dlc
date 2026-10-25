"""Model facts have a fixed, explicit schema within the public node budget."""

import unittest
from collections.abc import Mapping

import yomihime_game_link_sdk as ygl

from packages.steam_dlc.cs2.module import _result
from packages.steam_dlc.cs2.normalization import (
    normalize_match,
    normalize_profile,
    normalize_recent,
    normalize_season_stats,
    project_stats,
    select_summary,
)

PLAYER = "76561197960265851"
LONG = "界" * 256
DOMAIN = "d" * 64
AVATAR = "https://example.invalid/" + "x" * (2048 - len("https://example.invalid/"))


def nodes(value):
    if isinstance(value, Mapping):
        return 1 + sum(nodes(key) + nodes(child) for key, child in value.items())
    if isinstance(value, (tuple, list)):
        return 1 + sum(nodes(child) for child in value)
    return 1


def recent_projection(platform="perfect", count=20):
    fivee = platform == "5e"
    target = DOMAIN if fivee else PLAYER
    rows = [
        {
            "match_id" if fivee else "matchId": "PVP@" + str(index).zfill(124),
            "playerId": target,
            "dataSource": 1 if platform == "official" else 3,
            "map" if fivee else "mapName": LONG,
            "start_time" if fivee else "startTime": LONG,
            "end_time" if fivee else "endTime": "2026-01-02 00:00:00",
            "group1_all_score" if fivee else "score1": 13,
            "group2_all_score" if fivee else "score2": 5,
            "kill": 0,
            "death": None,
            "assist": 3,
            "rating": 1.25,
            "pwRating": 1.15,
            "rws": 10.5,
            "team": 1,
            "winTeam": 1,
            "is_win": "1",
            "season" if fivee else "seasonId": LONG,
        }
        for index in range(count)
    ]
    payload = (
        {"user": {"domain": target}, "match_data": rows}
        if fivee
        else {"dataPublic": True, "matchList": rows}
    )
    return normalize_recent(payload, target, platform=platform, limit=20)


def match_projection(count=10, focus_index=0):
    return normalize_match(
        {
            "base": {
                "matchId": "PVP@10001",
                "mapEn": LONG,
                "startTime": LONG,
                "endTime": LONG,
                "score1": 13,
                "score2": 5,
            },
            "players": [
                {
                    "playerId": str(int(PLAYER) + index),
                    "nickName": LONG,
                    "avatar": AVATAR,
                    "kill": 0,
                    "death": None,
                    "assist": 3,
                    "team": 1 if index < 5 else 2,
                    "rating": 1.25,
                    "pwRating": 1.15,
                    "rws": 10.5,
                    "adpr": 80.5,
                }
                for index in range(count)
            ],
        },
        "PVP@10001",
        focus=str(int(PLAYER) + focus_index),
    )


def profile_projection(platform):
    if platform == "5e":
        payload = {
            "user": {
                "domain": DOMAIN,
                "username": LONG,
                "avatar_url": AVATAR,
            },
            "career_data": {"match_total": 0, "rating": 1.25},
            "season_data": {
                "now_season_v1": "2026S1",
                "season_list": [{"match_type": 9, "level_name": LONG, "elo": 1.5}],
            },
        }
        return normalize_profile(payload, DOMAIN, platform=platform)
    return normalize_profile(
        {
            "steamId": PLAYER,
            "name": LONG,
            "nickName": LONG,
            "avatar": AVATAR,
            "seasonId": LONG,
            "pvpRank": 4,
            "rank": 5,
            "pvpScore": 1.5,
            "cnt": 0,
            "rating": 1.25,
        },
        PLAYER,
        platform=platform,
    )


def projections():
    yield match_projection()
    yield match_projection(64, 63)
    for platform in ("perfect", "official", "5e"):
        profile = profile_projection(platform)
        yield profile
        yield project_stats(profile)
        recent = recent_projection(platform)
        yield recent
        summary = select_summary(recent, recent["data"]["matches"][0]["match_id"])
        yield summary
        yield {**summary, "kind": "last"}
        if platform == "5e":
            yield normalize_season_stats(
                {"match_detail": {"rating": 1.25, "kill": 0}},
                profile,
                "2026S1",
            )


class CompactFactsTests(unittest.TestCase):
    def test_all_public_projections_stay_within_512_nodes_and_keep_display(self):
        for projection in projections():
            with self.subTest(platform=projection["platform"], kind=projection["kind"]):
                result = _result("Synthetic", projection, ())
                self.assertLessEqual(nodes(result.model_facts.facts), 512)
                self.assertEqual(result.model_facts.facts["null_semantics"], "unknown")
                self.assertNotIn("field_availability", result.model_facts.facts)
                for key in (
                    "schema_version",
                    "provider",
                    "platform",
                    "kind",
                    "target",
                    "season",
                    "fetched_at",
                    "coverage",
                    "detail_level",
                    "unavailable_reason",
                ):
                    self.assertEqual(result.model_facts.facts[key], projection[key])
                displayed = result.document.ordered_blocks[-1].fields["cs2"]
                self.assertIn("field_availability", displayed)
                self.assertEqual(displayed["kind"], projection["kind"])

    def test_recent_twenty_rows_keep_all_ids_unknowns_and_numeric_floats(self):
        for platform in ("perfect", "official", "5e"):
            projection = recent_projection(platform)
            facts = _result("Synthetic", projection, ()).model_facts.facts
            data = facts["data"]
            rows = [dict(zip(data["columns"], row)) for row in data["rows"]]
            self.assertEqual(len(rows), 20)
            self.assertEqual(
                [row["match_id"] for row in rows],
                [row["match_id"] for row in projection["data"]["matches"]],
            )
            self.assertEqual(data["available_matches"], 20)
            self.assertEqual(data["returned_matches"], 20)
            self.assertFalse(data["limited"])
            self.assertEqual(
                data["row_context"],
                "platform_and_focus_inherit_outer_platform_and_target",
            )
            for row in rows:
                self.assertIsNone(row["deaths"])
                self.assertEqual(row["kills"], 0)
                self.assertIs(type(row["rating"]), float)
                self.assertEqual(row["rating"], 1.25)
            for row, original in zip(rows, projection["data"]["matches"]):
                for key in data["columns"]:
                    expected = original[key]
                    self.assertEqual(row[key], expected)

    def test_full_roster_focus_and_explicit_large_roster_coverage(self):
        for count, focus_index in ((10, 0), (64, 63)):
            projection = match_projection(count, focus_index)
            result = _result("Synthetic", projection, ())
            data = result.model_facts.facts["data"]
            roster = data["players"]
            rows = [dict(zip(roster["columns"], row)) for row in roster["rows"]]
            self.assertEqual(len(roster["account_ids"]), count)
            self.assertEqual(len(set(roster["account_ids"])), count)
            self.assertEqual(roster["available_players"], count)
            self.assertEqual(roster["returned_players"], min(20, count))
            self.assertEqual(roster["limited"], count > 20)
            self.assertEqual(data["focus_account_id"], str(int(PLAYER) + focus_index))
            self.assertIn(data["focus_account_id"], [row["account_id"] for row in rows])
            self.assertIs(type(rows[0]["rating"]), float)
            self.assertIsNone(rows[0]["deaths"])
            displayed = result.document.ordered_blocks[-1].fields["cs2"]
            self.assertEqual(len(displayed["data"]["players"]), count)
            self.assertEqual(displayed["data"]["players"][0]["rating"], "1.25")
            originals = {
                row["account_id"]: row for row in projection["data"]["players"]
            }
            for row in rows:
                self.assertEqual(row, originals[row["account_id"]])

    def test_private_result_still_has_no_model_facts(self):
        result = _result(
            "Synthetic", match_projection(), (), model_facts=False, private=True
        )
        self.assertEqual(result.privacy, ygl.Privacy.PRIVATE)
        self.assertIsNone(result.model_facts)

    def test_recent_limit_reports_larger_source_sample_without_losing_selected_rows(
        self,
    ):
        projection = recent_projection(count=25)
        result = _result("Synthetic", projection, ())
        data = result.model_facts.facts["data"]
        self.assertEqual(data["available_matches"], 25)
        self.assertEqual(data["returned_matches"], 20)
        self.assertEqual(len(data["rows"]), 20)
        self.assertTrue(data["limited"])
        self.assertLessEqual(nodes(result.model_facts.facts), 512)

    def test_missing_focus_empty_recent_and_nonfinite_display_semantics(self):
        projection = match_projection()
        projection["target"] = None
        projection["data"]["focus"] = None
        facts = _result("Synthetic", projection, ()).model_facts.facts
        self.assertIsNone(facts["data"]["focus_account_id"])
        self.assertIsNone(facts["target"])
        empty = _result("Synthetic", recent_projection(count=0), ()).model_facts.facts
        self.assertEqual(len(empty["data"]["rows"]), 0)
        self.assertEqual(empty["data"]["available_matches"], 0)
        self.assertFalse(empty["data"]["limited"])
        for value in (float("nan"), float("inf"), float("-inf")):
            projection["data"]["players"][0]["rating"] = value
            with (
                self.subTest(value=value),
                self.assertRaisesRegex(ValueError, "non-finite"),
            ):
                _result("Synthetic", projection, ())

    def test_legal_finite_float_extremes_remain_numeric_in_facts(self):
        for value in (0.0, -0.0, -1.25, 1.7976931348623157e308, 5e-324):
            projection = profile_projection("perfect")
            projection["data"]["metrics"]["rating"] = value
            result = _result("Synthetic", projection, ())
            metric = result.model_facts.facts["data"]["metrics"]["rating"]
            self.assertIs(type(metric), float)
            self.assertEqual(metric, value)
            self.assertEqual(
                result.document.ordered_blocks[-1].fields["cs2"]["data"]["metrics"][
                    "rating"
                ],
                str(value),
            )

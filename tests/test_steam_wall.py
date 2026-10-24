"""Synthetic-only source precision, classification and deterministic business tests."""

import unittest
from types import SimpleNamespace

from packages.steam_dlc.steam.career import ANCHORS, grid_spec, span_for_minutes
from packages.steam_dlc.steam.wall import cumulative, options, select, source_rows
from packages.steam_dlc.steam.wall_materials import material_request, normalize_items
from packages.steam_dlc.steam.wall_presentation import result as wall_result


def projection(rows):
    return {
        "data": {"games": rows},
        "scope": "deprecated_xml_most_played_sample",
        "fetched_at": "2026-01-01T00:00:00Z",
    }


def row(appid, hours, **updates):
    return {
        "app_id": str(appid),
        "name": "Synthetic",
        "hours_on_record": hours,
        "precision": "displayed_hours",
        **updates,
    }


class WallBusinessTests(unittest.TestCase):
    def test_owned_source_provenance_and_coverage_remain_distinct_in_both_modes(self):
        data = projection([row(3, "2")])
        data["scope"] = "webapi_owned_games"
        materials = {
            "items": [{"app_id": "3", "app_type": "game", "asset_id": "opaque"}]
        }
        for mode in ("dense", "legacy"):
            for complete in (False, True):
                data["data"]["complete_library"] = complete
                output = wall_result(select(data, materials, mode=mode), private=False)
                self.assertEqual(output.provenance, ("steam_api", "steam_browse"))
                self.assertEqual(output.model_facts.facts["complete_library"], complete)
                self.assertNotIn("样本", output.document.title)
                self.assertEqual(
                    output.status.value, "success" if complete else "partial_success"
                )

    def test_dense_presets_anchor_area_interpolation_and_absolute_sizes(self):
        for preset, anchors in ANCHORS.items():
            for span, hours in enumerate(anchors, 1):
                self.assertEqual(span_for_minutes(hours * 60, preset), span)
            values = [
                span_for_minutes(minutes, preset) for minutes in range(0, 500001, 100)
            ]
            self.assertEqual(values, sorted(values))
            self.assertEqual(values[0], 1)
            self.assertEqual(span_for_minutes(10**12, preset), 8)
        self.assertEqual(span_for_minutes(10 * 60, "standard"), 2)
        for aspect in ("2:3", "9:16", "1:2"):
            low, high = grid_spec(aspect), grid_spec(aspect, "hd")
            self.assertEqual(tuple(v * 4 for v in low), tuple(v * 3 for v in high))

    def test_dense_thousand_long_tail_metadata_and_legacy_numeric_ties(self):
        rows = [row(i, "1", name="Long title " * 50) for i in range(1000, 0, -1)]
        data = projection(rows)
        materials = {
            "items": [{"app_id": str(i), "app_type": "game"} for i in range(1, 1001)]
        }
        selection = select(data, materials, mode="dense", all_apps=True, limit=1000)
        self.assertEqual(selection["counts"]["included"], 1000)
        self.assertEqual(selection["counts"]["names_truncated"], 1000)
        output = wall_result(selection)
        self.assertEqual(
            [item.key for item in output.document.card.blocks[0].items],
            [str(i) for i in range(1, 1001)],
        )
        self.assertTrue(
            all(item.span == 1 for item in output.document.card.blocks[0].items)
        )
        self.assertLess(len(output.document.ordered_blocks[0].text), 160000)
        legacy = wall_result(
            select(
                projection([row(20, "2"), row(3, "2")]),
                {
                    "items": [
                        {"app_id": "20", "app_type": "game"},
                        {"app_id": "3", "app_type": "game"},
                    ]
                },
            )
        )
        self.assertEqual(
            [item.key for item in legacy.document.card.blocks[0].items],
            ["0000000003", "0000000020"],
        )

    def test_unknown_zero_precision_and_exact_minutes_are_distinct(self):
        for value in (None, True, "NaN", "Infinity", "-1", {}, "bad"):
            self.assertIsNone(cumulative(row(1, value)))
        self.assertEqual(str(cumulative(row(1, "0"))[0]), "0")
        self.assertEqual(str(cumulative(row(1, "1.25"))[0]), "75.00")
        self.assertEqual(
            cumulative(row(1, None, precision="api_minutes", minutes_on_record=17))[1],
            "17 分钟",
        )
        self.assertIsNone(
            cumulative(row(1, None, precision="api_minutes", minutes_on_record=1.5))
        )

    def test_dedupe_conflict_never_sums_and_stable_numeric_appid_tie(self):
        data = projection([row(20, "2"), row(3, "2"), row(3, None), row(20, "1")])
        rows, counts = source_rows(data)
        self.assertEqual([r["app_id"] for r in rows], ["3", "20"])
        self.assertEqual([r["minutes"] for r in rows], ["120", "120"])
        self.assertEqual(counts["duplicates"], 2)
        self.assertEqual(counts["duplicate_conflicts"], 2)

    def test_verified_type_only_software_unknown_zero_and_limits_reported(self):
        data = projection(
            [row(1, "10"), row(2, "1000"), row(3, None), row(4, "0"), row(5, "8")]
        )
        materials = {
            "items": [
                {"app_id": "1", "app_type": "game", "asset_id": "opaque"},
                {"app_id": "2", "app_type": "software"},
                {"app_id": "3", "app_type": "game"},
                {"app_id": "4", "app_type": "game"},
            ]
        }
        result = select(data, materials)
        self.assertEqual([r["app_id"] for r in result["rows"]], ["1"])
        self.assertEqual(result["counts"]["unknown_type"], 1)
        self.assertEqual(result["counts"]["unknown_duration"], 1)
        self.assertEqual(result["counts"]["zero_duration"], 1)
        result = select(data, materials, all_apps=True, limit=2)
        self.assertEqual([r["app_id"] for r in result["rows"]], ["2", "1"])
        self.assertEqual(result["counts"]["limited"], 1)
        self.assertGreater(result["rows"][0]["weight"], result["rows"][1]["weight"])
        self.assertFalse(result["complete_library"])

    def test_command_options_full_is_preserved_for_explicit_block(self):
        value = options(
            SimpleNamespace(),
            {"command": "1 --source full --limit 200 --all-apps --refresh"},
        )
        self.assertEqual(value["source"], "full")
        self.assertEqual(value["limit"], 200)
        for command in (
            "--limit 0",
            "--limit 1001",
            "--limit true",
            "--source bad",
            "1 2",
            "--refresh --refresh",
        ):
            with self.assertRaises(ValueError):
                options(None, {"command": command})

    def test_metadata_identity_numeric_type_and_hashed_asset_version(self):
        assets = {
            "asset_url_format": "steam/apps/1/${FILENAME}?t=123",
            "library_capsule": "a" * 40 + "/library_capsule.jpg",
            "library_capsule_2x": "a" * 40 + "/library_capsule_2x.jpg",
        }
        request = material_request(assets, "1", large=True)
        self.assertIn("/" + "a" * 40 + "/library_capsule_2x.jpg", request["path"])
        self.assertEqual(request["query"], [["t", "123"]])
        base = {
            "appid": 1,
            "id": 1,
            "item_type": 0,
            "success": 1,
            "type": 6,
            "assets": assets,
        }
        raw = {"response": {"store_items": [base]}}
        self.assertEqual(normalize_items(raw, ["1"])["1"]["app_type"], "software")
        for invalid in (True, "0", 99, None):
            base["type"] = invalid
            self.assertEqual(normalize_items(raw, ["1"])["1"]["app_type"], "unknown")
        for template in (
            "https://evil.invalid/${FILENAME}",
            "steam/apps/2/${FILENAME}",
            "steam/apps/1/${FILENAME}?secret=x",
        ):
            self.assertIsNone(
                material_request(dict(assets, asset_url_format=template), "1")
            )


if __name__ == "__main__":
    unittest.main()

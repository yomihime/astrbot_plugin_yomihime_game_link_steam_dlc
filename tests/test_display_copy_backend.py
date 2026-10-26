"""Display labels remain readable while protocol facts retain source values."""

import copy
import unittest
from types import SimpleNamespace

from packages.steam_dlc.cs2.module import _display_label, _lines
from packages.steam_dlc.deadlock.normalization import profile
from packages.steam_dlc.deadlock.presentation import label_for
from packages.steam_dlc.deadlock.presentation import result as deadlock_result
from packages.steam_dlc.steam.jobs import _feedback
from packages.steam_dlc.steam.presentation import _boolean, _label, result


class BackendDisplayCopyTests(unittest.TestCase):
    def test_cs2_labels_preserve_projection_and_unknowns(self):
        projection = {
            "platform": "perfect",
            "coverage": "platform_recorded",
            "kind": "profile",
            "season": "S16",
            "data": {
                "account_id": "76561197960265851",
                "nickname": "测试玩家",
                "rank": {"system": "perfect_pvp_rank", "value": 4, "score": 1200},
                "metrics": {"matches": 0, "rating": 1.1, "future_metric": 7},
                "metric_scope": "season_aggregate",
            },
        }
        original = copy.deepcopy(projection)
        text = "\n".join(_lines(projection))
        for expected in (
            "平台已收录数据",
            "完美平台段位",
            "比赛场数：0",
            "Rating 评分：1.1",
            "赛季汇总",
            "其他统计：7",
        ):
            self.assertIn(expected, text)
        for raw in (
            "platform_recorded",
            "perfect_pvp_rank",
            "season_aggregate",
            "future_metric",
        ):
            self.assertNotIn(raw, text)
        self.assertEqual(projection, original)
        self.assertEqual(_display_label("future_result", "胜负未知"), "胜负未知")
        self.assertEqual(_display_label("win"), "胜利")
        self.assertEqual(_display_label("loss"), "失利")

    def test_deadlock_labels_and_unknown_status(self):
        for raw, text in (
            ("recorded", "已收录"),
            ("not_recorded", "尚未收录"),
            ("kills", "击杀"),
            ("duration_s", "时长（秒）"),
            ("win", "胜利"),
            ("loss", "失利"),
            ("not_found", "本场记录中暂无该玩家"),
        ):
            self.assertEqual(label_for(raw), text)
        self.assertEqual(label_for("future_status"), "未知")
        self.assertIn("待确认", label_for("ambiguous"))

    def test_deadlock_profile_retains_source_limits_and_facts(self):
        projection = {
            "profile": profile([], {}, 123),
            "fetched_at": "2026-10-26T00:00:00Z",
            "cache_hit": False,
            "schema_version": 1,
        }
        original = copy.deepcopy(projection)
        response = deadlock_result("profile", projection, False)
        text = "\n".join(block.text for block in response.document.ordered_blocks)
        self.assertIn("已收录公开数据", text)
        self.assertIn("资料状态：尚未收录", text)
        self.assertIn("段位未知", text)
        self.assertNotIn("not_recorded", text)
        self.assertNotIn("投影", text)
        self.assertEqual(
            response.model_facts.facts["profile"]["profile_status"], "not_recorded"
        )
        self.assertEqual(response.model_facts.facts["schema_version"], 1)
        self.assertEqual(projection, original)

    def test_steam_display_does_not_change_facts(self):
        projection = {
            "operation": "search",
            "data": {"candidates": [{"name": "测试", "app_id": 570}]},
            "source": "steam_store",
            "scope": "bounded_store_candidates",
            "region": "CN",
            "language": "schinese",
            "fetched_at": "2026-10-26T00:00:00Z",
            "cache": {"status": "hit", "fetched_at": "2026-10-26T00:00:00Z"},
        }
        original = copy.deepcopy(projection)
        response = result(projection)
        text = "\n".join(block.text for block in response.document.ordered_blocks)
        self.assertIn("Steam 商店", text)
        self.assertIn("本次商店候选", text)
        self.assertIn("已使用缓存", text)
        self.assertNotIn("bounded_store_candidates", text)
        self.assertEqual(response.model_facts.facts["scope"], original["scope"])
        self.assertEqual(projection, original)
        self.assertEqual(_label("future_scope"), "未知")
        self.assertEqual(_boolean(True), "是")
        self.assertEqual(_boolean(False), "否")
        self.assertEqual(_boolean(None), "未提供")
        self.assertEqual(_boolean("false"), "未提供")

    def test_job_status_keeps_id_permissions_and_recovery_guidance(self):
        job = SimpleNamespace(
            job_id="job-123",
            revision=7,
            status=SimpleNamespace(value="queued"),
            progress={},
            summary={},
        )
        text = _feedback(job)
        self.assertIn("任务 job-123 · 排队中", text)
        self.assertIn("当前不可重试", text)
        self.assertNotIn("queued", text)
        self.assertNotIn("修订", text)
        job.status.value = "future_status"
        self.assertIn("状态待确认", _feedback(job))
        job.status.value = "failed"
        job.summary = {"reason": "steam_source_access_denied"}
        text = _feedback(job)
        self.assertIn("授权或访问受限", text)
        self.assertIn("库内容仍待确认", text)
        self.assertIn("公开设置", text)
        self.assertIn("从头重新计算", text)
        self.assertNotIn("future_status", text)

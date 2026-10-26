"""One Deadlock projection supplies SDK cards, fallback and bounded facts."""

from __future__ import annotations

import yomihime_game_link_sdk as ygl
from yomihime_game_link_sdk import cards

from .normalization import literal


def label_for(item):
    return {
        "recorded": "已收录",
        "not_recorded": "尚未收录",
        "kills": "击杀",
        "deaths": "死亡",
        "assists": "助攻",
        "duration_s": "时长（秒）",
        "win": "胜利",
        "loss": "失利",
        "unknown": "未知",
        "found": "已定位该玩家",
        "ambiguous": "存在多条匹配记录，待确认",
        "not_found": "本场记录中暂无该玩家",
    }.get(item, "未知")


def value(item):
    return "未知" if item is None else str(item)


def kda(player):
    return "/".join(value(player.get(key)) for key in ("kills", "deaths", "assists"))


def result(operation, projection, default_target, avatar=None):
    title = (
        "Deadlock · "
        + {
            "profile": "玩家资料",
            "recent": "近期战绩",
            "stats": "样本统计",
            "last": "该玩家上一场",
            "match": "比赛详情",
        }[operation]
    )
    lines = ["社区 Deadlock API · 展示已收录公开数据，覆盖范围以社区来源为准。"]
    if operation == "profile":
        p = projection["profile"]
        rank = p["rank"]
        label = (
            "未定级 / 无近期已收录段位"
            if rank["badge"] == 0
            else "段位未知"
            if rank["badge"] is None
            else f"段位 {rank['tier']} · 分段 {rank['subrank']} · 段位标识 {rank['badge']}"
        )
        lines += [
            f"账号：{p['account_id32']} · {p['name'] or '昵称未收录'}",
            label,
            f"资料状态：{label_for(p['profile_status'])}；来源资料更新：{value(p['last_updated'])}",
            "段位取最近已收录排位；Eternus 按上游每日百分位，显示该场入场段位。",
        ]
    elif operation in ("recent", "stats"):
        history = projection["history"]
        stats = projection["stats"]
        lines += [
            f"账号：{projection['account_id32']}；请求 {history['requested_limit']} / 样本 {history['sample_count']} / 来源返回 {history['received_count']}",
            f"胜 {stats['wins']} / 负 {stats['losses']} / 未知 {stats['unknown']}；胜率 {value(stats['win_rate'])}%（有效分母 {stats['outcome_denominator']}）",
        ]
        if not history["matches"]:
            lines.append("来源暂无已收录有效比赛，账号完整游玩历史仍待确认。")
        if operation == "stats":
            for key, metric in stats["averages"].items():
                lines.append(
                    f"平均 {label_for(key)}：{value(metric['value'])}（有效样本 {metric['sample_count']}）"
                )
        else:
            for row in history["matches"]:
                lines.append(
                    f"#{row['match_id']} · 英雄 {value(row['hero_id'])} · 模式 {value(row['game_mode'])}/{value(row['match_mode'])} · {label_for(row['outcome'])} · KDA {kda(row)} · {value(row['duration_s'])}秒"
                )
    else:
        report = projection["match"]
        lines += [
            f"比赛 #{report['match_id']} · 模式 {value(report['game_mode'])}/{value(report['match_mode'])} · {value(report['duration_s'])}秒 · 实际 {report['player_count']}人",
            f"获胜队伍：{value(report['winning_team'])}",
        ]
        if "selection" in projection:
            lines.append(
                f"上一场选择：已收录窗口最近有效比赛 #{projection['selection']['match_id']}；查询范围为本次已收录窗口。"
            )
        if "focus" in projection:
            focus = projection["focus"]
            lines.append(
                f"个人焦点账号 {focus['account_id32']}：{label_for(focus['status'])}"
                + (f" · KDA {kda(focus['player'])}" if focus["player"] else "")
            )
        for p in report["players"][:24]:
            lines.append(
                f"账号 {value(p['account_id32'])} · 队伍 {value(p['team'])} · 英雄 {value(p['hero_id'])} · KDA {kda(p)} · {label_for(p['outcome'])}"
            )
        if report["player_count"] > 24:
            lines.append("卡片仅展示前24位；实际人数保留于比赛摘要。")
    lines.append(
        f"获取 UTC：{projection['fetched_at']} · {'缓存' if projection['cache_hit'] else '本次网络'}"
    )
    lines.append("缺失数据标为未知；样本均值与胜率分别按有效数据计算。")
    clean = tuple(literal(line, 600) or "" for line in lines)
    panels: tuple[cards.Block, ...] = tuple(cards.Text(line) for line in clean)
    if avatar is not None:
        panels = (cards.Image(avatar, width=96, height=96),) + panels
    facts = {
        k: v
        for k, v in projection.items()
        if k not in ("history", "profile", "match", "focus")
    }
    if "profile" in projection:
        facts["profile"] = {
            k: v for k, v in projection["profile"].items() if k != "avatar_url"
        }
    if "history" in projection:
        h = projection["history"]
        facts["history"] = {k: v for k, v in h.items() if k != "matches"}
        if operation == "recent":
            columns = (
                "match_id",
                "hero_id",
                "outcome",
                "kills",
                "deaths",
                "assists",
                "duration_s",
            )
            facts["recent"] = {
                "columns": columns,
                "rows": tuple(tuple(row[k] for k in columns) for row in h["matches"]),
            }
    if "match" in projection:
        m = projection["match"]
        facts["match"] = {k: v for k, v in m.items() if k != "players"}
        # All player DTOs stay available in the display projection; facts are bounded.
        facts["focus"] = projection.get("focus")
    return ygl.CapabilityResult(
        result_id="steam-dlc-deadlock-" + operation,
        status=ygl.ResultStatus.SUCCESS,
        document=ygl.DisplayDocument(
            title,
            "Deadlock API",
            tuple(ygl.TextBlock(line) for line in clean),
            sources=("https://api.deadlock-api.com",),
            card=cards.Document(title, panels, brand="游戏连结 · Deadlock"),
        ),
        model_facts=None
        if default_target
        else ygl.FactDocument(facts, sources=("Deadlock API",)),
        privacy=ygl.Privacy.PUBLIC,
    )

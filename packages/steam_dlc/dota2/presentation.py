"""One bounded projection feeds public SDK blocks, cards and text fallback."""

from __future__ import annotations

from datetime import UTC, datetime
from unicodedata import category
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import yomihime_game_link_sdk as ygl
from yomihime_game_link_sdk import cards
from yomihime_game_link_sdk.display import FieldsBlock, TableBlock, TextBlock

from ..shared.hero_names import HERO_NAMES
from .labels import mode_label


def _literal(value):
    # Source names are bounded by normalization. Reject invisible/control text
    # at presentation too; neither SDK strings nor Inline opt into tag parsing.
    return "".join(c for c in str(value) if not category(c).startswith("C"))


def _inline(value):
    return cards.Inline((cards.Span(_literal(value) or "未提供"),))


def _value(value):
    return "未提供" if value is None else str(value)


def _rate(value):
    return "未知" if value is None else f"{value:.2f}%"


def _hero(value):
    return HERO_NAMES.get(value, f"英雄#{value}") if value is not None else "英雄未提供"


def _outcome(value):
    return {"win": "胜利", "loss": "失败"}.get(value, "胜负未知")


def _camp(slot):
    return (
        "天辉"
        if slot is not None and 0 <= slot <= 4
        else "夜魇"
        if slot is not None and 128 <= slot <= 132
        else "阵营未知"
    )


def _time(value, timezone_name):
    if value is None:
        return "时间未提供"
    try:
        return (
            datetime.fromtimestamp(value, UTC)
            .astimezone(ZoneInfo(timezone_name))
            .strftime("%Y-%m-%d %H:%M:%S %Z")
        )
    except (OverflowError, OSError, ValueError, ZoneInfoNotFoundError):
        return "时间未提供"


def _duration(value):
    return "时长未提供" if value is None else f"{value // 60}分{value % 60:02d}秒"


def _kda(player):
    return " / ".join(_value(player.get(key)) for key in ("kills", "deaths", "assists"))


def _fields(title, values, blocks, panels):
    fallback = (
        title + "：\n" + "\n".join(f"{key}：{value}" for key, value in values.items())
    )
    blocks.append(FieldsBlock(values, fallback_text=fallback))
    panels.append(
        cards.Section(
            title,
            (
                cards.PropertyGrid(
                    tuple(
                        cards.Property(_inline(k), _inline(v))
                        for k, v in values.items()
                    )
                ),
            ),
        )
    )


def _table(title, columns, rows, blocks, panels):
    rows = tuple(tuple(str(value) for value in row) for row in rows)
    fallback = (
        title
        + "：\n"
        + ("\n".join(" | ".join(row) for row in rows) or "没有有效样本。")
    )
    blocks.append(TextBlock(title if rows else title + "：没有有效样本。"))
    blocks.append(TableBlock(tuple(columns), rows, fallback_text=fallback))
    if rows:
        panels.append(
            cards.Section(
                title,
                (
                    cards.Table(
                        tuple(cards.Column(c) for c in columns),
                        tuple(tuple(_inline(value) for value in row) for row in rows),
                    ),
                ),
            )
        )
    else:
        panels.append(cards.Section(title, (cards.Text("没有有效样本。"),)))


def _note(text, blocks, panels):
    blocks.append(TextBlock(text))
    panels.append(cards.Text(text, style="caption"))


def _source(projection, label, blocks, panels):
    origin = "缓存命中" if projection.get("cache_hit") else "本次网络取数"
    stamp = projection.get("fetched_at") or "未记录"
    _note(
        f"{label}：OpenDota；{origin}；取数时间 UTC：{stamp}；缓存有效期300秒。",
        blocks,
        panels,
    )


def _group_rows(groups, key, label):
    return tuple(
        (
            label(group[key]),
            group["matches"],
            group["wins"],
            group["losses"],
            group["unknown"],
            group["wins"] + group["losses"],
            _rate(group["win_rate"]),
        )
        for group in groups
    )


def _stats(projection, timezone_name, blocks, panels):
    stats = projection["stats"]
    _fields(
        "最近 N 场实际返回样本",
        {
            "账号": projection["account_id32"],
            "请求 / 返回 / 有效": f"{stats['requested_limit']} / {stats['received_count']} / {stats['sample_count']}",
            "无效 / 重复": f"{stats['invalid_count']} / {stats['duplicate_count']}",
            "胜 / 负 / 未知": f"{stats['wins']} / {stats['losses']} / {stats['unknown']}",
            "胜率（已知胜负分母）": f"{_rate(stats['win_rate'])}（n={stats['wins'] + stats['losses']}）",
        },
        blocks,
        panels,
    )
    average_rows = []
    for key, name in (
        ("kills", "击杀"),
        ("deaths", "死亡"),
        ("assists", "助攻"),
        ("duration", "时长（秒）"),
    ):
        metric = stats["averages"][key]
        average_rows.append((name, _value(metric["value"]), metric["sample_count"]))
    _table(
        "逐项平均值（各自排除缺失值）",
        ("指标", "均值", "有效样本数"),
        average_rows,
        blocks,
        panels,
    )
    columns = ("类别", "场数", "胜", "负", "未知", "胜率分母", "胜率")
    _table(
        "本次样本英雄分布",
        columns,
        _group_rows(stats["heroes"], "hero_id", _hero),
        blocks,
        panels,
    )
    _table(
        "本次样本模式分布",
        columns,
        _group_rows(stats["modes"], "game_mode", mode_label),
        blocks,
        panels,
    )
    labels = {"turbo": "Turbo", "non_turbo": "非 Turbo", "unknown": "模式未知"}
    _table(
        "Turbo 分类（各组独立分母）",
        columns,
        _group_rows(stats["turbo_groups"], "group", lambda v: labels[v]),
        blocks,
        panels,
    )
    coverage = stats["coverage"]
    streak = stats["streak"]
    _fields(
        "样本时间与连续结果",
        {
            "已知时间样本数": str(coverage["known_time_count"]),
            "已知时间覆盖": f"{_time(coverage['oldest_start_time'], timezone_name)} 至 {_time(coverage['newest_start_time'], timezone_name)}",
            "返回顺序": "全部时间严格从新到旧"
            if coverage["chronology_confirmed"]
            else "无法确认完整先后，不推算时间线",
            "样本起始连续结果": f"{_outcome(streak['outcome'])} {streak['count']}场（限本次样本）"
            if streak["count"] is not None
            else "未知（顺序或胜负不足以确认）",
        },
        blocks,
        panels,
    )
    _note(
        "胜率=胜/(胜+负)，未知不计败；均值分别按有效值计算，不是KDA比率。仅最近N场实际样本，不代表全生涯、固定日期完整战绩或排位水平。",
        blocks,
        panels,
    )
    _source(projection, "样本来源", blocks, panels)


def _items(slots):
    return "；".join(
        f"槽{index + 1}：{'未提供' if value is None else '空' if value == 0 else '#' + str(value)}"
        for index, value in enumerate(slots)
    )


def _match(projection, timezone_name, blocks, panels):
    match = projection["match"]
    _fields(
        "比赛概况",
        {
            "比赛 ID": match["match_id"],
            "开始时间": _time(match["start_time"], timezone_name),
            "模式": mode_label(match["game_mode"]),
            "时长": _duration(match["duration"]),
            "阵营结果": "天辉胜利"
            if match["radiant_win"] is True
            else "夜魇胜利"
            if match["radiant_win"] is False
            else "胜负未知",
        },
        blocks,
        panels,
    )
    selection = projection.get("last")
    if selection is not None:
        chronology = (
            "返回有效样本时间严格从新到旧"
            if selection["coverage"]["chronology_confirmed"]
            else "无法确认完整时间顺序；选取来源列表第一条有效比赛，不推断绝对最新"
        )
        _note(
            f"该玩家上一场：在最近{selection['requested_limit']}条范围内选取第一条有效比赛；实际返回{selection['received_count']}，有效去重{selection['sample_count']}，无效{selection['invalid_count']}，重复{selection['duplicate_count']}。{chronology}。",
            blocks,
            panels,
        )
        _source(selection, "最近比赛列表", blocks, panels)
    focus = projection.get("focus")
    if focus is not None:
        if focus["status"] == "found":
            player = focus["player"]
            _fields(
                "指定玩家结算",
                {
                    "账号": focus["account_id32"],
                    "昵称": _literal(player.get("name") or "未提供"),
                    "英雄 / 阵营": f"{_hero(player['hero_id'])} / {_camp(player['player_slot'])}",
                    "胜负": _outcome(player["outcome"]),
                    "击杀 / 死亡 / 助攻": _kda(player),
                    "等级": _value(player.get("level")),
                    "GPM / XPM": f"{_value(player.get('gold_per_min'))} / {_value(player.get('xp_per_min'))}",
                    "补刀 / 反补": f"{_value(player.get('last_hits'))} / {_value(player.get('denies'))}",
                    "英雄 / 建筑伤害": f"{_value(player.get('hero_damage'))} / {_value(player.get('tower_damage'))}",
                    "治疗": _value(player.get("hero_healing")),
                },
                blocks,
                panels,
            )
            _fields(
                "最终物品槽位",
                {
                    "装备": _items(player.get("items", (None,) * 6)),
                    "背包": _items(player.get("backpack", (None,) * 3)),
                    "中立物品": _items((player.get("neutral_item"),)),
                },
                blocks,
                panels,
            )
            _note(
                "物品编号表示最终槽位，不是购买顺序或时间线。未提供的详细字段不记作0；基础响应足以展示结算，不会提交录像解析。",
                blocks,
                panels,
            )
        elif focus["status"] == "ambiguous":
            _note(
                "来源包含重复的相同账号，无法唯一定位焦点玩家；未按昵称或英雄猜测。",
                blocks,
                panels,
            )
        else:
            _note(
                f"未找到明确账号 {focus['account_id32']}；该玩家可能不在比赛中或账号未公开。列表中有{focus['anonymous_players']}名匿名/未公开玩家，无法推定其身份。",
                blocks,
                panels,
            )
    _table(
        "全场核心结算（来源最多10名）",
        ("账号 / 昵称", "英雄", "阵营", "胜负", "K / D / A"),
        (
            (
                f"{p['account_id32'] or '匿名/未公开'} / {_literal(p.get('name') or '未提供')}",
                _hero(p["hero_id"]),
                _camp(p["player_slot"]),
                _outcome(p["outcome"]),
                _kda(p),
            )
            for p in match["players"][:10]
        ),
        blocks,
        panels,
    )
    _note(
        "胜负只按来源明确阵营和结果展示；缺失字段不推断位置、责任、段位或MVP。",
        blocks,
        panels,
    )
    _source(projection, "比赛详情", blocks, panels)


def report_result(operation, projection, default_target, timezone_name):
    title = (
        "Dota 2 近期样本统计"
        if operation == "stats"
        else "Dota 2 该玩家上一场"
        if operation == "last"
        else "Dota 2 比赛摘要"
    )
    blocks: list = []
    panels: list = []
    if operation == "stats":
        _stats(projection, timezone_name, blocks, panels)
        stats = dict(projection["stats"])
        # Columnar groups retain every computed value within the Core's public
        # 512-node fact budget even for 20 distinct heroes AND 20 modes.
        for key, identity in (
            ("heroes", "hero_id"),
            ("modes", "game_mode"),
            ("turbo_groups", "group"),
        ):
            columns = (identity, "matches", "wins", "losses", "unknown", "win_rate")
            stats[key] = {
                "columns": columns,
                "rows": tuple(tuple(group[c] for c in columns) for group in stats[key]),
            }
        facts = {"account_id32": projection["account_id32"], "stats": stats}
    else:
        _match(projection, timezone_name, blocks, panels)
        match = dict(projection["match"])
        core_fields = (
            "account_id32",
            "player_slot",
            "hero_id",
            "kills",
            "deaths",
            "assists",
            "outcome",
        )
        match["players"] = tuple(
            {key: player[key] for key in core_fields} for player in match["players"]
        )
        facts = {"match": match}
        if "focus" in projection:
            facts["focus"] = projection["focus"]
        if "last" in projection:
            facts["selection"] = projection["last"]
    facts["data_source"] = {
        "name": "OpenDota",
        "fetched_at": projection.get("fetched_at"),
        "cache_hit": bool(projection.get("cache_hit")),
    }
    document = ygl.DisplayDocument(
        title,
        "Dota 2 / OpenDota",
        tuple(blocks),
        sources=("OpenDota",),
        card=cards.Document(
            title,
            tuple(panels),
            brand="游戏连结 · Dota 2",
            sources=("OpenDota · 有限公开样本",),
        ),
    )
    return ygl.CapabilityResult(
        result_id=f"steam-dlc-dota2-{operation}",
        status=ygl.ResultStatus.SUCCESS,
        document=document,
        model_facts=None
        if default_target
        else ygl.FactDocument(facts, sources=("OpenDota",)),
        privacy=ygl.Privacy.PUBLIC,
    )

"""Finite factual labels; unfamiliar codes remain visible without inference.

Mode identifiers:
https://github.com/odota/dotaconstants/blob/master/build/game_mode.json
Rank encoding (rankTierToString) and names:
https://github.com/odota/web/blob/master/src/utility.tsx
https://github.com/odota/web/blob/master/src/lang/en-US.json
These sources identify medals, not an MMR conversion. Only the current ordinary
1..5 star medals and the special 80 Immortal code are labeled; other raw rank
codes retain an explicit unknown fallback.
"""

from __future__ import annotations

_MODES = {
    1: "全英雄选择 (All Pick)",
    2: "队长模式 (Captains Mode)",
    3: "随机征召 (Random Draft)",
    4: "单一征召 (Single Draft)",
    5: "全随机 (All Random)",
    6: "入门 (Intro)",
    7: "夜魇暗潮 (Diretide)",
    8: "反向队长模式 (Reverse Captains Mode)",
    9: "贪魔活动 (Greeviling)",
    10: "教程 (Tutorial)",
    11: "中路模式 (Mid Only)",
    12: "最少使用英雄 (Least Played)",
    13: "限定英雄 (Limited Heroes)",
    14: "指南匹配 (Compendium Matchmaking)",
    15: "自定义 (Custom)",
    16: "队长征召 (Captains Draft)",
    17: "平衡征召 (Balanced Draft)",
    18: "技能征召 (Ability Draft)",
    19: "活动 (Event)",
    20: "全随机死亡竞赛 (All Random Death Match)",
    21: "中路 1 对 1 (1v1 Mid)",
    22: "全英雄征召 (All Draft)",
    23: "加速模式 (Turbo)",
    24: "突变模式 (Mutation)",
    25: "教练挑战 (Coaches Challenge)",
}
_RANKS = {
    1: "先锋 (Herald)",
    2: "卫士 (Guardian)",
    3: "中军 (Crusader)",
    4: "统帅 (Archon)",
    5: "传奇 (Legend)",
    6: "万古流芳 (Ancient)",
    7: "超凡入圣 (Divine)",
}


def mode_label(game_mode: int | None) -> str:
    if isinstance(game_mode, bool) or not isinstance(game_mode, int):
        return "未知模式"
    return _MODES.get(game_mode, f"未知模式 (代码 {game_mode})")


def known_mode(game_mode: int | None) -> bool:
    """Whether a code is a recognized non-unknown mode in our finite snapshot."""
    return not isinstance(game_mode, bool) and game_mode in _MODES


def rank_label(rank_tier: int | None) -> str:
    if isinstance(rank_tier, bool) or not isinstance(rank_tier, int):
        return "未知段位"
    if rank_tier == 0:
        return "未定级 (Uncalibrated)"
    if rank_tier == 80:
        return "冠绝一世 (Immortal)"
    medal, stars = divmod(rank_tier, 10)
    if medal in _RANKS and 1 <= stars <= 5:
        return f"{_RANKS[medal]} {stars} 星"
    return f"未知段位 (代码 {rank_tier})"

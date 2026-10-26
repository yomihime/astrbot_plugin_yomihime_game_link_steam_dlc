"""One Steam projection supplies literal SDK cards, fallback text and facts."""

import yomihime_game_link_sdk as ygl
from yomihime_game_link_sdk import cards


def _label(value):
    return {
        "steam_store": "Steam 商店",
        "steam_community": "Steam 社区",
        "bounded_store_candidates": "本次商店候选",
        "current_regional_store_details": "当前地区商店详情",
        "public_homepage_recent_display_sample": "公开主页近期展示样本",
        "deprecated_xml_most_played_sample": "旧版资料接口常玩样本",
        "hit": "已使用缓存",
        "miss": "本次新获取",
        "bypassed": "本次直接获取",
        "rejected": "缓存校验未通过，已重新获取",
        "unavailable": "缓存暂不可用",
        "expired": "缓存已过期，已重新获取",
        "game": "游戏",
        "dlc": "追加内容",
        "demo": "试玩版",
        "music": "音乐",
        "video": "视频",
        "advertising": "宣传内容",
        "mod": "模组",
        "series": "系列",
        "episode": "单集",
        "tool": "工具",
        "application": "应用",
    }.get(value, "未知")


def _boolean(value):
    return "是" if value is True else "否" if value is False else "未提供"


def _value(value):
    return "未提供" if value is None else str(value)


def result(projection, *, default_target=False, asset=None):
    operation, data = projection["operation"], projection["data"]
    lines: list[str] = []
    if operation == "search":
        title = "Steam · 商店搜索"
        rows = data["candidates"]
        lines.extend(
            f"{_value(row['name'])} · AppID {row['app_id']} · /ygl steam app {row['app_id']}"
            for row in rows
        )
        if not rows:
            lines.append("未找到匹配的商店候选。")
        else:
            lines.append("请用明确的 AppID 选择详情；此处展示本次返回的商店候选。")
        status = (
            ygl.ResultStatus.NEEDS_SELECTION
            if len(rows) > 1
            else ygl.ResultStatus.SUCCESS
        )
    elif operation == "app":
        title = f"Steam · {_value(data['name'])}"
        state = {
            "free": "免费",
            "priced": _value(data["price_display"]) + " " + _value(data["currency"]),
            "unreleased": "未发售，未提供当前价格",
            "no_local_price": "未提供本地区价格",
        }[data["price_state"]]
        lines.extend(
            (
                f"AppID：{data['app_id']} · 类型：{_label(data['type'])}",
                f"当前价格：{state} · 折扣：{_value(data['discount_percent'])}%",
                f"发行：{_value(data['release_date'])} · 即将推出：{_boolean(data['coming_soon'])}",
                f"开发：{', '.join(data['developers']) if data['developers'] else '未提供'}",
                f"发行商：{', '.join(data['publishers']) if data['publishers'] else '未提供'}",
            )
        )
        for row in data.get("review_summaries") or []:
            lines.append(
                f"评价 [{row['scope']}]：{row['summary']} · {_value(row['description'])}"
            )
        if not data.get("review_summaries"):
            lines.append("评价摘要：未提供。")
        lines.extend(
            (data["store_url"], "价格为当前所选地区数据；历史最低价需另行查询。")
        )
        if asset is None:
            lines.append("封面暂不可用，已保留文字详情。")
        status = ygl.ResultStatus.SUCCESS
    else:
        profile = data["profile"]
        title = f"Steam · {_value(profile['nickname'])}"
        lines.extend(
            (
                f"SteamID64：{profile['steam_id64']}",
                f"Steam 等级：{_value(profile['level'])}",
                profile["profile_url"],
            )
        )
        if asset is None:
            lines.append("头像暂不可用，已保留文字资料。")
        if operation in ("recent", "games"):
            lines.append(
                "主页最近展示样本（最多3款）"
                if operation == "recent"
                else "旧版资料接口常玩样本（最多5款）"
            )
            for game in data["games"]:
                lines.append(
                    f"{_value(game['name'])} · AppID {_value(game['app_id'])} · 累计显示 {_value(game['hours_on_record'])} 小时 · 近期子项 {_value(game['hours_recent'])} 小时"
                )
                if game.get("display_text"):
                    lines.append(game["display_text"])
            if not data["games"]:
                lines.append("来源暂无公开游戏样本，完整游戏库与游玩记录仍待确认。")
        status = ygl.ResultStatus.PARTIAL_SUCCESS
    lines.append(
        f"来源：{_label(projection['source'])} · 范围：{_label(projection['scope'])}"
    )
    lines.append(
        f"地区：{projection['region']} · 语言：{projection['language']} · 来源时间：{projection['fetched_at']}"
    )
    lines.append(
        f"缓存：{_label(projection['cache']['status'])} · 原始获取时间：{projection['cache']['fetched_at']}"
    )
    lines.extend(projection.get("warnings", []))
    # Capability privacy is fixed PUBLIC, matching explicit account commands.
    # Default selection stays isolated by owner cache and the whole facts=None.
    privacy = ygl.Privacy.PUBLIC
    blocks = tuple(ygl.TextBlock(line) for line in lines)
    panels = ([cards.Image(asset, height=160)] if asset else []) + [
        cards.Text(line) for line in lines
    ]
    return ygl.CapabilityResult(
        "steam-query",
        status,
        document=ygl.DisplayDocument(
            title,
            "Steam DLC",
            blocks,
            privacy=privacy,
            card=cards.Document(title, tuple(panels), sources=(projection["source"],)),
        ),
        model_facts=None
        if default_target
        else ygl.FactDocument(projection, sources=(projection["source"],)),
        provenance=(projection["source"],),
        privacy=privacy,
        warnings=tuple(projection.get("warnings", [])),
    )

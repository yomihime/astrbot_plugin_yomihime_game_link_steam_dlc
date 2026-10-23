"""Literal collage declaration and compact facts from one normalized selection."""

import yomihime_game_link_sdk as ygl
from yomihime_game_link_sdk import cards
from yomihime_game_link_sdk.storage import CacheVisibility


def result(selection, *, private=True, theme="warm_paper"):
    privacy = ygl.Privacy.PRIVATE if private else ygl.Privacy.PUBLIC
    counts = selection["counts"]
    kind = "全部应用（含软件及未知类型）" if selection["all_apps"] else "仅已确认游戏"
    coverage = (
        "主页最近展示样本（最多3项）"
        if selection["scope"] == "public_homepage_recent_display_sample"
        else "XML mostPlayedGames 公开样本（最多5项）"
    )
    lines = [
        "公开样本海报；不是完整游戏库。",
        f"{coverage}；{kind}。",
        f"来源原始时间：{selection['fetched_at']}",
        "按累计时长平方根分配面积；同面积分档可能并列，等时长按AppID排序；等比cover可裁边，不拉伸。",
        f"来源{counts['source_rows']}项，去重后{counts['unique']}项，符合{counts['eligible']}项，筛除{counts['filtered']}项，本次{counts['included']}项，limit截取{counts['limited']}项。",
        f"精度：网页显示小时{counts['displayed_hours']}项、API原始分钟{counts['api_minutes']}项；网页小时换算分钟仅用于权重，不提升来源精度。",
        f"未知类型{counts['unknown_type']}项，非游戏{counts['non_game']}项，未知时长{counts['unknown_duration']}项，未游玩{counts['zero_duration']}项；这些计数可交叉。",
        f"重复{counts['duplicates']}项，冲突{counts['duplicate_conflicts']}项；缺图{counts['missing_images']}项使用备用块。",
    ]
    if counts.get("metadata_unexamined"):
        lines.append(
            f"另有{counts['metadata_unexamined']}项未在本次200项元数据预算内验证类型；不声称完整覆盖。"
        )
    counters = selection["counters"]
    lines.append(
        "请求：列表{list_requests} / 元数据{metadata_requests} / 图片{image_requests}。".format(
            list_requests=counters.get("list_requests", 0),
            metadata_requests=counters.get("metadata_requests", 0),
            image_requests=counters.get("image_requests", 0),
        )
    )
    if counters.get("rate_limited"):
        lines.append(
            f"Steam限流，遵守Retry-After（{counters.get('retry_after', 0)}秒）；本次仅使用已有缓存或备用块。"
        )
    if counters.get("stale_metadata") or counters.get("stale_images"):
        lines.append(
            "上游暂不可用，部分素材使用已验证的旧缓存；来源时间未伪装为本次获取。"
        )
    lines.extend(
        f"{index}. {row['name']} · AppID {row['app_id']} · 累计{row['duration']} · {row['app_type']}"
        for index, row in enumerate(selection["rows"], 1)
    )
    if not selection["rows"]:
        lines.append("来源中没有满足本次条件的已知正时长项；不表示空库或零游玩。")
    items = tuple(
        cards.CollageItem(
            row["app_id"],
            row["weight"],
            image=cards.ResourceImage(
                row["asset_id"],
                visibility=CacheVisibility.PUBLIC,
                alt=row["name"],
                required=False,
            )
            if row["asset_id"]
            else None,
            title=row["name"],
            caption=row["duration"],
        )
        for row in selection["rows"]
    )
    card = (
        cards.Document(
            "Steam · 公开样本海报",
            (cards.WeightedCollage(items),),
            subtitle=f"{kind} · {counts['included']}项 · 累计时长平方根权重",
            sources=(coverage, str(selection["fetched_at"])),
            theme=theme,
        )
        if items
        else None
    )
    facts = (
        None
        if private
        else ygl.FactDocument(
            {
                "scope": selection["scope"],
                "complete_library": False,
                "fetched_at": selection["fetched_at"],
                "counts": counts,
                "weight_rule": selection["rule"],
                "all_apps": selection["all_apps"],
                "requests": counters,
            },
            sources=("steam_community", "steam_browse"),
        )
    )
    return ygl.CapabilityResult(
        "steam-wall",
        ygl.ResultStatus.PARTIAL_SUCCESS,
        document=ygl.DisplayDocument(
            "Steam · 公开样本海报",
            "Steam DLC",
            (ygl.TextBlock("\n".join(lines)),),
            privacy=privacy,
            card=card,
        ),
        privacy=privacy,
        model_facts=facts,
        provenance=("steam_community", "steam_browse"),
    )

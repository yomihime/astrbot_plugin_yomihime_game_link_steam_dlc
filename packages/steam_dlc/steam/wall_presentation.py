"""Literal collage declaration and compact facts from one normalized selection."""

import yomihime_game_link_sdk as ygl
from yomihime_game_link_sdk import cards
from yomihime_game_link_sdk.storage import CacheVisibility


def _legacy_result(selection, *, private=True, theme="warm_paper"):
    privacy = ygl.Privacy.PRIVATE if private else ygl.Privacy.PUBLIC
    counts = selection["counts"]
    eligible_label = (
        "符合" if selection.get("eligible_complete", True) else "已确认符合"
    )
    full = selection.get("complete_library", False)
    owned = selection["scope"] == "webapi_owned_games"
    title = (
        "Steam · 完整库旧版海报"
        if full
        else "Steam · 游戏库旧版海报（覆盖待核对）"
        if owned
        else "Steam · 公开样本海报"
    )
    sources = ("steam_api" if owned else "steam_community", "steam_browse")
    kind = "全部应用（含软件及未知类型）" if selection["all_apps"] else "仅已确认游戏"
    coverage = (
        "Steam Web API完整库"
        if full
        else "Steam Web API返回库条目（覆盖不完整）"
        if selection["scope"] == "webapi_owned_games"
        else "主页最近展示样本（最多3项）"
        if selection["scope"] == "public_homepage_recent_display_sample"
        else "XML mostPlayedGames 公开样本（最多5项）"
    )
    lines = [
        "完整来源旧版海报；入图数量仍受筛选及预算限制。"
        if full
        else "游戏库返回条目旧版海报；来源覆盖不完整，入图数量另受筛选及预算限制。"
        if owned
        else "公开样本海报；不是完整游戏库。",
        f"{coverage}；{kind}。",
        f"来源原始时间：{selection['fetched_at']}",
        "按累计时长平方根分配面积；同面积分档可能并列，等时长按AppID排序；等比cover可裁边，不拉伸。",
        f"来源{counts['source_rows']}项，去重后{counts['unique']}项，{eligible_label}{counts['eligible']}项，已确认筛除{counts['filtered']}项，本次{counts['included']}项，已知limit截取{counts['limited']}项。",
        f"精度：网页显示小时{counts['displayed_hours']}项、API原始分钟{counts['api_minutes']}项；网页小时换算分钟仅用于权重，不提升来源精度。",
        f"未知类型{counts['unknown_type']}项，非游戏{counts['non_game']}项，未知时长{counts['unknown_duration']}项，未游玩{counts['zero_duration']}项；这些计数可交叉。",
        f"重复{counts['duplicates']}项，冲突{counts['duplicate_conflicts']}项；缺图{counts['missing_images']}项使用备用块。",
    ]
    if counts.get("metadata_unexamined"):
        lines.append(
            f"另有{counts['metadata_unexamined']}项尚未验证类型；不声称分类完整。"
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
            f"{int(row['app_id']):010d}",
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
    visible_sources = [
        coverage
        + ("；入图数量与来源完整性分别计数。" if full else "；不是完整游戏库。"),
        f"来源{counts['source_rows']}项 · 去重后{counts['unique']}项 · {eligible_label}{counts['eligible']}项 · 本次纳入{counts['included']}项 · 已确认筛除{counts['filtered']}项 · 已知limit截取{counts['limited']}项",
        f"未知类型{counts['unknown_type']}项 · 未知时长{counts['unknown_duration']}项 · 未游玩{counts['zero_duration']}项；分类计数可交叉。",
        f"缺图{counts['missing_images']}项使用备用块。",
        "权重=sqrt(累计分钟)；比例受限、尺寸分档，面积非递减，非精确比例。",
        "等比cover有界裁边，不拉伸；网页显示小时换算仅用于权重，精度不提升。",
        f"来源原始时间：{selection['fetched_at']}",
    ]
    if counts.get("metadata_unexamined"):
        visible_sources.append(
            f"另有{counts['metadata_unexamined']}项未在本次元数据预算内验证类型。"
        )
    card = (
        cards.Document(
            title,
            (cards.WeightedCollage(items),),
            subtitle=f"{kind} · {counts['included']}项 · 累计时长平方根权重",
            sources=tuple(visible_sources),
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
                "complete_library": full,
                "fetched_at": selection["fetched_at"],
                "counts": counts,
                "weight_rule": selection["rule"],
                "all_apps": selection["all_apps"],
                "requests": counters,
            },
            sources=sources,
        )
    )
    return ygl.CapabilityResult(
        "steam-wall",
        ygl.ResultStatus.SUCCESS
        if full and selection["all_eligible_included"] and not counts["missing_images"]
        else ygl.ResultStatus.PARTIAL_SUCCESS,
        document=ygl.DisplayDocument(
            title,
            "Steam DLC",
            (ygl.TextBlock("\n".join(lines)),),
            privacy=privacy,
            card=card,
        ),
        privacy=privacy,
        model_facts=facts,
        provenance=sources,
    )


def result(selection, *, private=True, theme="warm_paper", avatar=None):
    if selection.get("mode", "legacy") == "legacy":
        return _legacy_result(selection, private=private, theme=theme)
    from decimal import Decimal

    from .career import grid_spec

    privacy = ygl.Privacy.PRIVATE if private else ygl.Privacy.PUBLIC
    counts = selection["counts"]
    full = selection["complete_library"]
    coverage = (
        ("Steam Web API完整库" if full else "Steam Web API返回库条目（覆盖不完整）")
        if selection["scope"] == "webapi_owned_games"
        else "主页最近展示样本（最多3项），不是完整游戏库"
        if selection["scope"] == "public_homepage_recent_display_sample"
        else "XML公开样本（最多5项），不是完整游戏库"
    )
    kind = "包含游戏、软件及未知类型" if selection["all_apps"] else "仅已确认游戏"
    hours = sum((Decimal(row["minutes"]) for row in selection["rows"]), Decimal(0)) / 60
    title = (
        "Steam · 游戏生涯拼图"
        if full
        else "Steam · 游戏库拼图（覆盖待核对）"
        if selection["scope"] == "webapi_owned_games"
        else "Steam · 样本拼图"
    )
    profile = selection.get("profile") or {}
    nickname = (
        selection.get("nickname")
        or profile.get("nickname")
        or "Steam 玩家（昵称未提供）"
    )
    eligible_label = (
        "eligible" if selection.get("eligible_complete", True) else "known eligible"
    )
    summary = f"requested {counts['requested']} · {eligible_label} {counts['eligible']} · included {counts['included']} · known omitted {counts['omitted']}"
    classification = f"已检查类型{counts.get('examined', 0)}项 · 未检查{counts.get('unexamined', 0)}项 · 已查仍未知{counts.get('classification_unknown', 0)}项。"
    rule = f"预设{selection['preset']} · {selection['aspect']} · {selection['quality']} · 整数倍率1–8，锚点间插值面积后量化；物理密排补空，逻辑同分按数值AppID。"
    fit_note = (
        "等比cover会裁剪封面；不拉伸。"
        if selection["fit"] == "cover"
        else "等比contain保留完整封面，空白由背景填充；不拉伸。"
    )
    lines = [
        coverage + "；" + kind + "。",
        summary,
        classification,
        f"入图作品{counts['included']}项 · 入图累计{hours:.1f}小时（仅本次筛选口径）。",
        f"来源时间：{selection['fetched_at']}",
        rule,
        fit_note,
        f"来源{counts['source_rows']}项，去重{counts['unique']}项；未知时长{counts['unknown_duration']}项，0时长{counts['zero_duration']}项默认排除；缺图{counts['missing_images']}项保留备用块。",
        f"未知类型{counts['unknown_type']}项；未验证元数据{counts['metadata_unexamined']}项。",
        f"过长标题{counts.get('names_truncated', 0)}项截短显示，AppID保持完整。",
    ]
    counters = selection["counters"]
    lines.append(
        f"请求：列表{counters.get('list_requests', 0)} / 元数据{counters.get('metadata_requests', 0)} / 图片{counters.get('image_requests', 0)}。"
    )
    lines.extend(
        f"{index}. {row['name']} · AppID {row['app_id']} · {row['duration']} · {row['app_type']} · 倍率{row['span']}"
        for index, row in enumerate(selection["rows"], 1)
    )
    if not selection["rows"]:
        lines.append(
            "没有符合本次筛选的已知正时长项；请核对来源覆盖与类型，不将缺失视为空库。"
        )
    width, height = grid_spec(selection["aspect"], selection["quality"])
    items = tuple(
        cards.DenseCollageItem(
            row["app_id"],
            row["span"],
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
            title,
            (
                cards.DenseCollage(
                    items,
                    cell_width=width,
                    cell_height=height,
                    max_height=height * 32,
                    fit=selection["fit"],
                ),
            ),
            width=width * 20,
            subtitle=f"{nickname} · {counts['included']}项 · 入图累计{hours:.1f}小时",
            sources=(
                coverage + "；" + kind,
                summary,
                classification,
                rule,
                fit_note,
                f"来源时间：{selection['fetched_at']} · 缺图{counts['missing_images']}项备用块",
            ),
            theme=theme,
            logo=avatar,
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
                "complete_library": full,
                "all_eligible_included": selection["all_eligible_included"],
                "counts": counts,
                "preset": selection["preset"],
                "aspect": selection["aspect"],
                "requests": counters,
            },
            sources=(
                "steam_api"
                if selection["scope"] == "webapi_owned_games"
                else "steam_community",
                "steam_browse",
            ),
        )
    )
    status = (
        ygl.ResultStatus.SUCCESS
        if full and selection["all_eligible_included"] and not counts["missing_images"]
        else ygl.ResultStatus.PARTIAL_SUCCESS
    )
    return ygl.CapabilityResult(
        "steam-wall",
        status,
        document=ygl.DisplayDocument(
            title,
            "Steam DLC",
            (ygl.TextBlock("\n".join(lines)),),
            privacy=privacy,
            card=card,
        ),
        privacy=privacy,
        model_facts=facts,
        provenance=(
            "steam_api"
            if selection["scope"] == "webapi_owned_games"
            else "steam_community",
            "steam_browse",
        ),
    )

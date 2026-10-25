"""Pure, minimized projections of observed Perfect World / 5E response fields."""

import re
from copy import deepcopy
from datetime import UTC, datetime
from math import isfinite
from urllib.parse import urlsplit

from .contracts import (
    PROVIDERS,
    SCHEMA_VERSION,
    SchemaError,
    account_id,
    game_id,
    limit_value,
    platform_id,
    season_value,
    steam_id,
)


def _object(value):
    return value if isinstance(value, dict) else {}


def _text(value, maximum=256):
    return value if type(value) is str and len(value) <= maximum else None


def _number(value, *, integer=False):
    if type(value) is str and re.fullmatch(r"-?[0-9]+(?:\.[0-9]+)?", value):
        try:
            value = float(value) if "." in value else int(value)
        except (ValueError, OverflowError):
            return None
    if type(value) not in (int, float):
        return None
    try:
        if not isfinite(value) or (integer and value != int(value)):
            return None
    except (ValueError, OverflowError):
        return None
    return int(value) if integer else value


def _url(value):
    value = _text(value, 2048)
    if value is None:
        return None
    try:
        parsed = urlsplit(value)
        if parsed.scheme == "https" and parsed.netloc and not parsed.username:
            return value
    except ValueError:
        pass
    return None


def _availability(value):
    if isinstance(value, dict):
        return {key: _availability(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_availability(item) for item in value]
    return "unknown" if value is None else "available"


def _target(target, platform):
    return {
        "id_type": "fivee_domain" if platform == "5e" else "steam_id64",
        "id": target,
    }


def _project(
    kind,
    platform,
    target,
    data,
    *,
    season=None,
    fetched_at=None,
    coverage=None,
    detail_level="aggregate",
    unavailable_reason=None,
):
    platform_id(platform)
    return {
        "schema_version": SCHEMA_VERSION,
        "provider": PROVIDERS[platform],
        "platform": platform,
        "kind": kind,
        "target": _target(target, platform) if target is not None else None,
        "season": season,
        "fetched_at": fetched_at or datetime.now(UTC).isoformat(),
        "coverage": coverage
        or ("recorded_official" if platform == "official" else "platform_recorded"),
        "detail_level": detail_level,
        "unavailable_reason": unavailable_reason,
        "data": data,
        "field_availability": _availability(data),
    }


def _identity(data, target, platform):
    expected = account_id(target, platform)
    actual = (
        _object(data.get("user")).get("domain")
        if platform == "5e"
        else data.get("steamId")
    )
    if actual != expected:
        raise SchemaError("Profile identity missing or mismatched")
    return expected


def _metrics(data, platform):
    mapping = (
        {
            "matches": "match_total",
            "kd": "kd",
            "rating": "rating",
            "rws": "rws",
            "adr": "adr",
            "win_rate": "per_win_match",
            "pw_rating": "pw_rating",
        }
        if platform == "5e"
        else {
            "matches": "cnt",
            "kd": "kd",
            "rating": "rating",
            "pw_rating": "pwRating",
            "rws": "rws",
            "adr": "adr",
            "win_rate": "winRate",
        }
    )
    return {
        key: _number(data.get(field), integer=key == "matches")
        for key, field in mapping.items()
    }


def normalize_profile(
    payload, target, *, platform="perfect", season=None, fetched_at=None
):
    if not isinstance(payload, dict):
        raise SchemaError("Expected a profile object")
    target = _identity(payload, target, platform)
    selected_season = season_value(season, platform)
    if platform == "5e":
        user = _object(payload.get("user"))
        season_data = _object(payload.get("season_data"))
        try:
            actual_season = season_value(season_data.get("now_season_v1"), "5e")
        except ValueError:
            actual_season = None
        # Homepage rank stays current-season when a separate stats season is requested.
        rank_rows = season_data.get("season_list")
        rank_rows = rank_rows if isinstance(rank_rows, list) else []
        rank: dict[str, object] = next(
            (
                _object(row)
                for row in rank_rows
                if _number(_object(row).get("match_type"), integer=True) == 9
            ),
            {},
        )
        rank_data = {
            "system": "fivee_level",
            "value": _text(rank.get("level_name")),
            "score": _number(rank.get("elo")),
            "season": actual_season,
        }
        metrics = _metrics(_object(payload.get("career_data")), platform)
        nickname, avatar = user.get("username"), user.get("avatar_url")
        selected_season = actual_season
        metric_scope = "career_aggregate"
    else:
        actual_season = _text(payload.get("seasonId"))
        if selected_season and actual_season != selected_season:
            raise SchemaError("Requested season does not match profile season")
        selected_season = actual_season if platform == "perfect" else None
        rank_data = {
            "system": "perfect_pvp_rank"
            if platform == "perfect"
            else "official_competitive_rank",
            "value": _number(
                payload.get("pvpRank" if platform == "perfect" else "rank"),
                integer=True,
            ),
            "score": _number(payload.get("pvpScore"))
            if platform == "perfect"
            else None,
            "season": selected_season,
        }
        metrics = _metrics(payload, platform)
        nickname = payload.get("name" if platform == "perfect" else "nickName")
        avatar = payload.get("avatar")
        metric_scope = "season_aggregate" if selected_season else "source_aggregate"
    data = {
        "account_id": target,
        "steam_id64": target if platform != "5e" else None,
        "domain": target if platform == "5e" else None,
        "nickname": _text(nickname),
        "avatar_url": _url(avatar),
        "rank": rank_data,
        "metrics": metrics,
        "metric_scope": metric_scope,
    }
    return _project(
        "profile", platform, target, data, season=selected_season, fetched_at=fetched_at
    )


def _summary(row, target, platform):
    if not isinstance(row, dict):
        raise SchemaError("Expected a match summary object")
    fivee = platform == "5e"
    try:
        match_id = game_id(row.get("match_id" if fivee else "matchId"), platform)
    except ValueError:
        raise SchemaError("Source match identity missing or invalid") from None
    if not fivee:
        if row.get("playerId") is not None and row["playerId"] != target:
            raise SchemaError("Match summary player identity mismatch")
        source_id = row.get("dataSource")
        if type(source_id) is not int or source_id != (
            3 if platform == "perfect" else 1
        ):
            raise SchemaError("Match summary source mismatch")
    else:
        source_id = "5e"
    score_fields = (
        ("group1_all_score", "group2_all_score") if fivee else ("score1", "score2")
    )
    result = None
    if fivee and row.get("is_win") in ("0", "1"):
        result = "win" if row["is_win"] == "1" else "loss"
    elif not fivee and type(row.get("team")) is int and type(row.get("winTeam")) is int:
        if row["winTeam"] in (1, 2) and row["team"] in (1, 2):
            result = "win" if row["team"] == row["winTeam"] else "loss"
        elif row["winTeam"] == 0:
            result = "draw"
    return {
        "match_id": match_id,
        "platform": platform,
        "source_data_id": source_id,
        "map": _text(row.get("map" if fivee else "mapName")),
        "start_time": _text(row.get("start_time" if fivee else "startTime")),
        "end_time": _text(row.get("end_time" if fivee else "endTime")),
        "scores": [_number(row.get(field), integer=True) for field in score_fields],
        "kills": _number(row.get("kill"), integer=True),
        "deaths": _number(row.get("death"), integer=True),
        "assists": _number(row.get("assist"), integer=True),
        "rating": _number(row.get("rating")),
        "pw_rating": _number(row.get("pwRating")),
        "rws": _number(row.get("rws")),
        "result": result,
        "season": _text(row.get("season" if fivee else "seasonId")),
        "focus": _target(target, platform),
    }


def _sort_time(value):
    if value is None:
        return (0, "")
    if value.isascii() and value.isdecimal():
        return (2, value.zfill(20))
    return (1, value)


def normalize_recent(
    payload, target, *, platform="perfect", limit=5, fetched_at=None, include_all=False
):
    limit_value(limit)
    target = account_id(target, platform)
    if not isinstance(payload, dict):
        raise SchemaError("Expected a match history object")
    if platform == "5e":
        _identity(payload, target, platform)
        rows = payload.get("match_data")
    else:
        if payload.get("dataPublic") is False:
            raise SchemaError("private_profile")
        if payload.get("dataPublic") is not True:
            raise SchemaError("Match visibility is missing")
        rows = payload.get("matchList")
    if not isinstance(rows, list) or len(rows) > 500:
        raise SchemaError("Match history missing or excessive")
    items = [_summary(row, target, platform) for row in rows]
    items.sort(
        key=lambda item: (
            _sort_time(item["end_time"] or item["start_time"]),
            item["match_id"],
        ),
        reverse=True,
    )
    unique: dict[str, dict[str, object]] = {}
    for item in items:
        previous = unique.get(item["match_id"])
        if previous is not None and previous != item:
            raise SchemaError("Conflicting duplicate match identity")
        unique[item["match_id"]] = item
    selected = list(unique.values())
    return _project(
        "recent",
        platform,
        target,
        {
            "matches": selected if include_all else selected[:limit],
            "available_matches": len(selected),
            "limit": limit,
        },
        fetched_at=fetched_at,
        coverage="recent_player_summary" if platform == "5e" else "recent_first_page",
        detail_level="player_summary",
    )


def normalize_match(
    payload, match_id, *, platform="perfect", focus=None, fetched_at=None
):
    if platform != "perfect" or not isinstance(payload, dict):
        raise SchemaError("Full detail is only verified for perfect")
    match_id = game_id(match_id, platform)
    base = _object(payload.get("base"))
    if base.get("matchId") != match_id:
        raise SchemaError("Returned match identity mismatch")
    rows = payload.get("players")
    if not isinstance(rows, list) or not 1 <= len(rows) <= 64:
        raise SchemaError("Full match roster missing or excessive")
    players = []
    for row in rows:
        if not isinstance(row, dict):
            raise SchemaError("Invalid match roster row")
        try:
            player = steam_id(row.get("playerId"))
        except ValueError:
            raise SchemaError("Invalid match player identity") from None
        players.append(
            {
                "account_id": player,
                "nickname": _text(row.get("nickName")),
                "avatar_url": _url(row.get("avatar")),
                **{
                    key: _number(
                        row.get(source),
                        integer=key in ("kills", "deaths", "assists", "team"),
                    )
                    for key, source in {
                        "kills": "kill",
                        "deaths": "death",
                        "assists": "assist",
                        "team": "team",
                        "rating": "rating",
                        "pw_rating": "pwRating",
                        "rws": "rws",
                        "adr": "adpr",
                    }.items()
                },
            }
        )
    if len({player["account_id"] for player in players}) != len(players):
        raise SchemaError("Duplicate match player identity")
    selected = None
    if focus is not None:
        focus = account_id(focus, platform)
        selected = next(
            (player for player in players if player["account_id"] == focus), None
        )
        if selected is None:
            raise SchemaError("Focus is absent from the returned match roster")
    return _project(
        "match",
        platform,
        focus,
        {
            "match_id": match_id,
            "map": _text(base.get("mapEn") or base.get("map")),
            "start_time": _text(base.get("startTime")),
            "end_time": _text(base.get("endTime")),
            "scores": [
                _number(base.get(key), integer=True) for key in ("score1", "score2")
            ],
            "players": players,
            "focus": selected,
        },
        fetched_at=fetched_at,
        detail_level="full_match",
    )


def select_summary(recent, match_id):
    selected = next(
        (row for row in recent["data"]["matches"] if row["match_id"] == match_id), None
    )
    if selected is None:
        raise SchemaError("match_not_in_recent_sample")
    result = deepcopy(recent)
    result["kind"] = "match"
    result["data"] = {**selected, "players": None}
    result["detail_level"] = "player_summary"
    result["coverage"] = "recent_player_summary"
    result["unavailable_reason"] = "full_match_detail_unavailable"
    result["field_availability"] = _availability(result["data"])
    return result


def project_stats(profile):
    result = deepcopy(profile)
    result["kind"] = "stats"
    return result


def normalize_season_stats(payload, profile, season, *, platform="5e", fetched_at=None):
    if platform != "5e" or not isinstance(payload, dict):
        raise SchemaError("Expected a 5E season response")
    if not isinstance(payload.get("match_detail"), dict):
        raise SchemaError("5E season statistics missing")
    # The reference model omits identity here; associate with the validated
    # homepage and exact request path, and reject any contradictory identity.
    target = profile["target"]["id"]
    for key in ("domain", "user"):
        if key in payload:
            actual = (
                payload[key] if key == "domain" else _object(payload[key]).get("domain")
            )
            if actual != target:
                raise SchemaError("5E season response identity mismatch")
    data = {
        "account_id": target,
        "domain": target,
        "steam_id64": None,
        "nickname": profile["data"]["nickname"],
        "avatar_url": profile["data"]["avatar_url"],
        "metrics": _metrics(payload["match_detail"], "5e"),
        "metric_scope": "requested_season_aggregate",
        "identity_evidence": "validated_homepage_and_request_path",
    }
    return _project(
        "stats",
        platform,
        target,
        data,
        season=season_value(season, platform),
        fetched_at=fetched_at,
        coverage="season_aggregate",
    )

"""Memory-only Leetify projections; no storage or metric rescaling."""

from datetime import UTC, datetime
from math import isfinite
from uuid import UUID

from ..shared.steam_ids import parse_steam_id

SCHEMA_VERSION = "cs2.leetify.v1"
SOURCE = "leetify"
SCOPE = "Leetify已收录可见数据"
ATTRIBUTION = "Data Provided by Leetify"
GUIDELINES = "https://leetify.com/blog/leetify-api-developer-guidelines/"


class SchemaError(ValueError):
    """Upstream data cannot support the requested projection."""


def steam_id(value):
    if type(value) is not str or not value.isdecimal():
        raise ValueError("Expected a SteamID64 string")
    return parse_steam_id(value)


def game_id(value):
    if type(value) is not str:
        raise ValueError("Expected a Leetify match UUID")
    try:
        parsed = str(UUID(value))
    except ValueError:
        raise ValueError("Expected a Leetify match UUID") from None
    if parsed != value:
        raise ValueError("Expected a canonical Leetify match UUID")
    return parsed


def _fields(payload, numeric=(), textual=()):
    payload = payload if isinstance(payload, dict) else {}
    return {
        **{k: _finite_number(payload.get(k)) for k in numeric},
        **{
            k: v if type(v := payload.get(k)) is str and len(v) <= 256 else None
            for k in textual
        },
    }


def _finite_number(value):
    if type(value) not in (int, float):
        return None
    try:
        return value if isfinite(value) else None
    except OverflowError:
        return None


def _availability(value):
    if isinstance(value, dict):
        return {key: _availability(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_availability(item) for item in value]
    return "available" if value is not None else "unknown"


def _project(kind, data, url, fetched_at):
    return {
        "schema_version": SCHEMA_VERSION,
        "source": SOURCE,
        "scope": SCOPE,
        "fetched_at": fetched_at or datetime.now(UTC).isoformat(),
        "cache": "disabled_provider_no_retention",
        "kind": kind,
        "source_url": url,
        "attribution": ATTRIBUTION,
        "data": data,
        "field_availability": _availability(data),
    }


def normalize_profile(payload, target, *, fetched_at=None):
    target = steam_id(target)
    if not isinstance(payload, dict) or payload.get("steam64_id") != target:
        raise SchemaError("Profile identity missing or mismatched")
    ranks = payload.get("ranks")
    ranks = ranks if isinstance(ranks, dict) else {}
    competitive = ranks.get("competitive")
    map_ranks = (
        [
            _fields(row, ("rank",), ("map_name",))
            for row in competitive
            if isinstance(row, dict)
        ]
        if isinstance(competitive, list)
        else None
    )
    data = {
        "steam_id64": target,
        **_fields(payload, ("total_matches", "winrate"), ("name", "privacy_mode")),
        "avatar": None,  # No avatar field in current public schema.
        "ranks": {
            "premier_cs_rating": _fields(ranks, ("premier",))["premier"],
            "competitive_maps": map_ranks,
            "faceit_level": _fields(ranks, ("faceit",))["faceit"],
            "faceit_elo": _fields(ranks, ("faceit_elo",))["faceit_elo"],
            "wingman_rank": _fields(ranks, ("wingman",))["wingman"],
            "renown_rating": _fields(ranks, ("renown",))["renown"],
            "leetify_rating": _fields(ranks, ("leetify",))["leetify"],
        },
        "rating": _fields(
            payload.get("rating"),
            (
                "aim",
                "positioning",
                "utility",
                "clutch",
                "opening",
                "ct_leetify",
                "t_leetify",
            ),
        ),
        "stats": _fields(
            payload.get("stats"),
            (
                "accuracy_enemy_spotted",
                "accuracy_head",
                "reaction_time_ms",
                "preaim",
                "spray_accuracy",
                "flashbang_hit_foe_avg_duration",
            ),
        ),
    }
    return _project(
        "profile", data, f"https://leetify.com/app/profile/{target}", fetched_at
    )


def normalize_match(payload, *, focus=None, fetched_at=None):
    if not isinstance(payload, dict):
        raise SchemaError("Expected a match object")
    try:
        match_id = game_id(payload.get("id"))
    except ValueError:
        raise SchemaError("Match UUID missing or invalid") from None
    raw_stats = payload.get("stats")
    if not isinstance(raw_stats, list):
        raise SchemaError("Match stats roster missing")
    players = []
    for row in raw_stats:
        try:
            player_id = (
                steam_id(row.get("steam64_id"))
                if isinstance(row, dict)
                else steam_id(None)
            )
        except ValueError:
            raise SchemaError("Invalid match player identity") from None
        players.append(
            {
                "steam_id64": player_id,
                **_fields(
                    row,
                    (
                        "total_kills",
                        "total_deaths",
                        "total_assists",
                        "kd_ratio",
                        "dpr",
                        "leetify_rating",
                        "initial_team_number",
                        "rounds_count",
                        "rounds_won",
                        "rounds_lost",
                        "preaim",
                        "reaction_time",
                    ),
                    ("name",),
                ),
            }
        )
    if len({p["steam_id64"] for p in players}) != len(players):
        raise SchemaError("Duplicate match player identity")
    selected = None
    if focus is not None:
        focus = steam_id(focus)
        selected = next((p for p in players if p["steam_id64"] == focus), None)
        if selected is None:
            raise SchemaError("Focus player is not in the match roster")
    scores = payload.get("team_scores")
    data = {
        "match_id": match_id,
        **_fields(payload, textual=("map_name", "finished_at", "data_source")),
        "team_scores": [
            _fields(row, ("team_number", "score"))
            for row in scores
            if isinstance(row, dict)
        ]
        if isinstance(scores, list)
        else None,
        "players": players,
        "focus": selected,
    }
    return _project(
        "match", data, f"https://leetify.com/app/match-details/{match_id}", fetched_at
    )


def normalize_recent(payload, target, *, limit=10, fetched_at=None):
    target = steam_id(target)
    if type(limit) is not int or not 1 <= limit <= 20:
        raise ValueError("Limit must be an integer between 1 and 20")
    if not isinstance(payload, list):
        raise SchemaError("Expected a match-history list")
    items = [
        normalize_match(row, focus=target, fetched_at=fetched_at)["data"]
        for row in payload
    ]

    def timestamp_key(item):
        try:
            parsed = datetime.fromisoformat(item["finished_at"])
            if parsed.utcoffset() is None:
                raise ValueError("Timezone required")
            return parsed, item["match_id"]
        except (ValueError, TypeError):
            raise SchemaError("Match history timestamp missing or invalid") from None

    items.sort(key=timestamp_key, reverse=True)
    seen, selected = set(), []
    for item in items:
        if item["match_id"] not in seen:
            selected.append(item)
            seen.add(item["match_id"])
    return _project(
        "recent",
        {
            "steam_id64": target,
            "matches": selected[:limit],
            "available_matches": len(selected),
            "limit": limit,
        },
        f"https://leetify.com/app/profile/{target}",
        fetched_at,
    )


def project_stats(profile, recent):
    """Source-native profile metrics, explicitly separate from selected sample."""
    if profile["data"]["steam_id64"] != recent["data"]["steam_id64"]:
        raise SchemaError("Statistics inputs refer to different players")
    return _project(
        "stats",
        {
            "steam_id64": profile["data"]["steam_id64"],
            "profile_rating": profile["data"]["rating"],
            "profile_stats": profile["data"]["stats"],
            "profile_metric_scope": "Leetify profile aggregate; not selected history sample",
            "sample_match_count": len(recent["data"]["matches"]),
            "sample_scope": "Selected visible history; no invented aggregate rating",
        },
        profile["source_url"],
        profile["fetched_at"],
    )

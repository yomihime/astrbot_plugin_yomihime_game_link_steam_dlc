"""Deadlock-specific bounded DTO projections; missing fields remain unknown."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import asdict, dataclass
from unicodedata import category


def number(value):
    return value if type(value) is int and value >= 0 else None


def identifier(value):
    if type(value) is int and value > 0:
        return str(value)
    if isinstance(value, str) and value.isascii() and value.isdecimal():
        return value if value == str(int(value)) and int(value) > 0 else None
    return None


def literal(value, limit=160):
    return (
        "".join(c for c in value if not category(c).startswith("C"))[:limit]
        if isinstance(value, str)
        else None
    )


@dataclass(frozen=True, slots=True)
class DeadlockPlayer:
    account_id32: str | None
    hero_id: int | None
    team: int | None
    kills: int | None
    deaths: int | None
    assists: int | None
    outcome: str


@dataclass(frozen=True, slots=True)
class DeadlockRecent:
    match_id: str
    start_time: int | None
    hero_id: int | None
    game_mode: int | None
    match_mode: int | None
    team: int | None
    kills: int | None
    deaths: int | None
    assists: int | None
    duration_s: int | None
    outcome: str


def outcome(value):
    return (
        {1: "win", 2: "loss"}.get(value, "unknown") if type(value) is int else "unknown"
    )


def recent(payload, account, limit=20):
    if not isinstance(payload, list):
        raise ValueError("history must be an array")
    # Only the source's recorded history; no pagination or claim of completeness.
    rows, seen, invalid, duplicate = [], set(), 0, 0
    for raw in payload:
        if not isinstance(raw, Mapping) or identifier(raw.get("match_id")) is None:
            invalid += 1
            continue
        if identifier(raw.get("account_id")) != str(account):
            invalid += 1
            continue
        mid = identifier(raw["match_id"])
        if mid in seen:
            duplicate += 1
            continue
        seen.add(mid)
        rows.append(
            asdict(
                DeadlockRecent(
                    mid,
                    number(raw.get("start_time")),
                    number(raw.get("hero_id")),
                    number(raw.get("game_mode")),
                    number(raw.get("match_mode")),
                    number(raw.get("player_team")),
                    number(raw.get("player_kills")),
                    number(raw.get("player_deaths")),
                    number(raw.get("player_assists")),
                    number(raw.get("match_duration_s")),
                    outcome(raw.get("player_match_outcome")),
                )
            )
        )
    rows.sort(
        key=lambda r: (
            r["start_time"] is not None,
            r["start_time"] or 0,
            int(r["match_id"]),
        ),
        reverse=True,
    )
    return {
        "matches": rows[:limit],
        "received_count": len(payload),
        "invalid_count": invalid,
        "duplicate_count": duplicate,
        "requested_limit": limit,
        "valid_count": len(rows),
        "sample_count": min(len(rows), limit),
    }


def statistics(rows):
    wins = sum(r["outcome"] == "win" for r in rows)
    losses = sum(r["outcome"] == "loss" for r in rows)
    metrics = {}
    for key in ("kills", "deaths", "assists", "duration_s"):
        values = [r[key] for r in rows if r[key] is not None]
        metrics[key] = {
            "value": sum(values) / len(values) if values else None,
            "sample_count": len(values),
        }
    return {
        "sample_count": len(rows),
        "wins": wins,
        "losses": losses,
        "unknown": len(rows) - wins - losses,
        "win_rate": wins * 100 / (wins + losses) if wins + losses else None,
        "outcome_denominator": wins + losses,
        "averages": metrics,
    }


def profile(profiles, rank, account):
    if not isinstance(profiles, list) or not isinstance(rank, Mapping):
        raise ValueError("profile/rank schema invalid")
    found = [
        r
        for r in profiles
        if isinstance(r, Mapping) and identifier(r.get("account_id")) == str(account)
    ]
    row = found[0] if len(found) == 1 else {}
    badge, tier, subrank = (number(rank.get(k)) for k in ("badge", "rank", "subrank"))
    last = rank.get("last_match")
    return {
        "account_id32": str(account),
        "profile_status": "recorded" if row else "not_recorded",
        "name": literal(row.get("personaname")),
        "profile_url": literal(row.get("profileurl"), 256),
        "avatar_url": literal(row.get("avatarfull"), 256),
        "last_updated": literal(row.get("last_updated")),
        "rank": {
            "badge": badge,
            "tier": tier,
            "subrank": subrank,
            "status": "unranked_or_unavailable"
            if badge == 0
            else "recorded"
            if badge is not None
            else "unknown",
            "last_match_id": identifier(last.get("match_id"))
            if isinstance(last, Mapping)
            else None,
            "semantics": "Eternus entry badge; daily percentile divisions"
            if tier == 11
            else "latest recorded ranked match",
        },
    }


def match(payload, match_id):
    if not isinstance(payload, Mapping) or not isinstance(
        payload.get("match_info"), Mapping
    ):
        raise ValueError("metadata match_info absent: not parsed")
    info = payload["match_info"]
    if identifier(info.get("match_id")) != str(match_id):
        raise ValueError("metadata match ID mismatch")
    raw_players = info.get("players")
    if not isinstance(raw_players, list) or len(raw_players) > 64:
        raise ValueError("metadata players unavailable or out of bound")
    players = []
    for raw in raw_players:
        if not isinstance(raw, Mapping):
            continue
        # Direct final counters are authoritative. Never invent zeros from absent stats.
        players.append(
            asdict(
                DeadlockPlayer(
                    identifier(raw.get("account_id")),
                    number(raw.get("hero_id")),
                    number(raw.get("team")),
                    number(raw.get("kills")),
                    number(raw.get("deaths")),
                    number(raw.get("assists")),
                    outcome(raw.get("player_match_outcome")),
                )
            )
        )
    if not players:
        raise ValueError("metadata contains no parsed players")
    return {
        "match_id": str(match_id),
        "start_time": number(info.get("start_time")),
        "duration_s": number(info.get("duration_s")),
        "game_mode": number(info.get("game_mode")),
        "match_mode": number(info.get("match_mode")),
        "winning_team": number(info.get("winning_team")),
        "player_count": len(players),
        "players": players,
    }


def focus(report, account):
    found = [p for p in report["players"] if p["account_id32"] == str(account)]
    return {
        "account_id32": str(account),
        "status": "found" if len(found) == 1 else "ambiguous" if found else "not_found",
        "player": found[0] if len(found) == 1 else None,
    }


def availability(fields):
    """Field-specific availability, without substituting values for missing data."""
    if "profile" in fields:
        p = fields["profile"]
        return {
            key: "available" if p[key] is not None else "unknown"
            for key in ("name", "profile_url", "avatar_url", "last_updated")
        } | {"rank_badge": "available" if p["rank"]["badge"] is not None else "unknown"}
    rows = (
        fields["history"]["matches"]
        if "history" in fields
        else fields["match"]["players"]
    )
    keys = ("hero_id", "kills", "deaths", "assists")
    return {
        key: {
            "available": sum(row[key] is not None for row in rows),
            "unknown": sum(row[key] is None for row in rows),
        }
        for key in keys
    }

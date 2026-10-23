"""Validate the complete normalized cache boundary before any consumer sees it."""

from __future__ import annotations

from collections.abc import Mapping
from datetime import datetime

from . import normalization as norm

SCOPE = "recorded public community data; bounded window; completeness unknown"
MISSING = "null=unknown/not supplied; zero preserved when actually reported"
MAX_COUNTER = 4_194_304
MAX_NUMBER = (1 << 63) - 1


def _number(value, *, maximum=MAX_NUMBER):
    return type(value) is int and 0 <= value <= maximum


def _optional_number(value):
    return value is None or _number(value)


def _id(value, *, account=False):
    return (
        isinstance(value, str)
        and len(value) <= 20
        and norm.identifier(value) == value
        and (not account or int(value) <= (1 << 32) - 1)
    )


def _text(value, maximum):
    return value is None or (
        isinstance(value, str)
        and len(value) <= maximum
        and norm.literal(value, maximum) == value
    )


def _same_shape(actual, expected):
    if isinstance(expected, Mapping):
        return (
            isinstance(actual, Mapping)
            and set(actual) == set(expected)
            and all(_same_shape(actual[k], v) for k, v in expected.items())
        )
    return type(actual) is type(expected) and actual == expected


def _row(row, *, history):
    fields = (
        norm.DeadlockRecent.__dataclass_fields__
        if history
        else norm.DeadlockPlayer.__dataclass_fields__
    )
    if not isinstance(row, Mapping) or set(row) != set(fields):
        return False
    if row["outcome"] not in ("win", "loss", "unknown"):
        return False
    if history:
        if not _id(row["match_id"]):
            return False
        numbers = set(fields) - {"match_id", "outcome"}
    else:
        if row["account_id32"] is not None and not _id(
            row["account_id32"], account=True
        ):
            return False
        numbers = set(fields) - {"account_id32", "outcome"}
    return all(_optional_number(row[k]) for k in numbers)


def _history(candidate, account, limit):
    h = candidate["history"]
    keys = {
        "matches",
        "received_count",
        "invalid_count",
        "duplicate_count",
        "requested_limit",
        "valid_count",
        "sample_count",
    }
    if (
        not _id(candidate["account_id32"], account=True)
        or candidate["account_id32"] != str(account)
        or not isinstance(h, Mapping)
        or set(h) != keys
    ):
        return False
    rows = h["matches"]
    if (
        not isinstance(rows, (list, tuple))
        or not _number(limit, maximum=20)
        or limit < 1
    ):
        return False
    if not all(_number(h[k], maximum=MAX_COUNTER) for k in keys - {"matches"}):
        return False
    if (
        h["requested_limit"] != limit
        or h["sample_count"] != len(rows)
        or len(rows) != min(h["valid_count"], limit)
    ):
        return False
    if (
        h["received_count"]
        != h["invalid_count"] + h["duplicate_count"] + h["valid_count"]
    ):
        return False
    if not all(_row(row, history=True) for row in rows):
        return False
    if len({r["match_id"] for r in rows}) != len(rows):
        return False
    return list(rows) == sorted(
        rows,
        key=lambda r: (
            r["start_time"] is not None,
            r["start_time"] or 0,
            int(r["match_id"]),
        ),
        reverse=True,
    )


def _profile(candidate, account):
    p = candidate["profile"]
    keys = {
        "account_id32",
        "profile_status",
        "name",
        "profile_url",
        "avatar_url",
        "last_updated",
        "rank",
    }
    if (
        not isinstance(p, Mapping)
        or set(p) != keys
        or not _id(p["account_id32"], account=True)
        or p["account_id32"] != str(account)
    ):
        return False
    if p["profile_status"] not in ("recorded", "not_recorded"):
        return False
    if not all(
        _text(p[k], 256 if k.endswith("url") else 160)
        for k in ("name", "profile_url", "avatar_url", "last_updated")
    ):
        return False
    if p["profile_status"] == "not_recorded" and any(
        p[k] is not None for k in ("name", "profile_url", "avatar_url", "last_updated")
    ):
        return False
    rank = p["rank"]
    if not isinstance(rank, Mapping) or set(rank) != {
        "badge",
        "tier",
        "subrank",
        "status",
        "last_match_id",
        "semantics",
    }:
        return False
    if not all(_optional_number(rank[k]) for k in ("badge", "tier", "subrank")):
        return False
    if rank["last_match_id"] is not None and not _id(rank["last_match_id"]):
        return False
    status = (
        "unranked_or_unavailable"
        if rank["badge"] == 0
        else "recorded"
        if rank["badge"] is not None
        else "unknown"
    )
    semantics = (
        "Eternus entry badge; daily percentile divisions"
        if rank["tier"] == 11
        else "latest recorded ranked match"
    )
    return rank["status"] == status and rank["semantics"] == semantics


def _match(candidate, mid):
    m = candidate["match"]
    keys = {
        "match_id",
        "start_time",
        "duration_s",
        "game_mode",
        "match_mode",
        "winning_team",
        "player_count",
        "players",
    }
    if (
        not isinstance(m, Mapping)
        or set(m) != keys
        or not _id(m["match_id"])
        or m["match_id"] != str(mid)
    ):
        return False
    rows = m["players"]
    if (
        not isinstance(rows, (list, tuple))
        or not _number(m["player_count"], maximum=64)
        or not 0 < len(rows) == m["player_count"]
    ):
        return False
    return all(
        _optional_number(m[k]) for k in keys - {"match_id", "player_count", "players"}
    ) and all(_row(row, history=False) for row in rows)


def valid_projection(candidate, kind, account, mid, limit, *, version, source):
    if not isinstance(candidate, Mapping) or kind not in (
        "history",
        "profile",
        "match",
    ):
        return False
    fields = {"account_id32", "history"} if kind == "history" else {kind}
    envelope = {
        "schema_version",
        "source",
        "scope",
        "fetched_at",
        "cache_hit",
        "cache_key",
        "field_availability",
        "missing_semantics",
    }
    if (
        set(candidate) != envelope | fields
        or type(candidate["schema_version"]) is not int
        or candidate["schema_version"] != version
        or candidate["source"] != source
        or candidate["scope"] != SCOPE
        or candidate["missing_semantics"] != MISSING
        or type(candidate["cache_hit"]) is not bool
    ):
        return False
    key = f"{source}:v{version}:{kind}:{account if kind != 'match' else mid}:{limit if kind == 'history' else '-'}"
    if candidate["cache_key"] != key:
        return False
    stamp = candidate["fetched_at"]
    if not isinstance(stamp, str) or len(stamp) > 64:
        return False
    try:
        parsed = datetime.fromisoformat(stamp)
        if parsed.tzinfo is None or parsed.utcoffset() is None:
            return False
    except ValueError:
        return False
    validator = {
        "history": lambda: _history(candidate, account, limit),
        "profile": lambda: _profile(candidate, account),
        "match": lambda: _match(candidate, mid),
    }
    if not validator[kind]():
        return False
    return _same_shape(candidate["field_availability"], norm.availability(candidate))

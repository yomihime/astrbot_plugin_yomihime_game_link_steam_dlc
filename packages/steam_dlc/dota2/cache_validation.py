"""Validate versioned JSON cache projections before presentation consumes them."""

from collections.abc import Mapping
from datetime import datetime
from math import isfinite
from urllib.parse import urlsplit

from ..shared.contracts import RecentMatch
from ..shared.steam_ids import account_id32, parse_dota_account

VERSION = 2


def _integer(value):
    return type(value) is int and 0 <= value <= (1 << 63) - 1


def _number(value):
    return (
        type(value) in (int, float) and 0 <= value <= (1 << 63) - 1 and isfinite(value)
    )


def _optional(check):
    return lambda value: value is None or check(value)


def _text(value):
    return isinstance(value, str) and len(value) <= 256


def _identifier(value):
    return (
        isinstance(value, str)
        and value.isascii()
        and value.isdecimal()
        and 1 <= len(value) <= 24
        and int(value) > 0
    )


def _outcome(value):
    return value in ("win", "loss", "unknown")


def _object(value, fields):
    return isinstance(value, Mapping) and all(
        name in value and check(value[name]) for name, check in fields.items()
    )


def _sequence(check, maximum):
    return (
        lambda value: isinstance(value, (list, tuple))
        and len(value) <= maximum
        and all(check(item) for item in value)
    )


def timestamp(value):
    if not isinstance(value, str) or len(value) > 64:
        return False
    try:
        return datetime.fromisoformat(value).tzinfo is not None
    except ValueError:
        return False


RECENT = {
    "match_id": _identifier,
    **{
        name: _optional(_integer)
        for name in (
            "start_time",
            "hero_id",
            "game_mode",
            "kills",
            "deaths",
            "assists",
            "duration",
        )
    },
    "outcome": _outcome,
}
COUNTS = {name: _integer for name in ("matches", "wins", "losses", "unknown")}
COUNTS["win_rate"] = _optional(_number)
COVERAGE = {
    "oldest_start_time": _optional(_integer),
    "newest_start_time": _optional(_integer),
    "known_time_count": _integer,
    "chronology_confirmed": lambda value: type(value) is bool,
}


def _stats(value):
    return _object(
        value,
        {
            **{
                name: _integer
                for name in (
                    "requested_limit",
                    "received_count",
                    "sample_count",
                    "invalid_count",
                    "duplicate_count",
                    "wins",
                    "losses",
                    "unknown",
                )
            },
            "win_rate": _optional(_number),
            "averages": lambda values: _object(
                values,
                {
                    metric: lambda entry: _object(
                        entry,
                        {
                            "total": _number,
                            "sample_count": _integer,
                            "value": _optional(_number),
                        },
                    )
                    for metric in ("kills", "deaths", "assists", "duration")
                },
            ),
            "heroes": _sequence(
                lambda item: _object(item, {"hero_id": _optional(_integer), **COUNTS}),
                20,
            ),
            "modes": _sequence(
                lambda item: _object(
                    item, {"game_mode": _optional(_integer), **COUNTS}
                ),
                20,
            ),
            "turbo_groups": _sequence(
                lambda item: _object(
                    item,
                    {
                        "group": lambda group: group
                        in ("turbo", "non_turbo", "unknown"),
                        **COUNTS,
                    },
                ),
                3,
            ),
            "coverage": lambda item: _object(item, COVERAGE),
            "streak": lambda item: _object(
                item,
                {
                    "outcome": lambda outcome: outcome in (None, "win", "loss"),
                    "count": _optional(_integer),
                },
            ),
        },
    )


def valid_projection(operation, value, target, limit, match_id):
    if not isinstance(value, Mapping):
        return False
    if operation != "match" and value.get("account_id32") != str(target):
        return False
    if operation in ("stats", "last", "match") and not timestamp(
        value.get("fetched_at")
    ):
        return False
    if operation == "stats":
        return _stats(value.get("stats")) and value["stats"]["requested_limit"] == limit
    if operation == "last":
        return (
            _object(
                value,
                {
                    "match_id": _identifier,
                    **{
                        name: _integer
                        for name in (
                            "requested_limit",
                            "received_count",
                            "sample_count",
                            "invalid_count",
                            "duplicate_count",
                        )
                    },
                    "coverage": lambda item: _object(item, COVERAGE),
                },
            )
            and value["requested_limit"] == limit
        )
    if operation == "recent":
        return _sequence(lambda item: _object(item, RECENT), limit)(
            value.get("matches")
        )
    if operation == "profile":
        valid = _object(
            value.get("profile"),
            {
                "account_id32": lambda item: item == str(target),
                **{
                    name: _optional(_text)
                    for name in ("name", "steam_id64", "profile_url")
                },
                **{
                    name: _optional(_integer)
                    for name in ("rank_tier", "leaderboard_rank")
                },
            },
        )
        if not valid:
            return False
        profile = value["profile"]
        try:
            if (
                profile["steam_id64"] is not None
                and account_id32(profile["steam_id64"]) != target
            ):
                return False
            url = profile["profile_url"]
            if url is not None:
                parsed = urlsplit(url)
                if parsed.hostname in ("steamcommunity.com", "www.opendota.com"):
                    if parse_dota_account(parsed.path.rsplit("/", 1)[-1]) != target:
                        return False
        except (TypeError, ValueError):
            return False
        return True
    if operation == "match":
        player_fields = {
            "account_id32": _optional(_identifier),
            "outcome": _outcome,
            "name": _optional(_text),
            **{
                name: _optional(_integer)
                for name in (
                    "player_slot",
                    "hero_id",
                    "kills",
                    "deaths",
                    "assists",
                    "level",
                    "gold_per_min",
                    "xp_per_min",
                    "last_hits",
                    "denies",
                    "hero_damage",
                    "tower_damage",
                    "hero_healing",
                    "neutral_item",
                )
            },
            "items": lambda items: _sequence(_optional(_integer), 6)(items)
            and len(items) == 6,
            "backpack": lambda items: _sequence(_optional(_integer), 3)(items)
            and len(items) == 3,
        }
        return _object(
            value.get("match"),
            {
                "match_id": lambda item: item == match_id,
                **{
                    name: _optional(_integer)
                    for name in ("start_time", "duration", "game_mode")
                },
                "radiant_win": lambda item: item is None or type(item) is bool,
                "players": _sequence(lambda item: _object(item, player_fields), 10),
            },
        )
    return False


def decode_window(value, target, limit):
    if not _object(
        value,
        {
            "account_id32": lambda item: item == str(target),
            "limit": lambda item: type(item) is int and item == limit,
            "fetched_at": timestamp,
            "rows": _sequence(lambda row: row is None or _object(row, RECENT), limit),
        },
    ):
        return None
    return [
        RecentMatch(**{name: row[name] for name in RECENT}) if row is not None else None
        for row in value["rows"]
    ]

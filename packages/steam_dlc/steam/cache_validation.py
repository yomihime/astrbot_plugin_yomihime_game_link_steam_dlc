"""Rebuild frozen Steam DTO shapes before trusting a cached projection."""

from collections.abc import Mapping
from datetime import UTC, datetime
from math import isfinite

from .normalization import (
    VERSION,
    app_id,
    availability,
    avatar_source,
    hours,
    integer,
    literal,
    normalize_app,
    normalize_search,
)


def mutable_json(value):
    """Copy public SDK immutable JSON containers into ordinary JSON values.

    CacheEntry payloads may recursively expose Mapping and tuple. Never use
    pickle/deepcopy or Core internals to copy them. The frozen DTO schema is
    shallow and bounded; reject corrupt cycles/deep containers before walking
    beyond its possible shape.
    """
    remaining = 10000

    def rebuild(item, depth):
        nonlocal remaining
        remaining -= 1
        if remaining < 0 or depth > 16:
            raise ValueError("Cached projection exceeds DTO structural bounds")
        if isinstance(item, Mapping):
            if any(not isinstance(key, str) for key in item):
                raise ValueError("Cached JSON object keys must be strings")
            return {key: rebuild(child, depth + 1) for key, child in item.items()}
        if isinstance(item, (list, tuple)):
            return [rebuild(child, depth + 1) for child in item]
        if item is None or type(item) in (str, int, bool):
            return item
        if type(item) is float and isfinite(item):
            return item
        raise ValueError("Cached value is not public SDK JSON")

    return rebuild(value, 0)


def _same_json(left, right):
    # Python's ordinary equality accepts True == 1. DTO numeric/boolean fields
    # must retain their exact JSON types, including inside nested lists.
    if type(left) is not type(right):
        return False
    if isinstance(left, dict):
        return left.keys() == right.keys() and all(
            _same_json(left[k], right[k]) for k in left
        )
    if isinstance(left, list):
        return len(left) == len(right) and all(
            _same_json(a, b) for a, b in zip(left, right)
        )
    return left == right


def _reviews(rows):
    if rows is None:
        return None
    if not isinstance(rows, list) or not 1 <= len(rows) <= 3:
        raise ValueError
    rebuilt = []
    for row in rows:
        if not isinstance(row, dict):
            raise ValueError
        scope, summary = literal(row.get("scope")), literal(row.get("summary"))
        if scope is None or summary is None:
            raise ValueError
        rebuilt.append(
            {
                "scope": scope,
                "summary": summary,
                "description": literal(row.get("description"), 400),
            }
        )
    return rebuilt


def _app(data, target):
    price = {
        "currency": data.get("currency"),
        "initial": data.get("initial_minor"),
        "final": data.get("final_minor"),
        "discount_percent": data.get("discount_percent"),
        "final_formatted": data.get("price_display"),
    }
    raw = {
        target: {
            "success": True,
            "data": {
                "steam_appid": int(target),
                "name": data.get("name"),
                "type": data.get("type"),
                "is_free": data.get("is_free"),
                "price_overview": price,
                "release_date": {
                    "date": data.get("release_date"),
                    "coming_soon": data.get("coming_soon"),
                },
                "developers": data.get("developers"),
                "publishers": data.get("publishers"),
                "header_image": data.get("header_image_url"),
            },
        }
    }
    rebuilt = normalize_app(raw, target)
    rebuilt["review_summaries"] = _reviews(data.get("review_summaries"))
    rebuilt["availability"] = availability(
        {key: value for key, value in rebuilt.items() if key != "availability"}
    )
    return rebuilt


def _account(data, operation, target):
    profile, rows = data.get("profile"), data.get("games")
    if (
        not isinstance(profile, dict)
        or not isinstance(rows, list)
        or len(rows) > (5 if operation == "games" else 3)
    ):
        raise ValueError
    if (
        profile.get("avatar_url") is not None
        and avatar_source(profile["avatar_url"]) is None
    ):
        raise ValueError
    rebuilt_profile = {
        "steam_id64": target,
        "nickname": literal(profile.get("nickname")),
        "avatar_url": literal(profile.get("avatar_url"), 1000),
        "level": None
        if operation == "games"
        else integer(profile.get("level"), 999999),
        "profile_url": f"https://steamcommunity.com/profiles/{target}/",
    }
    rebuilt_profile["availability"] = availability(rebuilt_profile)
    if operation == "games":
        rebuilt_profile["availability"]["level"] = "unsupported"
    rebuilt_rows = []
    for row in rows:
        if not isinstance(row, dict):
            raise ValueError
        rebuilt = {
            "app_id": app_id(row["app_id"]) if row.get("app_id") is not None else None,
            "name": literal(row.get("name")),
            "hours_on_record": hours(row.get("hours_on_record")),
            "hours_recent": hours(row.get("hours_recent"))
            if operation == "games"
            else None,
            "precision": "displayed_hours",
        }
        if operation != "games":
            rebuilt["display_text"] = literal(row.get("display_text"))
        rebuilt["availability"] = availability(
            {
                key: rebuilt[key]
                for key in ("app_id", "name", "hours_on_record", "hours_recent")
            }
        )
        rebuilt_rows.append(rebuilt)
    sample_availability = {
        "profile": "available",
        "games": "available" if rows else "not_provided",
    }
    result = {
        "profile": rebuilt_profile,
        "games": rebuilt_rows,
        "sample_kind": "legacy_most_played_games"
        if operation == "games"
        else "homepage_recently_displayed",
        "complete_library": False,
        "complete_recent_period": False,
        "availability": sample_availability,
    }
    if operation == "games":
        result.update(
            privacy_state=literal(data.get("privacy_state")), aggregate_hours_2wk=None
        )
        sample_availability["aggregate_hours_2wk"] = "unsupported"
    return result


def valid_projection(value, operation, target, country, language):
    try:
        value = mutable_json(value)
    except ValueError:
        return False
    return _valid_mutable_projection(value, operation, target, country, language)


def _valid_mutable_projection(value, operation, target, country, language):
    if not isinstance(value, dict) or not isinstance(value.get("data"), dict):
        return False
    if set(value) != {
        "schema_version",
        "operation",
        "target",
        "region",
        "language",
        "source",
        "source_endpoint",
        "scope",
        "fetched_at",
        "cache",
        "data",
        "availability",
        "warnings",
    }:
        return False
    scopes = {
        "search": "bounded_store_candidates",
        "app": "current_regional_store_details",
        "profile": "public_homepage_recent_display_sample",
        "recent": "public_homepage_recent_display_sample",
        "games": "deprecated_xml_most_played_sample",
    }
    if operation not in scopes:
        return False
    source = "steam_store" if operation in ("search", "app") else "steam_community"
    endpoint = (
        "/api/storesearch/"
        if operation == "search"
        else "/api/appdetails"
        if operation == "app"
        else f"/profiles/{target}/"
    )
    for key, expected in {
        "schema_version": VERSION,
        "operation": operation,
        "target": target,
        "region": country,
        "language": language,
        "source": source,
        "source_endpoint": endpoint,
        "scope": scopes[operation],
    }.items():
        if not _same_json(value.get(key), expected):
            return False
    try:
        stamp = datetime.fromisoformat(value["fetched_at"])
        if stamp.tzinfo is None or stamp > datetime.now(UTC):
            return False
        cache = value["cache"]
        if (
            not isinstance(cache, dict)
            or set(cache) != {"status", "fetched_at"}
            or cache["status"]
            not in ("miss", "hit", "expired", "rejected", "unavailable")
            or cache["fetched_at"] != value["fetched_at"]
        ):
            return False
        warnings = value["warnings"]
        if (
            not isinstance(warnings, list)
            or len(warnings) > 4
            or any(
                not isinstance(item, str) or literal(item, 400) != item
                for item in warnings
            )
        ):
            return False
        data = value["data"]
        if operation == "app":
            rebuilt = _app(data, target)
        elif operation == "search":
            rows = data["candidates"]
            if (
                not isinstance(rows, list)
                or len(rows) > 10
                or any(not isinstance(row, dict) for row in rows)
            ):
                return False
            rebuilt = normalize_search(
                {
                    "total": data.get("total"),
                    "items": [
                        {
                            "type": "app",
                            "id": row.get("app_id"),
                            "name": row.get("name"),
                        }
                        for row in rows
                    ],
                }
            )
        else:
            rebuilt = _account(data, operation, target)
        return _same_json(data, rebuilt) and _same_json(
            value.get("availability"), rebuilt["availability"]
        )
    except (KeyError, TypeError, ValueError, LookupError):
        return False

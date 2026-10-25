"""Pure statistics over the first bounded response window, without fanout."""

from __future__ import annotations

from typing import Any

from ..shared.contracts import RecentMatch
from .labels import known_mode
from .normalization import normalize_recent


def _rate(wins: int, losses: int) -> float | None:
    known = wins + losses
    return round(wins / known * 100, 2) if known else None


def _counts(matches: list[RecentMatch]) -> dict[str, Any]:
    wins = sum(match.outcome == "win" for match in matches)
    losses = sum(match.outcome == "loss" for match in matches)
    return {
        "matches": len(matches),
        "wins": wins,
        "losses": losses,
        "unknown": len(matches) - wins - losses,
        "win_rate": _rate(wins, losses),
    }


def _turbo_group(game_mode: int | None) -> str:
    if game_mode == 23:
        return "turbo"
    return "non_turbo" if known_mode(game_mode) else "unknown"


def _streak(matches: list[RecentMatch | None], chronology: bool) -> dict[str, Any]:
    if not chronology or not matches or matches[0] is None:
        return {"outcome": None, "count": None}
    outcome = matches[0].outcome
    if outcome == "unknown":
        return {"outcome": None, "count": None}
    count = 0
    for match in matches:
        if match is None or match.outcome == "unknown":
            return {"outcome": None, "count": None}
        if match.outcome != outcome:
            break
        count += 1
    return {"outcome": outcome, "count": count}


def project_stats(payload: object, *, limit: int = 20) -> dict[str, Any]:
    """Aggregate actual returned samples; each mean excludes missing metrics.

    Duplicate numeric match IDs use their first valid row. No rows outside the
    first ``limit`` raw entries are used to refill invalid or duplicate samples.
    Coverage describes known timestamps without changing source order. A streak
    is sample-clipped and withheld when an unknown outcome obscures its end.
    """
    if isinstance(limit, bool) or not isinstance(limit, int) or not 1 <= limit <= 20:
        raise ValueError("limit must be an integer from 1 to 20")
    if not isinstance(payload, list):
        raise ValueError("recent matches payload must be a list")
    window = []
    for row in payload[:limit]:
        normalized = normalize_recent([row], limit=1)
        window.append(normalized[0] if normalized else None)
    return project_normalized_stats(window, limit=limit)


def project_normalized_stats(
    window: list[RecentMatch | None], *, limit: int
) -> dict[str, Any]:
    """Use a validated source window, retaining invalid-row streak barriers."""
    matches: list[RecentMatch] = []
    streak_rows: list[RecentMatch | None] = []
    seen: set[int] = set()
    invalid_count = duplicate_count = 0
    for match in window:
        if match is None:
            invalid_count += 1
            streak_rows.append(None)
            continue
        # normalize_recent validated the identifier, retaining its old format.
        assert match.match_id is not None
        match_id = int(match.match_id)
        if match_id in seen:
            duplicate_count += 1
            streak_rows.append(None)
            continue
        seen.add(match_id)
        matches.append(match)
        streak_rows.append(match)

    totals = _counts(matches)
    averages: dict[str, Any] = {}
    for metric in ("kills", "deaths", "assists", "duration"):
        values = [
            value for match in matches if (value := getattr(match, metric)) is not None
        ]
        total = sum(values)
        averages[metric] = {
            "total": total,
            "sample_count": len(values),
            "value": round(total / len(values), 2) if values else None,
        }

    heroes: dict[int | None, list[RecentMatch]] = {}
    modes: dict[int | None, list[RecentMatch]] = {}
    turbo: dict[str, list[RecentMatch]] = {}
    for match in matches:
        heroes.setdefault(match.hero_id, []).append(match)
        modes.setdefault(match.game_mode, []).append(match)
        turbo.setdefault(_turbo_group(match.game_mode), []).append(match)
    times = [match.start_time for match in matches if match.start_time is not None]
    chronology = (
        bool(matches)
        and len(times) == len(matches)
        and all(newer > older for newer, older in zip(times, times[1:]))
    )
    return {
        "requested_limit": limit,
        "received_count": len(window),
        "sample_count": len(matches),
        "invalid_count": invalid_count,
        "duplicate_count": duplicate_count,
        "wins": totals["wins"],
        "losses": totals["losses"],
        "unknown": totals["unknown"],
        "win_rate": totals["win_rate"],
        "averages": averages,
        "heroes": [{"hero_id": key, **_counts(group)} for key, group in heroes.items()],
        "modes": [{"game_mode": key, **_counts(group)} for key, group in modes.items()],
        "turbo_groups": [
            {"group": key, **_counts(group)} for key, group in turbo.items()
        ],
        "coverage": {
            "oldest_start_time": min(times) if times else None,
            "newest_start_time": max(times) if times else None,
            "known_time_count": len(times),
            "chronology_confirmed": chronology,
        },
        "streak": _streak(streak_rows, chronology),
    }

"""Bounded, dependency-free normalization of OpenDota response shapes."""

from __future__ import annotations

import re
from urllib.parse import urlsplit

from ..shared.contracts import (
    MatchPlayer,
    MatchSummary,
    Outcome,
    PlayerProfile,
    RecentMatch,
)
from ..shared.steam_ids import account_id32, parse_dota_account

_UINT = re.compile(r"[0-9]+\Z")
_MAX_STRING = 160
_MAX_NAME = 80
_MAX_MATCH_ID = 24
_SLOT_RANGES = ((0, 4), (128, 132))


def _int(
    value: object, *, minimum: int = 0, maximum: int = (1 << 63) - 1
) -> int | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        number = value
    elif isinstance(value, str) and _UINT.fullmatch(value) and len(value) <= 19:
        number = int(value)
    else:
        return None
    return number if minimum <= number <= maximum else None


def _bounded_text(value: object, maximum: int = _MAX_STRING) -> str | None:
    if not isinstance(value, str):
        return None
    value = value.strip()
    if not value or len(value) > maximum or any(ord(ch) < 32 for ch in value):
        return None
    return value


def _match_id(value: object) -> str | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, int) and value > 0:
        value = str(value)
    if (
        not isinstance(value, str)
        or not _UINT.fullmatch(value)
        or len(value) > _MAX_MATCH_ID
    ):
        return None
    return value if int(value) > 0 else None


def _outcome(slot: int | None, radiant_win: object) -> Outcome:
    if slot is None or not isinstance(radiant_win, bool):
        return "unknown"
    if 0 <= slot <= 4:
        radiant = True
    elif 128 <= slot <= 132:
        radiant = False
    else:
        return "unknown"
    return "win" if radiant == radiant_win else "loss"


def _valid_profile_url(value: object) -> str | None:
    text = _bounded_text(value)
    if text is None:
        return None
    try:
        parsed = urlsplit(text)
        port = parsed.port
    except ValueError:
        return None
    if (
        parsed.scheme.lower() != "https"
        or parsed.username is not None
        or parsed.password is not None
        or port not in (None, 443)
    ):
        return None
    host = (parsed.hostname or "").lower()
    if parsed.query or parsed.fragment:
        return None
    if host == "steamcommunity.com" and re.fullmatch(
        r"/profiles/[0-9]{17}", parsed.path
    ):
        try:
            account_id32(parsed.path.rsplit("/", 1)[-1])
        except ValueError:
            return None
        return text
    if host == "www.opendota.com" and re.fullmatch(
        r"/players/[1-9][0-9]{0,9}", parsed.path
    ):
        try:
            parse_dota_account(parsed.path.rsplit("/", 1)[-1])
        except ValueError:
            return None
        return text
    return None


def normalize_recent(payload: object, *, limit: int = 5) -> tuple[RecentMatch, ...]:
    if isinstance(limit, bool) or not isinstance(limit, int) or not 1 <= limit <= 20:
        raise ValueError("limit must be an integer from 1 to 20")
    if not isinstance(payload, list):
        raise ValueError("recent matches payload must be a list")
    result: list[RecentMatch] = []
    for row in payload[:limit]:
        if not isinstance(row, dict):
            continue
        match_id = _match_id(row.get("match_id"))
        if match_id is None:
            continue
        slot = _int(row.get("player_slot"), maximum=255)
        result.append(
            RecentMatch(
                match_id=match_id,
                start_time=_int(row.get("start_time")),
                hero_id=_int(row.get("hero_id"), maximum=100_000),
                game_mode=_int(row.get("game_mode"), maximum=100_000),
                outcome=_outcome(slot, row.get("radiant_win")),
                kills=_int(row.get("kills"), maximum=1_000_000),
                deaths=_int(row.get("deaths"), maximum=1_000_000),
                assists=_int(row.get("assists"), maximum=1_000_000),
                duration=_int(row.get("duration"), maximum=7 * 24 * 60 * 60),
            )
        )
    return tuple(result)


def normalize_profile(payload: object, account: int) -> PlayerProfile:
    account_id = parse_dota_account(account)
    if not isinstance(payload, dict):
        raise ValueError("profile payload must be an object")
    profile = payload.get("profile")
    if not isinstance(profile, dict):
        profile = {}
    steam_id = profile.get("steamid")
    if isinstance(steam_id, str):
        try:
            steam_id = account_id32(steam_id)
        except ValueError:
            steam_id = None
    else:
        steam_id = None
    rank_tier = _int(payload.get("rank_tier"), maximum=100)
    leaderboard_rank = _int(
        payload.get("leaderboard_rank"), minimum=1, maximum=10_000_000
    )
    return PlayerProfile(
        account_id32=account_id,
        name=_bounded_text(profile.get("personaname"), _MAX_NAME),
        steam_id64=str(steam_id and _steam64(profile.get("steamid")) or "") or None,
        rank_tier=rank_tier,
        leaderboard_rank=leaderboard_rank,
        profile_url=_valid_profile_url(profile.get("profileurl")),
    )


def _steam64(value: object) -> str | None:
    if not isinstance(value, str):
        return None
    try:
        account_id32(value)
    except ValueError:
        return None
    return value


def normalize_match(payload: object, match_id: str) -> MatchSummary:
    normalized_match_id = _match_id(match_id)
    if normalized_match_id is None:
        raise ValueError("match_id must be a positive decimal identifier")
    if not isinstance(payload, dict):
        raise ValueError("match payload must be an object")
    rows = payload.get("players")
    if rows is not None and not isinstance(rows, list):
        raise ValueError("match players must be a list when present")
    players: list[MatchPlayer] = []
    for row in (rows or [])[:10]:
        if not isinstance(row, dict):
            continue
        account = _int(row.get("account_id"), minimum=1, maximum=(1 << 32) - 1)
        slot = _int(row.get("player_slot"), maximum=255)
        if slot is not None and not any(
            start <= slot <= end for start, end in _SLOT_RANGES
        ):
            slot = None
        players.append(
            MatchPlayer(
                account_id32=account,
                player_slot=slot,
                hero_id=_int(row.get("hero_id"), maximum=100_000),
                kills=_int(row.get("kills"), maximum=1_000_000),
                deaths=_int(row.get("deaths"), maximum=1_000_000),
                assists=_int(row.get("assists"), maximum=1_000_000),
                outcome=_outcome(slot, payload.get("radiant_win")),
            )
        )
    return MatchSummary(
        match_id=normalized_match_id,
        start_time=_int(payload.get("start_time")),
        duration=_int(payload.get("duration"), maximum=7 * 24 * 60 * 60),
        game_mode=_int(payload.get("game_mode"), maximum=100_000),
        radiant_win=payload.get("radiant_win")
        if isinstance(payload.get("radiant_win"), bool)
        else None,
        players=tuple(players),
    )

"""Frozen domain data; SDK capabilities transport bounded JSON projections."""

from dataclasses import dataclass
from typing import Literal

Outcome = Literal["win", "loss", "unknown"]


@dataclass(frozen=True, slots=True)
class SteamIdentity:
    steam_id64: str
    account_id32: int
    binding_revision: int
    association: str = "self_asserted"


@dataclass(frozen=True, slots=True)
class RecentMatch:
    match_id: str | None
    start_time: int | None
    hero_id: int | None
    game_mode: int | None
    outcome: Outcome
    kills: int | None
    deaths: int | None
    assists: int | None
    duration: int | None


@dataclass(frozen=True, slots=True)
class PlayerProfile:
    account_id32: int
    name: str | None
    steam_id64: str | None
    rank_tier: int | None
    leaderboard_rank: int | None
    profile_url: str | None


@dataclass(frozen=True, slots=True)
class MatchPlayer:
    account_id32: int | None
    player_slot: int | None
    hero_id: int | None
    kills: int | None
    deaths: int | None
    assists: int | None
    outcome: Outcome


@dataclass(frozen=True, slots=True)
class MatchSummary:
    match_id: str
    start_time: int | None
    duration: int | None
    game_mode: int | None
    radiant_win: bool | None
    players: tuple[MatchPlayer, ...]

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
    name: str | None = None
    level: int | None = None
    gold_per_min: int | None = None
    xp_per_min: int | None = None
    last_hits: int | None = None
    denies: int | None = None
    hero_damage: int | None = None
    tower_damage: int | None = None
    hero_healing: int | None = None
    items: tuple[int | None, ...] = (None, None, None, None, None, None)
    backpack: tuple[int | None, ...] = (None, None, None)
    neutral_item: int | None = None


@dataclass(frozen=True, slots=True)
class MatchSummary:
    match_id: str
    start_time: int | None
    duration: int | None
    game_mode: int | None
    radiant_win: bool | None
    players: tuple[MatchPlayer, ...]

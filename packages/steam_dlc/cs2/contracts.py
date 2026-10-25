"""CS2 identities and credential-free plans from the pinned CS2UID protocol.

Reference: Agnes4m/CS2UID ac46894dfb184bd27a81a9a5667aff49b8d0b226 (GPL-3.0).
Game-specific protocol knowledge stays in the DLC.
"""

import json
import re

from yomihime_game_link_sdk.services import HttpRequest

from ..shared.steam_ids import parse_steam_id

SCHEMA_VERSION = "cs2.platform.v1"
PLATFORMS = ("perfect", "official", "5e")
PROVIDERS = {"perfect": "perfect_world", "official": "perfect_world", "5e": "5eplay"}
_DOMAIN = re.compile(r"[A-Za-z0-9_-]{1,64}\Z")
_MATCH = re.compile(r"[A-Za-z0-9][A-Za-z0-9_@.-]{0,127}\Z")
_UUID = re.compile(r"[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}\Z")
_PERFECT_HEADERS = {
    "Content-Type": "application/json;charset=UTF-8",
    "User-Agent": "okhttp/4.11.0",
    "appversion": "3.4.6.164",
}
_FIVEE_HEADERS = {"User-Agent": "okhttp/3.14.9", "version": "6.2.2"}


class SchemaError(ValueError):
    """The source cannot support a trustworthy response projection."""


def platform_id(value):
    if type(value) is not str or value not in PLATFORMS:
        raise ValueError("Platform must be perfect, official or 5e")
    return value


def steam_id(value):
    if type(value) is not str or not value.isascii() or not value.isdecimal():
        raise ValueError("Expected a SteamID64 string")
    return parse_steam_id(value)


def account_id(value, platform):
    platform_id(platform)
    if platform != "5e":
        return steam_id(value)
    if type(value) is not str or not _DOMAIN.fullmatch(value):
        raise ValueError("5E account must be an explicit domain")
    return value


def game_id(value, platform="perfect"):
    platform_id(platform)
    if type(value) is not str or not _MATCH.fullmatch(value):
        raise ValueError("Expected a source-local match ID")
    if _UUID.fullmatch(value):
        raise ValueError("Legacy Leetify UUID requires a new platform-local match ID")
    return value


def limit_value(value):
    if type(value) is not int or not 1 <= value <= 20:
        raise ValueError("Limit must be an integer between 1 and 20")
    return value


def season_value(value, platform):
    if value in (None, ""):
        return None
    if type(value) is not str:
        raise ValueError("Season must be a string")
    if platform == "perfect":
        if not re.fullmatch(r"S?[1-9][0-9]{0,2}", value):
            raise ValueError("Perfect season must be a number or S-prefixed number")
        return "S" + value.removeprefix("S")
    if platform == "5e":
        matched = re.fullmatch(r"(20[0-9]{2})[ sS]*([1-9][0-9]?)", value)
        if not matched:
            raise ValueError("5E season must include year and season, such as 2026S5")
        return f"{matched[1]}S{matched[2]}"
    raise ValueError("Official source has no verified season selector")


def profile_request(platform, target, *, season=None):
    platform = platform_id(platform)
    target = account_id(target, platform)
    season = season_value(season, platform)
    if platform == "5e":
        return HttpRequest(
            "fivee_api",
            f"/v0/mars/api/csgo/data/player_home/{target}",
            headers=_FIVEE_HEADERS,
        )
    path = (
        "/api/csgo/home/pvp/detailStats"
        if platform == "perfect"
        else "/api/csgo/home/official/detailStats"
    )
    body = {"toSteamId": target}
    if platform == "perfect":
        body["csgoSeasonId"] = season or ""
    # Core injects accessToken + mySteamId, and official header token.
    return _post(path, body)


def recent_request(platform, target):
    platform = platform_id(platform)
    target = account_id(target, platform)
    if platform == "5e":
        return profile_request(platform, target)
    return _post(
        "/api/csgo/home/match/list",
        {
            "toSteamId": target,
            "csgoSeasonId": "recent",
            "pvpType": -1,
            "page": 1,
            "pageSize": 50,
            "dataSource": 3 if platform == "perfect" else 1,
        },
    )


def match_request(platform, match_id):
    platform_id(platform)
    match_id = game_id(match_id, platform)
    if platform != "perfect":
        raise ValueError("This source has no verified full-match endpoint")
    return _post(
        "/api/v1/csgo/match",
        {
            "matchId": match_id,
            "platform": "admin",
            "dataSource": 3,
        },
    )


def fivee_season_request(target, season):
    target = account_id(target, "5e")
    season = season_value(season, "5e")
    if season is None:
        raise ValueError("5E season requires an explicit year and season")
    year, number = season.split("S")
    return HttpRequest(
        "fivee_api",
        f"/v0/mars/api/csgo/data/player_match_v1/{target}",
        query=(("matchType", "9"), ("year", year), ("season", number)),
        headers=_FIVEE_HEADERS,
    )


def _post(path, body):
    return HttpRequest(
        "perfect_api",
        path,
        "POST",
        body=json.dumps(body).encode("utf-8"),
        headers=_PERFECT_HEADERS,
    )

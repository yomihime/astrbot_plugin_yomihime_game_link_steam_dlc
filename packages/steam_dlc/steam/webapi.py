"""Optional user-key Web API request definitions and pure adapters.

The module never accepts or reads a secret. The declared steam_api source must
receive credentials from Core's source-bound injection before these requests
can be enabled. A missing response is not an empty library or zero playtime.
"""

from collections.abc import Mapping

from yomihime_game_link_sdk import HttpRequest

from ..shared.steam_ids import parse_steam_id
from .normalization import app_id, availability, integer, literal

_PATHS = {
    "profile": "/ISteamUser/GetPlayerSummaries/v2/",
    "level": "/IPlayerService/GetSteamLevel/v1/",
    "recent": "/IPlayerService/GetRecentlyPlayedGames/v1/",
    "games": "/IPlayerService/GetOwnedGames/v1/",
}


def request(operation, steam_id):
    steam_id = parse_steam_id(steam_id)
    if operation not in _PATHS:
        raise ValueError("Unknown Steam API operation")
    query = [("steamids" if operation == "profile" else "steamid", steam_id)]
    if operation == "games":
        query.extend(
            (("include_appinfo", "true"), ("include_played_free_games", "true"))
        )
    return HttpRequest("steam_api", _PATHS[operation], query=tuple(query))


def normalize(operation, raw, steam_id):
    steam_id = parse_steam_id(steam_id)
    if (
        operation not in _PATHS
        or not isinstance(raw, Mapping)
        or not isinstance(raw.get("response"), Mapping)
    ):
        raise ValueError("Invalid Steam Web API response")
    data = raw["response"]
    if operation == "profile":
        players = data.get("players")
        if not isinstance(players, list):
            raise ValueError("Player summaries missing")
        player = next(
            (
                v
                for v in players
                if isinstance(v, Mapping) and v.get("steamid") == steam_id
            ),
            None,
        )
        if player is None:
            return {
                "state": "not_visible",
                "steam_id64": steam_id,
                "availability": {"profile": "not_provided"},
            }
        result = {
            "steam_id64": steam_id,
            "nickname": literal(player.get("personaname")),
            "avatar_url": literal(player.get("avatarfull"), 1000),
            "visibility": integer(player.get("communityvisibilitystate"), 3),
        }
    elif operation == "level":
        result = {
            "steam_id64": steam_id,
            "level": integer(data.get("player_level"), 10**7),
        }
    else:
        games = data.get("games")
        count_key = "game_count" if operation == "games" else "total_count"
        count = integer(data.get(count_key), 10**7)
        if games is None and count == 0:
            games = []
        if games is None:
            return {
                "state": "not_visible_or_not_provided",
                "steam_id64": steam_id,
                "games": None,
                "count": count,
                "availability": {"games": "not_provided"},
            }
        if not isinstance(games, list) or len(games) > 20000:
            raise ValueError("Invalid bounded games array")
        rows = []
        for game in games:
            if not isinstance(game, Mapping):
                continue
            try:
                target = app_id(str(game.get("appid")))
            except ValueError:
                continue
            row = {
                "app_id": target,
                "name": literal(game.get("name")),
                "minutes_on_record": integer(game.get("playtime_forever"), 10**12),
                "minutes_2weeks": integer(game.get("playtime_2weeks"), 10**12),
                "precision": "api_minutes",
            }
            row["availability"] = availability(row)
            rows.append(row)
        result = {
            "steam_id64": steam_id,
            "games": rows,
            "count": count,
            "include_played_free_games": True if operation == "games" else None,
            "state": "empty" if count == 0 and not rows else "available",
            "complete_library": operation == "games"
            and count is not None
            and count == len(rows),
        }
    result["availability"] = availability(result)
    return result

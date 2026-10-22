"""Pure validation and conversion helpers for public individual Steam IDs."""

from __future__ import annotations

import re
from urllib.parse import urlsplit

_STEAM_ID_BASE = 76561197960265728
_UINT32_MAX = (1 << 32) - 1
_DECIMAL = re.compile(r"[0-9]+\Z")


def _parse_id64(value: object) -> int:
    if not isinstance(value, str) or not _DECIMAL.fullmatch(value):
        raise ValueError("SteamID64 must be a canonical decimal string")
    number = int(value)
    if str(number) != value or number > (1 << 64) - 1:
        raise ValueError("SteamID64 is outside the unsigned 64-bit range")
    universe = (number >> 56) & 0xFF
    account_type = (number >> 52) & 0xF
    instance = (number >> 32) & 0xFFFFF
    account_id = number & _UINT32_MAX
    if universe != 1 or account_type != 1 or instance != 1 or account_id == 0:
        raise ValueError("SteamID64 is not a public individual desktop account")
    return number


def parse_steam_id(value: str) -> str:
    """Return a canonical public individual SteamID64 or reject the input."""
    if not isinstance(value, str):
        raise ValueError("Steam ID must be text")
    candidate = value
    if "://" in value:
        try:
            parsed = urlsplit(value)
            port = parsed.port
        except ValueError as exc:
            raise ValueError("Invalid Steam profile URL") from exc
        if (
            parsed.scheme.lower() != "https"
            or parsed.hostname is None
            or parsed.hostname.lower() != "steamcommunity.com"
            or parsed.username is not None
            or parsed.password is not None
            or port not in (None, 443)
            or parsed.path.count("/") != 2
            or not parsed.path.startswith("/profiles/")
            or parsed.query
            or parsed.fragment
        ):
            raise ValueError("Expected a standard Steam community profiles URL")
        candidate = parsed.path.removeprefix("/profiles/")
    number = _parse_id64(candidate)
    return str(number)


def account_id32(steam_id64: str) -> int:
    """Derive the Dota account ID32 from a validated public SteamID64."""
    return _parse_id64(steam_id64) - _STEAM_ID_BASE


def steam_id64_from_account(account: str | int) -> str:
    """Convert a canonical positive account ID32 to a SteamID64 string."""
    if isinstance(account, bool):
        raise ValueError("Account ID must be a positive integer")
    if isinstance(account, int):
        account_id = account
    elif isinstance(account, str) and _DECIMAL.fullmatch(account):
        account_id = int(account)
        if str(account_id) != account:
            raise ValueError("Account ID must be canonical decimal text")
    else:
        raise ValueError("Account ID must be an integer or canonical decimal text")
    if not 1 <= account_id <= _UINT32_MAX:
        raise ValueError("Account ID is outside the positive ID32 range")
    return str(_STEAM_ID_BASE + account_id)


def parse_steam_binding_target(value: str) -> str:
    """Normalize an explicit ID32 or legacy Steam profile binding target."""
    if isinstance(value, str) and _DECIMAL.fullmatch(value):
        number = int(value)
        if str(number) == value and 1 <= number <= _UINT32_MAX:
            return steam_id64_from_account(value)
    return parse_steam_id(value)


def parse_dota_account(value: str | int) -> int:
    """Parse an explicit Dota target as ID32 or public individual SteamID64."""
    if isinstance(value, bool):
        raise ValueError("Dota account must be a positive integer ID")
    if isinstance(value, int):
        account_id = value
    elif isinstance(value, str) and _DECIMAL.fullmatch(value):
        number = int(value)
        if str(number) != value:
            raise ValueError("Dota account must be canonical decimal text")
        account_id = number - _STEAM_ID_BASE if number > _UINT32_MAX else number
    else:
        raise ValueError("Dota account must be an integer or canonical decimal text")
    if not 1 <= account_id <= _UINT32_MAX:
        raise ValueError("Dota account is outside the positive ID32 range")
    return account_id

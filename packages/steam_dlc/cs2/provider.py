"""Invocation-only canonical SDK adapter, unreachable from product handlers."""

import json
from datetime import UTC, datetime

from yomihime_game_link_sdk.errors import SourceHttpError
from yomihime_game_link_sdk.services import HttpRequest

from .contracts import (
    SchemaError,
    game_id,
    normalize_match,
    normalize_profile,
    normalize_recent,
    project_stats,
    steam_id,
)


class ProviderError(Exception):
    def __init__(self, code, *, retry_after_seconds=None):
        self.code, self.retry_after_seconds = code, retry_after_seconds
        super().__init__(code)


def _http_error(status, retry_after=None):
    # SDK omits upstream error bodies. 403/404 do not prove privacy or registration.
    code = {
        401: "authentication_required",
        403: "access_denied_reason_unavailable",
        404: "not_found_or_not_registered",
        429: "rate_limited",
    }.get(status, "upstream_error")
    return ProviderError(code, retry_after_seconds=retry_after)


class LeetifyProvider:
    """Discard after one invocation. No records, cache, logs, resources or retries."""

    def __init__(self, http):
        self._http, self._responses = http, {}
        self._fetched_at = datetime.now(UTC).isoformat()

    async def _get(self, path, query=None):
        query = query or {}
        key = (path, tuple(sorted(query.items())))
        if key in self._responses:
            return self._responses[key]
        try:
            response = await self._http.fetch(
                HttpRequest(
                    source_id="leetify",
                    method="GET",
                    path=path,
                    query=tuple(query.items()),
                )
            )
        except SourceHttpError as error:
            if error.status_code is not None:
                raise _http_error(
                    error.status_code, error.retry_after_seconds
                ) from None
            code = (
                "rate_limited"
                if error.code == "rate_limited"
                else "network_or_source_unavailable"
            )
            raise ProviderError(
                code, retry_after_seconds=error.retry_after_seconds
            ) from None
        if response.status_code != 200:
            raise _http_error(response.status_code)
        if len(response.body) > 2_000_000:
            raise ProviderError("response_too_large")
        try:
            body = json.loads(response.body)
        except (ValueError, TypeError, UnicodeDecodeError):
            raise ProviderError("schema_changed") from None
        self._responses[key] = body
        return body

    async def profile(self, target):
        target = steam_id(target)
        body = await self._get("/v3/profile", {"steam64_id": target})
        if not isinstance(body, dict):
            raise ProviderError("schema_changed")
        if body.get("privacy_mode") != "public":
            raise ProviderError("not_public_or_visibility_unknown")
        try:
            return normalize_profile(body, target, fetched_at=self._fetched_at)
        except SchemaError:
            raise ProviderError("schema_changed") from None

    async def recent(self, target, *, limit=10):
        target = steam_id(target)
        if type(limit) is not int or not 1 <= limit <= 20:
            raise ValueError("Limit must be an integer between 1 and 20")
        body = await self._get("/v3/profile/matches", {"steam64_id": target})
        try:
            return normalize_recent(
                body, target, limit=limit, fetched_at=self._fetched_at
            )
        except SchemaError:
            raise ProviderError("schema_changed_or_focus_unavailable") from None

    async def last(self, target):
        recent = await self.recent(target, limit=1)
        if not recent["data"]["matches"]:
            raise ProviderError("no_recorded_matches")
        return await self.match(recent["data"]["matches"][0]["match_id"], focus=target)

    async def match(self, match_id, *, focus=None):
        match_id = game_id(match_id)
        if focus is not None:
            focus = steam_id(focus)
        body = await self._get(f"/v2/matches/{match_id}")
        if not isinstance(body, dict) or body.get("id") != match_id:
            raise ProviderError("schema_changed_or_match_mismatch")
        try:
            return normalize_match(body, focus=focus, fetched_at=self._fetched_at)
        except SchemaError:
            raise ProviderError("schema_changed_or_focus_unavailable") from None

    async def stats(self, target, *, limit=10):
        return project_stats(
            await self.profile(target), await self.recent(target, limit=limit)
        )

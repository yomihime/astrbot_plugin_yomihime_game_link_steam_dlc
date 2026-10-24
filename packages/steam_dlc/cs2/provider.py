"""CS2 adapters using only an invocation-scoped, credential-aware Core HTTP API.

The adapter never accepts raw tokens or adds placeholder credentials. Core must
authorize and inject material according to the reviewed host policy.
"""

import json
from datetime import UTC, datetime

from yomihime_game_link_sdk.errors import SourceHttpError

from .contracts import (
    SchemaError,
    account_id,
    fivee_season_request,
    game_id,
    limit_value,
    match_request,
    platform_id,
    profile_request,
    recent_request,
    season_value,
)
from .normalization import (
    normalize_match,
    normalize_profile,
    normalize_recent,
    normalize_season_stats,
    project_stats,
    select_summary,
)


class ProviderError(Exception):
    def __init__(self, code, *, retry_after_seconds=None):
        self.code = code
        self.retry_after_seconds = retry_after_seconds
        super().__init__(code)


def _http_error(status, retry_after=None):
    return ProviderError(
        {
            401: "authentication_required",
            403: "access_denied_reason_unavailable",
            404: "not_found_or_not_registered",
            429: "rate_limited",
        }.get(status, "upstream_error"),
        retry_after_seconds=retry_after,
    )


def unwrap_response(payload, platform):
    """Require the source success envelope; never forward upstream error text."""
    if not isinstance(payload, dict):
        raise ProviderError("schema_changed")
    if platform == "5e":
        code = payload.get("errcode")
        success = payload.get("success") is True and type(code) is int and code == 0
    else:
        code = payload.get("statusCode")
        success = type(code) in (int, str) and code in (0, "0")
    if not success:
        if type(code) in (int, str) and str(code) in {"1", "4001", "4013", "8000102"}:
            raise ProviderError("authentication_required")
        if code is None or type(code) is bool:
            raise ProviderError("schema_changed")
        raise ProviderError("source_rejected_request")
    data = payload.get("data")
    if data is None:
        raise ProviderError("not_found_or_not_registered")
    if not isinstance(data, dict):
        raise ProviderError("schema_changed")
    return data


class PlatformProvider:
    """One platform and one invocation; no disk cache or independent retries."""

    def __init__(self, http, platform="perfect"):
        self._http = http
        self.platform = platform_id(platform)
        self.fetched_at = datetime.now(UTC).isoformat()
        self._responses = {}

    async def _read(self, request):
        key = (request.source_id, request.path, request.query, request.body)
        if key in self._responses:
            return self._responses[key]
        try:
            response = await self._http.fetch(request)
        except SourceHttpError as error:
            if error.code == "credentials_unavailable":
                raise ProviderError("authentication_required") from None
            if error.status_code is not None:
                raise _http_error(
                    error.status_code, error.retry_after_seconds
                ) from None
            raise ProviderError(
                "rate_limited"
                if error.code == "rate_limited"
                else "network_or_source_unavailable",
                retry_after_seconds=error.retry_after_seconds,
            ) from None
        if response.status_code != 200:
            raise _http_error(response.status_code)
        if len(response.body) > 2_000_000:
            raise ProviderError("response_too_large")
        try:
            payload = json.loads(response.body)
        except (ValueError, TypeError, UnicodeDecodeError):
            raise ProviderError("schema_changed") from None
        data = unwrap_response(payload, self.platform)
        self._responses[key] = data
        return data

    def _normalize(self, function, *args, **kwargs):
        try:
            return function(
                *args, platform=self.platform, fetched_at=self.fetched_at, **kwargs
            )
        except SchemaError as error:
            code = (
                "private_profile"
                if str(error) == "private_profile"
                else "schema_changed"
            )
            raise ProviderError(code) from None

    async def profile(self, target, *, season=None):
        data = await self._read(profile_request(self.platform, target, season=season))
        return self._normalize(normalize_profile, data, target, season=season)

    async def recent(self, target, *, limit=5):
        limit_value(limit)
        data = await self._read(recent_request(self.platform, target))
        return self._normalize(normalize_recent, data, target, limit=limit)

    async def last(self, target):
        recent = await self.recent(target, limit=1)
        if not recent["data"]["matches"]:
            raise ProviderError("no_recorded_matches")
        match_id = recent["data"]["matches"][0]["match_id"]
        return await self.match(match_id, target=target, focus=target)

    async def match(self, match_id, *, target=None, focus=None):
        match_id = game_id(match_id, self.platform)
        if target is not None:
            target = account_id(target, self.platform)
        if focus is not None:
            focus = account_id(focus, self.platform)
        if self.platform != "perfect":
            if target is None:
                raise ValueError("Bounded match lookup requires an explicit account")
            if focus is not None and focus != target:
                raise ProviderError("focus_not_in_sample")
            data = await self._read(recent_request(self.platform, target))
            recent = self._normalize(
                normalize_recent, data, target, limit=20, include_all=True
            )
            try:
                return select_summary(recent, match_id)
            except SchemaError:
                raise ProviderError("match_not_in_recent_sample") from None
        data = await self._read(match_request(self.platform, match_id))
        return self._normalize(normalize_match, data, match_id, focus=focus)

    async def stats(self, target, *, season=None):
        profile = await self.profile(target, season=season)
        if self.platform != "5e":
            return project_stats(profile)
        selected = season_value(season or profile["season"], "5e")
        if selected is None:
            raise ProviderError("season_unavailable")
        data = await self._read(fivee_season_request(target, selected))
        return self._normalize(normalize_season_stats, data, profile, selected)

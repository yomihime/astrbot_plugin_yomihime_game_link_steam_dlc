"""Bound complete StoreBrowse query values to the public HTTP policy."""

import json
from collections.abc import Mapping, Sequence

from .normalization import app_id

MAX_QUERY_VALUE_LENGTH = 512


def input_json(
    appids: Sequence[str], country: str, language: str, data_request: Mapping[str, bool]
) -> str:
    return json.dumps(
        {
            "ids": [{"appid": int(app_id(value))} for value in appids],
            "context": {"language": language, "country_code": country},
            "data_request": dict(data_request),
        },
        separators=(",", ":"),
        ensure_ascii=True,
    )


def batches(
    appids: Sequence[str],
    country: str,
    language: str,
    data_request: Mapping[str, bool],
    *,
    max_items: int = 200,
):
    """Preserve IDs/order while including context and data flags in each bound."""
    if type(max_items) is not int or not 1 <= max_items <= 200:
        raise ValueError("Invalid StoreBrowse batch item bound")
    group: list[str] = []
    encoded = ""
    for value in appids:
        target = app_id(value)
        candidate = input_json([*group, target], country, language, data_request)
        if group and (
            len(group) >= max_items or len(candidate) > MAX_QUERY_VALUE_LENGTH
        ):
            yield tuple(group), encoded
            group = []
            candidate = input_json([target], country, language, data_request)
        if len(candidate) > MAX_QUERY_VALUE_LENGTH:
            raise ValueError("StoreBrowse context exceeds bounded query length")
        group.append(target)
        encoded = candidate
    if group:
        yield tuple(group), encoded

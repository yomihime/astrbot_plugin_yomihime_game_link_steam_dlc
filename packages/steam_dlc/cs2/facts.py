"""Versioned CS2 fact whitelist; full display projections remain independent.

Tables remove repeated field names, availability trees and inherited context.
None always means unknown, including in positional rows; zero stays zero.
The fixed limits below fit the public 512-node budget without data-dependent
field deletion. Recent queries retain all 20 selected matches. Exceptional
rosters above 20 retain every identity and explicitly bound detailed rows.
"""

METADATA = (
    "schema_version",
    "provider",
    "platform",
    "kind",
    "target",
    "season",
    "fetched_at",
    "coverage",
    "detail_level",
    "unavailable_reason",
)
SUMMARY_COLUMNS = (
    "match_id",
    "source_data_id",
    "map",
    "start_time",
    "end_time",
    "scores",
    "kills",
    "deaths",
    "assists",
    "rating",
    "pw_rating",
    "rws",
    "result",
    "season",
)
PLAYER_COLUMNS = (
    "account_id",
    "nickname",
    "avatar_url",
    "kills",
    "deaths",
    "assists",
    "team",
    "rating",
    "pw_rating",
    "rws",
    "adr",
)
METRICS = ("matches", "kd", "rating", "pw_rating", "rws", "adr", "win_rate")
ROW_CONTEXT = "platform_and_focus_inherit_outer_platform_and_target"


def _fields(value, names):
    return {key: value.get(key) for key in names}


def compact_facts(projection):
    """Consume only normalized projections, never a provider's raw response."""
    header = {"fact_format": "cs2.facts.v1", "null_semantics": "unknown"}
    if "kind" not in projection:
        # Status has three fixed public source rows and no player information.
        return {
            **header,
            **_fields(projection, ("schema_version", "module", "default_platform")),
            "sources": [
                {
                    **_fields(
                        source,
                        (
                            "platform",
                            "provider",
                            "credential_state",
                            "authorized_subject",
                            "coverage",
                            "unavailable_reason",
                        ),
                    ),
                    "capabilities": _fields(
                        source["capabilities"],
                        ("profile", "recent", "stats", "last", "match"),
                    ),
                }
                for source in projection["sources"]
            ],
        }
    facts = {**header, **_fields(projection, METADATA)}
    data, kind = projection["data"], projection["kind"]
    if kind in ("profile", "stats"):
        facts["data"] = {
            **_fields(
                data,
                (
                    "account_id",
                    "steam_id64",
                    "domain",
                    "nickname",
                    "avatar_url",
                    "metric_scope",
                    "identity_evidence",
                ),
            ),
            "rank": _fields(data["rank"], ("system", "value", "score", "season"))
            if data.get("rank") is not None
            else None,
            "metrics": _fields(data["metrics"], METRICS),
        }
    elif kind == "recent":
        rows = data["matches"]
        facts["data"] = {
            "columns": SUMMARY_COLUMNS,
            "rows": [tuple(row.get(key) for key in SUMMARY_COLUMNS) for row in rows],
            "row_context": ROW_CONTEXT,
            "available_matches": data["available_matches"],
            "limit": data["limit"],
            "returned_matches": len(rows),
            "limited": len(rows) < data["available_matches"],
        }
    elif projection["detail_level"] == "full_match":
        players = data["players"]
        focus = data.get("focus")
        focus_id = focus["account_id"] if focus is not None else None
        detailed = players[:20]
        if focus is not None and focus_id not in {
            player["account_id"] for player in detailed
        }:
            detailed = [*detailed[:19], focus]
        facts["data"] = {
            **_fields(data, ("match_id", "map", "start_time", "end_time", "scores")),
            "focus_account_id": focus_id,
            "players": {
                "account_ids": [player["account_id"] for player in players],
                "columns": PLAYER_COLUMNS,
                "rows": [
                    tuple(row.get(key) for key in PLAYER_COLUMNS) for row in detailed
                ],
                "available_players": len(players),
                "returned_players": len(detailed),
                "limited": len(detailed) < len(players),
                "selection": "source_order_first_20_including_focus",
            },
        }
    else:
        # Official/5E last and match are explicitly player summaries, not rosters.
        facts["data"] = {
            **_fields(data, SUMMARY_COLUMNS),
            "row_context": ROW_CONTEXT,
            "players": None,
        }
    return facts

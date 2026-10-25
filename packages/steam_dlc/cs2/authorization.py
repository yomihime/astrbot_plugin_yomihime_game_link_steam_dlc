"""Plain protocol descriptor; ONLY a host-reviewed pin may authorize its use.

Reference: CS2UID utils/api/login.py at ac46894dfb184bd27a81a9a5667aff49b8d0b226.
The DLC never receives the temporary ticket or the final token.
"""

PERFECT_QR_FLOW = {
    "flow_id": "perfect_qr",
    "apply": {
        "source_id": "perfect_auth",
        "path": "/qrAuth/applyToken",
        "method": "POST",
        "json_body": {"appId": "5", "qrType": "1", "redirect": False, "website": "pvp"},
        "headers": {"Content-Type": "application/json"},
    },
    "poll": {
        "source_id": "perfect_auth",
        "path": "/qrAuth/check",
        "method": "POST",
        "json_body": {"appId": "5"},
        "headers": {"Content-Type": "application/json"},
        "secret_json_fields": {"accessToken": "ticket"},
    },
    "qr_url_path": ["result", "accessUrl"],
    "ticket_capture": {
        "slot": "ticket",
        "path": ["result", "accessUrl"],
        "url_query": "accessToken",
    },
    "state_path": ["result", "status"],
    "pending_values": [0, 1],
    "success_values": [2],
    "expired_values": [3],
    "success_captures": [
        {"slot": "token", "path": ["result", "token"]},
        {
            "slot": "subject",
            "path": ["result", "accountItem", "steamId"],
            "pattern": "[0-9]{17}",
        },
    ],
    "subject_slot": "subject",
    "poll_interval_seconds": 2,
    "ttl_seconds": 60,
    "max_polls": 30,
}

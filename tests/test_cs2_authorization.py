"""Exercise the DLC protocol descriptor with the paired Core state machine."""

import importlib.util
import json
import os
import sys
import unittest
from pathlib import Path

from yomihime_game_link_sdk.services import HttpResponse

from packages.steam_dlc.cs2.authorization import PERFECT_QR_FLOW

ROOT = Path(__file__).resolve().parents[1]
CORE_CANDIDATES = (
    (ROOT / os.environ["YGL_CORE_ROOT"],)
    if os.environ.get("YGL_CORE_ROOT")
    else (ROOT / ".ci-core", ROOT / "worktrees/game-link-dlc-support")
)
CORE_SOURCE = next(
    (
        candidate / "services/source_authorizations.py"
        for candidate in CORE_CANDIDATES
        if (candidate / "services/source_authorizations.py").is_file()
    ),
    None,
)
if CORE_SOURCE is None:
    raise FileNotFoundError("Paired Core source is required for authorization checks")
SPEC = importlib.util.spec_from_file_location(
    "dlc_test_core_source_authorizations", CORE_SOURCE
)
assert SPEC is not None and SPEC.loader is not None
CORE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = CORE
SPEC.loader.exec_module(CORE)

PLAYER = "76561197960265851"


class PerfectAuthorizationTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.now = 1000.0
        self.binding = CORE.AuthorizationBinding(
            "owner", "admin", "page", "runtime", 2, 7
        )
        self.runners = []

    async def asyncTearDown(self):
        for runner in self.runners:
            await runner.close()

    def runner(self, states):
        responses = [
            {
                "code": 0,
                "result": {
                    "accessUrl": "https://identity.example.test/scan?accessToken=synthetic-ticket"
                },
            },
            *(
                {
                    "code": 0,
                    "result": {
                        "status": state,
                        "token": "synthetic-final-token"
                        if type(state) is int and state == 2
                        else "",
                        "accountItem": {"steamId": PLAYER},
                    },
                }
                for state in states
            ),
        ]
        requests, writes = [], []

        async def request(value):
            requests.append(value)
            return HttpResponse(200, {}, json.dumps(responses.pop(0)).encode())

        async def guard(binding):
            self.assertEqual(binding, self.binding)

        async def update(binding, captures):
            self.assertEqual(binding, self.binding)
            writes.append(dict(captures))

        runner = CORE.SourceAuthorizations(
            policies={
                "perfect_qr": CORE.AuthorizationFlowPolicy.from_descriptor(
                    PERFECT_QR_FLOW
                )
            },
            request=request,
            guard=guard,
            credential_update=update,
            clock=lambda: self.now,
            qr_encoder=lambda _url: b"\x89PNG\r\n\x1a\nsynthetic",
        )
        self.runners.append(runner)
        return runner, requests, writes

    async def test_unscanned_then_confirmation_pending_then_authorized(self):
        runner, requests, writes = self.runner([0, 1, 2])
        session = await runner.begin("perfect_qr", self.binding)
        self.assertEqual(session.state, "waiting")

        for expected_polls in (1, 2):
            self.now += 2
            view = await runner.poll(session.session_id, self.binding)
            self.assertEqual(view.state, "waiting")
            self.assertEqual(view.polls, expected_polls)
            self.assertIsNone(view.authorized_subject)
            self.assertEqual(writes, [])

        self.now += 2
        view = await runner.poll(session.session_id, self.binding)
        self.assertEqual(view.state, "authorized")
        self.assertEqual(view.polls, 3)
        self.assertEqual(view.authorized_subject, PLAYER)
        self.assertEqual(
            writes, [{"token": "synthetic-final-token", "subject": PLAYER}]
        )
        self.assertEqual(
            [request.path for request in requests],
            ["/qrAuth/applyToken", *["/qrAuth/check"] * 3],
        )
        for request in requests[1:]:
            self.assertEqual(
                json.loads(request.body),
                {"appId": "5", "accessToken": "synthetic-ticket"},
            )

    async def test_noninteger_and_unknown_states_are_rejected(self):
        for state in ("0", False, True, 99):
            with self.subTest(state=state, kind=type(state).__name__):
                runner, requests, writes = self.runner([state])
                session = await runner.begin("perfect_qr", self.binding)
                self.now += 2
                with self.assertRaisesRegex(
                    CORE.AuthorizationError, "^unknown_authorization_state$"
                ):
                    await runner.poll(session.session_id, self.binding)
                view = await runner.poll(session.session_id, self.binding)
                self.assertEqual(view.state, "error")
                self.assertEqual(writes, [])
                self.assertEqual(len(requests), 2)

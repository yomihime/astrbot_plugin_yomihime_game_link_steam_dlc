# ruff: noqa: E402
"""Real AstrBot 4.29.1 ZIP installation; isolated offline two-plugin acceptance.

The Host, PluginManager, lifecycle hooks, canonical SDK, Core, module factories,
command ingress and management HTTP routes are real. Events use an official
AstrMessageEvent subclass with an in-memory delivery sink. Only outbound HTTPS
response bytes are fixtures; this is neither real IM nor a live OpenDota check.
Run each installation order in a separate process and a new --work-root.
"""

import argparse
import asyncio
import builtins
import hashlib
import importlib.metadata
import json
import os
import shutil
import socket
import subprocess
import sys
import traceback
import uuid
import zipfile
from contextvars import ContextVar
from pathlib import Path
from types import SimpleNamespace

sys.dont_write_bytecode = True

CORE = "astrbot_plugin_yomihime_game_link"
DLC = CORE + "_steam_dlc"
HOST_REVISION = "dffe922773725e9c178392c423676ad65044748c"
MODULES = tuple("steam_dlc/" + name for name in ("steam", "dota2", "cs2", "deadlock"))
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--core-zip", type=Path, required=True)
parser.add_argument("--dlc-zip", type=Path, required=True)
parser.add_argument("--host-source", type=Path, required=True)
parser.add_argument("--work-root", type=Path, required=True)
parser.add_argument(
    "--diagnostics",
    action="store_true",
    help="Observe dependency failures without changing their results; synthetic data only",
)
parser.add_argument(
    "--dependency-site",
    action="append",
    type=Path,
    default=[],
    help="Explicit existing third-party site; use Python -I -S to skip .pth/editable startup",
)
parser.add_argument(
    "--font",
    type=Path,
    help="Optional canonical offline NotoSansCJKsc-Regular.otf fixture",
)
parser.add_argument(
    "--restart-check",
    action="store_true",
    help="Reopen only a root carrying this harness's exact marker and archive hashes",
)
parser.add_argument(
    "--cleanup-private-storage",
    action="store_true",
    help="After successful checks, delete only this synthetic root's private instance",
)
parser.add_argument(
    "--order", choices=("core-first", "dlc-first"), default="core-first"
)
args = parser.parse_args()
dependency_sites = [path.resolve(strict=True) for path in args.dependency_site]
for dependency_site in dependency_sites:
    if not dependency_site.is_dir() or any(
        dependency_site.glob("yomihime_game_link_sdk*")
    ):
        parser.error(
            "Explicit dependency site must be a directory without SDK packages or metadata"
        )
    sys.path.append(str(dependency_site))
from packaging.requirements import Requirement

if sys.flags.optimize:
    parser.error("Run without -O; assertions must remain enabled")
host_source = args.host_source.resolve(strict=True)
archives = {
    CORE: args.core_zip.resolve(strict=True),
    DLC: args.dlc_zip.resolve(strict=True),
}
font = args.font.resolve(strict=True) if args.font else None
if (
    font is not None
    and hashlib.sha256(font.read_bytes()).hexdigest()
    != "2c76254f6fc379fddfce0a7e84fb5385bb135d3e399294f6eeb6680d0365b74b"
):
    parser.error("Offline font hash is not canonical")
root = args.work_root.absolute()
if not args.restart_check and (root.exists() or root.is_symlink()):
    parser.error("--work-root must be a new nonexistent disposable directory")
if root.is_symlink():
    parser.error("Synthetic Host root must not be a symlink")
archive_hashes = {
    name: hashlib.sha256(path.read_bytes()).hexdigest()
    for name, path in archives.items()
}
marker = {
    "harness": "steam-two-plugins-v1",
    "root": str(root),
    "archives": archive_hashes,
}
if args.restart_check:
    try:
        previous_marker = json.loads(
            (root / "synthetic-root.json").read_text(encoding="utf-8")
        )
    except (OSError, ValueError):
        parser.error("Restart is restricted to a marked synthetic Host root")
    if {
        key: value for key, value in previous_marker.items() if key != "private_base"
    } != marker:
        parser.error("Restart marker/root/archive hashes do not match")
    marker = previous_marker
if not (host_source / "astrbot/dashboard/server.py").is_file():
    parser.error("--host-source must be an official AstrBot checkout")
host_git = [
    "git",
    "-c",
    "safe.directory=" + str(host_source).replace("\\", "/"),
    "-C",
    str(host_source),
]
host_revision = subprocess.check_output(
    host_git + ["rev-parse", "HEAD"], text=True
).strip()
if host_revision != HOST_REVISION:
    parser.error("Host revision differs from pinned 4.29.1 revision")
if subprocess.check_output(
    host_git + ["status", "--porcelain", "--untracked-files=no"],
    text=True,
).strip():
    parser.error("Host tracked files must be clean")
for archive in archives.values():
    with zipfile.ZipFile(archive) as bundle:
        lines = (
            bundle.read("requirements.txt").decode().splitlines()
            if "requirements.txt" in bundle.namelist()
            else []
        )
    for line in lines:
        if not line.strip() or line.strip().startswith("#"):
            continue
        requirement = Requirement(line)
        if requirement.url:
            parser.error("Direct URL dependency is prohibited in offline acceptance")
        if requirement.marker and not requirement.marker.evaluate():
            continue
        try:
            installed = importlib.metadata.version(requirement.name)
        except importlib.metadata.PackageNotFoundError:
            parser.error(f"Preinstall dependency: {requirement}")
        if installed not in requirement.specifier:
            parser.error(f"Preinstall compatible dependency: {requirement}")
if not args.restart_check:
    root.mkdir(parents=True)
    (root / "synthetic-root.json").write_text(json.dumps(marker), encoding="utf-8")
root = root.resolve()
sys.path[:0] = [str(root), str(host_source)]
os.chdir(root)
os.environ["ASTRBOT_ROOT"] = str(root)
os.environ["ASTRBOT_TEST_MODE"] = "true"
os.environ["ASTRBOT_DISABLE_METRICS"] = "1"
os.environ["ASTRBOT_DASHBOARD_INITIAL_PASSWORD"] = "SyntheticOnlyPassword123!"
os.environ.pop("ASTRBOT_RESET_DASHBOARD_PASSWORD", None)
os.environ.pop("YGL_SECRET_KEY", None)
runner = asyncio.Runner()
runner.get_loop()  # Windows Proactor socketpair must precede socket guards.
blocked = []
background = []
transport_calls = []
checks = []
request_gates = {}
command_payloads = ContextVar("synthetic_command_payloads", default=None)
result = {
    "host_revision": host_revision,
    "python": sys.version,
    "harness_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
    "executable": sys.executable,
    "dependency_sites": [str(path) for path in dependency_sites],
    "order": args.order,
    "root": str(root),
    "archives": {
        name: {
            "path": str(path),
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        }
        for name, path in archives.items()
    },
    "checks": checks,
    "boundary": "Real Host/ZIP/SDK/Core/commands/admin API; synthetic official events and offline HTTPS bodies; no live API, model or real IM",
}
synthetic_private_base = (
    Path(marker["private_base"])
    if args.restart_check and "private_base" in marker
    else None
)
identity_base = None
original_import = builtins.__import__


def isolated_core_import(name, globals=None, locals=None, fromlist=(), level=0):
    """Inject Core's trusted private-storage test base before initialization.

    The real Star imports Runtime lazily. No registry/factory is injected; the
    installed Core's native helper creates a unique protected synthetic base.
    """
    global synthetic_private_base, identity_base
    module = original_import(name, globals, locals, fromlist, level)
    module_name = getattr(module, "__name__", "")
    if (
        module_name == "data.plugins." + CORE + ".adapters.astrbot.runtime"
        and hasattr(module, "AstrBotRuntime")
        and not getattr(module, "_fixture_storage_injected", False)
    ):
        module._fixture_storage_injected = True
        native = importlib.import_module(
            "data.plugins." + CORE + ".infrastructure.windows.private_storage"
        )
        identity_base = native.identity_private_base()
        if synthetic_private_base is None:
            storage_name = "ygl-host-acceptance-" + uuid.uuid4().hex
            synthetic_private_base = native.create_private_directory(
                identity_base, storage_name
            )
            marker["private_base"] = str(synthetic_private_base)
            (root / "synthetic-root.json").write_text(
                json.dumps(marker), encoding="utf-8"
            )
        assert (
            synthetic_private_base.parent == identity_base
            and synthetic_private_base.name.startswith("ygl-host-acceptance-")
        )
        original_resolver = module.resolve_private_storage
        module.resolve_private_storage = lambda path: original_resolver(
            path, private_base=synthetic_private_base
        )
        result["trusted_test_injection"] = {
            "private_base": str(synthetic_private_base),
            "identity_base": str(identity_base),
            "existing_acl_changes": False,
        }
    return module


builtins.__import__ = isolated_core_import


def deny_network(*_args, **_kwargs):
    blocked.append("socket_or_dns_denied")
    raise OSError("Outbound network prohibited by offline acceptance")


socket.getaddrinfo = deny_network
socket.socket.connect = deny_network
socket.socket.connect_ex = deny_network
socket.socket.sendto = deny_network


class OfflinePopen(subprocess.Popen):
    def __init__(self, *_args, **_kwargs):
        blocked.append("subprocess_denied")
        raise OSError("Subprocess prohibited by offline acceptance")


subprocess.Popen = OfflinePopen
import aiohttp


async def deny_http(*_args, **_kwargs):
    blocked.append("http_denied")
    raise aiohttp.ClientConnectionError("HTTP prohibited by offline acceptance")


aiohttp.ClientSession._request = deny_http
import astrbot.core.core_lifecycle as lifecycle_module
import httpx
from astrbot.core import LogBroker, astrbot_config, db_helper
from astrbot.core.core_lifecycle import AstrBotCoreLifecycle
from astrbot.core.platform.astr_message_event import AstrMessageEvent
from astrbot.core.utils.t2i.network_strategy import NetworkRenderStrategy
from astrbot.dashboard.server import AstrBotDashboard


async def offline_t2i(_self):
    background.append("official_t2i_endpoint_refresh_neutralized")


async def offline_metadata():
    background.append("llm_metadata_refresh_neutralized")


NetworkRenderStrategy.get_official_endpoints = offline_t2i
lifecycle_module.update_llm_metadata = offline_metadata


class Event(AstrMessageEvent):
    """Official Host event type with synthetic identity and in-memory send."""

    def __init__(self, text, *, sender="A", platform="fixture-one", group=False):
        # Only the public identity/send methods used by the adapter are supplied.
        # No platform adapter, real session or network is created.
        self.text, self.sender, self.platform = text, sender, platform
        self.group = group
        self.calls = []
        self.role = "member"

    def get_message_str(self):
        return self.text

    def get_platform_id(self):
        return self.platform

    def get_sender_id(self):
        return self.sender

    def get_session_id(self):
        return "same-group" if self.group else self.sender

    def get_message_type(self):
        return "GroupMessage" if self.group else "FriendMessage"

    def chain_result(self, components):
        return type("SyntheticChain", (), {"chain": list(components)})()

    async def send(self, chain):
        self.calls.append(chain)
        return True


def passed(name, evidence=None):
    row = {"name": name, "status": "passed"}
    if evidence is not None:
        row["evidence"] = evidence
    checks.append(row)
    print("PASSED", name, flush=True)


def snapshot(runtime):
    return runtime.core_runtime.registry.snapshot()


def health_snapshot(runtime):
    rows = {}
    for module_id, module in snapshot(runtime).modules.items():
        for capability in module.manifest.capabilities:
            health, revision = runtime.core_runtime.health_resolver.current(
                module_id, capability.capability_id
            )
            rows[module_id + ":" + capability.capability_id] = {
                "status": str(health.status),
                "reason": health.reason,
                "revision": revision,
            }
            state = runtime.core_runtime.lifecycle.state(module_id)
            rows[module_id + ":" + capability.capability_id]["lifecycle"] = str(
                state.lifecycle
            )
            rows[module_id + ":" + capability.capability_id][
                "lifecycle_health_report"
            ] = repr(state.health_report)
    return rows


def observe_runtime(runtime):
    """Transparent diagnostic wrappers; never change errors or authorization."""

    admission = runtime.core_runtime.lifecycle.admission
    if not getattr(admission, "_fixture_observed", False):
        admission._fixture_observed = True
        for method_name in ("admit", "check"):
            original_method = getattr(admission, method_name)

            def observe(*args, _method=original_method, _name=method_name, **kwargs):
                try:
                    return _method(*args, **kwargs)
                except Exception as error:
                    result.setdefault("admission_exceptions", []).append(
                        {
                            "method": _name,
                            "type": type(error).__name__,
                            "message": str(error),
                            "traceback": traceback.format_exc(),
                        }
                    )
                    raise

            setattr(admission, method_name, observe)
    authority = type(runtime.core_runtime.owner_authority)
    if not getattr(authority, "_fixture_observed", False):
        authority._fixture_observed = True
        for method_name in ("capture_dependency", "require_current"):
            original_method = getattr(authority, method_name)

            async def observe_owner(
                *args, _method=original_method, _name=method_name, **kwargs
            ):
                try:
                    return await _method(*args, **kwargs)
                except Exception as error:
                    result.setdefault("owner_exceptions", []).append(
                        {
                            "method": _name,
                            "type": type(error).__name__,
                            "message": str(error),
                            "traceback": traceback.format_exc(),
                        }
                    )
                    raise

            setattr(authority, method_name, observe_owner)
    prefix = type(runtime).__module__.split(".adapters.astrbot.runtime")[0]
    public_errors = importlib.import_module(prefix + ".core.public_errors")
    if not getattr(public_errors, "_fixture_observed", False):
        public_errors._fixture_observed = True
        original_failure = public_errors.public_failure

        def observed_failure(error, phase="service"):
            result.setdefault("raw_public_boundary_failures", []).append(
                {
                    "phase": phase,
                    "type": type(error).__name__,
                    "message": str(error),
                    "traceback": "".join(traceback.format_exception(error)),
                }
            )
            return original_failure(error, phase)

        public_errors.public_failure = observed_failure
    dependency_type = importlib.import_module(
        prefix + ".services.dependency_calls"
    ).DependencyInvoker
    if not getattr(dependency_type, "_fixture_observed", False):
        dependency_type._fixture_observed = True
        original_invoke = dependency_type.invoke

        async def observe_dependency(self, invocation, capability, parameters):
            answer = await original_invoke(self, invocation, capability, parameters)
            result.setdefault("dependency_results", []).append(
                {
                    "caller": invocation.module_id,
                    "origin": str(invocation.origin),
                    "target": repr(capability),
                    "result": repr(answer),
                }
            )
            return answer

        dependency_type.invoke = observe_dependency

    def dependency_trace(frame, event, arg):
        if "/data/plugins/" + CORE + "/" in frame.f_code.co_filename.replace("\\", "/"):
            if event == "exception" and arg[0].__name__ in (
                "InvalidInvocation",
                "AccessDenied",
            ):
                result.setdefault("core_authorization_exception_events", []).append(
                    {
                        "file": frame.f_code.co_filename,
                        "line": frame.f_lineno,
                        "function": frame.f_code.co_name,
                        "type": arg[0].__name__,
                        "message": str(arg[1]),
                        "traceback": "".join(traceback.format_exception(*arg)),
                    }
                )
            return dependency_trace
        if frame.f_code.co_filename.replace("\\", "/").endswith(
            "/services/dependency_calls.py"
        ):
            if event == "exception" and arg[0] not in (
                StopIteration,
                StopAsyncIteration,
            ):
                result.setdefault("dependency_exception_events", []).append(
                    {
                        "line": frame.f_lineno,
                        "function": frame.f_code.co_name,
                        "type": arg[0].__name__,
                        "message": str(arg[1]),
                        "traceback": "".join(traceback.format_exception(*arg)),
                    }
                )
            return dependency_trace
        return None

    sys.settrace(dependency_trace)


def attach_transport(runtime):
    """Keep real transport request validation; replace HTTPS send boundary only."""
    if args.diagnostics:
        observe_runtime(runtime)

    async def fixture(method, url, body, headers, timeout, maximum):
        from yomihime_game_link_sdk.services import HttpResponse

        row = {
            "method": method,
            "host": url.host,
            "path": url.path,
            "query": dict(url.query),
        }
        transport_calls.append(row)
        assert method == "GET" and body is None, row
        if url.host == "api.opendota.com":
            gate = request_gates.get(url.path)
            if gate is not None:
                gate[0].set()
                await gate[1].wait()
            parts = url.path.strip("/").split("/")
            if (
                parts[:2] == ["api", "players"]
                and len(parts) == 4
                and parts[3] == "matches"
            ):
                assert dict(url.query) == {"significant": "0", "limit": "5"}, row
                payload = [
                    {
                        "match_id": 111,
                        "player_slot": 0,
                        "radiant_win": True,
                        "hero_id": 1,
                        "game_mode": 23,
                        "kills": 0,
                        "deaths": 2,
                        "assists": 3,
                        "duration": 1000,
                        "start_time": 1700000000,
                    }
                ]
            elif parts[:2] == ["api", "players"] and len(parts) == 3:
                payload = {
                    "profile": {
                        "account_id": int(parts[2]),
                        "personaname": "Fixture " + parts[2],
                        "steamid": str(76561197960265728 + int(parts[2])),
                    },
                    "rank_tier": 0,
                }
            elif parts[:2] == ["api", "matches"] and len(parts) == 3:
                payload = {
                    "match_id": int(parts[2]),
                    "radiant_win": True,
                    "duration": 1000,
                    "start_time": 1700000000,
                    "game_mode": 23,
                    "players": [
                        {
                            "player_slot": 0,
                            "hero_id": 1,
                            "kills": 0,
                            "deaths": 2,
                            "assists": 3,
                        }
                    ],
                }
            else:
                raise AssertionError(row)
            return HttpResponse(200, {}, json.dumps(payload).encode())
        # Existing FF14 calendar jobs are isolated, rather than sent upstream.
        return HttpResponse(503, {}, b"")

    runtime._http_transport._send = fixture


async def command(runtime, text, **identity):
    event = Event(text, **identity)
    if not hasattr(runtime, "_fixture_capture_installed"):
        runtime._fixture_capture_installed = True
        original_send = runtime._message_port.send_command
        original_private_send = runtime._message_port.send

        async def capture(ingress, target, payload, **kwargs):
            if command_payloads.get() is not None:
                command_payloads.get().append(payload.text)
            return await original_send(ingress, target, payload, **kwargs)

        async def capture_private(target, payload):
            if command_payloads.get() is not None:
                command_payloads.get().append(payload.text)
            return await original_private_send(target, payload)

        runtime._message_port.send_command = capture
        runtime._message_port.send = capture_private
    payloads = []
    token = command_payloads.set(payloads)
    try:
        reply = await runtime.handle_event(event)
    finally:
        command_payloads.reset(token)
    if reply is not None:
        # Help/errors are normally sent by the Star wrapper; keep plain evidence.
        rendered = str(reply)
    else:
        rendered = "\n".join(payloads)
    if "module temporarily unavailable" in rendered:
        result["failure_health"] = health_snapshot(runtime)
    result.setdefault("commands", []).append(
        {
            "text": text,
            "identity": identity,
            "output": rendered,
            "sends": len(event.calls),
        }
    )
    return rendered, event


async def main():
    astrbot_config["disable_metrics"] = True
    astrbot_config["provider"] = []
    astrbot_config["provider_sources"] = []
    astrbot_config["platform"] = []
    astrbot_config["dashboard"]["jwt_secret"] = (
        "synthetic-two-plugin-acceptance-key-over-32-bytes"
    )
    astrbot_config.save_config()
    if font is not None and not args.restart_check:
        target = (
            root
            / "data/plugin_data"
            / CORE
            / "resources/fonts/NotoSansCJKsc-Regular.otf"
        )
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(font, target)
    host = AstrBotCoreLifecycle(LogBroker(), db_helper)
    private_instance = None
    await host.initialize()

    async def synthetic_context_send(session, chain):
        result.setdefault("private_im_sink", []).append(
            {"session": str(session), "components": len(chain.chain)}
        )
        return True

    host.star_context.send_message = synthetic_context_send
    try:

        def star(name):
            metadata = host.star_context.get_registered_star(name)
            assert metadata is not None and metadata.star_cls is not None, name
            return metadata.star_cls

        async def install(name):
            disposable = root / (name + ".zip")
            shutil.copy2(archives[name], disposable)
            installed = await host.plugin_manager.install_plugin_from_file(
                str(disposable), ignore_version_check=False
            )
            result.setdefault("install", {})[name] = installed
            return star(name)

        if args.restart_check:
            runtime, dlc = star(CORE)._runtime, star(DLC)
            result["restart_health"] = health_snapshot(runtime)
            assert runtime.ready and dlc.connection_state == "connected"
            assert all(
                runtime.core_runtime.registry.is_active(name)
                for name in (*MODULES, "ff14/ff14")
            )
            prefix = type(star(CORE)).__module__.rsplit(".", 1)[0]
            storage_module = importlib.import_module(
                prefix + ".infrastructure.private_storage"
            )
            layout = storage_module.resolve_private_storage(
                runtime._data_dir, private_base=synthetic_private_base
            )
            private_instance = layout.instance_root
            output, _ = await command(runtime, "/ygl steam binding")
            assert "76561197960265729" in output, output
            passed("fresh-process-host-restart-binding-retained-and-five-modules")
            attach_transport(runtime)
            restarted_queries = []
            for text in ("/ygl dota2 recent", "/ygl dota2 profile"):
                output, _ = await command(runtime, text, group=True)
                restarted_queries.append((text, output))
            assert all(
                "本次查询账号 1" in output for text, output in restarted_queries
            ), restarted_queries
            passed("fresh-process-default-account-query-restored")
            return

        first, second = (CORE, DLC) if args.order == "core-first" else (DLC, CORE)
        await install(first)
        if first == DLC:
            waiting = star(DLC)
            assert waiting.connection_state == "waiting_core" and waiting._lease is None
            assert "yomihime_game_link_sdk" not in sys.modules
            assert not any(
                "SteamDLC" in repr(task.get_coro()) for task in asyncio.all_tasks()
            )
            passed("dlc-first-waiting-without-sdk-or-poll")
        await install(second)
        runtime, dlc = star(CORE)._runtime, star(DLC)
        assert runtime.ready and dlc.connection_state == "connected", (
            runtime.ready,
            dlc.connection_state,
        )
        assert all(
            runtime.core_runtime.registry.is_active(name)
            for name in (*MODULES, "ff14/ff14")
        )
        sdk = sys.modules["yomihime_game_link_sdk"]
        Path(sdk.__file__).resolve().relative_to(root / "data/plugins" / CORE)
        assert sdk.__version__ == sys.modules[type(star(CORE)).__module__].SDK_VERSION
        result["sdk_version"] = sdk.__version__
        result["sdk_origin"] = sdk.__file__
        passed(
            "real-zip-install-canonical-sdk-five-modules",
            list(snapshot(runtime).modules),
        )
        prefix = type(star(CORE)).__module__.rsplit(".", 1)[0]
        storage_module = importlib.import_module(
            prefix + ".infrastructure.private_storage"
        )
        layout = storage_module.resolve_private_storage(
            runtime._data_dir, private_base=synthetic_private_base
        )
        private_instance = layout.instance_root
        result["storage"] = {
            "data_root": str(runtime._data_dir),
            "storage_root": str(layout.storage_root),
            "instance_root": str(private_instance),
            "state": layout.security_status,
        }
        attach_transport(runtime)
        lease = dlc._lease
        await dlc._connect()
        assert dlc._lease is lease
        passed("registration-idempotent")
        for route in ("steam", "dota2", "cs2", "deadlock", "ff14"):
            help_text, _ = await command(runtime, "/ygl " + route + " help")
            assert help_text and "未找到模块" not in help_text, route
            if route in ("cs2", "deadlock"):
                status_text, _ = await command(runtime, "/ygl " + route + " status")
                assert "待实现" in status_text, (route, status_text)
        passed("five-module-command-help")
        steam_a, steam_b = "76561197960265729", "76561197960265730"
        output, _ = await command(runtime, "/ygl steam bind " + steam_a)
        assert steam_a in output and "声明" in output, output
        passed("private-steam-bind-self-asserted", output)
        for text, expected in (
            ("/ygl dota2 recent", "本次查询账号 1"),
            ("/ygl dota2 profile", "本次查询账号 1"),
            ("/ygl dota2 match 111", "比赛摘要：111"),
        ):
            output, _ = await command(runtime, text, group=True)
            assert expected in output, (text, output)
        assert {
            row["path"] for row in transport_calls if row["host"] == "api.opendota.com"
        } >= {"/api/players/1/matches", "/api/players/1", "/api/matches/111"}
        passed("group-default-dota-sdk-identity-three-get-queries")
        before = len(transport_calls)
        output, _ = await command(runtime, "/ygl dota2 profile", sender="B", group=True)
        assert (
            "绑定" in output or "关联" in output or "account binding required" in output
        ) and len(transport_calls) == before, output
        output2, _ = await command(
            runtime, "/ygl dota2 profile", platform="fixture-two", group=True
        )
        assert (
            "绑定" in output2
            or "关联" in output2
            or "account binding required" in output2
        ) and len(transport_calls) == before, output2
        await command(runtime, "/ygl steam bind " + steam_b, sender="B")
        output, _ = await command(runtime, "/ygl dota2 profile", sender="B", group=True)
        assert "Fixture 2" in output, output
        output, _ = await command(runtime, "/ygl steam binding")
        assert steam_a in output and steam_b not in output
        passed("same-group-A-B-and-cross-platform-isolation")
        output, _ = await command(runtime, "/ygl steam bind " + steam_b, group=True)
        assert "私聊" in output, output
        passed("group-binding-management-rejected")
        # The in-flight query already captured account 4 when a later explicit
        # binding command changes account A to 5. Its output must retain 4.
        await command(runtime, "/ygl steam bind 76561197960265732")
        gate = (asyncio.Event(), asyncio.Event())
        request_gates["/api/players/4/matches"] = gate
        inflight = asyncio.create_task(
            command(runtime, "/ygl dota2 recent", group=True)
        )
        try:
            await asyncio.wait_for(gate[0].wait(), 15)
            await command(runtime, "/ygl steam bind 76561197960265733")
        finally:
            gate[1].set()
        output, _ = await inflight
        del request_gates["/api/players/4/matches"]
        assert "本次查询账号 4" in output and "本次查询账号 5" not in output, output
        await command(runtime, "/ygl steam unbind")
        output, _ = await command(runtime, "/ygl dota2 profile", group=True)
        assert "绑定" in output or "account binding required" in output, output
        await command(runtime, "/ygl steam bind " + steam_a)
        passed("inflight-rebind-target-snapshot-and-unbind")
        handles = list(runtime._tool_publisher.handles)
        assert not any(handle.module_id == "steam_dlc/steam" for handle in handles)
        dota_handles = [
            handle for handle in handles if handle.module_id == "steam_dlc/dota2"
        ]
        assert len(dota_handles) == 3
        recent = next(
            handle
            for handle in dota_handles
            if handle.descriptor.capability_id == "recent"
        )
        assert "account" in recent.tool.parameters["properties"]
        result["published_tool_account_schema_required"] = (
            "account" in recent.tool.parameters["required"]
        )
        tool_event = Event("synthetic explicit-account Tool")
        from astrbot.core.agent.run_context import ContextWrapper

        wrapper = ContextWrapper(
            SimpleNamespace(event=tool_event, context=host.star_context)
        )
        tool_result = await recent.tool.call(wrapper, account="3")
        assert json.loads(tool_result)["account_id32"] == "3", tool_result
        before = len(transport_calls)
        try:
            missing_result = await recent.tool.call(wrapper)
        except Exception:
            pass
        else:
            assert "account_id32" not in json.loads(missing_result), missing_result
        assert len(transport_calls) == before
        passed("tools-explicit-target-and-no-binding-tools")
        dashboard = AstrBotDashboard(host, db_helper, asyncio.Event())
        token = dashboard.asgi_app.state.services.auth.generate_jwt("synthetic-admin")
        headers = {"Authorization": "Bearer " + token, "Origin": "https://test.invalid"}
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(dashboard.asgi_app),
            base_url="https://test.invalid",
            follow_redirects=True,
        ) as client:
            base = "/api/v1/plugins/extensions/" + CORE + "/admin/"
            for endpoint in ("modules", "catalog", "read"):
                response = await client.post(base + endpoint, headers=headers, json={})
                assert response.status_code == 200, (
                    endpoint,
                    response.status_code,
                    response.text,
                )
                result.setdefault("management", {})[endpoint] = response.json()
            module_json = json.dumps(result["management"]["modules"])
            assert all(module in module_json for module in MODULES), module_json
            settings = result["management"]["read"]["data"]
            assert (
                settings["steam_dlc/dota2"]["fields"]["timezone"]["value"]
                == "Asia/Shanghai"
            )
            for timezone_name in ("UTC", "Asia/Shanghai"):
                response = await client.post(
                    base + "update",
                    headers=headers,
                    json={
                        "module_id": "steam_dlc/dota2",
                        "expected_revision": settings["steam_dlc/dota2"]["revision"],
                        "updates": [
                            {
                                "field": "timezone",
                                "mode": "replace",
                                "value": timezone_name,
                            }
                        ],
                    },
                )
                assert response.status_code == 200, response.text
                settings = (
                    await client.post(base + "read", headers=headers, json={})
                ).json()["data"]
                assert (
                    settings["steam_dlc/dota2"]["fields"]["timezone"]["value"]
                    == timezone_name
                )
            result["management"]["dota_timezone_roundtrip"] = True
            public = await client.get(
                "/api/v1/plugins/extensions/" + CORE + "/catalog", headers=headers
            )
            assert public.status_code == 200, public.text
            result["management"]["public_catalog"] = public.json()
            assert all(module in json.dumps(public.json()) for module in MODULES), (
                public.text
            )
            for module_id in MODULES:
                for enabled in (False, True):
                    listed = (
                        await client.post(base + "modules", headers=headers, json={})
                    ).json()["data"]
                    response = await client.post(
                        base + "module-enabled",
                        headers=headers,
                        json={
                            "module_id": module_id,
                            "enabled": enabled,
                            "expected_registry_revision": listed["registry_revision"],
                        },
                    )
                    assert response.status_code == 200, (
                        module_id,
                        enabled,
                        response.text,
                    )
                    assert (
                        runtime.core_runtime.registry.is_active(module_id) is enabled
                    ), (module_id, enabled)
                    if module_id == "steam_dlc/steam" and not enabled:
                        before = len(transport_calls)
                        output, _ = await command(
                            runtime, "/ygl dota2 profile", group=True
                        )
                        assert (
                            "不可用" in output
                            or "失效" in output
                            or "module temporarily unavailable" in output
                        ), output
                        assert len(transport_calls) == before
        passed("four-modules-real-admin-disable-enable-and-provider-offline")
        passed("real-dashboard-api-modules-settings-and-public-catalog")
        # Real PluginManager reloads invoke public loaded/unloaded hooks.
        old_dlc, old_lease, old_host = dlc, dlc._lease, dlc._host
        recent = next(
            handle
            for handle in runtime._tool_publisher.handles
            if handle.module_id == "steam_dlc/dota2"
            and handle.descriptor.capability_id == "recent"
        )
        success, error = await host.plugin_manager.reload(DLC)
        assert success, error
        dlc = star(DLC)
        assert dlc is not old_dlc and dlc.connection_state == "connected"
        assert not old_lease.active
        await old_host.unregister_package(old_lease)
        await old_dlc.terminate()
        assert dlc._lease.active and all(
            runtime.core_runtime.registry.is_active(name) for name in MODULES
        )
        passed("dlc-reload-old-lease-and-late-termination-safe")
        try:
            await runtime.invoke_tool(
                recent.module_id,
                recent.descriptor.name,
                {"account": "3"},
                tool_event,
                tool_handle=recent,
            )
        except Exception:
            passed("old-tool-epoch-rejected-after-dlc-reload")
        else:
            raise AssertionError("stale Tool epoch accepted")
        for name in (DLC, CORE):
            await host.plugin_manager.turn_off_plugin(name)
            assert not host.star_context.get_registered_star(name).activated
            if name == DLC:
                assert not any(
                    runtime.core_runtime.registry.is_active(module)
                    for module in MODULES
                )
            await host.plugin_manager.turn_on_plugin(name)
            runtime, dlc = star(CORE)._runtime, star(DLC)
            assert runtime.ready and dlc.connection_state == "connected", (
                name,
                runtime.ready,
                dlc.connection_state,
            )
            attach_transport(runtime)
            output, _ = await command(runtime, "/ygl steam binding")
            assert steam_a in output, output
            passed(name + "-disable-enable-binding-retained")
        previous_core, previous_lease = runtime.core_runtime, dlc._lease
        success, error = await host.plugin_manager.reload(CORE)
        assert success, error
        runtime, dlc = star(CORE)._runtime, star(DLC)
        assert runtime.ready and dlc.connection_state == "connected"
        assert runtime.core_runtime is not previous_core and not previous_lease.active
        attach_transport(runtime)
        output, _ = await command(runtime, "/ygl steam binding")
        assert steam_a in output, output
        passed("core-reload-reconnect-old-generation-invalid-binding-retained")
        await host.plugin_manager.uninstall_plugin(
            DLC, delete_config=False, delete_data=False
        )
        assert not any(
            runtime.core_runtime.registry.is_active(module) for module in MODULES
        )
        assert not any(
            handle.module_id in MODULES for handle in runtime._tool_publisher.handles
        )
        assert runtime.core_runtime.registry.is_active("ff14/ff14")
        await install(DLC)
        output, _ = await command(runtime, "/ygl steam binding")
        assert steam_a in output, output
        passed("real-uninstall-cleans-modules-tools-preserves-binding-and-ff14")
        assert all(row["method"] == "GET" for row in transport_calls)
        passed(
            "no-post-no-live-network",
            {"fixture_requests": len(transport_calls), "blocked": len(blocked)},
        )
    finally:
        await host.stop()
        result["private_synthetic_instance"] = (
            str(private_instance) if private_instance else None
        )
        if args.cleanup_private_storage and private_instance is not None:
            # The exact hash must derive from this marked synthetic data root.
            expected_identity = storage_module.instance_identity(runtime._data_dir)
            assert private_instance.name == expected_identity
            assert private_instance.parent.name == "instances"
            assert private_instance.parent.parent.name == "yomihime-game-link"
            assert (
                json.loads((root / "synthetic-root.json").read_text(encoding="utf-8"))
                == marker
            )
            assert synthetic_private_base.parent == identity_base
            assert synthetic_private_base.name.startswith("ygl-host-acceptance-")
            private_instance.relative_to(synthetic_private_base)
            shutil.rmtree(synthetic_private_base)
            assert not synthetic_private_base.exists()
            result["private_storage_cleanup"] = (
                "removed exact synthetic instance after Host stop"
            )


if __name__ == "__main__":
    try:
        runner.run(main())
    except BaseException as error:
        checks.append(
            {
                "name": "execution",
                "status": "failed",
                "type": type(error).__name__,
                "message": str(error),
                "traceback": traceback.format_exc(),
            }
        )
        raise
    finally:
        runner.close()
        result["blocked_operations"] = blocked
        result["offline_background_jobs"] = background
        result["fixture_transport_requests"] = transport_calls
        result["unrun"] = [
            "real IM delivery",
            "live OpenDota (separate smoke)",
            "browser visual acceptance",
        ]
        expected_checks = (
            [
                "fresh-process-host-restart-binding-retained-and-five-modules",
                "fresh-process-default-account-query-restored",
            ]
            if args.restart_check
            else [
                "real-zip-install-canonical-sdk-five-modules",
                "registration-idempotent",
                "five-module-command-help",
                "private-steam-bind-self-asserted",
                "group-default-dota-sdk-identity-three-get-queries",
                "same-group-A-B-and-cross-platform-isolation",
                "group-binding-management-rejected",
                "inflight-rebind-target-snapshot-and-unbind",
                "tools-explicit-target-and-no-binding-tools",
                "four-modules-real-admin-disable-enable-and-provider-offline",
                "real-dashboard-api-modules-settings-and-public-catalog",
                "dlc-reload-old-lease-and-late-termination-safe",
                "old-tool-epoch-rejected-after-dlc-reload",
                DLC + "-disable-enable-binding-retained",
                CORE + "-disable-enable-binding-retained",
                "core-reload-reconnect-old-generation-invalid-binding-retained",
                "real-uninstall-cleans-modules-tools-preserves-binding-and-ff14",
                "no-post-no-live-network",
            ]
        )
        if args.order == "dlc-first" and not args.restart_check:
            expected_checks.append("dlc-first-waiting-without-sdk-or-poll")
        for expected in expected_checks:
            if not any(row["name"] == expected for row in checks):
                result["unrun"].append(expected)
        if not args.restart_check:
            result["unrun"].append(
                "fresh-process Host restart (run --restart-check on this marked root)"
            )
        for unrun in result["unrun"]:
            checks.append({"name": unrun, "status": "unrun"})
        result["counts"] = {
            status: sum(row["status"] == status for row in checks)
            for status in ("passed", "failed", "skipped", "unrun")
        }
        (
            root
            / ("two-plugins-restart.json" if args.restart_check else "two-plugins.json")
        ).write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
        print(
            json.dumps(
                {
                    "counts": result["counts"],
                    "evidence": str(
                        root
                        / (
                            "two-plugins-restart.json"
                            if args.restart_check
                            else "two-plugins.json"
                        )
                    ),
                },
                ensure_ascii=False,
            ),
            flush=True,
        )

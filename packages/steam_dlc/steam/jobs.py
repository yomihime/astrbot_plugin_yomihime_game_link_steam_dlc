"""Steam selection and bounded documents; Core owns durable work and rendering."""

from __future__ import annotations

import hashlib
import json
import re
import shlex
from collections.abc import Mapping
from dataclasses import replace
from decimal import Decimal

import yomihime_game_link_sdk as ygl
from yomihime_game_link_sdk.jobs import JobRequest
from yomihime_game_link_sdk.storage import SecretMetadataState

from ..shared.output import failure
from .career import grid_spec, load_full, preflight
from .queries import QueryFailure, load
from .wall import options, select, source_rows
from .wall_presentation import result

BATCH_SIZE = 128


class SteamWallJob:
    def __init__(self, owner):
        self.owner = owner

    async def run(self, invocation, parameters, control):
        if invocation.origin is not ygl.InvocationOrigin.JOB or not self.owner._running:
            raise ygl.AccessDenied()
        from .module import _account

        value = options(invocation, parameters)
        target = _account(value["account"])
        scope = await self.owner._services.scopes.bind(invocation)
        config = await self.owner._services.config.current()

        async def source_failed(exc):
            code = exc.code if isinstance(exc, QueryFailure) else None
            reason = (
                "rate_limited"
                if code is ygl.ErrorCode.RATE_LIMITED
                or isinstance(exc, ygl.SourceHttpError)
                and exc.status_code == 429
                else "steam_source_not_public"
                if code is ygl.ErrorCode.NOT_PUBLIC or isinstance(exc, PermissionError)
                else "steam_source_unavailable"
            )
            await control.update({"phase": "blocked", "reason": reason})

        if value["source"] == "full":
            metadata = next(
                (
                    meta
                    for meta in getattr(config, "secret_metadata", ())
                    if meta.field == "credential_steam_key"
                    and meta.state is SecretMetadataState.ACTIVE
                ),
                None,
            )
            if metadata is None:
                await control.update(
                    {"phase": "blocked", "reason": "steam_key_required"}
                )
                raise ValueError(
                    "完整库需要可信设置页配置Steam Key，未使用公开样本替代。"
                )
            try:
                projection = await load_full(
                    scope,
                    target,
                    credential_revision=metadata.revision,
                    refresh=value["refresh"],
                )
            except Exception as exc:
                await source_failed(exc)
                raise
        else:
            try:
                projection = await load(scope, value["source"], target, cache=False)
            except Exception as exc:
                await source_failed(exc)
                raise
        rows, _ = source_rows(projection)
        positive = [
            row["app_id"]
            for row in rows
            if row["minutes"] is not None and Decimal(row["minutes"]) > 0
        ]
        metadata_items = []
        counters: dict[str, int] = {}
        generated, missing, batches, selected_count = 0, 0, 0, None

        def count(payload):
            for key, amount in payload["counters"].items():
                counters[key] = (
                    max(counters.get(key, 0), amount)
                    if key == "retry_after"
                    else counters.get(key, 0) + amount
                )

        async def require_budget(payload):
            values = payload["counters"]
            if values.get("rate_limited", 0):
                await control.update(
                    {
                        "phase": "blocked",
                        "reason": "rate_limited",
                        "generated": generated,
                        "selected": selected_count,
                        "pending": None
                        if selected_count is None
                        else selected_count - generated,
                        "retry_after": values.get("retry_after", 0),
                        "counters": dict(counters),
                    }
                )
                raise QueryFailure(
                    ygl.ErrorCode.RATE_LIMITED,
                    "Steam来源限流，已停止后续批次；完成页保留。",
                    values.get("retry_after") or None,
                )
            if values.get("budget_skipped", 0):
                await control.update(
                    {
                        "phase": "blocked",
                        "reason": "resource_budget",
                        "generated": generated,
                        "selected": selected_count,
                        "pending": None
                        if selected_count is None
                        else selected_count - generated,
                        "counters": dict(counters),
                    }
                )
                raise ygl.ServiceUnavailable()

        await control.update(
            {"phase": "metadata", "source_returned": len(rows), "examined": 0}
        )
        for start in range(0, len(positive), 100):
            payload = await self.owner._materials.prepare(
                scope,
                positive[start : start + 100],
                refresh=value["refresh"],
                phase="metadata",
            )
            metadata_items.extend(payload["items"])
            count(payload)
            await require_budget(payload)
            await control.update(
                {
                    "phase": "metadata",
                    "source_returned": len(rows),
                    "examined": min(start + 100, len(positive)),
                }
            )
        policy = {
            key: value[key]
            for key in (
                "limit",
                "limit_mode",
                "all_apps",
                "mode",
                "preset",
                "aspect",
                "quality",
                "fit",
            )
        }
        selection = select(projection, {"items": metadata_items}, **policy)
        unclassified = selection["counts"]["metadata_unexamined"]
        if unclassified and not value["all_apps"]:
            # Complete library coverage does not prove unknown app types.
            await control.update(
                {
                    "phase": "blocked",
                    "reason": "metadata_incomplete",
                    "source_returned": len(rows),
                    "metadata_unexamined": unclassified,
                    "verified_eligible": selection["counts"]["eligible"],
                    "generated": 0,
                    "selected": None,
                    "pending": None,
                    "counters": dict(counters),
                }
            )
            raise QueryFailure(
                ygl.ErrorCode.UPSTREAM_ERROR,
                "部分作品类型尚未验证，无法完成仅游戏筛选；请稍后重试。",
            )
        chosen = selection["rows"]
        selected_count = len(chosen)
        counters["list_requests"] = projection.get(
            "source_requests",
            0 if projection.get("cache", {}).get("status") == "hit" else 1,
        )
        theme = config.values.get("reply_theme", "warm_paper")
        if theme not in ("warm_paper", "cool_white", "deep_indigo"):
            theme = "warm_paper"
        # A restart is interrupted by Core. Explicit retry recomputes selection;
        # checkpoints describe progress, never claim automatic continuation.
        start = 0
        while start < len(chosen):
            chunk = chosen[start : start + BATCH_SIZE]
            if value["mode"] == "dense":
                width, height = grid_spec(value["aspect"], value["quality"])
                body_rows = min(
                    32, ((128 * 1024 * 1024) // 36 // (20 * width)) // height
                )
                largest = max(row["span"] for row in chunk)
                conservative_items = 4 * (20 // largest) * (body_rows // largest)
                chunk = chunk[: max(1, conservative_items)]
            # Four placement pages leave room within Core's eight-page render
            # budget for measured headers/footers. Long-tail tiles share a
            # larger batch; large tiles use smaller batches.
            while len(preflight(dict(selection, rows=chunk)) or ()) > 4:
                chunk = chunk[: max(1, len(chunk) // 2)]
            payload = await self.owner._materials.prepare(
                scope, [row["app_id"] for row in chunk]
            )
            count(payload)
            await require_budget(payload)
            material_by_id = {item["app_id"]: item for item in payload["items"]}
            batch_rows = [
                dict(
                    row, asset_id=material_by_id.get(row["app_id"], {}).get("asset_id")
                )
                for row in chunk
            ]
            asset_ids = tuple(
                dict.fromkeys(row["asset_id"] for row in batch_rows if row["asset_id"])
            )
            pin = (
                await scope.resources.pin(asset_ids, lease_seconds=1800)
                if asset_ids
                else None
            )
            try:
                batch = dict(selection, rows=batch_rows, counters=dict(counters))
                batch["counts"] = dict(
                    selection["counts"],
                    included=len(batch_rows),
                    limited=selection["counts"]["eligible"] - len(batch_rows),
                    omitted=selection["counts"]["eligible"] - len(batch_rows),
                    missing_images=sum(not row["asset_id"] for row in batch_rows),
                )
                batch["all_eligible_included"] = (
                    len(batch_rows) == selection["counts"]["eligible"]
                )
                preflight(batch)
                document = result(batch, private=True, theme=theme).document
                note = f"第{batches + 1}批 · 总选择{len(chosen)}项中的第{start + 1}–{start + len(chunk)}项；当前图片仅展示此批，任务完成状态见结果索引。"
                document = replace(
                    document,
                    card=replace(document.card, sources=(*document.card.sources, note)),
                )
                await control.publish_document(
                    document,
                    metadata={
                        "batch_index": batches,
                        "start": start,
                        "end": start + len(chunk),
                        "item_count": len(chunk),
                    },
                )
            finally:
                if pin is not None:
                    await scope.resources.unpin(pin)
            generated += len(chunk)
            missing += sum(not row["asset_id"] for row in batch_rows)
            batches += 1
            start += len(chunk)
            await control.update(
                {
                    "phase": "rendering",
                    "selected": len(chosen),
                    "generated": generated,
                    "pending": len(chosen) - generated,
                    "missing_images": missing,
                    "batches": batches,
                },
                checkpoint={
                    "completed_batches": batches,
                    "generated": generated,
                    "restart_policy": "explicit_retry_recompute",
                },
            )
        return {
            "source_returned": len(rows),
            "eligible": selection["counts"]["eligible"],
            "selected": len(chosen),
            "generated": generated,
            "pending": 0,
            "missing_images": missing,
            "failed": 0,
            "batches": batches,
            "complete_source": selection["complete_library"],
            "scope": selection["scope"],
            "completed_exactly": generated == len(chosen),
            "counters": counters,
            "all_eligible_included": selection["all_eligible_included"],
            "classification_complete": unclassified == 0,
            "metadata_unexamined": unclassified,
            "metadata_failures": counters.get("metadata_failed", 0),
            "unknown_duration": selection["counts"]["unknown_duration"],
            "zero_duration": selection["counts"]["zero_duration"],
        }


def job_projection(job):
    return {
        "job_id": job.job_id,
        "revision": job.revision,
        "handler_id": job.handler_id,
        "status": job.status.value,
        "progress": dict(job.progress),
        "summary": dict(job.summary),
        "error_code": job.error_code,
    }


class JobHandler:
    """Capability facade. Page/command ownership is issued by Core, never inferred."""

    def __init__(self, owner, operation, *, explicit=False):
        self.owner, self.operation, self.explicit = owner, operation, explicit

    async def command(self, context, scope, raw):
        """Read one caller-owned result image; never fan out an index to chat."""
        args = shlex.split(raw)
        if not args or args[0] not in ("status", "result", "cancel", "retry"):
            return None
        if (
            self.explicit
            or context.origin is not ygl.InvocationOrigin.COMMAND
            or context.parent_id is not None
            or not context.actor_id
        ):
            raise ValueError("任务命令需要当前用户直接发起。")
        if len(args) < 2 or not 1 <= len(args[1]) <= 256:
            raise ValueError("请提供任务ID。")
        action, job_id = args[:2]
        page_number, image_number, seen = 1, 1, set()
        index = 2
        while index < len(args):
            token = args[index]
            if (
                action != "result"
                or token not in ("--page", "--image")
                or token in seen
                or index + 1 >= len(args)
            ):
                raise ValueError("任务参数缺值、重复或不受支持。")
            seen.add(token)
            index += 1
            if not re.fullmatch(r"[1-9][0-9]{0,8}", args[index]):
                raise ValueError("页码与图片序号必须为正整数。")
            if token == "--page":
                page_number = int(args[index])
            else:
                image_number = int(args[index])
            index += 1
        job = await scope.jobs.status(job_id)
        if action in ("cancel", "retry"):
            job = await getattr(scope.jobs, action)(
                job_id, expected_revision=job.revision
            )
        facts = job_projection(job)
        text = f"任务{job.job_id} · {job.status.value} · 修订{job.revision}。"
        blocks = []
        if action == "result":
            cursor = None
            for current_page in range(1, page_number + 1):
                page = await scope.jobs.result(job_id, cursor=cursor, page_size=20)
                if current_page < page_number and page.next_cursor is None:
                    raise ValueError(
                        f"当前结果只有{current_page}页；任务可能仍在生成。"
                    )
                cursor = page.next_cursor
            entries = page.entries
            if not entries:
                text += "当前没有已完成图片；不代表来源空库，请查看任务状态。"
            else:
                if not 1 <= image_number <= len(entries):
                    raise ValueError(f"本页图片序号范围1..{len(entries)}。")
                resource = entries[image_number - 1].get("resource")
                if (
                    not isinstance(resource, Mapping)
                    or resource.get("media_type") != "image/png"
                    or not isinstance(resource.get("asset_id"), str)
                ):
                    raise ValueError("任务资源索引无法验证。")
                blocks.append(
                    ygl.ImageBlock(
                        resource["asset_id"],
                        f"任务{job_id} 第{page_number}页第{image_number}张",
                        visibility=ygl.Privacy.PRIVATE,
                    )
                )
                text += f"结果索引第{page_number}页，本页{len(entries)}张；本次只返回第{image_number}张。"
                if image_number < len(entries):
                    text += f"下一张：/ygl steam wall result {job_id} --page {page_number} --image {image_number + 1}。"
                if page.next_cursor is not None:
                    text += f"下一页：/ygl steam wall result {job_id} --page {page_number + 1}。"
        counts = job.summary or job.progress
        text += f"已选{counts.get('selected', '待确认')}，已生成{counts.get('generated', 0)}，待处理{counts.get('pending', '待确认')}，缺图{counts.get('missing_images', 0)}。已发布图片资源{counts.get('result_entries', '待确认')}项，来源完整性{counts.get('complete_source', '待确认')}。"
        return ygl.CapabilityResult(
            "steam-wall-job",
            ygl.ResultStatus.SUCCESS,
            document=ygl.DisplayDocument(
                "Steam · 拼图任务",
                "Steam DLC",
                (
                    ygl.TextBlock(text),
                    *blocks,
                    ygl.FieldsBlock({"job_result": {"job": facts}}, fallback_text=text),
                ),
                privacy=ygl.Privacy.PRIVATE,
            ),
            privacy=ygl.Privacy.PRIVATE,
        )

    async def invoke(self, context, parameters):
        from .module import _account, _Handler

        privacy = ygl.Privacy.PUBLIC if self.explicit else ygl.Privacy.PRIVATE
        try:
            if not self.owner._running:
                raise ygl.ServiceUnavailable()
            scope = await self.owner._services.scopes.bind(context)
            raw = parameters.get("command")
            if isinstance(raw, str) and len(raw) <= 512:
                response = await self.command(context, scope, raw)
                if response is not None:
                    return response
            if self.operation == "submit":
                config = await self.owner._services.config.current()
                value = options(
                    context,
                    parameters,
                    default_limit=config.values.get("poster_limit", 500),
                    default_apps=config.values.get("poster_include_apps", True),
                    defaults=config.values,
                )
                if value["account"] is None:
                    if (
                        self.explicit
                        or context.origin is not ygl.InvocationOrigin.COMMAND
                        or context.parent_id is not None
                    ):
                        raise ValueError("工具和页面必须明确提供account。")
                    identity = await _Handler(self.owner, "identity").invoke(
                        context, {}
                    )
                    if identity.status is not ygl.ResultStatus.SUCCESS:
                        return identity
                    value["account"] = identity.document.ordered_blocks[0].fields[
                        "identity"
                    ]["steam_id64"]
                value["account"] = _account(value["account"])
                if value["source"] == "full" and not any(
                    meta.field == "credential_steam_key"
                    and meta.state is SecretMetadataState.ACTIVE
                    for meta in getattr(config, "secret_metadata", ())
                ):
                    return ygl.CapabilityResult(
                        "steam-wall-full-unconfigured",
                        ygl.ResultStatus.NEEDS_SELECTION,
                        document=ygl.DisplayDocument(
                            "Steam · 完整库未配置",
                            "Steam DLC",
                            (
                                ygl.TextBlock(
                                    "完整库需要在可信管理页配置Steam Key；未用公开样本替代。可改选games/recent。"
                                ),
                            ),
                            privacy=privacy,
                        ),
                        privacy=privacy,
                        model_facts=ygl.FactDocument(
                            {
                                "status": "needs_configuration",
                                "source": "full",
                                "steam_key_required": True,
                                "sample_fallback": False,
                            }
                        )
                        if self.explicit
                        else None,
                    )
                fingerprint = hashlib.sha256(
                    json.dumps(value, sort_keys=True, separators=(",", ":")).encode()
                ).hexdigest()
                job = await scope.jobs.submit(
                    JobRequest("steam_wall", value, fingerprint)
                )
                payload = {"job": job_projection(job)}
                message = f"拼图任务已提交：{job.job_id}。/ygl steam wall status {job.job_id} 查看状态；/ygl steam wall result {job.job_id} 按索引逐图查看。不会自动发送多张图片。"
            else:
                job_id = parameters.get("job_id")
                if not isinstance(job_id, str) or not 1 <= len(job_id) <= 256:
                    raise ValueError("需要有效任务ID。")
                if self.operation == "result":
                    page = await scope.jobs.result(
                        job_id, cursor=parameters.get("cursor"), page_size=20
                    )
                    payload = {
                        "job": job_projection(page.job),
                        "entries": list(page.entries),
                        "next_cursor": page.next_cursor,
                    }
                    message = "任务结果仅覆盖本次来源实际返回范围。"
                else:
                    if self.operation in ("cancel", "retry"):
                        revision = parameters.get("expected_revision")
                        if type(revision) is not int or revision < 1:
                            raise ValueError("取消或重试需要当前任务修订。")
                        job = await getattr(scope.jobs, self.operation)(
                            job_id, expected_revision=revision
                        )
                    else:
                        job = await scope.jobs.status(job_id)
                    payload = {"job": job_projection(job)}
                    message = f"任务状态：{job.status.value}。"
            return ygl.CapabilityResult(
                "steam-wall-job",
                ygl.ResultStatus.SUCCESS,
                document=ygl.DisplayDocument(
                    "Steam · 拼图任务",
                    "Steam DLC",
                    (
                        ygl.TextBlock(message),
                        ygl.FieldsBlock({"job_result": payload}, fallback_text=message),
                    ),
                    privacy=privacy,
                ),
                privacy=privacy,
                model_facts=ygl.FactDocument(
                    {
                        "job_id": payload["job"]["job_id"],
                        "status": payload["job"]["status"],
                        "handler_id": "steam_wall",
                        "results_owner_bound": True,
                        "automatic_delivery": False,
                        "next_action": "使用 /ygl steam wall status <job_id> 和 /ygl steam wall result <job_id> 查询；queued不表示已经生成。",
                    }
                )
                if self.explicit
                else None,
            )
        except ygl.RevisionConflict:
            return failure(
                ygl.ErrorCode.PARAMETER_ERROR,
                "任务状态已变化，请先重新查询状态再操作。",
                privacy=privacy,
            )
        except ValueError as exc:
            return failure(ygl.ErrorCode.PARAMETER_ERROR, str(exc), privacy=privacy)
        except (ygl.AccessDenied, ygl.InvalidInvocation, ygl.ServiceUnavailable):
            return failure(
                ygl.ErrorCode.MODULE_UNAVAILABLE,
                "任务不可用或本次授权已失效。",
                privacy=privacy,
            )

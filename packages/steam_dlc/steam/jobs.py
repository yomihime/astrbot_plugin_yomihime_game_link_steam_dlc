"""Steam selection and bounded documents; Core owns durable work and rendering."""

from __future__ import annotations

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


def _retry_seconds(value):
    return value if type(value) is int and 0 <= value <= 86400 else None


def _feedback(job):
    """Safe recovery instructions based on Core's persisted job projection."""
    states = {
        "queued": "排队中",
        "running": "运行中",
        "succeeded": "已完成",
        "failed": "失败",
        "cancelled": "已取消",
        "interrupted": "已中断",
    }
    reasons = {
        "steam_key_required": "完整库需要在可信管理页配置 Steam Key，也可改选公开样本。",
        "steam_source_unavailable": "所选 Steam 来源暂不可用，请稍后重试或另行选择来源。",
        "steam_source_not_public": "Steam 库未公开或来源授权受限，库内容仍待确认；请检查公开设置和可信配置。",
        "steam_source_access_denied": "所选 Steam 来源授权或访问受限，库内容仍待确认；请检查可信配置和目标账号的公开设置。",
        "rate_limited": "来源限流，请等待后再操作；已发布结果保留。",
        "resource_budget": "资源预算不足，已停止后续批次；可减少数量后重新执行，已发布结果保留。",
        "metadata_incomplete": "部分作品类型仍待验证，仅游戏筛选尚待完成；请稍后重试。",
    }
    status = job.status.value
    counts = {**job.progress, **job.summary}
    text = f"任务 {job.job_id} · {states.get(status, '状态待确认')}。"
    reason = counts.get("reason")
    if reason in reasons:
        text += reasons[reason]
    elif reason or status == "failed":
        text += "任务暂时无法完成，请查询状态并稍后重新执行；详细原因未确认。"
    wait = _retry_seconds(counts.get("retry_after"))
    if reason == "rate_limited" and wait is not None:
        text += f"来源建议等待{wait}秒后再操作（届时请手动重试）。"
    text += f"状态查询：/ygl steam wall status {job.job_id}。"
    if status in ("queued", "running"):
        text += f"可取消：/ygl steam wall cancel {job.job_id}；当前不可重试。"
    elif status in ("failed", "cancelled", "interrupted"):
        text += f"显式重新执行：/ygl steam wall retry {job.job_id}；从头重新计算并复用有效缓存。"
    published = counts.get("result_entries")
    if type(published) is int and published > 0:
        text += f"已发布{published}项图片资源，可查看：/ygl steam wall result {job.job_id}。"
    return text


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
        progress_snapshot = {}

        async def update(progress, *, checkpoint=None):
            # Core replaces progress rather than merging it. Keep the complete
            # observed snapshot, including counts from already published batches.
            progress_snapshot.update(progress)
            await control.update(dict(progress_snapshot), checkpoint=checkpoint)

        async def source_failed(exc):
            code = exc.code if isinstance(exc, QueryFailure) else None
            reason = (
                "rate_limited"
                if code is ygl.ErrorCode.RATE_LIMITED
                or isinstance(exc, ygl.SourceHttpError)
                and (exc.status_code == 429 or exc.code == "rate_limited")
                else "steam_source_access_denied"
                if isinstance(exc, ygl.SourceHttpError)
                and exc.status_code in (401, 403)
                else "steam_source_not_public"
                if code is ygl.ErrorCode.NOT_PUBLIC or isinstance(exc, PermissionError)
                else "steam_source_unavailable"
            )
            progress: dict[str, str | int] = {"phase": "blocked", "reason": reason}
            retry = _retry_seconds(
                exc.retry_after
                if isinstance(exc, QueryFailure)
                else getattr(exc, "retry_after_seconds", None)
            )
            if reason == "rate_limited" and retry is not None:
                progress["retry_after"] = retry
            await update(progress)

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
                await update({"phase": "blocked", "reason": "steam_key_required"})
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
        candidates = (
            positive[: value["limit"]]
            if value["all_apps"] and value["limit_mode"] == "top"
            else positive
        )
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
                await update(
                    {
                        "phase": "blocked",
                        "reason": "rate_limited",
                        "generated": generated,
                        "selected": selected_count,
                        "pending": None
                        if selected_count is None
                        else selected_count - generated,
                        **(
                            {"retry_after": values["retry_after"]}
                            if _retry_seconds(values.get("retry_after")) is not None
                            and values["retry_after"] > 0
                            else {}
                        ),
                        "counters": dict(counters),
                    }
                )
                raise QueryFailure(
                    ygl.ErrorCode.RATE_LIMITED,
                    "Steam来源限流，已停止后续批次；完成页保留。",
                    values.get("retry_after") or None,
                )
            if values.get("budget_skipped", 0):
                await update(
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

        await update(
            {
                "phase": "metadata",
                "source_returned": len(rows),
                "examined": 0,
                "selected": None,
                "generated": 0,
                "pending": None,
                "missing_images": 0,
                "batches": 0,
            }
        )
        examined, verified_games, prefix_unknown = 0, 0, 0
        while examined < len(candidates):
            remaining = (
                value["limit"] - verified_games
                if not value["all_apps"] and value["limit_mode"] == "top"
                else 100
            )
            chunk = candidates[examined : examined + min(100, remaining)]
            payload = await self.owner._materials.prepare(
                scope,
                chunk,
                refresh=value["refresh"],
                phase="metadata",
            )
            metadata_items.extend(payload["items"])
            by_id = {item["app_id"]: item for item in payload["items"]}
            verified_games += sum(
                by_id.get(appid, {}).get("app_type") == "game" for appid in chunk
            )
            prefix_unknown += sum(
                by_id.get(appid, {}).get("app_type", "unknown") == "unknown"
                for appid in chunk
            )
            examined += len(chunk)
            count(payload)
            await update(
                {
                    "phase": "metadata",
                    "source_returned": len(rows),
                    "examined": examined,
                    "unexamined": len(positive) - examined,
                    "verified_eligible": verified_games,
                    "classification_unknown": prefix_unknown,
                    "counters": dict(counters),
                }
            )
            await require_budget(payload)
            if not value["all_apps"] and value["limit_mode"] == "top":
                # An unresolved higher-ranked app could displace a known game.
                # Do not skip it and mislabel lower games as the exact top N.
                if prefix_unknown or verified_games >= value["limit"]:
                    break
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
        if prefix_unknown and not value["all_apps"]:
            # Complete library coverage does not prove unknown app types.
            await update(
                {
                    "phase": "blocked",
                    "reason": "metadata_incomplete",
                    "source_returned": len(rows),
                    "metadata_unexamined": unclassified,
                    "examined": examined,
                    "unexamined": len(positive) - examined,
                    "classification_unknown": prefix_unknown,
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
        await update(
            {
                "phase": "rendering",
                "selected": selected_count,
                "pending": selected_count,
                "counters": dict(counters),
            }
        )
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
                    and selection["all_eligible_included"]
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
            await update(
                {
                    "phase": "rendering",
                    "selected": len(chosen),
                    "generated": generated,
                    "pending": len(chosen) - generated,
                    "missing_images": missing,
                    "batches": batches,
                    "counters": dict(counters),
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
            "all_apps": value["all_apps"],
            "selection_exact": True,
            "eligible_complete": selection["eligible_complete"],
            "examined": examined,
            "unexamined": len(positive) - examined,
            "classification_unknown": prefix_unknown,
            "render_submissions": batches,
            "derived_processing": None,
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
        if action == "retry" and job.status.value not in (
            "failed",
            "cancelled",
            "interrupted",
        ):
            raise ValueError(
                "只有失败、取消或中断的任务可以显式重新执行，请先查询状态。"
            )
        if action in ("cancel", "retry"):
            job = await getattr(scope.jobs, action)(
                job_id, expected_revision=job.revision
            )
        facts = job_projection(job)
        text = _feedback(job)
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
                text += "图片尚未生成完成，请查看任务状态与来源信息。"
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
        counts = {**job.progress, **job.summary}

        def count(key):
            amount = counts.get(key)
            return amount if type(amount) is int and amount >= 0 else "待确认"

        complete = counts.get("complete_source")
        completeness = (
            "完整"
            if complete is True
            else "部分数据"
            if complete is False
            else "待确认"
        )
        text += f"已选{count('selected')}，已生成{count('generated')}，待处理{count('pending')}，缺图{count('missing_images')}。已发布图片资源{count('result_entries')}项，来源完整性{completeness}。"
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
                # No stable transport-retry identity is issued to this handler.
                # Core still joins equivalent active inputs; a later manual
                # action must be able to create a new job after completion.
                job = await scope.jobs.submit(JobRequest("steam_wall", value))
                payload = {"job": job_projection(job)}
                message = "拼图任务已提交。" + _feedback(job)
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
                    message = _feedback(job)
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

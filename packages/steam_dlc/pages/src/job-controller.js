// The Core service owns work and authorization; this view only polls and displays.
export function mountJobForm(root, {options, active, field, parseLimit, validatePNG, say}) {
  const document = root.ownerDocument, urls = [], cleanups = [];
  let disposed = false, timer = null, generation = 0, resultGeneration = 0, job = null, cursor = null, busy = false;
  const current = ticket => !disposed && active() && ticket === generation;
  const problem = message => Object.assign(Error(message), {publicMessage: message});
  const message = error => error?.publicMessage || '任务操作未完成，请刷新任务并核对。';
  const node = (tag, text) => {const element = document.createElement(tag); if (text !== undefined) element.textContent = text; return element;};
  const on = (element, event, callback) => {element.addEventListener(event, callback); cleanups.push(() => element.removeEventListener(event, callback));};
  const stop = () => {if (timer !== null) {clearTimeout(timer); timer = null;}};
  const revoke = () => {for (const url of urls.splice(0)) document.defaultView.URL.revokeObjectURL(url);};
  const api = () => {if (!options.services.jobs) throw problem('任务服务暂不可用，请刷新模块。'); return options.services.jobs;};
  const form = node('form'); form.className = 'steam-dlc-public-form';
  const grid = options.presentation?.grid(form) || form;
  const account = field(grid, 'account', 'SteamID64 / Dota ID32（明确账号）');
  const controls = {};
  for (const [key, label, choices, value] of [
    ['source', '来源', ['games', 'recent', 'full'], 'games'], ['mode', '布局', ['dense', 'legacy'], 'dense'],
    ['preset', '时长预设', ['single', 'standard', 'long'], 'standard'], ['aspect', '比例', ['2:3', '9:16', '1:2'], '2:3'],
    ['quality', '清晰度', ['normal', 'hd'], 'normal'], ['fit', '封面适配', ['cover', 'contain'], 'cover'],
    ['limit_mode', '数量模式', ['top', 'all'], 'top'], ['all_apps', '应用筛选', ['true', 'false'], 'true'],
  ]) controls[key] = field(grid, key, label, choices, value);
  controls.all_apps.options[0].textContent = '全部应用'; controls.all_apps.options[1].textContent = '仅游戏';
  const limit = field(grid, 'limit', '数量（至少20，可手填超过1000）', null, '500'); limit.inputMode = 'decimal';
  const actions = node('div'); actions.className = 'steam-dlc-actions';
  const action = (id, label, callback) => {
    const button = node('button', label); button.type = 'button'; button.className = 'ui-button'; button.dataset.action = id;
    on(button, 'click', () => {
      if (!active() || disposed) return;
      const failed = error => {if (!disposed && active()) say(message(error), 'error');};
      try {void Promise.resolve(callback()).catch(failed);} catch (error) {failed(error);}
    });
    actions.append(button); return button;
  };
  for (const value of [20, 50, 100, 200, 500, 1000, 'all']) action(`limit-${value}`, value === 'all' ? '不限' : String(value), () => {
    controls.limit_mode.value = value === 'all' ? 'all' : 'top'; limit.disabled = value === 'all'; if (value !== 'all') limit.value = String(value);
  });
  on(controls.limit_mode, 'change', () => {limit.disabled = controls.limit_mode.value === 'all';});
  const submit = node('button', '提交拼图任务'); submit.type = 'submit'; submit.className = 'ui-button'; submit.dataset.action = 'generate'; submit.dataset.variant = 'primary'; actions.append(submit);
  const jobId = field(grid, 'job_id', '任务ID（刷新后自动恢复）');
  const status = node('p', '尚未提交任务。'); status.setAttribute('role', 'status');
  const results = node('section'); results.className = 'steam-dlc-public-result';
  const storageKey = `ygl:job:${options.context.owner}:${options.routeId}`;
  const show = value => {
    if (!value || typeof value.job_id !== 'string' || !Number.isSafeInteger(value.revision) || !['queued', 'running', 'succeeded', 'failed', 'cancelled', 'interrupted'].includes(value.status)) throw problem('任务状态无法验证。');
    job = value; jobId.value = job.job_id;
    try {document.defaultView.sessionStorage.setItem(storageKey, job.job_id);} catch { /* Recovery storage is optional. */ }
    const progress = job.progress || {}, summary = job.summary || {};
    const reasons = {steam_key_required: '完整库需要在可信管理页配置Steam Key，可改选公开样本。', steam_source_unavailable: 'Steam来源暂不可用，未用其他来源替代。', steam_source_not_public: 'Steam库未公开或当前来源授权受限，未视为空库。', rate_limited: '来源限流，已停止后续批次；已完成页保留。', resource_budget: '资源预算不足，已停止后续批次；已完成页保留。', metadata_incomplete: '部分作品类型尚未验证，无法完成仅游戏筛选；请稍后重试，未视为空库。'};
    status.textContent = `任务 ${job.job_id} · ${job.status} · 来源${summary.source_returned ?? progress.source_returned ?? '待确认'} · 符合${summary.eligible ?? '待确认'} · 已选${summary.selected ?? progress.selected ?? '待确认'} · 已生成${summary.generated ?? progress.generated ?? 0} · 待处理${summary.pending ?? progress.pending ?? '待确认'} · 缺图${summary.missing_images ?? progress.missing_images ?? 0}${job.error_code ? ` · 失败原因 ${job.error_code}` : ''}${reasons[progress.reason] ? ` · ${reasons[progress.reason]}` : ''}${summary.complete_source === false ? ' · 来源覆盖不完整' : ''}`;
    const unknown = summary.metadata_unexamined ?? progress.metadata_unexamined ?? 0;
    const metadataFailures = summary.metadata_failures ?? summary.counters?.metadata_failed ?? progress.counters?.metadata_failed ?? 0;
    if (unknown) status.textContent += ` · 类型尚未验证${unknown}项${summary.classification_complete === false && job.status === 'succeeded' ? '（已按全部应用设置入图）' : ''}`;
    if (metadataFailures) status.textContent += ` · 元数据请求失败${metadataFailures}次`;
    cancel.disabled = !['queued', 'running'].includes(job.status); retry.disabled = !['failed', 'cancelled', 'interrupted'].includes(job.status);
  };
  const resultPage = async pageCursor => {
    if (!job || !active()) return;
    const ticket = generation, resultTicket = ++resultGeneration, id = job.job_id;
    const page = await api().result(id, {cursor: pageCursor, page_size: 20});
    if (!current(ticket) || resultTicket !== resultGeneration || job?.job_id !== id) return;
    if (!Array.isArray(page.entries) || page.entries.length > 20) throw problem('任务结果范围无法验证。');
    revoke(); results.replaceChildren(); cursor = page.next_cursor || null;
    for (const [index, entry] of page.entries.entries()) {
      if (entry?.resource?.media_type !== 'image/png' || typeof entry.resource.asset_id !== 'string') throw problem('任务资源无法验证。');
      const blob = await api().resource(id, entry.resource.asset_id);
      if (!current(ticket) || resultTicket !== resultGeneration || job?.job_id !== id) return;
      if (blob?.type !== 'image/png' || typeof blob.arrayBuffer !== 'function' || blob.size > 16 * 1024 * 1024) throw problem('图片资源无法验证。');
      validatePNG(new Uint8Array(await blob.arrayBuffer()));
      if (!current(ticket) || resultTicket !== resultGeneration || job?.job_id !== id) return;
      const url = document.defaultView.URL.createObjectURL(blob); urls.push(url);
      const figure = node('figure'), image = node('img'), download = node('a', '下载原始 PNG');
      figure.className = 'steam-dlc-preview'; image.src = url; image.alt = `批次${Number(entry.metadata?.batch_index ?? 0) + 1} · 图片${index + 1}`;
      download.href = url; download.className = 'ui-button'; download.download = `steam-career-${entry.metadata?.batch_index ?? 0}-${index + 1}.png`;
      figure.append(image, download); results.append(figure);
    }
    if (!page.entries.length) results.append(node('p', '当前没有已完成结果页。'));
    next.disabled = !cursor;
  };
  const poll = async () => {
    stop(); if (!job || !active() || disposed) return;
    const ticket = generation, id = job.job_id;
    try {
      const value = await api().status(id);
      if (!current(ticket) || job?.job_id !== id) return;
      show(value);
      if (['queued', 'running'].includes(job.status)) timer = setTimeout(() => {void poll();}, 1500);
      else await resultPage(null);
    } catch (error) {if (current(ticket)) say(message(error), 'error');}
  };
  const cancel = action('job-cancel', '取消任务', async () => {if (!job) return; stop(); const ticket = ++generation; const value = await api().cancel(job.job_id, job.revision); if (current(ticket)) {show(value); await poll();}});
  const retry = action('job-retry', '重试任务', async () => {if (!job) return; stop(); const ticket = ++generation; const value = await api().retry(job.job_id, job.revision); if (current(ticket)) {show(value); await poll();}});
  const next = action('job-next', '下一页结果', async () => {if (cursor) await resultPage(cursor);}); next.disabled = true;
  action('job-results', '查看已完成页', async () => {await resultPage(null);});
  action('job-refresh', '恢复 / 刷新任务', async () => {if (!jobId.value.trim()) return; stop(); generation += 1; job = {job_id: jobId.value.trim()}; await poll();});
  cancel.disabled = true; retry.disabled = true;
  on(form, 'submit', event => {
    event.preventDefault(); if (!active() || disposed || busy) return;
    void (async () => {
      const ticket = ++generation; stop();
      try {
        const parameters = Object.fromEntries(Object.entries(controls).map(([key, control]) => [key, key === 'all_apps' ? control.value === 'true' : control.value]));
        parameters.account = account.value.trim(); if (!parameters.account) throw problem('请提供明确账号。');
        if (/^[0-9]+$/u.test(parameters.account)) {
          const identifier = BigInt(parameters.account);
          parameters.account = String(identifier < 4294967296n ? identifier + 76561197960265728n : identifier);
        }
        try {parameters.limit = parameters.limit_mode === 'all' ? 500 : parseLimit(limit.value);}
        catch (error) {throw problem(error.message);}
        if (parameters.mode === 'legacy' && (parameters.limit > 200 || parameters.limit_mode === 'all')) throw problem('兼容旧布局最多200项。');
        busy = true; submit.disabled = true;
        const idempotency = JSON.stringify([parameters.account, ...Object.keys(controls).sort().map(key => parameters[key]), parameters.limit]);
        if (idempotency.length > 256) throw problem('账号或参数过长，无法生成任务标识。');
        const value = await api().submit({handler_id: 'steam_wall', parameters, idempotency_key: idempotency});
        if (!current(ticket)) return;
        show(value); say('任务已提交，关闭页面只停止轮询。', 'success'); await poll();
      } catch (error) {if (current(ticket)) say(message(error), 'error');}
      finally {busy = false; if (current(ticket)) submit.disabled = false;}
    })();
  });
  form.append(actions); root.append(node('p', '不限覆盖来源实际返回范围。每批有资源预算，已完成页保留；关闭页面只停止轮询，取消需明确点击。'), form, status, results);
  options.presentation?.actions(actions);
  try {const saved = document.defaultView.sessionStorage.getItem(storageKey); if (saved) {jobId.value = saved; job = {job_id: saved}; void poll();}} catch { /* Manual recovery remains available. */ }
  return {dispose() {if (disposed) return; disposed = true; generation += 1; stop(); revoke(); results.replaceChildren(); status.textContent = '任务页面上下文已变化，请重新进入。'; cleanups.splice(0).forEach(remove => remove());}};
}

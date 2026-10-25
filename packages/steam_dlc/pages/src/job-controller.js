// The Core service owns work and authorization; this view only polls and displays.
export function mountJobForm(root, {options, active, field, parseLimit, validatePNG, say}) {
  const document = root.ownerDocument, urls = [], cleanups = [];
  let disposed = false, authorityInvalid = false, timer = null, generation = 0, resultGeneration = 0, job = null, cursor = null, busy = false;
  let operation = null;
  let publishedResults = 0;
  const available = () => !disposed && !authorityInvalid && active();
  const current = ticket => available() && ticket === generation;
  // Frozen Core module-services publicError normalizes 401/403 and asset_revoked
  // to these exact public errors. Ordinary transport failures stay recoverable.
  const authorityErrors = new Set(['admin_authorization_denied', 'page_revoked', 'page_unavailable', 'stale_context']);
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
      if (!available() || busy) return;
      let ticket = generation;
      const failed = error => handleError(error, ticket);
      try {
        const pending = callback(); ticket = generation;
        if (pending && typeof pending.then === 'function') {
          busy = true; sync();
          void pending.catch(failed).finally(() => {if (current(ticket)) {busy = false; sync();}});
        }
      } catch (error) {failed(error);}
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
  const sync = () => {
    const disabled = !available();
    form.setAttribute('aria-busy', String(busy));
    for (const button of form.querySelectorAll('button')) button.disabled = disabled || busy;
    for (const input of form.querySelectorAll('input,select')) input.disabled = disabled;
    limit.disabled = disabled || controls.limit_mode.value === 'all';
    cancel.disabled = disabled || busy || !['queued', 'running'].includes(job?.status);
    retry.disabled = disabled || busy || !['failed', 'cancelled', 'interrupted'].includes(job?.status);
    retry.hidden = !['failed', 'cancelled', 'interrupted'].includes(job?.status);
    cancel.hidden = !['queued', 'running'].includes(job?.status);
    next.disabled = disabled || busy || !cursor;
  };
  const storageKey = `ygl:job:${options.context.owner}:${options.routeId}`;
  const show = value => {
    if (!value || typeof value.job_id !== 'string' || !Number.isSafeInteger(value.revision) || !['queued', 'running', 'succeeded', 'failed', 'cancelled', 'interrupted'].includes(value.status)) throw problem('任务状态无法验证。');
    job = value; jobId.value = job.job_id;
    try {document.defaultView.sessionStorage.setItem(storageKey, job.job_id);} catch { /* Recovery storage is optional. */ }
    const progress = job.progress || {}, summary = job.summary || {};
    const reasons = {steam_key_required: '完整库需要在可信管理页配置Steam Key，可改选公开样本。', steam_source_unavailable: 'Steam来源暂不可用，请核对来源状态；未用其他来源替代。', steam_source_access_denied: 'Steam来源拒绝访问，请检查可信管理页的Steam配置、来源授权与目标公开或访问范围；未视为空库。', steam_source_not_public: 'Steam库未公开或当前来源授权受限，请核对公开设置与来源授权；未视为空库。', rate_limited: '来源限流，已停止后续批次；请等待来源恢复。', resource_budget: '资源预算不足，已停止后续批次；可减少数量或降低清晰度后重新提交。', metadata_incomplete: '部分作品类型尚未验证，无法完成仅游戏筛选；未视为空库。'};
    const states = {queued: '排队中', running: '执行中', succeeded: '已完成', failed: '失败', cancelled: '已取消', interrupted: '已中断'};
    const reason = summary.reason ?? progress.reason ?? job.error_code;
    const explanation = reasons[reason] || (reason || job.status === 'failed' ? '任务未完成，原因暂不可确认；请刷新状态并核对来源与设置。' : '');
    const retryAfter = summary.retry_after ?? progress.retry_after;
    const knownWait = Number.isSafeInteger(retryAfter) && retryAfter >= 0 && retryAfter <= 86400;
    const resultEntries = summary.result_entries ?? progress.result_entries;
    if (Number.isSafeInteger(resultEntries) && resultEntries >= 0) publishedResults = Math.max(publishedResults, resultEntries);
    const count = value => Number.isSafeInteger(value) && value >= 0 ? String(value) : '待确认';
    status.textContent = `任务 ${job.job_id} · ${states[job.status]} · 来源${count(summary.source_returned ?? progress.source_returned)} · ${(summary.eligible_complete ?? progress.eligible_complete) === false ? '已确认符合' : '符合'}${count(summary.eligible ?? progress.eligible)} · 已选${count(summary.selected ?? progress.selected)} · 已生成${count(summary.generated ?? progress.generated)} · 待处理${count(summary.pending ?? progress.pending)} · 缺图${count(summary.missing_images ?? progress.missing_images)}${explanation ? ` · ${explanation}` : ''}${reason === 'rate_limited' && knownWait ? ` · 来源建议等待${retryAfter}秒后再试（非自动重试或倒计时）。` : ''}${(summary.complete_source ?? progress.complete_source) === false ? ' · 来源覆盖不完整' : ''}`;
    const legacyUnknown = summary.metadata_unexamined ?? progress.metadata_unexamined;
    const coverage = ['examined', 'unexamined', 'classification_unknown'].map(key => summary[key] ?? progress[key]);
    const metadataFailures = summary.metadata_failures ?? summary.counters?.metadata_failed ?? progress.counters?.metadata_failed ?? 0;
    if (coverage.some(value => value !== undefined)) status.textContent += ` · 已检查${count(coverage[0])}项 · 未检查${count(coverage[1])}项 · 已检查中类型未知${count(coverage[2])}项`;
    else if (legacyUnknown) status.textContent += ` · 类型尚未验证${legacyUnknown}项（未区分未检查与已检查但类型未知）`;
    if (summary.selection_exact === true && summary.all_apps === false) status.textContent += ` · 选集排序已验证${Number.isSafeInteger(coverage[1]) && coverage[1] > 0 ? '，剩余未检查' : ''}`;
    if (metadataFailures) status.textContent += ` · 元数据请求失败${metadataFailures}次`;
    if (['queued', 'running'].includes(job.status)) status.textContent += ' · 可刷新状态或取消任务；排队或执行中不能重试。';
    else if (['failed', 'cancelled', 'interrupted'].includes(job.status)) status.textContent += ' · 核对条件后可稍后重试，显式重新执行并复用有效缓存；不会从最后一项自动断点续跑。';
    if (publishedResults > 0) status.textContent += ` · 已发布图片资源${publishedResults}项，可点击“查询结果页”或使用 /ygl steam wall result ${job.job_id} 查看。`;
    sync();
  };
  const resultPage = async pageCursor => {
    if (!job || !available()) return;
    const ticket = generation, resultTicket = ++resultGeneration, id = job.job_id;
    const page = await api().result(id, {cursor: pageCursor, page_size: 20});
    if (!current(ticket) || resultTicket !== resultGeneration || job?.job_id !== id) return;
    if (!Array.isArray(page.entries) || page.entries.length > 20) throw problem('任务结果范围无法验证。');
    if (page.entries.some(entry => entry?.resource?.media_type !== 'image/png' || typeof entry.resource.asset_id !== 'string' || !entry.resource.asset_id)) throw problem('任务资源无法验证。');
    if (page.entries.length) {
      publishedResults = Math.max(publishedResults, page.entries.length);
      show(job);
    }
    revoke(); results.replaceChildren(); cursor = page.next_cursor || null;
    for (const [index, entry] of page.entries.entries()) {
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
    sync();
  };
  const poll = async () => {
    stop(); if (!job || !available()) return;
    const ticket = generation, id = job.job_id;
    try {
      const value = await api().status(id);
      if (!current(ticket) || job?.job_id !== id) return;
      show(value);
      if (['queued', 'running'].includes(job.status)) timer = setTimeout(() => {void poll();}, 1500);
      else await resultPage(null);
    } catch (error) {handleError(error, ticket);}
  };
  const cancel = action('job-cancel', '取消任务', async () => {if (!job || !['queued', 'running'].includes(job.status)) return; stop(); const ticket = ++generation; const value = await api().cancel(job.job_id, job.revision); if (current(ticket)) {show(value); await poll();}});
  const clearResults = () => {resultGeneration += 1; publishedResults = 0; cursor = null; revoke(); results.replaceChildren();};
  const handleError = (error, ticket) => {
    if (!current(ticket)) return;
    if (!authorityErrors.has(error?.message)) {say(message(error), 'error'); return;}
    authorityInvalid = true; generation += 1; stop(); clearResults();
    busy = false; operation = null; job = null; jobId.value = ''; account.value = '';
    try {document.defaultView.sessionStorage.removeItem(storageKey);} catch { /* Optional recovery storage. */ }
    status.textContent = '任务页面授权或运行上下文已失效，请重新进入页面。';
    say('页面授权或运行上下文已变化，请重新进入页面。', 'error'); sync();
  };
  const retry = action('job-retry', '重新执行（复用有效缓存）', async () => {if (!job || !['failed', 'cancelled', 'interrupted'].includes(job.status)) return; stop(); clearResults(); const ticket = ++generation; const value = await api().retry(job.job_id, job.revision); if (current(ticket)) {show(value); await poll();}});
  const next = action('job-next', '下一页结果', async () => {if (cursor) await resultPage(cursor);}); next.disabled = true;
  action('job-results', '查询结果页', async () => {await resultPage(null);});
  action('job-refresh', '恢复 / 刷新任务', async () => {if (!jobId.value.trim()) return; stop(); clearResults(); generation += 1; job = {job_id: jobId.value.trim()}; await poll();});
  cancel.disabled = true; retry.disabled = true;
  on(form, 'submit', event => {
    event.preventDefault(); if (!available() || busy) return;
    void (async () => {
      const ticket = ++generation; stop(); clearResults();
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
        busy = true; sync();
        const fingerprint = JSON.stringify(parameters);
        if (!operation || operation.fingerprint !== fingerprint) operation = {fingerprint, key: document.defaultView.crypto.randomUUID()};
        const value = await api().submit({handler_id: 'steam_wall', parameters, idempotency_key: operation.key});
        if (!current(ticket)) return;
        show(value); operation = null;
        say('任务已提交，关闭页面只停止轮询。', 'success'); await poll();
      } catch (error) {handleError(error, ticket);}
      finally {if (current(ticket)) {busy = false; sync();}}
    })();
  });
  form.append(actions); root.append(node('p', '不限覆盖来源实际返回范围。每批有资源预算，已完成页保留；关闭页面只停止轮询，取消需明确点击。'), form, status, results);
  options.presentation?.actions(actions);
  sync();
  try {const saved = document.defaultView.sessionStorage.getItem(storageKey); if (saved) {jobId.value = saved; job = {job_id: saved}; void poll();}} catch { /* Manual recovery remains available. */ }
  return {
    setAvailable(available) {
      if (disposed || authorityInvalid) return;
      generation += 1; clearResults(); stop();
      busy = false; operation = null; job = null; cursor = null;
      status.textContent = available ? '页面已恢复，请手动恢复 / 刷新任务，或提交新任务。' : '任务页面暂不可用，已停止轮询；任务ID保留供恢复后查询。';
      sync();
    },
    dispose() {if (disposed) return; disposed = true; generation += 1; resultGeneration += 1; busy = false; operation = null; stop(); revoke(); results.replaceChildren(); status.textContent = '任务页面上下文已变化，请重新进入。'; sync(); cleanups.splice(0).forEach(remove => remove());},
  };
}

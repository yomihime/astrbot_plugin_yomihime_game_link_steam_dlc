import {primaryForm} from './template-adapter.js';
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
  const {text: t, bind} = options.copy;
  const copy = (key, params) => () => t(`job.${key}`, params);
  const publicText = Symbol();
  const problem = (key, render = copy(key)) => Object.assign(Error(key), {[publicText]: render});
  const node = (tag, text) => {
    const element = document.createElement(tag);
    if (typeof text === 'function') bind(element, text);
    else if (text !== undefined) element.textContent = text;
    return element;
  };
  const on = (element, event, callback) => {element.addEventListener(event, callback); cleanups.push(() => element.removeEventListener(event, callback));};
  const stop = () => {if (timer !== null) {clearTimeout(timer); timer = null;}};
  const revoke = () => {for (const url of urls.splice(0)) document.defaultView.URL.revokeObjectURL(url);};
  const api = () => {if (!options.services.jobs) throw problem('unavailableService'); return options.services.jobs;};
  const primary = primaryForm(root, options, {id: 'generate', label: copy('submit'), className: 'steam-dlc-public-form'});
  const {body: form, actions} = primary;
  const grid = options.presentation?.grid(form) || form;
  const account = field(grid, 'account', copy('account'));
  const controls = {};
  for (const [key, label, choices, value] of [
    ['source', copy('source'), ['games', 'recent', 'full'], 'games'], ['mode', copy('mode'), ['dense', 'legacy'], 'dense'],
    ['preset', copy('preset'), ['single', 'standard', 'long'], 'standard'], ['aspect', copy('aspect'), ['2:3', '9:16', '1:2'], '2:3'],
    ['quality', copy('quality'), ['normal', 'hd'], 'normal'], ['fit', copy('fit'), ['cover', 'contain'], 'cover'],
    ['limit_mode', copy('limit_mode'), ['top', 'all'], 'top'], ['all_apps', copy('all_apps'), ['true', 'false'], 'true'],
  ]) controls[key] = field(grid, key, label, choices, value);
  bind(controls.all_apps.options[0], copy('apps.true')); bind(controls.all_apps.options[1], copy('apps.false'));
  const limit = field(grid, 'limit', copy('limit'), null, '500'); limit.inputMode = 'decimal';
  const jobActions = node('div'); jobActions.className = 'steam-dlc-actions';
  const action = (id, label, callback, target = actions) => {
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
    target.append(button); return button;
  };
  for (const value of [20, 50, 100, 200, 500, 1000, 'all']) action(`limit-${value}`, value === 'all' ? copy('unlimited') : String(value), () => {
    controls.limit_mode.value = value === 'all' ? 'all' : 'top'; limit.disabled = value === 'all'; if (value !== 'all') limit.value = String(value);
  });
  on(controls.limit_mode, 'change', () => {limit.disabled = controls.limit_mode.value === 'all';});
  const recoveryHeading = node('h3', copy('recovery'));
  const recoveryGrid = options.presentation?.grid(form) || form;
  const recoveryMount = recoveryGrid === form ? null : form.lastElementChild;
  const jobId = field(recoveryGrid, 'job_id', copy('jobId'));
  const status = node('div'); status.className = 'steam-dlc-job-status'; status.setAttribute('role', 'status');
  let unbindStatus;
  const setStatus = key => {
    unbindStatus?.();
    unbindStatus = bind(status, copy(key));
  };
  setStatus('notSubmitted');
  const results = node('section'); results.className = 'steam-dlc-public-result';
  const sync = () => {
    const disabled = !available();
    primary.sync(disabled, busy);
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
    if (!value || typeof value.job_id !== 'string' || !Number.isSafeInteger(value.revision) || !['queued', 'running', 'succeeded', 'failed', 'cancelled', 'interrupted'].includes(value.status)) throw problem('invalidStatus');
    job = value; jobId.value = job.job_id;
    try {document.defaultView.sessionStorage.setItem(storageKey, job.job_id);} catch { /* Recovery storage is optional. */ }
    const progress = job.progress || {}, summary = job.summary || {};
    const reasons = ['steam_key_required', 'steam_source_unavailable', 'steam_source_access_denied',
      'steam_source_not_public', 'rate_limited', 'resource_budget', 'metadata_incomplete'];
    const reason = summary.reason ?? progress.reason ?? job.error_code;
    const explanation = reasons.includes(reason) ? `reason.${reason}`
      : reason || job.status === 'failed' ? 'unknownFailure' : null;
    const retryAfter = summary.retry_after ?? progress.retry_after;
    const knownWait = Number.isSafeInteger(retryAfter) && retryAfter >= 0 && retryAfter <= 86400;
    const resultEntries = summary.result_entries ?? progress.result_entries;
    if (Number.isSafeInteger(resultEntries) && resultEntries >= 0) publishedResults = Math.max(publishedResults, resultEntries);
    const count = value => Number.isSafeInteger(value) && value >= 0 ? String(value) : t('job.unconfirmed');
    const state = job.status, id = job.job_id;
    const published = publishedResults;
    const coverageNotes = [];
    const legacyUnknown = summary.metadata_unexamined ?? progress.metadata_unexamined;
    const coverage = ['examined', 'unexamined', 'classification_unknown'].map(key => summary[key] ?? progress[key]);
    const metadataFailures = summary.metadata_failures ?? summary.counters?.metadata_failed ?? progress.counters?.metadata_failed ?? 0;
    if ((summary.complete_source ?? progress.complete_source) === false) coverageNotes.push(copy('incompleteSource'));
    if (coverage.some(value => value !== undefined)) coverageNotes.push(() => t('job.coverage', {
      examined: count(coverage[0]), unexamined: count(coverage[1]), unknown: count(coverage[2]),
    }));
    else if (legacyUnknown) coverageNotes.push(copy('legacyUnknown', {count: legacyUnknown}));
    if (summary.selection_exact === true && summary.all_apps === false) {
      coverageNotes.push(copy(Number.isSafeInteger(coverage[1]) && coverage[1] > 0 ? 'verifiedSelectionRemaining' : 'verifiedSelection'));
    }
    if (metadataFailures) coverageNotes.push(copy('metadataFailures', {count: metadataFailures}));
    const nextSteps = [];
    if (['queued', 'running'].includes(state)) nextSteps.push(copy('activeNextSteps'));
    else if (['failed', 'cancelled', 'interrupted'].includes(state)) nextSteps.push(copy('retryNextSteps'));
    if (published > 0) nextSteps.push(() => t('job.published', {
      count: published, resultsLabel: t('job.results'), command: `/ygl steam wall result ${id}`,
    }));
    const parts = [
      node('p', () => t('job.statusSummary', {id, state: t(`job.state.${state}`)})),
      node('p', () => t('job.metrics', {
        source: count(summary.source_returned ?? progress.source_returned),
        eligible: count(summary.eligible ?? progress.eligible),
        eligibleLabel: t((summary.eligible_complete ?? progress.eligible_complete) === false ? 'job.eligibleConfirmed' : 'job.eligible'),
        selected: count(summary.selected ?? progress.selected), generated: count(summary.generated ?? progress.generated),
        pending: count(summary.pending ?? progress.pending), missing: count(summary.missing_images ?? progress.missing_images),
      })),
    ];
    if (explanation) parts.push(node('p', copy(explanation)));
    if (reason === 'rate_limited' && knownWait) parts.push(node('p', copy('retryWait', {seconds: retryAfter})));
    if (coverageNotes.length) parts.push(node('p', () => coverageNotes.map(render => render()).join(' · ')));
    if (nextSteps.length) parts.push(node('p', () => nextSteps.map(render => render()).join(' ')));
    unbindStatus?.();
    unbindStatus = null;
    status.replaceChildren(...parts);
    sync();
  };
  const resultPage = async pageCursor => {
    if (!job || !available()) return;
    const ticket = generation, resultTicket = ++resultGeneration, id = job.job_id;
    const page = await api().result(id, {cursor: pageCursor, page_size: 20});
    if (!current(ticket) || resultTicket !== resultGeneration || job?.job_id !== id) return;
    if (!Array.isArray(page.entries) || page.entries.length > 20) throw problem('invalidResults');
    if (page.entries.some(entry => entry?.resource?.media_type !== 'image/png' || typeof entry.resource.asset_id !== 'string' || !entry.resource.asset_id)) throw problem('invalidResource');
    if (page.entries.length) {
      publishedResults = Math.max(publishedResults, page.entries.length);
      show(job);
    }
    revoke(); results.replaceChildren(); cursor = page.next_cursor || null;
    for (const [index, entry] of page.entries.entries()) {
      const blob = await api().resource(id, entry.resource.asset_id);
      if (!current(ticket) || resultTicket !== resultGeneration || job?.job_id !== id) return;
      if (blob?.type !== 'image/png' || typeof blob.arrayBuffer !== 'function' || blob.size > 16 * 1024 * 1024) throw problem('invalidImage');
      validatePNG(new Uint8Array(await blob.arrayBuffer()));
      if (!current(ticket) || resultTicket !== resultGeneration || job?.job_id !== id) return;
      const url = document.defaultView.URL.createObjectURL(blob); urls.push(url);
      const figure = node('figure'), image = node('img'), download = node('a', copy('download'));
      figure.className = 'steam-dlc-preview'; image.src = url; bind(image, copy('imageAlt', {batch: Number(entry.metadata?.batch_index ?? 0) + 1, image: index + 1}), 'alt');
      download.href = url; download.className = 'ui-button'; download.download = `steam-career-${entry.metadata?.batch_index ?? 0}-${index + 1}.png`;
      figure.append(image, download); results.append(figure);
    }
    if (!page.entries.length) results.append(node('p', copy('noResults')));
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
  const cancel = action('job-cancel', copy('cancel'), async () => {if (!job || !['queued', 'running'].includes(job.status)) return; stop(); const ticket = ++generation; const value = await api().cancel(job.job_id, job.revision); if (current(ticket)) {show(value); await poll();}}, jobActions);
  const clearResults = () => {resultGeneration += 1; publishedResults = 0; cursor = null; revoke(); results.replaceChildren();};
  const handleError = (error, ticket) => {
    if (!current(ticket)) return;
    if (!authorityErrors.has(error?.message)) {say(error?.[publicText] || copy('operationFailed'), 'error'); return;}
    authorityInvalid = true; generation += 1; stop(); clearResults();
    busy = false; operation = null; job = null; jobId.value = ''; account.value = '';
    try {document.defaultView.sessionStorage.removeItem(storageKey);} catch { /* Optional recovery storage. */ }
    setStatus('authorityLost');
    say(copy('authorityChanged'), 'error'); sync();
  };
  const retry = action('job-retry', copy('retry'), async () => {if (!job || !['failed', 'cancelled', 'interrupted'].includes(job.status)) return; stop(); clearResults(); const ticket = ++generation; const value = await api().retry(job.job_id, job.revision); if (current(ticket)) {show(value); await poll();}}, jobActions);
  const next = action('job-next', copy('next'), async () => {if (cursor) await resultPage(cursor);}, jobActions); next.disabled = true;
  action('job-results', copy('results'), async () => {await resultPage(null);}, jobActions);
  action('job-refresh', copy('refresh'), async () => {if (!jobId.value.trim()) return; stop(); clearResults(); generation += 1; job = {job_id: jobId.value.trim()}; await poll();}, jobActions);
  cancel.disabled = true; retry.disabled = true;
  cleanups.push(primary.bind(() => {
    if (!available() || busy) return;
    void (async () => {
      const ticket = ++generation; stop(); clearResults();
      try {
        const parameters = Object.fromEntries(Object.entries(controls).map(([key, control]) => [key, key === 'all_apps' ? control.value === 'true' : control.value]));
        parameters.account = account.value.trim(); if (!parameters.account) throw problem('accountRequired');
        if (/^[0-9]+$/u.test(parameters.account)) {
          const identifier = BigInt(parameters.account);
          parameters.account = String(identifier < 4294967296n ? identifier + 76561197960265728n : identifier);
        }
        try {parameters.limit = parameters.limit_mode === 'all' ? 500 : parseLimit(limit.value, key => key);}
        catch (error) {throw problem('invalidLimit', () => t(error.message));}
        if (parameters.mode === 'legacy' && (parameters.limit > 200 || parameters.limit_mode === 'all')) throw problem('legacyLimit');
        busy = true; sync();
        const fingerprint = JSON.stringify(parameters);
        if (!operation || operation.fingerprint !== fingerprint) operation = {fingerprint, key: document.defaultView.crypto.randomUUID()};
        const value = await api().submit({handler_id: 'steam_wall', parameters, idempotency_key: operation.key});
        if (!current(ticket)) return;
        show(value); operation = null;
        say(copy('submitted'), 'success'); await poll();
      } catch (error) {handleError(error, ticket);}
      finally {if (current(ticket)) {busy = false; sync();}}
    })();
  }));
  form.insertBefore(actions, recoveryMount);
  form.insertBefore(recoveryHeading, recoveryMount);
  form.append(jobActions); root.append(node('p', copy('description')), ...(options.presentation?.template ? [] : [node('h3', copy('create'))]), form);
  primary.result(status, results);
  options.presentation?.actions(actions);
  options.presentation?.actions(jobActions);
  sync();
  try {const saved = document.defaultView.sessionStorage.getItem(storageKey); if (saved) {jobId.value = saved; job = {job_id: saved}; void poll();}} catch { /* Manual recovery remains available. */ }
  return {
    setAvailable(available) {
      if (disposed || authorityInvalid) return;
      generation += 1; clearResults(); stop();
      busy = false; operation = null; job = null; cursor = null;
      setStatus(available ? 'available' : 'unavailable');
      sync();
    },
    dispose() {if (disposed) return; disposed = true; generation += 1; resultGeneration += 1; busy = false; operation = null; stop(); revoke(); results.replaceChildren(); setStatus('disposed'); sync(); unbindStatus?.(); cleanups.splice(0).forEach(remove => remove());},
  };
}

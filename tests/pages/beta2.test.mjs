import assert from 'node:assert/strict';
import {test} from 'node:test';
import {JSDOM} from 'jsdom';
import {mount, installDOM} from './source-build.mjs';

const settle = async () => {for (let index = 0; index < 40; index++) await Promise.resolve();};
const deferred = () => {let resolve, reject; const promise = new Promise((yes, no) => {resolve = yes; reject = no;}); return {promise, resolve, reject};};
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAX+XDSwAAAABJRU5ErkJggg==';
const response = () => ({schema_version: 1, status: 'success', privacy: 'public', document: {title: 'Synthetic result', subject: 'CS2', sources: [], timestamps: [], blocks: [{kind: 'text', text: 'Synthetic public result'}]}, warnings: [], model_facts: null, error: null});
let sequence = 0;
function fixture({preview = async () => {throw Error('operation_unavailable');}, jobs} = {}) {
  const dom = new JSDOM('<!doctype html><main></main>', {url: 'http://localhost/'}); installDOM(dom);
  const container = dom.window.document.querySelector('main'), abort = new AbortController(), calls = [], created = [], revoked = [];
  dom.window.URL.createObjectURL = blob => {created.push(blob); return `blob:beta2-${created.length}`;};
  dom.window.URL.revokeObjectURL = url => revoked.push(url);
  const context = {owner: `steam_dlc/${jobs ? 'steam' : 'cs2'}`, runtimeId: `beta2-${++sequence}`, epoch: 3, boundary: 'a', available: true, theme: 'light', locale: 'zh-CN'};
  const page = mount(container, {routeId: jobs ? 'collage' : 'query', context, services: {jobs,
    invoke(id, parameters) {calls.push(['invoke', id, structuredClone(parameters)]); return Promise.resolve(response());},
    preview(id, parameters) {calls.push(['preview', id, structuredClone(parameters)]); return preview(id, parameters);},
  }, scope: {signal: abort.signal, isCurrent: () => true, onDispose() {return () => {};}}});
  return {dom, container, context, page, calls, created, revoked,
    input(name, value) {const input = container.querySelector(`[name="${name}"]`); input.value = value; input.dispatchEvent(new dom.window.Event(input.tagName === 'SELECT' ? 'change' : 'input', {bubbles: true}));},
    submit() {container.querySelector('form').dispatchEvent(new dom.window.Event('submit', {bubbles: true, cancelable: true}));},
    click(action) {container.querySelector(`[data-action="${action}"]`).click();},
    busy: () => container.querySelector('form').getAttribute('aria-busy'),
    text: () => container.textContent,
    close() {page.dispose(); dom.window.close();},
  };
}
const A = {account: '76561197960265851', action: 'profile', platform: 'perfect'};
const B = {account: 'synthetic-domain-b', action: 'profile', platform: '5e'};
const recoveryHidden = f => f.container.querySelector('[data-action="query-text-only"]').parentElement.hidden;

for (const timing of ['pending-edit-failure', 'failure-edit']) {
  test(`I02 ${timing}: old A/perfect cannot recover under visible B/5e; manual B releases busy and uses B`, async () => {
    const late = deferred(); let previews = 0;
    const f = fixture({preview: () => ++previews === 1 ? late.promise : Promise.resolve({...response(), image_state: 'none', images: []})});
    try {
      await settle(); f.calls.length = 0;
      f.input('account', A.account); f.submit(); assert.equal(f.busy(), 'true'); assert.deepEqual(f.calls, [['preview', 'query', A]]);
      if (timing === 'failure-edit') {late.reject(Error('operation_unavailable')); await settle(); assert.equal(recoveryHidden(f), false);}
      f.input('account', B.account); f.input('platform', B.platform);
      if (timing === 'pending-edit-failure') {late.reject(Error('operation_unavailable')); await settle();}
      assert.equal(f.busy(), 'false'); assert.equal(recoveryHidden(f), true);
      f.click('query-preview-retry'); f.click('query-text-only'); await settle(); assert.equal(f.calls.length, 1);
      f.submit(); await settle(); assert.deepEqual(f.calls, [['preview', 'query', A], ['preview', 'query', B]]); assert.equal(f.busy(), 'false');
    } finally {f.close();}
  });
}
for (const [action, service] of [['query-preview-retry', 'preview'], ['query-text-only', 'invoke']]) {
  test(`I02 unchanged A explicitly recovers via ${service} once with the captured parameters`, async () => {
    const f = fixture();
    try {
      await settle(); f.calls.length = 0; f.input('account', A.account); f.submit(); await settle();
      assert.deepEqual(f.calls, [['preview', 'query', A]]); assert.equal(recoveryHidden(f), false); assert.equal(f.busy(), 'false');
      f.click(action); await settle(); assert.deepEqual(f.calls, [['preview', 'query', A], [service, 'query', A]]); assert.equal(f.busy(), 'false');
    } finally {f.close();}
  });
}
for (const boundary of ['availability', 'identity', 'authority']) {
  test(`I02 ${boundary} prevents late failure from reactivating recovery before parent disposal`, async () => {
    const late = deferred(), f = fixture({preview: () => late.promise});
    try {
      await settle(); f.calls.length = 0; f.input('account', A.account); f.submit(); assert.equal(f.busy(), 'true');
      if (boundary === 'availability') {f.page.update({...f.context, available: false}); f.page.update({...f.context, available: true});}
      if (boundary === 'identity') f.page.update({...f.context, epoch: 4});
      late.reject(Error(boundary === 'authority' ? 'page_revoked' : 'operation_unavailable')); await settle();
      assert.equal(f.busy(), 'false'); assert.equal(recoveryHidden(f), true);
      f.click('query-preview-retry'); f.click('query-text-only'); await settle(); assert.equal(f.calls.length, 1);
      if (boundary === 'availability') {f.input('account', B.account); f.input('platform', B.platform); f.submit(); await settle(); assert.deepEqual(f.calls.at(-1), ['preview', 'query', B]);}
    } finally {f.close();}
  });
}

const view = (status = 'running', progress = {}, summary = {}) => ({job_id: 'synthetic-job', revision: 7, status, progress, summary});
const entries = () => ({entries: [{resource: {media_type: 'image/png', asset_id: 'synthetic-image'}, metadata: {batch_index: 0}}], next_cursor: 'synthetic-next'});
const resource = () => Promise.resolve(new Blob([Buffer.from(PNG, 'base64')], {type: 'image/png'}));
function jobFixture(overrides = {}) {
  const calls = [];
  const f = fixture({jobs: Object.fromEntries(Object.entries({submit: async () => view(), status: async () => view(), result: async () => entries(), resource,
    cancel: async () => view('cancelled'), retry: async () => view('running'), ...overrides}).map(([name, call]) => [name, (...args) => {calls.push([name, ...args]); return call(...args);}]))});
  return {...f, jobCalls: calls};
}
function pollTimers() {
  const set = globalThis.setTimeout, clear = globalThis.clearTimeout, pending = new Set();
  globalThis.setTimeout = (callback, delay, ...args) => {if (delay !== 1500) return set(callback, delay, ...args); const timer = {callback}; pending.add(timer); return timer;};
  globalThis.clearTimeout = timer => {if (!pending.delete(timer)) clear(timer);};
  return {pending, tick() {const timer = pending.values().next().value; assert.ok(timer); pending.delete(timer); timer.callback();}, close() {globalThis.setTimeout = set; globalThis.clearTimeout = clear;}};
}
for (const code of ['admin_authorization_denied', 'page_revoked', 'page_unavailable', 'stale_context']) {
  test(`M03 exact official ${code} clears results, polling and operations locally`, async () => {
    const timers = pollTimers(); let denied = false;
    const f = jobFixture({result: async () => {if (denied) throw Error(code); return entries();}});
    try {
      f.input('account', '123'); f.submit(); await settle(); f.click('job-results'); await settle();
      assert.equal(f.created.length, 1); assert.equal(timers.pending.size, 1); assert.match(f.text(), /wall result synthetic-job/);
      denied = true; f.click('job-results'); await settle();
      assert.deepEqual(f.revoked, ['blob:beta2-1']); assert.equal(f.container.querySelector('img'), null); assert.equal(timers.pending.size, 0); assert.equal(f.busy(), 'false');
      assert.doesNotMatch(f.text(), /wall result synthetic-job/); assert.match(f.text(), /重新进入/);
      assert.ok([...f.container.querySelectorAll('button,input,select')].every(control => control.disabled));
      const count = f.jobCalls.length; f.click('job-refresh'); f.click('job-retry'); f.click('job-results'); f.submit();
      f.page.update({...f.context, available: false}); f.page.update({...f.context, available: true}); await settle(); assert.equal(f.jobCalls.length, count);
    } finally {f.close(); timers.close();}
  });
}
test('M03 an authority denial from polling fences a concurrent late resource and releases busy', async () => {
  const timers = pollTimers(), late = deferred(); let denied = false;
  const f = jobFixture({status: async () => {if (denied) throw Error('admin_authorization_denied'); return view();}, resource: () => late.promise});
  try {
    f.input('account', '123'); f.submit(); await settle(); f.click('job-results'); await settle(); assert.equal(f.busy(), 'true');
    denied = true; timers.tick(); await settle(); late.resolve(await resource()); await settle();
    assert.equal(f.created.length, 0); assert.equal(f.busy(), 'false'); assert.equal(timers.pending.size, 0);
    const count = f.jobCalls.length; f.click('job-refresh'); f.submit(); await settle(); assert.equal(f.jobCalls.length, count);
  } finally {f.close(); timers.close();}
});
for (const operation of ['submit', 'cancel', 'retry', 'resource']) {
  test(`M03 authority denial during ${operation} disables every operation and releases busy`, async () => {
    const timers = pollTimers(); let denied = operation === 'submit';
    const state = operation === 'retry' ? 'failed' : 'running';
    const success = operation === 'resource' ? resource : async () => view(state);
    const f = jobFixture({submit: async () => view(state), status: async () => view(state), [operation]: async (...args) => {
      if (denied) throw Error('admin_authorization_denied'); return success(...args);
    }});
    try {
      f.input('account', '123'); f.submit(); await settle();
      if (operation !== 'submit') {
        if (state === 'running') {f.click('job-results'); await settle();}
        assert.equal(f.created.length, 1);
        denied = true; f.click(operation === 'resource' ? 'job-results' : `job-${operation}`); await settle();
        assert.deepEqual(f.revoked, ['blob:beta2-1']);
      }
      assert.equal(f.busy(), 'false'); assert.equal(timers.pending.size, 0); assert.equal(f.container.querySelector('img'), null);
      assert.ok([...f.container.querySelectorAll('button,input,select')].every(control => control.disabled));
      if (['cancel', 'retry'].includes(operation)) assert.deepEqual(f.jobCalls.find(call => call[0] === operation), [operation, 'synthetic-job', 7]);
      const count = f.jobCalls.length; f.submit(); f.click('job-refresh'); f.click('job-results'); await settle(); assert.equal(f.jobCalls.length, count);
    } finally {f.close(); timers.close();}
  });
}
for (const error of [Error('operation_unavailable'), new TypeError('Failed to fetch'), Object.assign(Error('temporary'), {status: 429}), Object.assign(Error('temporary'), {status: 503})]) {
  test(`M03 transient ${error.status || error.message} preserves previews and manual recovery`, async () => {
    const timers = pollTimers(); let fail = false;
    const f = jobFixture({status: async () => {if (fail) throw error; return view();}});
    try {
      f.input('account', '123'); f.submit(); await settle(); f.click('job-results'); await settle(); assert.equal(f.created.length, 1);
      fail = true; timers.tick(); await settle(); assert.equal(f.revoked.length, 0); assert.ok(f.container.querySelector('img')); assert.equal(f.busy(), 'false');
      assert.equal(f.container.querySelector('[data-action="job-refresh"]').disabled, false);
      fail = false; f.click('job-refresh'); await settle(); assert.equal(f.jobCalls.filter(call => call[0] === 'status').length, 3); assert.equal(timers.pending.size, 1);
    } finally {f.close(); timers.close();}
  });
}
for (const reason of ['rate_limited', 'resource_budget']) {
  test(`M02 ${reason} replacement progress retains cumulative counts and published previews/index`, async () => {
    const timers = pollTimers(); let stopped = false;
    const counts = {source_returned: 300, selected: 250, generated: 100, pending: 150, missing_images: 3, result_entries: 1};
    const f = jobFixture({status: async () => stopped ? view('failed', {...counts, reason}) : view('running', counts)});
    try {
      f.input('account', '123'); f.submit(); await settle(); f.click('job-results'); await settle(); assert.equal(f.created.length, 1);
      stopped = true; timers.tick(); await settle(); assert.match(f.text(), /已选250 · 已生成100 · 待处理150 · 缺图3/); assert.match(f.text(), /wall result synthetic-job/);
      assert.ok(f.container.querySelector('img')); assert.equal(f.container.querySelector('[data-action="job-next"]').disabled, false);
    } finally {f.close(); timers.close();}
  });
}
test('M02 missing legacy progress is unknown, never an invented generated/missing zero', async () => {
  const f = jobFixture({submit: async () => view('failed'), status: async () => view('failed'), result: async () => ({entries: [], next_cursor: null})});
  try {f.input('account', '123'); f.submit(); await settle(); assert.match(f.text(), /已生成待确认/); assert.match(f.text(), /缺图待确认/); assert.doesNotMatch(f.text(), /已生成0|缺图0/);} finally {f.close();}
});
test('M01 Steam access denial gives safe configuration/authorization/public-range guidance', async () => {
  const f = jobFixture({submit: async () => view('failed', {reason: 'steam_source_access_denied'}), status: async () => view('failed', {reason: 'steam_source_access_denied'}), result: async () => ({entries: [], next_cursor: null})});
  try {
    f.input('account', '123'); f.submit(); await settle(); assert.match(f.text(), /可信/); assert.match(f.text(), /授权/); assert.match(f.text(), /公开|访问范围/); assert.doesNotMatch(f.text(), /原因暂不可确认|稍后重试.*Steam Key错误/);
    assert.equal(f.container.querySelector('[data-action="job-retry"]').disabled, false, 'source access failure does not revoke the page authority');
  } finally {f.close();}
});

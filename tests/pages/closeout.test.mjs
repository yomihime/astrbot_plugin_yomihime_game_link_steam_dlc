import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {mount, installDOM} from './source-build.mjs';

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAX+XDSwAAAABJRU5ErkJggg==';
const settle = async () => {for (let index = 0; index < 32; index++) await Promise.resolve();};
const deferred = () => {let resolve, reject; const promise = new Promise((yes, no) => {resolve = yes; reject = no;}); return {promise, resolve, reject};};
const response = () => ({schema_version: 1, status: 'success', privacy: 'public', document: {title: 'CS2', subject: 'CS2', sources: [], timestamps: [], blocks: [
  {kind: 'text', text: '来源保留的原始资料说明。'},
  {kind: 'fields', fields: {cs2: {kind: 'profile', platform: 'perfect', coverage: 'platform_recorded', season: 'S16', fetched_at: '2026-10-25T00:00:00Z', target: {id: '76561197960265851'}, data: {
    nickname: '合成玩家', account_id: '76561197960265851', avatar_url: 'https://untrusted.invalid/avatar.png', rank: {value: 0, score: '1800.5'}, metrics: {matches: 0, kd: null, rating: '1.2', pw_rating: '0.0', adr: '88.5'},
  }}}},
]}, warnings: [], model_facts: null, error: null});
const preview = (value = response()) => ({...value, image_state: 'ready', images: [{media_type: 'image/png', base64: PNG}]});
let sequence = 0;
function fixture({moduleId = 'cs2', routeId = 'query', invoke = async () => response(), preview: imageService = async () => preview(), jobs} = {}) {
  const dom = new JSDOM('<!doctype html><main></main>', {url: 'http://localhost/'}); installDOM(dom);
  const container = dom.window.document.querySelector('main'), abort = new AbortController(), disposals = new Set();
  const calls = [], created = [], revoked = [];
  dom.window.URL.createObjectURL = blob => {created.push(blob); return `blob:closeout-${created.length}`;};
  dom.window.URL.revokeObjectURL = url => {revoked.push(url);};
  const context = {owner: `steam_dlc/${moduleId}`, runtimeId: `closeout-${++sequence}`, epoch: 3, boundary: 'a', available: true, theme: 'light', locale: 'zh-CN'};
  const page = mount(container, {routeId, context, services: {jobs,
    invoke(id, parameters) {calls.push(['invoke', id, structuredClone(parameters)]); return invoke(id, parameters);},
    preview(id, parameters) {calls.push(['preview', id, structuredClone(parameters)]); return imageService(id, parameters);},
  }, scope: {signal: abort.signal, isCurrent: () => true, onDispose(callback) {disposals.add(callback); return () => disposals.delete(callback);}}});
  return {dom, container, page, context, calls, created, revoked,
    text: () => container.textContent,
    input(name, value) {const input = container.querySelector(`[name="${name}"]`); input.value = value; input.dispatchEvent(new dom.window.Event(input.tagName === 'SELECT' ? 'change' : 'input', {bubbles: true}));},
    submit() {container.querySelector('form').dispatchEvent(new dom.window.Event('submit', {bubbles: true, cancelable: true}));},
    click(action) {container.querySelector(`[data-action="${action}"]`).click();},
    close() {page.dispose(); dom.window.close();}, abort() {abort.abort();},
  };
}

test('CS2 profile makes one preview call, renders structured facts and uses only validated Blob PNG', async () => {
  const f = fixture();
  try {
    await settle(); f.calls.length = 0;
    f.input('account', '76561197960265851');
    const account = f.container.querySelector('[name="account"]'); account.focus();
    f.submit(); await settle();
    assert.deepEqual(f.calls, [['preview', 'query', {account: '76561197960265851', action: 'profile', platform: 'perfect'}]]);
    assert.equal(f.container.querySelector('img').getAttribute('src'), 'blob:closeout-1');
    assert.equal(f.created[0].type, 'image/png'); assert.equal(f.created[0].size, Buffer.from(PNG, 'base64').length);
    assert.match(f.text(), /来源保留的原始资料说明/); assert.match(f.text(), /合成玩家/);
    assert.match(f.text(), /段位：0 · 积分：1800.5/); assert.match(f.text(), /完美平台/);
    const cells = [...f.container.querySelectorAll('table td')].map(cell => cell.textContent);
    assert.deepEqual(cells.slice(0, 5), ['0', '未知', '1.2', '0.0', '88.5']);
    assert.equal(f.dom.window.document.activeElement, account);
    assert.equal(f.container.querySelector('form').getAttribute('aria-busy'), 'false');
    f.submit(); await settle(); assert.deepEqual(f.revoked, ['blob:closeout-1']);
  } finally {f.close();}
  assert.deepEqual(f.revoked, ['blob:closeout-1', 'blob:closeout-2']);
});

test('CS2 missing, denied and corrupt optional images keep legal text and never use avatar external URL', async () => {
  const corrupt = Buffer.from(PNG, 'base64'); corrupt[45] ^= 1;
  for (const images of [
    {image_state: 'none', images: []},
    {image_state: 'ready', images: [{media_type: 'image/png', base64: corrupt.toString('base64')}]},
    {image_state: 'ready', images: [{media_type: 'image/png', url: 'https://untrusted.invalid/card.png'}]},
    {image_state: 'ready', images: [{media_type: 'image/svg+xml', base64: PNG}]},
    {image_state: 'none', images: [{media_type: 'image/png', base64: PNG}]},
  ]) {
    const f = fixture({preview: async () => ({...response(), ...images})});
    try {
      await settle(); f.calls.length = 0; f.input('account', '76561197960265851'); f.submit(); await settle();
      assert.equal(f.calls.length, 1); assert.match(f.text(), /来源保留的原始资料说明/); assert.match(f.text(), /合成玩家/);
      assert.equal(f.container.querySelector('img'), null); assert.equal(f.created.length, 0);
      assert.equal(f.container.querySelector('[data-action="query-text-only"]').parentElement.hidden, true);
      assert.match(f.text(), images.image_state === 'none' && !images.images.length ? /未提供资料卡/ : /图片无法验证/);
    } finally {f.close();}
  }
});

test('CS2 whole preview failure requires explicit retry or text-only query and edited targets invalidate recovery', async () => {
  const f = fixture({preview: async () => {throw Error('render_failed secret upstream body');}});
  try {
    await settle(); f.calls.length = 0; f.input('account', '76561197960265851'); f.submit(); await settle();
    assert.deepEqual(f.calls.map(call => call[0]), ['preview']);
    assert.match(f.text(), /未取得可确认的文字或图片/); assert.doesNotMatch(f.text(), /secret upstream/);
    assert.equal(f.container.querySelector('[data-action="query-text-only"]').parentElement.hidden, false);
    f.click('query-preview-retry'); await settle();
    assert.equal(f.calls.length, 2); assert.equal(f.calls[1][0], 'preview'); assert.equal(f.calls[1][2].account, '76561197960265851');
    f.click('query-text-only'); await settle();
    assert.equal(f.calls.length, 3); assert.equal(f.calls[2][0], 'invoke'); assert.equal(f.calls[2][2].account, '76561197960265851');
    assert.match(f.text(), /来源保留的原始资料说明/);
    f.submit(); await settle(); assert.equal(f.calls.length, 4);
    f.input('account', '76561197960265852'); f.click('query-text-only'); await settle();
    assert.equal(f.calls.length, 4); assert.equal(f.container.querySelector('[data-action="query-text-only"]').parentElement.hidden, true);
  } finally {f.close();}
});

test('CS2 known source error codes retain actionable guidance without echoing messages or automatically invoking again', async () => {
  for (const [code, expected] of [
    ['auth_required', /可信设置页完成完美扫码授权或配置 5E Token/],
    ['auth_expired', /可信设置页重新授权/],
    ['rate_limited', /来源请求限流，请稍后再查询/],
    ['parameter_error', /核对玩家账号、所选来源、赛季和比赛 ID/],
    ['not_public', /核对公开设置与来源授权/],
    ['not_found', /核对玩家账号与所选来源/],
    ['no_records', /不代表该玩家没有比赛历史/],
    ['unparsed', /等待来源解析/],
    ['upstream_error', /所选来源暂时不可用/],
  ]) {
    const f = fixture({preview: async () => ({...preview(), status: 'error', document: null, error: {code, message: 'arbitrary upstream secret body'}, image_state: 'none', images: []})});
    try {
      await settle(); f.calls.length = 0; f.input('account', '76561197960265851'); f.submit(); await settle();
      assert.equal(f.calls.length, 1); assert.equal(f.calls[0][0], 'preview');
      assert.match(f.text(), expected); assert.doesNotMatch(f.text(), /arbitrary upstream secret body|资料卡预览未完成|未取得可确认的文字或图片/);
      assert.equal(f.container.querySelector('[data-action="query-text-only"]').parentElement.hidden, true);
      assert.equal(f.created.length, 0);
      f.click('query-text-only'); f.click('query-preview-retry'); await settle(); assert.equal(f.calls.length, 1);
      assert.equal(f.container.querySelector('form').getAttribute('aria-busy'), 'false');
    } finally {f.close();}
  }
});

test('CS2 ambiguous module-unavailable and unknown error envelopes preserve explicit preview/text-only recovery', async () => {
  for (const code of ['module_unavailable', 'unknown private code', 'toString']) {
    const f = fixture({preview: async () => ({...preview(), status: 'error', document: null, error: {code, message: 'arbitrary upstream secret body'}, image_state: 'none', images: []})});
    try {
      await settle(); f.calls.length = 0; f.input('account', '76561197960265851'); f.submit(); await settle();
      assert.equal(f.calls.length, 1); assert.equal(f.calls[0][0], 'preview');
      assert.match(f.text(), /未取得可确认的文字或图片/);
      assert.doesNotMatch(f.text(), /arbitrary upstream secret body|unknown private code/);
      assert.equal(f.container.querySelector('[data-action="query-text-only"]').parentElement.hidden, false);
      assert.equal(f.created.length, 0);
      f.click('query-text-only'); await settle();
      assert.equal(f.calls.length, 2); assert.equal(f.calls[1][0], 'invoke'); assert.match(f.text(), /来源保留的原始资料说明/);
    } finally {f.close();}
  }
});

test('CS2 profile fences busy and late replies across availability, identity, abort and disposal', async () => {
  for (const boundary of ['availability', 'identity', 'abort', 'dispose']) {
    const late = deferred();
    const f = fixture({preview: () => late.promise});
    try {
      await settle(); f.calls.length = 0; f.input('account', '76561197960265851'); f.submit();
      assert.equal(f.container.querySelector('form').getAttribute('aria-busy'), 'true');
      f.submit(); f.click('query-status'); assert.equal(f.calls.length, 1);
      if (boundary === 'availability') f.page.update({...f.context, available: false});
      else if (boundary === 'identity') f.page.update({...f.context, boundary: 'b'});
      else if (boundary === 'abort') f.abort();
      else f.page.dispose();
      late.resolve(preview()); await settle();
      assert.equal(f.created.length, 0); assert.equal(f.container.querySelector('img'), null);
      if (boundary === 'availability') {
        f.page.update({...f.context, available: true}); await settle();
        assert.equal(f.calls.length, 1); assert.equal(f.container.querySelector('[name="account"]').value, '76561197960265851');
        assert.equal(f.container.querySelector('form').getAttribute('aria-busy'), 'false');
      }
      if (boundary === 'identity') assert.equal(f.container.querySelector('[name="account"]').value, '');
    } finally {f.close();}
  }
});

test('CS2 existing Blob card is revoked immediately on availability, identity and page disposal', async () => {
  for (const boundary of ['availability', 'identity', 'dispose']) {
    const f = fixture();
    try {
      await settle(); f.input('account', '76561197960265851'); f.submit(); await settle();
      assert.equal(f.created.length, 1);
      if (boundary === 'availability') f.page.update({...f.context, available: false});
      else if (boundary === 'identity') f.page.update({...f.context, epoch: 4});
      else f.page.dispose();
      assert.deepEqual(f.revoked, ['blob:closeout-1']); assert.equal(f.container.querySelector('img'), null);
    } finally {f.close();}
  }
});

test('CS2 authority rejection revokes page, clears target and prevents all recovery calls', async () => {
  const f = fixture({preview: async () => {throw Error('page_revoked');}});
  try {
    await settle(); f.calls.length = 0; f.input('account', '76561197960265851'); f.submit(); await settle();
    assert.equal(f.container.querySelector('[name="account"]').value, ''); assert.match(f.text(), /请重新进入页面/);
    f.click('query-preview-retry'); f.click('query-text-only'); f.submit(); await settle(); assert.equal(f.calls.length, 1);
  } finally {f.close();}
});

test('CS2 consumes real frozen-Core serialized profile as preview without dropping text or decimals', {skip: !process.env.CS2_GATEWAY_FIXTURE}, async () => {
  const row = JSON.parse(readFileSync(process.env.CS2_GATEWAY_FIXTURE, 'utf8')).find(row => row.action === 'profile');
  assert.ok(row); const data = row.response.document.blocks.find(block => block.fields?.cs2).fields.cs2;
  const f = fixture({preview: async () => preview(structuredClone(row.response))});
  try {
    await settle(); f.calls.length = 0; f.input('account', data.target.id); f.submit(); await settle();
    assert.equal(f.calls.length, 1); assert.equal(f.calls[0][0], 'preview');
    assert.match(f.text(), /1\.2/); assert.match(f.text(), /0\.0/); assert.match(f.text(), /88\.5/);
    assert.ok(f.text().includes(data.data.nickname)); assert.equal(f.created.length, 1);
    for (const block of row.response.document.blocks) if (block.kind === 'text') assert.ok(f.text().includes(block.text));
  } finally {f.close();}
});

function jobFixture(view, overrides = {}) {
  const calls = [];
  const f = fixture({moduleId: 'steam', routeId: 'collage', jobs: {
    async submit(value) {calls.push(['submit', value]); return structuredClone(view);},
    async status() {calls.push(['status']); return structuredClone(view);},
    async result() {calls.push(['result']); return {entries: [], next_cursor: null};},
    async cancel(id, revision) {calls.push(['cancel', id, revision]); return {...view, status: 'cancelled', revision: revision + 1};},
    async retry(id, revision) {calls.push(['retry', id, revision]); return {...view, status: 'queued', revision: revision + 1};},
    ...overrides,
  }});
  return {...f, jobCalls: calls};
}
const jobView = (status = 'failed', progress = {}, summary = {}) => ({job_id: 'synthetic-job', revision: 7, status, progress, summary, error_code: null});

test('Steam job reasons are safe Chinese with known bounded retry_after and fresh-execution guidance', async () => {
  for (const [reason, expected] of [
    ['steam_key_required', /可信管理页配置Steam Key/], ['steam_source_unavailable', /未用其他来源替代/],
    ['steam_source_not_public', /未视为空库/], ['resource_budget', /减少数量或降低清晰度/],
    ['metadata_incomplete', /未视为空库/], ['unknown secret body', /原因暂不可确认/],
  ]) {
    const view = jobView('failed', {reason}); view.error_code = 'private trace stack';
    const f = jobFixture(view);
    try {
      f.input('account', '123'); f.submit(); await settle();
      assert.match(f.text(), expected); assert.doesNotMatch(f.text(), /unknown secret body|private trace stack/);
      assert.match(f.text(), /显式重新执行并复用有效缓存/);
      assert.equal(f.container.querySelector('[data-action="job-retry"]').hidden, false);
      assert.doesNotMatch(f.text(), /wall result synthetic-job/);
    } finally {f.close();}
  }
  for (const wait of [0, 30, 86400, undefined, -1, 86401, '30', 2.5, null]) {
    const f = jobFixture(jobView('failed', {reason: 'rate_limited', retry_after: wait}));
    try {
      f.input('account', '123'); f.submit(); await settle();
      assert.match(f.text(), /来源限流/);
      if ([0, 30, 86400].includes(wait)) assert.ok(f.text().includes(`来源建议等待${wait}秒`));
      else {assert.doesNotMatch(f.text(), /来源建议等待/); assert.match(f.text(), /稍后重试/);}
    } finally {f.close();}
  }
});

test('Steam queued/running forbid retry and offer published-result guidance only from durable entries', async () => {
  for (const state of ['queued', 'running']) {
    for (const entries of [undefined, 0, 2]) {
      const f = jobFixture(jobView(state, {}, {generated: 100, result_entries: entries}));
      try {
        f.input('account', '123'); f.submit(); await settle();
        const retry = f.container.querySelector('[data-action="job-retry"]');
        assert.equal(retry.hidden, true); assert.equal(retry.disabled, true);
        assert.match(f.text(), /可刷新状态或取消任务/); retry.click(); await settle();
        assert.equal(f.jobCalls.filter(call => call[0] === 'retry').length, 0);
        if (entries) assert.match(f.text(), /wall result synthetic-job/);
        else assert.doesNotMatch(f.text(), /wall result synthetic-job/);
      } finally {f.close();}
    }
  }
});

test('Steam cancelled/interrupted retry is explicit, uses current revision and never auto-submits', async () => {
  for (const state of ['cancelled', 'interrupted']) {
    const view = jobView(state, {}, {result_entries: 1});
    const f = jobFixture(view);
    try {
      f.input('account', '123'); f.submit(); await settle();
      assert.match(f.text(), /不会从最后一项自动断点续跑/); assert.match(f.text(), /wall result synthetic-job/);
      assert.equal(f.jobCalls.filter(call => call[0] === 'retry').length, 0);
      f.click('job-retry'); await settle();
      assert.deepEqual(f.jobCalls.filter(call => call[0] === 'retry'), [['retry', 'synthetic-job', 7]]);
      assert.equal(f.jobCalls.filter(call => call[0] === 'submit').length, 1);
    } finally {f.close();}
  }
});

test('Steam running result access checks real persisted entries and fences an in-flight result on availability', async () => {
  const result = deferred(), resource = deferred();
  const view = jobView('running', {}, {generated: 100});
  let resourceCalls = 0;
  const f = jobFixture(view, {result: () => result.promise, resource: () => {resourceCalls++; return resource.promise;}});
  try {
    f.input('account', '123'); f.submit(); await settle();
    assert.doesNotMatch(f.text(), /wall result synthetic-job/);
    f.click('job-results'); await settle();
    result.resolve({entries: [{resource: {media_type: 'image/png', asset_id: 'published-1'}, metadata: {batch_index: 0}}], next_cursor: null}); await settle();
    assert.equal(resourceCalls, 1); assert.match(f.text(), /wall result synthetic-job/);
    f.page.update({...f.context, available: false});
    resource.resolve(new Blob([Buffer.from(PNG, 'base64')], {type: 'image/png'})); await settle();
    assert.equal(f.created.length, 0); assert.equal(f.container.querySelector('img'), null);
  } finally {f.close();}
});

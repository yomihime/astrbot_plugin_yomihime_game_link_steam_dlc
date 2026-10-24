import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { mount, installDOM, runtime } from './source-build.mjs';

const clone = value => structuredClone(value);
const settle = async () => { for (let i = 0; i < 16; i++) await Promise.resolve(); };
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
function snapshot(moduleId = 'dota2') {
  const value = {
    revision: 7,
    fields: { reply_theme: { value: 'violet', state: 'valid', present: true, source: 'sqlite' } },
    descriptors: {
      reply_theme: {
        description: '选择本模块回复主题。', default: null, value_schema: { type: ['string', 'null'] },
        choices: [{ value: null, label: '跟随核心' }, { value: 'violet', label: '紫罗兰' }, { value: 'forest', label: '林间' }],
      },
    },
  };
  if (moduleId === 'dota2') {
    value.fields.timezone = { value: 'Asia/Shanghai', state: 'valid', present: false, source: 'default' };
    value.descriptors.timezone = {
      description: '命令输出时区（IANA 名称）。', default: 'Asia/Shanghai',
      value_schema: { type: 'string', minLength: 1, maxLength: 64 },
    };
  }
  if (moduleId === 'steam') {
    value.fields.poster_include_apps = { value: false, state: 'valid', present: false, source: 'default' };
    value.descriptors.poster_include_apps = {
      description: '默认仅纳入游戏；开启后包含软件等全部应用。', default: false,
      value_schema: { type: 'boolean' },
    };
    value.fields.poster_limit = { value: 60, state: 'valid', present: false, source: 'default' };
    value.descriptors.poster_limit = {
      description: '最多纳入 200 项。', default: 60,
      value_schema: { type: 'integer', minimum: 1, maximum: 200 },
    };
  }
  return value;
}
let fixtureSequence = 0;
function fixture({ moduleId = 'dota2', routeId = 'settings', available = true, service = {}, initialState = null, invoke = async () => cacheResponse(), preview = async () => cacheResponse(), jobs = undefined, credentials = {async status() { return {revision: 7, fields: {}}; }}, context: contextPatch = {} } = {}) {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', {url: 'http://localhost/'});
  installDOM(dom);
  const container = dom.window.document.querySelector('#root');
  const abort = new AbortController();
  let scopeCurrent = true, state = initialState || snapshot(moduleId), notifications = 0;
  const disposal = new Set(), calls = [];
  const context = { owner: `steam_dlc/${moduleId}`, runtimeId: `runtime-${++fixtureSequence}`, epoch: 3, boundary: 'boundary-a', available, theme: 'light', locale: 'zh-CN', ...contextPatch };
  const config = {
    async current() { calls.push(['current']); return clone(state); },
    async save(revision, values) {
      calls.push(['save', revision, clone(values)]);
      assert.equal(revision, state.revision);
      for (const [name, value] of Object.entries(values)) state.fields[name] = { value, state: 'valid', present: true, source: 'sqlite' };
      return { revision: ++state.revision };
    },
    async clear(revision, fields) {
      calls.push(['clear', revision, clone(fields)]);
      assert.equal(revision, state.revision);
      for (const name of fields) state.fields[name] = { value: state.descriptors[name].default, state: 'valid', present: false, source: 'default' };
      return { revision: ++state.revision };
    },
    ...service,
  };
  const page = mount(container, {
    routeId, context,
    services: { config, invoke(id, parameters) { calls.push(['invoke', id, clone(parameters)]); return invoke(id, parameters); }, preview(id, parameters) { calls.push(['preview', id, clone(parameters)]); return preview(id, parameters); }, credentials, jobs },
    scope: { signal: abort.signal, isCurrent: () => scopeCurrent, onDispose(callback) { disposal.add(callback); return () => disposal.delete(callback); } },
    onNavigationStateChange() { notifications++; },
  });
  const input = (name, value) => {
    const control = container.querySelector(`[name="${name}"]`);
    assert.ok(control, `missing ${name}`);
    control.value = value;
    control.dispatchEvent(new dom.window.Event(control.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  };
  const click = action => container.querySelector(`[data-action="${action}"]`).click();
  const submit = () => container.querySelector('form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
  return {
    dom, container, page, context, calls, input, click, submit, config,
    get state() { return state; }, set state(next) { state = next; },
    get notifications() { return notifications; },
    revokeScope() { scopeCurrent = false; },
    abort() { abort.abort(); },
    disposeScope() { for (const callback of disposal) callback(); },
    text: () => container.textContent,
    close() { page.dispose(); dom.window.close(); },
  };
}

function cacheResponse(value = { bytes: 12345, items: 7, max_bytes: 8000000, max_items: 32, evictions: 2 }) {
  return { schema_version: 1, status: 'success', privacy: 'public', document: {
    title: 'Steam 海报缓存', subject: 'Steam DLC', sources: [], timestamps: [],
    blocks: [{ kind: 'fields', fields: { cache: value } }],
  }, provenance: [], timestamps: [], warnings: [], model_facts: null, error: null };
}

for (const moduleId of ['steam', 'dota2', 'cs2', 'deadlock']) {
  test(`${moduleId} home has actual command help and availability`, async () => {
    const f = fixture({ moduleId, routeId: 'home' });
    assert.match(f.text(), new RegExp(`/ygl ${moduleId} `));
    assert.match(f.text(), /运行健康请在模块管理中查看/);
    if (moduleId === 'cs2') { assert.match(f.text(), /完美收录官匹与 5E/); assert.doesNotMatch(f.text(), /Leetify|留存政策限制/); }
    if (moduleId === 'deadlock') assert.match(f.text(), /默认使用最近 20 条已收录记录/);
    assert.ok(f.container.querySelector('.ui-page .ui-page-header h1'));
    assert.ok(f.container.querySelector('.ui-settings-layout .ui-settings-group'));
    if (moduleId === 'steam') {
      await settle();
      assert.deepEqual(f.calls, [['invoke', 'wall_cache_status', {}]]);
      assert.match(f.text(), /7 项 \/ 12345 字节/);
    }
    f.page.update({ ...f.context, available: false });
    assert.match(f.text(), /当前页面入口不可用/);
    if (moduleId !== 'steam') assert.deepEqual(f.calls, [['invoke', 'status', {}]]);
    assert.deepEqual(Object.keys(f.page.navigationImpact()).sort(), ['credentials', 'ordinary', 'pending', 'version']);
    f.close();
  });
  test(`${moduleId} settings render only declared dynamic fields`, async () => {
    const f = fixture({ moduleId });
    await settle();
    assert.equal(f.container.querySelectorAll('input,select').length, moduleId === 'dota2' ? 2 : moduleId === 'steam' ? 3 : 1);
    assert.equal(f.container.querySelector('select option:last-child').textContent, '林间');
    assert.equal(f.container.querySelector('select').value, '1');
    assert.ok(!f.container.querySelector('input[type=password]'));
    assert.equal(f.page.navigationImpact().ordinary, false);
    f.close();
  });
}

test('public provider updates theme and locale without remounting focused drafts or changing reply_theme', async () => {
  let providerProps;
  const setup = runtime.UiProvider.setup;
  runtime.UiProvider.setup = (props, context) => { providerProps = props; return setup(props, context); };
  const f = fixture();
  runtime.UiProvider.setup = setup;
  try {
    await settle();
    const input = f.container.querySelector('[name=timezone]');
    const select = f.container.querySelector('[name=reply_theme]');
    input.focus();
    f.input('timezone', 'Europe/London');
    const navigation = f.page.navigationImpact();
    f.page.update({...f.context, theme: 'dark', locale: 'en-US'});
    await settle();
    assert.equal(providerProps.theme, 'dark');
    assert.equal(providerProps.locale, 'en-US');
    assert.equal(f.container.querySelector('.ui-page').dataset.theme, 'dark');
    assert.equal(f.container.querySelector('.steam-dlc-view').lang, 'en-US');
    assert.equal(f.container.querySelector('[name=timezone]'), input);
    assert.equal(f.container.querySelector('[name=reply_theme]'), select);
    assert.equal(f.dom.window.document.activeElement, input);
    assert.equal(input.value, 'Europe/London');
    assert.equal(select.value, '1', 'web theme never edits image reply_theme');
    assert.deepEqual(f.page.navigationImpact(), navigation);
    assert.deepEqual(f.calls, [['current']], 'context presentation change does not make service calls');
  } finally { runtime.UiProvider.setup = setup; f.close(); }
});

test('theme update during a pending write retains its focus, single-flight state and CAS sequence', async () => {
  const pending = deferred();
  const f = fixture(); await settle();
  const original = f.config.save;
  f.config.save = async (...args) => { await pending.promise; return original(...args); };
  f.input('timezone', 'UTC');
  const button = f.container.querySelector('[data-action=save]');
  button.focus(); f.submit();
  f.page.update({...f.context, theme: 'dark', locale: 'en-US'}); await settle();
  assert.equal(f.container.querySelector('[data-action=save]'), button);
  assert.equal(f.dom.window.document.activeElement, button);
  assert.equal(f.page.navigationImpact().pending, true);
  f.submit();
  pending.resolve(); await settle();
  assert.deepEqual(f.calls, [['current'], ['save', 7, {timezone: 'UTC'}], ['current']]);
  assert.match(f.text(), /已保存/);
  f.close();
});

test('timezone save and follow-Core clear use exact sequential CAS revisions', async () => {
  const f = fixture(); await settle();
  f.input('timezone', 'Europe/London'); f.input('reply_theme', '0');
  const version = f.page.navigationImpact().version;
  assert.equal(f.page.navigationImpact().ordinary, true);
  f.submit(); f.submit(); await settle();
  assert.deepEqual(f.calls, [ ['current'], ['save', 7, { timezone: 'Europe/London' }], ['clear', 8, ['reply_theme']], ['current'] ]);
  assert.match(f.text(), /已保存/);
  assert.equal(f.page.navigationImpact().ordinary, false);
  assert.ok(f.page.navigationImpact().version > version);
  assert.equal(f.page.navigationImpact().credentials, false);
  f.close();
});

test('restoring timezone is a clear draft, not an immediate write', async () => {
  const f = fixture(); await settle();
  f.state.fields.timezone = { value: 'UTC', state: 'valid', present: true, source: 'sqlite' };
  f.click('refresh'); await settle(); f.click('reset-timezone');
  assert.equal(f.container.querySelector('[name=timezone]').value, 'Asia/Shanghai');
  assert.equal(f.calls.some(call => call[0] === 'clear'), false);
  f.submit(); await settle();
  assert.deepEqual(f.calls.filter(call => call[0] === 'clear'), [['clear', 7, ['timezone']]]);
  f.close();
});

test('timezone validation blocks malformed and descriptor-overlength values', async () => {
  const f = fixture(); await settle();
  for (const value of ['Not/AZone', 'x'.repeat(65)]) {
    f.input('timezone', value); f.submit(); await settle();
    assert.match(f.text(), /IANA 时区/);
  }
  assert.deepEqual(f.calls, [['current']]); f.close();
});

test('refresh keeps edits made before and during a delayed read', async () => {
  const f = fixture(); await settle();
  const read = deferred(); f.config.current = () => read.promise;
  f.input('timezone', 'UTC'); f.click('refresh');
  f.input('timezone', 'Europe/London');
  read.resolve(snapshot()); await settle();
  assert.equal(f.container.querySelector('[name=timezone]').value, 'Europe/London');
  assert.match(f.text(), /草稿已保留/); f.close();
});

test('edits during save survive receipt and readback', async () => {
  const f = fixture(); await settle();
  const write = deferred();
  f.config.save = (revision, values) => {
    f.calls.push(['save', revision, values]);
    f.state.revision = 8;
    f.state.fields.timezone = { value: values.timezone, present: true, state: 'valid', source: 'sqlite' };
    return write.promise;
  };
  f.input('timezone', 'UTC'); f.submit();
  f.input('timezone', 'Europe/London');
  write.resolve({ revision: 8 }); await settle();
  assert.equal(f.container.querySelector('[name=timezone]').value, 'Europe/London');
  assert.equal(f.page.navigationImpact().ordinary, true);
  assert.match(f.text(), /新的未保存修改/); f.close();
});

for (const action of ['reset', 'baseline-value']) {
  test(`${action} during a pending save preserves the newer draft intent`, async () => {
    const f = fixture(); await settle();
    const write = deferred();
    f.config.save = (_revision, values) => {
      f.state.revision = 8;
      f.state.fields.timezone = { value: values.timezone, present: true, state: 'valid', source: 'sqlite' };
      return write.promise;
    };
    f.input('timezone', 'UTC'); f.submit();
    if (action === 'reset') f.click('reset-timezone');
    else f.input('timezone', 'Asia/Shanghai');
    write.resolve({ revision: 8 }); await settle();
    assert.equal(f.container.querySelector('[name=timezone]').value, 'Asia/Shanghai');
    assert.equal(f.page.navigationImpact().ordinary, true);
    f.config.save = async (revision, values) => {
      f.calls.push(['save', revision, values]);
      f.state.revision = revision + 1;
      f.state.fields.timezone = { value: values.timezone, present: true, state: 'valid', source: 'sqlite' };
      return { revision: f.state.revision };
    };
    f.submit(); await settle();
    if (action === 'reset') assert.deepEqual(f.calls.filter(call => call[0] === 'clear'), [['clear', 8, ['timezone']]]);
    else assert.deepEqual(f.calls.filter(call => call[0] === 'save'), [['save', 8, { timezone: 'Asia/Shanghai' }]]);
    f.close();
  });
}

for (const key of ['owner', 'runtimeId', 'epoch', 'boundary']) {
  test(`${key} change fences delayed reads and prevents reuse`, async () => {
    const read = deferred();
    const f = fixture({ service: { current: () => read.promise } });
    f.page.update({ ...f.context, [key]: key === 'epoch' ? 4 : 'changed' });
    read.resolve(snapshot()); await settle();
    assert.equal(f.container.querySelector('input'), null);
    assert.match(f.text(), /上下文已变化/);
    f.click('refresh'); await settle();
    assert.equal(f.page.navigationImpact().pending, false);
    f.close();
  });
}

test('unavailable update fences an outstanding write before a subsequent clear', async () => {
  const f = fixture(); await settle();
  const write = deferred(); let clearCount = 0;
  f.config.save = () => write.promise;
  f.config.clear = async () => { clearCount++; return { revision: 9 }; };
  f.input('timezone', 'UTC'); f.input('reply_theme', '0'); f.submit();
  f.page.update({ ...f.context, available: false });
  write.resolve({ revision: 8 }); await settle();
  assert.equal(clearCount, 0);
  assert.equal(f.page.navigationImpact().ordinary, true);
  assert.match(f.text(), /当前页面入口不可用/); f.close();
});

for (const disposal of ['disposeScope', 'abort', 'revokeScope']) {
  test(`${disposal} prevents late read DOM commits`, async () => {
    const read = deferred();
    const f = fixture({ service: { current: () => read.promise } });
    f[disposal]();
    const previous = f.container.innerHTML;
    read.resolve(snapshot()); await settle();
    assert.equal(f.container.innerHTML, previous);
    f.close();
  });
}

test('dispose removes listeners and rejects events retained by old DOM references', async () => {
  const f = fixture(); await settle();
  const form = f.container.querySelector('form'), refresh = f.container.querySelector('[data-action=refresh]');
  f.input('timezone', 'UTC'); f.page.dispose();
  form.dispatchEvent(new f.dom.window.Event('submit', { cancelable: true })); refresh.click(); await settle();
  assert.deepEqual(f.calls, [['current']]); assert.equal(f.container.children.length, 0); f.close();
});

test('CAS conflict preserves draft and blocks writes until explicit refresh', async () => {
  const f = fixture(); await settle();
  let attempts = 0;
  f.config.save = async () => { attempts++; throw Error('revision_conflict'); };
  f.input('timezone', 'UTC'); f.submit(); await settle();
  assert.match(f.text(), /其他操作修改/); f.submit(); await settle();
  assert.equal(attempts, 1);
  assert.equal(f.container.querySelector('[name=timezone]').value, 'UTC');
  f.click('refresh'); await settle();
  assert.match(f.text(), /草稿已保留/); f.submit(); await settle();
  assert.equal(attempts, 2); f.close();
});

test('unknown write failure is not retried and never renders arbitrary errors', async () => {
  const f = fixture(); await settle(); let attempts = 0;
  f.config.save = async () => { attempts++; throw Error('<secret diagnostic>'); };
  f.input('timezone', 'UTC'); f.submit(); await settle(); f.submit(); await settle();
  assert.equal(attempts, 1); assert.match(f.text(), /保存结果尚未确认/);
  assert.doesNotMatch(f.text(), /secret diagnostic/); f.close();
});

test('accepted write followed by failed readback remains unverified, manual refresh reconciles', async () => {
  const f = fixture(); await settle(); let reads = 0;
  f.config.current = async () => { if (++reads === 1) throw Error('offline'); return clone(f.state); };
  f.input('timezone', 'UTC'); f.submit(); await settle();
  assert.match(f.text(), /状态暂未核实/);
  f.submit(); await settle();
  assert.equal(f.calls.filter(call => call[0] === 'save').length, 1);
  f.click('refresh'); await settle();
  assert.equal(f.page.navigationImpact().ordinary, false);
  assert.equal(f.container.querySelector('[name=timezone]').value, 'UTC'); f.close();
});

test('save accepted then clear conflict does not conceal partial write', async () => {
  const f = fixture(); await settle(); let clears = 0;
  f.config.clear = async () => { clears++; throw Error('revision_conflict'); };
  f.input('timezone', 'UTC'); f.input('reply_theme', '0'); f.submit(); await settle();
  assert.match(f.text(), /部分或全部修改已提交/);
  f.submit(); await settle(); assert.equal(clears, 1);
  f.click('refresh'); await settle();
  f.config.clear = async revision => { assert.equal(revision, 8); return { revision: 9 }; };
  assert.equal(f.page.navigationImpact().ordinary, true); f.close();
});

test('stale or mismatched post-write readback cannot claim success', async () => {
  const f = fixture(); await settle();
  f.config.save = async () => ({ revision: 8 });
  f.input('timezone', 'UTC'); f.submit(); await settle();
  assert.match(f.text(), /状态暂未核实/); assert.equal(f.page.navigationImpact().ordinary, true); f.close();
});

test('missing descriptors disables editing without fabricating theme choices', async () => {
  const f = fixture({ service: { current: async () => ({ revision: 1, fields: {} }) } }); await settle();
  assert.match(f.text(), /配置读取未完成/); assert.equal(f.container.querySelectorAll('select').length, 0); f.close();
});

test('unavailable mount makes no config calls and permits later manual fresh read', async () => {
  const f = fixture({ available: false }); await settle(); assert.deepEqual(f.calls, []);
  f.page.update({ ...f.context, available: true }); await settle();
  assert.deepEqual(f.calls, [], 'restoring a binding never resends a request');
  f.click('refresh'); await settle();
  assert.deepEqual(f.calls, [['current']]); f.close();
});

test('R5-I1: dirty-to-dirty edits and set/clear intent changes invalidate a confirmation key', async () => {
  const f = fixture(); await settle();
  f.input('timezone', 'UTC');
  const first = f.page.navigationImpact(), notifications = f.notifications;
  f.input('timezone', 'Europe/London');
  const second = f.page.navigationImpact();
  assert.equal(first.ordinary, true); assert.equal(second.ordinary, true);
  assert.ok(second.version > first.version); assert.ok(f.notifications > notifications);
  f.input('timezone', 'Europe/London');
  assert.equal(f.page.navigationImpact().version, second.version, 'identical input is not a new intent');
  f.input('reply_theme', '2');
  const beforeReset = f.page.navigationImpact().version;
  f.click('reset-reply_theme');
  assert.ok(f.page.navigationImpact().version > beforeReset, 'set -> clear must revoke an old choice');
  f.close();
});

for (const disposal of ['close', 'disposeScope']) {
  test(`R5-I2: normal ${disposal} preserves drafts across home and settings remount`, async () => {
    const original = fixture(); await settle();
    original.input('timezone', 'Europe/London'); original.input('reply_theme', '0');
    const context = original.context;
    original[disposal]();
    const home = fixture({ context, routeId: 'home' });
    assert.equal(home.page.navigationImpact().ordinary, false);
    assert.deepEqual(home.calls, [['invoke', 'status', {}]]); home.close();
    const returned = fixture({ context });
    assert.equal(returned.container.querySelector('input'), null, 'retained values need a fresh authorized snapshot');
    await settle();
    assert.deepEqual(returned.calls, [['current']]);
    assert.equal(returned.container.querySelector('[name=timezone]').value, 'Europe/London');
    assert.equal(returned.container.querySelector('[name=reply_theme]').value, '0');
    assert.equal(returned.page.navigationImpact().ordinary, true);
    assert.match(returned.text(), /草稿已保留/);
    returned.click('discard'); returned.close(); original.close();
  });
}

test('ordinary drafts never cross module owners', async () => {
  const dota = fixture(); await settle(); dota.input('timezone', 'UTC'); dota.input('reply_theme', '2'); dota.close();
  const steam = fixture({ moduleId: 'steam', context: { ...dota.context, owner: 'steam_dlc/steam' } }); await settle();
  assert.equal(steam.container.querySelector('[name=timezone]'), null);
  assert.equal(steam.container.querySelector('select').value, '1');
  assert.equal(steam.page.navigationImpact().ordinary, false); steam.close();
  const returned = fixture({ context: dota.context }); await settle();
  assert.equal(returned.container.querySelector('[name=timezone]').value, 'UTC');
  returned.click('discard'); returned.close();
});

for (const key of ['runtimeId', 'epoch', 'boundary']) {
  test(`new ${key} mount evicts the same owner's obsolete partition`, async () => {
    const original = fixture(); await settle(); original.input('timezone', 'UTC'); original.close();
    const next = fixture({ context: { ...original.context, [key]: key === 'epoch' ? 4 : 'new-binding' } }); await settle();
    assert.equal(next.container.querySelector('[name=timezone]').value, 'Asia/Shanghai');
    assert.equal(next.page.navigationImpact().ordinary, false); next.close();
    const obsolete = fixture({ context: original.context }); await settle();
    assert.equal(obsolete.container.querySelector('[name=timezone]').value, 'Asia/Shanghai');
    assert.equal(obsolete.page.navigationImpact().ordinary, false); obsolete.close();
  });
}

for (const key of ['owner', 'runtimeId', 'epoch', 'boundary']) {
  test(`observed ${key} revocation deletes retained draft before stale write resolves`, async () => {
    const original = fixture(); await settle(); original.input('timezone', 'UTC');
    const write = deferred(); original.config.save = () => write.promise; original.submit();
    original.page.update({ ...original.context, [key]: key === 'epoch' ? 4 : 'revoked' });
    assert.equal(original.page.navigationImpact().ordinary, false);
    write.resolve({ revision: 8 }); await settle(); original.close();
    const reopened = fixture({ context: original.context }); await settle();
    assert.equal(reopened.container.querySelector('[name=timezone]').value, 'Asia/Shanghai');
    assert.equal(reopened.page.navigationImpact().ordinary, false); reopened.close();
  });
}

test('an obsolete same-key mount cannot republish a draft after a newer mount takes ownership', async () => {
  const old = fixture(); await settle(); old.input('timezone', 'UTC');
  const read = deferred(); old.config.current = () => read.promise; old.click('refresh');
  const next = fixture({ context: old.context }); await settle();
  next.input('timezone', 'Europe/London'); next.close();
  read.resolve(snapshot()); await settle();
  old.input('timezone', 'Asia/Tokyo'); old.close();
  const returned = fixture({ context: old.context }); await settle();
  assert.equal(returned.container.querySelector('[name=timezone]').value, 'Europe/London');
  returned.click('discard'); returned.close();
});

for (const code of ['admin_authorization_denied', 'page_revoked', 'page_unavailable', 'stale_context']) {
  test(`exact ${code} clears retained ordinary drafts`, async () => {
    const original = fixture(); await settle(); original.input('timezone', 'UTC');
    original.config.current = async () => { throw Error(code); };
    original.click('refresh'); await settle();
    assert.equal(original.page.navigationImpact().ordinary, false);
    assert.match(original.text(), /授权或模块上下文已失效/); original.close();
    const reopened = fixture({ context: original.context }); await settle();
    assert.equal(reopened.container.querySelector('[name=timezone]').value, 'Asia/Shanghai');
    reopened.close();
  });
}

test('scope-only disposal cannot let its late response overwrite the retained draft', async () => {
  const original = fixture(); await settle(); original.input('timezone', 'UTC');
  const read = deferred(); original.config.current = () => read.promise; original.click('refresh');
  original.disposeScope(); read.resolve(snapshot()); await settle(); original.close();
  const returned = fixture({ context: original.context }); await settle();
  assert.equal(returned.container.querySelector('[name=timezone]').value, 'UTC');
  returned.click('discard'); returned.close();
});

test('saving and discarding clear the retained partition', async () => {
  for (const action of ['save', 'discard']) {
    const original = fixture(); await settle(); original.input('timezone', 'UTC');
    if (action === 'save') { original.submit(); await settle(); }
    else original.click('discard');
    original.close();
    const returned = fixture({ context: original.context }); await settle();
    assert.equal(returned.page.navigationImpact().ordinary, false);
    assert.equal(returned.container.querySelector('[name=timezone]').value, 'Asia/Shanghai'); returned.close();
  }
});

test('bounded owner partitions replace obsolete identities without evicting other known owners', async () => {
  const retained = [];
  for (const moduleId of ['steam', 'dota2', 'cs2', 'deadlock']) {
    const f = fixture({ moduleId }); await settle(); f.input('reply_theme', '2'); f.close(); retained.push(f);
  }
  for (const f of retained) {
    const reopened = fixture({ moduleId: f.context.owner.split('/')[1], context: f.context }); await settle();
    assert.equal(reopened.container.querySelector('select').value, '2'); reopened.close();
  }
  const original = retained[0];
  for (let epoch = 4; epoch < 20; epoch++) {
    const newer = fixture({ moduleId: 'steam', context: { ...original.context, epoch } }); await settle();
    assert.equal(newer.page.navigationImpact().ordinary, false);
    newer.input('reply_theme', '2'); newer.close();
  }
  const old = fixture({ moduleId: 'steam', context: original.context }); await settle();
  assert.equal(old.page.navigationImpact().ordinary, false); old.close();
  for (const f of retained.slice(1)) {
    const reopened = fixture({ moduleId: f.context.owner.split('/')[1], context: f.context }); await settle();
    assert.equal(reopened.container.querySelector('select').value, '2'); reopened.click('discard'); reopened.close();
  }
});

test('oversized ordinary input and oversized partition keys are never retained', async () => {
  const oversizedValue = fixture(); await settle(); oversizedValue.input('timezone', 'x'.repeat(257));
  assert.match(oversizedValue.text(), /草稿保留上限/); oversizedValue.close();
  const valueReturn = fixture({ context: oversizedValue.context }); await settle();
  assert.equal(valueReturn.page.navigationImpact().ordinary, false); valueReturn.close();
  const oversizedKey = fixture({ context: { boundary: 'x'.repeat(4097) } }); await settle();
  oversizedKey.input('timezone', 'UTC'); assert.match(oversizedKey.text(), /草稿保留上限/); oversizedKey.close();
  const keyReturn = fixture({ context: oversizedKey.context }); await settle();
  assert.equal(keyReturn.page.navigationImpact().ordinary, false); keyReturn.close();
});

test('an unknown write result survives route disposal without automatic resend', async () => {
  const original = fixture(); await settle(); original.input('timezone', 'UTC');
  let attempts = 0;
  original.config.save = async () => { attempts++; throw Error('unknown'); };
  original.submit(); await settle(); original.close();
  const returned = fixture({ context: original.context }); await settle();
  assert.equal(returned.container.querySelector('[name=timezone]').value, 'UTC');
  assert.equal(returned.page.navigationImpact().ordinary, true);
  assert.deepEqual(returned.calls, [['current']]); assert.equal(attempts, 1);
  returned.click('discard'); returned.close();
});

test('exact authorization failure during save revokes cached intent', async () => {
  const original = fixture(); await settle(); original.input('timezone', 'UTC');
  original.config.save = async () => { throw Error('admin_authorization_denied'); };
  original.submit(); await settle();
  assert.equal(original.page.navigationImpact().ordinary, false);
  assert.match(original.text(), /授权或模块上下文已失效/); original.close();
  const returned = fixture({ context: original.context }); await settle();
  assert.equal(returned.page.navigationImpact().ordinary, false); returned.close();
});

test('Steam poster settings save boolean and integer values with their JSON types', async () => {
  const f = fixture({ moduleId: 'steam' }); await settle();
  f.input('poster_include_apps', '1'); f.input('poster_limit', '64');
  f.submit(); await settle();
  const save = f.calls.find(call => call[0] === 'save');
  assert.deepEqual(save, ['save', 7, { poster_include_apps: true, poster_limit: 64 }]);
  assert.equal(typeof save[2].poster_include_apps, 'boolean');
  assert.equal(typeof save[2].poster_limit, 'number');
  f.close();
});

test('invalid Steam poster limit remains visible, retained, and blocks saving', async () => {
  const f = fixture({ moduleId: 'steam' }); await settle();
  f.input('poster_limit', '201'); f.submit(); await settle();
  assert.equal(f.container.querySelector('[name=poster_limit]').value, '201');
  assert.match(f.text(), /1 到 200 之间的整数/);
  assert.equal(f.calls.some(call => call[0] === 'save'), false);
  const context = f.context; f.close();
  const reopened = fixture({ moduleId: 'steam', context }); await settle();
  assert.equal(reopened.container.querySelector('[name=poster_limit]').value, '201');
  assert.equal(reopened.page.navigationImpact().ordinary, true);
  reopened.close();
});

test('standard boolean schema loads, retains through remount, and saves as a boolean', async () => {
  const f = fixture({ moduleId: 'steam' }); await settle();
  const context = f.context;
  f.input('poster_include_apps', '1');
  assert.equal(f.container.querySelector('[name=poster_include_apps] option:checked').textContent, '全部应用');
  f.close();
  const reopened = fixture({ moduleId: 'steam', context }); await settle();
  assert.equal(reopened.container.querySelector('[name=poster_include_apps] option:checked').textContent, '全部应用');
  assert.equal(reopened.page.navigationImpact().ordinary, true);
  reopened.submit(); await settle();
  const save = reopened.calls.find(call => call[0] === 'save');
  assert.deepEqual(save, ['save', 7, { poster_include_apps: true }]);
  assert.equal(typeof save[2].poster_include_apps, 'boolean');
  reopened.close();
});

test('Steam cache refresh failure is readable and retry succeeds without claiming poster fetch', async () => {
  let attempts = 0;
  const f = fixture({ moduleId: 'steam', routeId: 'home', invoke: async () => {
    if (++attempts === 1) throw Error('private internal detail');
    return cacheResponse();
  } }); await settle();
  assert.match(f.text(), /缓存状态暂不可用/);
  assert.doesNotMatch(f.text(), /private internal detail/);
  f.click('refresh-cache'); await settle();
  assert.match(f.text(), /7 项 \/ 12345 字节/);
  assert.match(f.text(), /此操作只读取统计/);
  assert.equal(attempts, 2); f.close();
});

test('Steam cache projection rejects private, wrong-schema, malformed-count, and nested envelopes', async () => {
  const valid = { bytes: 12345, items: 7, max_bytes: 8000000, max_items: 32, evictions: 2 };
  const invalid = [
    { ...cacheResponse(), privacy: 'private' },
    { ...cacheResponse(), schema_version: 2 },
    cacheResponse({ ...valid, bytes: -1 }),
    cacheResponse({ ...valid, items: 1.5 }),
    cacheResponse({ ...valid, max_items: Number.MAX_SAFE_INTEGER + 1 }),
    { data: cacheResponse() },
  ];
  for (const response of invalid) {
    const f = fixture({ moduleId: 'steam', routeId: 'home', invoke: async () => response });
    await settle();
    assert.match(f.text(), /缓存状态暂不可用/);
    assert.doesNotMatch(f.text(), /12345 字节/);
    f.close();
  }
});

test('stale Steam cache response cannot update the home page after epoch change', async () => {
  const read = deferred();
  const f = fixture({ moduleId: 'steam', routeId: 'home', invoke: () => read.promise });
  f.page.update({ ...f.context, epoch: 4 });
  read.resolve(cacheResponse()); await settle();
  assert.doesNotMatch(f.text(), /7 项 \/ 12345 字节/);
  assert.equal(f.page.navigationImpact().pending, false);
  f.close();
});

function addSetting(value, name, initial, schema) {
  value.fields[name] = {value: initial, state: 'valid', present: false, source: 'default'};
  value.descriptors[name] = {description: `设置 ${name}`, default: initial, value_schema: schema};
}
function credentialMock(fields) {
  let page;
  const configured = Object.fromEntries(fields.map(field => [field, false]));
  const calls = [];
  const services = {
    async status() {
      return {revision: page?.state.revision || 7, fields: Object.fromEntries(fields.map(field => [field, {configured: configured[field], decryptable: true, upstream: 'unverified'}]))};
    },
    async replace(revision, field, pair) {
      calls.push(['replace', revision, field, clone(pair)]); assert.equal(revision, page.state.revision);
      configured[field] = true; return {revision: ++page.state.revision};
    },
    async clear(revision, field) {
      calls.push(['clear', revision, field]); assert.equal(revision, page.state.revision);
      configured[field] = false; return {revision: ++page.state.revision};
    },
  };
  return {services, calls, configured, bind(value) {page = value;}};
}

test('new Steam settings use frozen enums and keep the old include-apps false value', async () => {
  const state = snapshot('steam');
  state.descriptors.poster_limit.value_schema.maximum = 1000;
  for (const [name, value, choices] of [
    ['poster_source', 'games', ['games', 'recent', 'full']], ['poster_mode', 'dense', ['dense', 'legacy']],
    ['poster_preset', 'standard', ['single', 'standard', 'long']], ['poster_aspect', '2:3', ['2:3', '9:16', '1:2']],
    ['poster_quality', 'normal', ['normal', 'hd']], ['poster_fit', 'cover', ['cover', 'contain']],
  ]) addSetting(state, name, value, {type: 'string', enum: choices});
  const f = fixture({moduleId: 'steam', initialState: state}); await settle();
  assert.equal(f.container.querySelector('[name=poster_include_apps]').value, '0');
  f.input('poster_preset', '2'); f.input('poster_aspect', '1'); f.input('poster_limit', '500'); f.submit(); await settle();
  assert.deepEqual(f.calls.find(call => call[0] === 'save')[2], {poster_preset: 'long', poster_aspect: '9:16', poster_limit: 500});
  assert.equal(f.state.fields.poster_source.value, 'games', 'never silently enables full library');
  f.input('poster_mode', '1'); f.submit(); await settle();
  assert.match(f.text(), /兼容旧布局最多支持 200/);
  assert.equal(f.calls.filter(call => call[0] === 'save').length, 1);
  f.close();
});

test('Dota budget rejects zero, empty restores default, and subscription toggles keep JSON booleans', async () => {
  const state = snapshot('dota2');
  addSetting(state, 'subscription_enabled', true, {type: 'boolean'});
  addSetting(state, 'commentary_enabled', false, {type: 'boolean'});
  addSetting(state, 'poll_interval_seconds', 300, {type: 'integer', minimum: 60, maximum: 86400});
  addSetting(state, 'opendota_rph', 100, {type: 'integer', minimum: 1, maximum: 100000});
  state.fields.opendota_rph = {value: 120, state: 'valid', present: true, source: 'sqlite'};
  const f = fixture({initialState: state}); await settle();
  f.input('opendota_rph', '0'); f.submit(); await settle();
  assert.equal(f.calls.filter(call => call[0] === 'save').length, 0);
  f.input('opendota_rph', ''); f.input('commentary_enabled', '1'); f.submit(); await settle();
  assert.deepEqual(f.calls.filter(call => ['save', 'clear'].includes(call[0])), [
    ['save', 7, {commentary_enabled: true}], ['clear', 8, ['opendota_rph']],
  ]);
  assert.equal(f.state.fields.opendota_rph.value, 100);
  f.close();
});

test('credential draft is ephemeral, submits with latest shared CAS and never enters ordinary config', async () => {
  const mock = credentialMock(['credential_steam_key']);
  const f = fixture({moduleId: 'steam', credentials: mock.services}); mock.bind(f); await settle();
  const password = f.container.querySelector('[name=credential_steam_key]');
  assert.equal(password.type, 'password');
  f.input('credential_steam_key', 'synthetic-private-key');
  assert.equal(f.page.navigationImpact().credentials, true);
  assert.equal(f.page.navigationImpact().ordinary, false);
  f.click('replace-credential_steam_key');
  assert.equal(password.value, '', 'erase DOM input before waiting for a service reply');
  await settle();
  assert.deepEqual(mock.calls, [['replace', 7, 'credential_steam_key', {token: 'synthetic-private-key'}]]);
  assert.doesNotMatch(f.text(), /synthetic-private-key/);
  f.input('poster_limit', '64'); f.submit(); await settle();
  f.click('clear-credential_steam_key'); await settle();
  assert.deepEqual(mock.calls[1], ['clear', 9, 'credential_steam_key']);
  assert.equal(f.calls.filter(call => call[0] === 'save').length, 1);
  assert.equal(f.page.navigationImpact().credentials, false);
  f.close();
});

test('unknown credential writes clear input, show no arbitrary error and require refresh before retry', async () => {
  const mock = credentialMock(['credential_fivee']); let writes = 0;
  mock.services.replace = async () => {writes++; throw Error('server echoed synthetic-private-token');};
  const f = fixture({moduleId: 'cs2', credentials: mock.services}); mock.bind(f); await settle();
  f.input('credential_fivee', 'synthetic-private-token'); f.click('replace-credential_fivee'); await settle();
  assert.equal(f.container.querySelector('[name=credential_fivee]').value, '');
  assert.doesNotMatch(f.text(), /synthetic-private-token/);
  assert.match(f.text(), /刷新并核对/);
  f.input('credential_fivee', 'second-token'); f.click('replace-credential_fivee'); await settle();
  assert.equal(writes, 1);
  f.click('refresh'); await settle();
  assert.equal(f.container.querySelector('[name=credential_fivee]').value, '');
  f.close();
});

test('credential input survives presentation updates but is erased on disposal and never retained on remount', async () => {
  const mock = credentialMock(['credential_opendota_key']);
  const f = fixture({credentials: mock.services}); mock.bind(f); await settle();
  const password = f.container.querySelector('[name=credential_opendota_key]');
  f.input('credential_opendota_key', 'ephemeral-token'); password.focus();
  f.page.update({...f.context, theme: 'dark'}); await settle();
  assert.equal(password.value, 'ephemeral-token'); assert.equal(f.dom.window.document.activeElement, password);
  const context = {...f.context}; f.close(); assert.equal(password.value, '');
  const reopened = fixture({credentials: mock.services, context}); mock.bind(reopened); await settle();
  assert.equal(reopened.container.querySelector('[name=credential_opendota_key]').value, '');
  reopened.close();
});

test('scope abort immediately erases credential DOM input and stops the mounted controller', async () => {
  const mock = credentialMock(['credential_fivee']);
  const f = fixture({moduleId: 'cs2', credentials: mock.services}); mock.bind(f); await settle();
  const input = f.container.querySelector('[name=credential_fivee]');
  f.input('credential_fivee', 'abort-private-token'); f.abort();
  assert.equal(input.value, ''); assert.equal(f.page.navigationImpact().credentials, false);
  assert.equal(f.container.querySelector('[name=credential_fivee]'), null);
  f.close();
});

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAX+XDSwAAAABJRU5ErkJggg==';
function authSession(state = 'waiting') {
  return {session_id: 'synthetic-session', state, expires_at: Date.now() / 1000 + 60, next_poll_at: Date.now() / 1000 + 30, polls: 0, authorized_subject: state === 'authorized' ? '76561197960265851' : null};
}
test('CS2 QR requests are sequential, successful capture refreshes CAS and exposes only PNG/subject state', async () => {
  const mock = credentialMock(['credential_perfect', 'credential_fivee']); let f;
  mock.services.authorize = async (revision, flow, step, session) => {
    mock.calls.push([revision, flow, step, session]);
    if (step === 'qr') return {qr_png: PNG};
    if (step === 'poll') {
      mock.configured.credential_perfect = true;
      return {session: authSession('authorized'), receipt: {revision: ++f.state.revision}};
    }
    return {session: authSession(), receipt: null};
  };
  f = fixture({moduleId: 'cs2', credentials: mock.services}); mock.bind(f); await settle();
  f.click('perfect-begin'); await settle();
  assert.deepEqual(mock.calls, [[7, 'perfect_qr', 'begin', ''], [7, 'perfect_qr', 'qr', 'synthetic-session']]);
  assert.ok(f.container.querySelector('.steam-dlc-qr').src.startsWith('data:image/png;base64,'));
  assert.equal(f.page.navigationImpact().credentials, true);
  f.click('perfect-poll'); await settle();
  assert.equal(f.page.navigationImpact().credentials, false);
  assert.match(f.text(), /完美授权已保存/);
  assert.equal(f.container.querySelector('.steam-dlc-qr').hasAttribute('src'), false);
  assert.doesNotMatch(f.text(), /accessToken|private-final-token/);
  f.close();
});

test('cancel during an in-flight poll queues cancellation and stale QR responses cannot survive disposal', async () => {
  const mock = credentialMock(['credential_perfect']); const poll = deferred();
  mock.services.authorize = async (revision, flow, step) => {
    mock.calls.push(step);
    return step === 'qr' ? {qr_png: PNG} : step === 'poll' ? poll.promise : {session: authSession(step === 'cancel' ? 'cancelled' : 'waiting'), receipt: null};
  };
  const f = fixture({moduleId: 'cs2', credentials: mock.services}); mock.bind(f); await settle();
  f.click('perfect-begin'); await settle(); f.click('perfect-poll'); await settle();
  f.click('perfect-cancel'); await settle();
  assert.equal(f.container.querySelector('.steam-dlc-qr').hasAttribute('src'), false);
  poll.resolve({session: authSession(), receipt: null}); await settle();
  assert.deepEqual(mock.calls, ['begin', 'qr', 'poll', 'cancel']);
  assert.match(f.text(), /扫码已取消/); f.close();

  const late = deferred(); mock.services.authorize = async (revision, flow, step) => step === 'qr' ? late.promise : {session: authSession(), receipt: null};
  const other = fixture({moduleId: 'cs2', credentials: mock.services}); mock.bind(other); await settle();
  other.click('perfect-begin'); await settle();
  const image = other.container.querySelector('.steam-dlc-qr'); other.close();
  late.resolve({qr_png: PNG}); await settle(); assert.equal(image.hasAttribute('src'), false);
});

test('real revoke DTO clears QR/session and confirms the atomic CAS receipt before reporting success', async () => {
  const mock = credentialMock(['credential_perfect']); let f;
  mock.configured.credential_perfect = true;
  mock.services.authorize = async (revision, flow, step, session) => {
    mock.calls.push([revision, flow, step, session]);
    if (step === 'qr') return {qr_png: PNG};
    if (step === 'revoke') {
      assert.equal(revision, f.state.revision); mock.configured.credential_perfect = false;
      return {revoked: true, receipt: {revision: ++f.state.revision}};
    }
    return {session: authSession(), receipt: null};
  };
  f = fixture({moduleId: 'cs2', credentials: mock.services}); mock.bind(f); await settle();
  f.click('perfect-begin'); await settle();
  assert.equal(f.container.querySelector('.steam-dlc-qr').hasAttribute('src'), true);
  f.click('perfect-revoke'); await settle();
  assert.match(f.text(), /完美授权已撤销/); assert.doesNotMatch(f.text(), /结果未确认/);
  assert.equal(f.container.querySelector('.steam-dlc-qr').hasAttribute('src'), false);
  assert.equal(f.page.navigationImpact().credentials, false);
  assert.equal(f.page.navigationImpact().pending, false);
  assert.equal(f.state.revision, 8); assert.equal(mock.configured.credential_perfect, false);
  assert.deepEqual(mock.calls.at(-1), [7, 'perfect_qr', 'revoke', 'synthetic-session']);
  f.close();
});

test('revoke refuses malformed/failed/stale/unverified receipts and never turns them into success', async () => {
  for (const response of [
    {revoked: false, receipt: {revision: 8}}, {revoked: true, receipt: null},
    {revoked: true, receipt: {revision: 7}}, {session: null, receipt: {revision: 8}},
    {revoked: true, receipt: {revision: 8}, unexpected: true},
    {revoked: true, receipt: {revision: 8}},
  ]) {
    const mock = credentialMock(['credential_perfect']); let f;
    mock.configured.credential_perfect = true;
    mock.services.authorize = async () => {f.state.revision = 8; return response;};
    f = fixture({moduleId: 'cs2', credentials: mock.services}); mock.bind(f); await settle();
    f.click('perfect-revoke'); await settle();
    assert.doesNotMatch(f.text(), /完美授权已撤销/); assert.match(f.text(), /结果未确认/);
    assert.equal(mock.configured.credential_perfect, true);
    assert.equal(f.page.navigationImpact().pending, false); f.close();
  }
});

test('public CS2 query uses the single page capability with explicit account and separates 5E domain', async () => {
  const f = fixture({moduleId: 'cs2', routeId: 'query', invoke: async () => cacheResponse()}); await settle();
  assert.deepEqual(f.calls[0], ['invoke', 'query', {}]);
  f.input('account', 'synthetic-domain'); f.input('platform', '5e'); f.input('action', 'match');
  f.input('match_id', 'fivee-10001'); f.submit(); await settle();
  assert.deepEqual(f.calls[1], ['invoke', 'query', {account: 'synthetic-domain', action: 'match', platform: '5e', match_id: 'fivee-10001'}]);
  assert.doesNotMatch(f.text(), /留存政策限制/); f.close();
});

function jobFixture(options = {}) {
  const submissions = [], changes = [];
  const view = {job_id: 'job-1', revision: 1, status: 'succeeded', progress: {}, summary: {selected: 1500, generated: 1500, pending: 0, complete_source: false}, handler_id: 'steam_wall'};
  const jobs = {
    async submit(request) {submissions.push(clone(request)); return clone(view);},
    async status() {return clone(view);},
    async result() {return {job: clone(view), entries: [{resource: {asset_id: 'image-1', media_type: 'image/png'}, metadata: {batch_index: 0}}], next_cursor: null};},
    async resource() {return new Blob([Buffer.from(PNG, 'base64')], {type: 'image/png'});},
    async cancel(id, revision) {changes.push(['cancel', id, revision]); return {...view, status: 'cancelled', revision: revision + 1};},
    async retry(id, revision) {changes.push(['retry', id, revision]); return {...view, status: 'queued', revision: revision + 1};},
    ...options.jobs,
  };
  const f = fixture({moduleId: 'steam', routeId: 'collage', ...options, jobs});
  const created = [], revoked = [];
  f.dom.window.URL.createObjectURL = blob => {created.push(blob); return `blob:job-${created.length}`;};
  f.dom.window.URL.revokeObjectURL = value => revoked.push(value);
  return {...f, submissions, changes, created, revoked, jobs, view};
}

test('Steam durable job validates legacy then publishes exact PNG and revokes preview on close', async () => {
  const f = jobFixture();
  try {
    f.input('account', '123'); f.input('mode', 'legacy'); f.submit(); await settle();
    assert.equal(f.submissions.length, 0); assert.match(f.text(), /兼容旧布局最多200/);
    f.input('mode', 'dense'); f.input('limit', '1500.9'); f.submit(); await settle(); await settle();
    assert.equal(f.submissions.length, 1); assert.equal(f.submissions[0].parameters.limit, 1500);
    assert.equal(f.submissions[0].parameters.account, '76561197960265851');
    assert.equal(f.created[0].size, Buffer.from(PNG, 'base64').length);
    assert.match(f.text(), /来源覆盖不完整/); assert.equal(f.container.querySelector('a[download]').getAttribute('href'), 'blob:job-1');
    assert.equal(f.dom.window.sessionStorage.getItem('ygl:job:steam_dlc/steam:collage'), 'job-1');
  } finally {f.close();}
  assert.deepEqual(f.revoked, ['blob:job-1']); assert.equal(f.changes.length, 0, 'closing never cancels work');
});

test('Steam job distinguishes unverified classification from a verified empty selection', async () => {
  const f = jobFixture({jobs: {async result() {return {entries: [], next_cursor: null};}}});
  try {
    f.view.status = 'failed'; f.view.summary = {};
    f.view.progress = {reason: 'metadata_incomplete', source_returned: 20, metadata_unexamined: 20, selected: null, pending: null, counters: {metadata_failed: 1}};
    f.input('account', '123'); f.submit(); await settle(); await settle();
    assert.match(f.text(), /未视为空库/); assert.match(f.text(), /类型尚未验证20项/);
    assert.match(f.text(), /元数据请求失败1次/); assert.match(f.text(), /已选待确认/);
    assert.equal(f.container.querySelector('[data-action="job-retry"]').disabled, false);
  } finally {f.close();}
});

test('Steam all-app output shows classification coverage separately from library coverage', async () => {
  const f = jobFixture();
  try {
    Object.assign(f.view.summary, {selected: 20, generated: 20, complete_source: true, classification_complete: false, metadata_unexamined: 20, metadata_failures: 1});
    f.input('account', '123'); f.submit(); await settle(); await settle();
    assert.match(f.text(), /已按全部应用设置入图/); assert.match(f.text(), /元数据请求失败1次/);
    assert.doesNotMatch(f.text(), /来源覆盖不完整/);
  } finally {f.close();}
});

test('Steam shortcuts keep finite1000 distinct from all and reject malformed decimals', async () => {
  const f = jobFixture({jobs: {async result() {return {entries: [], next_cursor: null};}}});
  try {
    f.input('account', '123');
    for (const value of ['1001', '1500.9', '2.5e3']) {f.input('limit', value); f.submit(); await settle();}
    assert.deepEqual(f.submissions.map(request => request.parameters.limit), [1001, 1500, 2500]);
    for (const value of ['', '19.99', '20abc', 'NaN', 'Infinity', '9007199254740992']) {f.input('limit', value); f.submit(); await settle();}
    assert.equal(f.submissions.length, 3);
    f.click('limit-1000'); f.submit(); await settle(); assert.equal(f.submissions.at(-1).parameters.limit_mode, 'top');
    f.click('limit-all'); f.submit(); await settle(); assert.equal(f.submissions.at(-1).parameters.limit_mode, 'all');
    assert.equal(f.submissions.at(-1).parameters.limit, 500);
    assert.ok(f.submissions.every(request => request.handler_id === 'steam_wall' && typeof request.idempotency_key === 'string'));
  } finally {f.close();}
});

test('Steam job cursor paginates results and cancellation uses exact current revision', async () => {
  let page = 0;
  const f = jobFixture({jobs: {
    async status() {return {job_id: 'job-1', revision: 7, status: 'running'};},
    async result(id, options) {page++; assert.equal(options.page_size, 20); return {entries: [], next_cursor: page === 1 ? 'cursor-2' : null};},
  }});
  try {
    f.input('account', '123'); f.submit(); await settle();
    f.click('job-results'); await settle(); f.click('job-next'); await settle(); assert.equal(page, 2);
    f.click('job-cancel'); await settle(); assert.deepEqual(f.changes[0], ['cancel', 'job-1', 7]);
  } finally {f.close();}
});

function cs2Response(platform, data, {kind = 'match', detail = 'player_summary'} = {}) {
  const response = cacheResponse();
  response.document.blocks = [
    {kind: 'text', text: '来源保留的战报说明。'},
    {kind: 'fields', fields: {cs2: {
      schema_version: 'cs2.platform.v1', provider: platform === '5e' ? '5eplay' : 'perfect_world', platform, kind,
      target: {id_type: platform === '5e' ? 'fivee_domain' : 'steam_id64', id: platform === '5e' ? 'example-domain' : '76561197960265851'},
      season: null, fetched_at: '2026-10-24T00:00:00Z',
      coverage: detail === 'full_match' ? 'platform_recorded' : 'recent_player_summary',
      detail_level: detail, unavailable_reason: detail === 'full_match' ? null : 'full_match_detail_unavailable', data,
    }}},
  ];
  return response;
}

test('CS2 full match and last display scores, focus KDA/rating and the actual player roster', async () => {
  const focus = {account_id: '76561197960265851', nickname: '焦点选手', team: 1, kills: 23, deaths: 10, assists: 7, rating: 1.6, pw_rating: 1.7, adr: 88};
  const other = {account_id: '76561197960265852', nickname: '<img src=x onerror=alert(1)>', team: 2, kills: 0, deaths: 13, assists: null, rating: null};
  for (const action of ['match', 'last']) {
    const f = fixture({moduleId: 'cs2', routeId: 'query', invoke: async (_id, parameters) => parameters.action ? cs2Response('perfect', {match_id: 'PVP@10001', map: 'de_mirage', scores: [13, 5], players: [focus, other], focus}, {detail: 'full_match'}) : cacheResponse()});
    await settle(); f.input('account', focus.account_id); f.input('action', action);
    if (action === 'match') { f.input('match_id', 'PVP@10001'); f.input('focus', focus.account_id); }
    f.submit(); await settle();
    const output = f.container.querySelector('.steam-dlc-public-result');
    assert.match(output.textContent, /比分：13 : 5/); assert.match(output.textContent, /K\/D\/A：23\/10\/7 · rating：1.6/);
    assert.match(output.textContent, /完整比赛/); assert.match(output.textContent, /2026-10-24T00:00:00Z/);
    assert.match(output.textContent, /焦点选手/); assert.match(output.textContent, /76561197960265852/);
    assert.match(output.textContent, /0\/13\/未知/); assert.match(output.textContent, /未知表示来源未提供/);
    assert.equal(output.querySelectorAll('table tr').length, 3); assert.equal(output.querySelector('img'), null);
    f.close();
  }
});

for (const platform of ['official', '5e']) {
  test(`CS2 ${platform} summary displays known scores/KDA, unknown rating and its bounded coverage`, async () => {
    const response = cs2Response(platform, {match_id: 'summary-10001', map: null, scores: [0, null], kills: 7, deaths: 0, assists: null, rating: null, players: null, focus: {id: platform === '5e' ? 'example-domain' : '76561197960265851'}});
    const f = fixture({moduleId: 'cs2', routeId: 'query', invoke: async (_id, parameters) => parameters.action ? response : cacheResponse()});
    await settle(); f.input('account', response.document.blocks[1].fields.cs2.target.id); f.input('platform', platform); f.input('action', 'match'); f.input('match_id', 'summary-10001'); f.submit(); await settle();
    const output = f.container.querySelector('.steam-dlc-public-result');
    assert.match(output.textContent, /比分：0 : 未知/); assert.match(output.textContent, /K\/D\/A：7\/0\/未知 · rating：未知/);
    assert.match(output.textContent, /有界近期玩家摘要/); assert.match(output.textContent, /不含完整比赛名单与详情/);
    assert.equal(output.querySelector('table'), null); assert.doesNotMatch(output.textContent, /undefined|NaN|null/);
    f.close();
  });
}

test('CS2 empty full roster and empty recent list remain explicit source states with unknown fields', async () => {
  for (const kind of ['match', 'recent']) {
    const response = cs2Response('perfect', kind === 'match' ? {match_id: 'PVP@empty', map: null, scores: [null, null], players: [], focus: null} : {matches: [], available_matches: 0, limit: 5}, {kind, detail: kind === 'match' ? 'full_match' : 'player_summary'});
    const f = fixture({moduleId: 'cs2', routeId: 'query', invoke: async (_id, parameters) => parameters.action ? response : cacheResponse()});
    await settle(); f.input('account', '76561197960265851'); f.input('action', kind);
    if (kind === 'match') f.input('match_id', 'PVP@empty');
    f.submit(); await settle();
    const output = f.container.querySelector('.steam-dlc-public-result');
    assert.match(output.textContent, kind === 'match' ? /来源未提供可用玩家名单/ : /来源当前样本没有可展示的比赛/);
    if (kind === 'match') assert.match(output.textContent, /比分：未知 : 未知/);
    assert.match(output.textContent, /来源保留的战报说明/); assert.equal(output.querySelector('table'), null);
    assert.doesNotMatch(f.text(), /未取得可确认结果/); f.close();
  }
});

test('Steam corrupt PNG resource cannot become a download or claimed success', async () => {
  const corrupt = Buffer.from(PNG, 'base64'); corrupt[45] ^= 1;
  const f = jobFixture({jobs: {async resource() {return new Blob([corrupt], {type: 'image/png'});}}});
  try {f.input('account', '123'); f.submit(); await settle(); await settle(); assert.equal(f.container.querySelector('a[download]'), null); assert.equal(f.created.length, 0);}
  finally {f.close();}
});

test('Steam late job result is fenced after context revocation and never cancels work', async () => {
  const late = deferred();
  const f = jobFixture({jobs: {status: () => late.promise}});
  try {
    f.input('account', '123'); f.submit(); await settle();
    f.page.update({...f.context, available: false}); const before = f.container.innerHTML;
    late.resolve({...f.view, summary: {generated: 9999}}); await settle();
    assert.equal(f.container.innerHTML, before); assert.equal(f.created.length, 0); assert.equal(f.changes.length, 0);
  } finally {f.close();}
});

test('Dota ordinary configuration remains editable when independent credential status fails', async () => {
  const f = fixture({credentials: {async status() {throw Error('private upstream detail');}}});
  try {await settle(); assert.match(f.text(), /普通配置已读取/); assert.doesNotMatch(f.text(), /配置读取未完成|private upstream detail/); f.input('timezone', 'UTC'); f.submit(); await settle(); assert.ok(f.calls.some(call => call[0] === 'save'));}
  finally {f.close();}
});

test('actual Dota six-field snapshot with integer enum mounts a select and saves numeric CAS value', async () => {
  const state = snapshot('dota2');
  addSetting(state, 'subscription_enabled', true, {type: 'boolean'});
  addSetting(state, 'commentary_enabled', false, {type: 'boolean'});
  addSetting(state, 'poll_interval_seconds', 300, {type: 'integer', enum: [60, 300, 900, 3600, 21600, 43200, 86400]});
  addSetting(state, 'opendota_rph', 100, {type: 'integer', minimum: 1, maximum: 1000000});
  const f = fixture({initialState: state});
  try {
    await settle();
    assert.doesNotMatch(f.text(), /配置读取未完成/);
    const control = f.container.querySelector('[name=poll_interval_seconds]');
    assert.equal(control.tagName, 'SELECT'); assert.equal(control.options.length, 7);
    const label = f.container.querySelector(`label[for="${control.id}"]`); assert.ok(label);
    assert.equal(control.getAttribute('aria-labelledby'), label.id);
    f.input('poll_interval_seconds', '2'); f.submit(); await settle();
    assert.deepEqual(f.calls.find(call => call[0] === 'save')[2], {poll_interval_seconds: 900});
  } finally {f.close();}
});

test('wishlist page requests explicit account and twenty-item local pages without whole-list enrichment', async () => {
  const f = fixture({moduleId: 'steam', routeId: 'wishlist', invoke: async (id, parameters) => {
    assert.equal(id, 'wishlist_explicit');
    return {...cacheResponse(), document: {blocks: [{kind: 'fields', fields: {wishlist: {
      page: parameters.page, pages: 2, total: 21, region: 'CN', fetched_at: '2026-01-01T00:00:00Z', state: 'available',
      items: [{app_id: parameters.page === 1 ? '123' : '456', name: 'Synthetic wishlist', date_added: 100, price_state: 'no_local_price', release_state: 'unreleased'}],
    }}}]}};
  }});
  try {
    f.submit(); await settle(); assert.equal(f.calls.length, 0);
    f.input('account', '123'); f.submit(); await settle();
    assert.equal(f.calls[0][2].page, 1); assert.match(f.text(), /第1\/2页|第1\/2/);
    assert.match(f.text(), /未发售/); assert.match(f.text(), /本地区未提供价格/);
    assert.equal(f.container.querySelector('a[target=_blank]').href, 'https://store.steampowered.com/app/123/');
    f.click('wishlist-next'); await settle(); assert.equal(f.calls[1][2].page, 2);
    f.page.update({...f.context, epoch: 4}); assert.doesNotMatch(f.text(), /Synthetic wishlist/);
  } finally {f.close();}
});

test('job transport failures never render raw exception messages', async () => {
  const f = jobFixture({jobs: {async submit() {throw Error('PRIVATE_BACKEND_DETAIL');}}});
  try {f.input('account', '123'); f.submit(); await settle(); assert.doesNotMatch(f.text(), /PRIVATE_BACKEND_DETAIL/); assert.match(f.text(), /任务操作未完成/);}
  finally {f.close();}
});

test('job previews are immediately revoked on owner boundary change', async () => {
  const f = jobFixture();
  try {
    f.input('account', '123'); f.submit(); await settle(); await settle();
    assert.equal(f.created.length, 1);
    f.page.update({...f.context, boundary: 'new-owner-boundary'});
    assert.deepEqual(f.revoked, ['blob:job-1']); assert.equal(f.container.querySelector('a[download]'), null);
    assert.equal(f.changes.length, 0);
  } finally {f.close();}
});

test('Dota analysis page shows focus, settlement-only completeness and missing sections without inventing values', async () => {
  const f = fixture({moduleId: 'dota2', routeId: 'analysis', invoke: async (id, parameters) => {
    assert.equal(id, 'analyze_explicit'); assert.deepEqual(parameters, {match_id: '12345', account: 'Focus', refresh: false});
    return {...cacheResponse(), status: 'partial_success', document: {blocks: [
      {kind: 'fields', fields: {'比赛ID': '12345', '焦点账号': '456', '焦点名称': 'Focus', '英雄ID': 1, '焦点胜负': 'win', '时长（秒）': 1000}},
      {kind: 'text', text: '团战与目标：来源未提供团战数据。'},
    ]}, model_facts: {data_completeness: 'settlement_only', focus: {account_id32: '456', name: 'Focus', hero_id: 1, kills: 0, deaths: 4, assists: null}, missing_sections: ['teamfights', 'purchases'], missing_fields: ['hero_damage'], truncated_sections: [], source: 'opendota', fetched_at: '2026-01-01T00:00:00Z'}};
  }});
  try {
    f.input('match_id', '12345'); f.input('account', 'Focus'); f.submit(); await settle();
    assert.match(f.text(), /仅基础结算/); assert.match(f.text(), /ID32 456/); assert.match(f.text(), /K\/D\/A 0\/4\/未知/);
    assert.match(f.text(), /teamfights、purchases/); assert.match(f.text(), /来源未提供团战数据/);
    assert.doesNotMatch(f.text(), /AI短评已生成|K\/D\/A 0\/4\/0/);
    f.page.update({...f.context, runtimeId: 'new-analysis-runtime'}); assert.doesNotMatch(f.text(), /ID32 456/);
  } finally {f.close();}
});

test('wishlist privacy, rate limit and failure remain distinct after Core sanitizes the message', async () => {
  for (const [code, expected] of [['not_public', /愿望单未公开或来源受限/], ['rate_limited', /愿望单来源限流/], ['upstream_error', /愿望单来源请求失败/]]) {
    const f = fixture({moduleId: 'steam', routeId: 'wishlist', invoke: async () => ({...cacheResponse(), status: 'error', error: {code, message: '查询未完成，请检查输入或稍后重试。'}})});
    try {f.input('account', '123'); f.submit(); await settle(); assert.match(f.text(), expected); assert.doesNotMatch(f.text(), /本次公开愿望单为空|共0项/);}
    finally {f.close();}
  }
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { mount, installDOM, runtime } from './source-build.mjs';

const clone = value => structuredClone(value);
const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
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
function fixture({ moduleId = 'dota2', routeId = 'settings', available = true, service = {}, invoke = async () => cacheResponse(), context: contextPatch = {} } = {}) {
  const dom = new JSDOM('<!doctype html><div id="root"></div>');
  installDOM(dom);
  const container = dom.window.document.querySelector('#root');
  const abort = new AbortController();
  let scopeCurrent = true, state = snapshot(moduleId), notifications = 0;
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
    services: { config, invoke(id, parameters) { calls.push(['invoke', id, clone(parameters)]); return invoke(id, parameters); }, credentials: new Proxy({}, { get() { assert.fail('credentials forbidden'); } }) },
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
  return { data: { schema_version: 1, status: 'success', privacy: 'public', document: {
    title: 'Steam 海报缓存', subject: 'Steam DLC', sources: [], timestamps: {},
    blocks: [{ kind: 'fields', fields: { cache: value } }],
  }, provenance: [], timestamps: {}, warnings: [], model_facts: null, error: null } };
}

for (const moduleId of ['steam', 'dota2', 'cs2', 'deadlock']) {
  test(`${moduleId} home has actual command help and availability`, async () => {
    const f = fixture({ moduleId, routeId: 'home' });
    assert.match(f.text(), new RegExp(`/ygl ${moduleId} `));
    assert.match(f.text(), /运行健康请在模块管理中查看/);
    if (moduleId === 'cs2') assert.match(f.text(), /生产游戏数据查询受来源留存政策限制，当前已阻止/);
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
    if (moduleId !== 'steam') assert.deepEqual(f.calls, []);
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
    assert.deepEqual(home.calls, []); home.close();
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

test('stale Steam cache response cannot update the home page after epoch change', async () => {
  const read = deferred();
  const f = fixture({ moduleId: 'steam', routeId: 'home', invoke: () => read.promise });
  f.page.update({ ...f.context, epoch: 4 });
  read.resolve(cacheResponse()); await settle();
  assert.doesNotMatch(f.text(), /7 项 \/ 12345 字节/);
  assert.equal(f.page.navigationImpact().pending, false);
  f.close();
});

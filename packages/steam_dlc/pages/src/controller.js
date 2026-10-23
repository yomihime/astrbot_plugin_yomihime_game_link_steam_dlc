// Configuration lifecycle controller shared as source by four independently
// captured page builds. Presentation components live in the public facade.
export const MODULES = Object.freeze({
  steam: {
    title: 'Steam',
    summary: '商店搜索、游戏详情与公开账号资料。共享关联由用户声明，不代表账号所有权验证。',
    source: '零 Key 路线使用 Steam 商店与公开 Community 页面。最近展示 3 款与最常玩 5 款是不同公开样本；完整游戏库增强需要部署者配置可选 Steam Key，当前未配置。',
    commands: [
      ['/ygl steam bind <Dota ID32、SteamID64 或 profiles URL>', '在私聊中关联当前用户的 Steam 账号。'],
      ['/ygl steam binding', '在私聊中查看当前用户关联。'],
      ['/ygl steam unbind', '在私聊中解除当前用户关联。'],
      ['/ygl steam search <游戏名或 AppID> [--country CC] [--language english]', '商店默认 CN / schinese；价格按本次地区、币种和来源时间展示，不代表历史最低价。'],
      ['/ygl steam app <AppID> [--country CC] [--language english]', '查看商店详情与当前可用价格；图片失败时保留文字结果。'],
      ['/ygl steam profile [账号]', '查看公开资料；昵称、头像、等级逐项标明可用性。'],
      ['/ygl steam recent [账号]', '查看主页最近展示的公开样本，不代表完整两周游戏列表。'],
      ['/ygl steam games [账号]', '查看来源可用的公开样本；完整游戏库增强需要可选 Steam Key。'],
      ['/ygl steam wall [账号] [--source games|recent|full] [--all-apps] [--limit 1..200] [--refresh]', '生成有界时长海报墙；默认排除软件等非游戏应用。公开样本与完整库明确分开。'],
      ['/ygl steam status', '查看使用说明。'],
    ],
  },
  dota2: {
    title: 'Dota2',
    summary: '近期战绩、样本统计、可读资料与个人战报已实现，使用 OpenDota 公开数据，不提交解析。',
    source: '数据来自 OpenDota 社区公开记录。样本统计按有效字段分别计算，未收录与缺失数据保持未知，不补零。',
    commands: [
      ['/ygl dota2 recent [账号] [--limit N]', '默认 5 场，最多 20 场；省略账号时使用当前用户的 Steam 关联。'],
      ['/ygl dota2 profile [账号]', '查看精简玩家资料；省略账号时使用当前用户的 Steam 关联。'],
      ['/ygl dota2 stats [账号] [--limit N]', '默认20场，范围1–20；显示实际有效样本、独立分母和本次英雄/模式分布。'],
      ['/ygl dota2 last [账号]', '查询该玩家上一场基础结算；省略账号时使用当前用户关联。'],
      ['/ygl dota2 match <match_id> [--account <账号>]', '指定账号查看个人焦点，无账号保持全场概览；不读取默认关联，不提交解析。'],
      ['/ygl dota2 status', '查看功能说明。'],
    ],
  },
  cs2: {
    title: 'CS2', summary: '状态与查询框架已接入。生产游戏数据查询受来源留存政策限制，当前已阻止。',
    source: 'Leetify 匿名接口已完成有限可行性检查；当前 Host 留存机制尚未满足来源政策，生产数据请求在 HTTP 前阻止。请勿将框架可用理解为已可查询。',
    commands: [['/ygl cs2 status', '查看当前功能范围。']],
  },
  deadlock: {
    title: 'Deadlock', summary: '玩家资料、近期样本、统计与单场焦点查询，数据来自 Deadlock API 社区已收录记录。',
    source: '默认使用最近 20 条已收录记录，不代表 Valve 官方实时完整历史。未收录、受保护、尚未解析与空结果分别报告；缺失段位不推断为最低段位或零 MMR。',
    commands: [
      ['/ygl deadlock profile [账号]', '查看来源已收录资料与最近可用排位记录。'],
      ['/ygl deadlock recent [账号] [--limit N]', '默认 20 条，范围 1–20；仅指来源已收录近期记录。'],
      ['/ygl deadlock stats [账号] [--limit N]', '默认 20 条，范围 1–20；按有效分母计算，缺失字段保持未知。'],
      ['/ygl deadlock last [账号]', '查看有界窗口最近有效记录，详情失败不暗换另一场。'],
      ['/ygl deadlock match <match_id> [--account <账号>]', '按明确账号精确匹配个人焦点，不读取默认关联。'],
      ['/ygl deadlock status', '查看功能与来源范围。'],
    ],
  },
});

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const identity = context => JSON.stringify([
  context.owner, context.runtimeId, context.epoch, context.boundary,
]);
const errorCode = error => typeof error?.message === 'string' ? error.message : '';
const authorityErrors = new Set(['admin_authorization_denied', 'page_revoked', 'page_unavailable', 'stale_context']);

// This module instance retains ONLY ordinary configuration intent. Each captured
// module entry has its own store; no snapshots, credentials, bindings, services
// or DOM references are retained. Identity changes evict the same owner's past
// partition. Caps also bound retained input if a caller bypasses native controls.
const ordinaryPartitions = new Map();
const MAX_PARTITIONS = 4;
const MAX_PARTITION_KEY_LENGTH = 4096;
const MAX_RETAINED_VALUE_LENGTH = 256;
function partitionFor(context, key, claim) {
  for (const [previousKey, partition] of ordinaryPartitions) {
    if (partition.owner === context.owner && previousKey !== key) ordinaryPartitions.delete(previousKey);
  }
  if (!claim || key.length > MAX_PARTITION_KEY_LENGTH) return null;
  const partition = ordinaryPartitions.get(key) || { owner: context.owner, drafts: new Map(), token: null };
  partition.token = Symbol('ordinary-draft-mount');
  ordinaryPartitions.delete(key);
  ordinaryPartitions.set(key, partition);
  while (ordinaryPartitions.size > MAX_PARTITIONS) ordinaryPartitions.delete(ordinaryPartitions.keys().next().value);
  return partition;
}

/** Controller behind the public facade; contains no Core implementation imports. */
export function mountController(container, options) {
  const document = container.ownerDocument;
  const initialIdentity = identity(options.context);
  const moduleId = options.context.owner.startsWith('steam_dlc/')
    ? options.context.owner.slice('steam_dlc/'.length) : '';
  const module = MODULES[moduleId];
  const partition = module ? partitionFor(options.context, initialIdentity, options.routeId === 'settings') : null;
  const partitionToken = partition?.token;
  let context = { ...options.context };
  let disposed = false, revoked = false, generation = 0;
  let pending = false, ready = false, baseline = null;
  let impactVersion = 0, lastImpact = '';
  let draftVersion = 0;
  let messageTimer = null;
  let unregister = () => {};
  const drafts = new Map(partition?.drafts);
  const controls = new Map();
  const listeners = [];
  const node = (tag, text, className) => {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    if (className) element.className = className;
    return element;
  };
  const listen = (element, name, handler) => {
    element.addEventListener(name, handler);
    listeners.push(() => element.removeEventListener(name, handler));
  };
  const root = node('section', undefined, 'steam-dlc-page');
  const availability = node('p', '', 'steam-dlc-hint');
  availability.setAttribute('role', 'status');
  const message = node('p', '', 'steam-dlc-message');
  message.setAttribute('role', 'status');
  message.setAttribute('aria-live', 'polite');
  root.append(availability);
  container.replaceChildren(root);
  const current = () => !disposed && !revoked && !options.scope.signal.aborted
    && options.scope.isCurrent() && identity(context) === initialIdentity
    && (!partition || (ordinaryPartitions.get(initialIdentity) === partition && partition.token === partitionToken));
  const active = () => current() && context.available;
  const impact = () => Object.freeze({
    ordinary: drafts.size > 0, credentials: false, pending, version: impactVersion,
  });
  const notify = () => {
    const next = JSON.stringify([drafts.size > 0, pending, draftVersion]);
    if (next !== lastImpact) {
      lastImpact = next;
      impactVersion += 1;
      options.onNavigationStateChange?.();
    }
  };
  const say = (text, tone = 'warning') => {
    if (messageTimer !== null) { clearTimeout(messageTimer); messageTimer = null; }
    message.textContent = text;
    message.dataset.tone = tone;
    if (text && tone === 'success') {
      messageTimer = setTimeout(() => {
        messageTimer = null;
        if (current()) message.textContent = '';
      }, 3500);
    }
  };
  const updateAvailability = () => {
    root.dataset.theme = context.theme;
    availability.textContent = !current()
      ? '页面上下文已失效，请重新进入本模块。'
      : context.available
        ? '当前页面入口可用。运行健康请在模块管理中查看；此处不检测上游服务。'
        : '当前页面入口不可用，请在模块管理中刷新状态后重新进入。';
  };

  let form, saveButton, refreshButton, discardButton;
  const retainDrafts = () => {
    if (!partition || !current()) return;
    partition.drafts = new Map([...drafts].filter(([name, draft]) => {
      const allowed = name === 'timezone' || name === 'reply_theme'
        || (moduleId === 'steam' && (name === 'poster_include_apps' || name === 'poster_limit'));
      const value = draft.rawValue ?? draft.value;
      return allowed && (draft.kind === 'clear' || (draft.kind === 'set'
        && ['string', 'boolean', 'number'].includes(typeof value)
        && !(typeof value === 'number' && !Number.isFinite(value))
        && !(typeof value === 'string' && value.length > MAX_RETAINED_VALUE_LENGTH)));
    }));
  };
  const revokePartition = () => {
    if (partition ? ordinaryPartitions.get(initialIdentity) === partition && partition.token === partitionToken : options.routeId === 'home') {
      ordinaryPartitions.delete(initialIdentity);
    }
    revoked = true; generation += 1; pending = false; ready = false;
    if (drafts.size) draftVersion += 1;
    drafts.clear(); baseline = null;
    for (const { control } of controls.values()) control.value = '';
  };
  const sync = () => {
    retainDrafts();
    updateAvailability();
    root.setAttribute('aria-busy', String(pending));
    if (saveButton) {
      saveButton.setAttribute('aria-disabled', String(!active() || pending || !ready || !drafts.size));
      refreshButton.setAttribute('aria-disabled', String(!active() || pending));
      discardButton.setAttribute('aria-disabled', String(!active() || pending || !drafts.size));
      for (const { control, reset } of controls.values()) {
        control.disabled = !active() || !baseline;
        reset.setAttribute('aria-disabled', String(!active() || !baseline));
      }
    }
    if (cacheButton) cacheButton.setAttribute('aria-disabled', String(!active() || pending));
    notify();
  };

  const fieldNames = moduleId === 'dota2' ? ['timezone', 'reply_theme']
    : moduleId === 'steam' ? ['reply_theme', 'poster_include_apps', 'poster_limit'] : ['reply_theme'];
  const validateSnapshot = snapshot => {
    if (!snapshot || !Number.isSafeInteger(snapshot.revision) || snapshot.revision < 1
      || !snapshot.fields || !snapshot.descriptors) throw Error('invalid_snapshot');
    for (const name of fieldNames) {
      const field = snapshot.fields[name], descriptor = snapshot.descriptors[name];
      if (!field || !descriptor || typeof descriptor.description !== 'string') throw Error('invalid_snapshot');
      if (name === 'reply_theme' && (!Array.isArray(descriptor.choices)
        || !descriptor.choices.length || !descriptor.choices.some(choice => choice.value === null)
        || descriptor.choices.some(choice => typeof choice.label !== 'string'
          || !(choice.value === null || typeof choice.value === 'string')))) throw Error('invalid_snapshot');
      if (name === 'timezone' && descriptor.value_schema?.type !== 'string') throw Error('invalid_snapshot');
      if (name === 'poster_include_apps' && (descriptor.value_schema?.type !== 'boolean'
        || typeof descriptor.default !== 'boolean' || typeof field.value !== 'boolean')) throw Error('invalid_snapshot');
      if (name === 'poster_limit' && (descriptor.value_schema?.type !== 'integer'
        || descriptor.value_schema.minimum !== 1 || descriptor.value_schema.maximum !== 200
        || !Number.isInteger(descriptor.default) || !Number.isInteger(field.value))) throw Error('invalid_snapshot');
    }
    return snapshot;
  };
  const effective = name => {
    const draft = drafts.get(name);
    return draft ? draft.kind === 'clear' ? baseline.descriptors[name].default : draft.value
      : baseline.fields[name].value;
  };
  const choicesFor = name => name === 'poster_include_apps'
    ? [{ value: false, label: '仅游戏' }, { value: true, label: '全部应用' }]
    : baseline.descriptors[name].choices;
  const edit = (name, draft) => {
    if (!active() || !baseline) return;
    const field = baseline.fields[name];
    // An in-flight write may replace this baseline. Keep even a baseline-valued
    // edit as a distinct intent until its readback can reconcile the new state.
    const next = !pending && (draft.kind === 'clear' ? !field.present : field.state === 'valid' && same(field.value, draft.value)) ? undefined : draft;
    if (same(drafts.get(name), next)) return;
    if (next === undefined) drafts.delete(name);
    else drafts.set(name, next);
    draftVersion += 1;
    controls.get(name).error.textContent = '';
    controls.get(name).control.setAttribute('aria-invalid', 'false');
    const cannotRetain = drafts.size && (!partition || [...drafts.values()].some(value => value.kind === 'set'
      && typeof (value.rawValue ?? value.value) === 'string' && (value.rawValue ?? value.value).length > MAX_RETAINED_VALUE_LENGTH));
    say(cannotRetain ? '输入超过草稿保留上限，请先修正再切页。' : drafts.size ? '有未保存的修改。' : '', 'warning');
    sync();
  };
  const displayValues = () => {
    for (const [name, { control, error, hint }] of controls) {
      hint.textContent = baseline.descriptors[name].description;
      const value = effective(name);
      if (name === 'reply_theme' || name === 'poster_include_apps') {
        const choices = choicesFor(name);
        control.replaceChildren(...choices.map((choice, index) => {
          const option = node('option', choice.label);
          option.value = String(index);
          return option;
        }));
        control.value = String(choices.findIndex(choice => same(choice.value, value)));
      } else if (name === 'poster_limit' && drafts.get(name)?.rawValue !== undefined) control.value = drafts.get(name).rawValue;
      else control.value = typeof value === 'string' || typeof value === 'number' ? String(value) : '';
      error.textContent = baseline.fields[name].state !== 'valid' && !drafts.has(name)
        ? '当前配置无效，请修改或恢复默认后保存。' : '';
      control.setAttribute('aria-invalid', String(Boolean(error.textContent)));
    }
  };
  const buildFields = () => {
    for (const name of fieldNames) {
      const descriptor = baseline.descriptors[name];
      const row = node('div', undefined, 'steam-dlc-field');
      const label = node('label', name === 'timezone' ? '输出时区'
        : name === 'reply_theme' ? '回复主题'
          : name === 'poster_include_apps' ? '海报包含全部应用' : '海报项目上限');
      const control = node(name === 'reply_theme' || name === 'poster_include_apps' ? 'select' : 'input');
      control.className = 'ui-control';
      control.id = `steam-dlc-${moduleId}-${name}`;
      label.htmlFor = control.id;
      control.name = name;
      const hint = node('p', descriptor.description, 'steam-dlc-hint');
      hint.id = `${control.id}-hint`;
      const error = node('p', '', 'steam-dlc-field-error');
      error.id = `${control.id}-error`;
      control.setAttribute('aria-describedby', `${hint.id} ${error.id}`);
      if (name === 'timezone') {
        control.type = 'text';
        control.autocomplete = 'off';
        control.maxLength = Math.min(descriptor.value_schema.maxLength ?? MAX_RETAINED_VALUE_LENGTH, MAX_RETAINED_VALUE_LENGTH);
      }
      if (name === 'poster_limit') {
        control.type = 'number'; control.min = String(descriptor.value_schema.minimum);
        control.max = String(descriptor.value_schema.maximum); control.step = '1';
      }
      const reset = node('button', '恢复默认');
      reset.className = 'ui-button';
      reset.type = 'button';
      reset.dataset.action = `reset-${name}`;
      listen(reset, 'click', () => {
        if (!active() || !baseline) return;
        edit(name, { kind: 'clear' });
        displayValues();
      });
      listen(control, name === 'reply_theme' || name === 'poster_include_apps' ? 'change' : 'input', () => {
        if (!active() || !baseline) return;
        if (name === 'reply_theme' || name === 'poster_include_apps') {
          const choice = choicesFor(name)[Number(control.value)];
          if (!choice) return;
          edit(name, choice.value === null ? { kind: 'clear' } : { kind: 'set', value: choice.value });
        } else if (name === 'poster_limit') {
          const rawValue = control.value;
          edit(name, control.validity.valid && rawValue !== ''
            ? { kind: 'set', value: Number(rawValue) }
            : { kind: 'set', value: null, rawValue });
        } else edit(name, { kind: 'set', value: control.value });
      });
      controls.set(name, { control, reset, error, hint });
      row.append(label, control, reset, hint, error);
      form.insertBefore(row, form.querySelector('.steam-dlc-actions'));
    }
  };
  const applySnapshot = snapshot => {
    baseline = validateSnapshot(snapshot);
    for (const [name, draft] of drafts) {
      const field = baseline.fields[name];
      if (draft.kind === 'clear' ? !field.present : field.state === 'valid' && same(field.value, draft.value)) { drafts.delete(name); draftVersion += 1; }
    }
    if (!controls.size) buildFields();
    displayValues();
    ready = true;
  };
  const read = async (manual = false) => {
    if (!active() || pending) return;
    const ticket = ++generation;
    pending = true;
    sync();
    try {
      if (!active() || ticket !== generation) return;
      const snapshot = await options.services.config.current();
      if (!active() || ticket !== generation) return;
      applySnapshot(snapshot);
      say(drafts.size ? '已刷新；草稿已保留，请核对后保存。' : manual ? '已刷新。' : '', drafts.size ? 'warning' : 'success');
    } catch (error) {
      if (!active() || ticket !== generation) return;
      if (authorityErrors.has(errorCode(error))) {
        revokePartition();
        say('管理授权或模块上下文已失效，请重新进入页面。', 'error');
        sync();
        return;
      }
      ready = false;
      say('配置读取未完成。请检查 Dashboard 授权与模块状态，再手动刷新。', 'error');
    } finally {
      if (current() && ticket === generation) { pending = false; sync(); }
    }
  };
  const validDrafts = () => {
    let valid = true;
    for (const [name, draft] of drafts) {
      if (draft.kind === 'clear') continue;
      const descriptor = baseline.descriptors[name];
      let problem = '';
      if (name === 'timezone') {
        const schema = descriptor.value_schema;
        if (typeof draft.value !== 'string' || draft.value.length < (schema.minLength ?? 0)
          || draft.value.length > (schema.maxLength ?? Infinity)) problem = '请输入符合长度要求的 IANA 时区。';
        else {
          try { new Intl.DateTimeFormat('zh-CN', { timeZone: draft.value }).format(); }
          catch { problem = '请输入有效的 IANA 时区，例如 Asia/Shanghai。'; }
        }
      } else if (name === 'poster_limit') {
        const schema = descriptor.value_schema;
        if (draft.rawValue !== undefined || !Number.isInteger(draft.value)
          || draft.value < schema.minimum || draft.value > schema.maximum) problem = '请输入 1 到 200 之间的整数。';
      } else if (name === 'poster_include_apps' && typeof draft.value !== 'boolean') problem = '请选择是否包含全部应用。';
      else if (name === 'reply_theme' && !descriptor.choices.some(choice => same(choice.value, draft.value))) problem = '请选择当前可用的回复主题。';
      controls.get(name).error.textContent = problem;
      controls.get(name).control.setAttribute('aria-invalid', String(Boolean(problem)));
      if (problem) valid = false;
    }
    return valid;
  };
  const save = async () => {
    if (!active() || pending || !ready || !drafts.size || !validDrafts()) return;
    const submitted = new Map(drafts);
    const values = {}, clears = [];
    for (const [name, draft] of submitted) {
      if (draft.kind === 'clear') clears.push(name);
      else values[name] = draft.value;
    }
    let revision = baseline.revision, accepted = false;
    const ticket = ++generation;
    pending = true;
    ready = false;
    say('正在保存，请等待确认。');
    sync();
    const accept = receipt => {
      if (!receipt || !Number.isSafeInteger(receipt.revision) || receipt.revision <= revision) throw Error('invalid_receipt');
      revision = receipt.revision;
      accepted = true;
    };
    try {
      if (!active() || ticket !== generation) return;
      if (Object.keys(values).length) {
        const receipt = await options.services.config.save(revision, values);
        if (!active() || ticket !== generation) return;
        accept(receipt);
      }
      if (clears.length) {
        const receipt = await options.services.config.clear(revision, clears);
        if (!active() || ticket !== generation) return;
        accept(receipt);
      }
      const snapshot = await options.services.config.current();
      if (!active() || ticket !== generation) return;
      validateSnapshot(snapshot);
      if (snapshot.revision < revision) throw Error('unverified_snapshot');
      for (const [name, draft] of submitted) {
        const field = snapshot.fields[name];
        if (draft.kind === 'clear' ? field.present : field.state !== 'valid' || !same(field.value, draft.value)) throw Error('unverified_snapshot');
      }
      for (const [name, draft] of submitted) if (drafts.get(name) === draft) { drafts.delete(name); draftVersion += 1; }
      applySnapshot(snapshot);
      say(drafts.size ? '已保存本次提交；仍有新的未保存修改。' : '已保存。', drafts.size ? 'warning' : 'success');
    } catch (error) {
      if (!active() || ticket !== generation) return;
      if (authorityErrors.has(errorCode(error))) {
        revokePartition();
        say('管理授权或模块上下文已失效，请重新进入页面。', 'error');
        sync();
        return;
      }
      const conflict = errorCode(error) === 'revision_conflict';
      say(accepted ? '部分或全部修改已提交，状态暂未核实。请手动刷新并核对，不要重复提交。'
        : conflict ? '配置已被其他操作修改。草稿已保留，请手动刷新、核对后再保存。'
          : errorCode(error) === 'invalid_config' ? '配置未被接受。请检查字段，手动刷新并核对后再保存。'
            : '保存结果尚未确认。草稿已保留，请手动刷新并核对，不要重复提交。', 'error');
    } finally {
      if (current() && ticket === generation) { pending = false; sync(); }
    }
  };

  let cacheButton, cacheValue;
  let cacheGeneration = 0;
  const validateCacheStatus = response => {
    const data = response;
    if (!data || data.schema_version !== 1 || !['success', 'partial_success'].includes(data.status)
      || data.privacy !== 'public' || !data.document || !Array.isArray(data.document.blocks)) throw Error('invalid_cache_status');
    for (const block of data.document.blocks) {
      if (block?.kind !== 'fields' || !block.fields || typeof block.fields !== 'object') continue;
      const value = block.fields.cache;
      if (!value || Object.keys(value).sort().join(',') !== 'bytes,evictions,items,max_bytes,max_items'
        || Object.values(value).some(number => !Number.isSafeInteger(number) || number < 0)) continue;
      return value;
    }
    throw Error('invalid_cache_status');
  };
  const refreshCache = async () => {
    if (!active() || pending || !cacheButton) return;
    const ticket = ++cacheGeneration;
    pending = true; sync();
    try {
      const response = await options.services.invoke('wall_cache_status', {});
      if (!active() || ticket !== cacheGeneration) return;
      const value = validateCacheStatus(response);
      cacheValue.textContent = `缓存：${value.items} 项 / ${value.bytes} 字节；上限 ${value.max_items} 项 / ${value.max_bytes} 字节；已淘汰 ${value.evictions} 项。`;
      say('缓存状态已刷新。此操作只读取统计；重新验证封面请使用 --refresh。', 'success');
    } catch {
      if (!active() || ticket !== cacheGeneration) return;
      cacheValue.textContent = '缓存状态暂不可用。';
      say('读取缓存状态失败，请稍后重试。', 'error');
    } finally {
      if (current() && ticket === cacheGeneration) { pending = false; sync(); }
    }
  };

  if (module && options.routeId === 'home') {
    root.append(node('p', module.summary));
    root.append(node('h3', '命令帮助'));
    const list = node('dl', undefined, 'steam-dlc-help');
    for (const [command, help] of module.commands) {
      const term = node('dt');
      term.append(node('code', command));
      list.append(term, node('dd', help));
    }
    root.append(list);
    if (moduleId === 'steam') {
      root.append(node('h3', '时长海报墙'));
      root.append(node('p', '默认按累计游玩时长排序并以 √分钟 作为面积权重，压低极端时长差异；显示的实际时长保持原值。只纳入可确认的游戏，未知类型或时长单独说明，不按名称猜测，也不把缺失当作零。', 'steam-dlc-hint'));
      root.append(node('p', '默认使用公开样本：games 是主页 mostPlayed 样本，recent 是近期展示样本，两者都不是完整游戏库。full 需要可选 Steam Web API Key，目前未配置。缺失或权限受限会明确标注，不把未知时长当作零。全部应用选项会把软件等非游戏应用也纳入。项目上限为 1–200，结果按页码和项目范围标注；封面等比例裁切以填满块，不会拉伸。重新验证封面请在命令中使用 --refresh。', 'steam-dlc-hint'));
      cacheValue = node('p', '尚未读取缓存状态。', 'steam-dlc-cache-value');
      cacheButton = node('button', '刷新缓存状态'); cacheButton.className = 'ui-button'; cacheButton.type = 'button'; cacheButton.dataset.action = 'refresh-cache';
      listen(cacheButton, 'click', () => { void refreshCache(); });
      root.append(cacheValue, cacheButton);
    }
    if (moduleId === 'dota2') root.append(node('p', '账号可用 Dota ID32 或 SteamID64。自然语言工具需要明确账号；关联与解除关联请使用私聊 Steam 命令。', 'steam-dlc-hint'));
  } else if (module && options.routeId === 'settings') {
    form = node('form');
    listen(form, 'submit', event => { event.preventDefault(); void save(); });
    const actions = node('div', undefined, 'steam-dlc-actions');
    saveButton = node('button', '保存修改');
    saveButton.className = 'ui-button';
    saveButton.dataset.variant = 'primary';
    saveButton.type = 'submit';
    saveButton.dataset.action = 'save';
    refreshButton = node('button', '刷新配置');
    refreshButton.className = 'ui-button';
    refreshButton.type = 'button';
    refreshButton.dataset.action = 'refresh';
    discardButton = node('button', '放弃本模块修改');
    discardButton.className = 'ui-button';
    discardButton.type = 'button';
    discardButton.dataset.action = 'discard';
    listen(refreshButton, 'click', () => { void read(true); });
    listen(discardButton, 'click', () => {
      if (!active() || pending || !baseline) return;
      if (drafts.size) draftVersion += 1;
      drafts.clear(); displayValues(); say('已放弃本模块修改。', 'success'); sync();
    });
    actions.append(saveButton, refreshButton, discardButton);
    root.append(form);
    form.append(actions);
    root.append(node('p', '回复主题中的“跟随核心”清除模块覆盖值。恢复默认先形成草稿，保存后生效。', 'steam-dlc-hint'));
  } else root.append(node('p', '该页面入口未声明，请返回模块列表重新进入。'));
  root.append(message);

  const dispose = () => {
    if (disposed) return;
    disposed = true; generation += 1; cacheGeneration += 1; pending = false;
    if (messageTimer !== null) { clearTimeout(messageTimer); messageTimer = null; }
    // Normal route disposal and scope-only revocation are indistinguishable in
    // contract v1. Retained ordinary drafts stay bounded; identity/error evidence
    // revokes them explicitly. Late callbacks cannot write without this token.
    drafts.clear(); baseline = null;
    listeners.splice(0).forEach(remove => remove());
    unregister();
    root.remove();
  };
  unregister = options.scope.onDispose(dispose);
  sync();
  if (form) void read();
  if (cacheButton) void refreshCache();
  return {
    update(next) {
      if (disposed || revoked) return;
      const wasAvailable = context.available;
      context = { ...next };
      if (identity(context) !== initialIdentity) {
        revokePartition();
        say('模块运行上下文已变化，请重新进入页面。', 'error');
      } else if (wasAvailable !== context.available) {
        cacheGeneration += 1;
        generation += 1; pending = false; ready = false;
        say('页面可用状态已变化，请核对刷新后的配置。');
      }
      sync();
      // A directory refresh may restore this same binding. The user explicitly
      // refreshes config before any new request; never resend an old operation.
    },
    dispose,
    navigationImpact: impact,
  };
}

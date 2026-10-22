// Module UI contract v1. This canonical source is copied to each module's
// independently captured resource path by the release resource synchronizer.
const MODULES = Object.freeze({
  steam: {
    title: 'Steam',
    summary: '共享账号关联已实现。关联由用户声明，不代表已验证 Steam 账号所有权。',
    commands: [
      ['/ygl steam bind <SteamID64 或 profiles URL>', '在私聊中关联当前用户的 Steam 账号。'],
      ['/ygl steam binding', '在私聊中查看当前用户关联。'],
      ['/ygl steam unbind', '在私聊中解除当前用户关联。'],
      ['/ygl steam status', '查看使用说明。'],
    ],
  },
  dota2: {
    title: 'Dota2',
    summary: '最近战绩、玩家资料和单场基础摘要已实现，使用 OpenDota 公开数据。',
    commands: [
      ['/ygl dota2 recent [账号] [--limit N]', '默认 5 场，最多 20 场；省略账号时使用当前用户的 Steam 关联。'],
      ['/ygl dota2 profile [账号]', '查看精简玩家资料；省略账号时使用当前用户的 Steam 关联。'],
      ['/ygl dota2 match <match_id>', '查看已有比赛摘要，不提交比赛解析。'],
      ['/ygl dota2 status', '查看功能说明。'],
    ],
  },
  cs2: {
    title: 'CS2', summary: '模块入口已接入；游戏数据功能待实现。',
    commands: [['/ygl cs2 status', '查看当前功能范围。']],
  },
  deadlock: {
    title: 'Deadlock', summary: '模块入口已接入；游戏数据功能待实现。',
    commands: [['/ygl deadlock status', '查看当前功能范围。']],
  },
});

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const identity = context => JSON.stringify([
  context.owner, context.runtimeId, context.epoch, context.boundary,
]);
const errorCode = error => typeof error?.message === 'string' ? error.message : '';

/** mount implements the public Module UI contract v1 (no runtime imports). */
export function mount(container, options) {
  const document = container.ownerDocument;
  const initialIdentity = identity(options.context);
  const moduleId = options.context.owner.startsWith('steam_dlc/')
    ? options.context.owner.slice('steam_dlc/'.length) : '';
  const module = MODULES[moduleId];
  let context = { ...options.context };
  let disposed = false, revoked = false, generation = 0;
  let pending = false, ready = false, baseline = null;
  let impactVersion = 0, lastImpact = '';
  let messageTimer = null;
  let unregister = () => {};
  const drafts = new Map();
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
  const title = node('h2', module ? `${module.title}${options.routeId === 'settings' ? ' 设置' : ''}` : '模块页面不可用');
  const availability = node('p', '', 'steam-dlc-hint');
  availability.setAttribute('role', 'status');
  const message = node('p', '', 'steam-dlc-message');
  message.setAttribute('role', 'status');
  message.setAttribute('aria-live', 'polite');
  root.append(title, availability);
  container.replaceChildren(root);
  const current = () => !disposed && !revoked && !options.scope.signal.aborted
    && options.scope.isCurrent() && identity(context) === initialIdentity;
  const active = () => current() && context.available;
  const impact = () => Object.freeze({
    ordinary: drafts.size > 0, credentials: false, pending, version: impactVersion,
  });
  const notify = () => {
    const next = JSON.stringify([drafts.size > 0, pending]);
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
  const sync = () => {
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
    notify();
  };

  const fieldNames = moduleId === 'dota2' ? ['timezone', 'reply_theme'] : ['reply_theme'];
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
    }
    return snapshot;
  };
  const effective = name => {
    const draft = drafts.get(name);
    return draft ? draft.kind === 'clear' ? baseline.descriptors[name].default : draft.value
      : baseline.fields[name].value;
  };
  const edit = (name, draft) => {
    if (!active() || !baseline) return;
    const field = baseline.fields[name];
    // An in-flight write may replace this baseline. Keep even a baseline-valued
    // edit as a distinct intent until its readback can reconcile the new state.
    if (!pending && (draft.kind === 'clear' ? !field.present : field.state === 'valid' && same(field.value, draft.value))) drafts.delete(name);
    else drafts.set(name, draft);
    controls.get(name).error.textContent = '';
    controls.get(name).control.setAttribute('aria-invalid', 'false');
    say(drafts.size ? '有未保存的修改。' : '', 'warning');
    sync();
  };
  const displayValues = () => {
    for (const [name, { control, error, hint }] of controls) {
      hint.textContent = baseline.descriptors[name].description;
      const value = effective(name);
      if (name === 'reply_theme') {
        const choices = baseline.descriptors[name].choices;
        control.replaceChildren(...choices.map((choice, index) => {
          const option = node('option', choice.label);
          option.value = String(index);
          return option;
        }));
        control.value = String(choices.findIndex(choice => same(choice.value, value)));
      } else control.value = typeof value === 'string' ? value : '';
      error.textContent = baseline.fields[name].state !== 'valid' && !drafts.has(name)
        ? '当前配置无效，请修改或恢复默认后保存。' : '';
      control.setAttribute('aria-invalid', String(Boolean(error.textContent)));
    }
  };
  const buildFields = () => {
    for (const name of fieldNames) {
      const descriptor = baseline.descriptors[name];
      const row = node('div', undefined, 'steam-dlc-field');
      const label = node('label', name === 'timezone' ? '输出时区' : '回复主题');
      const control = node(name === 'reply_theme' ? 'select' : 'input');
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
      }
      const reset = node('button', '恢复默认');
      reset.type = 'button';
      reset.dataset.action = `reset-${name}`;
      listen(reset, 'click', () => {
        if (!active() || !baseline) return;
        edit(name, { kind: 'clear' });
        displayValues();
      });
      listen(control, name === 'reply_theme' ? 'change' : 'input', () => {
        if (!active() || !baseline) return;
        if (name === 'reply_theme') {
          const choice = baseline.descriptors[name].choices[Number(control.value)];
          if (!choice) return;
          edit(name, choice.value === null ? { kind: 'clear' } : { kind: 'set', value: choice.value });
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
      if (draft.kind === 'clear' ? !field.present : field.state === 'valid' && same(field.value, draft.value)) drafts.delete(name);
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
      say(manual ? drafts.size ? '已刷新；草稿已保留，请核对后保存。' : '已刷新。' : '', drafts.size ? 'warning' : 'success');
    } catch {
      if (!active() || ticket !== generation) return;
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
      } else if (!descriptor.choices.some(choice => same(choice.value, draft.value))) problem = '请选择当前可用的回复主题。';
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
      for (const [name, draft] of submitted) if (drafts.get(name) === draft) drafts.delete(name);
      applySnapshot(snapshot);
      say(drafts.size ? '已保存本次提交；仍有新的未保存修改。' : '已保存。', drafts.size ? 'warning' : 'success');
    } catch (error) {
      if (!active() || ticket !== generation) return;
      const conflict = errorCode(error) === 'revision_conflict';
      say(accepted ? '部分或全部修改已提交，状态暂未核实。请手动刷新并核对，不要重复提交。'
        : conflict ? '配置已被其他操作修改。草稿已保留，请手动刷新、核对后再保存。'
          : errorCode(error) === 'invalid_config' ? '配置未被接受。请检查字段，手动刷新并核对后再保存。'
            : '保存结果尚未确认。草稿已保留，请手动刷新并核对，不要重复提交。', 'error');
    } finally {
      if (current() && ticket === generation) { pending = false; sync(); }
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
    if (moduleId === 'dota2') root.append(node('p', '账号可用 Dota ID32 或 SteamID64。自然语言工具需要明确账号；关联与解除关联请使用私聊 Steam 命令。', 'steam-dlc-hint'));
  } else if (module && options.routeId === 'settings') {
    form = node('form');
    listen(form, 'submit', event => { event.preventDefault(); void save(); });
    const actions = node('div', undefined, 'steam-dlc-actions');
    saveButton = node('button', '保存修改');
    saveButton.type = 'submit';
    saveButton.dataset.action = 'save';
    refreshButton = node('button', '刷新配置');
    refreshButton.type = 'button';
    refreshButton.dataset.action = 'refresh';
    discardButton = node('button', '放弃本模块修改');
    discardButton.type = 'button';
    discardButton.dataset.action = 'discard';
    listen(refreshButton, 'click', () => { void read(true); });
    listen(discardButton, 'click', () => {
      if (!active() || pending || !baseline) return;
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
    disposed = true; generation += 1; pending = false;
    if (messageTimer !== null) { clearTimeout(messageTimer); messageTimer = null; }
    drafts.clear(); baseline = null;
    listeners.splice(0).forEach(remove => remove());
    unregister();
    root.remove();
  };
  unregister = options.scope.onDispose(dispose);
  sync();
  if (form) void read();
  return {
    update(next) {
      if (disposed || revoked) return;
      const wasAvailable = context.available;
      context = { ...next };
      if (identity(context) !== initialIdentity) {
        revoked = true; generation += 1; pending = false; ready = false;
        drafts.clear(); baseline = null;
        for (const { control } of controls.values()) control.value = '';
        say('模块运行上下文已变化，请重新进入页面。', 'error');
      } else if (wasAvailable !== context.available) {
        generation += 1; pending = false; ready = false;
        say('页面可用状态已变化，请核对刷新后的配置。');
      }
      sync();
      if (form && !wasAvailable && context.available && current()) void read();
    },
    dispose,
    navigationImpact: impact,
  };
}

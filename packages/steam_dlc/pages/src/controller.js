// Configuration lifecycle controller shared as source by four independently
// captured page builds. Presentation components live in the public facade.
import {mountJobForm} from './job-controller.js';
import {mountWishlistForm} from './wishlist-controller.js';
import {mountAnalysisForm} from './analysis-controller.js';
import {metric} from './metric.js';
export const MODULES = Object.freeze({
  steam: {
    title: 'Steam',
    summary: '商店搜索、游戏详情与公开账号资料。共享关联由用户声明，不代表账号所有权验证。',
    source: 'Steam 商店和 Community 提供公开样本；完整库 full 使用可选 Steam Key。是否完整以本次来源返回为准，私密库、缺少 Key 与上游失败会分别说明。',
    commands: [
      ['/ygl steam bind <Dota ID32、SteamID64 或 profiles URL>', '在私聊中关联当前用户的 Steam 账号。'],
      ['/ygl steam binding', '在私聊中查看当前用户关联。'],
      ['/ygl steam unbind', '在私聊中解除当前用户关联。'],
      ['/ygl steam search <游戏名或 AppID> [--country CC] [--language english]', '商店默认 CN / schinese；价格按本次地区、币种和来源时间展示，不代表历史最低价。'],
      ['/ygl steam app <AppID> [--country CC] [--language english]', '查看商店详情与当前可用价格；图片失败时保留文字结果。'],
      ['/ygl steam profile [账号]', '查看公开资料；昵称、头像、等级逐项标明可用性。'],
      ['/ygl steam recent [账号]', '查看主页最近展示的公开样本，不代表完整两周游戏列表。'],
      ['/ygl steam games [账号]', '查看来源可用的公开样本；完整游戏库增强需要可选 Steam Key。'],
      ['/ygl steam wall [账号] [--source games|recent|full] [--all-apps] [--limit N] [--refresh]', '生成游戏生涯拼图。来源、时间预设、比例与数量受已保存设置及输出预算约束；完整库需要可选 Key。'],
      ['/ygl steam wall status|result|cancel|retry <任务ID>', '查看本人任务状态、逐图结果、取消或重试。result支持 --page N --image N，每次只返回选中一张，不自动刷屏。'],
      ['/ygl steam status', '查看使用说明。'],
      ['/ygl steam wishlist [账号] [--page N] [--country CN]', '匿名查看公开愿望单，每页20项；模型与页面必须提供明确账号。'],
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
      ['/ygl dota2 analyze <比赛ID> --account <玩家账号或本场唯一昵称>', '查看指定玩家的对线、装备、团战和证据边界；网页与Tool仅提供确定性事实，Host模型仅在真实命令路径可选生成。'],
      ['/ygl dota2 watch [账号]', '在当前群或私聊创建自己的比赛订阅；省略账号使用当前 Steam 绑定。'],
      ['/ygl dota2 watchlist', '在当前会话查看自己的订阅；首次建立基线，不补发旧比赛。'],
      ['/ygl dota2 unwatch <订阅ID>', '取消当前会话中自己的订阅。'],
    ],
  },
  cs2: {
    title: 'CS2', summary: '完美平台、完美收录官匹与 5E 玩家资料、近期战绩、赛季统计和来源单场查询。',
    source: '完美扫码与 5E Token 在可信管理页设置。登录主体只用于请求授权，不替换玩家绑定。官匹与 5E 单场只提供来源近期样本中的玩家摘要。',
    commands: [
      ['/ygl cs2 status', '查看来源和凭据配置状态；配置不等于平台当前验证有效。'],
      ['/ygl cs2 profile [SteamID64] --platform perfect [--season S16]', '完美/官匹可复用本人 Steam 绑定；模型查询必须明确账号。'],
      ['/ygl cs2 recent [SteamID64] --platform official [--limit 5]', '官匹仅指完美收录口径，不代表全部 Valve 历史。'],
      ['/ygl cs2 stats <5E-domain> --platform 5e [--season 2026S5]', '5E domain 与 SteamID 分开；统计注明来源赛季口径。'],
      ['/ygl cs2 last [SteamID64] --platform perfect', '查看来源最近一场；官匹与 5E 返回有界玩家摘要。'],
      ['/ygl cs2 match <来源比赛ID> --platform perfect [--focus SteamID64]', '完美可返回完整名单及焦点；官匹/5E 另需 --account，限定在该玩家近期样本。'],
    ],
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
const SETTINGS = Object.freeze({
  steam: ['reply_theme', 'poster_source', 'poster_mode', 'poster_preset', 'poster_aspect', 'poster_quality', 'poster_fit', 'poster_include_apps', 'poster_limit_mode', 'poster_limit'],
  dota2: ['timezone', 'reply_theme', 'subscription_enabled', 'poll_interval_seconds', 'opendota_rph', 'commentary_enabled'],
  cs2: ['reply_theme', 'default_platform'], deadlock: ['reply_theme'],
});
const LABELS = {timezone: '输出时区', reply_theme: '回复主题', poster_source: '游戏库来源', poster_mode: '拼图布局', poster_preset: '时长预设', poster_aspect: '输出比例', poster_quality: '输出清晰度', poster_fit: '封面适配', poster_include_apps: '包含软件等全部应用', poster_limit: '作品数量上限', subscription_enabled: '启用比赛订阅', poll_interval_seconds: '订阅检查间隔（秒）', opendota_rph: '每小时请求上限', commentary_enabled: '启用模型短评', default_platform: '默认 CS2 来源'};
const CHOICE_LABELS = {games: '公开主页样本', recent: '近期公开样本', full: '完整游戏库（需要 Key）', dense: '游戏生涯拼图', legacy: '兼容旧布局', single: '单机', standard: '标准', long: '长玩', normal: '标准', hd: '高清', cover: '等比裁切填充', contain: '保留完整封面', perfect: '完美平台', official: '完美收录官匹', '5e': '5E'};
const CREDENTIALS = {steam: [['credential_steam_key', 'Steam Web API Key']], dota2: [['credential_opendota_key', 'OpenDota Key（可选）']], cs2: [['credential_perfect', '完美扫码授权'], ['credential_fivee', '5E 会话 Token']]};
LABELS.poster_limit_mode = '作品数量模式';
CHOICE_LABELS.top = '按时长取前 N 项'; CHOICE_LABELS.all = '不限（来源实际返回范围）';

export function parsePosterLimit(value) {
  if (typeof value !== 'string' || value.length > 128) throw Error('数量必须是完整有限数值。');
  const raw = value.trim();
  const match = /^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?$/u.exec(raw);
  if (!match) throw Error('数量必须是完整有限数值，不能包含其他文字。');
  const fraction = match[3] ?? match[4] ?? '';
  const digits = (match[2] || '0') + fraction;
  const exponent = Number(match[5] || 0) - fraction.length;
  if (!Number.isSafeInteger(exponent) || exponent > 128) throw Error('数量超过安全数值范围，请选择不限。');
  let integer = BigInt(digits);
  if (exponent < -256) integer = 0n;
  else integer = exponent >= 0 ? integer * 10n ** BigInt(exponent) : integer / 10n ** BigInt(-exponent);
  if (match[1] === '-') integer = -integer;
  if (integer > BigInt(Number.MAX_SAFE_INTEGER)) throw Error('数量超过安全数值范围，请选择不限。');
  if (integer < 20n) throw Error('数量向零截断后至少为20。');
  return Number(integer);
}

const PNG_CRC = Uint32Array.from({length: 256}, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
function previewPNG(encoded, window) {
  const direct = encoded instanceof Uint8Array;
  if (!direct && (typeof encoded !== 'string' || !encoded.length || encoded.length > 24000000 || encoded.length % 4 || !/^[A-Za-z0-9+/]*={0,2}$/u.test(encoded))) throw Error('图片内容无法验证。');
  const binary = direct ? Array.from({length: Math.ceil(encoded.length / 32768)}, (_, index) => String.fromCharCode(...encoded.subarray(index * 32768, (index + 1) * 32768))).join('') : window.atob(encoded);
  if (!binary.startsWith('\x89PNG\r\n\x1a\n')) throw Error('invalid_images');
  const bytes = direct ? encoded : Uint8Array.from(binary, char => char.charCodeAt(0));
  const uint = index => ((bytes[index] << 24) | (bytes[index + 1] << 16) | (bytes[index + 2] << 8) | bytes[index + 3]) >>> 0;
  let offset = 8, header = false, palette = false, data = false, dataEnded = false, dataBytes = 0, indexed = false;
  while (offset + 12 <= bytes.length) {
    const length = uint(offset), end = offset + length + 12;
    if (end > bytes.length) throw Error('invalid_images');
    const type = binary.slice(offset + 4, offset + 8);
    if (!/^[A-Za-z]{4}$/u.test(type) || (!header && type !== 'IHDR')) throw Error('invalid_images');
    let crc = 0xffffffff;
    for (let index = offset + 4; index < end - 4; index++) crc = PNG_CRC[(crc ^ bytes[index]) & 255] ^ (crc >>> 8);
    if (((crc ^ 0xffffffff) >>> 0) !== uint(end - 4)) throw Error('invalid_images');
    if (type === 'IHDR') {
      const depth = bytes[offset + 16], color = bytes[offset + 17];
      if (header || length !== 13 || !uint(offset + 8) || !uint(offset + 12) || !({0: [1, 2, 4, 8, 16], 2: [8, 16], 3: [1, 2, 4, 8], 4: [8, 16], 6: [8, 16]}[color]?.includes(depth)) || bytes[offset + 18] !== 0 || bytes[offset + 19] !== 0 || bytes[offset + 20] > 1) throw Error('invalid_images');
      header = true; indexed = color === 3;
    } else if (type === 'PLTE') {
      if (palette || data || !length || length > 768 || length % 3) throw Error('invalid_images');
      palette = true;
    } else if (type === 'IDAT') {
      if (dataEnded || (indexed && !palette)) throw Error('invalid_images');
      data = true; dataBytes += length;
    } else if (type === 'IEND') {
      if (length || !dataBytes || end !== bytes.length) throw Error('invalid_images');
      return bytes;
    } else {
      if (type[0] === type[0].toUpperCase()) throw Error('invalid_images');
      if (data) dataEnded = true;
    }
    offset = end;
  }
  throw Error('invalid_images');
}

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
  let disposed = false, revoked = false, scopeInvalid = false, generation = 0;
  let pending = false, ready = false, baseline = null;
  let credentialPending = false, authorizationPending = false, credentialSnapshot = null, credentialGeneration = 0;
  let credentialRoot, authorizationSession = null, authorizationTimer = null, cancelRequested = false;
  let previewGeneration = 0;
  let invalidatePublic = () => {};
  let updatePublicAvailability = () => {};
  const previewURLs = [], publicInputs = [];
  const credentialControls = new Map();
  let credentialChanged = () => {};
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
  const current = () => {
    if (options.scope.signal.aborted || !options.scope.isCurrent()) scopeInvalid = true;
    return !disposed && !revoked && !scopeInvalid && identity(context) === initialIdentity
      && (!partition || (ordinaryPartitions.get(initialIdentity) === partition && partition.token === partitionToken));
  };
  const active = () => current() && context.available;
  const impact = () => Object.freeze({
    ordinary: drafts.size > 0,
    credentials: current() && ([...credentialControls.values()].some(row => Boolean(row.input?.value)) || authorizationSession?.state === 'waiting'),
    pending: pending || credentialPending, version: impactVersion,
  });
  const notify = () => {
    const next = JSON.stringify([drafts.size > 0, pending, draftVersion, impact().credentials, credentialPending]);
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
      const allowed = SETTINGS[moduleId]?.includes(name);
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
    credentialGeneration += 1; stopAuthorization(); clearCredentialInputs(); credentialSnapshot = null; authorizationSession = null;
    credentialPending = false; authorizationPending = false;
  };
  const sync = () => {
    retainDrafts();
    updateAvailability();
    root.setAttribute('aria-busy', String(pending || credentialPending));
    if (saveButton) {
      saveButton.setAttribute('aria-disabled', String(!active() || pending || credentialPending || authorizationSession?.state === 'waiting' || !ready || !drafts.size));
      refreshButton.setAttribute('aria-disabled', String(!active() || pending || credentialPending));
      discardButton.setAttribute('aria-disabled', String(!active() || pending || credentialPending || !drafts.size));
      for (const { control, reset } of controls.values()) {
        control.disabled = !active() || !baseline;
        reset.setAttribute('aria-disabled', String(!active() || !baseline));
      }
    }
    if (cacheButton) cacheButton.setAttribute('aria-disabled', String(!active() || pending));
    credentialChanged();
    notify();
  };

  let fieldNames = [];
  const validateSnapshot = snapshot => {
    if (!snapshot || !Number.isSafeInteger(snapshot.revision) || snapshot.revision < 1
      || !snapshot.fields || !snapshot.descriptors) throw Error('invalid_snapshot');
    fieldNames = (SETTINGS[moduleId] || []).filter(name => snapshot.fields[name] && snapshot.descriptors[name]);
    if (!fieldNames.includes('reply_theme') || moduleId === 'dota2' && !fieldNames.includes('timezone')) throw Error('invalid_snapshot');
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
        || ![1, 20].includes(descriptor.value_schema.minimum)
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
    : baseline.descriptors[name].value_schema?.type === 'boolean'
      ? [{value: false, label: '关闭'}, {value: true, label: '开启'}]
      : baseline.descriptors[name].choices || baseline.descriptors[name].value_schema?.enum?.map(value => ({value, label: CHOICE_LABELS[value] || String(value)}));
  const isChoice = name => Boolean(choicesFor(name));
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
      if (isChoice(name)) {
        const choices = choicesFor(name);
        control.replaceChildren(...choices.map((choice, index) => {
          const option = node('option', choice.label);
          option.value = String(index);
          return option;
        }));
        control.value = String(choices.findIndex(choice => same(choice.value, value)));
      } else if (drafts.get(name)?.rawValue !== undefined) control.value = drafts.get(name).rawValue;
      else control.value = typeof value === 'string' || typeof value === 'number' ? String(value) : '';
      error.textContent = baseline.fields[name].state !== 'valid' && !drafts.has(name)
        ? '当前配置无效，请修改或恢复默认后保存。' : '';
      control.setAttribute('aria-invalid', String(Boolean(error.textContent)));
    }
  };
  const buildFields = () => {
    const grid = options.presentation?.grid(form, form.querySelector('.steam-dlc-actions'));
    for (const name of fieldNames) {
      const descriptor = baseline.descriptors[name];
      const row = node('div', undefined, 'steam-dlc-field');
      const label = node('label', LABELS[name] || name);
      const control = node(isChoice(name) ? 'select' : 'input');
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
      if (!isChoice(name) && descriptor.value_schema?.type === 'integer') {
        control.type = 'number'; control.min = String(descriptor.value_schema.minimum);
        if (descriptor.value_schema.maximum !== undefined) control.max = String(descriptor.value_schema.maximum); control.step = '1';
        if (name === 'poster_limit') {control.type = 'text'; control.inputMode = 'decimal'; control.removeAttribute('min'); control.removeAttribute('max');}
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
      const resets = node('div', undefined, 'steam-dlc-actions'); resets.append(reset);
      if (name === 'poster_limit') {
        for (const value of [20, 50, 100, 200, 500, 1000, 'all']) {
          const shortcut = node('button', value === 'all' ? '不限' : String(value), 'ui-button'); shortcut.type = 'button';
          listen(shortcut, 'click', () => {
            if (!active() || !baseline) return;
            if (controls.has('poster_limit_mode')) edit('poster_limit_mode', {kind: 'set', value: value === 'all' ? 'all' : 'top'});
            if (value !== 'all') edit(name, {kind: 'set', value});
            else if (!controls.has('poster_limit_mode')) {say('当前配置尚未提供不限模式，请刷新模块版本。', 'warning'); return;}
            displayValues();
          }); resets.append(shortcut);
        }
      }
      listen(control, isChoice(name) ? 'change' : 'input', () => {
        if (!active() || !baseline) return;
        if (isChoice(name)) {
          const choice = choicesFor(name)[Number(control.value)];
          if (!choice) return;
          edit(name, choice.value === null ? { kind: 'clear' } : { kind: 'set', value: choice.value });
        } else if (descriptor.value_schema?.type === 'integer') {
          const rawValue = control.value;
          if (name === 'poster_limit') {
            try { edit(name, {kind: 'set', value: parsePosterLimit(rawValue)}); }
            catch { edit(name, {kind: 'set', value: null, rawValue}); }
            return;
          }
          edit(name, name === 'opendota_rph' && rawValue === '' ? {kind: 'clear'} : control.validity.valid && rawValue !== ''
            ? { kind: 'set', value: Number(rawValue) }
            : { kind: 'set', value: null, rawValue });
        } else edit(name, { kind: 'set', value: control.value });
      });
      const presentation = grid && options.presentation.field(grid, {control, reset: resets, label, hint, error});
      controls.set(name, { control, reset, error: presentation?.error || error, hint: presentation?.hint || hint });
      if (!presentation) {row.append(label, control, resets, hint, error); form.insertBefore(row, form.querySelector('.steam-dlc-actions'));}
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
    if (!active() || pending || credentialPending) return;
    if (manual) clearCredentialInputs();
    const ticket = ++generation;
    pending = true;
    sync();
    try {
      if (!active() || ticket !== generation) return;
      const snapshot = await options.services.config.current();
      if (!active() || ticket !== generation) return;
      applySnapshot(snapshot);
      try {await refreshCredentials();}
      catch (error) {
        if (!active() || ticket !== generation) return;
        credentialError(error);
        if (active()) say('普通配置已读取；来源凭据状态未确认，请单独刷新凭据。', 'warning');
        return;
      }
      if (!active() || ticket !== generation) return;
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
      } else if (descriptor.value_schema?.type === 'integer') {
        const schema = descriptor.value_schema;
        if (draft.rawValue !== undefined || !Number.isSafeInteger(draft.value)
          || draft.value < schema.minimum || draft.value > schema.maximum) problem = `请输入 ${schema.minimum} 到 ${schema.maximum} 之间的整数。`;
        if (name === 'poster_limit') {
          try { parsePosterLimit(draft.rawValue ?? String(draft.value)); }
          catch (error) { problem = error.message; }
        }
      } else if (isChoice(name) && !choicesFor(name).some(choice => same(choice.value, draft.value))) problem = '请选择当前可用的选项。';
      controls.get(name).error.textContent = problem;
      controls.get(name).control.setAttribute('aria-invalid', String(Boolean(problem)));
      if (problem) valid = false;
    }
    if (controls.has('poster_mode') && effective('poster_mode') === 'legacy' && effective('poster_limit') > 200) {
      controls.get('poster_limit').error.textContent = '兼容旧布局最多支持 200 项，请调整数量或选择游戏生涯拼图。';
      controls.get('poster_limit').control.setAttribute('aria-invalid', 'true');
      valid = false;
    }
    return valid;
  };
  const save = async () => {
    if (!active() || pending || credentialPending || authorizationSession?.state === 'waiting' || !ready || !drafts.size || !validDrafts()) return;
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
      try {await refreshCredentials();}
      catch (error) {
        if (!active() || ticket !== generation) return;
        credentialError(error);
        if (active()) say('普通配置已保存并核对；来源凭据状态未确认，请单独刷新凭据。', 'warning');
        return;
      }
      if (!active() || ticket !== generation) return;
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
      say('缓存状态已刷新。此操作只读取统计；普通刷新游戏库会继续复用有效原图。', 'success');
    } catch {
      if (!active() || ticket !== cacheGeneration) return;
      cacheValue.textContent = '缓存状态暂不可用。';
      say('读取缓存状态失败，请稍后重试。', 'error');
    } finally {
      if (current() && ticket === cacheGeneration) { pending = false; sync(); }
    }
  };

  const clearCredentialInputs = () => {
    for (const row of credentialControls.values()) if (row.input) row.input.value = '';
  };
  const stopAuthorization = () => {
    if (authorizationTimer !== null) { clearTimeout(authorizationTimer); authorizationTimer = null; }
    credentialControls.get('credential_perfect')?.qr?.removeAttribute('src');
  };
  const credentialError = error => {
    if (authorityErrors.has(errorCode(error))) {
      revokePartition();
      say('管理授权或页面上下文已失效，请重新进入。', 'error');
    } else if (errorCode(error) === 'operation_cancelled') say('已取消操作。');
    else {
      credentialSnapshot = null;
      say(errorCode(error) === 'revision_conflict'
        ? '设置已被其他操作修改。凭据输入已清除，请刷新状态后重新操作。'
        : '操作未完成或结果未确认。凭据输入已清除，请刷新并核对状态。', 'error');
    }
  };
  const refreshCredentials = async () => {
    if (!active() || !CREDENTIALS[moduleId] || !options.services.credentials?.status) return;
    const ticket = credentialGeneration, configTicket = generation;
    const value = await options.services.credentials.status();
    if (!active() || ticket !== credentialGeneration || configTicket !== generation) return;
    if (!value || !Number.isSafeInteger(value.revision) || value.revision < 1 || !value.fields) throw Error('invalid_credential_status');
    for (const [field] of CREDENTIALS[moduleId]) {
      const state = value.fields[field];
      if (state && (typeof state.configured !== 'boolean' || typeof state.decryptable !== 'boolean' || state.upstream !== 'unverified')) throw Error('invalid_credential_status');
    }
    credentialSnapshot = value;
    buildCredentials();
    credentialChanged();
  };
  const afterCredential = async receipt => {
    const ticket = credentialGeneration;
    if (!receipt || !Number.isSafeInteger(receipt.revision) || receipt.revision <= credentialSnapshot.revision) throw Error('invalid_receipt');
    const snapshot = await options.services.config.current();
    if (!active() || ticket !== credentialGeneration) return;
    if (snapshot.revision < receipt.revision) throw Error('unverified_snapshot');
    applySnapshot(snapshot);
    await refreshCredentials();
  };
  const credentialAction = async (field, clear) => {
    if (!active() || pending || credentialPending || !credentialSnapshot || authorizationSession?.state === 'waiting') return;
    const row = credentialControls.get(field);
    const token = row.input?.value.trim();
    if (!clear && (!token || token.length > 4096 || /[\x00-\x1f\x7f-\x9f]/u.test(token))) {
      say('请输入 1 到 4096 字符的有效 Key 或 Token。', 'error'); return;
    }
    const ticket = ++credentialGeneration;
    clearCredentialInputs(); credentialPending = true; sync();
    try {
      const receipt = clear
        ? await options.services.credentials.clear(credentialSnapshot.revision, field)
        : await options.services.credentials.replace(credentialSnapshot.revision, field, {token});
      if (!active() || ticket !== credentialGeneration) return;
      await afterCredential(receipt);
      if (!active() || ticket !== credentialGeneration) return;
      const state = credentialSnapshot.fields[field];
      if (!state || state.configured === clear) throw Error('unverified_snapshot');
      say(clear ? '凭据已清除。' : '凭据已保存；有效性会在来源请求时验证。', 'success');
    } catch (error) {
      if (active() && ticket === credentialGeneration) credentialError(error);
    } finally {
      if (current() && ticket === credentialGeneration) { credentialPending = false; sync(); }
    }
  };
  const validSession = value => {
    if (!value || typeof value.session_id !== 'string' || !value.session_id || value.session_id.length > 256
      || !['waiting', 'authorized', 'expired', 'cancelled', 'revoked', 'error', 'closed'].includes(value.state)
      || !Number.isFinite(value.expires_at) || !(value.next_poll_at === null || Number.isFinite(value.next_poll_at))
      || !Number.isSafeInteger(value.polls) || value.polls < 0
      || !(value.authorized_subject === null || typeof value.authorized_subject === 'string')) throw Error('invalid_authorization_session');
    return value;
  };
  const schedulePoll = () => {
    if (!active() || authorizationSession?.state !== 'waiting' || cancelRequested) return;
    if (authorizationTimer !== null) clearTimeout(authorizationTimer);
    const remaining = authorizationSession.expires_at * 1000 - Date.now();
    if (remaining <= 0) {
      stopAuthorization(); authorizationSession = {...authorizationSession, state: 'expired'};
      say('二维码已超时，请重新登录。'); sync(); return;
    }
    const delay = Math.min(remaining, Math.max(250, authorizationSession.next_poll_at * 1000 - Date.now()));
    authorizationTimer = setTimeout(() => { authorizationTimer = null; void authorize('poll'); }, delay);
  };
  const authorize = async step => {
    if (!active() || !credentialSnapshot) return;
    if (step === 'cancel') {
      cancelRequested = true; stopAuthorization(); sync();
      if (credentialPending) return;
    }
    if (pending || credentialPending) return;
    if (step === 'begin') { stopAuthorization(); authorizationSession = null; cancelRequested = false; }
    const ticket = ++credentialGeneration;
    const sessionId = authorizationSession?.session_id || '';
    let next = null;
    credentialPending = true; authorizationPending = true; clearCredentialInputs(); sync();
    try {
      const value = await options.services.credentials.authorize(credentialSnapshot.revision, 'perfect_qr', step, sessionId);
      if (!active() || ticket !== credentialGeneration) return;
      if (step === 'qr') {
        if (typeof value.qr_png !== 'string' || value.qr_png.length > 500000 || !/^iVBORw0KGgo[A-Za-z0-9+/=]*$/u.test(value.qr_png)) throw Error('invalid_qr_png');
        if (!cancelRequested) credentialControls.get('credential_perfect').qr.src = `data:image/png;base64,${value.qr_png}`;
      } else {
        if (step === 'revoke') {
          if (!value || Object.keys(value).sort().join(',') !== 'receipt,revoked' || value.revoked !== true || !value.receipt) throw Error('invalid_revocation_receipt');
          authorizationSession = null;
        } else authorizationSession = validSession(value.session);
        if (value.receipt) await afterCredential(value.receipt);
        if (!active() || ticket !== credentialGeneration) return;
        if (step === 'revoke' && credentialSnapshot?.fields.credential_perfect?.configured !== false) throw Error('unverified_revocation');
        if (authorizationSession?.state === 'waiting') {
          say(cancelRequested ? '正在取消扫码。' : '请使用完美 App 扫码并亲自确认授权；留在本页等待结果。');
          if (step === 'begin') next = 'qr';
        } else {
          stopAuthorization();
          const state = authorizationSession?.state;
          say(state === 'authorized' ? '完美授权已保存，玩家 Steam 绑定保持独立。'
            : step === 'revoke' ? '完美授权已撤销。'
              : state === 'expired' ? '二维码已过期，请重新登录。'
                : state === 'cancelled' ? '扫码已取消。' : '授权会话已结束，请刷新状态。', state === 'authorized' || step === 'revoke' ? 'success' : 'warning');
          cancelRequested = false;
        }
      }
    } catch (error) {
      if (active() && ticket === credentialGeneration) {
        stopAuthorization(); authorizationSession = null; cancelRequested = false;
        credentialError(error);
      }
    } finally {
      if (current() && ticket === credentialGeneration) {
        credentialPending = false; authorizationPending = false; sync();
        if (cancelRequested && authorizationSession?.state === 'waiting') void authorize('cancel');
        else if (next) void authorize(next);
        else if (authorizationSession?.state === 'waiting') schedulePoll();
      }
    }
  };
  const buildCredentials = () => {
    const aliases = (CREDENTIALS[moduleId] || []).filter(([field]) => credentialSnapshot.fields[field]);
    if (!aliases.length) return;
    if (!credentialRoot) {
      credentialRoot = node('section', undefined, 'steam-dlc-credentials');
      credentialRoot.append(node('h3', '来源凭据与授权'), node('p', '凭据只在可信管理入口提交。输入不保留为跨页草稿；已配置不代表上游已验证有效。', 'steam-dlc-hint'));
      root.insertBefore(credentialRoot, message);
    }
    for (const [field, label] of aliases) {
      if (credentialControls.has(field)) continue;
      const box = node('section', undefined, 'steam-dlc-credential');
      const status = node('p', '', 'steam-dlc-credential-status'); status.setAttribute('role', 'status');
      const actions = node('div', undefined, 'steam-dlc-actions');
      const row = {status, actions, buttons: []};
      box.append(node('h4', label), status);
      const button = (action, text, callback) => {
        const value = node('button', text, 'ui-button'); value.type = 'button'; value.dataset.action = action;
        listen(value, 'click', () => { if (value.getAttribute('aria-disabled') !== 'true') callback(); }); actions.append(value); row.buttons.push(value); return value;
      };
      if (field === 'credential_perfect') {
        row.qr = node('img', undefined, 'steam-dlc-qr'); row.qr.alt = '完美登录二维码，仅供本次管理员授权';
        row.qr.setAttribute('referrerpolicy', 'no-referrer');
        box.append(row.qr);
        button('perfect-begin', '扫码登录 / 重新登录', () => { void authorize('begin'); });
        button('perfect-cancel', '取消扫码', () => { void authorize('cancel'); });
        button('perfect-poll', '检查扫码状态', () => { void authorize('poll'); });
        button('perfect-revoke', '撤销完美授权', () => { void authorize('revoke'); });
      } else {
        const input = node('input'); input.type = 'password'; input.className = 'ui-control';
        input.id = `steam-dlc-${field}`; input.name = field; input.maxLength = 4096;
        input.autocomplete = 'new-password'; input.spellcheck = false; input.setAttribute('aria-label', label);
        row.input = input;
        if (options.presentation) {
          const fieldLabel = node('label', label), hint = node('p', '来源凭据不会作为普通草稿保留。'), error = node('p');
          hint.id = `${input.id}-hint`; error.id = `${input.id}-error`;
          options.presentation.field(box, {control: input, label: fieldLabel, hint, error});
        } else box.append(input);
        listen(input, 'input', sync);
        button(`replace-${field}`, '保存凭据', () => { void credentialAction(field, false); });
        button(`clear-${field}`, '清除凭据', () => { void credentialAction(field, true); });
      }
      box.append(actions); credentialControls.set(field, row); credentialRoot.append(box);
    }
    credentialChanged = () => {
      for (const [field, row] of credentialControls) {
        const state = credentialSnapshot?.fields[field];
        row.status.textContent = !state ? '状态待刷新。' : !state.configured ? '未配置。'
          : state.decryptable ? '已配置；上游有效性尚未验证。' : '已配置，但当前无法解密，请检查服务密钥后重新设置。';
        if (field === 'credential_perfect' && authorizationSession) row.status.textContent += ` 当前扫码：${authorizationSession.state}。`;
        if (row.input) row.input.disabled = !active() || pending || credentialPending || authorizationSession?.state === 'waiting';
        for (const button of row.buttons) {
          const action = button.dataset.action;
          const cancel = action === 'perfect-cancel';
          const disabled = !active() || !credentialSnapshot || (cancel ? authorizationSession?.state !== 'waiting' && !authorizationPending : pending || credentialPending || (action === 'perfect-poll' && authorizationSession?.state !== 'waiting') || (authorizationSession?.state === 'waiting' && !action.startsWith('perfect-')));
          button.setAttribute('aria-disabled', String(disabled));
        }
      }
    };
  };

  const revokePreviews = () => {
    const urlAPI = document.defaultView?.URL || URL;
    for (const url of previewURLs.splice(0)) urlAPI.revokeObjectURL(url);
  };
  const publicField = (parent, name, label, choices, initial = '') => {
    const row = node('div', undefined, 'steam-dlc-public-field');
    const text = node('label', label), input = node(choices ? 'select' : 'input');
    input.id = `steam-dlc-${moduleId}-${options.routeId}-${name}`; input.name = name;
    input.className = 'ui-control'; text.htmlFor = input.id;
    if (choices) {
      input.append(...choices.map(value => { const choice = node('option', CHOICE_LABELS[value] || value); choice.value = value; return choice; }));
    } else { input.type = 'text'; input.maxLength = 128; input.autocomplete = 'off'; }
    input.value = initial;
    const hint = node('p', '', 'steam-dlc-hint'), error = node('p', '', 'steam-dlc-field-error');
    hint.id = `${input.id}-hint`; error.id = `${input.id}-error`;
    if (options.presentation) options.presentation.field(parent, {control: input, label: text, hint, error});
    else {row.append(text, input); parent.append(row);}
    publicInputs.push(input); return input;
  };
  const renderCS2 = (projection, target) => {
    if (!['profile', 'stats', 'match', 'recent'].includes(projection.kind)) return;
    const data = projection.data;
    const text = value => typeof value === 'string' && value ? value : '未知';
    const score = row => `${metric(row?.scores?.[0])} : ${metric(row?.scores?.[1])}`;
    const kda = row => `${metric(row?.kills)}/${metric(row?.deaths)}/${metric(row?.assists)}`;
    const table = (columns, rows) => {
      const wrap = node('div', undefined, 'steam-dlc-table'), element = node('table'), head = node('tr');
      head.append(...columns.map(value => node('th', value))); element.append(head);
      for (const values of rows) {
        const row = node('tr'); row.append(...values.map(value => node('td', value))); element.append(row);
      }
      wrap.append(element); target.append(wrap);
    };
    const coverage = {platform_recorded: '平台收录', recorded_official: '完美收录官匹', recent_first_page: '近期首批样本', recent_player_summary: '有界近期玩家摘要'}[projection.coverage] || text(projection.coverage);
    const full = projection.detail_level === 'full_match';
    if (['profile', 'stats'].includes(projection.kind)) {
      target.append(node('p', `来源：${CHOICE_LABELS[projection.platform] || text(projection.platform)} · 范围：${coverage}`, 'steam-dlc-hint'));
      if (projection.kind === 'profile') {
        const rank = data.rank || {};
        const rankValue = typeof rank.value === 'string' && rank.value.trim() && !/^[+-]?[\d.]+$/u.test(rank.value) ? rank.value : metric(rank.value);
        target.append(node('p', `玩家：${text(data.nickname)} · 账号：${text(data.account_id || projection.target?.id)} · 段位：${rankValue} · 积分：${metric(rank.score)}`));
      }
      const metrics = data.metrics || {};
      table(['场次', 'K/D', 'rating', 'PW rating', 'ADR', 'RWS', '胜率'], [[...['matches', 'kd', 'rating', 'pw_rating', 'adr', 'rws', 'win_rate'].map(key => metric(metrics[key]))]]);
      target.append(node('p', '未知表示来源未提供，不按 0 计算。', 'steam-dlc-hint'));
      return;
    }
    target.append(node('p', `来源：${CHOICE_LABELS[projection.platform] || text(projection.platform)} · 范围：${coverage} · 详情：${full ? '完整比赛' : '玩家摘要'}`, 'steam-dlc-hint'));
    if (!full) target.append(node('p', '该来源仅提供该玩家的有界近期摘要，不含完整比赛名单与详情。', 'steam-dlc-hint'));
    if (projection.unavailable_reason && projection.unavailable_reason !== 'full_match_detail_unavailable') target.append(node('p', `缺项说明：${text(projection.unavailable_reason)}`, 'steam-dlc-hint'));
    target.append(node('p', '未知表示来源未提供，不按 0 计算。', 'steam-dlc-hint'));
    if (projection.kind === 'recent') {
      if (!Array.isArray(data.matches) || !data.matches.length) {
        target.append(node('p', '来源当前样本没有可展示的比赛。')); return;
      }
      table(['比赛', '地图', '比分', 'K/D/A', 'rating', 'PW rating', 'ADR'], data.matches.map(row => [text(row?.match_id), text(row?.map), score(row), kda(row), metric(row?.rating), metric(row?.pw_rating), metric(row?.adr)]));
      return;
    }
    target.append(node('p', `比赛：${text(data.match_id)} · 地图：${text(data.map)} · 比分：${score(data)}`));
    if (!full) {
      target.append(node('p', `玩家：${text(data.focus?.id || projection.target?.id)} · K/D/A：${kda(data)} · rating：${metric(data.rating)} · PW rating：${metric(data.pw_rating)} · ADR：${metric(data.adr)}`));
      return;
    }
    if (data.focus && typeof data.focus === 'object') target.append(node('p', `焦点：${text(data.focus.nickname)} · ${text(data.focus.account_id)} · K/D/A：${kda(data.focus)} · rating：${metric(data.focus.rating)} · PW rating：${metric(data.focus.pw_rating)} · ADR：${metric(data.focus.adr)}`));
    if (!Array.isArray(data.players) || !data.players.length) {
      target.append(node('p', '来源未提供可用玩家名单。')); return;
    }
    table(['玩家', '账号', '队伍', 'K/D/A', 'rating', 'PW rating', 'ADR'], data.players.map(row => [text(row?.nickname), text(row?.account_id), metric(row?.team), kda(row), metric(row?.rating), metric(row?.pw_rating), metric(row?.adr)]));
  };
  const renderResult = (response, target) => {
    if (!response || response.schema_version !== 1 || !['success', 'partial_success', 'needs_selection', 'error'].includes(response.status)) throw Error('invalid_result');
    target.replaceChildren();
    if (response.status === 'error') {
      target.append(node('p', typeof response.error?.message === 'string' ? response.error.message : '来源未返回可用结果。', 'steam-dlc-field-error'));
      return false;
    }
    if (!response.document || !Array.isArray(response.document.blocks)) throw Error('invalid_result');
    for (const block of response.document.blocks) {
      if (block?.kind === 'text' && typeof block.text === 'string') target.append(node('p', block.text));
      if (block?.kind === 'table' && Array.isArray(block.columns) && Array.isArray(block.rows)) {
        const wrap = node('div', undefined, 'steam-dlc-table'), table = node('table'), head = node('tr');
        head.append(...block.columns.map(value => node('th', String(value)))); table.append(head);
        for (const values of block.rows) {
          if (!Array.isArray(values)) continue;
          const row = node('tr'); row.append(...values.map(value => node('td', value === null ? '未知' : typeof value === 'object' ? String(value.value ?? '') : String(value)))); table.append(row);
        }
        wrap.append(table); target.append(wrap);
      }
      const data = block?.kind === 'fields' ? block.fields?.cs2 : null;
      if (block?.kind === 'fields' && !data) {
        const fields = node('dl');
        for (const key of ['比赛ID', '焦点账号', '焦点名称', '英雄ID', '焦点胜负', '时长（秒）']) {
          if (!(key in (block.fields || {}))) continue;
          const value = block.fields[key];
          fields.append(node('dt', key), node('dd', value === null ? '未知' : typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : '未提供'));
        }
        if (fields.childNodes.length) target.append(fields);
      }
      if (Array.isArray(data?.sources)) {
        const list = node('dl', undefined, 'steam-dlc-source-status');
        for (const source of data.sources) {
          list.append(node('dt', CHOICE_LABELS[source.platform] || source.platform), node('dd', source.credential_state === 'configured' ? '凭据已配置；查询时验证上游有效性。' : '需要在可信设置页授权。'));
        }
        target.append(list);
      } else if (data?.data) {
        if (typeof data.fetched_at === 'string') target.append(node('p', `采样：${data.fetched_at}${data.season ? ` · 赛季 ${data.season}` : ''}`, 'steam-dlc-hint'));
        renderCS2(data, target);
      }
    }
    for (const warning of response.warnings || []) if (typeof warning === 'string') target.append(node('p', warning, 'steam-dlc-hint'));
    return response.status !== 'needs_selection';
  };
  const renderPreview = (response, target) => {
    // Core's invoke-images envelope contains the serialized result itself. Text
    // validation is independent of its optional image fields.
    const success = renderResult(response, target);
    if (!success) return false;
    try {
      if (!Array.isArray(response.images) || response.images.length > 8 || !['ready', 'none'].includes(response.image_state)
          || (response.image_state === 'ready') !== Boolean(response.images.length)) throw Error('invalid_images');
      if (response.images.reduce((total, page) => total + (typeof page?.base64 === 'string' ? page.base64.length : Infinity), 0) > 4 * Math.ceil((16 * 1024 * 1024) / 3) + 32) throw Error('invalid_images');
      const pages = response.images.map(page => {
        if (page?.media_type !== 'image/png') throw Error('invalid_images');
        return previewPNG(page.base64, document.defaultView);
      });
      if (pages.reduce((total, bytes) => total + bytes.length, 0) > 16 * 1024 * 1024) throw Error('invalid_images');
      for (const [index, bytes] of pages.entries()) {
        const url = document.defaultView.URL.createObjectURL(new document.defaultView.Blob([bytes], {type: 'image/png'}));
        previewURLs.push(url);
        const figure = node('figure', undefined, 'steam-dlc-preview'), image = node('img');
        image.src = url; image.alt = `CS2 资料卡 ${index + 1}`;
        figure.append(image); target.append(figure);
      }
      if (!pages.length) target.append(node('p', '本次未提供资料卡，文字资料仍可查看。', 'steam-dlc-hint'));
    } catch {
      revokePreviews();
      target.querySelectorAll('figure.steam-dlc-preview').forEach(figure => figure.remove());
      target.append(node('p', '资料卡图片无法验证，已保留文字资料。', 'steam-dlc-hint'));
    }
    return success;
  };
  const buildPublicForm = () => {
    const queryForm = node('form', undefined, 'steam-dlc-public-form');
    const result = node('section', undefined, 'steam-dlc-public-result'); result.setAttribute('aria-live', 'polite');
    const grid = options.presentation?.grid(queryForm) || queryForm;
    const account = publicField(grid, 'account', '玩家账号（SteamID64 / 5E domain）');
    account.required = true;
    let action, platform, limit, season, matchId, focus;
      action = publicField(grid, 'action', '查询类型', ['profile', 'recent', 'stats', 'last', 'match'], 'profile');
      platform = publicField(grid, 'platform', '来源', ['perfect', 'official', '5e'], 'perfect');
      season = publicField(grid, 'season', '赛季（可选）');
      limit = publicField(grid, 'limit', '近期展示数量', null, '5'); limit.type = 'number'; limit.min = '1'; limit.max = '20'; limit.step = '1';
      matchId = publicField(grid, 'match_id', '来源比赛 ID'); focus = publicField(grid, 'focus', '单场焦点账号（可选）');
      const fields = () => {
        season.disabled = !['profile', 'stats'].includes(action.value);
        limit.disabled = action.value !== 'recent'; matchId.disabled = action.value !== 'match'; focus.disabled = action.value !== 'match';
        matchId.required = action.value === 'match';
      };
      listen(action, 'change', fields); fields();
      root.append(node('p', '页面查询始终需要明确账号，不读取本人默认绑定。5E 使用 domain；官匹与 5E 单场仅限来源近期玩家摘要。', 'steam-dlc-hint'));
    const submit = node('button', '查询', 'ui-button'); submit.type = 'submit'; submit.dataset.variant = 'primary'; submit.dataset.action = 'query';
    const actions = node('div', undefined, 'steam-dlc-actions'); actions.append(submit); queryForm.append(actions);
    let failedPreview = null, formRevision = 0;
    const recovery = node('div', undefined, 'steam-dlc-actions'); recovery.hidden = true;
    const retry = node('button', '重试资料卡预览', 'ui-button'); retry.type = 'button'; retry.dataset.action = 'query-preview-retry';
    const textOnly = node('button', '仅查询文字资料', 'ui-button'); textOnly.type = 'button'; textOnly.dataset.action = 'query-text-only';
    recovery.append(retry, textOnly);
    // Form edits do not cancel the in-flight request: its finally still owns
    // releasing pending. They only invalidate recovery of its captured target.
    const clearRecovery = () => {formRevision += 1; failedPreview = null; recovery.hidden = true;};
    listen(queryForm, 'input', clearRecovery); listen(queryForm, 'change', clearRecovery);
    const syncQuery = () => {
      queryForm.setAttribute('aria-busy', String(pending));
      for (const button of [...actions.querySelectorAll('button'), retry, textOnly]) button.setAttribute('aria-disabled', String(!active() || pending));
      for (const input of queryForm.querySelectorAll('input,select')) input.disabled = !active();
      if (active()) fields();
    };
    const clearQuery = () => {
      clearRecovery(); pending = false;
      previewGeneration += 1; revokePreviews(); result.replaceChildren(); syncQuery();
    };
    invalidatePublic = clearQuery;
    updatePublicAvailability = clearQuery;
    const run = async (statusOnly, mode = 'normal') => {
      if (!active() || pending) return;
      const explicitRecovery = mode !== 'normal';
      if (explicitRecovery && (!failedPreview || failedPreview.formRevision !== formRevision)) return;
      const parameters = explicitRecovery ? {...failedPreview.parameters} : statusOnly ? {} : {account: account.value.trim()};
      if (!statusOnly && !explicitRecovery && (!parameters.account || !queryForm.checkValidity())) { say('请填写明确账号并检查输入范围。', 'error'); return; }
      if (!statusOnly && !explicitRecovery) {
        Object.assign(parameters, {action: action.value, platform: platform.value});
        if (!season.disabled && season.value.trim()) parameters.season = season.value.trim();
        if (!limit.disabled) parameters.limit = Number(limit.value);
        if (!matchId.disabled) parameters.match_id = matchId.value.trim();
        if (!focus.disabled && focus.value.trim()) parameters.focus = focus.value.trim();
      }
      const withPreview = parameters.action === 'profile' && mode !== 'text';
      const submittedRevision = formRevision;
      const ticket = ++previewGeneration; pending = true; recovery.hidden = true; revokePreviews(); result.replaceChildren(node('p', '正在查询来源。')); sync(); syncQuery();
      try {
        const response = await options.services[withPreview ? 'preview' : 'invoke']('query', parameters);
        if (!active() || ticket !== previewGeneration) return;
        if (withPreview && response?.status === 'error') {
          // Core preserves error.code while replacing the provider message.
          // Known source errors have actionable guidance; module_unavailable
          // can also mean rendering failed and needs explicit preview recovery.
          const guidance = new Map([
            ['auth_required', '所选来源需要授权。请在可信设置页完成完美扫码授权或配置 5E Token，核对来源后重新查询。'],
            ['auth_expired', '所选来源的授权已过期。请在可信设置页重新授权后查询。'],
            ['rate_limited', '来源请求限流，请稍后再查询；页面不会自动重试。'],
            ['parameter_error', '查询参数不符合要求，请核对玩家账号、所选来源、赛季和比赛 ID 后重新查询。'],
            ['not_public', '玩家资料未公开或来源访问受限，请核对公开设置与来源授权后重新查询。'],
            ['not_found', '来源未找到对应玩家或记录，请核对玩家账号与所选来源后重新查询。'],
            ['no_records', '来源当前没有可用记录，可稍后查询；这不代表该玩家没有比赛历史。'],
            ['unparsed', '来源尚未解析对应记录，请等待来源解析后再查询。'],
            ['upstream_error', '所选来源暂时不可用，请稍后再查询。'],
          ]).get(response.schema_version === 1 ? response.error?.code : null);
          if (!guidance) throw Error('preview_unavailable');
          failedPreview = null;
          result.replaceChildren(node('p', guidance, 'steam-dlc-field-error'));
          say('查询未完成，请按来源提示处理后重新查询。', 'warning');
          return;
        }
        const success = withPreview ? renderPreview(response, result) : renderResult(response, result);
        failedPreview = null;
        if (response.status === 'needs_selection') say('需要补充选择，请按来源提示配置或改选。', 'warning');
        else say(success ? '来源结果已更新。' : '查询未完成，请查看来源反馈。', success ? 'success' : 'warning');
      } catch (error) {
        if (!active() || ticket !== previewGeneration) return;
        revokePreviews();
        if (authorityErrors.has(errorCode(error))) {
          clearQuery(); revokePartition(); sync();
          publicInputs.forEach(input => { input.value = ''; }); syncQuery();
          say('页面授权或运行上下文已变化，请重新进入页面。', 'error'); return;
        }
        const canRecover = withPreview && submittedRevision === formRevision;
        failedPreview = canRecover ? {parameters: {...parameters}, formRevision: submittedRevision} : null;
        recovery.hidden = !canRecover;
        result.replaceChildren(node('p', canRecover ? '资料卡预览未完成，未取得可确认的文字或图片。可主动重试预览，或仅查询文字资料；每次操作会重新查询来源。' : '请求未完成，或返回内容不完整。请核对当前账号与来源后重新查询。', 'steam-dlc-field-error'));
        say('未取得可确认结果。', 'error');
      } finally {
        if (current() && ticket === previewGeneration) { pending = false; sync(); syncQuery(); }
      }
    };
    listen(retry, 'click', () => { void run(false, 'preview'); });
    listen(textOnly, 'click', () => { void run(false, 'text'); });
    listen(queryForm, 'submit', event => { event.preventDefault(); void run(false); });
      const status = node('button', '刷新来源状态', 'ui-button'); status.type = 'button'; status.dataset.action = 'query-status';
      listen(status, 'click', () => { void run(true); }); actions.append(status);
    root.append(queryForm, recovery, result);
    options.presentation?.actions(actions);
    void run(true);
  };

  if (module && options.routeId === 'home') {
    root.append(node('p', module.summary));
    if (moduleId !== 'steam') {
      const status = node('section', undefined, 'steam-dlc-source-panel');
      const refresh = node('button', '刷新来源状态', 'ui-button'); refresh.type = 'button'; refresh.dataset.action = 'refresh-status';
      const refreshStatus = async () => {
        if (!active() || pending) return;
        const ticket = ++previewGeneration; pending = true; sync(); refresh.setAttribute('aria-disabled', 'true');
        try {
          const response = await options.services.invoke('status', {});
          if (!active() || ticket !== previewGeneration) return;
          renderResult(response, status);
        } catch {
          if (active() && ticket === previewGeneration) status.replaceChildren(node('p', '来源状态读取失败，请稍后刷新。', 'steam-dlc-field-error'));
        } finally {
          if (current() && ticket === previewGeneration) { pending = false; refresh.setAttribute('aria-disabled', String(!active())); sync(); }
        }
      };
      listen(refresh, 'click', () => { void refreshStatus(); }); root.append(status, refresh); void refreshStatus();
    }
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
      root.append(node('p', '游戏生涯拼图用累计小时映射每张作品的目标面积，提供单机、标准和长玩预设。大图跨行、小图填空，封面保持纵向比例；旧布局可以显式选择。未知时长不补零。', 'steam-dlc-hint'));
      root.append(node('p', 'games 与 recent 是不同公开样本；full 需要可选 Steam Key。选择来源不会自动把样本当成完整库。默认纵向 2:3，可切换 9:16 或 1:2；作品数量和输出预算共同约束分页，兼容旧布局最多 200 项。包含全部应用会纳入软件，旧设置中的关闭值继续保留。', 'steam-dlc-hint'));
      cacheValue = node('p', '尚未读取缓存状态。', 'steam-dlc-cache-value');
      cacheButton = node('button', '刷新缓存状态'); cacheButton.className = 'ui-button'; cacheButton.type = 'button'; cacheButton.dataset.action = 'refresh-cache';
      listen(cacheButton, 'click', () => { void refreshCache(); });
      root.append(cacheValue, cacheButton);
    }
    if (moduleId === 'dota2') root.append(node('p', '账号可用 Dota ID32 或 SteamID64。订阅创建、查看和取消使用当前群或私聊中的命令；页面不伪造聊天身份。OpenDota Key 可选，匿名与有 Key 都遵守同一每小时预算；模型短评失败不会阻止基础通知。', 'steam-dlc-hint'));
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
    options.presentation?.actions(actions);
    root.append(form);
    form.append(actions);
    root.append(node('p', '回复主题中的“跟随核心”清除模块覆盖值。恢复默认先形成草稿，保存后生效。', 'steam-dlc-hint'));
  } else if (moduleId === 'cs2' && options.routeId === 'query') buildPublicForm(false);
  else if (moduleId === 'steam' && options.routeId === 'collage') {
    const job = mountJobForm(root, {options, active, field: publicField, parseLimit: parsePosterLimit, validatePNG: bytes => previewPNG(bytes, document.defaultView), say});
    invalidatePublic = job.dispose;
    updatePublicAvailability = job.setAvailable;
    listeners.push(job.dispose);
  }
  else if (moduleId === 'steam' && options.routeId === 'wishlist') {
    const wishlist = mountWishlistForm(root, {options, active, field: publicField, say});
    invalidatePublic = wishlist.dispose;
    updatePublicAvailability = wishlist.setAvailable;
    listeners.push(wishlist.dispose);
  }
  else if (moduleId === 'dota2' && options.routeId === 'analysis') {
    const analysis = mountAnalysisForm(root, {options, active, field: publicField, renderResult, say});
    invalidatePublic = analysis.dispose;
    updatePublicAvailability = analysis.setAvailable;
    listeners.push(analysis.dispose);
  }
  else root.append(node('p', '该页面入口未声明，请返回模块列表重新进入。'));
  root.append(message);

  const dispose = () => {
    if (disposed) return;
    disposed = true; generation += 1; cacheGeneration += 1; credentialGeneration += 1; previewGeneration += 1; pending = false;
    revokePreviews(); publicInputs.forEach(input => { input.value = ''; });
    stopAuthorization(); clearCredentialInputs(); authorizationSession = null; credentialSnapshot = null; credentialPending = false; authorizationPending = false;
    if (messageTimer !== null) { clearTimeout(messageTimer); messageTimer = null; }
    // Normal route disposal and scope-only revocation are indistinguishable in
    // contract v1. Retained ordinary drafts stay bounded; identity/error evidence
    // revokes them explicitly. Late callbacks cannot write without this token.
    drafts.clear(); baseline = null;
    listeners.splice(0).forEach(remove => remove());
    unregister();
    root.remove();
  };
  options.scope.signal.addEventListener('abort', dispose, {once: true});
  listeners.push(() => options.scope.signal.removeEventListener('abort', dispose));
  unregister = options.scope.onDispose(dispose);
  sync();
  if (form) void read();
  if (cacheButton) void refreshCache();
  return {
    update(next) {
      if (disposed || revoked) return;
      const wasAvailable = context.available;
      context = { ...next };
      if (identity(context) !== initialIdentity || !current()) {
        invalidatePublic();
        previewGeneration += 1; revokePreviews(); publicInputs.forEach(input => { input.value = ''; });
        revokePartition();
        say('模块运行上下文已变化，请重新进入页面。', 'error');
      } else if (wasAvailable !== context.available) {
        updatePublicAvailability(context.available);
        previewGeneration += 1; revokePreviews();
        credentialGeneration += 1; stopAuthorization(); clearCredentialInputs(); authorizationSession = null; credentialPending = false; authorizationPending = false;
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

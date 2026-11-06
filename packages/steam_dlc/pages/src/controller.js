import {createPageCopy, dlcText} from './copy.js';
import {primaryForm} from './template-adapter.js';
// Configuration lifecycle controller shared as source by four independently
// captured page builds. Presentation components live in the public facade.
import {mountJobForm} from './job-controller.js';
import {mountWishlistForm} from './wishlist-controller.js';
import {mountAnalysisForm} from './analysis-controller.js';
import {metric as formatMetric} from './metric.js';
const compiledModuleId = typeof __DLC_MODULE_ID__ === 'string' ? __DLC_MODULE_ID__ : null;
const moduleDefinitions = translate => Object.freeze({
  ...(!compiledModuleId || compiledModuleId === 'steam' ? {steam: ((t) => ({
    title: 'Steam',
    summary: t('module.steam.summary'),
    source: t('module.steam.source'),
    commands: [
      ['/ygl steam bind <Dota ID32、SteamID64 或 profiles URL>', t('help.linkYourSteamAccountInA')],
      ['/ygl steam binding', t('help.viewYourLinkedAccountInA')],
      ['/ygl steam unbind', t('help.unlinkYourAccountInADirect')],
      ['/ygl steam search <游戏名或 AppID> [--country CC] [--language english]', t('help.theStoreDefaultsAreCnAnd')],
      ['/ygl steam app <AppID> [--country CC] [--language english]', t('help.viewStoreDetailsAndCurrentPrices')],
      ['/ygl steam profile [账号]', t('help.viewAPublicProfileWithSeparate')],
      ['/ygl steam recent [账号]', t('help.viewTheRecentPublicSampleShown')],
      ['/ygl steam games [账号]', t('help.viewTheAvailablePublicSampleFull')],
      ['/ygl steam wall [账号] [--source games|recent|full] [--all-apps] [--limit N] [--refresh]', t('help.createAGameHistoryCollageSaved')],
      ['/ygl steam wall status|result|cancel|retry <任务ID>', t('help.checkYourJobStatusOrResults')],
      ['/ygl steam status', t('help.viewUsageHelp')],
      ['/ygl steam wishlist [账号] [--page N] [--country CN]', t('help.viewAPublicWishlistAnonymously20')],
    ],
  }))(key => translate(key, 'steam'))} : {}),
  ...(!compiledModuleId || compiledModuleId === 'dota2' ? {dota2: ((t) => ({
    title: 'Dota2',
    summary: t('module.dota2.summary'),
    source: t('module.dota2.source'),
    commands: [
      ['/ygl dota2 recent [账号] [--limit N]', t('help.defaultsTo5MatchesUpTo')],
      ['/ygl dota2 profile [账号]', t('help.viewACompactPlayerProfileIf')],
      ['/ygl dota2 stats [账号] [--limit N]', t('help.defaultsTo20MatchesWithA')],
      ['/ygl dota2 last [账号]', t('help.viewThePlayersLatestBasicMatch')],
      ['/ygl dota2 match <match_id> [--account <账号>]', t('help.specifyAnAccountToFocusOn')],
      ['/ygl dota2 status', t('help.viewFeatureHelp')],
      ['/ygl dota2 analyze <比赛ID> --account <玩家账号或本场唯一昵称>', t('help.reviewTheSelectedPlayersLanesItems')],
      ['/ygl dota2 watch [账号]', t('help.createYourOwnMatchSubscriptionIn')],
      ['/ygl dota2 watchlist', t('help.viewYourSubscriptionsInTheCurrent')],
      ['/ygl dota2 unwatch <订阅ID>', t('help.cancelYourSubscriptionInTheCurrent')],
    ],
  }))(key => translate(key, 'dota2'))} : {}),
  ...(!compiledModuleId || compiledModuleId === 'cs2' ? {cs2: ((t) => ({
    title: 'CS2', summary: t('module.cs2.summary'),
    source: t('module.cs2.source'),
    commands: [
      ['/ygl cs2 status', t('help.viewSourceAndCredentialStatusUpstream')],
      ['/ygl cs2 profile [SteamID64] --platform perfect [--season S16]', t('help.perfectWorldAndOfficialLookupsCan')],
      ['/ygl cs2 recent [SteamID64] --platform official [--limit 5]', t('help.officialMatchResultsAreLimitedTo')],
      ['/ygl cs2 stats <5E-domain> --platform 5e [--season 2026S5]', t('help.a5eDomainIsSeparateFrom')],
      ['/ygl cs2 last [SteamID64] --platform perfect', t('help.viewTheLatestMatchFromThe')],
      ['/ygl cs2 match <来源比赛ID> --platform perfect [--focus SteamID64]', t('help.perfectWorldCanReturnAFull')],
    ],
  }))(key => translate(key, 'cs2'))} : {}),
  ...(!compiledModuleId || compiledModuleId === 'deadlock' ? {deadlock: ((t) => ({
    title: 'Deadlock', summary: t('module.deadlock.summary'),
    source: t('module.deadlock.source'),
    commands: [
      ['/ygl deadlock profile [账号]', t('help.viewTheRecordedProfileAndLatest')],
      ['/ygl deadlock recent [账号] [--limit N]', t('help.defaultsTo20RecordsWithA2')],
      ['/ygl deadlock stats [账号] [--limit N]', t('help.defaultsTo20RecordsWithA')],
      ['/ygl deadlock last [账号]', t('help.viewTheMostRecentValidRecord')],
      ['/ygl deadlock match <match_id> [--account <账号>]', t('help.matchThePlayerFocusAgainstThe')],
      ['/ygl deadlock status', t('help.viewFeaturesAndSourceCoverage')],
    ],
  }))(key => translate(key, 'deadlock'))} : {}),
});

export const MODULES = moduleDefinitions((key, owner) => compiledModuleId ? key : dlcText(key, undefined, 'zh-CN', owner));

export const authorizationLabel = (state, t = (key, params) => dlcText(key, params, 'zh-CN', 'cs2')) => displayLabel({waiting: t('authorization.waitingForScanConfirmation'), authorized: t('authorization.authorized'), completed: t('authorization.authorizationComplete'), cancelled: t('authorization.cancelled'), expired: t('authorization.expired'), failed: t('authorization.authorizationFailed')}, state, t('authorization.statusUnknown'));

const displayLabel = (labels, key, fallback) => Object.hasOwn(labels, key) ? labels[key] : fallback;

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
const settingLabels = (t, moduleId) => {
  const labels = {reply_theme: t('setting.replyTheme')};
  if (moduleId === 'steam') Object.assign(labels, {poster_source: t('setting.gameLibrarySource'), poster_mode: t('setting.collageLayout'), poster_preset: t('setting.playtimePreset'), poster_aspect: t('setting.outputAspectRatio'), poster_quality: t('setting.outputQuality'), poster_fit: t('setting.coverFit'), poster_include_apps: t('setting.includeAllAppsIncludingSoftware'), poster_limit: t('setting.itemLimit'), poster_limit_mode: t('choice.itemCountMode')});
  if (moduleId === 'dota2') Object.assign(labels, {timezone: t('setting.outputTimeZone'), subscription_enabled: t('setting.enableMatchSubscriptions'), poll_interval_seconds: t('setting.subscriptionCheckIntervalSeconds'), opendota_rph: t('setting.hourlyRequestLimit'), commentary_enabled: t('setting.enableModelCommentary')});
  if (moduleId === 'cs2') labels.default_platform = t('setting.defaultCs2Source');
  return labels;
};
const choiceLabels = (t, moduleId) => {
  const labels = {standard: t('choice.standard')};
  if (moduleId === 'steam') Object.assign(labels, {games: t('choice.publicProfileSample'), recent: t('choice.recentPublicSample'), full: t('choice.fullLibraryKeyRequired'), dense: t('route.collage'), legacy: t('choice.legacyLayout'), single: t('choice.singlePlayer'), long: t('choice.longPlay'), normal: t('choice.standard'), hd: t('choice.highDefinition'), cover: t('choice.cropToFill'), contain: t('choice.showFullCover'), top: t('choice.topNByPlaytime'), all: t('choice.unlimitedAsReturnedByTheSource')});
  if (['dota2', 'cs2', 'deadlock'].includes(moduleId)) Object.assign(labels, {profile: t('choice.playerProfile'), stats: t('choice.playerStats'), last: t('choice.latestMatch'), match: t('choice.matchDetails')});
  if (moduleId === 'dota2') labels.opendota = t('choice.opendotaKeyOptional');
  if (moduleId === 'cs2') Object.assign(labels, {perfect: t('choice.perfectWorld'), official: t('choice.officialMatchesRecordedByPerfectWorld'), '5e': '5E'});
  return labels;
};
const credentialLabels = (t, moduleId) => moduleId === 'steam' ? {steam: [['credential_steam_key', 'Steam Web API Key']]}
  : moduleId === 'dota2' ? {dota2: [['credential_opendota_key', t('choice.opendotaKeyOptional')]]}
    : moduleId === 'cs2' ? {cs2: [['credential_perfect', t('choice.perfectWorldQrAuthorization')], ['credential_fivee', t('choice.5eSessionToken')]]} : {};


export function parsePosterLimit(value, translate = dlcText) {
  if (typeof value !== 'string' || value.length > 128) throw Error(translate('validation.enterACompleteFiniteNumber'));
  const raw = value.trim();
  const match = /^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?$/u.exec(raw);
  if (!match) throw Error(translate('validation.enterACompleteFiniteNumberWithout'));
  const fraction = match[3] ?? match[4] ?? '';
  const digits = (match[2] || '0') + fraction;
  const exponent = Number(match[5] || 0) - fraction.length;
  if (!Number.isSafeInteger(exponent) || exponent > 128) throw Error(translate('validation.theCountExceedsTheSafeRange'));
  let integer = BigInt(digits);
  if (exponent < -256) integer = 0n;
  else integer = exponent >= 0 ? integer * 10n ** BigInt(exponent) : integer / 10n ** BigInt(-exponent);
  if (match[1] === '-') integer = -integer;
  if (integer > BigInt(Number.MAX_SAFE_INTEGER)) throw Error(translate('validation.theCountExceedsTheSafeRange'));
  if (integer < 20n) throw Error(translate('validation.theCountMustBeAtLeast'));
  return Number(integer);
}

const PNG_CRC = Uint32Array.from({length: 256}, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
function previewPNG(encoded, window, translate = dlcText) {
  const direct = encoded instanceof Uint8Array;
  if (!direct && (typeof encoded !== 'string' || !encoded.length || encoded.length > 24000000 || encoded.length % 4 || !/^[A-Za-z0-9+/]*={0,2}$/u.test(encoded))) throw Error(translate('validation.theImageCouldNotBeVerified'));
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
  let context = {...options.context};
  const moduleId = compiledModuleId || (options.context.owner.startsWith('steam_dlc/')
    ? options.context.owner.slice('steam_dlc/'.length) : '');
  const template = options.presentation?.template;
  const copy = options.copy || createPageCopy(() => context.locale, undefined, moduleId);
  const t = copy.text;
  const metric = value => formatMetric(value, t);
  const themeLabel = options.themeLabel || ((value, fallback) => value === null && fallback === copy.textAt('zh-CN', 'choice.followCore') ? t('choice.followCore') : fallback);
  const configHint = (name, description) => {
    const key = 'configHint.' + name;
    return copy.textAt('zh-CN', key) === description ? t(key) : description;
  };
  const choose = (labels, value, fallback) => displayLabel(labels(t), value, fallback);
  const initialIdentity = identity(options.context);
  const module = MODULES[moduleId];
  const currentSettingLabels = () => settingLabels(t, moduleId);
  const currentChoiceLabels = () => choiceLabels(t, moduleId);
  const currentCredentialLabels = credentialLabels(t, moduleId);
  const partition = module ? partitionFor(options.context, initialIdentity, options.routeId === 'settings') : null;
  const partitionToken = partition?.token;
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
    if (typeof text === 'function') copy.bind(element, text);
    else if (text !== undefined) element.textContent = text;
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
  if (!template) root.append(availability);
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
  let notice;
  const publishNotice = () => {
    const text = typeof notice?.text === 'function' ? notice.text() : notice?.text;
    if (template) template.publish({notice: text ? {key: 'custom', text, tone: notice.tone, role: 'status'} : undefined});
    else message.textContent = text || '';
  };
  const say = (text, tone = 'warning') => {
    if (messageTimer !== null) { clearTimeout(messageTimer); messageTimer = null; }
    notice = {text, tone};
    publishNotice();
    message.dataset.tone = tone;
    if (text && tone === 'success') {
      messageTimer = setTimeout(() => {
        messageTimer = null;
        if (current()) {notice = undefined; publishNotice();}
      }, 3500);
    }
  };
  const updateAvailability = () => {
    root.dataset.theme = context.theme;
    availability.textContent = !current()
      ? t('availability.thisPageContextExpiredOpenThe')
      : context.available
        ? t('availability.thisPageIsAvailableCheckRuntime')
        : t('availability.thisPageIsUnavailableRefreshIts');
  };

  let form, saveButton, refreshButton, discardButton, themeReset;
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
    template?.publish({themeField: undefined, themeValue: '', themeError: undefined});
    for (const { control } of controls.values()) control.value = '';
    credentialGeneration += 1; stopAuthorization(); clearCredentialInputs(); credentialSnapshot = null; authorizationSession = null;
    credentialPending = false; authorizationPending = false;
  };
  const sync = () => {
    retainDrafts();
    updateAvailability();
    root.setAttribute('aria-busy', String(pending || credentialPending));
    if (template) {
      template.publish({availability: availability.textContent, pending: pending || credentialPending});
      if (options.routeId === 'home') template.actionState('refresh', {disabled: !active(), busy: pending});
      if (form) {
        template.actionState('save', {disabled: !active() || authorizationSession?.state === 'waiting' || (!pending && (!ready || !drafts.size)), busy: pending || credentialPending});
        template.actionState('refresh', {disabled: !active()});
        template.actionState('discard', {disabled: !active() || !drafts.size});
        template.publish({themeReadonly: !active() || !baseline});
        themeReset?.setAttribute('aria-disabled', String(!active() || !baseline));
      }
    }
    if (form) {
      saveButton?.setAttribute('aria-disabled', String(!active() || pending || credentialPending || authorizationSession?.state === 'waiting' || !ready || !drafts.size));
      refreshButton?.setAttribute('aria-disabled', String(!active() || pending || credentialPending));
      discardButton?.setAttribute('aria-disabled', String(!active() || pending || credentialPending || !drafts.size));
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
  const choicesFor = name => name === 'reply_theme'
    ? baseline.descriptors[name].choices.map(({value, label}) => ({value, label: themeLabel(value, label)}))
    : name === 'poster_include_apps'
    ? [{ value: false, label: t('settings.gamesOnly') }, { value: true, label: t('settings.allApps') }]
    : baseline.descriptors[name].value_schema?.type === 'boolean'
      ? [{value: false, label: t('settings.off')}, {value: true, label: t('settings.on')}]
      : baseline.descriptors[name].choices || baseline.descriptors[name].value_schema?.enum?.map(value => ({value, label: choose(currentChoiceLabels, value, String(value))}));
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
    if (template && name === 'reply_theme') template.publish({themeError: undefined});
    else copy.bind(controls.get(name).error, () => '');
    controls.get(name)?.control.setAttribute('aria-invalid', 'false');
    const cannotRetain = drafts.size && (!partition || [...drafts.values()].some(value => value.kind === 'set'
      && typeof (value.rawValue ?? value.value) === 'string' && (value.rawValue ?? value.value).length > MAX_RETAINED_VALUE_LENGTH));
    say(cannotRetain ? () => t('settings.draftTooLong') : drafts.size ? () => t('settings.youHaveUnsavedChanges') : '', 'warning');
    sync();
  };
  const publishThemeField = () => {
    if (template) {
      const name = 'reply_theme', descriptor = baseline.descriptors[name], choices = choicesFor(name);
      template.publish({
        themeField: {id: name, label: choose(currentSettingLabels, name, name), control: 'select', hint: configHint(name, descriptor.description),
          choices: choices.map(({label}, index) => ({value: String(index), label}))},
        themeValue: String(choices.findIndex(choice => same(choice.value, effective(name)))),
        themeError: baseline.fields[name].state !== 'valid' && !drafts.has(name)
          ? t('settings.invalidCurrentValue') : undefined,
      });
    }
  };
  const relabelFields = () => {
    publishThemeField();
    for (const [name, {control}] of controls) if (isChoice(name)) {
      choicesFor(name).forEach(({label}, index) => {
        if (control.options[index]) control.options[index].textContent = label;
      });
    }
  };
  const displayValues = () => {
    publishThemeField();
    for (const [name, { control, error, hint }] of controls) {
      copy.bind(hint, () => configHint(name, baseline?.descriptors[name]?.description || ''));
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
      const invalid = baseline.fields[name].state !== 'valid' && !drafts.has(name);
      copy.bind(error, invalid ? () => t('settings.invalidCurrentValue') : () => '');
      control.setAttribute('aria-invalid', String(Boolean(error.textContent)));
    }
  };
  let fieldsBuilt = false;
  const buildFields = () => {
    const groups = new Map();
    const groupId = name => moduleId === 'steam' && name.startsWith('poster_') ? 'poster'
      : moduleId === 'dota2' && ['subscription_enabled', 'poll_interval_seconds', 'opendota_rph', 'commentary_enabled'].includes(name) ? 'subscriptions' : 'workspace';
    const groupLabels = {poster: 'route.collage', subscriptions: 'section.subscriptions', workspace: 'section.queryAndReply'};
    for (const name of fieldNames) {
      if (template && name === 'reply_theme') {
        template.bind(name, value => {
          if (!active() || !baseline) return;
          const choice = choicesFor(name)[Number(value)];
          if (choice) edit(name, choice.value === null ? {kind: 'clear'} : {kind: 'set', value: choice.value});
          displayValues();
        });
        const reset = node('button', () => template.text('resetDefault'), 'ui-button');
        themeReset = reset;
        reset.type = 'button';
        reset.dataset.action = 'reset-reply_theme';
        listen(reset, 'click', () => {
          if (!active() || !baseline) return;
          edit(name, {kind: 'clear'});
          displayValues();
        });
        form.append(reset);
        continue;
      }
      const id = groupId(name);
      if (!groups.has(id)) {
        const section = node('section', undefined, 'steam-dlc-config-group');
        if (template) (template.groupHost(id) || form).append(section);
        else {
          section.append(node('h3', () => t(groupLabels[id])));
          form.insertBefore(section, form.querySelector(':scope > .steam-dlc-actions'));
        }
        groups.set(id, {section, grid: options.presentation?.grid(section)});
      }
      const {section, grid} = groups.get(id);
      const descriptor = baseline.descriptors[name];
      const row = node('div', undefined, 'steam-dlc-field');
      const label = node('label', () => choose(currentSettingLabels, name, name));
      const control = node(isChoice(name) ? 'select' : 'input');
      control.className = 'ui-control';
      control.id = `steam-dlc-${moduleId}-${name}`;
      label.htmlFor = control.id;
      control.name = name;
      const hint = node('p', () => configHint(name, descriptor.description), 'steam-dlc-hint');
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
      const reset = node('button', () => template?.text('resetDefault') || t('settings.restoreDefault'));
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
          const shortcut = node('button', () => value === 'all' ? t('settings.unlimited') : String(value), 'ui-button'); shortcut.type = 'button';
          listen(shortcut, 'click', () => {
            if (!active() || !baseline) return;
            if (controls.has('poster_limit_mode')) edit('poster_limit_mode', {kind: 'set', value: value === 'all' ? 'all' : 'top'});
            if (value !== 'all') edit(name, {kind: 'set', value});
            else if (!controls.has('poster_limit_mode')) {say(() => t('settings.unlimitedModeUnavailable'), 'warning'); return;}
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
            try { edit(name, {kind: 'set', value: parsePosterLimit(rawValue, t)}); }
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
      if (!presentation) {row.append(label, control, resets, hint, error); section.append(row);}
    }
  };
  const applySnapshot = snapshot => {
    baseline = validateSnapshot(snapshot);
    for (const [name, draft] of drafts) {
      const field = baseline.fields[name];
      if (draft.kind === 'clear' ? !field.present : field.state === 'valid' && same(field.value, draft.value)) { drafts.delete(name); draftVersion += 1; }
    }
    if (!fieldsBuilt) {buildFields(); fieldsBuilt = true;}
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
        if (active()) say(() => t('settings.readWithUnconfirmedCredentials'), 'warning');
        return;
      }
      if (!active() || ticket !== generation) return;
      say(drafts.size ? () => t('settings.refreshedWithDraft') : manual ? () => t('settings.refreshed') : '', drafts.size ? 'warning' : 'success');
    } catch (error) {
      if (!active() || ticket !== generation) return;
      if (authorityErrors.has(errorCode(error))) {
        revokePartition();
        say(() => t('settings.authorizationExpired'), 'error');
        sync();
        return;
      }
      ready = false;
      say(() => t('settings.settingsCouldNotBeReadCheck'), 'error');
    } finally {
      if (current() && ticket === generation) { pending = false; sync(); }
    }
  };
  const validDrafts = () => {
    let valid = true;
    for (const [name, draft] of drafts) {
      if (draft.kind === 'clear') continue;
      const descriptor = baseline.descriptors[name];
      let problem;
      if (name === 'timezone') {
        const schema = descriptor.value_schema;
        if (typeof draft.value !== 'string' || draft.value.length < (schema.minLength ?? 0)
          || draft.value.length > (schema.maxLength ?? Infinity)) problem = () => t('settings.enterAnIanaTimeZoneWithin');
        else {
          try { new Intl.DateTimeFormat('zh-CN', { timeZone: draft.value }).format(); }
          catch { problem = () => t('settings.enterAValidIanaTimeZone'); }
        }
      } else if (descriptor.value_schema?.type === 'integer') {
        const schema = descriptor.value_schema;
        if (draft.rawValue !== undefined || !Number.isSafeInteger(draft.value)
          || draft.value < schema.minimum || draft.value > schema.maximum) problem = () => t('settings.integerRange', {minimum: schema.minimum, maximum: schema.maximum});
        if (name === 'poster_limit') {
          const raw = draft.rawValue ?? String(draft.value);
          try { parsePosterLimit(raw, t); }
          catch {
            problem = () => {
              try { parsePosterLimit(raw, t); }
              catch (error) { return error.message; }
            };
          }
        }
      } else if (isChoice(name) && !choicesFor(name).some(choice => same(choice.value, draft.value))) problem = () => t('settings.chooseAnAvailableOption');
      if (template && name === 'reply_theme') template.publish({themeError: problem?.()});
      else {
        copy.bind(controls.get(name).error, problem || (() => ''));
        controls.get(name).control.setAttribute('aria-invalid', String(Boolean(problem)));
      }
      if (problem) valid = false;
    }
    if (controls.has('poster_mode') && effective('poster_mode') === 'legacy' && effective('poster_limit') > 200) {
      copy.bind(controls.get('poster_limit').error, () => t('settings.legacyLimit'));
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
    say(() => t('settings.savingPleaseWaitForConfirmation'));
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
        if (active()) say(() => t('settings.savedWithUnconfirmedCredentials'), 'warning');
        return;
      }
      if (!active() || ticket !== generation) return;
      say(drafts.size ? () => t('settings.savedWithNewerDraft') : () => t('settings.saved'), drafts.size ? 'warning' : 'success');
    } catch (error) {
      if (!active() || ticket !== generation) return;
      if (authorityErrors.has(errorCode(error))) {
        revokePartition();
        say(() => t('settings.authorizationExpired'), 'error');
        sync();
        return;
      }
      const conflict = errorCode(error) === 'revision_conflict';
      say(accepted ? () => t('settings.partialWriteUnverified')
        : conflict ? () => t('settings.configConflict')
          : errorCode(error) === 'invalid_config' ? () => t('settings.invalidConfig')
            : () => t('settings.saveUnverified'), 'error');
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
      copy.bind(cacheValue, () => t('cache.summary', {items: value.items, bytes: value.bytes, maxItems: value.max_items, maxBytes: value.max_bytes, evictions: value.evictions}));
      say(() => t('cache.cacheStatusRefreshedThisOnlyReads'), 'success');
    } catch {
      if (!active() || ticket !== cacheGeneration) return;
      copy.bind(cacheValue, () => t('cache.cacheStatusIsTemporarilyUnavailable'));
      say(() => t('cache.couldNotReadCacheStatusTry'), 'error');
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
      say(() => t('credential.authorizationExpired'), 'error');
    } else if (errorCode(error) === 'operation_cancelled') say(() => t('credential.operationCancelled'));
    else {
      credentialSnapshot = null;
      say(errorCode(error) === 'revision_conflict'
        ? () => t('credential.configConflict')
        : () => t('credential.mutationUnverified'), 'error');
    }
  };
  const refreshCredentials = async () => {
    if (!active() || !currentCredentialLabels[moduleId] || !options.services.credentials?.status) return;
    const ticket = credentialGeneration, configTicket = generation;
    const value = await options.services.credentials.status();
    if (!active() || ticket !== credentialGeneration || configTicket !== generation) return;
    if (!value || !Number.isSafeInteger(value.revision) || value.revision < 1 || !value.fields) throw Error('invalid_credential_status');
    for (const [field] of currentCredentialLabels[moduleId]) {
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
      say(() => t('credential.enterAValidKeyOrToken'), 'error'); return;
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
      say(clear ? () => t('credential.credentialsCleared') : () => t('credential.savedUnverifiedUpstream'), 'success');
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
      say(() => t('credential.theQrCodeTimedOutSign')); sync(); return;
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
          say(cancelRequested ? () => t('credential.cancellingTheQrSession') : () => t('credential.scanWithThePerfectWorldApp'));
          if (step === 'begin') next = 'qr';
        } else {
          stopAuthorization();
          const state = authorizationSession?.state;
          say(state === 'authorized' ? () => t('credential.perfectWorldAuthorizationWasSavedThe')
            : step === 'revoke' ? () => t('credential.perfectWorldAuthorizationWasRevoked')
              : state === 'expired' ? () => t('credential.theQrCodeExpiredSignIn')
                : state === 'cancelled' ? () => t('credential.theQrSessionWasCancelled') : () => t('credential.theAuthorizationSessionEndedRefreshThe'), state === 'authorized' || step === 'revoke' ? 'success' : 'warning');
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
    const aliases = (currentCredentialLabels[moduleId] || []).filter(([field]) => credentialSnapshot.fields[field]);
    if (!aliases.length) return;
    if (!credentialRoot) {
      credentialRoot = node('section', undefined, 'steam-dlc-credentials');
      if (!options.presentation?.credentialHost) credentialRoot.append(node('h3', () => t('section.sourceCredentials')));
      credentialRoot.append(node('p', () => t('credential.submitCredentialsOnlyThroughTrustedAdministration'), 'steam-dlc-hint'));
      if (options.presentation?.credentialHost) options.presentation.credentialHost.append(credentialRoot);
      else root.insertBefore(credentialRoot, message);
    }
    for (const [field] of aliases) {
      if (credentialControls.has(field)) continue;
      const box = node('section', undefined, 'steam-dlc-credential');
      const status = node('p', '', 'steam-dlc-credential-status'); status.setAttribute('role', 'status');
      const actions = node('div', undefined, 'steam-dlc-actions');
      const row = {status, actions, buttons: []};
      const label = () => currentCredentialLabels[moduleId].find(([name]) => name === field)[1];
      box.append(node('h4', label), status);
      const button = (action, text, callback) => {
        const value = node('button', text, 'ui-button'); value.type = 'button'; value.dataset.action = action;
        listen(value, 'click', () => { if (value.getAttribute('aria-disabled') !== 'true') callback(); }); actions.append(value); row.buttons.push(value); return value;
      };
      if (field === 'credential_perfect') {
        row.qr = node('img', undefined, 'steam-dlc-qr'); copy.bind(row.qr, () => t('credential.perfectWorldSignInQrCode'), 'alt');
        row.qr.setAttribute('referrerpolicy', 'no-referrer');
        box.append(row.qr);
        button('perfect-begin', () => t('credential.signInSignInAgainBy'), () => { void authorize('begin'); });
        button('perfect-cancel', () => t('credential.cancelQrSignIn'), () => { void authorize('cancel'); });
        button('perfect-poll', () => t('credential.checkQrSignInStatus'), () => { void authorize('poll'); });
        button('perfect-revoke', () => t('credential.revokePerfectWorldAuthorization'), () => { void authorize('revoke'); });
      } else {
        const input = node('input'); input.type = 'password'; input.className = 'ui-control';
        input.id = `steam-dlc-${field}`; input.name = field; input.maxLength = 4096;
        input.autocomplete = 'new-password'; input.spellcheck = false; copy.bind(input, label, 'ariaLabel');
        row.input = input;
        if (options.presentation) {
          const fieldLabel = node('label', label), hint = node('p', () => t('credential.sourceCredentialsAreNeverKeptAs')), error = node('p');
          hint.id = `${input.id}-hint`; error.id = `${input.id}-error`;
          options.presentation.field(box, {control: input, label: fieldLabel, hint, error});
        } else box.append(input);
        listen(input, 'input', sync);
        button(`replace-${field}`, () => t('credential.saveCredentials'), () => { void credentialAction(field, false); });
        button(`clear-${field}`, () => t('credential.clearCredentials'), () => { void credentialAction(field, true); });
      }
      box.append(actions); credentialControls.set(field, row); credentialRoot.append(box);
    }
    credentialChanged = () => {
      for (const [field, row] of credentialControls) {
        const state = credentialSnapshot?.fields[field];
        row.status.textContent = !state ? t('credential.refreshToCheckStatus') : !state.configured ? t('credential.notConfigured')
          : state.decryptable ? t('credential.configuredUpstreamValidityIsUnverified') : t('credential.decryptionFailed');
        if (field === 'credential_perfect' && authorizationSession) row.status.textContent += t('credential.qrSignInStatus', {status: authorizationLabel(authorizationSession.state, t)});
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
      input.append(...choices.map(value => { const choice = node('option', () => (name === 'action' && value === 'recent' ? t('query.recentMatches') : choose(currentChoiceLabels, value, String(value))) || t('query.unknownOption')); choice.value = value; return choice; }));
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
    const text = value => typeof value === 'string' && value ? value : t('query.unknown');
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
    const coverage = () => displayLabel({platform_recorded: t('query.recordedByPlatform'), recorded_official: t('choice.officialMatchesRecordedByPerfectWorld'), recent_first_page: t('query.firstBatchOfRecentSamples'), recent_player_summary: t('query.limitedRecentPlayerSummary')}, projection.coverage, t('query.coverageUnknown'));
    const full = projection.detail_level === 'full_match';
    if (['profile', 'stats'].includes(projection.kind)) {
      target.append(node('p', () => t('query.sourceCoverage', {source: choose(currentChoiceLabels, projection.platform, t('query.sourceUnknown')), coverage: coverage()}), 'steam-dlc-hint'));
      if (projection.kind === 'profile') {
        const rank = data.rank || {};
        const rankValue = () => typeof rank.value === 'string' && rank.value.trim() && !/^[+-]?[\d.]+$/u.test(rank.value) ? rank.value : metric(rank.value);
        target.append(node('p', () => t('query.playerRank', {player: text(data.nickname), account: text(data.account_id || projection.target?.id), rank: rankValue(), score: metric(rank.score)})));
      }
      const metrics = data.metrics || {};
      table([() => t('query.matches'), 'K/D', 'rating', 'PW rating', 'ADR', 'RWS', () => t('query.winRate')], [[...['matches', 'kd', 'rating', 'pw_rating', 'adr', 'rws', 'win_rate'].map(key => () => metric(metrics[key]))]]);
      target.append(node('p', () => t('query.missingValuesStayUnknown'), 'steam-dlc-hint'));
      return;
    }
    target.append(node('p', () => t('query.sourceCoverageDetail', {source: choose(currentChoiceLabels, projection.platform, t('query.sourceUnknown')), coverage: coverage(), detail: displayLabel({full_match: t('query.fullMatch'), player_summary: t('query.playerSummary')}, projection.detail_level, t('query.detailCoverageUnknown'))}), 'steam-dlc-hint'));
    if (projection.detail_level === 'player_summary') target.append(node('p', () => t('query.thisSourceProvidesASummaryOf'), 'steam-dlc-hint'));
    if (projection.unavailable_reason && projection.unavailable_reason !== 'full_match_detail_unavailable') target.append(node('p', () => t('query.someDetailsAreUnavailable'), 'steam-dlc-hint'));
    target.append(node('p', () => t('query.missingValuesStayUnknown'), 'steam-dlc-hint'));
    if (projection.kind === 'recent') {
      if (!Array.isArray(data.matches) || !data.matches.length) {
        target.append(node('p', () => t('query.noMatchesInSample'))); return;
      }
      table([() => t('query.match'), () => t('query.map'), () => t('query.score'), 'K/D/A', 'rating', 'PW rating', 'ADR'], data.matches.map(row => [() => text(row?.match_id), () => text(row?.map), () => score(row), () => kda(row), () => metric(row?.rating), () => metric(row?.pw_rating), () => metric(row?.adr)]));
      return;
    }
    target.append(node('p', () => t('query.matchSummary', {match: text(data.match_id), map: text(data.map), score: score(data)})));
    if (!full) {
      target.append(node('p', () => t('query.playerMetrics', {player: text(data.focus?.id || projection.target?.id), kda: kda(data), rating: metric(data.rating), pwRating: metric(data.pw_rating), adr: metric(data.adr)})));
      return;
    }
    if (data.focus && typeof data.focus === 'object') target.append(node('p', () => t('query.focusMetrics', {player: text(data.focus.nickname), account: text(data.focus.account_id), kda: kda(data.focus), rating: metric(data.focus.rating), pwRating: metric(data.focus.pw_rating), adr: metric(data.focus.adr)})));
    if (!Array.isArray(data.players) || !data.players.length) {
      target.append(node('p', () => t('query.noUsableRoster'))); return;
    }
    table([() => t('query.player'), () => t('query.account'), () => t('query.team'), 'K/D/A', 'rating', 'PW rating', 'ADR'], data.players.map(row => [() => text(row?.nickname), () => text(row?.account_id), () => metric(row?.team), () => kda(row), () => metric(row?.rating), () => metric(row?.pw_rating), () => metric(row?.adr)]));
  };
  const renderResult = (response, target) => {
    if (!response || response.schema_version !== 1 || !['success', 'partial_success', 'needs_selection', 'error'].includes(response.status)) throw Error('invalid_result');
    target.replaceChildren();
    if (response.status === 'error') {
      target.append(node('p', () => typeof response.error?.message === 'string' ? response.error.message : t('query.theSourceReturnedNoUsableResult'), 'steam-dlc-field-error'));
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
          const row = node('tr'); row.append(...values.map(value => node('td', () => value === null ? t('query.unknown') : typeof value === 'object' ? String(value.value ?? '') : String(value)))); table.append(row);
        }
        wrap.append(table); target.append(wrap);
      }
      const data = block?.kind === 'fields' ? block.fields?.cs2 : null;
      if (block?.kind === 'fields' && !data) {
        const fields = node('dl');
        for (const [key, label] of [['比赛ID', 'query.matchId'], ['焦点账号', 'query.focusAccount'], ['焦点名称', 'query.focusName'], ['英雄ID', 'query.heroId'], ['焦点胜负', 'query.focusOutcome'], ['时长（秒）', 'query.durationSeconds']]) {
          if (!(key in (block.fields || {}))) continue;
          const value = block.fields[key];
          fields.append(node('dt', () => t(label)), node('dd', () => value === null ? t('query.unknown') : typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : t('query.notProvided')));
        }
        if (fields.childNodes.length) target.append(fields);
      }
      if (Array.isArray(data?.sources)) {
        const list = node('dl', undefined, 'steam-dlc-source-status');
        for (const source of data.sources) {
          list.append(node('dt', () => choose(currentChoiceLabels, source.platform, t('query.sourceUnknown'))), node('dd', () => source.credential_state === 'configured' ? t('query.credentialsConfiguredUpstreamValidityIsChecked') : t('query.authorizationIsRequiredInTrustedSettings')));
        }
        target.append(list);
      } else if (data?.data) {
        if (typeof data.fetched_at === 'string') target.append(node('p', () => t('query.sampleTimestamp', {time: data.fetched_at, season: data.season ? t('query.seasonSuffix', {season: data.season}) : ''}), 'steam-dlc-hint'));
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
        return previewPNG(page.base64, document.defaultView, t);
      });
      if (pages.reduce((total, bytes) => total + bytes.length, 0) > 16 * 1024 * 1024) throw Error('invalid_images');
      for (const [index, bytes] of pages.entries()) {
        const url = document.defaultView.URL.createObjectURL(new document.defaultView.Blob([bytes], {type: 'image/png'}));
        previewURLs.push(url);
        const figure = node('figure', undefined, 'steam-dlc-preview'), image = node('img');
        image.src = url; copy.bind(image, () => t('query.profileCardAlt', {index: index + 1}), 'alt');
        figure.append(image); target.append(figure);
      }
      if (!pages.length) target.append(node('p', () => t('query.noProfileCardWasReturnedText'), 'steam-dlc-hint'));
    } catch {
      revokePreviews();
      target.querySelectorAll('figure.steam-dlc-preview').forEach(figure => figure.remove());
      target.append(node('p', () => t('query.theProfileCardImageCouldNot'), 'steam-dlc-hint'));
    }
    return success;
  };
  const buildPublicForm = () => {
    const primary = primaryForm(root, {...options, copy}, {id: 'query', legacyLabel: () => t('query.search'), className: 'steam-dlc-public-form'});
    const {body: queryForm, actions} = primary;
    const result = node('section', undefined, 'steam-dlc-public-result'); result.setAttribute('aria-live', 'polite');
    const grid = options.presentation?.grid(queryForm) || queryForm;
    const account = publicField(grid, 'account', () => t('query.playerAccountSteamid645eDomain'));
    account.required = true;
    let action, platform, limit, season, matchId, focus;
      action = publicField(grid, 'action', () => t('query.searchType'), ['profile', 'recent', 'stats', 'last', 'match'], 'profile');
      platform = publicField(grid, 'platform', () => t('query.source'), ['perfect', 'official', '5e'], 'perfect');
      season = publicField(grid, 'season', () => t('query.seasonOptional'));
      limit = publicField(grid, 'limit', () => t('query.recentMatchesToShow'), null, '5'); limit.type = 'number'; limit.min = '1'; limit.max = '20'; limit.step = '1';
      matchId = publicField(grid, 'match_id', () => t('query.sourceMatchId')); focus = publicField(grid, 'focus', () => t('query.matchFocusAccountOptional'));
      const fields = () => {
        season.disabled = !['profile', 'stats'].includes(action.value);
        limit.disabled = action.value !== 'recent'; matchId.disabled = action.value !== 'match'; focus.disabled = action.value !== 'match';
        matchId.required = action.value === 'match';
      };
      listen(action, 'change', fields); fields();
      root.append(node('p', () => t('query.webLookupsAlwaysRequireAnExplicit'), 'steam-dlc-hint'));
      if (!template) root.append(node('h3', () => t('section.queryCriteria')));
    queryForm.append(actions);
    let failedPreview = null, formRevision = 0;
    const recovery = node('div', undefined, 'steam-dlc-actions'); recovery.hidden = true;
    const retry = node('button', () => t('query.retryCardPreview'), 'ui-button'); retry.type = 'button'; retry.dataset.action = 'query-preview-retry';
    const textOnly = node('button', () => t('query.searchForTextDetailsOnly'), 'ui-button'); textOnly.type = 'button'; textOnly.dataset.action = 'query-text-only';
    recovery.append(retry, textOnly);
    // Form edits do not cancel the in-flight request: its finally still owns
    // releasing pending. They only invalidate recovery of its captured target.
    const clearRecovery = () => {formRevision += 1; failedPreview = null; recovery.hidden = true;};
    listen(queryForm, 'input', clearRecovery); listen(queryForm, 'change', clearRecovery);
    const syncQuery = () => {
      primary.sync(!active(), pending);
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
      if (!statusOnly && !explicitRecovery && (!parameters.account || ![...queryForm.querySelectorAll('input,select')].every(input => input.checkValidity()))) { say(() => t('query.enterAnExplicitAccountAndCheck'), 'error'); return; }
      if (!statusOnly && !explicitRecovery) {
        Object.assign(parameters, {action: action.value, platform: platform.value});
        if (!season.disabled && season.value.trim()) parameters.season = season.value.trim();
        if (!limit.disabled) parameters.limit = Number(limit.value);
        if (!matchId.disabled) parameters.match_id = matchId.value.trim();
        if (!focus.disabled && focus.value.trim()) parameters.focus = focus.value.trim();
      }
      const withPreview = parameters.action === 'profile' && mode !== 'text';
      const submittedRevision = formRevision;
      const ticket = ++previewGeneration; pending = true; recovery.hidden = true; revokePreviews(); result.replaceChildren(node('p', () => t('query.queryingTheSource'))); sync(); syncQuery();
      try {
        const response = await options.services[withPreview ? 'preview' : 'invoke']('query', parameters);
        if (!active() || ticket !== previewGeneration) return;
        if (withPreview && response?.status === 'error') {
          // Core preserves error.code while replacing the provider message.
          // Known source errors have actionable guidance; module_unavailable
          // can also mean rendering failed and needs explicit preview recovery.
          const guidance = new Map([
            ['auth_required', () => t('query.error.authRequired')],
            ['auth_expired', () => t('query.error.authExpired')],
            ['rate_limited', () => t('query.error.rateLimited')],
            ['parameter_error', () => t('query.error.invalidParameters')],
            ['not_public', () => t('query.error.notPublic')],
            ['not_found', () => t('query.error.notFound')],
            ['no_records', () => t('query.error.noRecords')],
            ['unparsed', () => t('query.error.unparsed')],
            ['upstream_error', () => t('query.error.upstreamUnavailable')],
          ]).get(response.schema_version === 1 ? response.error?.code : null);
          if (!guidance) throw Error('preview_unavailable');
          failedPreview = null;
          result.replaceChildren(node('p', guidance, 'steam-dlc-field-error'));
          say(() => t('query.theLookupDidNotFinishFollow'), 'warning');
          return;
        }
        const success = withPreview ? renderPreview(response, result) : renderResult(response, result);
        failedPreview = null;
        if (response.status === 'needs_selection') say(() => t('query.aSelectionIsRequiredFollowThe'), 'warning');
        else say(success ? () => t('query.sourceResultsUpdated') : () => t('query.theLookupDidNotFinishCheck'), success ? 'success' : 'warning');
      } catch (error) {
        if (!active() || ticket !== previewGeneration) return;
        revokePreviews();
        if (authorityErrors.has(errorCode(error))) {
          clearQuery(); revokePartition(); sync();
          publicInputs.forEach(input => { input.value = ''; }); syncQuery();
          say(() => t('query.pageAuthorizationOrRuntimeContextChanged'), 'error'); return;
        }
        const canRecover = withPreview && submittedRevision === formRevision;
        failedPreview = canRecover ? {parameters: {...parameters}, formRevision: submittedRevision} : null;
        recovery.hidden = !canRecover;
        result.replaceChildren(node('p', () => canRecover ? t('query.cardPreviewDidNotFinishNo') : t('query.theRequestDidNotFinishOr'), 'steam-dlc-field-error'));
        say(() => t('query.noVerifiedResultWasObtained'), 'error');
      } finally {
        if (current() && ticket === previewGeneration) { pending = false; sync(); syncQuery(); }
      }
    };
    listen(retry, 'click', () => { void run(false, 'preview'); });
    listen(textOnly, 'click', () => { void run(false, 'text'); });
    listeners.push(primary.bind(() => run(false)));
      const status = node('button', () => t('status.refreshSourceStatus'), 'ui-button'); status.type = 'button'; status.dataset.action = 'query-status';
      listen(status, 'click', () => { void run(true); }); actions.append(status);
    root.append(queryForm);
    primary.result(recovery, node('h3', () => t('status.searchResults')), result);
    options.presentation?.actions(actions);
    void run(true);
  };

  if (module && options.routeId === 'home') {
    if (moduleId !== 'steam') {
      const status = node('section', undefined, 'steam-dlc-source-panel');
      root.append(node('h3', () => t('status.sourceStatus')));
      const refresh = node('button', () => t('status.refreshSourceStatus'), 'ui-button'); refresh.type = 'button'; refresh.dataset.action = 'refresh-status';
      const refreshStatus = async () => {
        if (!active() || pending) return;
        const ticket = ++previewGeneration; pending = true; sync(); refresh.setAttribute('aria-disabled', 'true');
        try {
          const response = await options.services.invoke('status', {});
          if (!active() || ticket !== previewGeneration) return;
          renderResult(response, status);
        } catch {
          if (active() && ticket === previewGeneration) status.replaceChildren(node('p', () => t('status.couldNotReadSourceStatusRefresh'), 'steam-dlc-field-error'));
        } finally {
          if (current() && ticket === previewGeneration) { pending = false; refresh.setAttribute('aria-disabled', String(!active())); sync(); }
        }
      };
      if (template) {
        template.bind('refresh', refreshStatus, {label: () => t('status.refreshSourceStatus')});
        root.append(status);
      } else {
        listen(refresh, 'click', () => { void refreshStatus(); });
        root.append(status, refresh);
      }
      void refreshStatus();
    }
    const help = node('details', undefined, 'steam-dlc-disclosure');
    help.append(node('summary', () => t('help.commandHelp')));
    const list = node('dl', undefined, 'steam-dlc-help');
    for (const [index, [command]] of module.commands.entries()) {
      const term = node('dt');
      term.append(node('code', command));
      list.append(term, node('dd', () => moduleDefinitions(t)[moduleId].commands[index][1]));
    }
    help.append(list);
    root.append(help);
    if (moduleId === 'steam') {
      const details = node('details', undefined, 'steam-dlc-disclosure');
      details.append(node('summary', () => t('help.aboutGameHistoryCollages')));
      details.append(node('p', () => t('help.theCollageMapsPlaytimeToEach'), 'steam-dlc-hint'));
      details.append(node('p', () => t('help.publicProfileAndRecentActivityHave'), 'steam-dlc-hint'));
      root.append(details, node('h3', () => t('help.cacheStatus')));
      cacheValue = node('p', () => t('help.cacheStatusHasNotBeenRead'), 'steam-dlc-cache-value');
      cacheButton = node('button', () => t('help.refreshCacheStatus')); cacheButton.className = 'ui-button'; cacheButton.type = 'button'; cacheButton.dataset.action = 'refresh-cache';
      if (template) {
        template.bind('refresh', refreshCache, {label: () => t('help.refreshCacheStatus')});
        root.append(cacheValue);
      } else {
        listen(cacheButton, 'click', () => { void refreshCache(); });
        root.append(cacheValue, cacheButton);
      }
    }
    if (moduleId === 'dota2') { const details = node('details', undefined, 'steam-dlc-disclosure'); details.append(node('summary', () => t('help.aboutAccountsAndSubscriptions')), node('p', () => t('help.useADotaId32OrSteamid64'), 'steam-dlc-hint')); root.append(details); }
  } else if (module && options.routeId === 'settings') {
    const discard = () => {
      if (!active() || pending || !baseline) return;
      if (drafts.size) draftVersion += 1;
      drafts.clear(); displayValues(); say(() => t('settings.moduleChangesDiscarded'), 'success'); sync();
    };
    if (template) {
      form = node('div');
      root.append(form);
      template.bind('save', save, {type: 'submit', disabled: true});
      template.bind('refresh', () => read(true), {});
      template.bind('discard', discard, {});
    } else {
    form = node('form');
    listen(form, 'submit', event => { event.preventDefault(); void save(); });
    const actions = node('div', undefined, 'steam-dlc-actions');
    saveButton = node('button', () => t('settings.saveChanges'));
    saveButton.className = 'ui-button';
    saveButton.dataset.variant = 'primary';
    saveButton.type = 'submit';
    saveButton.dataset.action = 'save';
    refreshButton = node('button', () => t('settings.refreshSettings'));
    refreshButton.className = 'ui-button';
    refreshButton.type = 'button';
    refreshButton.dataset.action = 'refresh';
    discardButton = node('button', () => t('settings.discardModuleChanges'));
    discardButton.className = 'ui-button';
    discardButton.type = 'button';
    discardButton.dataset.action = 'discard';
    listen(refreshButton, 'click', () => { void read(true); });
    listen(discardButton, 'click', discard);
    actions.append(saveButton, refreshButton, discardButton);
    options.presentation?.actions(actions);
    root.append(form);
    form.append(actions);
    }
    root.append(node('p', () => t('settings.followCoreClearsTheModulesReply'), 'steam-dlc-hint'));
  } else if (moduleId === 'cs2' && options.routeId === 'query') buildPublicForm(false);
  else if (moduleId === 'steam' && options.routeId === 'collage') {
    const job = mountJobForm(root, {options: {...options, copy}, active, field: publicField, parseLimit: (value, translate = t) => parsePosterLimit(value, translate), validatePNG: bytes => previewPNG(bytes, document.defaultView, t), say});
    invalidatePublic = job.dispose;
    updatePublicAvailability = job.setAvailable;
    listeners.push(job.dispose);
  }
  else if (moduleId === 'steam' && options.routeId === 'wishlist') {
    const wishlist = mountWishlistForm(root, {options: {...options, copy}, active, field: publicField, say});
    invalidatePublic = wishlist.dispose;
    updatePublicAvailability = wishlist.setAvailable;
    listeners.push(wishlist.dispose);
  }
  else if (moduleId === 'dota2' && options.routeId === 'analysis') {
    const analysis = mountAnalysisForm(root, {options: {...options, copy}, active, field: publicField, renderResult, say});
    invalidatePublic = analysis.dispose;
    updatePublicAvailability = analysis.setAvailable;
    listeners.push(analysis.dispose);
  }
  else root.append(node('p', () => t('page.thisPageIsNotDeclaredReturn')));
  if (!template) root.append(message);

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
    credentialRoot?.remove();
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
      const localeChanged = next.locale !== context.locale;
      context = { ...next };
      if (identity(context) !== initialIdentity || !current()) {
        invalidatePublic();
        previewGeneration += 1; revokePreviews(); publicInputs.forEach(input => { input.value = ''; });
        revokePartition();
        say(() => t('page.moduleRuntimeContextChangedOpenThe'), 'error');
      } else if (wasAvailable !== context.available) {
        updatePublicAvailability(context.available);
        previewGeneration += 1; revokePreviews();
        credentialGeneration += 1; stopAuthorization(); clearCredentialInputs(); authorizationSession = null; credentialPending = false; authorizationPending = false;
        cacheGeneration += 1;
        generation += 1; pending = false; ready = false;
        say(() => t('page.pageAvailabilityChangedReviewTheRefreshed'));
      }
      sync();
      if (localeChanged) {
        publishNotice();
        if (baseline && current()) relabelFields();
        if (!options.copy) copy.refresh();
      }
      // A directory refresh may restore this same binding. The user explicitly
      // refreshes config before any new request; never resend an old operation.
    },
    dispose,
    navigationImpact: impact,
  };
}

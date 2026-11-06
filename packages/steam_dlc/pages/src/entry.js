import {createApp, h, shallowRef} from 'vue';
import * as ui from '@game-link/ui';
import {moduleAppearance} from './appearance.js';
import {createPageCopy} from './copy.js';
const {UiProvider, PageHeader, SettingsLayout, Surface, SettingsGroup, StatusHint, FormField, FormGrid, ActionBar} = ui;
let nextTemplate = 0;
const compiledModuleId = typeof __DLC_MODULE_ID__ === 'string' ? __DLC_MODULE_ID__ : null;
import {mountController, MODULES} from './controller.js';
import steamLogo from '../../steam/assets/steam.svg?raw';
import dota2Logo from '../../dota2/assets/dota2.svg?raw';
import cs2Logo from '../../cs2/assets/cs2.svg?raw';
import deadlockLogo from '../../deadlock/assets/deadlock.svg?raw';

// Only bundled, reviewed repository artwork is accepted. Never inject SVG markup.
const moduleArtwork = {steam: steamLogo, dota2: dota2Logo, cs2: cs2Logo, deadlock: deadlockLogo};
function artworkNode(id, doc) {
  const source = moduleArtwork[id];
  if (!source) return null;
  const root = new doc.defaultView.DOMParser().parseFromString(source, 'image/svg+xml').documentElement;
  const allowed = {svg: ['viewBox', 'fill'], g: ['transform'], path: ['d', 'fill', 'fill-rule', 'clip-rule']};
  function convert(node) {
    const name = node.localName;
    if (!Object.hasOwn(allowed, name)) return null;
    const attrs = Object.fromEntries(allowed[name].filter(key => node.hasAttribute(key)).map(key => [key, node.getAttribute(key)]));
    if (name === 'svg') Object.assign(attrs, {class: `steam-dlc-module-mark steam-dlc-module-mark--${id}`, 'aria-hidden': 'true', focusable: 'false'});
    return h(name, attrs, [...node.children].map(convert).filter(Boolean));
  }
  return root.localName === 'svg' ? convert(root) : null;
}

/** Public PageModule contract v1. The controller owns services, CAS and drafts;
 * the shared presentation facade owns layout, theme and locale.
 * @param {HTMLElement} container
 * @param {import('@game-link/page-contract').PageOptions} options
 * @returns {import('@game-link/page-contract').MountedPage}
 */
export function mount(container, options) {
  const context = shallowRef({...options.context});
  const routeModuleId = options.context.owner.startsWith('steam_dlc/')
    ? options.context.owner.slice('steam_dlc/'.length) : '';
  if (compiledModuleId && routeModuleId !== compiledModuleId) throw Error('module_owner_mismatch');
  const moduleId = compiledModuleId || routeModuleId;
  const copy = createPageCopy(() => context.value.locale, ui.translateUi, moduleId);
  const t = copy.text;
  const themeLabel = (value, fallback) => {
    if (value === null && fallback !== copy.textAt('zh-CN', 'choice.followCore')) return fallback;
    return ui.uiThemeLabel?.(value, fallback, context.value.locale) ?? (value === null ? t('choice.followCore') : fallback);
  };
  const module = MODULES[moduleId];
  const settings = options.routeId === 'settings';
  const home = options.routeId === 'home';
  const hasCredentials = settings && ['steam', 'dota2', 'cs2'].includes(moduleId);
  const workspaceKey = {collage: 'route.collage', wishlist: 'workspace.wishlist', analysis: 'workspace.analysis', query: 'route.query'}[options.routeId];
  const criteriaKey = {collage: 'section.createCollage', wishlist: 'section.queryCriteria', analysis: 'section.analysisCriteria', query: 'section.queryCriteria'}[options.routeId];
  const summary = () => module ? t('module.' + moduleId + '.summary') : t('page.moduleMissing');
  const source = () => module ? t('module.' + moduleId + '.source') : '';
  const modern = Boolean(module && ui.PageTemplate && ui.uiText);
  const idPrefix = `steam-dlc-${++nextTemplate}`;
  let host, credentialHost, resultHost, controller, disposed = false, unregister = () => {};
  const fieldApps = [];
  const presentation = {
    actions(container) {
      if (modern) {container.classList.add('ui-action-bar'); return;}
      const children = [...container.childNodes];
      const app = createApp({setup: () => () => h(ActionBar, {}, {default: () => h('div', {style: {display: 'contents'}, ref: element => {
        if (element) for (const child of children) if (child.parentNode !== element) element.append(child);
      }})})});
      app.mount(container); fieldApps.push(app);
    },
    grid(parent, before) {
      const mount = container.ownerDocument.createElement('div');
      parent.insertBefore(mount, before || null);
      if (modern) {mount.className = 'ui-form-grid'; mount.dataset.columns = settings ? '1' : '2'; return mount;}
      let target;
      const app = createApp({setup: () => () => h(FormGrid, {columns: settings ? 1 : 2}, {default: () => h('div', {style: {display: 'contents'}, ref: element => {target = element;}})})});
      app.mount(mount); fieldApps.push(app);
      return target;
    },
    field(parent, {control, reset, label, hint, error}) {
      const mount = container.ownerDocument.createElement('div');
      parent.append(mount);
      if (modern) {
        mount.className = settings ? 'steam-dlc-field ui-settings-row' : 'steam-dlc-public-field';
        if (control.name === 'poster_limit') mount.classList.add('steam-dlc-limit-field');
        label.htmlFor = control.id;
        label.id = control.id + '-label';
        control.setAttribute('aria-labelledby', label.id);
        control.setAttribute('aria-describedby', `${hint.id} ${error.id}`);
        control.setAttribute('aria-invalid', String(Boolean(error.textContent)));
        mount.append(label, control, ...(reset ? [reset] : []), hint, error);
        return {hint, error};
      }
      const labelText = copy.renderer(label), initialHint = copy.renderer(hint);
      const hintText = shallowRef(), errorText = shallowRef(error.textContent);
      const app = createApp({setup: () => () => h(FormField, {
        controlId: control.id, label: labelText(), hint: hintText.value ?? initialHint(), error: errorText.value, layout: settings ? 'row' : 'stacked',
        class: control.name === 'poster_limit' ? 'steam-dlc-limit-field' : undefined,
        hintId: hint.id, errorId: error.id,
      }, {default: ({controlAttrs}) => {
        for (const [key, value] of Object.entries(controlAttrs)) {
          if (value === undefined) control.removeAttribute(key);
          else control.setAttribute(key, String(value));
        }
        return h('div', {ref: element => {if (element && control.parentNode !== element) element.append(control);}});
      }, actions: () => reset ? h('div', {ref: element => {if (element && reset.parentNode !== element) element.append(reset);}}) : null})});
      app.mount(mount); fieldApps.push(app);
      // Text setters update presentation props; the controller never writes to
      // Vue-owned label/hint/error children. Native control ownership stays here.
      return {
        hint: {get textContent() {return hintText.value ?? initialHint();}, set textContent(value) {hintText.value = value;}},
        error: {get textContent() {return errorText.value;}, set textContent(value) {errorText.value = value;}},
      };
    },
  };
  const sourceDisclosure = () => h('details', {class: 'steam-dlc-disclosure'}, [
    h('summary', t('section.sourceScope')),
    h('p', {class: 'steam-dlc-hint'}, source()),
    h('p', {class: 'steam-dlc-hint'}, t('page.accountScope')),
  ]);
  const groups = new Map();
  const viewState = shallowRef({});
  const bindings = new Map(), actions = new Map();
  // Declare the submit form before mounting its imperative content host.
  if (settings || workspaceKey) {
    const id = settings ? 'save' : 'query';
    actions.set(id, {id, type: 'submit', disabled: true});
  }
  const publish = next => {viewState.value = {...viewState.value, ...next};};
  const template = {
    bind(id, callback, declaration) {
      bindings.set(id, callback);
      if (declaration) actions.set(id, {id, ...declaration});
      publish({});
    },
    actionState(id, state) {
      const declaration = actions.get(id);
      if (declaration) actions.set(id, {...declaration, ...state});
      if (id === 'query' || id === 'save') host?.closest('form')?.setAttribute('aria-busy', String(Boolean(state.busy)));
      publish({});
    },
    publish,
    groupHost(id) {return groups.get(id);},
    text(key) {return ui.uiText(key, context.value.locale);},
  };
  const aside = () => h(Surface, {title: hasCredentials ? t('section.sourceCredentials') : settings ? t('section.settingsHelp') : t('section.dataAndAccounts'), eyebrow: hasCredentials ? t('page.sourceAccess') : undefined}, {default: () => [
        h(StatusHint, {}, {default: () => settings
          ? moduleId === 'steam'
            ? t('page.settings.steam')
            : moduleId === 'cs2'
              ? t('page.settings.cs2')
              : moduleId === 'dota2'
                ? t('page.settings.dota2')
                : t('page.settings.deadlock')
          : source() || t('page.moduleMissing')}),
        hasCredentials ? h('div', {ref: element => { credentialHost = element; }}) : null,
        h('p', {class: 'steam-dlc-hint'}, settings
          ? t('page.saveVerification')
          : t('page.accountScope')),
      ]});
  const templateView = () => {
    const {themeField, themeValue, themeError, themeReadonly, notice, pending, availability} = viewState.value;
    return h(ui.PageTemplate, {
      idPrefix, class: 'steam-dlc-view', lang: context.value.locale,
      context: context.value, styleMountTarget: container, appearance: moduleAppearance(moduleId),
      content: {
        title: home ? module.title : settings ? t('page.settingsTitle', {module: module.title}) : `${module.title} ${t(workspaceKey)}`,
        eyebrow: home ? t('page.moduleEyebrow', {module: module.title.toUpperCase()}) : 'YOMIHIME GAME LINK / STEAM DLC',
        intro: summary(),
        sections: [
          {id: 'workspace', title: settings ? t('section.queryAndReply') : t(criteriaKey || 'section.statusAndHelp'), fields: themeField ? [themeField] : []},
          ...(settings && moduleId === 'steam' ? [{id: 'poster', title: t('route.collage')}] : []),
          ...(settings && moduleId === 'dota2' ? [{id: 'subscriptions', title: t('section.subscriptions')}] : []),
        ],
        actions: [...actions.values()].map(action => typeof action.label === 'function' ? {...action, label: action.label()} : action),
        notes: home ? [t('page.homeNavigation')] : undefined,
      },
      state: {values: {reply_theme: themeValue ?? ''}, errors: {reply_theme: themeError}, readonly: themeReadonly, pending, notice},
      onFieldChange: ({id, value}) => bindings.get(id)?.(value),
      onAction: id => bindings.get(id)?.(),
    }, {
      ...(home ? {logo: () => artworkNode(moduleId, container.ownerDocument)} : {}),
      sectionExtra: ({section}) => h('div', {ref: element => {
        if (section.id === 'workspace') host = element;
        else groups.set(section.id, element);
      }}),
      aside,
      results: () => h('div', {ref: element => {resultHost = element;}}),
      footer: () => [h(StatusHint, {}, {default: () => availability}), home ? sourceDisclosure() : null],
    });
  };
  // Vue owns the stable host, while the imperative controller owns its children.
  // A context update patches the provider and never remounts the form subtree.
  const app = createApp({setup: () => () => modern ? templateView() : h(UiProvider, {
    theme: context.value.theme, locale: context.value.locale, styleMountTarget: container,
  }, {default: () => h('section', {class: 'steam-dlc-view', lang: context.value.locale}, [
    home ? h(Surface, {title: module?.title || t('page.moduleUnavailable'), eyebrow: t('page.moduleEyebrow', {module: module?.title?.toUpperCase() || 'STEAM DLC'})}, {default: () => [
      artworkNode(moduleId, container.ownerDocument),
      h('p', summary()),
      h(StatusHint, {}, {default: () => t('page.homeNavigation')}),
      h('div', {ref: element => { host = element; }}),
      sourceDisclosure(),
    ]}) : [
    !settings ? h(PageHeader, {
      title: module ? `${module.title}${workspaceKey ? ` ${t(workspaceKey)}` : ''}` : t('page.moduleUnavailable'),
      eyebrow: 'YOMIHIME GAME LINK / STEAM DLC', subtitle: summary(),
    }) : null,
    h(SettingsLayout, {}, {
      default: () => settings ? h('div', {ref: element => { host = element; }}) : h(SettingsGroup, {title: t(workspaceKey || 'section.statusAndHelp'), number: '01'}, {
        default: () => h('div', {ref: element => { host = element; }}),
      }),
      aside,
    }),
    ],
  ])})});
  app.mount(container);
  presentation.credentialHost = credentialHost;
  if (modern) {
    presentation.template = template;
    presentation.resultHost = resultHost;
  }
  controller = mountController(host, {...options, copy, themeLabel, presentation, scope: {
    signal: options.scope.signal, isCurrent: () => options.scope.isCurrent(), onDispose: () => () => {},
  }});
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    controller.dispose();
    copy.clear();
    fieldApps.splice(0).reverse().forEach(field => field.unmount());
    app.unmount();
    options.scope.signal.removeEventListener('abort', dispose);
    unregister();
  };
  options.scope.signal.addEventListener('abort', dispose, {once: true});
  unregister = options.scope.onDispose(dispose);
  return {
    update(next) {
      if (disposed) return;
      const localeChanged = context.value.locale !== next.locale;
      context.value = {...next};
      controller.update(next);
      if (localeChanged) copy.refresh();
    },
    dispose,
    navigationImpact: controller.navigationImpact,
  };
}

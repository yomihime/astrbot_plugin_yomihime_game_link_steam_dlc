import {createApp, h, shallowRef} from 'vue';
import {UiProvider, PageHeader, SettingsLayout, Surface, SettingsGroup, StatusHint, FormField, FormGrid, ActionBar} from '@game-link/ui';
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
  const moduleId = options.context.owner.startsWith('steam_dlc/')
    ? options.context.owner.slice('steam_dlc/'.length) : '';
  const module = MODULES[moduleId];
  const settings = options.routeId === 'settings';
  const home = options.routeId === 'home';
  const hasCredentials = settings && ['steam', 'dota2', 'cs2'].includes(moduleId);
  const workspaceTitle = options.routeId === 'collage' ? '游戏生涯拼图' : options.routeId === 'wishlist' ? '公开愿望单' : options.routeId === 'analysis' ? '指定玩家分析' : options.routeId === 'query' ? '平台查询' : '';
  let host, credentialHost, controller, disposed = false, unregister = () => {};
  const fieldApps = [];
  const presentation = {
    actions(container) {
      const children = [...container.childNodes];
      const app = createApp({setup: () => () => h(ActionBar, {}, {default: () => h('div', {style: {display: 'contents'}, ref: element => {
        if (element) for (const child of children) if (child.parentNode !== element) element.append(child);
      }})})});
      app.mount(container); fieldApps.push(app);
    },
    grid(parent, before) {
      const mount = container.ownerDocument.createElement('div');
      parent.insertBefore(mount, before || null);
      let target;
      const app = createApp({setup: () => () => h(FormGrid, {columns: settings ? 1 : 2}, {default: () => h('div', {style: {display: 'contents'}, ref: element => {target = element;}})})});
      app.mount(mount); fieldApps.push(app);
      return target;
    },
    field(parent, {control, reset, label, hint, error}) {
      const mount = container.ownerDocument.createElement('div');
      parent.append(mount);
      const hintText = shallowRef(hint.textContent), errorText = shallowRef(error.textContent);
      const app = createApp({setup: () => () => h(FormField, {
        controlId: control.id, label: label.textContent, hint: hintText.value, error: errorText.value, layout: settings ? 'row' : 'stacked',
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
        hint: {get textContent() {return hintText.value;}, set textContent(value) {hintText.value = value;}},
        error: {get textContent() {return errorText.value;}, set textContent(value) {errorText.value = value;}},
      };
    },
  };
  // Vue owns the stable host, while the imperative controller owns its children.
  // A context update patches the provider and never remounts the form subtree.
  const app = createApp({setup: () => () => h(UiProvider, {
    theme: context.value.theme, locale: context.value.locale, styleMountTarget: container,
  }, {default: () => h('section', {class: 'steam-dlc-view', lang: context.value.locale}, [
    home ? h(Surface, {title: module?.title || '模块页面不可用', eyebrow: `${module?.title?.toUpperCase() || 'STEAM DLC'} / MODULE`}, {default: () => [
      artworkNode(moduleId, container.ownerDocument),
      h('p', module?.summary || '当前页面没有可用的模块声明。'),
      h(StatusHint, {}, {default: () => '请从模块导航选择查询，或进入业务配置调整设置。'}),
      h('div', {ref: element => { host = element; }}),
      h('details', {class: 'steam-dlc-disclosure'}, [
        h('summary', '数据来源与范围'),
        h('p', {class: 'steam-dlc-hint'}, module?.source || ''),
        h('p', {class: 'steam-dlc-hint'}, '默认账号只在已授权的命令路径使用。自然语言工具必须提供明确账号或比赛编号。'),
      ]),
    ]}) : [
    !settings ? h(PageHeader, {
      title: module ? `${module.title}${workspaceTitle ? ` ${workspaceTitle}` : ''}` : '模块页面不可用',
      eyebrow: 'YOMIHIME GAME LINK / STEAM DLC', subtitle: module?.summary,
    }) : null,
    h(SettingsLayout, {}, {
      default: () => settings ? h('div', {ref: element => { host = element; }}) : h(SettingsGroup, {title: workspaceTitle || '状态与帮助', number: '01'}, {
        default: () => h('div', {ref: element => { host = element; }}),
      }),
      aside: () => h(Surface, {title: hasCredentials ? '来源凭据与授权' : settings ? '设置说明' : '数据与账号', eyebrow: hasCredentials ? 'SOURCE ACCESS' : undefined}, {default: () => [
        h(StatusHint, {}, {default: () => settings
          ? moduleId === 'steam'
            ? '选择公开样本或完整库、布局、时长预设、比例和输出预算。完整库需要可选 Steam Key；是否完整以来源实际返回为准。'
            : moduleId === 'cs2'
              ? '完美授权与 5E Token 仅用于来源请求，玩家查询目标保持独立。二维码需由账号本人亲自确认；离页将停止轮询。'
              : moduleId === 'dota2'
                ? '订阅设置控制当前服务的采集与预算；具体群或私聊订阅通过本人命令管理。OpenDota Key 可选，不会自动扩大请求额度。'
                : '网页浅深主题与命令图片回复主题分别设置。回复主题选项由当前授权配置提供。'
          : module?.source || '当前页面没有可用的模块声明。'}),
        hasCredentials ? h('div', {ref: element => { credentialHost = element; }}) : null,
        h('p', {class: 'steam-dlc-hint'}, settings
          ? '保存后会重新读取并核对结果；冲突或未确认结果需要手动刷新。'
          : '默认账号只在已授权的命令路径使用。自然语言工具必须提供明确账号或比赛编号。'),
      ]}),
    }),
    ],
  ])})});
  app.mount(container);
  presentation.credentialHost = credentialHost;
  controller = mountController(host, {...options, presentation, scope: {
    signal: options.scope.signal, isCurrent: () => options.scope.isCurrent(), onDispose: () => () => {},
  }});
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    controller.dispose();
    fieldApps.splice(0).reverse().forEach(field => field.unmount());
    app.unmount();
    unregister();
  };
  unregister = options.scope.onDispose(dispose);
  return {
    update(next) {
      if (disposed) return;
      controller.update(next);
      context.value = {...next};
    },
    dispose,
    navigationImpact: controller.navigationImpact,
  };
}

import {createApp, h, shallowRef} from 'vue';
import {UiProvider, PageHeader, SettingsLayout, Surface, SettingsGroup, StatusHint} from '@game-link/ui';
import {mountController, MODULES} from './controller.js';

/** Public PageModule contract v1. The controller owns services, CAS and drafts;
 * the shared presentation facade owns layout, theme and locale.
 * @param {HTMLElement} container
 * @param {import('../../../../worktrees/game-link-dlc-support/pages/public-contract').PageOptions} options
 * @returns {import('../../../../worktrees/game-link-dlc-support/pages/public-contract').MountedPage}
 */
export function mount(container, options) {
  const context = shallowRef({...options.context});
  const moduleId = options.context.owner.startsWith('steam_dlc/')
    ? options.context.owner.slice('steam_dlc/'.length) : '';
  const module = MODULES[moduleId];
  const settings = options.routeId === 'settings';
  let host, controller, disposed = false, unregister = () => {};
  // Vue owns the stable host, while the imperative controller owns its children.
  // A context update patches the provider and never remounts the form subtree.
  const app = createApp({setup: () => () => h(UiProvider, {
    theme: context.value.theme, locale: context.value.locale, styleMountTarget: container,
  }, {default: () => h('section', {class: 'steam-dlc-view', lang: context.value.locale}, [
    h(PageHeader, {
      title: module ? `${module.title}${settings ? ' 设置' : ''}` : '模块页面不可用',
      eyebrow: 'YOMIHIME GAME LINK / STEAM DLC',
      subtitle: settings ? '维护本模块的命令输出设置。' : module?.summary,
    }),
    h(SettingsLayout, {}, {
      default: () => h(SettingsGroup, {title: settings ? '回复与输出' : '命令与可用状态', number: '01'}, {
        default: () => h('div', {ref: element => { host = element; }}),
      }),
      aside: () => h(Surface, {title: settings ? '设置说明' : '数据与账号'}, {default: () => [
        h(StatusHint, {}, {default: () => settings
          ? '网页浅深主题与命令图片回复主题分别设置。回复主题选项由当前授权配置提供。'
          : module?.source || '当前页面没有可用的模块声明。'}),
        h('p', {class: 'steam-dlc-hint'}, settings
          ? '保存后会重新读取并核对结果；冲突或未确认结果需要手动刷新。'
          : '默认账号只在已授权的命令路径使用。自然语言工具必须提供明确账号或比赛编号。'),
      ]}),
    }),
  ])})});
  app.mount(container);
  controller = mountController(host, {...options, scope: {
    signal: options.scope.signal, isCurrent: () => options.scope.isCurrent(), onDispose: () => () => {},
  }});
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    controller.dispose();
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

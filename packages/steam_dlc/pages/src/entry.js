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
  const workspaceTitle = options.routeId === 'collage' ? '游戏生涯拼图' : options.routeId === 'query' ? '平台查询' : '';
  let host, controller, disposed = false, unregister = () => {};
  // Vue owns the stable host, while the imperative controller owns its children.
  // A context update patches the provider and never remounts the form subtree.
  const app = createApp({setup: () => () => h(UiProvider, {
    theme: context.value.theme, locale: context.value.locale, styleMountTarget: container,
  }, {default: () => h('section', {class: 'steam-dlc-view', lang: context.value.locale}, [
    h(PageHeader, {
      title: module ? `${module.title}${settings ? ' 设置' : workspaceTitle ? ` ${workspaceTitle}` : ''}` : '模块页面不可用',
      eyebrow: 'YOMIHIME GAME LINK / STEAM DLC',
      subtitle: settings ? '维护查询、输出设置与来源授权。' : module?.summary,
    }),
    h(SettingsLayout, {}, {
      default: () => h(SettingsGroup, {title: settings ? '模块设置与来源' : workspaceTitle || '命令与可用状态', number: '01'}, {
        default: () => h('div', {ref: element => { host = element; }}),
      }),
      aside: () => h(Surface, {title: settings ? '设置说明' : '数据与账号'}, {default: () => [
        h(StatusHint, {}, {default: () => settings
          ? moduleId === 'steam'
            ? '选择公开样本或完整库、布局、时长预设、比例和输出预算。完整库需要可选 Steam Key；是否完整以来源实际返回为准。'
            : moduleId === 'cs2'
              ? '完美授权与 5E Token 仅用于来源请求，玩家查询目标保持独立。二维码需由账号本人亲自确认；离页将停止轮询。'
              : moduleId === 'dota2'
                ? '订阅设置控制当前服务的采集与预算；具体群或私聊订阅通过本人命令管理。OpenDota Key 可选，不会自动扩大请求额度。'
                : '网页浅深主题与命令图片回复主题分别设置。回复主题选项由当前授权配置提供。'
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

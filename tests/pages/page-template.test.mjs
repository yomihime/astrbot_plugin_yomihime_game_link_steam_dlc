import assert from 'node:assert/strict';
import {test} from 'node:test';
import {JSDOM} from 'jsdom';
import {installDOM, mount, runtime} from './source-build.mjs';

const routes = {
  steam: ['home', 'settings', 'collage', 'wishlist'],
  dota2: ['home', 'settings', 'analysis'],
  cs2: ['home', 'settings', 'query'],
  deadlock: ['home', 'settings'],
};
const credential = {steam: 'credential_steam_key', dota2: 'credential_opendota_key', cs2: 'credential_fivee'};
const emptyError = {status: 'error', error: {code: 'upstream_error'}};
const templateChoice = {
  description: '来自已授权配置的选项',
  default: null,
  value_schema: {type: ['string', 'null']},
  choices: [{value: null, label: '继承主题'}, {value: 'fixture', label: '已授权选项'}],
};
const settle = async () => {
  for (let i = 0; i < 16; i++) await Promise.resolve();
  await runtime.nextTick();
};

for (const [moduleId, moduleRoutes] of Object.entries(routes)) {
  for (const routeId of moduleRoutes) {
    test(`${moduleId}/${routeId} mounts the actual Core PageTemplate`, async () => {
      assert.ok(runtime.PageTemplate);
      assert.equal(typeof runtime.uiText, 'function');
      const dom = new JSDOM('<main></main>', {url: 'http://localhost/'});
      installDOM(dom);
      const container = dom.window.document.querySelector('main');
      const context = {owner: `steam_dlc/${moduleId}`, runtimeId: 'template-matrix', epoch: 1,
        boundary: 'offline', theme: 'light', locale: 'zh-CN', available: true};
      const field = credential[moduleId], abort = new AbortController();
      const calls = [];
      const page = mount(container, {context, routeId,
        scope: {signal: abort.signal, isCurrent: () => !abort.signal.aborted, onDispose: () => () => {}},
        services: {
          invoke: async (...args) => {calls.push(args); return emptyError;},
          config: {current: async () => ({
            revision: 1,
            fields: {reply_theme: {state: 'valid', value: null, present: false},
              timezone: {state: 'valid', value: 'UTC', present: false}},
            descriptors: {reply_theme: templateChoice,
              timezone: {description: '输出时区', value_schema: {type: 'string'}, default: 'UTC'}},
          })},
          credentials: {status: async () => ({revision: 1,
            fields: field ? {[field]: {configured: false, decryptable: false, upstream: 'unverified'}} : {}})},
        },
      });
      try {
        await settle();
        const root = container.querySelector('.ui-page-template');
        assert.ok(root?.querySelector('.ui-page-header h2'));
        assert.ok(root.querySelector('.ui-settings-main .ui-group-heading h3'));
        if (routeId === 'home') {
          assert.equal(root.querySelector('form'), null);
          const logo = root.querySelector('svg.steam-dlc-module-mark');
          assert.ok(logo?.querySelector('path'));
          assert.equal(logo.getAttribute('aria-hidden'), 'true');
          assert.ok(root.querySelector('button[data-action=refresh]'));
        } else {
          const form = root.querySelector('.ui-settings-main > form');
          assert.ok(form?.noValidate);
          assert.equal(root.querySelectorAll('form').length, 1);
          assert.equal(form.querySelectorAll('button[type=submit]').length, 1);
          if (routeId === 'settings') {
            const control = form.querySelector('select[name=reply_theme]');
            assert.match(control.id, /^ygl-/);
            assert.equal(control.labels[0].htmlFor, control.id);
            assert.deepEqual([...control.options].map(option => [option.value, option.textContent]), [['0', '继承主题'], ['1', '已授权选项']]);
            for (const action of ['save', 'refresh', 'discard']) {
              assert.equal(form.querySelector(`button[data-action=${action}]`).textContent, runtime.uiText(action, context.locale));
            }
            if (field) {
              const secret = root.querySelector(`.ui-settings-aside input[name=${field}]`);
              assert.equal(secret.type, 'password');
              assert.equal(secret.form, null);
            }
            control.focus();
            page.update({...context, locale: 'en-US', theme: 'dark'});
            await settle();
            assert.equal(form.querySelector('select[name=reply_theme]'), control);
            assert.equal(dom.window.document.activeElement, control);
            assert.equal(form.querySelector('button[data-action=save]').textContent, runtime.uiText('save', 'en-US'));
          } else {
            assert.equal(form.querySelector('button[type=submit]').dataset.action, 'query');
            const account = form.querySelector(`#steam-dlc-${moduleId}-${routeId}-account`);
            assert.equal(account.labels[0].htmlFor, account.id);
            const result = root.querySelector('.steam-dlc-public-result');
            assert.ok(result && !form.contains(result));
            assert.ok(calls.every(([, parameters]) => !Object.keys(parameters).length));
          }
        }
      } finally {
        page.dispose();
        dom.window.close();
      }
    });
  }
}

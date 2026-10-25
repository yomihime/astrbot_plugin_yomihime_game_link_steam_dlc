import {test} from 'node:test';
import assert from 'node:assert/strict';
import {posix, resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {buildPage, defaultCore, modules, projectedEntry, runtimeImport} from '../../scripts/build_pages.mjs';

// REQ-04/06/08: this matrix comes from required published product entries,
// independently of the generator's current list and direct mount fixtures.
const requiredPageRoutes = {
  steam: {home: 'wall_cache_status', settings: null, collage: 'wall_preview', wishlist: 'wishlist_explicit'},
  dota2: {home: 'status', settings: null, analysis: 'analyze_explicit'},
  cs2: {home: 'status', settings: null, query: 'query'},
  deadlock: {home: 'status', settings: null},
};
function assertPublishedRoutes(manifest) {
  assert.deepEqual(manifest.modules.map(module => module.module_id).sort(), Object.keys(requiredPageRoutes).sort());
  for (const module of manifest.modules) {
    const expected = requiredPageRoutes[module.module_id];
    assert.deepEqual(Object.fromEntries(module.pages.map(page => [page.route_id, page.capability_id ?? null])), expected,
      `${module.module_id} must publish every required route with its exact capability`);
    assert.equal(module.pages.length, Object.keys(expected).length, 'no duplicate published routes');
    for (const page of module.pages) {
      assert.equal(page.access, 'public_web');
      assert.equal(page.role, page.route_id === 'home' ? 'home' : page.route_id === 'settings' ? 'config' : 'aux');
      assert.equal(page.entry, `pages/${module.module_id}/entry.js`);
      assert.deepEqual(page.styles, [`pages/${module.module_id}/style.css`]);
      if (!page.capability_id) continue;
      const capability = module.capabilities.find(item => item.capability_id === page.capability_id);
      assert.ok(capability, 'published capability must be declared');
      assert.equal(capability.effect, 'read_only');
      assert.equal(capability.privacy_floor ?? 'public', 'public');
      const origins = capability.invocation_origins ?? {
        command_only: ['command'], command_and_public_web: ['command', 'web_public'],
        natural_language_allowed: ['command', 'llm_tool'],
      }[capability.invocation_policy];
      assert.ok(origins.includes('web_public'), `${module.module_id}/${page.route_id} must allow public WEB`);
      if (!['wishlist', 'analysis'].includes(page.route_id)) continue;
      assert.equal(capability.invocation_policy, 'natural_language_allowed');
      assert.ok(origins.includes('llm_tool'));
      assert.equal(capability.input_schema.additionalProperties, false);
      assert.deepEqual(capability.input_schema.required, page.route_id === 'wishlist' ? ['account'] : ['match_id', 'account']);
      assert.equal(capability.input_schema.properties.account.type, 'string');
      assert.equal(capability.input_schema.properties.account.minLength, 1);
      assert.deepEqual(Object.keys(capability.input_schema.properties).sort(),
        (page.route_id === 'wishlist' ? ['account', 'page', 'country', 'language'] : ['match_id', 'account', 'refresh']).sort());
      assert.deepEqual(capability.required_sources, page.route_id === 'wishlist' ? ['steam_wishlist', 'steam_browse'] : ['opendota']);
      assert.deepEqual(capability.required_capabilities ?? [], [], 'explicit page must not gain a default identity dependency');
      assert.deepEqual(page.config_fields ?? [], [], 'aux route must not acquire configuration authority');
      assert.deepEqual(page.credential_fields ?? [], [], 'aux route must not acquire credential authority');
    }
  }
}

test('published manifest closes the required module route and public explicit capability matrix', async () => {
  const manifest = JSON.parse(await readFile(new URL('../../packages/steam_dlc/yomihime.manifest.json', import.meta.url), 'utf8'));
  assertPublishedRoutes(manifest);
});

test('published auxiliary descriptors select their real built forms with only the declared capability', async () => {
  const manifest = JSON.parse(await readFile(new URL('../../packages/steam_dlc/yomihime.manifest.json', import.meta.url), 'utf8'));
  assertPublishedRoutes(manifest);
  const code = await buildPage();
  for (const module of manifest.modules) {
    for (const path of new Set(module.pages.flatMap(page => [page.entry, ...page.styles]))) {
      const bytes = await readFile(new URL(`../../packages/steam_dlc/${path}`, import.meta.url));
      assert.equal(createHash('sha256').update(bytes).digest('hex'), module.resources.find(item => item.path === path)?.sha256,
        `${module.module_id}/${path} must match its published resource digest`);
      if (path.endsWith('/entry.js')) assert.equal(bytes.toString('utf8'), code, 'published entry must be the current source build');
    }
  }
  const {JSDOM} = await import('jsdom');
  const {mount, installDOM} = await import('./source-build.mjs');
  for (const module of manifest.modules) {
    for (const descriptor of module.pages.filter(page => ['wishlist', 'analysis'].includes(page.route_id))) {
      const dom = new JSDOM('<!doctype html><main></main>', {url: 'http://localhost/'});
      installDOM(dom);
      const container = dom.window.document.querySelector('main'), calls = [];
      const abort = new AbortController();
      const mounted = mount(container, {
        routeId: descriptor.route_id,
        context: {owner: `${manifest.package_id}/${module.module_id}`, runtimeId: 'published-route-runtime', epoch: 1,
          boundary: 'published-route-boundary', available: true, theme: 'light', locale: 'zh-CN'},
        services: {
          async invoke(id, parameters) {
            // Same selected-capability constraint as Core module-services.ts.
            assert.equal(id, descriptor.capability_id);
            calls.push([id, parameters]);
            return {schema_version: 1, status: 'error', error: {code: 'not_public', message: 'Synthetic source restriction'}};
          },
        },
        scope: {signal: abort.signal, isCurrent: () => !abort.signal.aborted, onDispose: () => () => {}},
        onNavigationStateChange() {},
      });
      try {
        assert.ok(container.querySelector('[name=account]'), 'published route must mount its explicit account form');
        assert.doesNotMatch(container.textContent, /该页面入口未声明/);
        assert.equal(calls.length, 0, 'no automatic account lookup or query');
        container.querySelector('[name=account]').value = '123';
        if (descriptor.route_id === 'analysis') container.querySelector('[name=match_id]').value = '12345';
        container.querySelector('form').dispatchEvent(new dom.window.Event('submit', {bubbles: true, cancelable: true}));
        for (let i = 0; i < 16; i++) await Promise.resolve();
        assert.deepEqual(calls, descriptor.route_id === 'wishlist'
          ? [['wishlist_explicit', {account: '123', country: 'CN', language: 'schinese', page: 1}]]
          : [['analyze_explicit', {match_id: '12345', account: '123', refresh: false}]]);
      } finally {mounted.dispose(); dom.window.close();}
    }
  }
});

test('build tooling accepts absolute and repository-relative CI Core roots', () => {
  const moduleURL = new URL('../../scripts/build_pages.mjs', import.meta.url);
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const inspect = value => execFileSync(process.execPath, ['--input-type=module', '-e',
    `const {defaultCore} = await import(${JSON.stringify(moduleURL.href)}); process.stdout.write(defaultCore);`,
  ], {encoding: 'utf8', env: {...process.env, YGL_CORE_ROOT: value}});
  assert.equal(inspect(defaultCore), defaultCore);
  assert.equal(inspect('.ci-core'), resolve(root, '.ci-core'));
});

test('external fixed-pair paths resolve every module import to the sole shell runtime', async () => {
  const manifest = await readFile(new URL('../../packages/steam_dlc/yomihime.manifest.json', import.meta.url));
  const digest = createHash('sha256').update(manifest).digest('hex');
  const code = await buildPage();
  const imports = [...code.matchAll(/from\s*["']([^"']+)["']/g)].map(match => match[1]);
  assert.ok(imports.length > 0);
  assert.equal(new Set(imports).size, 1);
  for (const moduleId of modules) {
    const projected = projectedEntry(moduleId, digest);
    assert.equal(projected, `module-assets/steam_dlc/${moduleId}/pages/p${digest}/pages/${moduleId}/entry.js`);
    assert.equal(imports[0], runtimeImport(moduleId, digest));
    assert.equal(posix.normalize(posix.join(posix.dirname(projected), imports[0])), 'runtime.js');
    assert.equal(runtimeImport(moduleId, digest), '../../../../../../../runtime.js');
  }
  assert.match(code, /UiProvider/);
  assert.doesNotMatch(code, /createRenderer|createHydrationRenderer|frontend\/src|node_modules|Naive UI/);
});

test('page source consumes the public facade and does not copy themes or import Core internals', async () => {
  const source = await readFile(new URL('../../packages/steam_dlc/pages/src/entry.js', import.meta.url), 'utf8');
  const controller = await readFile(new URL('../../packages/steam_dlc/pages/src/controller.js', import.meta.url), 'utf8');
  const css = await readFile(new URL('../../packages/steam_dlc/pages/style.css', import.meta.url), 'utf8');
  assert.match(source, /from '@game-link\/ui'/);
  assert.doesNotMatch(source + controller, /frontend\/src|HostBridge|isDark|matchMedia|localStorage|fetch\(/);
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|--ui-[a-z-]+\s*:/i);
});

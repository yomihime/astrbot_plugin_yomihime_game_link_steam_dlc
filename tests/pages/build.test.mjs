import {test} from 'node:test';
import assert from 'node:assert/strict';
import {posix, resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {buildPage, defaultCore, modules, projectedEntry, runtimeImport} from '../../scripts/build_pages.mjs';

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

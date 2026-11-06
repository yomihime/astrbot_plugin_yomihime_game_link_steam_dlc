import {resolve, dirname, posix} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {lstat, mkdir, readFile, realpath, writeFile} from 'node:fs/promises';
import {moduleAppearance} from '../packages/steam_dlc/pages/src/appearance.js';
import manifest from '../packages/steam_dlc/yomihime.manifest.json' with {type: 'json'};
import steamZhCN from '../packages/steam_dlc/pages/src/locales/steam/zh-CN.json' with {type: 'json'};
import steamZhTW from '../packages/steam_dlc/pages/src/locales/steam/zh-TW.json' with {type: 'json'};
import steamJaJP from '../packages/steam_dlc/pages/src/locales/steam/ja-JP.json' with {type: 'json'};
import steamEnUS from '../packages/steam_dlc/pages/src/locales/steam/en-US.json' with {type: 'json'};
import dota2ZhCN from '../packages/steam_dlc/pages/src/locales/dota2/zh-CN.json' with {type: 'json'};
import dota2ZhTW from '../packages/steam_dlc/pages/src/locales/dota2/zh-TW.json' with {type: 'json'};
import dota2JaJP from '../packages/steam_dlc/pages/src/locales/dota2/ja-JP.json' with {type: 'json'};
import dota2EnUS from '../packages/steam_dlc/pages/src/locales/dota2/en-US.json' with {type: 'json'};
import cs2ZhCN from '../packages/steam_dlc/pages/src/locales/cs2/zh-CN.json' with {type: 'json'};
import cs2ZhTW from '../packages/steam_dlc/pages/src/locales/cs2/zh-TW.json' with {type: 'json'};
import cs2JaJP from '../packages/steam_dlc/pages/src/locales/cs2/ja-JP.json' with {type: 'json'};
import cs2EnUS from '../packages/steam_dlc/pages/src/locales/cs2/en-US.json' with {type: 'json'};
import deadlockZhCN from '../packages/steam_dlc/pages/src/locales/deadlock/zh-CN.json' with {type: 'json'};
import deadlockZhTW from '../packages/steam_dlc/pages/src/locales/deadlock/zh-TW.json' with {type: 'json'};
import deadlockJaJP from '../packages/steam_dlc/pages/src/locales/deadlock/ja-JP.json' with {type: 'json'};
import deadlockEnUS from '../packages/steam_dlc/pages/src/locales/deadlock/en-US.json' with {type: 'json'};

const catalogs = {
  steam: {'zh-CN': steamZhCN, 'zh-TW': steamZhTW, 'ja-JP': steamJaJP, 'en-US': steamEnUS},
  dota2: {'zh-CN': dota2ZhCN, 'zh-TW': dota2ZhTW, 'ja-JP': dota2JaJP, 'en-US': dota2EnUS},
  cs2: {'zh-CN': cs2ZhCN, 'zh-TW': cs2ZhTW, 'ja-JP': cs2JaJP, 'en-US': cs2EnUS},
  deadlock: {'zh-CN': deadlockZhCN, 'zh-TW': deadlockZhTW, 'ja-JP': deadlockJaJP, 'en-US': deadlockEnUS},
};

function requiredCopy(catalog, locale, key, maxLength) {
  const value = catalog[key];
  if (typeof value !== 'string' || !value.trim() || [...value].length > maxLength || /[\p{Cc}\p{Cf}\p{Cs}\p{Zl}\p{Zp}]/u.test(value)) {
    throw Error('Invalid presentation copy: ' + locale + '/' + key);
  }
  return value;
}

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// CI checks out the paired Core separately; local development keeps its worktree.
// Relative environment paths are rooted at this repository, independent of cwd.
export const defaultCore = resolve(root, process.env.YGL_CORE_ROOT || 'worktrees/game-link-dlc-support');
export const modules = ['steam', 'dota2', 'cs2', 'deadlock'];
export const externalModules = ['vue', 'naive-ui', '@game-link/ui'];

export function presentationPath(moduleId) {
  if (!modules.includes(moduleId)) throw Error('Invalid presentation owner');
  return `pages/dist/presentation-${moduleId}.js`;
}

export function buildPresentation(moduleId) {
  presentationPath(moduleId);
  const appearance = moduleAppearance(moduleId);
  const routes = manifest.modules.find(module => module.module_id === moduleId)?.pages.map(page => page.route_id);
  if (!routes?.length || new Set(routes).size !== routes.length) throw Error('Invalid presentation routes: ' + moduleId);
  const copy = Object.fromEntries(Object.entries(catalogs[moduleId]).map(([locale, catalog]) => [
    locale,
    {
      summary: requiredCopy(catalog, locale, 'module.' + moduleId + '.summary', 160),
      titles: Object.fromEntries(routes.map(route => [route, requiredCopy(catalog, locale, 'route.' + route, 256)])),
    },
  ]));
  const comment = '// ygl-copy-v1 ' + JSON.stringify(copy);
  if (Buffer.byteLength(comment) > 16_384) throw Error('Presentation copy exceeds the header limit: ' + moduleId);
  return `${comment}\nexport const presentation = ${JSON.stringify({schemaVersion: 1, appearance})};\n`;
}

async function presentationFileExists(destination) {
  const current = await lstat(destination).catch(error => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  if (!current) return false;
  if (!current.isFile() || current.nlink > 1 || await realpath(destination) !== destination) {
    throw Error('Presentation output must be a regular unshared file at its declared path');
  }
  return true;
}

async function writePresentation(destination, code) {
  const directory = dirname(destination);
  const parent = dirname(directory);
  if (await realpath(parent) !== parent) throw Error('Presentation output parent is not a direct path');
  await mkdir(directory, {recursive: true});
  if (await realpath(directory) !== directory) throw Error('Presentation output directory is not a direct path');
  await presentationFileExists(destination);
  await writeFile(destination, code);
}

/** Mirrors Core's fixed-pair external projection, not builtin page paths.
 * Digest changes the directory name but not its depth, avoiding a hash cycle. */
export function projectedEntry(moduleId, digest = '0'.repeat(64)) {
  if (!modules.includes(moduleId) || !/^[0-9a-f]{64}$/.test(digest)) throw Error('Invalid projected entry');
  return `module-assets/steam_dlc/${moduleId}/pages/p${digest}/pages/${moduleId}/entry.js`;
}
export function runtimeImport(moduleId, digest) {
  const projected = projectedEntry(moduleId, digest);
  const relative = posix.relative(posix.dirname(projected), 'runtime.js');
  if (posix.normalize(posix.join(posix.dirname(projected), relative)) !== 'runtime.js') throw Error('Runtime projection mismatch');
  return relative;
}

export async function buildPage({coreRoot = defaultCore, moduleId = 'steam', runtimePath = runtimeImport(moduleId)} = {}) {
  const frontend = resolve(coreRoot, 'pages/frontend');
  const {build} = await import(pathToFileURL(resolve(frontend, 'node_modules/vite/dist/node/index.js')).href);
  const result = await build({
    configFile: false, root: frontend, logLevel: 'silent',
    resolve: {alias: {'@game-link/ui': resolve(coreRoot, 'pages/public-ui.ts'), '@game-link/page-contract': resolve(coreRoot, 'pages/public-contract.ts')}},
    plugins: [{
      name: 'steam-dlc-owner-copy',
      enforce: 'pre',
      transform(code, id) {
        if (id.replaceAll('\\', '/').endsWith('/packages/steam_dlc/pages/src/copy.js')) {
          const imports = [...code.matchAll(/^import .* from ['"]\.\/locales\/([a-z0-9]+)\/([^'"]+)['"] with \{type: 'json'\};$/gm)];
          const ownerImports = imports.filter(match => match[1] === moduleId);
          if (ownerImports.length !== 4) throw Error('Owner copy requires exactly four locale resources: ' + moduleId);
          const ownerCatalogs = `const ownerCatalogs = owner => owner === ${JSON.stringify(moduleId)} ? {${ownerImports.map(match => `'${match[2].replace('.json', '')}': ${match[0].match(/^import (\w+)/)[1]}`).join(', ')}} : {};`;
          const withoutCatalogs = code.replace(/^import .* from ['"]\.\/locales\/([^'"]+)['"] with \{type: 'json'\};\r?\n/gm,
            (line, path) => path.startsWith(moduleId + '/') ? line : '')
            .replace(/const ownerCatalogs = owner => \{[\s\S]*?\n\};/, ownerCatalogs);
          if ([...withoutCatalogs.matchAll(/^import .* from ['"]\.\/locales\/([^/]+)\//gm)].some(match => match[1] !== moduleId)) {
            throw Error('Unfiltered locale import in ' + moduleId);
          }
          return withoutCatalogs;
        }
        return null;
      },
    }],
    define: {'process.env.NODE_ENV': JSON.stringify('production'), __VUE_OPTIONS_API__: false, __VUE_PROD_DEVTOOLS__: false, __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false, __DLC_MODULE_ID__: JSON.stringify(moduleId)},
    build: {write: false, sourcemap: false, minify: true,
      lib: {entry: resolve(root, 'packages/steam_dlc/pages/src/entry.js'), formats: ['es'], fileName: () => 'entry.js'},
      rolldownOptions: {external: externalModules, output: {paths: Object.fromEntries(externalModules.map(name => [name, runtimePath]))}},
    },
  });
  const output = (Array.isArray(result) ? result[0] : result).output;
  if (output.length !== 1 || output[0].type !== 'chunk' || !output[0].isEntry) throw Error('Expected one externalized page chunk');
  const chunk = output[0];
  const imports = [...chunk.code.matchAll(/from\s*["']([^"']+)["']/g)].map(match => match[1]);
  if (!imports.length || imports.some(path => path !== runtimePath) || chunk.dynamicImports.length) throw Error('Page must use exactly one shared runtime URL');
  if (Object.keys(chunk.modules).some(id => /node_modules|frontend[\\/]src/.test(id))) throw Error('Shared implementation leaked into module');
  return chunk.code;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--check' && !arg.startsWith('--core-root='))) throw Error('Unknown page build option');
  const coreOptions = args.filter(arg => arg.startsWith('--core-root='));
  if (coreOptions.length > 1) throw Error('Repeated Core build root');
  const coreRoot = coreOptions.length ? resolve(coreOptions[0].slice('--core-root='.length)) : defaultCore;
  const check = args.includes('--check');
  const drift = [];
  const bytes = {};
  for (const moduleId of modules) {
    const code = await buildPage({coreRoot, moduleId});
    bytes[moduleId] = Buffer.byteLength(code);
    if (runtimeImport(moduleId) !== runtimeImport('steam')) throw Error('Unexpected projection depth');
    const destination = resolve(root, `packages/steam_dlc/pages/${moduleId}/entry.js`);
    const current = await readFile(destination, 'utf8').catch(error => { if (error.code === 'ENOENT') return null; throw error; });
    if (current !== code) { drift.push(moduleId); if (!check) await writeFile(destination, code); }
    const path = presentationPath(moduleId);
    const presentation = buildPresentation(moduleId);
    const target = resolve(root, 'packages/steam_dlc', path);
    const existing = await presentationFileExists(target) ? await readFile(target, 'utf8') : null;
    if (existing !== presentation) {
      drift.push(path);
      if (!check) await writePresentation(target, presentation);
    }
  }
  if (check && drift.length) throw Error('Page build drift: ' + drift.join(', '));
  console.log(JSON.stringify({inspection: 'passed', mode: check ? 'check' : 'build', changed: drift, runtimeImport: runtimeImport('steam'), bytes}));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();

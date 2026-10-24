import {resolve, dirname, posix} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {readFile, writeFile} from 'node:fs/promises';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// CI checks out the paired Core separately; local development keeps its worktree.
// Relative environment paths are rooted at this repository, independent of cwd.
export const defaultCore = resolve(root, process.env.YGL_CORE_ROOT || 'worktrees/game-link-dlc-support');
export const modules = ['steam', 'dota2', 'cs2', 'deadlock'];
export const externalModules = ['vue', 'naive-ui', '@game-link/ui'];

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
    define: {'process.env.NODE_ENV': JSON.stringify('production'), __VUE_OPTIONS_API__: false, __VUE_PROD_DEVTOOLS__: false, __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false},
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
  const code = await buildPage({coreRoot});
  const drift = [];
  for (const moduleId of modules) {
    if (runtimeImport(moduleId) !== runtimeImport('steam')) throw Error('Unexpected projection depth');
    const destination = resolve(root, `packages/steam_dlc/pages/${moduleId}/entry.js`);
    const current = await readFile(destination, 'utf8').catch(error => { if (error.code === 'ENOENT') return null; throw error; });
    if (current !== code) { drift.push(moduleId); if (!check) await writeFile(destination, code); }
  }
  if (check && drift.length) throw Error('Page build drift: ' + drift.join(', '));
  console.log(JSON.stringify({inspection: 'passed', mode: check ? 'check' : 'build', changed: drift, runtimeImport: runtimeImport('steam'), bytes: Buffer.byteLength(code)}));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();

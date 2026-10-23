import {JSDOM} from 'jsdom';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {buildPage, defaultCore} from '../../scripts/build_pages.mjs';

const {sourceRuntimeURL} = await import(pathToFileURL(resolve(defaultCore, 'tests/pages/shell/source-build.mjs')).href);

// Vue's browser renderer captures document when its shared runtime is imported.
// Install a real DOM first. Each fixture's nodes retain their own ownerDocument.
const bootstrap = new JSDOM('<!doctype html><main></main>', {pretendToBeVisual: true, url: 'http://localhost/'});
export function installDOM(dom) {
  for (const key of ['window', 'document', 'Element', 'HTMLElement', 'SVGElement', 'Node', 'MutationObserver']) {
    Object.defineProperty(globalThis, key, {configurable: true, writable: true,
      value: key === 'window' ? dom.window : key === 'document' ? dom.window.document : dom.window[key]});
  }
}
installDOM(bootstrap);
const runtimeURL = await sourceRuntimeURL();
const code = await buildPage({runtimePath: './runtime.js'});
export const runtime = await import(runtimeURL);
const source = code.replaceAll('"./runtime.js"', JSON.stringify(runtimeURL)).replaceAll("'./runtime.js'", JSON.stringify(runtimeURL));
let app;
try { app = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64')); }
catch (error) { throw Error('Public facade source import failed: ' + error.message.split('data:text')[0]); }
export const mount = app.mount;

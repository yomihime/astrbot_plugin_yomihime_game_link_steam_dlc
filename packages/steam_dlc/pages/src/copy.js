import steamZhCN from './locales/steam/zh-CN.json' with {type: 'json'};
import steamZhTW from './locales/steam/zh-TW.json' with {type: 'json'};
import steamJaJP from './locales/steam/ja-JP.json' with {type: 'json'};
import steamEnUS from './locales/steam/en-US.json' with {type: 'json'};
import dota2ZhCN from './locales/dota2/zh-CN.json' with {type: 'json'};
import dota2ZhTW from './locales/dota2/zh-TW.json' with {type: 'json'};
import dota2JaJP from './locales/dota2/ja-JP.json' with {type: 'json'};
import dota2EnUS from './locales/dota2/en-US.json' with {type: 'json'};
import cs2ZhCN from './locales/cs2/zh-CN.json' with {type: 'json'};
import cs2ZhTW from './locales/cs2/zh-TW.json' with {type: 'json'};
import cs2JaJP from './locales/cs2/ja-JP.json' with {type: 'json'};
import cs2EnUS from './locales/cs2/en-US.json' with {type: 'json'};
import deadlockZhCN from './locales/deadlock/zh-CN.json' with {type: 'json'};
import deadlockZhTW from './locales/deadlock/zh-TW.json' with {type: 'json'};
import deadlockJaJP from './locales/deadlock/ja-JP.json' with {type: 'json'};
import deadlockEnUS from './locales/deadlock/en-US.json' with {type: 'json'};

const compiledOwner = typeof __DLC_MODULE_ID__ === 'string' ? __DLC_MODULE_ID__ : null;
const ownerCatalogs = owner => {
  switch (owner) {
    case 'steam': return {'zh-CN': steamZhCN, 'zh-TW': steamZhTW, 'ja-JP': steamJaJP, 'en-US': steamEnUS};
    case 'dota2': return {'zh-CN': dota2ZhCN, 'zh-TW': dota2ZhTW, 'ja-JP': dota2JaJP, 'en-US': dota2EnUS};
    case 'cs2': return {'zh-CN': cs2ZhCN, 'zh-TW': cs2ZhTW, 'ja-JP': cs2JaJP, 'en-US': cs2EnUS};
    case 'deadlock': return {'zh-CN': deadlockZhCN, 'zh-TW': deadlockZhTW, 'ja-JP': deadlockJaJP, 'en-US': deadlockEnUS};
    default: return {};
  }
};
// A literal build-time module ID lets the production bundler discard every
// unrelated owner catalog. Source-only legacy helpers keep all four owners.
const catalogs = compiledOwner ? ownerCatalogs(compiledOwner) : null;

function localeTag(locale) {
  const language = typeof locale === 'string' ? locale.replaceAll('_', '-').toLowerCase() : '';
  if (/^zh-(?:hant(?:-|$)|tw(?:-|$)|hk(?:-|$)|mo(?:-|$))/.test(language)) return 'zh-TW';
  if (/^ja(?:-|$)/.test(language)) return 'ja-JP';
  if (/^en(?:-|$)/.test(language)) return 'en-US';
  return 'zh-CN';
}

/** Local fallback for an older presentation runtime. Catalogs are owner scoped. */
export function fallbackText(catalogs, locale, key, params = {}) {
  const catalog = catalogs?.[localeTag(locale)];
  const fallback = catalogs?.['zh-CN'];
  const message = catalog && Object.hasOwn(catalog, key) ? catalog[key]
    : fallback && Object.hasOwn(fallback, key) ? fallback[key] : key;
  return message.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, (token, name) =>
    Object.hasOwn(params, name) ? String(params[name]) : token);
}

function selectedOwner(moduleId) {
  return compiledOwner || moduleId;
}

/** Legacy direct helper. Callers with a module-specific label pass its owner. */
export function dlcText(key, params, locale = 'zh-CN', moduleId = compiledOwner || 'steam') {
  return fallbackText(catalogs || ownerCatalogs(selectedOwner(moduleId)), locale, key, params);
}

export function createPageCopy(readLocale, translate = fallbackText, moduleId = compiledOwner || 'steam') {
  const pageCatalogs = catalogs || ownerCatalogs(selectedOwner(moduleId));
  const bindings = new Map();
  let newBindings = 0;
  const prune = () => {
    for (const element of bindings.keys()) if (element.isConnected === false) bindings.delete(element);
  };
  const textAt = (locale, key, params) => translate(pageCatalogs, locale, key, params);
  const text = (key, params) => textAt(readLocale(), key, params);
  return {
    text,
    textAt,
    bind(element, render, property = 'textContent') {
      element[property] = render();
      let properties = bindings.get(element);
      if (!properties) {
        // Drop prior result rows without waiting for the next locale change.
        if (++newBindings % 256 === 0) queueMicrotask(prune);
        bindings.set(element, properties = new Map());
      }
      properties.set(property, render);
      return () => {
        if (properties.get(property) === render) properties.delete(property);
        if (!properties.size) bindings.delete(element);
      };
    },
    renderer(element, property = 'textContent') {
      return bindings.get(element)?.get(property) || (() => element[property]);
    },
    refresh() {
      prune();
      for (const [element, properties] of bindings) {
        for (const [property, render] of properties) element[property] = render();
      }
    },
    clear() { bindings.clear(); },
  };
}

import {primaryForm} from './template-adapter.js';
export function mountWishlistForm(root, {options, active, field, say}) {
  const document = root.ownerDocument, cleanups = [];
  let generation = 0, disposed = false, pending = false, page = 1, pages = 1;
  const {text: t, bind} = options.copy;
  const copy = (key, params) => () => t(`wishlist.${key}`, params);
  const publicKey = Symbol();
  const problem = key => Object.assign(Error(key), {[publicKey]: key});
  const node = (tag, text) => {const value = document.createElement(tag); if (text) bind(value, text); return value;};
  const listen = (target, type, callback) => {target.addEventListener(type, callback); cleanups.push(() => target.removeEventListener(type, callback));};
  const primary = primaryForm(root, options, {id: 'wishlist-query', label: copy('query')});
  const {body: form, actions} = primary, grid = options.presentation?.grid(form) || form;
  const account = field(grid, 'account', copy('account'));
  const country = field(grid, 'country', copy('region'), null, 'CN');
  const language = field(grid, 'language', copy('language'), null, 'schinese');
  const previous = node('button', copy('previous')), next = node('button', copy('next'));
  for (const [button, name] of [[previous, 'wishlist-previous'], [next, 'wishlist-next']]) {button.type = 'button'; button.className = 'ui-button'; button.dataset.action = name; button.disabled = true;}
  actions.append(previous, next); form.append(actions);
  const results = node('section'); results.className = 'steam-dlc-public-result'; results.setAttribute('aria-live', 'polite');
  const sync = () => {
    const unavailable = disposed || !active();
    primary.sync(unavailable, pending);
    previous.disabled = unavailable || pending || page <= 1; next.disabled = unavailable || pending || page >= pages;
    for (const input of form.querySelectorAll('input,select')) input.disabled = disposed || !active();
  };
  const run = async requested => {
    if (!active() || disposed || pending) return;
    const parameters = {account: account.value.trim(), country: country.value.trim().toUpperCase(), language: language.value.trim(), page: requested};
    if (!parameters.account) {say(copy('accountRequired'), 'error'); return;}
    const ticket = ++generation; pending = true; sync();
    try {
      const response = await options.services.invoke('wishlist_explicit', parameters);
      if (disposed || !active() || ticket !== generation) return;
      if (response?.status === 'error') {
        const codes = ['not_public', 'rate_limited', 'upstream_error', 'unparsed', 'parameter_error', 'module_unavailable'];
        const code = response.error?.code;
        throw problem(codes.includes(code) ? `error.${code}` : 'sourceUnavailable');
      }
      const data = response?.document?.blocks?.find(block => block?.kind === 'fields' && block.fields?.wishlist)?.fields.wishlist;
      if (!data || !Array.isArray(data.items) || data.items.length > 20 || !Number.isSafeInteger(data.pages) || data.page !== requested) throw Error('wishlist_result_invalid');
      page = data.page; pages = data.pages; results.replaceChildren(node('p', () => t('wishlist.summary', {
        total: data.total, page: data.page, pages: data.pages, region: data.region,
        fetchedAt: data.fetched_at, storeFetchedAt: data.store_fetched_at || t('wishlist.notFetched'),
      })));
      for (const item of data.items) {
        const row = node('article'), title = node('a', () => t('wishlist.itemTitle', {name: item.name || t('wishlist.nameUnavailable'), appId: item.app_id}));
        // Construct the official link from validated numeric AppID only.
        if (!/^[1-9][0-9]*$/u.test(item.app_id)) throw Error('wishlist_app_id_invalid');
        title.href = `https://store.steampowered.com/app/${item.app_id}/`; title.target = '_blank'; title.rel = 'noopener noreferrer';
        const addedAt = new Date(item.date_added * 1000).toISOString();
        const priceStates = ['free', 'unreleased', 'no_local_price', 'region_locked', 'region_or_store_unavailable', 'fetch_failed'];
        const releaseStates = ['unreleased', 'released'];
        row.append(title, node('p', () => t('wishlist.itemDetails', {
          addedAt,
          price: item.price || t(`wishlist.price.${priceStates.includes(item.price_state) ? item.price_state : 'unknown'}`),
          currency: item.currency || t('wishlist.notProvided'),
          discount: item.discount_percent == null ? t('wishlist.unknown') : `${item.discount_percent}%`,
          release: t(`wishlist.release.${releaseStates.includes(item.release_state) ? item.release_state : 'unknown'}`),
        }))); results.append(row);
      }
      if (data.state === 'empty') results.append(node('p', copy('empty')));
      if (data.enrichment_failed) results.append(node('p', copy('enrichmentFailed')));
      previous.disabled = page <= 1; next.disabled = page >= pages;
    } catch (error) {if (!disposed && active() && ticket === generation) {results.replaceChildren(node('p', copy(error?.[publicKey] || 'requestFailed'))); say(copy('queryFailed'), 'error');}}
    finally {if (!disposed && ticket === generation) {pending = false; sync();}}
  };
  cleanups.push(primary.bind(() => run(1)));
  listen(previous, 'click', () => {if (page > 1) void run(page - 1);});
  listen(next, 'click', () => {if (page < pages) void run(page + 1);});
  root.append(node('p', copy('description')), ...(options.presentation?.template ? [] : [node('h3', copy('filters'))]), form);
  primary.result(node('h3', copy('results')), results);
  options.presentation?.actions(actions);
  sync();
  return {
    setAvailable() {if (disposed) return; generation += 1; pending = false; page = 1; pages = 1; results.replaceChildren(); sync();},
    dispose() {if (disposed) return; disposed = true; generation += 1; pending = false; results.replaceChildren(); sync(); cleanups.splice(0).forEach(remove => remove());},
  };
}

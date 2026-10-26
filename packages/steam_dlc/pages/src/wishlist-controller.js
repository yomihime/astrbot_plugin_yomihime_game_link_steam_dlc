export function mountWishlistForm(root, {options, active, field, say}) {
  const document = root.ownerDocument, cleanups = [];
  let generation = 0, disposed = false, pending = false, page = 1, pages = 1;
  const problem = message => Object.assign(Error(message), {publicMessage: message});
  const node = (tag, text) => {const value = document.createElement(tag); if (text !== undefined) value.textContent = text; return value;};
  const listen = (target, type, callback) => {target.addEventListener(type, callback); cleanups.push(() => target.removeEventListener(type, callback));};
  const form = node('form'), grid = options.presentation?.grid(form) || form;
  const account = field(grid, 'account', 'SteamID64 / Dota ID32（明确账号）');
  const country = field(grid, 'country', '地区', null, 'CN');
  const language = field(grid, 'language', 'Steam语言', null, 'schinese');
  const actions = node('div'); actions.className = 'steam-dlc-actions';
  const submit = node('button', '读取愿望单'); submit.type = 'submit'; submit.className = 'ui-button'; submit.dataset.action = 'wishlist-query';
  const previous = node('button', '上一页'), next = node('button', '下一页');
  for (const [button, name] of [[previous, 'wishlist-previous'], [next, 'wishlist-next']]) {button.type = 'button'; button.className = 'ui-button'; button.dataset.action = name; button.disabled = true;}
  actions.append(submit, previous, next); form.append(actions);
  const results = node('section'); results.className = 'steam-dlc-public-result'; results.setAttribute('aria-live', 'polite');
  const sync = () => {
    submit.disabled = disposed || !active() || pending;
    previous.disabled = submit.disabled || page <= 1; next.disabled = submit.disabled || page >= pages;
    form.setAttribute('aria-busy', String(pending));
    for (const input of form.querySelectorAll('input,select')) input.disabled = disposed || !active();
  };
  const run = async requested => {
    if (!active() || disposed || pending) return;
    const parameters = {account: account.value.trim(), country: country.value.trim().toUpperCase(), language: language.value.trim(), page: requested};
    if (!parameters.account) {say('请提供明确账号。', 'error'); return;}
    const ticket = ++generation; pending = true; sync();
    try {
      const response = await options.services.invoke('wishlist_explicit', parameters);
      if (disposed || !active() || ticket !== generation) return;
      if (response?.status === 'error') {
        const errors = {not_public: '愿望单未公开或来源受限，请确认公开设置后重试。', rate_limited: '愿望单来源限流，请稍后重试。', upstream_error: '愿望单来源请求失败，请稍后重试。', unparsed: '愿望单来源结构无法验证，请稍后重试。', parameter_error: '请检查账号、地区、语言或页码。', module_unavailable: '愿望单服务或本次授权暂不可用。'};
        throw problem(errors[response.error?.code] || '愿望单来源暂不可用，请稍后重试。');
      }
      const data = response?.document?.blocks?.find(block => block?.kind === 'fields' && block.fields?.wishlist)?.fields.wishlist;
      if (!data || !Array.isArray(data.items) || data.items.length > 20 || !Number.isSafeInteger(data.pages) || data.page !== requested) throw Error('愿望单结果无法验证。');
      page = data.page; pages = data.pages; results.replaceChildren(node('p', `共${data.total}项 · 第${page}/${pages}页 · 地区${data.region} · 愿望单来源时间${data.fetched_at} · 商店补全时间${data.store_fetched_at || '未取得'}`));
      for (const item of data.items) {
        const row = node('article'), title = node('a', `${item.name || '名称未提供'} · AppID ${item.app_id}`);
        // Construct the official link from validated numeric AppID only.
        if (!/^[1-9][0-9]*$/u.test(item.app_id)) throw Error('愿望单AppID无法验证。');
        title.href = `https://store.steampowered.com/app/${item.app_id}/`; title.target = '_blank'; title.rel = 'noopener noreferrer';
        const priceStates = {free: '免费', unreleased: '未发售', no_local_price: '本地区未提供价格', region_locked: '来源明确标记地区受限', region_or_store_unavailable: '商店或地区不可用', fetch_failed: '商店补全失败'};
        const releases = {unreleased: '未发售', released: '已发售', unknown: '发售状态未知'};
        row.append(title, node('p', `添加：${new Date(item.date_added * 1000).toISOString()} · ${item.price || priceStates[item.price_state] || '价格未知'} · 币种${item.currency || '未提供'} · 折扣${item.discount_percent ?? '未知'}% · ${releases[item.release_state] || '发售状态未知'}`)); results.append(row);
      }
      if (data.state === 'empty') results.append(node('p', '来源返回的本次公开愿望单为空。'));
      if (data.enrichment_failed) results.append(node('p', '愿望单已读取；当前页商店补全失败，未将缺失价格视为免费。'));
      previous.disabled = page <= 1; next.disabled = page >= pages;
    } catch (error) {if (!disposed && active() && ticket === generation) {results.replaceChildren(node('p', error.publicMessage || '愿望单请求未完成，请稍后重试。')); say('愿望单查询未完成。', 'error');}}
    finally {if (!disposed && ticket === generation) {pending = false; sync();}}
  };
  listen(form, 'submit', event => {event.preventDefault(); void run(1);});
  listen(previous, 'click', () => {if (page > 1) void run(page - 1);});
  listen(next, 'click', () => {if (page < pages) void run(page + 1);});
  root.append(node('p', '匿名读取第一方公开愿望单，每页20项，仅补全当前页商店资料。私有、空单、限流与请求失败分别报告。'), form, results);
  options.presentation?.actions(actions);
  sync();
  return {
    setAvailable() {if (disposed) return; generation += 1; pending = false; page = 1; pages = 1; results.replaceChildren(); sync();},
    dispose() {if (disposed) return; disposed = true; generation += 1; pending = false; results.replaceChildren(); sync(); cleanups.splice(0).forEach(remove => remove());},
  };
}

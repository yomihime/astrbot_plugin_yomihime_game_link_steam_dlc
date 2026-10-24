// Explicit public focus facts only. Host model generation remains COMMAND-only.
export function mountAnalysisForm(root, {options, active, field, renderResult, say}) {
  const document = root.ownerDocument, listeners = [];
  let disposed = false, generation = 0, busy = false;
  const node = (tag, text) => {const value = document.createElement(tag); if (text !== undefined) value.textContent = text; return value;};
  const form = node('form'), grid = options.presentation?.grid(form) || form;
  const match = field(grid, 'match_id', '比赛ID'); match.maxLength = 20; match.inputMode = 'numeric';
  const account = field(grid, 'account', '焦点玩家（Dota ID32 / SteamID64 / 本场唯一昵称）');
  const refresh = field(grid, 'refresh', '来源缓存', ['false', 'true'], 'false');
  refresh.options[0].textContent = '优先有效缓存'; refresh.options[1].textContent = '刷新公开来源';
  const submit = node('button', '查看指定玩家分析'); submit.type = 'submit'; submit.className = 'ui-button'; submit.dataset.variant = 'primary'; submit.dataset.action = 'analysis-query';
  const actions = node('div'); actions.className = 'steam-dlc-actions'; actions.append(submit); form.append(actions);
  const result = node('section'); result.className = 'steam-dlc-public-result'; result.setAttribute('aria-live', 'polite');
  const run = async event => {
    event.preventDefault(); if (!active() || disposed || busy) return;
    const parameters = {match_id: match.value.trim(), account: account.value.trim(), refresh: refresh.value === 'true'};
    if (!/^[1-9][0-9]{0,19}$/u.test(parameters.match_id) || !parameters.account) {say('请提供有效比赛ID和明确焦点玩家。', 'error'); return;}
    const ticket = ++generation; busy = true; submit.disabled = true; result.replaceChildren(node('p', '正在读取公开结算与可用时间线。'));
    try {
      const response = await options.services.invoke('analyze_explicit', parameters);
      if (disposed || !active() || ticket !== generation) return;
      renderResult(response, result);
      const facts = response.model_facts;
      if (!facts || typeof facts !== 'object') return;
      const coverage = {settlement_only: '仅基础结算', partial: '部分分析段可用', supported_sections_complete: '支持的分析段已提供'};
      result.prepend(node('p', `数据覆盖：${coverage[facts.data_completeness] || '待确认'}。本页展示确定性分析与公开事实；不会调用Host模型。`));
      const metric = value => typeof value === 'number' && Number.isFinite(value) ? String(value) : '未知';
      const focus = facts.focus || {};
      const accountId = typeof focus.account_id32 === 'string' && /^[0-9]+$/u.test(focus.account_id32) ? focus.account_id32 : metric(focus.account_id32);
      result.append(node('p', `焦点：${typeof focus.name === 'string' ? focus.name : '名称未提供'} · ID32 ${accountId} · 英雄${metric(focus.hero_id)} · K/D/A ${metric(focus.kills)}/${metric(focus.deaths)}/${metric(focus.assists)}`));
      for (const [key, label] of [['missing_sections', '缺失分析段'], ['missing_fields', '缺失字段'], ['truncated_sections', '来源截断段']]) {
        const values = facts[key];
        if (Array.isArray(values)) result.append(node('p', `${label}：${values.filter(value => typeof value === 'string').slice(0, 32).join('、') || '未列出'}。`));
      }
      result.append(node('p', `来源：${typeof facts.source === 'string' ? facts.source : '未提供'} · 获取时间：${typeof facts.fetched_at === 'string' ? facts.fetched_at : '未提供'}。缺失段保持未知，不补成0或完整时间线。`));
    } catch {if (!disposed && active() && ticket === generation) {result.replaceChildren(node('p', '分析请求未完成，请核对比赛与焦点后重试。')); say('未取得可确认的分析结果。', 'error');}}
    finally {busy = false; if (!disposed && active() && ticket === generation) submit.disabled = false;}
  };
  form.addEventListener('submit', run); listeners.push(() => form.removeEventListener('submit', run));
  root.append(node('p', '按明确比赛与玩家读取OpenDota公开事实。未收录的时间线、装备、团战或目标保持未知，不提交录像解析。'), form, result);
  options.presentation?.actions(actions);
  return {dispose() {if (disposed) return; disposed = true; generation += 1; result.replaceChildren(); listeners.splice(0).forEach(remove => remove());}};
}

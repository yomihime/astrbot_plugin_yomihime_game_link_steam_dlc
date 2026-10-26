// Explicit public focus facts only. Host model generation remains COMMAND-only.
import {metric} from './metric.js';
const ANALYSIS_LABELS = {"timeline": "发育时间线", "purchases": "购买时间线", "lane": "对线位置", "teamfights": "团战", "objectives": "目标事件", "team_advantage": "团队经济/经验差", "benchmarks": "表现基准", "players": "玩家名单", "invalid_player": "无效玩家记录", "gold_t": "经济时间线", "xp_t": "经验时间线", "team_gold": "团队经济差", "team_xp": "团队经验差", "teamfight_players": "团战玩家记录", "account_id32": "玩家账号", "player_slot": "玩家位置", "name": "玩家名称", "hero_id": "英雄", "team": "阵营", "outcome": "胜负", "kills": "击杀", "deaths": "死亡", "assists": "助攻", "last_hits": "补刀", "denies": "反补", "gold_per_min": "每分钟金钱", "xp_per_min": "每分钟经验", "hero_damage": "英雄伤害", "tower_damage": "建筑伤害", "hero_healing": "治疗量", "items": "装备", "backpack": "背包", "level": "等级"};
export function analysisLabel(value) {
  const [key, suffix] = value.split(".");
  const label = Object.hasOwn(ANALYSIS_LABELS, key) ? ANALYSIS_LABELS[key] : "未知数据项";
  return label + (suffix === "invalid_rows" ? "（含无效记录）" : suffix === "missing_points" ? "（采样点缺失）" : suffix ? "（范围待确认）" : "");
}
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
  const sync = () => {
    submit.disabled = disposed || !active() || busy;
    form.setAttribute('aria-busy', String(busy));
    for (const input of form.querySelectorAll('input,select')) input.disabled = disposed || !active();
  };
  const run = async event => {
    event.preventDefault(); if (!active() || disposed || busy) return;
    const parameters = {match_id: match.value.trim(), account: account.value.trim(), refresh: refresh.value === 'true'};
    if (!/^[1-9][0-9]{0,19}$/u.test(parameters.match_id) || !parameters.account) {say('请提供有效比赛ID和明确焦点玩家。', 'error'); return;}
    say('');
    const ticket = ++generation; busy = true; sync(); result.replaceChildren(node('p', '正在读取公开结算与可用时间线。'));
    try {
      const response = await options.services.invoke('analyze_explicit', parameters);
      if (disposed || !active() || ticket !== generation) return;
      renderResult(response, result);
      const facts = response.model_facts;
      if (!facts || typeof facts !== 'object') return;
      const coverage = {settlement_only: '仅基础结算', partial: '部分分析段可用', supported_sections_complete: '支持的分析段已提供'};
      result.prepend(node('p', `数据覆盖：${Object.hasOwn(coverage, facts.data_completeness) ? coverage[facts.data_completeness] : '待确认'}。本页展示基于公开事实的分析。`));
      const focus = facts.focus || {};
      const accountId = typeof focus.account_id32 === 'string' && /^[0-9]+$/u.test(focus.account_id32) ? focus.account_id32 : metric(focus.account_id32);
      result.append(node('p', `焦点：${typeof focus.name === 'string' ? focus.name : '名称未提供'} · ID32 ${accountId} · 英雄${metric(focus.hero_id)} · K/D/A ${metric(focus.kills)}/${metric(focus.deaths)}/${metric(focus.assists)}`));
      for (const [key, label] of [['missing_sections', '缺失分析段'], ['missing_fields', '缺失字段'], ['truncated_sections', '来源截断段']]) {
        const values = facts[key];
        if (Array.isArray(values)) result.append(node('p', `${label}：${values.filter(value => typeof value === 'string').slice(0, 32).map(analysisLabel).join('、') || '未列出'}。`));
      }
      result.append(node('p', `来源：${facts.source === 'opendota' ? 'OpenDota' : '来源未知'} · 获取时间：${typeof facts.fetched_at === 'string' ? facts.fetched_at : '未提供'}。缺失分析段保持未知；时间线范围以来源返回为准。`));
    } catch {if (!disposed && active() && ticket === generation) {result.replaceChildren(node('p', '分析请求未完成，请核对比赛与焦点后重试。')); say('未取得可确认的分析结果。', 'error');}}
    finally {if (!disposed && ticket === generation) {busy = false; sync();}}
  };
  form.addEventListener('submit', run); listeners.push(() => form.removeEventListener('submit', run));
  root.append(node('p', '按明确比赛与玩家读取OpenDota公开事实。未收录的时间线、装备、团战或目标保持未知，不提交录像解析。'), form, result);
  options.presentation?.actions(actions);
  sync();
  return {
    setAvailable() {if (disposed) return; generation += 1; busy = false; result.replaceChildren(); sync();},
    dispose() {if (disposed) return; disposed = true; generation += 1; busy = false; result.replaceChildren(); sync(); listeners.splice(0).forEach(remove => remove());},
  };
}

import {dlcText} from './copy.js';
import {primaryForm} from './template-adapter.js';
// Explicit public focus facts only. Host model generation remains COMMAND-only.
import {metric} from './metric.js';
const ANALYSIS_LABELS = new Set([
  'timeline', 'purchases', 'lane', 'teamfights', 'objectives', 'team_advantage', 'benchmarks',
  'players', 'invalid_player', 'gold_t', 'xp_t', 'team_gold', 'team_xp', 'teamfight_players',
  'account_id32', 'player_slot', 'name', 'hero_id', 'team', 'outcome', 'kills',
  'deaths', 'assists', 'last_hits', 'denies', 'gold_per_min', 'xp_per_min', 'hero_damage',
  'tower_damage', 'hero_healing', 'items', 'backpack', 'level',
]);
const dotaText = (key, params) => dlcText(key, params, 'zh-CN', 'dota2');
export function analysisLabel(value, t = dotaText) {
  const [key, suffix] = value.split('.');
  const label = t(`analysis.label.${ANALYSIS_LABELS.has(key) ? key : 'unknown'}`);
  if (!suffix) return label;
  const qualifier = suffix === 'invalid_rows' || suffix === 'missing_points' ? suffix : 'unknown';
  return t(`analysis.suffix.${qualifier}`, {label});
}
export function mountAnalysisForm(root, {options, active, field, renderResult, say}) {
  const document = root.ownerDocument, listeners = [];
  let disposed = false, generation = 0, busy = false;
  const {text: t, bind} = options.copy;
  const copy = key => () => t(`analysis.${key}`);
  const node = (tag, text) => {const value = document.createElement(tag); if (text) bind(value, text); return value;};
  const primary = primaryForm(root, options, {id: 'analysis-query', label: copy('query')});
  const {body: form, actions} = primary, grid = options.presentation?.grid(form) || form;
  const match = field(grid, 'match_id', copy('match')); match.maxLength = 20; match.inputMode = 'numeric';
  const account = field(grid, 'account', copy('focusPlayer'));
  const refresh = field(grid, 'refresh', copy('cache'), ['false', 'true'], 'false');
  bind(refresh.options[0], copy('preferCache')); bind(refresh.options[1], copy('refresh'));
  form.append(actions);
  const result = node('section'); result.className = 'steam-dlc-public-result'; result.setAttribute('aria-live', 'polite');
  const sync = () => {
    primary.sync(disposed || !active(), busy);
    for (const input of form.querySelectorAll('input,select')) input.disabled = disposed || !active();
  };
  const run = async () => {
    if (!active() || disposed || busy) return;
    const parameters = {match_id: match.value.trim(), account: account.value.trim(), refresh: refresh.value === 'true'};
    if (!/^[1-9][0-9]{0,19}$/u.test(parameters.match_id) || !parameters.account) {say(copy('parametersRequired'), 'error'); return;}
    say('');
    const ticket = ++generation; busy = true; sync(); result.replaceChildren(node('p', copy('loading')));
    try {
      const response = await options.services.invoke('analyze_explicit', parameters);
      if (disposed || !active() || ticket !== generation) return;
      renderResult(response, result);
      const facts = response.model_facts;
      if (!facts || typeof facts !== 'object') return;
      const coverages = ['settlement_only', 'partial', 'supported_sections_complete'];
      const coverage = coverages.includes(facts.data_completeness) ? facts.data_completeness : 'unknown';
      result.prepend(node('p', () => t('analysis.coverageSummary', {coverage: t(`analysis.coverage.${coverage}`)})));
      const focus = facts.focus || {};
      result.append(node('p', () => t('analysis.focusSummary', {
        name: typeof focus.name === 'string' ? focus.name : t('analysis.nameUnavailable'),
        account: typeof focus.account_id32 === 'string' && /^[0-9]+$/u.test(focus.account_id32)
          ? focus.account_id32 : metric(focus.account_id32, t),
        hero: metric(focus.hero_id, t), kills: metric(focus.kills, t), deaths: metric(focus.deaths, t), assists: metric(focus.assists, t),
      })));
      for (const key of ['missing_sections', 'missing_fields', 'truncated_sections']) {
        const values = facts[key];
        if (!Array.isArray(values)) continue;
        const labels = values.filter(value => typeof value === 'string').slice(0, 32);
        result.append(node('p', () => t(`analysis.${key}`, {
          values: labels.map(value => analysisLabel(value, t)).join(t('analysis.separator')) || t('analysis.unlisted'),
        })));
      }
      result.append(node('p', () => t('analysis.sourceSummary', {
        source: facts.source === 'opendota' ? 'OpenDota' : t('analysis.sourceUnknown'),
        fetchedAt: typeof facts.fetched_at === 'string' ? facts.fetched_at : t('analysis.notProvided'),
      })));
    } catch {if (!disposed && active() && ticket === generation) {result.replaceChildren(node('p', copy('requestFailed'))); say(copy('queryFailed'), 'error');}}
    finally {if (!disposed && ticket === generation) {busy = false; sync();}}
  };
  listeners.push(primary.bind(run));
  root.append(node('p', copy('description')), ...(options.presentation?.template ? [] : [node('h3', copy('filters'))]), form);
  primary.result(node('h3', copy('results')), result);
  options.presentation?.actions(actions);
  sync();
  return {
    setAvailable() {if (disposed) return; generation += 1; busy = false; result.replaceChildren(); sync();},
    dispose() {if (disposed) return; disposed = true; generation += 1; busy = false; result.replaceChildren(); sync(); listeners.splice(0).forEach(remove => remove());},
  };
}

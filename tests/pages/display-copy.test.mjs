import assert from 'node:assert/strict';
import {test} from 'node:test';
import {JSDOM} from 'jsdom';
import {mount, installDOM} from './source-build.mjs';
import {authorizationLabel, MODULES} from '../../packages/steam_dlc/pages/src/controller.js';
import {createPageCopy, dlcText} from '../../packages/steam_dlc/pages/src/copy.js';
import {analysisLabel} from '../../packages/steam_dlc/pages/src/analysis-controller.js';

test('legacy fallback normalizes locale aliases and interpolates named values', () => {
  assert.equal(dlcText('route.settings', undefined, 'zh-Hant-HK'), '設定');
  assert.equal(dlcText('route.query', undefined, 'ja', 'cs2'), 'プラットフォーム検索');
  assert.equal(dlcText('page.settingsTitle', {module: 'Steam'}, 'en_GB'), 'Steam feature settings');
  assert.equal(dlcText('route.settings', undefined, 'unsupported'), '设置');
  assert.equal(dlcText('constructor', undefined, 'en-US'), 'constructor');
});

test('page copy delegates locale selection to the Core translator with only the explicit owner catalog', () => {
  const calls = [];
  const copy = createPageCopy(() => 'en-US', (catalogs, locale, key, params) => {
    calls.push({catalogs, locale, key, params});
    return `${locale}:${key}`;
  }, 'dota2');
  assert.equal(copy.text('analysis.title'), 'en-US:analysis.title');
  assert.equal(copy.textAt('zh-CN', 'analysis.title'), 'zh-CN:analysis.title');
  assert.equal(calls.length, 2);
  assert.deepEqual(Object.keys(calls[0].catalogs).sort(), ['en-US', 'ja-JP', 'zh-CN', 'zh-TW']);
  assert.ok(Object.hasOwn(calls[0].catalogs['zh-CN'], 'analysis.label.hero_damage'));
  assert.equal(Object.hasOwn(calls[0].catalogs['zh-CN'], 'query.profileCardAlt'), false);
});

test('authorization and analysis labels keep known meaning and safe unknown fallbacks', () => {
  assert.equal(authorizationLabel('waiting'), '等待扫码确认');
  assert.equal(authorizationLabel('authorized'), '授权成功');
  assert.equal(authorizationLabel('expired'), '已过期');
  for (const value of ['future_state', '__proto__', 'constructor']) {
    assert.equal(authorizationLabel(value), '状态未知');
    assert.equal(analysisLabel(value), '未知数据项');
  }
  assert.equal(analysisLabel('teamfights.invalid_rows'), '团战（含无效记录）');
  assert.equal(analysisLabel('gold_t.missing_points'), '经济时间线（采样点缺失）');
  assert.equal(analysisLabel('purchases.future_suffix'), '购买时间线（范围待确认）');
  assert.equal(analysisLabel('hero_damage'), '英雄伤害');
  assert.match(MODULES.steam.summary, /用户自行声明.*所有权尚未验证/);
  assert.match(MODULES.deadlock.source, /社区来源.*已收录.*来源为准/);
  assert.match(MODULES.cs2.source, /可信管理页/);
});

test('CS2 query choices relabel in place without changing exact request values', async () => {
  const dom = new JSDOM('<main></main>', {url: 'http://localhost/'}); installDOM(dom);
  const container = dom.window.document.querySelector('main');
  const page = mount(container, {routeId: 'query', context: {owner: 'steam_dlc/cs2', runtimeId: 'copy-test', epoch: 1, boundary: 'copy', available: true, theme: 'light', locale: 'zh-CN'}, services: {invoke: async () => ({schema_version: 1, status: 'error', error: {message: '测试'}})}, scope: {signal: new AbortController().signal, isCurrent: () => true, onDispose() {return () => {};}}});
  try {
    const select = container.querySelector('[name="action"]');
    const choices = [...select.options];
    assert.deepEqual(choices.map(option => option.value), ['profile', 'recent', 'stats', 'last', 'match']);
    assert.deepEqual(choices.map(option => option.textContent), ['玩家资料', '近期战绩', '玩家统计', '上一场比赛', '比赛详情']);
    select.value = 'recent';
    select.focus();
    page.update({owner: 'steam_dlc/cs2', runtimeId: 'copy-test', epoch: 1, boundary: 'copy',
      available: true, theme: 'light', locale: 'en-US'});
    assert.equal(container.querySelector('[name="action"]'), select);
    assert.equal(dom.window.document.activeElement, select);
    assert.equal(select.value, 'recent');
    assert.deepEqual(choices.map(option => option.textContent), ['Player profile', 'Recent matches', 'Player stats', 'Latest match', 'Match details']);
    assert.deepEqual(choices.map(option => option.value), ['profile', 'recent', 'stats', 'last', 'match']);
  } finally {page.dispose(); dom.window.close();}
});


test('analysis refresh choices remain distinct and keep their boolean wire values', () => {
  const dom = new JSDOM('<main></main>', {url: 'http://localhost/'}); installDOM(dom);
  const container = dom.window.document.querySelector('main');
  const page = mount(container, {routeId: 'analysis', context: {owner: 'steam_dlc/dota2', runtimeId: 'analysis-copy', epoch: 1, boundary: 'copy', available: true, theme: 'light', locale: 'zh-CN'}, services: {invoke: async () => ({})}, scope: {signal: new AbortController().signal, isCurrent: () => true, onDispose() {return () => {};}}});
  try {
    const choices = [...container.querySelector('[name="refresh"]').options];
    assert.deepEqual(choices.map(option => option.value), ['false', 'true']);
    assert.deepEqual(choices.map(option => option.textContent), ['优先有效缓存', '刷新公开来源']);
  } finally {page.dispose(); dom.window.close();}
});

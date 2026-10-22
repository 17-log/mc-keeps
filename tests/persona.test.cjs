'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const engine = require('../persona-engine.js');
const keys = ['company', 'ritual', 'novelty', 'memory'];
const scoreObject = value => Object.fromEntries(keys.map(key => [key, value]));
const low = engine.calculate(Array(8).fill(0));
const high = engine.calculate(Array(8).fill(3));

test('内联引擎源码不含会被HTML解析器改写的原始控制字符', () => {
  const source = fs.readFileSync(path.join(__dirname, '../persona-engine.js'), 'utf8');
  assert.doesNotMatch(source, /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/, '控制字符应写成源码转义，避免内联脚本被HTML替换后失效');
  const parsed = source.replace(/\u0000/g, '\ufffd').replace(/\r\n?/g, '\n');
  const context = { window: {}, URL, URLSearchParams };
  assert.doesNotThrow(() => vm.runInNewContext(parsed, context));
  assert.equal(context.window.KeepsPersonaEngine.version, 'p1');
});

test('浏览器全局与 CommonJS 共用独立引擎，不依赖 DOM', () => {
  const context = { window: {}, URL, URLSearchParams };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../persona-engine.js'), 'utf8'), context);
  assert.equal(context.window.KeepsPersonaEngine.version, 'p1');
  assert.equal(context.window.KeepsPersonaEngine.calculate(Array(8).fill(0)).id, low.id);
  assert.equal(engine.version, 'p1');
  assert.ok(Object.isFrozen(engine));
  assert.ok(Object.isFrozen(engine.questions[0].options));
});

test('四维各两题，八道题各有四个有效选项', () => {
  assert.deepEqual(engine.axes.map(axis => axis.key), keys);
  assert.equal(engine.questions.length, 8);
  assert.equal(new Set(engine.questions.map(question => question.id)).size, 8);
  for (const axis of engine.axes) {
    assert.equal(engine.questions.filter(question => question.axis === axis.key).length, 2);
    assert.ok(axis.label && axis.left && axis.right && axis.explanation);
  }
  for (const question of engine.questions) {
    assert.ok(question.title && question.scene);
    assert.deepEqual(question.options.map(option => option.value), [-2, -1, 1, 2]);
    assert.equal(new Set(question.options.map(option => option.text)).size, 4);
  }
});

test('十六种角色皆可由真实答题到达，角色字段可直接用于原有食物绘图', () => {
  const kinds = new Set(['burger', 'fries', 'cola', 'coffee', 'nuggets', 'icecream', 'pie', 'breakfast']);
  assert.equal(engine.archetypes.length, 16);
  assert.equal(new Set(engine.archetypes.map(item => item.id)).size, 16);
  assert.equal(new Set(engine.archetypes.map(item => item.title)).size, 16);
  const found = new Set();
  for (let mask = 0; mask < 16; mask++) {
    const answers = engine.questions.map(question => mask & (1 << keys.indexOf(question.axis)) ? 3 : 0);
    const result = engine.calculate(answers);
    found.add(result.id);
    assert.equal(result.id, result.code);
    assert.ok(engine.archetypes.some(item => item.id === result.id));
    for (const field of ['title', 'subtitle', 'quote', 'description', 'mission']) assert.ok(result[field].length > 0);
    assert.equal(result.tags.length, 3);
    assert.equal(new Set(result.tags).size, 3);
    assert.ok(kinds.has(result.kind));
    assert.ok(kinds.has(result.sprite));
    assert.match(result.accent, /^#[0-9a-f]{6}$/i);
  }
  assert.equal(found.size, 16);
});

test('穷举全部65536份答案，逐维按两道题计算且分享后可完整重现', () => {
  const found = new Set();
  for (let encoded = 0; encoded < 65536; encoded++) {
    const answers = Array.from({ length: 8 }, (_, i) => (encoded >> (i * 2)) & 3);
    const result = engine.calculate(answers);
    assert.ok(result);
    found.add(result.id);
    for (const key of keys) {
      const sum = engine.questions.reduce((total, question, i) => total + (question.axis === key ? question.options[answers[i]].value : 0), 0);
      assert.equal(result.scores[key], Math.round((sum + 4) / 8 * 100));
    }
    const restored = engine.decode(engine.encode(result));
    assert.deepEqual(restored.scores, result.scores);
    assert.equal(restored.id, result.id);
    assert.equal(restored.title, result.title);
  }
  assert.equal(found.size, 16);
});

test('每个答案必须是0..3整数，拒绝缺题、多题、空位和隐式类型转换', () => {
  for (const value of [null, undefined, {}, '01230123', new Uint8Array(8), [], Array(7).fill(0), Array(9).fill(0), new Array(8)]) assert.equal(engine.calculate(value), null);
  for (let index = 0; index < 8; index++) {
    for (const value of [-1, 4, 0.5, NaN, Infinity, '0', true, null, undefined, {}, [], () => 0]) {
      const answers = Array(8).fill(0);
      answers[index] = value;
      assert.equal(engine.calculate(answers), null);
    }
    const withHole = Array(8).fill(0);
    delete withHole[index];
    assert.equal(engine.calculate(withHole), null);
  }
  let touched = false;
  const getterAnswers = Array(8).fill(0);
  Object.defineProperty(getterAnswers, '0', { get() { touched = true; throw Error('must not invoke'); } });
  assert.equal(engine.calculate(getterAnswers), null);
  assert.equal(touched, false);
});

test('最低0最高100，单维计算独立，sum+4预览验证边界', () => {
  assert.deepEqual(low.scores, scoreObject(0));
  assert.deepEqual(high.scores, scoreObject(100));
  assert.deepEqual(engine.calculate(Array(8).fill(1)).scores, scoreObject(25));
  assert.deepEqual(engine.calculate(Array(8).fill(2)).scores, scoreObject(75));
  assert.deepEqual(engine.summary([0, 1, 7, 8]).scores, { company: 0, ritual: 13, novelty: 88, memory: 100 });
  for (const key of keys) {
    const answers = Array(8).fill(0);
    engine.questions.forEach((question, index) => { if (question.axis === key) answers[index] = 3; });
    const result = engine.calculate(answers);
    assert.deepEqual(result.scores, { ...scoreObject(0), [key]: 100 });
  }
  for (const value of [null, {}, [], [0, 0, 0], [0, 0, 0, 0, 0], [-1, 0, 0, 0], [0, 0, 0, 9], [0.5, 0, 0, 0], ['0', 0, 0, 0], new Array(4)]) assert.equal(engine.summary(value), null);
});

test('fromScores验证四个整型刻度，所有允许刻度能通过分享保真复现', () => {
  assert.equal(engine.calculateFromScores, engine.fromScores);
  for (let value = 0; value <= 100; value++) {
    const scores = { company: value, ritual: 100 - value, novelty: value, memory: 100 - value };
    const result = engine.fromScores(scores);
    assert.deepEqual(result.scores, scores);
    assert.deepEqual(engine.decode(engine.encode(result)).scores, scores);
  }
  for (const value of [null, undefined, [], '0', {}, { company: 0, ritual: 0, novelty: 0 }, { ...scoreObject(0), extra: 1 }]) assert.equal(engine.fromScores(value), null);
  for (const key of keys) {
    for (const value of [-1, 101, 0.5, NaN, Infinity, '50', null, undefined, true]) assert.equal(engine.fromScores({ ...scoreObject(0), [key]: value }), null);
  }
  const inherited = Object.create(scoreObject(0));
  assert.equal(engine.fromScores(inherited), null);
  const withSymbol = scoreObject(0);
  withSymbol[Symbol('private')] = 'secret';
  assert.equal(engine.fromScores(withSymbol), null);
  const nullPrototype = Object.assign(Object.create(null), scoreObject(50));
  assert.deepEqual(engine.fromScores(nullPrototype).scores, scoreObject(50));
});

test('同分维度明确为混合偏好，固定角色规则与倾向说明一同复现', () => {
  const result = engine.calculate([0, 0, 0, 0, 3, 3, 3, 3]);
  assert.deepEqual(result.scores, scoreObject(50));
  assert.deepEqual(result.mixedAxes, keys);
  assert.ok(result.axisNotes.every(note => note.mixed && note.description.includes('混合')));
  assert.match(result.note, /混合偏好/);
  assert.match(result.scoreNote, /不是概率/);
  assert.match(result.scoreNote, /不代表 MBTI/);
  assert.equal(result.code, engine.fromScores(scoreObject(50)).code);
  assert.deepEqual(engine.decode(engine.encode(result)).mixedAxes, keys);
  const near = engine.fromScores({ company: 49, ritual: 50, novelty: 51, memory: 50 });
  assert.deepEqual(near.mixedAxes, ['ritual', 'memory']);
  assert.equal(near.code, 'DYTZ');
});

test('分享码只包含版本角色与刻度，拒绝未知版、未知型、越界和不一致', () => {
  const token = engine.encode(low);
  assert.match(token, /^p1.[A-Z]{4}.[0-9a-z]{8}$/);
  assert.equal(token.length, 16);
  const dirty = { ...low, title: '<script>bad()</script>', answers: [3, 3, 3], orderId: 'private-order', photo: 'private-photo', phone: 'private-phone', note: 'private-note' };
  assert.equal(engine.encode(dirty), token);
  const serialized = JSON.stringify(engine.decode(engine.encode(dirty)));
  for (const secret of ['private-order', 'private-photo', 'private-phone', 'private-note', 'bad()', 'answers']) assert.ok(!serialized.includes(secret));
  for (const malicious of [null, undefined, {}, 123, '', token + 'x', token + '\n', ' ' + token, token.replace('p1', 'p2'), token.replace(low.code, 'ZZZZ'), token.replace(low.code, high.code), 'p1.DSCX.zz000000', 'p1.DSCX.2t000000', 'p1.DSCX.1e000000', 'p1.DSCX.0A000000', '../' + token, '<script>', '__proto__', token.toLowerCase(), 'p1.DSCX.%3000000']) assert.equal(engine.decode(malicious), null);
  assert.equal(engine.encode({ ...low, version: 'p2' }), null);
  assert.equal(engine.encode({ ...low, id: high.id }), null);
  assert.equal(engine.encode({ ...low, code: high.code }), null);
  assert.equal(engine.encode({ ...low, scores: high.scores }), null);
  assert.equal(engine.encode({ ...low, scores: { ...low.scores, private: 'no' } }), null);
  assert.equal(engine.encode(null), null);
});

test('分享URL仅使用HTTP(S)，剔除原查询串且异常URL安全返回null', () => {
  const share = engine.buildShareUrl('https://example.com/demo/?order=private&key=private#shoot', high);
  assert.equal(share, 'https://example.com/demo/#persona?v=p1&r=' + engine.encode(high));
  assert.deepEqual(engine.readShareUrl(share).scores, high.scores);
  assert.equal(engine.readShareUrl(share).id, high.id);
  assert.equal(engine.readShareUrl('#persona?v=p1&r=' + engine.encode(low)).id, low.id);
  assert.equal(engine.readShareUrl('http://127.0.0.1:4876/#persona?r=' + engine.encode(low) + '&v=p1').id, low.id);
  for (const base of ['', null, {}, 'relative/path', '/demo/', 'javascript:alert(1)', 'data:text/html,hi', 'file:///tmp/demo', 'https://user:password@example.com/', ' https://example.com/', 'https://example.com/\n']) assert.equal(engine.buildShareUrl(base, low), null);
  assert.equal(engine.buildShareUrl('https://example.com/', { ...low, id: high.id }), null);
  for (const value of [null, {}, '', 'bad', 'javascript:#persona?v=p1&r=' + engine.encode(low), 'https://u:p@example.com/#persona?v=p1&r=' + engine.encode(low), 'https://example.com/#shoot', share.replace('v=p1', 'v=p2'), share + '&v=p1', share + '&r=' + engine.encode(low), share + '&photo=private', share.replace('r=', 'result='), share.replace('v=p1&', ''), share.replace(/r=.*/, 'r=%'), share.replace('persona?', 'other?')]) assert.equal(engine.readShareUrl(value), null);
});

test('好友对比只说明共同习惯和偏好差异，不携带原对象字段或虚构概率', () => {
  const same = engine.compare(low, engine.encode(low));
  assert.equal(same.shared.length, 4);
  assert.equal(same.differences.length, 0);
  const different = engine.compare({ ...low, phone: 'private-phone', order: 'private-order' }, high);
  assert.deepEqual(Object.keys(different).sort(), ['description', 'differences', 'shared', 'title']);
  assert.equal(different.shared.length, 0);
  assert.equal(different.differences.length, 4);
  const mixed = engine.compare(engine.fromScores(scoreObject(50)), low);
  assert.equal(mixed.differences.length, 4);
  assert.ok(mixed.differences.every(text => text.includes('混合')));
  for (const result of [same, different, mixed]) {
    const text = JSON.stringify(result);
    assert.doesNotMatch(text, /%|％|匹配率|契合度|概率|private-phone|private-order/);
  }
  assert.equal(engine.compare(null, high), null);
  assert.equal(engine.compare(low, 'invalid'), null);
  assert.equal(engine.compare({ ...low, id: high.id }, high), null);
});

test('结果与得分对象独立，不会被调用方修改污染后续结果', () => {
  const scores = scoreObject(0);
  const result = engine.fromScores(scores);
  scores.company = 100;
  result.tags.push('污染');
  result.scores.ritual = 100;
  const next = engine.fromScores(scoreObject(0));
  assert.equal(next.scores.company, 0);
  assert.equal(next.scores.ritual, 0);
  assert.equal(next.tags.length, 3);
  assert.equal(engine.archetypes.find(item => item.id === next.id).tags.length, 3);
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { analyze } = require('../dist/engine.js');

test('short samples do not assess sentence uniformity', () => {
  const result = analyze('Hello world.');
  assert.equal(result.enough, false);
  assert.equal(result.signals[0].flag, false);
});
test('explicit assistant-style wording is observable', () => {
  assert.equal(analyze('As an AI assistant, I can help.').signals[3].flag, true);
});
test('three repeated openings trigger the repetition rule', () => {
  assert.equal(analyze('We can make better plans. We can make good tea. We can make big things.').signals[1].flag, true);
});
test('three distinct stock phrases trigger the phrase rule', () => {
  assert.equal(analyze('Furthermore we work. Moreover we rest. In conclusion we stop.').signals[2].flag, true);
});
test('text containing HTML remains data with undetermined authorship', () => {
  assert.equal(analyze('<img src=x onerror=alert(1)>').verdict, 'Authorship undetermined');
});
test('empty input is handled without invalid statistics', () => {
  const result = analyze('');
  assert.equal(result.wordCount, 0);
  assert.equal(result.variation, 0);
});

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

test('unpunctuated lines are retained', () => {
  const result = analyze('First complete thought\nSecond complete thought\nThird complete thought');
  assert.equal(result.sentenceCount, 3);
  assert.equal(result.wordCount, 9);
});
test('abbreviations and decimals do not create spurious sentences', () => {
  assert.equal(analyze('Dr. Smith paid 3.14 dollars. He left.').sentenceCount, 2);
});
test('bullet lists and Windows line endings retain all lines', () => {
  assert.equal(analyze('- First useful item\r\n2. Second useful item\r\n• Third useful item').sentenceCount, 3);
});
test('Unicode boundaries reject embedded phrases and highlight only valid matches', () => {
  const {findMatches} = require('../dist/engine.js');
  assert.deepEqual(findMatches('furthermorex éfurthermore furthermoreé _furthermore furthermore_ Furthermore!', ['furthermore']).map(m=>m.text), ['Furthermore']);
});
test('apostrophes, accented letters, and emoji are handled without crashes', () => {
  const {words} = require('../dist/engine.js');
  assert.deepEqual(words('l’été café 😊'), ['l’été','café']);
});
test('unsupported declared languages are rejected', () => {
  assert.throws(()=>analyze('Bonjour tout le monde.',{language:'fr'}), /Only English/);
});
test('engine enforces input size and input type', () => {
  assert.throws(()=>analyze('a'.repeat(100001)), /limit/);
  assert.throws(()=>analyze(null), /string/);
  assert.equal(analyze('a'.repeat(100000)).wordCount, 1);
});
test('binary content and invalid file imports are rejected', () => {
  const {validateFile,validateText} = require('../dist/engine.js');
  assert.throws(()=>validateText('hello\0world'), /Binary/);
  assert.throws(()=>validateFile('bad.html',10), /txt/);
  assert.throws(()=>validateFile('bad.txt',500001), /500 KB/);
  assert.doesNotThrow(()=>validateFile('GOOD.MD',500000));
});
test('short sample uniformity is explicitly unassessed', () => {
  assert.equal(analyze('One short line.').signals[0].assessed, false);
});
test('150-word, 30-sentence uniform sample meets the threshold', () => {
  const r = analyze(Array(30).fill('We make useful things today.').join(' '));
  assert.equal(r.enough,true);
  assert.equal(r.signals[0].flag,true);
});
test('default report omits all text-derived observations and excerpts', () => {
  const {buildReport} = require('../dist/engine.js');
  const r = analyze('Secret zebra phrase appears today. Secret zebra phrase occurs again. Secret zebra phrase returns tomorrow.');
  const report = buildReport(r);
  assert.equal(report.excerptsIncluded,false);
  assert.equal(report.passages,undefined);
  assert.equal(report.phrases,undefined);
  assert.ok(report.signals.every(s=>s.observation===undefined));
  assert.ok(!JSON.stringify(report).includes('Secret zebra'));
  assert.ok(!JSON.stringify(report).includes('secret zebra'));
});
test('excerpt export is explicit and retains reviewed observations', () => {
  const {buildReport} = require('../dist/engine.js');
  const r=analyze('As an AI assistant, I can help.');
  assert.deepEqual(buildReport(r,true).passages,r.passages);
  assert.equal(buildReport(r,true).excerptsIncluded,true);
});
test('maximum-size representative prose completes within a generous budget', () => {
  const text = 'We make useful things today. '.repeat(3500).slice(0,100000);
  const start=performance.now();
  assert.ok(analyze(text).sentenceCount>3000);
  assert.ok(performance.now()-start<5000, 'analysis exceeded five seconds');
});

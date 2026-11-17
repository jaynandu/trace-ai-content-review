'use strict';
// An evaluation corpus must be supplied by the maintainer; no labels are inferred.
const fs = require('node:fs');
const { analyze } = require('../dist/engine.js');
if (!process.argv[2]) { console.error('Usage: node scripts/evaluate.cjs corpus.json'); process.exit(1); }
const samples = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
if (!Array.isArray(samples) || !samples.length) throw new Error('Provide a nonempty JSON array.');
const groups = {};
for (const sample of samples) {
  if (!['human','generated','edited','translated'].includes(sample.label) || !sample.source || typeof sample.text !== 'string') throw new Error('Each sample needs text, documented source, and label: human/generated/edited/translated.');
  const result = analyze(sample.text, {language:sample.language || 'en'});
  const group = groups[sample.label] ||= {samples:0, samplesWithAnySignal:0, limitedSamples:0};
  group.samples++; group.samplesWithAnySignal += result.signalCount>0 ? 1 : 0; group.limitedSamples += !result.enough ? 1 : 0;
}
console.log(JSON.stringify({notice:'Signal occurrence only, not classification accuracy: Trace always leaves authorship undetermined. Corpus quality and labels must be independently checked.',groups},null,2));

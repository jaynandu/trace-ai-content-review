(function (root) {
  'use strict';
  const MAX_CHARACTERS = 100000;
  const MAX_FILE_BYTES = 500000;
  const stock = ["in today’s fast-paced world", "in today's fast-paced world", 'ever-evolving landscape', 'it is important to note', 'it’s important to note', 'in conclusion', 'furthermore', 'moreover', 'in summary', 'delve into', 'a testament to', 'plays a pivotal role'];
  const assistant = ['as an ai language model', 'as a large language model', 'as an ai assistant', 'i don’t have personal experiences', "i don't have personal experiences", 'my knowledge cutoff'];
  const words = text => text.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) || [];
  const escapeRegex = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function validateText(text) {
    if (typeof text !== 'string') throw new TypeError('Text must be a string.');
    if (text.length > MAX_CHARACTERS) throw new RangeError('Text exceeds the 100,000-character limit.');
    if (text.includes('\0')) throw new TypeError('Binary content is not supported. Choose a plain-text file.');
  }
  function validateFile(name, size) {
    if (!/\.(txt|md)$/i.test(name)) throw new TypeError('Choose a .txt or .md file.');
    if (!Number.isFinite(size) || size < 0 || size > MAX_FILE_BYTES) throw new RangeError('Choose a text file of 500 KB or smaller.');
  }
  function findMatches(text, phrases) {
    if (!phrases.length) return [];
    const regex = new RegExp('(?<![\\p{L}\\p{N}_])(?:' + [...phrases].sort((a,b) => b.length-a.length).map(escapeRegex).join('|') + ')(?![\\p{L}\\p{N}_])', 'giu');
    return Array.from(text.matchAll(regex), m => ({ index: m.index, text: m[0] }));
  }
  function splitSentences(text) {
    const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
    return text.split(/\r?\n/).flatMap(line => {
      const segments = Array.from(segmenter.segment(line.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '')), item => item.segment.trim());
      const merged = [];
      for (const segment of segments) {
        if (merged.length && /\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St)\.$/i.test(merged.at(-1))) merged[merged.length-1] += ' ' + segment;
        else merged.push(segment);
      }
      return merged;
    }).filter(s => words(s).length);
  }
  function analyze(text, options = {}) {
    validateText(text);
    if ((options.language || 'en') !== 'en') throw new TypeError('Only English analysis is supported. Other languages have not been validated.');
    const tokens = words(text);
    const sentences = splitSentences(text);
    const parsed = sentences.map(sentence => ({ text: sentence, words: words(sentence.toLowerCase()) }));
    const lengths = parsed.map(s => s.words.length);
    const mean = lengths.reduce((a,b) => a+b, 0) / (lengths.length || 1);
    const cv = mean ? Math.sqrt(lengths.reduce((sum,n) => sum + (n-mean)**2, 0) / lengths.length) / mean : 0;
    const matches = stock.filter(p => findMatches(text, [p]).length);
    const explicit = assistant.filter(p => findMatches(text, [p]).length);
    const openings = new Map();
    parsed.forEach(s => { if (s.words.length >= 5) { s.opening = s.words.slice(0,3).join(' '); openings.set(s.opening, (openings.get(s.opening) || 0)+1); } });
    const repeated = new Set([...openings].filter(([,n]) => n >= 3).map(([key]) => key));
    const enough = tokens.length >= 150 && sentences.length >= 5;
    const signals = [
      { name:'Uniform sentence lengths', assessed:enough, flag:enough && cv<0.30, observation:sentences.length+' sentences · '+Math.round(mean)+' words on average · '+cv.toFixed(2)+' variation', reason:'Structured human writing and generated writing can both have uniform sentence lengths.', rule:'Observed below 0.30 variation, after at least 150 words and 5 sentences.' },
      { name:'Repeated sentence openings', assessed:true, flag:repeated.size>0, observation:repeated.size ? [...repeated].map(k => '“'+k+'” × '+openings.get(k)).join('; ') : 'No opening repeated 3 or more times.', reason:'Repetition may reflect a template or a deliberate rhetorical choice.', rule:'Counts first-three-word openings in sentences containing at least 5 words.' },
      { name:'Stock transition phrases', assessed:true, flag:matches.length>=3, observation:matches.length+' distinct phrases matched'+(matches.length ? ': '+matches.join(', ') : '.'), reason:'These transitions occur in both human and generated prose.', rule:'Observed when at least 3 distinct listed phrases match whole-word boundaries.' },
      { name:'Assistant-style wording', assessed:true, flag:explicit.length>0, observation:explicit.length ? 'Matched: '+explicit.join(', ') : 'No listed assistant-style phrases found.', reason:'Quotations, fiction, and discussion about AI can trigger this rule.', rule:'Matches a fixed list at whole-word boundaries; does not determine whether a phrase is quoted.' }
    ];
    const phrases = [...matches, ...explicit];
    return { version:'Trace 1.1 — unvalidated English style heuristics', language:'en', verdict:'Authorship undetermined', wordCount:tokens.length, sentenceCount:sentences.length, meanSentenceLength:Math.round(mean*10)/10, variation:Math.round(cv*100)/100, enough, signals, signalCount:signals.filter(s=>s.flag).length, phrases, passages:parsed.filter(s=>findMatches(s.text,phrases).length || repeated.has(s.opening)).slice(0,8).map(s=>s.text), limitations:'Unvalidated style rules, not a trained detector. No probability of AI authorship is estimated. Signals cannot prove AI use; absence of signals cannot prove human authorship. Language is user-declared, not automatically detected.' };
  }
  function buildReport(review, includeExcerpts = false) {
    const { phrases, passages, signals, ...metrics } = review;
    return { ...metrics, signals:signals.map(({observation,...safe}) => includeExcerpts ? {...safe,observation} : safe), ...(includeExcerpts ? {phrases,passages} : {}), reviewedAt:new Date().toISOString(), fullTextIncluded:false, excerptsIncluded:includeExcerpts };
  }
  root.TraceEngine = { analyze, words, findMatches, splitSentences, validateText, validateFile, buildReport, MAX_CHARACTERS, MAX_FILE_BYTES };
  if (typeof module !== 'undefined') module.exports = root.TraceEngine;
})(typeof window !== 'undefined' ? window : globalThis);

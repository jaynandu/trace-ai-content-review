'use strict';
const $ = id => document.getElementById(id);
let review = null;
let worker = null;
let timeout = null;
let revision = 0;
let uploadRevision = 0;
function stopWork() {
  if (worker) worker.terminate();
  worker = null;
  clearTimeout(timeout);
  $('analyze').textContent = 'Analyze text ↗';
}
function resetResults(badge = 'AWAITING TEXT') {
  review = null;
  $('results').hidden = true;
  $('empty').hidden = false;
  $('evidence').hidden = true;
  $('resultbadge').textContent = badge;
  $('exportStatus').textContent = '';
  $('passages').replaceChildren();
  $('signalList').replaceChildren();
  $('summarytext').textContent = '';
  $('includeExcerpts').checked = false;
}
function update() {
  revision++;
  stopWork();
  if (review) resetResults('TEXT CHANGED');
  const text = $('content').value;
  const n = TraceEngine.words(text).length;
  $('wordcount').textContent = n.toLocaleString();
  $('charcount').textContent = text.length.toLocaleString();
  $('analyze').disabled = n === 0 || $('language').value !== 'en' || text.length > TraceEngine.MAX_CHARACTERS;
  $('message').textContent = $('language').value === 'other'
    ? 'Unsupported language: French and other languages have not been validated. No analysis will run.'
    : !$('language').value ? 'Choose the text language. This tool supports English only.' : '';
}
$('content').addEventListener('input', () => { uploadRevision++; update(); });
$('language').addEventListener('change', () => { resetResults(); update(); });
function openMethod() { $('method').showModal(); }
['navMethod','learn','methodFooter'].forEach(id => $(id).onclick = openMethod);
$('closeMethod').onclick = () => $('method').close();
$('method').addEventListener('click', event => {
  if (event.target !== $('method')) return;
  const r = $('method').getBoundingClientRect();
  if (event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom) $('method').close();
});
$('navReview').onclick = () => $('content').focus();
$('clear').onclick = () => {
  uploadRevision++;
  $('content').value = '';
  $('file').value = '';
  $('includeExcerpts').checked = false;
  resetResults(); update(); $('content').focus();
};
$('upload').onclick = () => { $('file').value = ''; $('file').click(); };
$('file').onchange = async () => {
  const file = $('file').files[0];
  if (!file) return;
  const request = ++uploadRevision;
  try {
    TraceEngine.validateFile(file.name, file.size);
    const text = await file.text();
    if (request !== uploadRevision) return;
    TraceEngine.validateText(text);
    $('content').value = text;
    update();
  } catch (error) {
    if (request === uploadRevision) $('message').textContent = error.message || 'The file could not be read. Paste plain text instead.';
  }
};
$('sample').onclick=()=>{uploadRevision++;$('content').value=`In today's fast-paced world, organizations are looking for better ways to communicate. It is important to note that effective communication plays a pivotal role in building trust across a growing team. Furthermore, shared processes can help people understand their responsibilities and move forward with confidence.

The team can build trust by making its goals visible to everyone involved. The team can build momentum by scheduling regular conversations about progress and challenges. The team can build clarity by documenting important decisions and sharing them with the people affected. These practices provide a consistent foundation, although each organization will need to adapt its approach to its circumstances.

Moreover, leaders should consider how information reaches people who work different hours or in different locations. A written summary may be more useful than an extra meeting. Asking colleagues which information they are missing can reveal practical opportunities for improvement. In conclusion, communication deserves ongoing attention, and small changes can make daily work easier for the people doing it.`;$('language').value='en';update();$('message').textContent='Illustrative sample written for this demo. The rules measure its style, not its provenance.';};
function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}
function highlight(text, phrases) {
  const box = el('div','passage');
  let position = 0;
  for (const match of TraceEngine.findMatches(text, phrases)) {
    box.append(document.createTextNode(text.slice(position, match.index)), el('mark','',match.text));
    position = match.index + match.text.length;
  }
  box.append(document.createTextNode(text.slice(position)));
  return box;
}
function renderReview(result) {
  review = result;
  $('empty').hidden = true;
  $('results').hidden = false;
  $('evidence').hidden = false;
  $('resultbadge').textContent = result.enough ? 'REVIEW COMPLETE' : 'LIMITED SAMPLE';
  $('verdict').textContent = result.verdict;
  $('signals').textContent = result.signalCount+' / 4';
  $('sentences').textContent = result.sentenceCount;
  $('variation').textContent = result.variation.toFixed(2);
  $('summarytext').textContent = result.enough
    ? result.signalCount ? 'Some stylistic patterns deserve a closer look. Review each observation in context.' : 'Few listed patterns were observed. This does not establish human authorship.'
    : 'Limited sample: aim for 150 words and 5 sentences. Sentence uniformity is not assessed until both minimums are met.';
  $('signalList').replaceChildren();
  result.signals.forEach(signal => {
    const item = el('div','signal');
    const head = el('div','signalhead');
    head.append(el('h3','',signal.name),el('span','pill'+(signal.flag?' flag':''),!signal.assessed?'Not assessed':signal.flag?'Observed':'Not observed'));
    item.append(head,el('p','',signal.observation),el('p','',signal.reason),el('small','',signal.rule));
    $('signalList').append(item);
  });
  $('passages').replaceChildren();
  if (result.passages.length) result.passages.forEach(p => $('passages').append(highlight(p,result.phrases)));
  else $('passages').append(el('div','passage','No passages matched the phrase or repetition rules. This does not establish human authorship.'));
  $('message').textContent = 'Review complete. No text has left this browser. Language was selected by you, not detected automatically.';
}
$('analyze').onclick = () => {
  if ($('language').value !== 'en') return;
  const text = $('content').value;
  try { TraceEngine.validateText(text); } catch (error) { $('message').textContent = error.message; return; }
  if (!TraceEngine.words(text).length) return;
  stopWork(); resetResults('ANALYZING');
  const request = ++revision;
  $('analyze').disabled = true;
  $('analyze').textContent = 'Analyzing…';
  $('message').textContent = 'Reviewing on your device…';
  const fail = message => {
    if (request !== revision) return;
    stopWork(); $('analyze').disabled = false; resetResults('REVIEW FAILED'); $('message').textContent = message;
  };
  try {
    worker = new Worker('worker.js');
    worker.onmessage = ({data}) => {
      if (data.id !== request || request !== revision) return;
      if (data.error) { fail(data.error); return; }
      stopWork(); $('analyze').disabled = false; renderReview(data.review);
    };
    worker.onerror = () => fail('The review could not run. Use a modern browser with JavaScript and same-origin workers enabled.');
    timeout = setTimeout(() => fail('The review took too long. Try a shorter sample.'), 10000);
    worker.postMessage({ id:request, text, language:'en' });
  } catch { fail('Background analysis is unavailable in this browser. Try a modern browser.'); }
};
$('includeExcerpts').onchange = () => { $('exportStatus').textContent = $('includeExcerpts').checked ? 'The report will include matched text and phrase observations.' : 'The report will omit matched text and text-derived observations.'; };
$('export').onclick = () => {
  if (!review) return;
  const report = TraceEngine.buildReport(review, $('includeExcerpts').checked);
  const blob = new Blob([JSON.stringify(report,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const anchor = el('a'); anchor.href = url; anchor.download = 'trace-review.json';
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $('exportStatus').textContent = report.excerptsIncluded ? 'Downloaded with matched excerpts. Keep the file private if the source is sensitive.' : 'Downloaded metrics and rules only; matched text was omitted.';
};
update();

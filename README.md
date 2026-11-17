# Trace — AI Content Review

A browser-local text-review prototype that makes writing patterns visible and explainable.

**Trace is not a validated AI detector.** It uses transparent style rules and cannot establish whether a human or an AI wrote a passage. Its signal count is not a probability or an accuracy score.

## Features

- Paste text or import `.txt` and `.md` files.
- Review sentence-length variation, repeated openings, stock transitions, and assistant-style wording.
- Inspect matched passages and the rules behind each observation.
- Export a JSON review report, including matched excerpts and limitations.
- Responsive interface with no backend, API key, or build step.

## Run locally

Clone this repository, then serve the `dist` directory using any static HTTP server. For example, with Python 3:

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000 in your browser.

## Check the code

With Node.js 18 or newer:

```sh
npm test
```

No npm dependencies need to be installed.

## Project layout

| File | Purpose |
| --- | --- |
| `dist/index.html` | Interface and methodology dialog |
| `dist/style.css` | Responsive styles |
| `dist/engine.js` | Deterministic English-focused analysis rules |
| `dist/app.js` | Input handling, results, highlights, and report export |
| `tests/engine.test.cjs` | Analysis behavior checks |

## Method

Four rules are evaluated independently:

1. Sentence-length coefficient of variation below 0.30, only after at least 150 words and 5 sentences.
2. A first-three-word sentence opening repeated at least 3 times, considering sentences with at least 5 words.
3. At least 3 distinct stock phrases from a fixed English list.
4. At least one explicit assistant-style phrase from a fixed list.

The sentence splitter is intentionally simple and may split abbreviations and decimals incorrectly. Thresholds are design choices, not statistically validated detection thresholds. Every result leaves authorship undetermined.

## Privacy

Text analysis runs in the browser. The app does not send input text to a server or model, use analytics, or save input text in browser storage. The text is cleared on page reload. Downloaded JSON reports include matched excerpts, so treat them with the same care as the original content.

The stylesheet loads DM Sans and Manrope from Google Fonts. Font requests contact Google; they do not contain the analyzed text. Remove the CSS `@import` to use the fallback fonts without external font requests.

## Limitations and responsible use

- English-focused rules; other languages are not validated.
- Short, formal, translated, edited, or templated human text may trigger signals.
- Generated text may trigger none of the rules.
- Quotations and fiction can trigger assistant-style wording checks.
- Images, PDFs, audio, and video are not supported.
- Use source verification, drafts, version history, and a discussion with the author to assess provenance.
- Do not use these results alone for disciplinary, employment, or academic decisions.

Background: [OpenAI's account of its discontinued AI text classifier and its limitations](https://openai.com/index/new-ai-classifier-for-indicating-ai-written-text/).

## Hosting

Deploy `dist` to any static host. There is no server-side runtime to configure. This repository contains the app source without account-specific hosting configuration.

# Trace — AI Content Review

A browser-local text-review prototype that makes writing patterns visible and explainable.

**Trace is not a validated AI detector.** It uses transparent style rules and cannot establish whether a human or an AI wrote a passage. Its signal count is not a probability or an accuracy score.

## Features

- Paste text or import `.txt` and `.md` files.
- Review sentence-length variation, repeated openings, stock transitions, and assistant-style wording.
- Inspect matched passages and the rules behind each observation.
- Export a JSON review report with metrics and limitations; matched excerpts require explicit opt-in.
- Explicit English language selection, disposable background workers, and responsive layouts.
- No backend, API key, or build step.

## Run locally

Clone this repository, then serve the `dist` directory using any static HTTP server. For example, with Python 3:

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000 in your browser.

## Check the code

With Node.js 20 or newer:

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

Sentence segmentation uses `Intl.Segmenter` per line, retains unpunctuated lines and list items, and merges common English honorific abbreviations. Segmentation can still be imperfect. Thresholds are design choices, not statistically validated detection thresholds. Every result leaves authorship undetermined.

## Privacy

Text analysis runs in the browser. The app does not send input text to a server or model, use analytics, or save input text in browser storage. The text is cleared on page reload. Downloaded JSON reports omit matched phrases, passages, and text-derived observations by default. Opting in to excerpts includes these fields; treat those reports with the same care as the original content.

The app uses system fonts and has no external font, script, or analysis requests. Browser spellcheck is disabled on the input to reduce accidental use of cloud spelling services; browser extensions and device-level tools remain outside the app’s control.

## Limitations and responsible use

- Choose English explicitly before analysis. French and other languages are blocked when selected. This is a user declaration, not automatic language detection; English-focused rules cannot validate other languages.
- Short, formal, translated, edited, or templated human text may trigger signals.
- Generated text may trigger none of the rules.
- Quotations and fiction can trigger assistant-style wording checks.
- Images, PDFs, audio, and video are not supported.
- Use source verification, drafts, version history, and a discussion with the author to assess provenance.
- Do not use these results alone for disciplinary, employment, or academic decisions.

Background: [OpenAI's account of its discontinued AI text classifier and its limitations](https://openai.com/index/new-ai-classifier-for-indicating-ai-written-text/).

## Hosting

Deploy `dist` to any static host. For hosts that support `_headers`, verify that those policies are applied. For Worker ESM hosting, run `npm run build` and deploy `dist/server/index.js`; it embeds the assets and applies the HTTP headers to every response. It processes no review text. This repository contains the app source without account-specific hosting configuration.


## Evaluation without misleading accuracy claims

`npm test` checks behavior, privacy, security invariants, and performance. It does **not** validate AI detection accuracy.

To measure signal occurrence on your own independently documented corpus:

```sh
npm run evaluate -- /path/to/corpus.json
```

The JSON file must contain an array of `{ "text": "…", "label": "human", "source": "documented origin", "language": "en" }` objects. Allowed labels are `human`, `generated`, `edited`, and `translated`. Use representative samples, document consent/licensing, and keep confidential corpora outside this public repository. The script prints aggregate counts only. It does not infer labels, declare authorship, or claim classification accuracy.

## Security and automated checks

See [SECURITY.md](SECURITY.md) for safeguards, hosting requirements, and maintainer settings. Pull requests and pushes to `main` run the regression/security suite with read-only permissions. The HTML carries a restrictive CSP; `_headers` supplies policies to compatible static hosts. The optional Worker ESM response wrapper embeds the assets and enforces the HTTP policies, including framing restrictions, directly. Verify deployed headers independently. Header files are not universal hosting configuration.

The worker is cancelled when content or language changes, when cleared, or after a ten-second timeout. File reads also cannot overwrite newer edits. Browser-local processing is not a substitute for host authentication or device security.

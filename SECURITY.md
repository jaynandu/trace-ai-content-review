# Security

Trace is a static browser-local tool. An optional Worker ESM wrapper serves the assets with HTTP security headers. It has no server-side text analysis, API keys, accounts, database, analytics, or persistence. The hosting provider independently controls visitor access. Interface labels do not enforce access.

## Safeguards

- Input rendering uses text nodes, not HTML parsing.
- A restrictive CSP is embedded in HTML. The Worker ESM wrapper applies CSP, framing restrictions, nosniff, no-referrer, and camera/microphone/geolocation restrictions to every response. Static hosts can use `_headers` if supported.
- There are no external font or script dependencies.
- Analysis runs in a disposable same-origin worker, with a 10-second timeout.
- Engine input is limited to 100,000 UTF-16 code units. Text file imports are limited to 500,000 bytes and `.txt`/`.md`; NUL-containing content is rejected.
- Exported reports omit source excerpts and text-derived observations unless the user opts in.
- CI has read-only repository permissions and a commit-pinned checkout action.

The meta CSP cannot enforce frame-ancestors. Verify HTTP response headers on the chosen host; `_headers` is not portable server configuration. Do not advertise enforced framing or header protections unless the deployed response has been checked.

## Reporting

Avoid posting confidential inputs, personal information, or exploit details in public issues. Use GitHub's private vulnerability reporting feature if enabled, or contact the repository owner privately. Do not send secrets in an initial report.

## Maintainer settings

Enable secret scanning, push protection, and private vulnerability reporting where available. Protect `main` with the `Tests and security checks` status check after it has run. Review installed GitHub Apps and restrict permissions to what is needed. These are GitHub settings, not guarantees made by the source code.

Security tests reduce risk; they are not a security certification. Trace's heuristics are not a validated authorship classifier.

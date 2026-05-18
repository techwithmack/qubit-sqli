# Community rules (from [semgrep/semgrep-rules](https://github.com/semgrep/semgrep-rules))

Curated copy of upstream rules chosen for **this stack**: Next.js 16, TypeScript, React 19, Node route handlers, `better-sqlite3`, `child_process.exec`.

**Provenance:** see [`SOURCES.txt`](SOURCES.txt).

**License:** [Semgrep Rules License v1.0](https://semgrep.dev/legal/rules-license).

## Why these rules?

| Category | Upstream paths | Relevance |
|----------|----------------|-----------|
| SQLi (Node ORMs) | `javascript/lang/security/audit/sqli/*` | Sinks: knex/pg/mysql/mssql `.query()` — not `better-sqlite3.prepare()` |
| SQLi (Lambda) | `tainted-sql-string.yaml` | Sources: Lambda `$EVENT` — not `request.nextUrl.searchParams` |
| CMDi | `detect-child-process.yaml` | Taint from **same-function** parameters — not `request.json()` → helper → `exec` |
| React XSS | `typescript/react/security/**` | Client UI; lab vulns are server SQLi/CMDi |

## Detection experiment (`app/api/`)

Lab code was rewritten to **inline template literals** in `prepare()` and `exec()` (textbook shapes). Results:

| Config | Findings on `search` + `ping` |
|--------|-------------------------------|
| `.opengrep/community` (21 rules here) | **0** |
| `.opengrep/galactic-lab.yaml` | **3–4** |
| `opengrep scan --config auto app/api/` | **0** |

**Takeaway:** Cloned community rules are the right *bug classes* but wrong *framework/sink* models for this app. Use `npm run scan:security` for teaching; use `scan:community` to demonstrate false negatives.

## Run

```bash
npm run scan:community
npm run scan:security
npm run scan:all
```

# The Galactic Bestiary

Web interface for the consolidated xenobiology archive: creature registry, archive search, planet connectivity checks, and an operator console for curators.

**Live instance:** [https://main.d3ompulu8lf7wb.amplifyapp.com/](https://main.d3ompulu8lf7wb.amplifyapp.com/)

## Requirements

- Node.js 20+
- macOS or Linux for the sample `ping -c 4` relay check (Windows hosts should swap to `ping -n 4` in [`app/api/ping/route.ts`](app/api/ping/route.ts))

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). SQLite is created automatically at `data/galactic.db` on first request and seeded with creature and user rows.

## Reference

See **[CHEATSHEET.md](CHEATSHEET.md)** for API notes, example requests, and security-testing guidance.

## API overview

| Feature | Route | Notes |
|---------|-------|--------|
| Creature search | `GET /api/search` | Query parameter `q` |
| Archive console login | `POST /api/admin/login`, UI at `/admin/login` | Session cookie on success |
| Admin CRUD | `/admin`, `/api/admin/*` | Requires admin session |
| Planet connectivity | `POST /api/ping` | JSON body `{ "target": "…" }` |
| Catalog listing | `GET /api/creatures` | Public creature list |

## Seeded users (MD5 passwords)

Passwords are stored as **MD5 hex**. Plaintext values for the seeded accounts:

| Username | Password |
|----------|----------|
| `agent_kane` | `nebula-agent` |
| `dr_vex` | `void-walker` |
| `cmd_tess` | `stellar-ops` |
| `analyst_rio` | `deep-core` |
| `xenon_7` | `xenon-clear` |
| `archivist` | `star-chart-7` (admin console) |

Admin login compares the password field to the stored hash; use the MD5 hex `d0ebde9330af602cbaaf3ca6c9b5d34f` for `archivist` when signing in without other tooling.

## Resetting the database

Delete `data/galactic.db` and restart the dev server to re-run the seed.

## Static analysis (Opengrep)

Project-specific rules live in [`.opengrep/galactic-lab.yaml`](.opengrep/galactic-lab.yaml). Key API routes:

- [`app/api/search/route.ts`](app/api/search/route.ts)
- [`app/api/admin/login/route.ts`](app/api/admin/login/route.ts)
- [`app/api/ping/route.ts`](app/api/ping/route.ts)

| Scan | Typical result on `app/api/` |
|------|------------------------------|
| `npm run scan:security` ([`.opengrep/galactic-lab.yaml`](.opengrep/galactic-lab.yaml)) | **4–5 findings** |
| `npm run scan:community` ([`.opengrep/community/`](.opengrep/community/)) | **0** (rules target Express/Lambda/mysql, not Next.js + `better-sqlite3`) |
| `opengrep scan --config auto app/api/` | **0** (registry gap for this stack) |

```bash
npm run scan:security
npm run scan:community
npm run scan:all
```

See [`.opengrep/community/README.md`](.opengrep/community/README.md) and [CHEATSHEET.md](CHEATSHEET.md).

## Build

```bash
npm run build
npm start
```

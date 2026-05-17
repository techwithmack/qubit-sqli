# The Galactic Bestiary

Local-only **cybersecurity lab** UI for teaching **SQL injection** and **command injection**. This application is **deliberately vulnerable** in specific API routes. Do **not** expose it to the internet or run it on shared infrastructure.

## Requirements

- Node.js 20+
- macOS or Linux for the sample `ping -c 4` relay check (Windows labs should swap to `ping -n 4` in [`app/api/ping/route.ts`](app/api/ping/route.ts))

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). SQLite is created automatically at `data/galactic.db` on first request and seeded with classified creature and user rows.

## Exploitation cheatsheet

See **[CHEATSHEET.md](CHEATSHEET.md)** for instructor/student payloads (SQLi, command injection, lab flow, and remediation notes).

## Lab surfaces

| Feature            | Route              | Issue |
|--------------------|--------------------|--------|
| Creature search    | `GET /api/search`  | SQL built with string interpolation |
| Archive console login | `POST /api/admin/login`, UI at `/admin/login` | Auth query built with string interpolation (login bypass) |
| Admin CRUD (post-auth) | `/admin`, `/api/admin/*` | Parameterized SQL; session cookie only |
| Planet “ping” tool | `POST /api/ping`   | User input passed to `child_process.exec` |
| Catalog listing    | `GET /api/creatures` | Uses parameterized queries (safe baseline) |

## Seeded users (MD5 passwords)

Passwords are stored as **MD5 hex** for the exercise. Plaintext originals for the seeded accounts:

| Username      | Original password (for demos) |
|---------------|-----------------------------|
| `agent_kane`  | `nebula-agent`              |
| `dr_vex`      | `void-walker`               |
| `cmd_tess`    | `stellar-ops`               |
| `analyst_rio` | `deep-core`                 |
| `xenon_7`     | `xenon-clear`               |
| `archivist`   | `star-chart-7` (admin console) |

## Resetting the database

Delete `data/galactic.db` and restart the dev server to re-run the seed.

## Static analysis (Opengrep)

Intentional flaws use **direct textbook sinks** (easier to spot in code review):

- **SQLi (search):** `db.prepare(\`SELECT ... '${q}'\`)` — [`app/api/search/route.ts`](app/api/search/route.ts)
- **SQLi (login):** `db.prepare(\`SELECT ... '${username}' ... '${password}'\`)` — [`app/api/admin/login/route.ts`](app/api/admin/login/route.ts)
- **CMDi:** `exec(\`ping -c 4 ${host}\`)` — [`app/api/ping/route.ts`](app/api/ping/route.ts)

| Scan | Typical result on `app/api/` |
|------|------------------------------|
| `npm run scan:security` ([`.opengrep/galactic-lab.yaml`](.opengrep/galactic-lab.yaml)) | **4–5 findings** |
| `npm run scan:community` ([`.opengrep/community/`](.opengrep/community/)) | **0** (rules target Express/Lambda/mysql, not Next.js + `better-sqlite3`) |
| `opengrep scan --config auto app/api/` | **0** (same registry gap for this stack) |

```bash
npm run scan:security   # lab rules — use in class
npm run scan:community  # cloned semgrep-rules subset
npm run scan:all        # both
```

See [`.opengrep/community/README.md`](.opengrep/community/README.md) for the detection experiment. Manual payloads: [CHEATSHEET.md](CHEATSHEET.md).

## Build

```bash
npm run build
npm start
```

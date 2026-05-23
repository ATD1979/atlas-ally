# Atlas Ally — Session Context

This file is read at the start of every Claude Code session. It establishes stack, workflow rules, locked decisions, and current focus so each new session starts grounded.

For detailed session history, see handoffs (location below).

---

## Stack & deployment

- **Runtime:** Node.js 20 LTS (pinned via `.nvmrc`; see D31)
- **Server:** Express
- **DB:** SQLite via `better-sqlite3`. Thin wiring in `src/db.js`; schema/factory in `src/db-factory.js` (D32)
- **Hosting:** Railway
- **Lint/format:** ESLint flat config + Prettier 3; husky pre-commit via lint-staged (D35)
- **Tests:** Jest + supertest. Config in `jest.config.js` (D41). Env stubs in `jest.setup.js` (D42). Glob: `**/test/**/*.test.js` (D33)
- **CI required gate:** `Syntax, Audit & Test (pull_request)` (D34)
- **OS:** Windows; shell is PowerShell

---

## Workflow rules (active habits)

- One clear action per message.
- Mandatory `git diff` review before every commit.
- `git log --oneline -1` pasted after every commit (capture hash).
- Deploy hash captured after every Railway deploy.
- `node -c` syntax checks before staging JS changes.
- Numbered step lists.
- Commit-per-concept discipline.
- Multi-paragraph commit messages on PowerShell: write a single-quoted here-string to `commit-msg.txt`, then commit with `-F`:
  ```powershell
  @'
  Subject line.

  Body paragraph.
  '@ | Out-File commit-msg.txt -Encoding utf8
  git commit -F commit-msg.txt
  ```
- **Drift-audit before acting on carry-forwards (D37):** verify the item isn't already done via `git show HEAD:<file>` or by reading the file directly.
- **Transient cross-branch inspection (D44):** use `git show <branch>:<file>`, NOT `git checkout <branch> -- <file>` (the latter stages the file in the current branch's index).
- Handoffs lock decisions to avoid re-litigation across sessions; refer back rather than re-deciding.

---

## Handoffs

- **Location:** `..\handoffs\` (sibling of this repo, NOT inside it)
- **Naming:** `HANDOFF_v6_NN.md` (e.g. `HANDOFF_v6_40.md`)
- **Most recent at time of writing:** v6.40 (May 23 2026, ~12:15 AM CDT). Current branch `main` at `52110c0`; prod deploy `a1329439`.
- Each handoff includes session summary, locked decisions, workflow rules, top-of-mind focus, and pending carry-forwards. Read the latest handoff at session start when picking up unfinished work.

---

## Top of mind (start of v6.41)

**Primary focus: UI redesign — Shape A-mini on Live Feed** (per D45).

- **Mockup:** `docs/mockups/v1-redesign-2026-05.html` (companion: `atlas-ally-logo.svg`, `README.md`).
- **Six screens defined** (NOT three tabs): 01 Live Feed, 02 My Countries, 03 Add Country, 04 Travel Checklists, 05 Safe Route Planner, 06 My Account. All side-by-side on one page for desktop preview; each in a `.screen-wrap > .screen-label + .phone` shell.
- **Design system:** CSS variables (`--teal #0E7490`, `--gold #F59E0B`, `--red #EF4444`, `--green #10B981` + `-light` variants; `--bg`, `--card`, `--border`, `--text`, `--muted`, `--subtle`). DM Sans + DM Mono via Google Fonts. Mobile-first 320px fixed width.
- **Class vocabulary:** short, screen-prefixed (`.f*` Feed, `.c*` Countries, `.s*` Add/Search, `.tb*` tabbar). Patterns: `.feed-tabs` + `.ftab` + `.ftab.on`; `.fitem` + `.ficon` color-coded `.fi-red`/`.fi-amber`/`.fi-green`/`.fi-blue`; `.tabbar` + `.tbi`; `.ccard`; tag primitives `.tr`/`.ta`/`.tg`/`.tb`.
- **Approach (D45):** introduce alongside, don't patch in place. New screens ship at separate routes (`/v2-feed`, `/v2-countries`, …) as standalone HTML in `public/`. Old screens at existing routes keep working. Swap routing once all six are built. No feature flags. Don't try to be fully right about CSS architecture in session 1 — inline/single-file per screen is fine until a second screen reveals what's shared.
- **First action next session:** ship `public/v2-feed.html` at route `/v2-feed` rendering Screen 01 with hardcoded dummy event data — no `/api/events` wiring yet. Mount follows the `/landing` pattern in `src/server.js` (around line 217). Estimated 45-60 min.
- **Skip in session 1:** bottom tabbar wiring, top bar menu, real-data wiring.

**Deferred behind UI work:** Pack AI (D38, Path A) — eval harness is the first action when work begins.

**Off-keyboard:** ACLED commercial licensing outreach (blocked on Adrian, not code).

---

## Locked decisions (D21–D45, one line each)

- **D21** — Re-grep before assuming a function exists or has a given signature.
- **D22** — Sample before scoping: read 50-100 lines of a file before estimating work against it.
- **D23** — ACLED data cannot be used commercially without a separate license agreement.
- **D24** — License-audit data sources before writing integration code.
- **D25** — Surgical changes over sweeping ones.
- **D26** — No literal email addresses in user-visible HTML.
- **D27** — Jordan noise filter unified into `passesNoiseFilter(title, code)` in `countries-meta.js`.
- **D28** — Centralized fetch timeouts via `src/lib/http.js`.
- **D29** — `safeAddColumn` pattern for additive schema migrations.
- **D30** — TYPE_TO_CAT lives in two places (`public/nav.js:723` + `src/lib/classify.js:128`); dedupe when server map next changes.
- **D31** — Node 20 LTS pinned.
- **D32** — `src/db.js` is thin wiring; `src/db-factory.js` exports `createDb` and `initSchema`.
- **D33** — Jest test glob: `**/test/**/*.test.js`.
- **D34** — Required CI gate name: `Syntax, Audit & Test (pull_request)`.
- **D35** — ESLint flat config with Prettier 3, husky pre-commit via lint-staged.
- **D36** — Step 3e (localStorage persistence + switched-country banner) shipped. Closed.
- **D37** — Drift-audit-before-acting on carry-forwards.
- **D38** — Pack AI = Path A (full LLM personalization, no template floor). Eval harness first.
- **D39** — DB-injection pattern for route tests = route factory: `module.exports = (db) => { … return router; }`, mounted via `require('./routes/X')(db)`.
- **D40** — Tests use `makeTestDb()` from `test/helpers/db.js`, never `createDb` + `initSchema` directly.
- **D41** — `jest.config.js` is the canonical Jest config location (NOT a `jest` block in package.json — silently ignored when both exist).
- **D42** — Env vars stubbed via `jest.setup.js` at repo root with `||=` so local `.env` wins.
- **D43** — Side-panel AI suggestions in the GitHub UI are one data point, not authoritative.
- **D44** — `git checkout <branch> -- <file>` stages; use `git show <branch>:<file>` for transient inspection.
- **D45** — UI redesign = introduce alongside, don't patch in place. New screens at separate routes (`/v2-feed` etc.); swap to default once arc completes.

---

## Useful conventions

- **Project root:** `C:\Users\Adrian Druba\Desktop\Safety App\Travel Guardian\atlas-ally`
- **GitHub:** `ATD1979/atlas-ally`
- **Production URL:** atlas-ally.com
- **Route file pattern:** `src/routes/<name>.js`. New testable routes should follow D39's factory shape.
- **Test layout:** `test/integration/<route>.test.js`, `test/helpers/db.js`.
- **PowerShell-isms:** `curl` is an alias for `Invoke-WebRequest` — use `curl.exe` for the real binary, or `Invoke-RestMethod ... | ConvertTo-Json -Depth 5` for parsed JSON. `Rename-Item .env .env.local-backup` to temporarily hide `.env` for CI simulation.

---

## How to use this file

- Read it at session start. The newest handoff (`..\handoffs\HANDOFF_v6_NN.md`) supplements with session-specific context.
- When a workflow rule or decision is reaffirmed or amended, update this file in the same PR that captures the change.
- Keep it under ~200 lines. Detail belongs in handoffs; this file is the index.

# 2026-05-23 — Dual Classifier Architecture & Why Path C

## Finding

Three independent classifier paths exist in this codebase, not one as `src/lib/classify.js`'s header comment suggests:

1. **`src/lib/classify.js` `classifyEvent`** — `EVENT_RULES` (regex, 15 rules, first-match-wins). Used **only** by the live Google News fetch path in `src/routes/events.js` at serve time. Output is never persisted to the events table.

2. **`src/services/events-ingest.js` `classify`** — `TYPE_MAP` + `SEVERITY_MAP` (substring `includes()`, 12 rules, first-match-wins). Used by every persistent ingester (UCDP, US Embassy, UK FCDO, ReliefWeb, InSight Crime, UNODC; GDELT disabled). Output is written to the `events` table. Per-source overrides on top of this (UCDP → `explosion` for state-based violence, InSight Crime → `drug` when default, US Embassy → `siren` when default, etc.) further mutate the result before insert.

3. **`public/nav.js` `classifyFeedItem`** — render-time mapping. Takes `{type, severity, title}` and returns visual treatment (`{icon, color, pill, pillColor}`). Five ordered branches: cleared / weather / advisory / critical-urgent / default. Runs against whatever classifiers 1+2+overrides produced.

## Evidence

`scripts/classifier-coverage.js` against the last 100 stored events showed **93% drift** between stored `(type, severity)` and what `classifyEvent` would produce on the same titles. Initially read as a bug; investigation revealed it as the structural consequence of classifier #1 measuring against data produced by classifier #2 + source overrides.

Re-run the script after any classifier change to see drift movement. Use as a before/after baseline for future ingester / classifier work.

## Decision tonight: Path C

Ship `public/v2-feed.html` as a standalone Live Feed redesign at `/v2-feed`, porting `classifyFeedItem` inline. **Do not touch the data layer (classifiers #1 or #2, ingesters, stored events).**

Reasoning:

- `classifyFeedItem` already implements the 5-branch visual variety the v1 redesign mockup requires (`docs/mockups/v1-redesign-2026-05.html`, Screen 01). The current production Live Feed is closer to the mockup than the v6.40 handoff implied — what's missing is the redesigned shell, not the variety logic.
- Building v2-feed against the current data reveals which branches of `classifyFeedItem` rarely fire (weather, gov advisory, cleared/lifted are sparse in the conflict-heavy stored data). That informs Path B's design — i.e., what variety the data layer actually needs to produce.
- Lowest-risk path. No ingester changes, no stored-data backfill, no migration.

## Path B (deferred, future session)

Consolidate classifiers #1 and #2 — the consolidation `lib/classify.js`'s header comment claims is done but wasn't:

- Delete the local `classify` / `TYPE_MAP` / `SEVERITY_MAP` block in `events-ingest.js`.
- Import `classifyEvent` from `lib/classify.js` and use it everywhere ingestion runs title-based classification.
- Formalize per-source overrides as a separate `applySourceOverride(type, source)` step, kept explicit (not buried in the ingester logic).
- Add per-ingester test fixtures using representative titles.
- Use `scripts/classifier-coverage.js` as the before/after baseline.

Estimated effort: 2-3 hours. Multi-session. Has real regression risk in production ingest — needs careful sampling.

## What this doc is for

A future session should be able to read this and skip re-deriving the architecture finding. If you are tempted to "improve EVENT_RULES" to fix Live Feed visual variety, stop and read this first — EVENT_RULES governs only the live-gnews ~10% of the data flow, not the persisted events table.

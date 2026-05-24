#!/usr/bin/env node
// scripts/classifier-coverage.js
//
// Measures EVENT_RULES coverage and drift. For each of the last 100 stored
// events, compares the persisted (type, severity) against what classifyEvent()
// would produce today.
//
// Run after changing src/lib/classify.js to confirm coverage improved.
// Re-run periodically as a drift check.
//
// Usage:
//   node scripts/classifier-coverage.js                 # to stdout
//   node scripts/classifier-coverage.js > sample.txt    # to file
//
// Note: requires('../src/db') triggers idempotent schema migrations on load —
// usually silent on an up-to-date DB, but the first run after a schema change
// may print "✅ Migration: ..." lines before the report.

const db = require('../src/db');
const { classifyEvent } = require('../src/lib/classify');

const rows = db.getRecentEvents.all();

// ─── helpers ──────────────────────────────────────────────────────────────────
function tally(arr, keyOrFn) {
  const out = {};
  for (const r of arr) {
    const k = (typeof keyOrFn === 'function' ? keyOrFn(r) : r[keyOrFn]) ?? '(null)';
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}

function printCounts(label, counts) {
  console.log(label);
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  for (const [k, n] of sorted) console.log(`  ${String(k).padEnd(20)} ${n}`);
  console.log('');
}

function divider(text) {
  const bar = '═'.repeat(70);
  console.log(bar);
  console.log(text);
  console.log(bar);
}

// ─── annotate rows with computed values ───────────────────────────────────────
const annotated = rows.map(r => {
  const c = classifyEvent(r.title);
  return {
    ...r,
    computed_type:     c.type,
    computed_severity: c.severity,
    drift: r.type !== c.type || r.severity !== c.severity,
  };
});

// ─── header ───────────────────────────────────────────────────────────────────
console.log('');
console.log(`TOTAL ROWS SAMPLED: ${annotated.length}`);
console.log(`Source: events table, last 100 by created_at DESC`);
console.log('');

// ─── distributions ────────────────────────────────────────────────────────────
printCounts('STORED severity:',   tally(annotated, 'severity'));
printCounts('COMPUTED severity:', tally(annotated, 'computed_severity'));
printCounts('STORED type:',       tally(annotated, 'type'));
printCounts('COMPUTED type:',     tally(annotated, 'computed_type'));

// ─── drift ────────────────────────────────────────────────────────────────────
const driftRows = annotated.filter(r => r.drift);
console.log(`DRIFT (stored != computed): ${driftRows.length} of ${annotated.length}`);
console.log('');

// ─── group by computed_type ───────────────────────────────────────────────────
const byComputedType = {};
for (const r of annotated) {
  (byComputedType[r.computed_type] = byComputedType[r.computed_type] || []).push(r);
}

// ─── incident bucket (the default fallback — the bucket we want to shrink) ────
const incidents = byComputedType.incident || [];
divider(`computed_type='incident' (default fallback) — ${incidents.length} rows, 15 samples`);
incidents.slice(0, 15).forEach(r => console.log(`  ${JSON.stringify(r.title)}`));
console.log('');

// ─── other computed types, 5 samples each ─────────────────────────────────────
const otherTypes = Object.keys(byComputedType)
  .filter(t => t !== 'incident')
  .sort((a, b) => byComputedType[b].length - byComputedType[a].length);

for (const t of otherTypes) {
  console.log(`─── computed_type='${t}' (${byComputedType[t].length} rows) — 5 samples ───`);
  byComputedType[t].slice(0, 5).forEach(r => console.log(`  ${JSON.stringify(r.title)}`));
  console.log('');
}

// ─── news_cache sample — wild titles NOT being persisted to events ────────────
try {
  const newsRows = db.db.prepare(
    `SELECT title FROM news_cache WHERE title IS NOT NULL ORDER BY RANDOM() LIMIT 10`
  ).all();
  if (newsRows.length) {
    divider(`news_cache — 10 random titles (NOT being persisted to events)`);
    newsRows.forEach(r => console.log(`  ${JSON.stringify(r.title)}`));
    console.log('');
  } else {
    console.log('news_cache: no rows.\n');
  }
} catch (e) {
  console.log(`news_cache sample failed: ${e.message}\n`);
}

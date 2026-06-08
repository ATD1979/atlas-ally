// Atlas Ally — Per-country risk score (cached, computed from local DB only)
//
// Design: NEW_ENDPOINTS_DESIGN_v1 §1. Activity-driven score with an advisory
// floor. Inputs are the local `events` table only — no external calls — so this
// is safe to run in the ingest cron tail and dodges the egress throttling that
// disabled GDELT.
//
// v1 trend signal: event-volume momentum (last 7 days vs the prior 7). The
// news-classified crime trend is a planned enrichment, not wired here.
//
// Prepared statements are created lazily *inside* functions (not at module
// top-level) so this file can be required at boot before ensureRuntimeTables()
// has created the risk_scores table. better-sqlite3 caches by SQL text, so the
// repeated prepare() calls are effectively free.

'use strict';

const db = require('../db');
const { COUNTRIES } = require('../countries');
const { META } = require('../lib/countries-meta');

// ── Tunable constants (calibrate against real data) ─────────────────────────
const SATURATION_K = 8;            // event_load where base ≈ 63 / 100
const SEVERITY_WEIGHT = { critical: 3, crit: 3, high: 2.5, warn: 1.5, info: 1 };
const TREND_FACTOR = { rising: 1.15, stable: 1.0, falling: 0.9 };
const ADVISORY_FLOOR = { 1: 0, 2: 20, 3: 40, 4: 60 };

// Band → display metadata (palette mirrors ADVISORY_LEVELS in countries.js).
const BAND_META = {
  low:      { label: 'Low',      emoji: '🟢', color: '#22c55e' },
  elevated: { label: 'Elevated', emoji: '🟡', color: '#f59e0b' },
  high:     { label: 'High',     emoji: '🟠', color: '#f97316' },
  extreme:  { label: 'Extreme',  emoji: '🔴', color: '#ef4444' },
};

function bandKey(score) {
  if (score <= 24) return 'low';
  if (score <= 49) return 'elevated';
  if (score <= 74) return 'high';
  return 'extreme';
}

// ── SQL (lazy-prepared) ─────────────────────────────────────────────────────
const SQL_LOAD = `
  SELECT severity, COUNT(*) AS c
  FROM events
  WHERE country_code = ? AND status = 'approved' AND is_test = 0
    AND created_at > datetime('now', '-7 days')
  GROUP BY severity`;

const SQL_COUNT_PRIOR = `
  SELECT COUNT(*) AS c
  FROM events
  WHERE country_code = ? AND status = 'approved' AND is_test = 0
    AND created_at > datetime('now', '-14 days')
    AND created_at <= datetime('now', '-7 days')`;

const SQL_UPSERT = `
  INSERT INTO risk_scores (country_code, score, band, factors_json, computed_at)
  VALUES (@country_code, @score, @band, @factors_json, datetime('now'))
  ON CONFLICT(country_code) DO UPDATE SET
    score        = excluded.score,
    band         = excluded.band,
    factors_json = excluded.factors_json,
    computed_at  = excluded.computed_at`;

// ── Compute ─────────────────────────────────────────────────────────────────
function eventStats(code) {
  let load = 0, count = 0;
  for (const row of db.db.prepare(SQL_LOAD).all(code)) {
    load  += (SEVERITY_WEIGHT[row.severity] ?? 1.5) * row.c;
    count += row.c;
  }
  return { load, count };
}

function computeScore(code) {
  const { load, count } = eventStats(code);
  const prior = db.db.prepare(SQL_COUNT_PRIOR).get(code).c;

  const trend = count > prior * 1.2 ? 'rising'
              : count < prior * 0.8 ? 'falling'
              : 'stable';

  const base     = 100 * (1 - Math.exp(-load / SATURATION_K));
  const activity = base * TREND_FACTOR[trend];

  const advisoryLevel = COUNTRIES[code]?.advisoryLevel || null;
  const floor = advisoryLevel ? (ADVISORY_FLOOR[advisoryLevel] || 0) : 0;

  const score = Math.round(Math.min(100, Math.max(0, activity, floor)));
  const band  = bandKey(score);

  const factors = [
    { signal: 'events', label: `${count} event${count === 1 ? '' : 's'} in the last 7 days`, contribution: Math.round(base) },
    { signal: 'trend',  label: `Activity ${trend}`, contribution: Math.round(activity - base) },
  ];
  if (floor > Math.round(Math.min(100, activity))) {
    factors.push({
      signal: 'advisory_floor',
      label: `Floored by travel advisory level ${advisoryLevel}`,
      contribution: Math.round(floor - Math.min(100, activity)),
    });
  }

  return { country_code: code, score, band, ...BAND_META[band], factors };
}

// Recompute every country (the 55 META set ∪ the rich COUNTRIES set) and upsert.
// Wrapped in a transaction for speed; returns the count scored.
function recomputeAllRiskScores() {
  const codes  = [...new Set([...Object.keys(META), ...Object.keys(COUNTRIES)])];
  const upsert = db.db.prepare(SQL_UPSERT);
  const run = db.db.transaction(list => {
    for (const code of list) {
      const r = computeScore(code);
      upsert.run({
        country_code: r.country_code,
        score:        r.score,
        band:         r.band,
        factors_json: JSON.stringify(r.factors),
      });
    }
  });
  run(codes);
  return codes.length;
}

module.exports = { recomputeAllRiskScores, computeScore, bandKey, BAND_META };

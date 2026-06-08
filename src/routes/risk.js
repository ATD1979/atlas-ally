// Atlas Ally — Risk score routes (/api/risk, /api/risk/:code)
//
// Design: NEW_ENDPOINTS_DESIGN_v1 §1. Pure cache reads from risk_scores
// (populated by the ingest cron via services/risk.recomputeAllRiskScores).
// No external calls, no compute at request time.
//
// PR #1 leaves these open. PR #2 (the tier-gate middleware) wraps them with
// requirePremium, since risk score is a premium feature — see the TODO below.

const router = require('express').Router();
const db = require('../db');
const { BAND_META } = require('../services/risk');

function hydrate(row) {
  const meta = BAND_META[row.band] || {};
  let factors = [];
  try { factors = JSON.parse(row.factors_json || '[]'); } catch {}
  return {
    country_code: row.country_code,
    score:        row.score,
    band:         row.band,
    label:        meta.label || null,
    emoji:        meta.emoji || null,
    color:        meta.color || null,
    factors,
    computed_at:  row.computed_at,
  };
}

// GET /api/risk — all scored countries (map fill + feed badges)
// TODO(PR#2): gate behind requirePremium once the tier middleware lands.
router.get('/risk', (req, res) => {
  const rows = db.db.prepare(`SELECT * FROM risk_scores`).all();
  res.json(rows.map(hydrate));
});

// GET /api/risk/:code — single country
// TODO(PR#2): gate behind requirePremium once the tier middleware lands.
router.get('/risk/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const row  = db.db.prepare(`SELECT * FROM risk_scores WHERE country_code = ?`).get(code);
  if (!row) return res.status(404).json({ error: 'No risk score for this country yet' });
  res.json(hydrate(row));
});

module.exports = router;

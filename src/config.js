// Atlas Ally — Centralized runtime configuration
// v2026.04.21 — created for B1 (security hardening pass)
//
// This is the ONLY place env vars are read. Every consumer imports from here.
// The server refuses to boot if any `required()` variable is missing, which
// surfaces misconfiguration loudly instead of silently falling back to a
// hardcoded default (the previous pattern that leaked secrets into the repo).
'use strict';

require('dotenv').config();

function required(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`FATAL: Missing required environment variable: ${name}`);
    console.error('Set it in Railway (production) or .env (local dev) and restart.');
    process.exit(1);
  }
  return v;
}

function optional(name, defaultValue) {
  const v = process.env[name];
  return (v === undefined || v === '') ? defaultValue : v;
}

module.exports = {
  // Secrets — server won't boot without these
  JWT_SECRET:        required('JWT_SECRET'),
  GATE_PASSWORD:     required('GATE_PASSWORD'),
  IMPROVMX_PASSWORD: required('IMPROVMX_PASSWORD'),
  ANTHROPIC_API_KEY: required('ANTHROPIC_API_KEY'),

  // Optional — app degrades gracefully if missing
  UCDP_API_KEY: optional('UCDP_API_KEY', ''),  // if missing, UCDP ingestion skips with warning

  // Runtime config with sane defaults
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT:     parseInt(optional('PORT', '3000'), 10),
  BASE_URL: optional('BASE_URL', 'http://localhost:3000'),
};

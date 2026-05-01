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

  // Deprecated — PR #33 deleted the custom admin-token flow that was the only
  // consumer. Kept as optional() in case any unmerged code still references it;
  // safe to remove from Railway once verified clean. Demote target: PR #35+.
  ADMIN_PASSWORD: optional('ADMIN_PASSWORD', null),

  // Twilio — required for WhatsApp alerts (core feature, set on Railway)
  TWILIO_ACCOUNT_SID:   required('TWILIO_ACCOUNT_SID'),
  TWILIO_AUTH_TOKEN:    required('TWILIO_AUTH_TOKEN'),
  TWILIO_WHATSAPP_FROM: required('TWILIO_WHATSAPP_FROM'),

  // Admin seeding — see services/seed.js. Required on every boot to ensure
  // admin records exist. PR #34 moved these out of source code (was hardcoded
  // PII in seed.js). Note: ADMIN_*_STATE_ORIGIN is optional because not every
  // admin has one (e.g. non-US admins).
  ADMIN_1_WHATSAPP:       required('ADMIN_1_WHATSAPP'),
  ADMIN_1_NAME:           required('ADMIN_1_NAME'),
  ADMIN_1_EMAIL:          required('ADMIN_1_EMAIL'),
  ADMIN_1_DOB:            required('ADMIN_1_DOB'),
  ADMIN_1_STATE_ORIGIN:   optional('ADMIN_1_STATE_ORIGIN', null),
  ADMIN_1_COUNTRY_ORIGIN: required('ADMIN_1_COUNTRY_ORIGIN'),

  ADMIN_2_WHATSAPP:       required('ADMIN_2_WHATSAPP'),
  ADMIN_2_NAME:           required('ADMIN_2_NAME'),
  ADMIN_2_EMAIL:          required('ADMIN_2_EMAIL'),
  ADMIN_2_DOB:            optional('ADMIN_2_DOB', null),
  ADMIN_2_STATE_ORIGIN:   optional('ADMIN_2_STATE_ORIGIN', null),
  ADMIN_2_COUNTRY_ORIGIN: required('ADMIN_2_COUNTRY_ORIGIN'),

  // Optional — app degrades gracefully if missing
  UCDP_API_KEY: optional('UCDP_API_KEY', ''),  // if missing, UCDP ingestion skips with warning

  // Stripe — latent until premium upgrade flow is wired.
  // null (not '') so consumers can detect "not configured" with a strict
  // `=== null` check and skip Stripe SDK init cleanly.
  STRIPE_SECRET_KEY:      optional('STRIPE_SECRET_KEY', null),
  STRIPE_WEBHOOK_SECRET:  optional('STRIPE_WEBHOOK_SECRET', null),
  STRIPE_BASE_PRICE_ID:   optional('STRIPE_BASE_PRICE_ID', null),
  STRIPE_FAMILY_PRICE_ID: optional('STRIPE_FAMILY_PRICE_ID', null),
  STRIPE_EXTRA_PRICE_ID:  optional('STRIPE_EXTRA_PRICE_ID', null),

  // Runtime config with sane defaults
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT:     parseInt(optional('PORT', '3000'), 10),
  BASE_URL: optional('BASE_URL', 'http://localhost:3000'),
};

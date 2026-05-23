// Jest setup — runs before any test file loads.
//
// src/config.js calls required() on a set of env vars at module-load time and
// exits the process if any are missing (intentional: surfaces misconfig in
// prod). Most test files don't transitively import config (e.g. the harness
// only touches db-factory, which has no internal deps). But route-level
// integration tests import the route, which imports countries-meta, which
// imports config — so without these stubs, those tests fail in CI where no
// secrets are set.
//
// The `||=` (logical assignment) pattern means real env vars (from a local
// .env file via dotenv, or set in a developer's shell) take precedence; the
// stubs only fill gaps. This keeps local tests honest if a dev has real keys
// set.
//
// TWILIO_ACCOUNT_SID must match Twilio's expected `AC[0-9a-f]{32}` format
// because the Twilio SDK validates the SID at construction time. The other
// stubs are arbitrary strings.

process.env.JWT_SECRET             ||= 'test-jwt-secret-not-used-in-real-auth';
process.env.GATE_PASSWORD          ||= 'test-gate-password';
process.env.IMPROVMX_PASSWORD      ||= 'test-improvmx-password';
process.env.ANTHROPIC_API_KEY      ||= 'test-anthropic-key';

process.env.TWILIO_ACCOUNT_SID     ||= 'AC00000000000000000000000000000000';
process.env.TWILIO_AUTH_TOKEN      ||= 'test-twilio-auth-token';
process.env.TWILIO_WHATSAPP_FROM   ||= 'whatsapp:+15555550000';

process.env.ADMIN_1_WHATSAPP       ||= '+15555550001';
process.env.ADMIN_1_NAME           ||= 'Test Admin One';
process.env.ADMIN_1_EMAIL          ||= 'admin1@test.invalid';
process.env.ADMIN_1_DOB            ||= '1970-01-01';
process.env.ADMIN_1_COUNTRY_ORIGIN ||= 'US';

process.env.ADMIN_2_WHATSAPP       ||= '+15555550002';
process.env.ADMIN_2_NAME           ||= 'Test Admin Two';
process.env.ADMIN_2_EMAIL          ||= 'admin2@test.invalid';
process.env.ADMIN_2_COUNTRY_ORIGIN ||= 'US';

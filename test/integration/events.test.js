// Integration test: GET /api/events — serve-time filter behavior.
//
// Verifies the route's relevance_verdict invariant: rows with
// relevance_verdict IS NULL (legacy data ingested before LLM vetting was
// wired) must NOT be served. Only verdict-present rows surface in the
// response.
//
// First route-level integration test for the codebase. Builds on the
// scaffolding proved out by harness.test.js (HANDOFF_v6_37 #1):
//   - makeTestDb() from test/helpers/db.js → isolated :memory: SQLite
//     with the full prod schema applied, same shape as require('../db')
//   - require('../../src/routes/events')(inst) — uses the route factory
//     (PR #80) to inject the test DB without touching the prod singleton
//   - jest.mock on '../../src/lib/rss' to neutralize the live Google
//     News augmentation, which would otherwise make real HTTP calls

// Hoisted by Jest above the requires below. fetchSecurityNewsInLang() in
// the route calls fetchRSS() with five upstream URLs per request; without
// this mock the test would make real HTTP calls (slow, flaky, blocked in
// CI). Returning [] means the gnews path contributes zero rows.
jest.mock('../../src/lib/rss', () => ({
  fetchRSS: jest.fn().mockResolvedValue([]),
}));

const request = require('supertest');
const express = require('express');
const { makeTestDb } = require('../helpers/db');

describe('GET /api/events — relevance_verdict filter', () => {
  let app;
  let inst;

  beforeEach(() => {
    inst = makeTestDb();

    // Seed two rows for country XX:
    //  - One with relevance_verdict='strong' (LLM-vetted shape — should serve)
    //  - One with relevance_verdict=null (legacy pre-vetting — should NOT serve)
    // Country code 'XX' is used because passesNoiseFilter short-circuits to
    // true for any code !== 'JO' (src/lib/countries-meta.js:285), so the
    // Jordan-specific noise rules don't interfere with this test.
    // status defaults to 'approved' and created_at to datetime('now') per the
    // events table schema in db-factory.js.
    const insert = inst.db.prepare(`
      INSERT INTO events (
        country_code, type, title, description, location,
        lat, lng, severity, source, source_url, relevance_verdict
      ) VALUES (
        @country_code, @type, @title, @description, @location,
        @lat, @lng, @severity, @source, @source_url, @relevance_verdict
      )
    `);

    insert.run({
      country_code: 'XX',
      type: 'protest',
      title: 'Strong-verdict test event',
      description: '',
      location: 'XX',
      lat: null,
      lng: null,
      severity: 'medium',
      source: 'test-fixture',
      source_url: 'http://test.invalid/strong',
      relevance_verdict: 'strong',
    });

    insert.run({
      country_code: 'XX',
      type: 'protest',
      title: 'NULL-verdict legacy event',
      description: '',
      location: 'XX',
      lat: null,
      lng: null,
      severity: 'medium',
      source: 'test-fixture',
      source_url: 'http://test.invalid/legacy',
      relevance_verdict: null,
    });

    app = express();
    app.use('/api', require('../../src/routes/events')(inst));
  });

  afterEach(() => {
    inst.db.close();
  });

  test('serves only events with non-null relevance_verdict', async () => {
    const res = await request(app).get('/api/events?country_code=XX');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.events)).toBe(true);
    expect(res.body.events).toHaveLength(1);

    const [event] = res.body.events;
    expect(event.title).toBe('Strong-verdict test event');
    expect(event.relevance_verdict).toBe('strong');
    expect(event.country_code).toBe('XX');
  });

  test('returns a well-formed stats7d block alongside filtered events', async () => {
    const res = await request(app).get('/api/events?country_code=XX');

    expect(res.status).toBe(200);
    expect(res.body.stats7d).toEqual(
      expect.objectContaining({
        total: expect.any(Number),
        per_day: expect.any(Number),
        by_category: expect.any(Object),
        critical: expect.any(Number),
        high: expect.any(Number),
      })
    );
    // Sanity: the one served event should be counted in the 7-day total.
    // created_at defaults to datetime('now'), well within the 7-day window.
    expect(res.body.stats7d.total).toBe(1);
  });
});

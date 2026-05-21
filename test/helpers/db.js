// In-memory test DB factory.
//
// Each call returns a fresh { db, ...helpers } bundle backed by an isolated
// :memory: SQLite connection with the full prod schema applied. Use
// beforeEach(() => { ({ db, helpers } = makeTestDb()); }) to ensure tests
// don't share state.
//
// See HANDOFF_v6_37 "Next 3 projects" #1 and src/db-factory.js for context.

const { createDb } = require('../../src/db-factory');

function makeTestDb() {
  return createDb(':memory:');
}

module.exports = { makeTestDb };

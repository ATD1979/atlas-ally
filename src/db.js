// db.js — atlas DB singleton.
//
// The schema, migrations, and helper definitions live in db-factory.js.
// This module wires up the prod singleton against data/atlas.db and
// re-exports the resulting bundle so every existing
// `const db = require('./db')` call site keeps working unchanged.
//
// Tests should require './db-factory' directly and call createDb(':memory:')
// — importing this file would instantiate a real prod DB as a side effect.
//
// v2026.04.15 — clean slate
// v2026.05.20 — factory extraction (db-factory.js) for testability

const path = require('path');
const { createDb, initSchema } = require('./db-factory');

const DATA_DIR = path.join(__dirname, '..', 'data');
const instance = createDb(path.join(DATA_DIR, 'atlas.db'));

module.exports = { ...instance, createDb, initSchema };

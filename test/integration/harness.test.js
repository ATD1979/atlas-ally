// Harness smoke test — proves the Jest + db-factory test scaffold works.
//
// This file is the foundational proof that integration tests can be
// written against an isolated :memory: SQLite DB with the full prod
// schema. Every subsequent test in test/integration/ depends on this
// pattern working.
//
// See HANDOFF_v6_37 "Next 3 projects" #1 for context.

const { makeTestDb } = require('../helpers/db');

describe('test harness', () => {
  let inst;

  beforeEach(() => {
    inst = makeTestDb();
  });

  afterEach(() => {
    inst.db.close();
  });

  test('makeTestDb returns a usable db + helpers bundle', () => {
    expect(inst.db).toBeDefined();
    expect(typeof inst.upsertUser).toBe('function');
    expect(typeof inst.getAllUsers.all).toBe('function');
  });

  test('schema is applied — can insert and read a user', () => {
    inst.upsertUser({ whatsapp: '+15550001', name: 'Alice', email: 'a@a.com' });
    const u = inst.getUser('+15550001');
    expect(u).toBeDefined();
    expect(u.whatsapp).toBe('+15550001');
    expect(u.name).toBe('Alice');
  });

  test('two test DBs are fully isolated', () => {
    const other = makeTestDb();
    inst.upsertUser({ whatsapp: '+15550002', name: 'Bob', email: 'b@b.com' });
    expect(other.getUser('+15550002')).toBeUndefined();
    other.db.close();
  });
});

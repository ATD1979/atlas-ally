// Atlas Ally — Startup tasks (data seeding)
// v2026.04.15 — clean slate
const db = require('../db');
const config = require('../config');
const { CRIME_DATA } = require('../crime-data');

function seedCrimeData() {
  const now          = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(now.getMonth() - 6);
  const period_start = sixMonthsAgo.toISOString().split('T')[0];
  const period_end   = now.toISOString().split('T')[0];

  CRIME_DATA.forEach(row => {
    const base = {
      country_code: row.country_code, city: row.city, lat: row.lat, lng: row.lng,
      period_start, period_end, source: 'Numbeo'
    };
    db.upsertCrimeStat.run({ ...base, crime_index: row.crime_index, safety_index: row.safety_index, category: 'overall' });
    if (row.types) {
      Object.entries(row.types).forEach(([type, index]) => {
        db.upsertCrimeStat.run({ ...base, crime_index: index, safety_index: 100 - index, category: type });
      });
    }
  });
  console.log(`✅ Crime data seeded: ${CRIME_DATA.length} cities`);
}

// PR #34: admin records sourced from env vars via config.js. PII no longer
// lives in source. Note: existing entries remain in Git history; full
// sanitization requires `git filter-repo` and is a separate decision.
const ADMINS = [
  {
    whatsapp:       config.ADMIN_1_WHATSAPP,
    name:           config.ADMIN_1_NAME,
    email:          config.ADMIN_1_EMAIL,
    dob:            config.ADMIN_1_DOB,
    state_origin:   config.ADMIN_1_STATE_ORIGIN,
    country_origin: config.ADMIN_1_COUNTRY_ORIGIN,
  },
  {
    whatsapp:       config.ADMIN_2_WHATSAPP,
    name:           config.ADMIN_2_NAME,
    email:          config.ADMIN_2_EMAIL,
    dob:            config.ADMIN_2_DOB,
    state_origin:   config.ADMIN_2_STATE_ORIGIN,
    country_origin: config.ADMIN_2_COUNTRY_ORIGIN,
  },
];

function seedAdminUsers() {
  ADMINS.forEach(admin => {
    try {
      if (!db.getUser(admin.whatsapp)) {
        db.createUser({
          whatsapp:       admin.whatsapp,
          name:           admin.name,
          email:          admin.email,
          dob:            admin.dob,
          state_origin:   admin.state_origin,
          country_origin: admin.country_origin,
          trial_code:     null,
          distributor_id: null,
        });
      }
      db.db.prepare(`
        UPDATE users
        SET role      = 'admin',
            plan      = 'premium',
            verified  = 1,
            email     = COALESCE(NULLIF(@email,''), email),
            name      = COALESCE(NULLIF(@name,''), name),
            trial_end = datetime('now', '+3650 days')
        WHERE whatsapp = @whatsapp
      `).run({ whatsapp: admin.whatsapp, email: admin.email, name: admin.name });
      console.log(`✅ Admin ready (***${admin.whatsapp.slice(-4)})`);
    } catch (e) {
      console.warn(`Admin seed warning (***${admin.whatsapp.slice(-4)}):`, e.message);
    }
  });
}

function ensureRuntimeTables() {
  db.db.exec(`
    CREATE TABLE IF NOT EXISTS feedback (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER,
      whatsapp    TEXT,
      token       TEXT,
      rating      INTEGER,
      likes       TEXT,
      dislikes    TEXT,
      suggestions TEXT,
      bugs        TEXT,
      would_pay   INTEGER DEFAULT 0,
      price_point TEXT,
      created_at  TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS invite_tokens (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      token       TEXT NOT NULL UNIQUE,
      created_by  TEXT DEFAULT 'admin',
      used        INTEGER DEFAULT 0,
      used_by     TEXT,
      used_at     TEXT,
      max_uses    INTEGER DEFAULT 1,
      uses        INTEGER DEFAULT 0,
      active      INTEGER DEFAULT 1,
      created_at  TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS free_tokens (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      token       TEXT NOT NULL UNIQUE,
      created_by  INTEGER,
      whatsapp    TEXT,
      days        INTEGER DEFAULT 30,
      used        INTEGER DEFAULT 0,
      used_by     TEXT,
      used_at     TEXT,
      created_at  TEXT DEFAULT (datetime('now'))
    );
  `);
}

module.exports = { seedCrimeData, seedAdminUsers, ensureRuntimeTables };

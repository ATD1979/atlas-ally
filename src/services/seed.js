// Atlas Ally — Startup tasks (data seeding)
const db = require('../db');
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

// Both admins are hardcoded — no env variable dependency
const ADMINS = [
  {
    whatsapp:       '+16825617016',
    name:           'Adrian Druba',
    email:          'atdruba@gmail.com',
    dob:            '1979-04-10',
    state_origin:   'Texas',
    country_origin: 'United States',
  },
  {
    whatsapp:       '+962797640020',
    name:           'Noor Mohammed',
    email:          'Noor@capella.io',
    dob:            '1990-01-01',
    state_origin:   null,
    country_origin: 'Jordan',
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
            active    = 1,
            email     = COALESCE(NULLIF(@email,''), email),
            name      = COALESCE(NULLIF(@name,''), name),
            trial_end = NULL
        WHERE whatsapp = @whatsapp
      `).run({ whatsapp: admin.whatsapp, email: admin.email, name: admin.name });
      const check = db.getUser(admin.whatsapp);
      console.log(`✅ Admin ready: ${admin.name} (${admin.whatsapp}) — plan=${check?.plan} role=${check?.role} trial_end=${check?.trial_end}`);
    } catch (e) {
      console.warn(`Admin seed warning for ${admin.name}:`, e.message);
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

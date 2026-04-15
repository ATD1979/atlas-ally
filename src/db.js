const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'atlas.db'));
db.pragma('journal_mode = WAL');

// ─── Migrations (safe ALTER TABLE for existing databases) ─────────────────────
function safeAddColumn(table, column, definition) {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`✅ Migration: added ${table}.${column}`);
  } catch(e) {
    if (!e.message.includes('duplicate column')) {
      // Column already exists — that's fine, ignore
    }
  }
}

// Run migrations before schema creation
try {
  // Check if users table exists before running migrations
  const tableExists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='users'`).get();
  if (tableExists) {
    safeAddColumn('users', 'dob', 'TEXT');
    safeAddColumn('users', 'state_origin', 'TEXT');
    safeAddColumn('users', 'country_origin', 'TEXT');
    safeAddColumn('users', 'role', "TEXT DEFAULT 'user'");
    safeAddColumn('users', 'country_slots', 'INTEGER DEFAULT 3');
    safeAddColumn('users', 'country_changes', 'INTEGER DEFAULT 0');
    safeAddColumn('users', 'free_change_used', 'INTEGER DEFAULT 0');
    safeAddColumn('users', 'distributor_id', 'INTEGER');
    safeAddColumn('users', 'trial_code', 'TEXT');
    safeAddColumn('users', 'verified', 'INTEGER DEFAULT 0');
    safeAddColumn('users', 'last_login', 'TEXT');
    safeAddColumn('users', 'admin_password', 'TEXT');
  }
  // Events table migrations
  const eventsExists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='events'`).get();
  if (eventsExists) {
    safeAddColumn('events', 'submitted_user_id', 'INTEGER');
    safeAddColumn('events', 'is_test', 'INTEGER DEFAULT 0');
  }
  // News cache migrations
  const newsExists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='news_cache'`).get();
  if (newsExists) {
    safeAddColumn('news_cache', 'lat', 'REAL');
    safeAddColumn('news_cache', 'lng', 'REAL');
  }
  // Wipe and recreate news_cache with correct schema
  try {
    db.exec(`
      DROP TABLE IF EXISTS news_cache;
      CREATE TABLE news_cache (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        country_code  TEXT NOT NULL,
        lang          TEXT NOT NULL DEFAULT 'en',
        source_name   TEXT,
        title         TEXT,
        description   TEXT,
        url           TEXT,
        lat           REAL,
        lng           REAL,
        published_at  TEXT,
        cached_at     TEXT DEFAULT (datetime('now')),
        UNIQUE(url, lang)
      );
    `);
  } catch(e) { console.warn('news_cache migration:', e.message); }
  } catch(e) { console.warn('Migration warning (non-fatal):', e.message); }

// ─── Schema (CREATE TABLE IF NOT EXISTS — safe to run on existing db) ─────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    whatsapp        TEXT NOT NULL UNIQUE,
    name            TEXT,
    email           TEXT,
    dob             TEXT,
    state_origin    TEXT,
    country_origin  TEXT,
    role            TEXT DEFAULT 'user',
    plan            TEXT DEFAULT 'trial',
    trial_start     TEXT DEFAULT (datetime('now')),
    trial_end       TEXT DEFAULT (datetime('now', '+7 days')),
    stripe_id       TEXT,
    country_slots   INTEGER DEFAULT 3,
    country_changes INTEGER DEFAULT 0,
    free_change_used INTEGER DEFAULT 0,
    distributor_id  INTEGER,
    trial_code      TEXT,
    verified        INTEGER DEFAULT 0,
    created_at      TEXT DEFAULT (datetime('now')),
    last_login      TEXT,
    active          INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS otp_codes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    whatsapp    TEXT NOT NULL,
    code        TEXT NOT NULL,
    purpose     TEXT DEFAULT 'login',
    expires_at  TEXT NOT NULL,
    used        INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS trial_codes (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    code          TEXT NOT NULL UNIQUE,
    created_by    INTEGER NOT NULL,
    max_uses      INTEGER DEFAULT 10,
    uses          INTEGER DEFAULT 0,
    plan_override TEXT DEFAULT 'trial',
    trial_days    INTEGER DEFAULT 7,
    active        INTEGER DEFAULT 1,
    created_at    TEXT DEFAULT (datetime('now')),
    expires_at    TEXT
  );

  CREATE TABLE IF NOT EXISTS user_countries (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL,
    country_code  TEXT NOT NULL,
    alert_siren   INTEGER DEFAULT 1,
    alert_drone   INTEGER DEFAULT 1,
    alert_news    INTEGER DEFAULT 1,
    alert_troop   INTEGER DEFAULT 1,
    alert_clear   INTEGER DEFAULT 1,
    alert_weather INTEGER DEFAULT 1,
    alert_health  INTEGER DEFAULT 1,
    added_at      TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id),
    UNIQUE(user_id, country_code)
  );

  CREATE TABLE IF NOT EXISTS events (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    country_code    TEXT NOT NULL,
    type            TEXT NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT,
    location        TEXT,
    lat             REAL,
    lng             REAL,
    severity        TEXT DEFAULT 'warn',
    source          TEXT,
    source_url      TEXT,
    submitted_by    TEXT,
    submitted_user_id INTEGER,
    status          TEXT DEFAULT 'approved',
    is_test         INTEGER DEFAULT 0,
    notified        INTEGER DEFAULT 0,
    created_at      TEXT DEFAULT (datetime('now')),
    approved_at     TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS crime_stats (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    country_code  TEXT NOT NULL,
    city          TEXT,
    lat           REAL,
    lng           REAL,
    crime_index   REAL,
    safety_index  REAL,
    category      TEXT DEFAULT 'overall',
    period_start  TEXT,
    period_end    TEXT,
    source        TEXT DEFAULT 'Numbeo',
    updated_at    TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS community_crime (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    country_code  TEXT NOT NULL,
    lat           REAL NOT NULL,
    lng           REAL NOT NULL,
    type          TEXT NOT NULL,
    description   TEXT,
    reported_by   INTEGER,
    severity      TEXT DEFAULT 'warn',
    created_at    TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS news_cache (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    country_code  TEXT NOT NULL,
    lang          TEXT NOT NULL DEFAULT 'en',
    source_name   TEXT,
    title         TEXT,
    description   TEXT,
    url           TEXT,
    lat           REAL,
    lng           REAL,
    published_at  TEXT,
    cached_at     TEXT DEFAULT (datetime('now')),
    UNIQUE(url, lang)
  );

  CREATE TABLE IF NOT EXISTS notify_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id    INTEGER,
    user_id     INTEGER,
    channel     TEXT,
    status      TEXT,
    sent_at     TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS emergency_contacts (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id   INTEGER NOT NULL,
    name      TEXT NOT NULL,
    whatsapp  TEXT NOT NULL,
    relation  TEXT,
    active    INTEGER DEFAULT 1,
    added_at  TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS checkin_log (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL,
    lat           REAL,
    lng           REAL,
    country_code  TEXT,
    safety_score  INTEGER,
    message       TEXT,
    type          TEXT DEFAULT 'manual',
    sent_at       TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS zone_alerts (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL,
    zone_name     TEXT,
    country_code  TEXT,
    lat           REAL,
    lng           REAL,
    event_type    TEXT,
    alert_type    TEXT,
    notified      INTEGER DEFAULT 0,
    created_at    TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS offline_cache (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL,
    country_code  TEXT NOT NULL,
    data_json     TEXT,
    cached_at     TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, country_code)
  );

  CREATE TABLE IF NOT EXISTS checklist_progress (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL,
    template      TEXT NOT NULL,
    country_code  TEXT,
    items_json    TEXT DEFAULT '{}',
    updated_at    TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, template, country_code)
  );

  CREATE TABLE IF NOT EXISTS advisory_overrides (
    country_code  TEXT PRIMARY KEY,
    level         INTEGER,
    text          TEXT,
    updated_at    TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS error_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    type        TEXT,
    message     TEXT,
    stack       TEXT,
    user_id     INTEGER,
    endpoint    TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS app_settings (
    key         TEXT PRIMARY KEY,
    value       TEXT,
    updated_at  TEXT DEFAULT (datetime('now'))
  );
`);

// Default settings
const insertSetting = db.prepare(`INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)`);
[
  ['max_free_users', '100'],
  ['distributor_default_quota', '25'],
  ['free_trial_days', '7'],
  ['max_free_countries', '3'],
].forEach(([k, v]) => insertSetting.run(k, v));

// ─── Helpers ──────────────────────────────────────────────────────────────────
const helpers = {
  getSetting: (key) => db.prepare(`SELECT value FROM app_settings WHERE key = ?`).get(key)?.value,
  setSetting: db.prepare(`INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))`),

  // OTP
  createOTP: db.prepare(`INSERT INTO otp_codes (whatsapp, code, purpose, expires_at) VALUES (@whatsapp, @code, @purpose, datetime('now', '+10 minutes'))`),
  getOTP: db.prepare(`SELECT * FROM otp_codes WHERE whatsapp = ? AND used = 0 AND expires_at > datetime('now') ORDER BY created_at DESC LIMIT 1`),
  markOTPUsed: db.prepare(`UPDATE otp_codes SET used = 1 WHERE id = ?`),
  cleanOTPs: db.prepare(`DELETE FROM otp_codes WHERE expires_at < datetime('now', '-1 hour')`),

  // Users — lazy prepare so migrations run first
  createUser: (data) => db.prepare(`INSERT INTO users (whatsapp, name, email, dob, state_origin, country_origin, verified, trial_code, distributor_id) VALUES (@whatsapp, @name, @email, @dob, @state_origin, @country_origin, 1, @trial_code, @distributor_id)`).run(data),
  upsertUser: (data) => db.prepare(`INSERT INTO users (whatsapp, name, email) VALUES (@whatsapp, @name, @email) ON CONFLICT(whatsapp) DO UPDATE SET name=COALESCE(excluded.name, name), email=COALESCE(excluded.email, email), active=1`).run(data),
  getUser: (whatsapp) => db.prepare(`SELECT * FROM users WHERE whatsapp = ?`).get(whatsapp),
  getUserById: (id) => db.prepare(`SELECT * FROM users WHERE id = ?`).get(id),
  getAllUsers: { all: () => db.prepare(`SELECT * FROM users WHERE active = 1 ORDER BY created_at DESC`).all() },
  getUsersByRole: (role) => db.prepare(`SELECT * FROM users WHERE role = ? AND active = 1`).all(role),
  updateUserVerified: (whatsapp) => db.prepare(`UPDATE users SET verified = 1, last_login = datetime('now') WHERE whatsapp = ?`).run(whatsapp),
  updateLastLogin: (id) => db.prepare(`UPDATE users SET last_login = datetime('now') WHERE id = ?`).run(id),
  updatePlan: (data) => db.prepare(`UPDATE users SET plan = @plan, stripe_id = @stripe_id WHERE id = @id`).run(data),
  updateRole: (role, id) => db.prepare(`UPDATE users SET role = ? WHERE id = ?`).run(role, id),
  deactivateUser: (id) => db.prepare(`UPDATE users SET active = 0 WHERE id = ?`).run(id),

  isTrialActive: (user) => {
    if (user.plan === 'premium' || user.plan === 'distributor') return true;
    return new Date() < new Date((user.trial_end || '') + 'Z');
  },
  getTrialDaysLeft: (user) => {
    const diff = (new Date((user.trial_end || '') + 'Z') - new Date()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(diff));
  },
  isAdult: (dob) => {
    if (!dob) return false;
    const birth = new Date(dob);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear() -
      (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
    return age >= 18;
  },

  // Trial codes
  createTrialCode: db.prepare(`INSERT INTO trial_codes (code, created_by, max_uses, trial_days, expires_at) VALUES (@code, @created_by, @max_uses, @trial_days, @expires_at)`),
  getTrialCode: db.prepare(`SELECT * FROM trial_codes WHERE code = ? AND active = 1`),
  useTrialCode: db.prepare(`UPDATE trial_codes SET uses = uses + 1 WHERE code = ?`),
  getTrialCodesByUser: db.prepare(`SELECT * FROM trial_codes WHERE created_by = ? ORDER BY created_at DESC`),
  deactivateTrialCode: db.prepare(`UPDATE trial_codes SET active = 0 WHERE code = ?`),

  // Countries
  addCountry: db.prepare(`INSERT INTO user_countries (user_id, country_code) VALUES (@user_id, @country_code) ON CONFLICT(user_id, country_code) DO NOTHING`),
  removeCountry: db.prepare(`DELETE FROM user_countries WHERE user_id = ? AND country_code = ?`),
  getUserCountries: db.prepare(`SELECT uc.*, u.whatsapp, u.name, u.plan, u.trial_end FROM user_countries uc JOIN users u ON u.id = uc.user_id WHERE uc.user_id = ?`),
  getSubscribersForCountry: db.prepare(`SELECT u.*, uc.alert_siren, uc.alert_drone, uc.alert_news, uc.alert_troop, uc.alert_clear, uc.alert_weather, uc.alert_health FROM user_countries uc JOIN users u ON u.id = uc.user_id WHERE uc.country_code = ? AND u.active = 1`),
  countUserCountries: db.prepare(`SELECT COUNT(*) as count FROM user_countries WHERE user_id = ?`),

  // Events
  addEvent: db.prepare(`INSERT INTO events (country_code, type, title, description, location, lat, lng, severity, source, source_url, submitted_by, submitted_user_id, is_test) VALUES (@country_code, @type, @title, @description, @location, @lat, @lng, @severity, @source, @source_url, @submitted_by, @submitted_user_id, @is_test)`),
  getEventsByCountry: db.prepare(`SELECT * FROM events WHERE country_code = ? AND status = 'approved' AND is_test = 0 ORDER BY created_at DESC LIMIT 100`),
  getEvents72h: db.prepare(`SELECT * FROM events WHERE status = 'approved' AND is_test = 0 AND created_at > datetime('now', '-72 hours') ORDER BY created_at DESC`),
  getRecentEvents: db.prepare(`SELECT * FROM events ORDER BY created_at DESC LIMIT 100`),
  getAllEventsAdmin: db.prepare(`SELECT * FROM events ORDER BY created_at DESC LIMIT 500`),
  markNotified: db.prepare(`UPDATE events SET notified = 1 WHERE id = ?`),
  removeEvent: db.prepare(`UPDATE events SET status = 'removed' WHERE id = ?`),
  markTestEvent: db.prepare(`UPDATE events SET is_test = 1 WHERE id = ?`),

  // Crime stats
  upsertCrimeStat: db.prepare(`INSERT OR REPLACE INTO crime_stats (country_code, city, lat, lng, crime_index, safety_index, category, period_start, period_end, source, updated_at) VALUES (@country_code, @city, @lat, @lng, @crime_index, @safety_index, @category, @period_start, @period_end, @source, datetime('now'))`),
  getCrimeStatsByCountry: db.prepare(`SELECT * FROM crime_stats WHERE country_code = ? ORDER BY crime_index DESC`),
  getCommunityCrime: db.prepare(`SELECT * FROM community_crime WHERE country_code = ? AND created_at > datetime('now', '-6 months') ORDER BY created_at DESC`),
  addCommunityCrime: db.prepare(`INSERT INTO community_crime (country_code, lat, lng, type, description, reported_by, severity) VALUES (@country_code, @lat, @lng, @type, @description, @reported_by, @severity)`),

  // News
  cacheNews: db.prepare(`INSERT OR IGNORE INTO news_cache (country_code, lang, source_name, title, description, url, lat, lng, published_at) VALUES (@country_code, @lang, @source_name, @title, @description, @url, @lat, @lng, @published_at)`),
  getNewsByCountry: (code, lang) => db.prepare(`SELECT * FROM news_cache WHERE country_code = ? AND lang = ? ORDER BY published_at DESC LIMIT 20`).all(code, lang || 'en'),
  getNewsForCrime:  (code) => db.prepare(`SELECT title, published_at FROM news_cache WHERE country_code = ? AND cached_at > datetime('now', '-7 days') ORDER BY published_at DESC LIMIT 100`).all(code),
  clearOldNews: db.prepare(`DELETE FROM news_cache WHERE cached_at < datetime('now', '-48 hours')`),

  // Emergency contacts
  getEmergencyContacts: db.prepare(`SELECT * FROM emergency_contacts WHERE user_id = ? AND active = 1`),
  addEmergencyContact: db.prepare(`INSERT INTO emergency_contacts (user_id, name, whatsapp, relation) VALUES (@user_id, @name, @whatsapp, @relation)`),
  removeEmergencyContact: db.prepare(`UPDATE emergency_contacts SET active = 0 WHERE id = ? AND user_id = ?`),

  // Checkins & zones
  logCheckin: db.prepare(`INSERT INTO checkin_log (user_id, lat, lng, country_code, safety_score, message, type) VALUES (@user_id, @lat, @lng, @country_code, @safety_score, @message, @type)`),
  logZoneAlert: db.prepare(`INSERT INTO zone_alerts (user_id, zone_name, country_code, lat, lng, event_type, alert_type) VALUES (@user_id, @zone_name, @country_code, @lat, @lng, @event_type, @alert_type)`),
  logNotify: db.prepare(`INSERT INTO notify_log (event_id, user_id, channel, status) VALUES (@event_id, @user_id, @channel, @status)`),

  // Offline & checklists
  saveOfflineCache: db.prepare(`INSERT OR REPLACE INTO offline_cache (user_id, country_code, data_json, cached_at) VALUES (@user_id, @country_code, @data_json, datetime('now'))`),
  getOfflineCache: db.prepare(`SELECT * FROM offline_cache WHERE user_id = ? AND country_code = ?`),

  // Advisory
  getAdvisoryOverride: db.prepare(`SELECT * FROM advisory_overrides WHERE country_code = ?`),
  setAdvisoryOverride: db.prepare(`INSERT OR REPLACE INTO advisory_overrides (country_code, level, text, updated_at) VALUES (@country_code, @level, @text, datetime('now'))`),

  // Error logging
  logError: db.prepare(`INSERT INTO error_log (type, message, stack, user_id, endpoint) VALUES (@type, @message, @stack, @user_id, @endpoint)`),
  getRecentErrors: db.prepare(`SELECT * FROM error_log ORDER BY created_at DESC LIMIT 100`),

  // Stats
  getStats: () => ({
    users:        db.prepare(`SELECT COUNT(*) as c FROM users WHERE active=1`).get().c,
    verified:     db.prepare(`SELECT COUNT(*) as c FROM users WHERE verified=1 AND active=1`).get().c,
    premium:      db.prepare(`SELECT COUNT(*) as c FROM users WHERE plan='premium'`).get().c,
    trial:        db.prepare(`SELECT COUNT(*) as c FROM users WHERE plan='trial' AND trial_end > datetime('now')`).get().c,
    distributors: db.prepare(`SELECT COUNT(*) as c FROM users WHERE role='distributor'`).get().c,
    events:       db.prepare(`SELECT COUNT(*) as c FROM events WHERE status='approved'`).get().c,
    events_72h:   db.prepare(`SELECT COUNT(*) as c FROM events WHERE status='approved' AND created_at > datetime('now', '-72 hours')`).get().c,
    countries:    db.prepare(`SELECT COUNT(DISTINCT country_code) as c FROM user_countries`).get().c,
    errors_24h:   db.prepare(`SELECT COUNT(*) as c FROM error_log WHERE created_at > datetime('now', '-24 hours')`).get().c,
  }),
};

module.exports = { db, ...helpers };

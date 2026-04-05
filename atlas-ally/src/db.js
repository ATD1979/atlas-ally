const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'atlas.db'));
db.pragma('journal_mode = WAL');

// ─── Schema ───────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    whatsapp      TEXT NOT NULL UNIQUE,
    name          TEXT,
    email         TEXT,
    plan          TEXT DEFAULT 'trial',   -- trial | free | premium
    trial_start   TEXT DEFAULT (datetime('now')),
    trial_end     TEXT DEFAULT (datetime('now', '+7 days')),
    stripe_id     TEXT,
    created_at    TEXT DEFAULT (datetime('now')),
    active        INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS user_countries (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    country_code TEXT NOT NULL,
    alert_siren   INTEGER DEFAULT 1,
    alert_drone   INTEGER DEFAULT 1,
    alert_news    INTEGER DEFAULT 1,
    alert_troop   INTEGER DEFAULT 1,
    alert_clear   INTEGER DEFAULT 1,
    alert_weather INTEGER DEFAULT 1,
    alert_health  INTEGER DEFAULT 1,
    added_at    TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id),
    UNIQUE(user_id, country_code)
  );

  CREATE TABLE IF NOT EXISTS events (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    country_code TEXT NOT NULL,
    type         TEXT NOT NULL,
    title        TEXT NOT NULL,
    description  TEXT,
    location     TEXT,
    lat          REAL,
    lng          REAL,
    severity     TEXT DEFAULT 'warn',
    source       TEXT,
    source_url   TEXT,
    submitted_by TEXT,
    status       TEXT DEFAULT 'approved',
    notified     INTEGER DEFAULT 0,
    created_at   TEXT DEFAULT (datetime('now')),
    approved_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS news_cache (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    country_code TEXT NOT NULL,
    source_name  TEXT,
    title        TEXT,
    description  TEXT,
    url          TEXT,
    published_at TEXT,
    cached_at    TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notify_log (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id     INTEGER,
    user_id      INTEGER,
    channel      TEXT,
    status       TEXT,
    sent_at      TEXT DEFAULT (datetime('now'))
  );


  CREATE TABLE IF NOT EXISTS emergency_contacts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    name        TEXT NOT NULL,
    whatsapp    TEXT NOT NULL,
    relation    TEXT,
    active      INTEGER DEFAULT 1,
    added_at    TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS checkin_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    lat         REAL,
    lng         REAL,
    country_code TEXT,
    safety_score INTEGER,
    message     TEXT,
    type        TEXT DEFAULT 'manual',
    sent_at     TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS zone_alerts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    zone_name   TEXT,
    country_code TEXT,
    lat         REAL,
    lng         REAL,
    event_type  TEXT,
    alert_type  TEXT,
    notified    INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS offline_cache (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL,
    country_code TEXT NOT NULL,
    data_json    TEXT,
    cached_at    TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, country_code)
  );

  CREATE TABLE IF NOT EXISTS checklist_progress (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL,
    template     TEXT NOT NULL,
    country_code TEXT,
    items_json   TEXT DEFAULT '{}',
    updated_at   TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, template, country_code)
  );
  CREATE TABLE IF NOT EXISTS advisory_overrides (
    country_code TEXT PRIMARY KEY,
    level        INTEGER,
    text         TEXT,
    updated_at   TEXT DEFAULT (datetime('now'))
  );
`);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const helpers = {

  // Users
  upsertUser: db.prepare(`
    INSERT INTO users (whatsapp, name, email)
    VALUES (@whatsapp, @name, @email)
    ON CONFLICT(whatsapp) DO UPDATE SET
      name=COALESCE(excluded.name, name),
      email=COALESCE(excluded.email, email),
      active=1
  `),

  getUser: db.prepare(`SELECT * FROM users WHERE whatsapp = ?`),
  getUserById: db.prepare(`SELECT * FROM users WHERE id = ?`),
  getAllUsers: db.prepare(`SELECT * FROM users WHERE active = 1`),

  isTrialActive: (user) => {
    if (user.plan === 'premium') return true;
    const end = new Date(user.trial_end + 'Z');
    return new Date() < end;
  },

  getTrialDaysLeft: (user) => {
    const end = new Date(user.trial_end + 'Z');
    const diff = (end - new Date()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(diff));
  },

  updatePlan: db.prepare(`UPDATE users SET plan = @plan, stripe_id = @stripe_id WHERE id = @id`),

  // Country subscriptions
  addCountry: db.prepare(`
    INSERT INTO user_countries (user_id, country_code)
    VALUES (@user_id, @country_code)
    ON CONFLICT(user_id, country_code) DO NOTHING
  `),

  removeCountry: db.prepare(`DELETE FROM user_countries WHERE user_id = ? AND country_code = ?`),

  getUserCountries: db.prepare(`
    SELECT uc.*, u.whatsapp, u.name, u.plan, u.trial_end
    FROM user_countries uc
    JOIN users u ON u.id = uc.user_id
    WHERE uc.user_id = ?
  `),

  getSubscribersForCountry: db.prepare(`
    SELECT u.*, uc.alert_siren, uc.alert_drone, uc.alert_news,
           uc.alert_troop, uc.alert_clear, uc.alert_weather, uc.alert_health
    FROM user_countries uc
    JOIN users u ON u.id = uc.user_id
    WHERE uc.country_code = ? AND u.active = 1
  `),

  countUserCountries: db.prepare(`SELECT COUNT(*) as count FROM user_countries WHERE user_id = ?`),

  // Events
  addEvent: db.prepare(`
    INSERT INTO events (country_code, type, title, description, location, lat, lng, severity, source, source_url, submitted_by)
    VALUES (@country_code, @type, @title, @description, @location, @lat, @lng, @severity, @source, @source_url, @submitted_by)
  `),

  getEventsByCountry: db.prepare(`
    SELECT * FROM events WHERE country_code = ? AND status = 'approved'
    ORDER BY created_at DESC LIMIT 50
  `),

  getRecentEvents: db.prepare(`
    SELECT * FROM events WHERE status = 'approved'
    ORDER BY created_at DESC LIMIT 100
  `),

  markNotified: db.prepare(`UPDATE events SET notified = 1 WHERE id = ?`),

  // News cache
  cacheNews: db.prepare(`
    INSERT OR IGNORE INTO news_cache (country_code, source_name, title, description, url, published_at)
    VALUES (@country_code, @source_name, @title, @description, @url, @published_at)
  `),

  getNewsByCountry: db.prepare(`
    SELECT * FROM news_cache WHERE country_code = ?
    ORDER BY published_at DESC LIMIT 20
  `),

  clearOldNews: db.prepare(`DELETE FROM news_cache WHERE cached_at < datetime('now', '-24 hours')`),

  // Notify log
  logNotify: db.prepare(`
    INSERT INTO notify_log (event_id, user_id, channel, status)
    VALUES (@event_id, @user_id, @channel, @status)
  `),

  // Advisory overrides (admin can set these)
  getAdvisoryOverride: db.prepare(`SELECT * FROM advisory_overrides WHERE country_code = ?`),
  setAdvisoryOverride: db.prepare(`
    INSERT OR REPLACE INTO advisory_overrides (country_code, level, text, updated_at)
    VALUES (@country_code, @level, @text, datetime('now'))
  `),

  // Emergency contacts
  getEmergencyContacts: db.prepare(`SELECT * FROM emergency_contacts WHERE user_id = ? AND active = 1`),
  addEmergencyContact: db.prepare(`
    INSERT INTO emergency_contacts (user_id, name, whatsapp, relation)
    VALUES (@user_id, @name, @whatsapp, @relation)
  `),
  removeEmergencyContact: db.prepare(`UPDATE emergency_contacts SET active = 0 WHERE id = ? AND user_id = ?`),

  // Check-ins
  logCheckin: db.prepare(`
    INSERT INTO checkin_log (user_id, lat, lng, country_code, safety_score, message, type)
    VALUES (@user_id, @lat, @lng, @country_code, @safety_score, @message, @type)
  `),
  getRecentCheckins: db.prepare(`SELECT * FROM checkin_log WHERE user_id = ? ORDER BY sent_at DESC LIMIT 20`),

  // Zone alerts
  logZoneAlert: db.prepare(`
    INSERT INTO zone_alerts (user_id, zone_name, country_code, lat, lng, event_type, alert_type)
    VALUES (@user_id, @zone_name, @country_code, @lat, @lng, @event_type, @alert_type)
  `),

  // Offline cache
  saveOfflineCache: db.prepare(`
    INSERT OR REPLACE INTO offline_cache (user_id, country_code, data_json, cached_at)
    VALUES (@user_id, @country_code, @data_json, datetime('now'))
  `),
  getOfflineCache: db.prepare(`SELECT * FROM offline_cache WHERE user_id = ? AND country_code = ?`),

  // Checklist progress
  saveChecklistProgress: db.prepare(`
    INSERT OR REPLACE INTO checklist_progress (user_id, template, country_code, items_json, updated_at)
    VALUES (@user_id, @template, @country_code, @items_json, datetime('now'))
  `),
  getChecklistProgress: db.prepare(`SELECT * FROM checklist_progress WHERE user_id = ? AND template = ?`),

  // Stats
  getStats: () => ({
    users: db.prepare(`SELECT COUNT(*) as c FROM users WHERE active=1`).get().c,
    premium: db.prepare(`SELECT COUNT(*) as c FROM users WHERE plan='premium'`).get().c,
    trial: db.prepare(`SELECT COUNT(*) as c FROM users WHERE plan='trial' AND trial_end > datetime('now')`).get().c,
    events: db.prepare(`SELECT COUNT(*) as c FROM events`).get().c,
    countries: db.prepare(`SELECT COUNT(DISTINCT country_code) as c FROM user_countries`).get().c,
    checkins: db.prepare(`SELECT COUNT(*) as c FROM checkin_log`).get().c,
  }),
};

module.exports = { db, ...helpers };

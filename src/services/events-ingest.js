// Atlas Ally — Security Event Ingestion
// Sources: US Embassy RSS · UK FCDO · ReliefWeb (UN) · GDELT (English only)
// All events are English-only. Arabic/non-Latin titles are rejected at every stage.

'use strict';

const fetch  = require('node-fetch');
const xml2js = require('xml2js');
const db     = require('../db');
const { extractLocation } = require('../geocoder');

const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: false });

// ── Language guard ────────────────────────────────────────────────────────────
// Rejects any title that is predominantly non-Latin script.
// Threshold: if more than 20% of characters are non-ASCII, drop it.
function isEnglish(text) {
  if (!text || text.trim().length < 5) return false;
  const nonLatin = (text.match(/[^\x00-\x7F]/g) || []).length;
  return (nonLatin / text.length) < 0.20;
}

// ── Security keyword classifier ───────────────────────────────────────────────
const SECURITY_KEYWORDS = [
  'attack','explosion','missile','rocket','drone','airstrike','bomb','blast',
  'shooting','gunfire','siren','air raid','military','armed','artillery',
  'evacuation','emergency','conflict','killed','injured','casualties',
  'protest','riot','demonstration','arrest','police','security alert',
  'earthquake','flood','fire','crash','accident','warning','incident',
  'border','troops','soldiers','terror','hostage','threat',
];

const TYPE_MAP = [
  { words: ['siren','air raid','alert'],           type: 'siren'      },
  { words: ['missile','rocket','strike','launch'], type: 'missile'    },
  { words: ['drone','uav','unmanned'],             type: 'drone'      },
  { words: ['explosion','blast','bomb','bombing'], type: 'explosion'  },
  { words: ['shooting','gunfire','armed','gun'],   type: 'shooting'   },
  { words: ['evacuation','evacuate','flee'],       type: 'evacuation' },
  { words: ['earthquake','quake','tremor'],        type: 'earthquake' },
  { words: ['flood','flash flood','inundation'],   type: 'flood'      },
  { words: ['protest','demonstration','riot'],     type: 'protest'    },
  { words: ['fire','wildfire','blaze'],            type: 'fire'       },
];

const SEVERITY_MAP = [
  { words: ['missile','rocket','airstrike','blast','explosion','bomb','bombing'], severity: 'critical' },
  { words: ['siren','air raid','drone','uav','shooting','gunfire','attack'],      severity: 'high'     },
  { words: ['evacuation','emergency','armed','conflict','troops'],                severity: 'high'     },
];

function classify(text) {
  const lower = text.toLowerCase();
  const type     = TYPE_MAP.find(t => t.words.some(w => lower.includes(w)))?.type || 'incident';
  const severity = SEVERITY_MAP.find(s => s.words.some(w => lower.includes(w)))?.severity || 'warn';
  return { type, severity };
}

function isSecurityRelevant(text) {
  const lower = text.toLowerCase();
  return SECURITY_KEYWORDS.some(k => lower.includes(k));
}

// ── Dedup ─────────────────────────────────────────────────────────────────────
const seenUrls = new Set();

function isDuplicate(sourceUrl, title) {
  if (seenUrls.has(sourceUrl)) return true;
  const existing = db.db.prepare(`
    SELECT id FROM events
    WHERE (source_url = ? OR title = ?)
      AND created_at > datetime('now', '-48 hours')
    LIMIT 1
  `).get(sourceUrl, title);
  return !!existing;
}

function insertEvent(ev) {
  // Reject non-English titles before anything hits the DB
  if (!isEnglish(ev.title)) return false;
  if (isDuplicate(ev.source_url, ev.title)) return false;
  seenUrls.add(ev.source_url);
  try {
    db.addEvent.run({
      country_code:      ev.country_code,
      type:              ev.type,
      title:             ev.title.slice(0, 200),
      description:       (ev.description || '').slice(0, 1000),
      location:          ev.location || null,
      lat:               ev.lat || null,
      lng:               ev.lng || null,
      severity:          ev.severity,
      source:            ev.source,
      source_url:        ev.source_url,
      submitted_by:      'auto-ingest',
      submitted_user_id: null,
      is_test:           0,
    });
    return true;
  } catch { return false; }
}

// ── RSS helper ────────────────────────────────────────────────────────────────
async function fetchRSS(url) {
  try {
    const res = await fetch(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'AtlasAlly/1.0', 'Accept': 'application/rss+xml,*/*' },
    });
    if (!res.ok) return [];
    const xml  = await res.text();
    const data = await parser.parseStringPromise(xml);
    const raw  = data?.rss?.channel?.item || data?.feed?.entry || [];
    return Array.isArray(raw) ? raw : [raw];
  } catch { return []; }
}

function parseItem(raw) {
  const title = String(raw.title?._ || raw.title || '').replace(/<[^>]*>/g, '').trim();
  const desc  = String(raw.description?._ || raw.description || raw.summary?._ || raw.summary || '')
                  .replace(/<[^>]*>/g, '').trim().slice(0, 600);
  const url   = raw.link?.$ ? raw.link.$.href
                : (typeof raw.link === 'string' ? raw.link : raw.guid?._ || raw.guid || '');
  return { title, desc, url: String(url).trim() };
}

// ── Source 1: US Embassy security alerts ─────────────────────────────────────
// These are the highest-signal source — real shelter-in-place and missile alerts.
// All content is English by definition.

const EMBASSY_FEEDS = [
  { name: 'US Embassy Jordan',       url: 'https://jo.usembassy.gov/category/alert/feed/',   code: 'JO' },
  { name: 'US Embassy Ukraine',      url: 'https://ua.usembassy.gov/category/alert/feed/',   code: 'UA' },
  { name: 'US Embassy Lebanon',      url: 'https://lb.usembassy.gov/category/alert/feed/',   code: 'LB' },
  { name: 'US Embassy Iraq',         url: 'https://iq.usembassy.gov/category/alert/feed/',   code: 'IQ' },
  { name: 'US Embassy Israel',       url: 'https://il.usembassy.gov/category/alert/feed/',   code: 'IL' },
  { name: 'US Embassy Pakistan',     url: 'https://pk.usembassy.gov/category/alert/feed/',   code: 'PK' },
  { name: 'US Embassy Egypt',        url: 'https://eg.usembassy.gov/category/alert/feed/',   code: 'EG' },
  { name: 'US Embassy Nigeria',      url: 'https://ng.usembassy.gov/category/alert/feed/',   code: 'NG' },
  { name: 'US Embassy Mexico',       url: 'https://mx.usembassy.gov/category/alert/feed/',   code: 'MX' },
  { name: 'US Embassy Colombia',     url: 'https://co.usembassy.gov/category/alert/feed/',   code: 'CO' },
  { name: 'US Embassy Philippines',  url: 'https://ph.usembassy.gov/category/alert/feed/',   code: 'PH' },
  { name: 'US Embassy Kenya',        url: 'https://ke.usembassy.gov/category/alert/feed/',   code: 'KE' },
  { name: 'US Embassy Turkey',       url: 'https://tr.usembassy.gov/category/alert/feed/',   code: 'TR' },
  { name: 'US Embassy India',        url: 'https://in.usembassy.gov/category/alert/feed/',   code: 'IN' },
  { name: 'US Embassy Brazil',       url: 'https://br.usembassy.gov/category/alert/feed/',   code: 'BR' },
  { name: 'US Embassy Morocco',      url: 'https://ma.usembassy.gov/category/alert/feed/',   code: 'MA' },
  { name: 'US Embassy Thailand',     url: 'https://th.usembassy.gov/category/alert/feed/',   code: 'TH' },
  { name: 'US Embassy South Africa', url: 'https://za.usembassy.gov/category/alert/feed/',   code: 'ZA' },
  { name: 'US Embassy France',       url: 'https://fr.usembassy.gov/category/alert/feed/',   code: 'FR' },
  { name: 'US Embassy Japan',        url: 'https://jp.usembassy.gov/category/alert/feed/',   code: 'JP' },
  { name: 'US Embassy Syria',        url: 'https://sy.usembassy.gov/category/alert/feed/',   code: 'SY' },
  { name: 'US Embassy Yemen',        url: 'https://ye.usembassy.gov/category/alert/feed/',   code: 'YE' },
];

async function ingestEmbassyAlerts() {
  let count = 0;
  for (const feed of EMBASSY_FEEDS) {
    const items = await fetchRSS(feed.url);
    for (const raw of items.slice(0, 10)) {
      const { title, desc, url } = parseItem(raw);
      if (!title || title.length < 10) continue;
      if (!isEnglish(title)) continue; // hard gate — embassy feeds should always be English but just in case
      const { type, severity } = classify(`${title} ${desc}`);
      const geo = extractLocation(`${title} ${desc}`, feed.code);
      const ok  = insertEvent({
        country_code: feed.code,
        type:         type === 'incident' ? 'siren' : type,
        severity:     severity === 'warn' ? 'high' : severity,
        title:        title.replace(/^Security Alert[–—:\-]*\s*/i, '').trim() || title,
        description:  desc,
        location:     geo?.location || null,
        lat:          geo?.lat || null,
        lng:          geo?.lng || null,
        source:       feed.name,
        source_url:   url || feed.url,
      });
      if (ok) count++;
    }
    await new Promise(r => setTimeout(r, 300));
  }
  return count;
}

// ── Source 2: UK FCDO travel alerts ──────────────────────────────────────────
// Independent from US — often more granular on threat areas. English only.

const FCDO_COUNTRIES = [
  { code: 'JO', slug: 'jordan' },       { code: 'UA', slug: 'ukraine' },
  { code: 'LB', slug: 'lebanon' },      { code: 'IQ', slug: 'iraq' },
  { code: 'IL', slug: 'israel' },       { code: 'PK', slug: 'pakistan' },
  { code: 'EG', slug: 'egypt' },        { code: 'NG', slug: 'nigeria' },
  { code: 'MX', slug: 'mexico' },       { code: 'CO', slug: 'colombia' },
  { code: 'PH', slug: 'philippines' },  { code: 'KE', slug: 'kenya' },
  { code: 'TR', slug: 'turkey' },       { code: 'IN', slug: 'india' },
  { code: 'BR', slug: 'brazil' },       { code: 'MA', slug: 'morocco' },
  { code: 'TH', slug: 'thailand' },     { code: 'ZA', slug: 'south-africa' },
  { code: 'FR', slug: 'france' },       { code: 'JP', slug: 'japan' },
  { code: 'SY', slug: 'syria' },        { code: 'YE', slug: 'yemen' },
];

async function ingestFCDO() {
  let count = 0;
  for (const entry of FCDO_COUNTRIES) {
    const url   = `https://www.gov.uk/foreign-travel-advice/${entry.slug}.atom`;
    const items = await fetchRSS(url);
    for (const raw of items.slice(0, 5)) {
      const { title, desc, url: link } = parseItem(raw);
      if (!title || title.length < 10) continue;
      if (!isEnglish(title)) continue;
      if (!isSecurityRelevant(`${title} ${desc}`)) continue;
      const { type, severity } = classify(`${title} ${desc}`);
      const geo = extractLocation(`${title} ${desc}`, entry.code);
      const ok  = insertEvent({
        country_code: entry.code,
        type, severity, title, description: desc,
        location:    geo?.location || null,
        lat:         geo?.lat || null,
        lng:         geo?.lng || null,
        source:      'UK FCDO',
        source_url:  link || url,
      });
      if (ok) count++;
    }
    await new Promise(r => setTimeout(r, 300));
  }
  return count;
}

// ── Source 3: ReliefWeb (UN OCHA) ────────────────────────────────────────────
// Free, no key. English. Covers humanitarian crises and security situations.

const RELIEFWEB_COUNTRIES = {
  JO:'jordan',   UA:'ukraine',  LB:'lebanon',       SY:'syria',
  IQ:'iraq',     YE:'yemen',    SO:'somalia',        SD:'sudan',
  LY:'libya',    AF:'afghanistan', PK:'pakistan',    MM:'myanmar',
  ET:'ethiopia', NG:'nigeria',  CD:'democratic-republic-of-the-congo',
  KE:'kenya',    PH:'philippines', IN:'india',        MX:'mexico',
  CO:'colombia', BR:'brazil',   TR:'turkey',          EG:'egypt',
};

async function ingestReliefWeb(code) {
  const slug = RELIEFWEB_COUNTRIES[code];
  if (!slug) return 0;
  const url = `https://api.reliefweb.int/v1/reports?appname=atlasally`
    + `&filter[operator]=AND`
    + `&filter[conditions][0][field]=country.name&filter[conditions][0][value]=${slug}`
    + `&filter[conditions][1][field]=theme.name&filter[conditions][1][value]=Security`
    + `&fields[include][]=title&fields[include][]=body-html&fields[include][]=url&fields[include][]=date`
    + `&limit=10`;
  try {
    const res   = await fetch(url, { timeout: 10000, headers: { 'User-Agent': 'AtlasAlly/1.0' } });
    if (!res.ok) return 0;
    const data  = await res.json();
    const items = data.data || [];
    let count   = 0;
    for (const item of items) {
      const f     = item.fields || {};
      const title = String(f.title || '').trim();
      const body  = String(f['body-html'] || '').replace(/<[^>]*>/g, '').trim().slice(0, 600);
      const link  = f.url || `https://reliefweb.int/node/${item.id}`;
      if (!title || title.length < 10) continue;
      if (!isEnglish(title)) continue;
      const { type, severity } = classify(`${title} ${body}`);
      const geo = extractLocation(`${title} ${body}`, code);
      const ok  = insertEvent({
        country_code: code, type, severity, title, description: body,
        location:    geo?.location || null,
        lat:         geo?.lat || null,
        lng:         geo?.lng || null,
        source:      'ReliefWeb / UN OCHA',
        source_url:  link,
      });
      if (ok) count++;
    }
    return count;
  } catch(e) {
    console.warn(`  ReliefWeb failed for ${code}: ${e.message}`);
    return 0;
  }
}

// ── Source 4: GDELT (English articles only) ───────────────────────────────────
// Free, no key. Updated every 15 min.
// sourcelang=english ensures only English-language source articles are returned.

const GDELT_CODES = {
  JO:'JOR', UA:'UKR', LB:'LBN', EG:'EGY', IL:'ISR', IQ:'IRQ', SY:'SYR',
  PK:'PAK', AF:'AFG', YE:'YEM', MX:'MEX', CO:'COL', NG:'NGA', SO:'SOM',
  SD:'SDN', LY:'LBY', ET:'ETH', MM:'MMR', PH:'PHL', FR:'FRA', JP:'JPN',
  ZA:'ZAF', IN:'IND', BR:'BRA', KE:'KEN', TR:'TUR', MA:'MAR', TH:'THA',
};

// Countries where we use a broad safety query vs a narrow violence query
const STABLE = new Set(['FRA','JPN','ZAF','IND','BRA','KEN','TUR','MAR','THA']);

async function ingestGDELT(code) {
  const fips = GDELT_CODES[code];
  if (!fips) return 0;

  const keywords = STABLE.has(fips)
    ? '"attack" OR "explosion" OR "shooting" OR "protest" OR "terrorism" OR "flood" OR "earthquake"'
    : '"missile" OR "drone" OR "siren" OR "explosion" OR "airstrike" OR "attack" OR "bombing"';

  const url = `https://api.gdeltproject.org/api/v2/doc/doc`
    + `?query=${fips}+(${encodeURIComponent(keywords)})`
    + `&mode=artlist&maxrecords=10&format=json&timespan=1440&sourcelang=english`;

  try {
    const res  = await fetch(url, { timeout: 12000, headers: { 'User-Agent': 'AtlasAlly/1.0' } });
    if (!res.ok) return 0;
    const text = await res.text();
    // GDELT sometimes returns HTML error pages instead of JSON
    if (!text.startsWith('{') && !text.startsWith('[')) return 0;
    const data = JSON.parse(text);
    const articles = data.articles || [];
    let count = 0;

    for (const art of articles) {
      const title = String(art.title || '').trim();
      if (!title || title.length < 10) continue;
      if (!isEnglish(title)) continue; // second gate — belt and suspenders
      if (!isSecurityRelevant(title)) continue;
      const { type, severity } = classify(title);
      const geo = extractLocation(title, code);
      const ok  = insertEvent({
        country_code: code, type, severity,
        title,
        description: art.seendate ? `Reported: ${art.seendate}` : '',
        location:    geo?.location || null,
        lat:         geo?.lat || null,
        lng:         geo?.lng || null,
        source:      art.domain || 'GDELT',
        source_url:  art.url || 'https://api.gdeltproject.org',
      });
      if (ok) count++;
    }
    return count;
  } catch(e) {
    console.warn(`  GDELT failed for ${code}: ${e.message}`);
    return 0;
  }
}

// ── Source 5: ACLED (requires API approval) ───────────────────────────────────
const ACLED_COUNTRIES = {
  JO:'Jordan', UA:'Ukraine', LB:'Lebanon', EG:'Egypt', IL:'Israel',
  IQ:'Iraq',   SY:'Syria',   PK:'Pakistan', AF:'Afghanistan', YE:'Yemen',
  MX:'Mexico', CO:'Colombia', NG:'Nigeria', SO:'Somalia', SD:'Sudan',
  LY:'Libya',  ET:'Ethiopia', MM:'Myanmar', PH:'Philippines',
};

const ACLED_TYPE_MAP = {
  'Battles':                    'explosion',
  'Explosions/Remote violence': 'explosion',
  'Violence against civilians': 'shooting',
  'Protests':                   'protest',
  'Riots':                      'protest',
  'Strategic developments':     'incident',
};

function acledSeverity(eventType, fatalities) {
  if (fatalities > 0)                                return 'critical';
  if (eventType === 'Battles')                       return 'critical';
  if (eventType === 'Explosions/Remote violence')    return 'high';
  if (eventType === 'Violence against civilians')    return 'high';
  return 'warn';
}

async function ingestACLED() {
  const email    = process.env.ACLED_EMAIL;
  const password = process.env.ACLED_PASSWORD;
  if (!email || !password) return 0;

  // Get OAuth token
  let token;
  try {
    const params = new URLSearchParams({
      username: email, password, grant_type: 'password', client_id: 'acled',
    });
    const tr = await fetch('https://acleddata.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'AtlasAlly/1.0' },
      body: params.toString(),
      timeout: 10000,
    });
    if (!tr.ok) { console.warn(`  ACLED token failed: ${tr.status}`); return 0; }
    const td = await tr.json();
    token = td.access_token;
    if (!token) return 0;
  } catch(e) {
    console.warn(`  ACLED token error: ${e.message}`);
    return 0;
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const countriesList = Object.values(ACLED_COUNTRIES).join('|');
  const url = `https://acleddata.com/api/acled/read`
    + `?country=${encodeURIComponent(countriesList)}`
    + `&event_date=${since.replace(/-/g,'')}&event_date_where=>`
    + `&fields=event_id_cnty,event_date,event_type,country,admin1,location,latitude,longitude,fatalities,notes`
    + `&limit=200&format=json`;

  try {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'AtlasAlly/1.0' },
      timeout: 15000,
    });
    if (!res.ok) { console.warn(`  ACLED data failed: ${res.status}`); return 0; }
    const data   = await res.json();
    const events = data.data || [];
    let total    = 0;

    for (const ev of events) {
      const code = Object.entries(ACLED_COUNTRIES).find(([, name]) => name === ev.country)?.[0];
      if (!code) continue;
      const notes    = String(ev.notes || '').trim();
      const title    = notes
        ? notes.slice(0, 120)
        : `${ev.event_type} in ${ev.location || ev.admin1 || ev.country}`;
      if (!isEnglish(title)) continue;
      const type     = ACLED_TYPE_MAP[ev.event_type] || 'incident';
      const severity = acledSeverity(ev.event_type, parseInt(ev.fatalities) || 0);
      const location = [ev.location, ev.admin1].filter(Boolean).join(', ');
      const ok = insertEvent({
        country_code: code, type, severity, title,
        description:  `${ev.event_type} · Fatalities: ${ev.fatalities || 0}`,
        location:     location || null,
        lat:          parseFloat(ev.latitude)  || null,
        lng:          parseFloat(ev.longitude) || null,
        source:       'ACLED',
        source_url:   `https://acleddata.com/?country=${encodeURIComponent(ev.country)}&date=${ev.event_date}`,
      });
      if (ok) total++;
    }
    console.log(`  📊 ACLED: +${total} events`);
    return total;
  } catch(e) {
    console.warn(`  ACLED data error: ${e.message}`);
    return 0;
  }
}

// ── Main runner ───────────────────────────────────────────────────────────────

async function ingestSecurityEvents() {
  console.log('⚡ Ingesting security events...');

  // Purge all previously auto-ingested non-English events
  try {
    const purged = db.db.prepare(`
      DELETE FROM events
      WHERE submitted_by = 'auto-ingest'
        AND (
          title GLOB '*[^ -~]*'
          OR length(title) - length(replace(title, char(1600), '')) > 0
        )
    `).run();
    if (purged.changes > 0) console.log(`  🧹 Purged ${purged.changes} non-English events`);
  } catch(e) {
    // Fallback: purge events where title contains common Arabic characters
    try {
      db.db.prepare(`DELETE FROM events WHERE submitted_by='auto-ingest' AND title LIKE '%ا%'`).run();
      db.db.prepare(`DELETE FROM events WHERE submitted_by='auto-ingest' AND title LIKE '%ي%'`).run();
      db.db.prepare(`DELETE FROM events WHERE submitted_by='auto-ingest' AND title LIKE '%ة%'`).run();
      db.db.prepare(`DELETE FROM events WHERE submitted_by='auto-ingest' AND title LIKE '%و%'`).run();
      db.db.prepare(`DELETE FROM events WHERE submitted_by='auto-ingest' AND title LIKE '%ن%'`).run();
    } catch {}
  }

  let total = 0;

  // Priority order: Embassy (highest signal) → FCDO → ACLED → ReliefWeb → GDELT
  const embassyCount = await ingestEmbassyAlerts();
  if (embassyCount) console.log(`  🏛  Embassy: +${embassyCount} events`);
  total += embassyCount;

  const fcdoCount = await ingestFCDO();
  if (fcdoCount) console.log(`  🇬🇧 FCDO: +${fcdoCount} events`);
  total += fcdoCount;

  const acledCount = await ingestACLED();
  total += acledCount;

  for (const code of Object.keys(RELIEFWEB_COUNTRIES)) {
    const n = await ingestReliefWeb(code);
    total += n;
    if (n) console.log(`  🌐 ReliefWeb ${code}: +${n} events`);
    await new Promise(r => setTimeout(r, 300));
  }

  for (const code of Object.keys(GDELT_CODES)) {
    const n = await ingestGDELT(code);
    total += n;
    if (n) console.log(`  📡 GDELT ${code}: +${n} events`);
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`⚡ Ingestion complete — ${total} new events added`);
  return total;
}

module.exports = { ingestSecurityEvents };

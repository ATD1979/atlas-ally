// Atlas Ally — Automated Security Event Ingestion
// Pulls real security events (sirens, drones, missiles, explosions) from:
//   1. GDELT 2.0 Event API (free, no key, global coverage)
//   2. Jordan-specific security RSS feeds
//   3. ReliefWeb API (UN humanitarian alerts, no key needed)
//
// Events are auto-inserted as status='approved' so they appear in the Live Feed.

const fetch  = require('node-fetch');
const xml2js = require('xml2js');
const db     = require('../db');
const { extractLocation } = require('../geocoder');

const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: false });

// ── Keyword classifiers ───────────────────────────────────────────────────────

const SECURITY_KEYWORDS = [
  'air raid', 'siren', 'missile', 'drone', 'attack', 'explosion', 'rocket',
  'bomb', 'strike', 'shooting', 'gunfire', 'military', 'armed', 'artillery',
  'airstrike', 'UAV', 'blast', 'evacuation', 'emergency',
  'accident', 'crash', 'fire', 'flood', 'earthquake', 'protest', 'riot',
  'warning', 'alert', 'incident', 'crime', 'arrest', 'killed', 'injured',
  'border', 'security', 'police', 'soldiers', 'troops', 'conflict',
];

const TYPE_MAP = [
  { keywords: ['siren','air raid','alert'],         type: 'siren' },
  { keywords: ['missile','rocket','strike'],        type: 'missile' },
  { keywords: ['drone','UAV','unmanned'],           type: 'drone' },
  { keywords: ['explosion','blast','bomb'],         type: 'explosion' },
  { keywords: ['shooting','gunfire','armed'],       type: 'shooting' },
  { keywords: ['evacuation','evacuate','flee'],     type: 'evacuation' },
  { keywords: ['earthquake','quake','tremor'],      type: 'earthquake' },
  { keywords: ['flood','flash flood'],              type: 'flood' },
  { keywords: ['protest','demonstration','riot'],   type: 'protest' },
];

const SEVERITY_MAP = [
  { keywords: ['missile','rocket','airstrike','strike','blast','explosion','bomb'], severity: 'critical' },
  { keywords: ['siren','air raid','drone','UAV','shooting','gunfire'],              severity: 'high' },
  { keywords: ['evacuation','emergency','armed'],                                   severity: 'high' },
  { keywords: ['protest','demonstration','riot'],                                   severity: 'warn' },
];

function classifyEvent(text) {
  const lower = text.toLowerCase();
  const type     = TYPE_MAP.find(t => t.keywords.some(k => lower.includes(k)))?.type || 'incident';
  const severity = SEVERITY_MAP.find(s => s.keywords.some(k => lower.includes(k)))?.severity || 'warn';
  return { type, severity };
}

function isSecurityRelevant(text) {
  const lower = text.toLowerCase();
  return SECURITY_KEYWORDS.some(k => lower.includes(k));
}

// Reject titles that are predominantly non-Latin script (Arabic, Chinese, etc.)
function isEnglishText(text) {
  if (!text) return false;
  const latinChars    = (text.match(/[a-zA-Z\s\d.,!?'"()\-:;]/g) || []).length;
  const nonLatinChars = (text.match(/[^\x00-\x7F]/g) || []).length;
  return nonLatinChars === 0 || (latinChars / text.length) > 0.6;
}

// ── Dedup check ───────────────────────────────────────────────────────────────

const seenUrls = new Set(); // in-memory dedup for this session

function isDuplicate(sourceUrl, title) {
  if (seenUrls.has(sourceUrl)) return true;
  // Check DB for same source_url or very similar title in last 48h
  const existing = db.db.prepare(`
    SELECT id FROM events
    WHERE (source_url = ? OR title = ?)
      AND created_at > datetime('now', '-48 hours')
    LIMIT 1
  `).get(sourceUrl, title);
  return !!existing;
}

function insertEvent(ev) {
  if (isDuplicate(ev.source_url, ev.title)) return false;
  seenUrls.add(ev.source_url);
  try {
    db.addEvent.run({
      country_code:     ev.country_code,
      type:             ev.type,
      title:            ev.title.slice(0, 200),
      description:      (ev.description || '').slice(0, 1000),
      location:         ev.location || null,
      lat:              ev.lat || null,
      lng:              ev.lng || null,
      severity:         ev.severity,
      source:           ev.source,
      source_url:       ev.source_url,
      submitted_by:     'auto-ingest',
      submitted_user_id: null,
      is_test:          0,
    });
    return true;
  } catch(e) {
    return false;
  }
}

// ── Source 1: GDELT Events API ────────────────────────────────────────────────
// Free, no auth, updated every 15 min. Covers military/attack/violent events.
// CAMEO code 19 = Use Unconventional Mass Violence, 18 = Assault, 14 = Protest
// EventRootCode filter: we use codes 14,18,19,20 (violence/protest/coerce)

const GDELT_COUNTRY_CODES = {
  // Original high-risk countries
  JO: 'JOR', UA: 'UKR', LB: 'LBN', EG: 'EGY', IL: 'ISR',
  IQ: 'IRQ', SY: 'SYR', PK: 'PAK', AF: 'AFG', YE: 'YEM',
  MX: 'MEX', CO: 'COL', NG: 'NGA', SO: 'SOM', SD: 'SDN',
  LY: 'LBY', ET: 'ETH', MM: 'MMR', PH: 'PHL',
  // All remaining app countries — use broader keyword filter for stable nations
  FR: 'FRA', JP: 'JPN', ZA: 'ZAF', IN: 'IND', BR: 'BRA',
  KE: 'KEN', TR: 'TUR', MA: 'MAR', TH: 'THA',
};

async function ingestGDELT(countryCode) {
  const fipsCode = GDELT_COUNTRY_CODES[countryCode];
  if (!fipsCode) return 0;

  // GDELT GKG CSV is complex; use the simpler Events CSV last-15-min export
  // Format: http://data.gdeltproject.org/gdeltv2/lastupdate.txt → get current file
  // Simpler: use the GDELT DOC API which returns JSON article summaries

  // Stable countries get a broader query (protest, crime, terror, disaster) so they surface results
  const stableCountries = ['FRA','JPN','ZAF','IND','BRA','KEN','TUR','MAR','THA'];
  const keywords = stableCountries.includes(fipsCode)
    ? '"attack" OR "explosion" OR "shooting" OR "protest" OR "terrorism" OR "flood" OR "earthquake" OR "crash" OR "fire" OR "riot"'
    : '"missile" OR "drone" OR "siren" OR "explosion" OR "airstrike" OR "attack" OR "bombing"';
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${fipsCode}+(${encodeURIComponent(keywords)})&mode=artlist&maxrecords=10&format=json&timespan=1440&sourcelang=english`;

  try {
    const res = await fetch(url, { timeout: 12000, headers: { 'User-Agent': 'AtlasAlly/1.0' } });
    if (!res.ok) return 0;
    const data = await res.json();
    const articles = data.articles || [];
    let count = 0;

    for (const art of articles) {
      const text = `${art.title || ''} ${art.seendate || ''}`;
      if (!isSecurityRelevant(text)) continue;
      if (!isEnglishText(art.title || '')) continue;
      const { type, severity } = classifyEvent(art.title || '');
      const geo = extractLocation(`${art.title || ''} ${art.seendate || ''}`, countryCode);
      const ok = insertEvent({
        country_code: countryCode,
        type,
        severity,
        title:       art.title || 'Security Incident',
        description: art.seendate ? `Reported: ${art.seendate}` : '',
        location:    geo?.location || null,
        lat:         geo?.lat || null,
        lng:         geo?.lng || null,
        source:      art.domain || 'GDELT',
        source_url:  art.url || `https://api.gdeltproject.org`,
      });
      if (ok) count++;
    }
    return count;
  } catch(e) {
    console.warn(`  GDELT ingest failed for ${countryCode}: ${e.message}`);
    return 0;
  }
}

// ── Source 2: Jordan-specific security RSS feeds ──────────────────────────────

const JORDAN_SECURITY_FEEDS = [
  // Jordan Times — English, reliable
  { name: 'Jordan Times',     url: 'https://jordantimes.com/rss/all' },
  // Petra News Agency — official Jordan state news
  { name: 'Petra News',       url: 'https://petra.gov.jo/Include/InnerPage.jsp?ID=21&lang=en&name=en_news&feed=rss' },
  // Roya News — Jordan's main independent TV channel
  { name: 'Roya News',        url: 'https://en.roya.tv/rss' },
  // Al-Monitor Jordan
  { name: 'Al-Monitor',       url: 'https://www.al-monitor.com/rss.xml' },
  // BBC Middle East
  { name: 'BBC Middle East',  url: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml' },
  // Al Jazeera ME
  { name: 'Al Jazeera ME',    url: 'https://www.aljazeera.com/xml/rss/all.xml' },
  // US State Dept travel advisories — all countries, filter for Jordan
  { name: 'US State Dept',    url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html/rss.xml', filterKeyword: 'jordan' },
];

async function fetchRSSItems(url) {
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

function extractText(item) {
  const title = String(item.title?._ || item.title || '').replace(/<[^>]*>/g, '').trim();
  const desc  = String(item.description?._ || item.description || item.summary?._ || item.summary || '')
                  .replace(/<[^>]*>/g, '').trim().slice(0, 600);
  const url   = item.link?.$ ? item.link.$.href
                : (typeof item.link === 'string' ? item.link : item.guid?._ || item.guid || '');
  const pub   = item.pubDate || item.published || item.updated || new Date().toISOString();
  return { title, desc, url: String(url).trim(), pub };
}

// Jordan country center coords for rough location
const COUNTRY_CENTERS = {
  JO: { lat: 31.24, lng: 36.51 },
  UA: { lat: 48.38, lng: 31.16 },
  LB: { lat: 33.85, lng: 35.86 },
  IL: { lat: 31.05, lng: 34.85 },
  IQ: { lat: 33.22, lng: 43.68 },
  SY: { lat: 34.80, lng: 38.99 },
};

async function ingestJordanRSS() {
  let count = 0;
  const LOCAL_FEEDS = ['Jordan Times', 'Petra News', 'Roya News'];

  for (const feed of JORDAN_SECURITY_FEEDS) {
    const items = await fetchRSSItems(feed.url);
    for (const raw of items.slice(0, 20)) {
      const { title, desc, url, pub } = extractText(raw);
      if (!title || title.length < 10) continue;
      if (!isEnglishText(title)) continue;

      // If feed has a filterKeyword (e.g. State Dept covers all countries), enforce it
      if (feed.filterKeyword && !text.includes(feed.filterKeyword)) continue;

      // Jordan relevance check for global feeds
      const isLocalFeed = LOCAL_FEEDS.includes(feed.name);
      const isJordanRelated = isLocalFeed ||
        text.includes('jordan') || text.includes('amman') ||
        text.includes('aqaba') || text.includes('zarqa') ||
        text.includes('irbid') || text.includes('mafraq');
      if (!isJordanRelated) continue;

      // Local Jordan feeds: accept all articles. Global feeds: require security keyword.
      if (!isLocalFeed && !isSecurityRelevant(text)) continue;

      const { type, severity } = classifyEvent(`${title} ${desc}`);
      const geo = extractLocation(`${title} ${desc}`, 'JO');

      const ok = insertEvent({
        country_code: 'JO',
        type,
        severity,
        title,
        description: desc,
        location:    geo?.location || 'Jordan',
        lat:         geo?.lat || null,
        lng:         geo?.lng || null,
        source:      feed.name,
        source_url:  url || `${feed.url}#${Date.now()}`,
      });
      if (ok) count++;
    }
    await new Promise(r => setTimeout(r, 500));
  }
  return count;
}

// ── Source 3: ReliefWeb API (UN OCHA — free, no key) ─────────────────────────

const RELIEFWEB_COUNTRIES = {
  JO: 'jordan',   UA: 'ukraine',  LB: 'lebanon',       SY: 'syria',
  IQ: 'iraq',     YE: 'yemen',    SO: 'somalia',        SD: 'sudan',
  LY: 'libya',    AF: 'afghanistan', PK: 'pakistan',   MM: 'myanmar',
  ET: 'ethiopia', NG: 'nigeria',  CD: 'democratic-republic-of-the-congo',
  KE: 'kenya',    PH: 'philippines', IN: 'india',       MX: 'mexico',
  CO: 'colombia', BR: 'brazil',   TR: 'turkey',         EG: 'egypt',
};

async function ingestReliefWeb(countryCode) {
  const slug = RELIEFWEB_COUNTRIES[countryCode];
  if (!slug) return 0;

  const url = `https://api.reliefweb.int/v1/reports?appname=atlasally&filter[operator]=AND&filter[conditions][0][field]=country.name&filter[conditions][0][value]=${slug}&filter[conditions][1][field]=theme.name&filter[conditions][1][value]=Security&fields[include][]=title&fields[include][]=body-html&fields[include][]=url&fields[include][]=date&limit=10`;

  try {
    const res  = await fetch(url, { timeout: 10000, headers: { 'User-Agent': 'AtlasAlly/1.0' } });
    if (!res.ok) return 0;
    const data = await res.json();
    const items = data.data || [];
    let count = 0;

    for (const item of items) {
      const f     = item.fields || {};
      const title = String(f.title || '').trim();
      const body  = String(f['body-html'] || '').replace(/<[^>]*>/g, '').trim().slice(0, 600);
      const link  = f.url || `https://reliefweb.int/node/${item.id}`;
      if (!title || title.length < 10) continue;

      const { type, severity } = classifyEvent(`${title} ${body}`);
      const geo = extractLocation(`${title} ${body}`, countryCode);

      const ok = insertEvent({
        country_code: countryCode,
        type,
        severity,
        title,
        description: body,
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
    console.warn(`  ReliefWeb ingest failed for ${countryCode}: ${e.message}`);
    return 0;
  }
}

// ── Source 4: US Embassy security alerts (WordPress RSS, no key needed) ────────
// Covers embassies that have active security alert categories.
// Jordan's embassy is extremely active — shelter-in-place, missile/drone alerts.

const EMBASSY_FEEDS = [
  { name: 'US Embassy Jordan',       url: 'https://jo.usembassy.gov/category/alert/feed/', country_code: 'JO' },
  { name: 'US Embassy Ukraine',      url: 'https://ua.usembassy.gov/category/alert/feed/', country_code: 'UA' },
  { name: 'US Embassy Lebanon',      url: 'https://lb.usembassy.gov/category/alert/feed/', country_code: 'LB' },
  { name: 'US Embassy Iraq',         url: 'https://iq.usembassy.gov/category/alert/feed/', country_code: 'IQ' },
  { name: 'US Embassy Israel',       url: 'https://il.usembassy.gov/category/alert/feed/', country_code: 'IL' },
  { name: 'US Embassy Pakistan',     url: 'https://pk.usembassy.gov/category/alert/feed/', country_code: 'PK' },
  { name: 'US Embassy Egypt',        url: 'https://eg.usembassy.gov/category/alert/feed/', country_code: 'EG' },
  { name: 'US Embassy Nigeria',      url: 'https://ng.usembassy.gov/category/alert/feed/', country_code: 'NG' },
  { name: 'US Embassy Mexico',       url: 'https://mx.usembassy.gov/category/alert/feed/', country_code: 'MX' },
  { name: 'US Embassy Colombia',     url: 'https://co.usembassy.gov/category/alert/feed/', country_code: 'CO' },
  { name: 'US Embassy Philippines',  url: 'https://ph.usembassy.gov/category/alert/feed/', country_code: 'PH' },
  { name: 'US Embassy Kenya',        url: 'https://ke.usembassy.gov/category/alert/feed/', country_code: 'KE' },
  { name: 'US Embassy Turkey',       url: 'https://tr.usembassy.gov/category/alert/feed/', country_code: 'TR' },
  { name: 'US Embassy India',        url: 'https://in.usembassy.gov/category/alert/feed/', country_code: 'IN' },
  { name: 'US Embassy Brazil',       url: 'https://br.usembassy.gov/category/alert/feed/', country_code: 'BR' },
  { name: 'US Embassy Morocco',      url: 'https://ma.usembassy.gov/category/alert/feed/', country_code: 'MA' },
  { name: 'US Embassy Thailand',     url: 'https://th.usembassy.gov/category/alert/feed/', country_code: 'TH' },
  { name: 'US Embassy South Africa', url: 'https://za.usembassy.gov/category/alert/feed/', country_code: 'ZA' },
  { name: 'US Embassy France',       url: 'https://fr.usembassy.gov/category/alert/feed/', country_code: 'FR' },
  { name: 'US Embassy Japan',        url: 'https://jp.usembassy.gov/category/alert/feed/', country_code: 'JP' },
];

async function ingestEmbassyAlerts() {
  let count = 0;
  for (const feed of EMBASSY_FEEDS) {
    const items = await fetchRSSItems(feed.url);
    for (const raw of items.slice(0, 10)) {
      const { title, desc, url, pub } = extractText(raw);
      if (!title || title.length < 10) continue;
      if (!isEnglishText(title)) continue;

      const { type, severity } = classifyEvent(`${title} ${desc}`);
      const geo = extractLocation(`${title} ${desc}`, feed.country_code);

      // Embassy alerts are always security-relevant — no keyword filter needed
      const ok = insertEvent({
        country_code: feed.country_code,
        type:         type === 'incident' ? 'siren' : type, // default embassy alerts to siren
        severity:     severity === 'warn' ? 'high' : severity, // embassy alerts are at least high
        title:        title.replace(/^Security Alert[–—-]*\s*/i, '').trim() || title,
        description:  desc,
        location:     geo?.location || null,
        lat:          geo?.lat || null,
        lng:          geo?.lng || null,
        source:       feed.name,
        source_url:   url || feed.url,
      });
      if (ok) count++;
    }
    await new Promise(r => setTimeout(r, 400));
  }
  return count;
}

// ── Source 5: UK FCDO travel alerts (Atom feed, no key needed) ───────────────
// Independent from US State Dept — often more granular on specific threat areas.

const FCDO_FEEDS = [
  { country_code: 'JO', slug: 'jordan' },
  { country_code: 'UA', slug: 'ukraine' },
  { country_code: 'LB', slug: 'lebanon' },
  { country_code: 'IQ', slug: 'iraq' },
  { country_code: 'IL', slug: 'israel' },
  { country_code: 'PK', slug: 'pakistan' },
  { country_code: 'EG', slug: 'egypt' },
  { country_code: 'NG', slug: 'nigeria' },
  { country_code: 'MX', slug: 'mexico' },
  { country_code: 'CO', slug: 'colombia' },
  { country_code: 'PH', slug: 'philippines' },
  { country_code: 'KE', slug: 'kenya' },
  { country_code: 'TR', slug: 'turkey' },
  { country_code: 'IN', slug: 'india' },
  { country_code: 'BR', slug: 'brazil' },
  { country_code: 'MA', slug: 'morocco' },
  { country_code: 'TH', slug: 'thailand' },
  { country_code: 'ZA', slug: 'south-africa' },
  { country_code: 'FR', slug: 'france' },
  { country_code: 'JP', slug: 'japan' },
];

async function ingestFCDO() {
  let count = 0;
  for (const entry of FCDO_FEEDS) {
    const url = `https://www.gov.uk/foreign-travel-advice/${entry.slug}.atom`;
    const items = await fetchRSSItems(url);
    for (const raw of items.slice(0, 5)) {
      const { title, desc, url: link, pub } = extractText(raw);
      if (!title || title.length < 10) continue;
      if (!isEnglishText(title)) continue;
      if (!isSecurityRelevant(`${title} ${desc}`)) continue;

      const { type, severity } = classifyEvent(`${title} ${desc}`);
      const geo = extractLocation(`${title} ${desc}`, entry.country_code);

      const ok = insertEvent({
        country_code: entry.country_code,
        type,
        severity,
        title,
        description: desc,
        location:    geo?.location || null,
        lat:         geo?.lat || null,
        lng:         geo?.lng || null,
        source:      'UK FCDO',
        source_url:  link || url,
      });
      if (ok) count++;
    }
    await new Promise(r => setTimeout(r, 400));
  }
  return count;
}

// ── Source 6: ACLED (Armed Conflict Location & Event Data) ────────────────────
// Requires free account at acleddata.com — set ACLED_EMAIL + ACLED_KEY in env.
// Returns exact lat/lng per event, event type, fatalities, actors.
// Updated weekly. Best structured conflict data available for free.

const ACLED_COUNTRIES = {
  JO: 'Jordan',   UA: 'Ukraine',      LB: 'Lebanon',      EG: 'Egypt',
  IL: 'Israel',   IQ: 'Iraq',         SY: 'Syria',        PK: 'Pakistan',
  AF: 'Afghanistan', YE: 'Yemen',     MX: 'Mexico',       CO: 'Colombia',
  NG: 'Nigeria',  SO: 'Somalia',      SD: 'Sudan',        LY: 'Libya',
  ET: 'Ethiopia', MM: 'Myanmar',      PH: 'Philippines',
  // Stable countries — ACLED covers these too (protests, crime, riots)
  FR: 'France',   JP: 'Japan',        ZA: 'South Africa', IN: 'India',
  BR: 'Brazil',   KE: 'Kenya',        TR: 'Turkey',       MA: 'Morocco',
  TH: 'Thailand',
};

// ACLED event_type → our internal type
const ACLED_TYPE_MAP = {
  'Battles':                    'explosion',
  'Explosions/Remote violence': 'explosion',
  'Violence against civilians': 'shooting',
  'Protests':                   'protest',
  'Riots':                      'protest',
  'Strategic developments':     'incident',
};

// ACLED disorder_type → our severity
function acledSeverity(eventType, fatalities) {
  if (fatalities > 0)                          return 'critical';
  if (eventType === 'Battles')                 return 'critical';
  if (eventType === 'Explosions/Remote violence') return 'high';
  if (eventType === 'Violence against civilians') return 'high';
  return 'warn';
}

async function ingestACLED() {
  const email = process.env.ACLED_EMAIL;
  const key   = process.env.ACLED_KEY;
  if (!email || !key) {
    // Silently skip — not configured yet
    return 0;
  }

  let total = 0;
  const countriesList = Object.values(ACLED_COUNTRIES).join('|');

  // Fetch last 7 days of events across all tracked countries
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString().slice(0, 10); // YYYY-MM-DD

  const url = `https://api.acleddata.com/acled/read?key=${encodeURIComponent(key)}&email=${encodeURIComponent(email)}&country=${encodeURIComponent(countriesList)}&event_date=${since}&event_date_where=>&fields=event_id_cnty,event_date,event_type,country,admin1,admin2,location,latitude,longitude,fatalities,notes&limit=200&format=json`;

  try {
    const res = await fetch(url, { timeout: 15000, headers: { 'User-Agent': 'AtlasAlly/1.0' } });
    if (!res.ok) {
      console.warn(`  ACLED API error: HTTP ${res.status}`);
      return 0;
    }
    const data = await res.json();
    const events = data.data || [];

    for (const ev of events) {
      // Match country name back to our country_code
      const code = Object.entries(ACLED_COUNTRIES).find(([, name]) => name === ev.country)?.[0];
      if (!code) continue;

      const title = ev.notes
        ? ev.notes.slice(0, 120)
        : `${ev.event_type} in ${ev.location || ev.admin1 || ev.country}`;

      const type     = ACLED_TYPE_MAP[ev.event_type] || 'incident';
      const severity = acledSeverity(ev.event_type, parseInt(ev.fatalities) || 0);
      const location = [ev.location, ev.admin2, ev.admin1].filter(Boolean).join(', ');

      const ok = insertEvent({
        country_code: code,
        type,
        severity,
        title,
        description: ev.notes ? `${ev.event_type} · Fatalities: ${ev.fatalities || 0}` : '',
        location:    location || null,
        lat:         parseFloat(ev.latitude)  || null,
        lng:         parseFloat(ev.longitude) || null,
        source:      'ACLED',
        source_url:  `https://acleddata.com/data-export-tool/?country=${encodeURIComponent(ev.country)}&event_date=${ev.event_date}`,
      });
      if (ok) total++;
    }

    console.log(`  📊 ACLED: +${total} events (${events.length} fetched)`);
  } catch(e) {
    console.warn(`  ACLED ingest failed: ${e.message}`);
  }
  return total;
}

// ── Main ingestion runner ─────────────────────────────────────────────────────

async function ingestSecurityEvents() {
  console.log('⚡ Ingesting security events...');

  // Purge any previously ingested non-English events
  try {
    db.db.prepare(`
      DELETE FROM events
      WHERE submitted_by = 'auto-ingest'
        AND title GLOB '*[^\x00-\x7F]*'
    `).run();
  } catch(e) {}

  let total = 0;

  // Source 4: US Embassy alerts — highest signal, real shelter-in-place/missile alerts
  const embassyCount = await ingestEmbassyAlerts();
  total += embassyCount;
  if (embassyCount > 0) console.log(`  🏛  Embassy alerts: +${embassyCount} events`);

  // Source 6: ACLED — exact coordinates, structured conflict data (requires API key)
  const acledCount = await ingestACLED();
  total += acledCount;

  // Source 1: Jordan-specific RSS
  const jordanCount = await ingestJordanRSS();
  total += jordanCount;
  console.log(`  🇯🇴 Jordan RSS: +${jordanCount} events`);

  // Source 5: UK FCDO travel alerts
  const fcdoCount = await ingestFCDO();
  total += fcdoCount;
  if (fcdoCount > 0) console.log(`  🇬🇧 FCDO: +${fcdoCount} events`);

  // Source 1: GDELT for all high-risk countries
  const gdeltCountries = Object.keys(GDELT_COUNTRY_CODES);
  for (const code of gdeltCountries) {
    const n = await ingestGDELT(code);
    total += n;
    if (n > 0) console.log(`  📡 GDELT ${code}: +${n} events`);
    await new Promise(r => setTimeout(r, 600));
  }

  // Source 3: ReliefWeb for UN-tracked crisis countries
  const rwCountries = Object.keys(RELIEFWEB_COUNTRIES);
  for (const code of rwCountries) {
    const n = await ingestReliefWeb(code);
    total += n;
    if (n > 0) console.log(`  🌐 ReliefWeb ${code}: +${n} events`);
    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`⚡ Event ingestion complete — ${total} new events added`);
  return total;
}

module.exports = { ingestSecurityEvents };

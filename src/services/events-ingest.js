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

const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: false });

// ── Keyword classifiers ───────────────────────────────────────────────────────

const SECURITY_KEYWORDS = [
  'air raid', 'siren', 'missile', 'drone', 'attack', 'explosion', 'rocket',
  'bomb', 'strike', 'shooting', 'gunfire', 'military', 'armed', 'artillery',
  'airstrike', 'UAV', 'blast', 'evacuation', 'emergency alert',
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
  JO: 'JOR', UA: 'UKR', LB: 'LBN', EG: 'EGY', IL: 'ISR',
  IQ: 'IRQ', SY: 'SYR', PK: 'PAK', AF: 'AFG', YE: 'YEM',
  MX: 'MEX', CO: 'COL', NG: 'NGA', SO: 'SOM', SD: 'SDN',
  LY: 'LBY', ET: 'ETH', MM: 'MMR', PH: 'PHL',
};

async function ingestGDELT(countryCode) {
  const fipsCode = GDELT_COUNTRY_CODES[countryCode];
  if (!fipsCode) return 0;

  // GDELT GKG CSV is complex; use the simpler Events CSV last-15-min export
  // Format: http://data.gdeltproject.org/gdeltv2/lastupdate.txt → get current file
  // Simpler: use the GDELT DOC API which returns JSON article summaries

  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${fipsCode}+("missile" OR "drone" OR "siren" OR "explosion" OR "airstrike" OR "attack" OR "bombing")&mode=artlist&maxrecords=10&format=json&timespan=1440`; // last 24h

  try {
    const res = await fetch(url, { timeout: 12000, headers: { 'User-Agent': 'AtlasAlly/1.0' } });
    if (!res.ok) return 0;
    const data = await res.json();
    const articles = data.articles || [];
    let count = 0;

    for (const art of articles) {
      const text = `${art.title || ''} ${art.seendate || ''}`;
      if (!isSecurityRelevant(text)) continue;
      const { type, severity } = classifyEvent(art.title || '');
      const ok = insertEvent({
        country_code: countryCode,
        type,
        severity,
        title:       art.title || 'Security Incident',
        description: art.seendate ? `Reported: ${art.seendate}` : '',
        location:    null,
        lat:         null,
        lng:         null,
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
  // Al-Monitor Jordan
  { name: 'Al-Monitor',       url: 'https://www.al-monitor.com/rss.xml' },
  // BBC Middle East
  { name: 'BBC Middle East',  url: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml' },
  // Reuters Middle East (via RSS aggregator)
  { name: 'Al Jazeera ME',   url: 'https://www.aljazeera.com/xml/rss/all.xml' },
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
  for (const feed of JORDAN_SECURITY_FEEDS) {
    const items = await fetchRSSItems(feed.url);
    for (const raw of items.slice(0, 20)) {
      const { title, desc, url, pub } = extractText(raw);
      if (!title || title.length < 10) continue;

      // Only ingest if relevant to Jordan AND security
      const text = `${title} ${desc}`.toLowerCase();
      const isJordanRelated = text.includes('jordan') || text.includes('amman') ||
                              text.includes('aqaba') || text.includes('zarqa') ||
                              feed.name === 'Jordan Times' || feed.name === 'Petra News';
      if (!isJordanRelated) continue;
      if (!isSecurityRelevant(text)) continue;

      const { type, severity } = classifyEvent(`${title} ${desc}`);
      const center = COUNTRY_CENTERS.JO;

      const ok = insertEvent({
        country_code: 'JO',
        type,
        severity,
        title,
        description: desc,
        location:    'Jordan',
        lat:         center.lat,
        lng:         center.lng,
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
  JO: 'jordan', UA: 'ukraine', LB: 'lebanon', SY: 'syria',
  IQ: 'iraq', YE: 'yemen', SO: 'somalia', SD: 'sudan', LY: 'libya',
  AF: 'afghanistan', PK: 'pakistan', MM: 'myanmar', ET: 'ethiopia',
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
      const center = COUNTRY_CENTERS[countryCode] || { lat: null, lng: null };

      const ok = insertEvent({
        country_code: countryCode,
        type,
        severity,
        title,
        description: body,
        location:    null,
        lat:         center.lat,
        lng:         center.lng,
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

// ── Main ingestion runner ─────────────────────────────────────────────────────

async function ingestSecurityEvents() {
  console.log('⚡ Ingesting security events...');
  let total = 0;

  // Always run Jordan-specific RSS (highest priority, most specific)
  const jordanCount = await ingestJordanRSS();
  total += jordanCount;
  console.log(`  🇯🇴 Jordan RSS: +${jordanCount} events`);

  // GDELT for all high-risk countries
  const gdeltCountries = Object.keys(GDELT_COUNTRY_CODES);
  for (const code of gdeltCountries) {
    const n = await ingestGDELT(code);
    total += n;
    if (n > 0) console.log(`  📡 GDELT ${code}: +${n} events`);
    await new Promise(r => setTimeout(r, 600));
  }

  // ReliefWeb for UN-tracked crisis countries
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

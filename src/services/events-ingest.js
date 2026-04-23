// Atlas Ally — Event ingestion v2 — ACLED removed, UCDP primary
// v2026.04.15 — clean slate
// Sources:
//   1. US Embassy RSS (shelter-in-place, missile alerts)
//   2. UK FCDO travel alerts
//   3. ReliefWeb / UN OCHA (humanitarian crises)
//   4. GDELT (English only, violence + drug + crime keywords)
//   5. UCDP / Uppsala University (free academic conflict data, GPS-tagged)
//   6. InSight Crime RSS (organized crime & drug trafficking — Americas)
//   7. UNODC RSS (UN drug & crime reports — global)
//   8. ACLED OAuth (when approved)

'use strict';

const fetch  = require('node-fetch');
const xml2js = require('xml2js');
const db     = require('../db');
const { extractLocation } = require('../geocoder');
const { isRelevantToCountry } = require('../lib/countries-meta');

const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: false });

// ── Language guard ────────────────────────────────────────────────────────────
function isEnglish(text) {
  if (!text || text.trim().length < 5) return false;
  // eslint-disable-next-line no-control-regex -- intentional: match any char outside ASCII 0x00-0x7F
  const nonLatin = (text.match(/[^\x00-\x7F]/g) || []).length;
  return (nonLatin / text.length) < 0.20;
}

// ── Classifier ────────────────────────────────────────────────────────────────
const SECURITY_KEYWORDS = [
  'attack','explosion','missile','rocket','drone','airstrike','bomb','blast',
  'shooting','gunfire','siren','air raid','military','armed','artillery',
  'evacuation','emergency','conflict','killed','injured','casualties',
  'protest','riot','demonstration','arrest','police','security alert',
  'earthquake','flood','fire','crash','accident','warning','incident',
  'border','troops','soldiers','terror','hostage','threat',
  // Drug/crime keywords
  'drug','narcotics','trafficking','smuggling','cartel','cocaine','heroin',
  'methamphetamine','fentanyl','seizure','bust','gang','murder','homicide',
  'kidnap','extortion','organized crime','drug lord','dealer','contraband',
];

const TYPE_MAP = [
  { words: ['siren','air raid','alert'],               type: 'siren'      },
  { words: ['missile','rocket','strike','launch'],     type: 'missile'    },
  { words: ['drone','uav','unmanned'],                 type: 'drone'      },
  { words: ['explosion','blast','bomb','bombing'],     type: 'explosion'  },
  { words: ['shooting','gunfire','armed','gun'],       type: 'shooting'   },
  { words: ['evacuation','evacuate','flee'],           type: 'evacuation' },
  { words: ['earthquake','quake','tremor'],            type: 'earthquake' },
  { words: ['flood','flash flood','inundation'],       type: 'flood'      },
  { words: ['protest','demonstration','riot'],         type: 'protest'    },
  { words: ['fire','wildfire','blaze'],                type: 'fire'       },
  { words: ['drug','narcotic','trafficking','cartel',
             'cocaine','heroin','fentanyl','seizure',
             'smuggling','bust','dealer'],             type: 'drug'       },
  { words: ['murder','homicide','kill','dead',
             'gang','kidnap','extortion'],             type: 'crime'      },
];

const SEVERITY_MAP = [
  { words: ['missile','rocket','airstrike','blast','explosion','bomb','bombing','mass casualt'], severity: 'critical' },
  { words: ['siren','air raid','drone','uav','shooting','gunfire','attack','killed','murder'],   severity: 'high'     },
  { words: ['evacuation','emergency','armed','conflict','troops','cartel','trafficking'],        severity: 'high'     },
  { words: ['drug','narcotics','seizure','bust','arrest','protest'],                            severity: 'warn'     },
];

function classify(text) {
  const lower = text.toLowerCase();
  const type     = TYPE_MAP.find(t => t.words.some(w => lower.includes(w)))?.type || 'incident';
  const severity = SEVERITY_MAP.find(s => s.words.some(w => lower.includes(w)))?.severity || 'warn';
  return { type, severity };
}

function isRelevant(text) {
  const lower = text.toLowerCase();
  return SECURITY_KEYWORDS.some(k => lower.includes(k));
}

// Jordan-specific noise filter — ported from news.js to catch sports/sneaker
// content that slips through keyword-based country tagging (e.g. Michael Jordan,
// Jordan brand sneakers, Jordan Peterson). Only applied when country_code is JO.
function passesJordanNoiseFilter(title) {
  const t = title.toLowerCase();
  if (/\b(basketball|nba|wnba|michael jordan|air jordan|jordan brand|jordan peterson|sneaker|sports|athlete|game|court)\b/.test(t)) {
    return false;
  }
  return true;
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
  if (!isEnglish(ev.title)) return false;
  if (ev.country_code === 'JO' && !passesJordanNoiseFilter(ev.title)) return false;
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
  { name: 'US Embassy Honduras',     url: 'https://hn.usembassy.gov/category/alert/feed/',   code: 'HN' },
  { name: 'US Embassy Guatemala',    url: 'https://gt.usembassy.gov/category/alert/feed/',   code: 'GT' },
  { name: 'US Embassy Venezuela',    url: 'https://ve.usembassy.gov/category/alert/feed/',   code: 'VE' },
  { name: 'US Embassy Haiti',        url: 'https://ht.usembassy.gov/category/alert/feed/',   code: 'HT' },
];

async function ingestEmbassyAlerts() {
  let count = 0;
  for (const feed of EMBASSY_FEEDS) {
    const items = await fetchRSS(feed.url);
    for (const raw of items.slice(0, 10)) {
      const { title, desc, url } = parseItem(raw);
      if (!title || title.length < 10 || !isEnglish(title)) continue;
      const { type, severity } = classify(`${title} ${desc}`);
      const geo = extractLocation(`${title} ${desc}`, feed.code);
      const ok  = insertEvent({
        country_code: feed.code,
        type:         type === 'incident' ? 'siren' : type,
        severity:     severity === 'warn' ? 'high' : severity,
        title:        title.replace(/^Security Alert[–—:\-]*\s*/i, '').trim() || title,
        description:  desc,
        location:     geo?.location || null,
        lat: geo?.lat || null, lng: geo?.lng || null,
        source: feed.name, source_url: url || feed.url,
      });
      if (ok) count++;
    }
    await new Promise(r => setTimeout(r, 300));
  }
  return count;
}

// ── Source 2: UK FCDO travel alerts ──────────────────────────────────────────
const FCDO_COUNTRIES = [
  { code:'JO',slug:'jordan' },      { code:'UA',slug:'ukraine' },
  { code:'LB',slug:'lebanon' },     { code:'IQ',slug:'iraq' },
  { code:'IL',slug:'israel' },      { code:'PK',slug:'pakistan' },
  { code:'EG',slug:'egypt' },       { code:'NG',slug:'nigeria' },
  { code:'MX',slug:'mexico' },      { code:'CO',slug:'colombia' },
  { code:'PH',slug:'philippines' }, { code:'KE',slug:'kenya' },
  { code:'TR',slug:'turkey' },      { code:'IN',slug:'india' },
  { code:'BR',slug:'brazil' },      { code:'MA',slug:'morocco' },
  { code:'TH',slug:'thailand' },    { code:'ZA',slug:'south-africa' },
  { code:'FR',slug:'france' },      { code:'JP',slug:'japan' },
  { code:'SY',slug:'syria' },       { code:'YE',slug:'yemen' },
  { code:'VE',slug:'venezuela' },   { code:'HN',slug:'honduras' },
  { code:'GT',slug:'guatemala' },   { code:'HT',slug:'haiti' },
  { code:'MM',slug:'myanmar' },     { code:'AF',slug:'afghanistan' },
];

async function ingestFCDO() {
  let count = 0;
  for (const entry of FCDO_COUNTRIES) {
    const url   = `https://www.gov.uk/foreign-travel-advice/${entry.slug}.atom`;
    const items = await fetchRSS(url);
    for (const raw of items.slice(0, 5)) {
      const { title, desc, url: link } = parseItem(raw);
      if (!title || title.length < 10 || !isEnglish(title)) continue;
      if (!isRelevant(`${title} ${desc}`)) continue;
      const { type, severity } = classify(`${title} ${desc}`);
      const geo = extractLocation(`${title} ${desc}`, entry.code);
      const ok  = insertEvent({
        country_code: entry.code, type, severity, title, description: desc,
        location: geo?.location || null, lat: geo?.lat || null, lng: geo?.lng || null,
        source: 'UK FCDO', source_url: link || url,
      });
      if (ok) count++;
    }
    await new Promise(r => setTimeout(r, 300));
  }
  return count;
}

// ── Source 3: ReliefWeb (UN OCHA) ────────────────────────────────────────────
const RELIEFWEB_COUNTRIES = {
  JO:'jordan',   UA:'ukraine',  LB:'lebanon',    SY:'syria',
  IQ:'iraq',     YE:'yemen',    SO:'somalia',     SD:'sudan',
  LY:'libya',    AF:'afghanistan', PK:'pakistan', MM:'myanmar',
  ET:'ethiopia', NG:'nigeria',  CD:'democratic-republic-of-the-congo',
  KE:'kenya',    PH:'philippines', IN:'india',    MX:'mexico',
  CO:'colombia', BR:'brazil',   TR:'turkey',      EG:'egypt',
  VE:'venezuela', HN:'honduras', GT:'guatemala',  HT:'haiti',
};

async function ingestReliefWeb(code) {
  const slug = RELIEFWEB_COUNTRIES[code];
  if (!slug) return 0;
  const url = `https://api.reliefweb.int/v1/reports?appname=atlasally`
    + `&filter[operator]=AND`
    + `&filter[conditions][0][field]=country.name&filter[conditions][0][value]=${slug}`
    + `&filter[conditions][1][field]=theme.name&filter[conditions][1][value]=Security`
    + `&fields[include][]=title&fields[include][]=body-html&fields[include][]=url&fields[include][]=date`
    + `&limit=10&sort[]=date:desc`;
  try {
    const res   = await fetch(url, { timeout: 10000, headers: { 'User-Agent': 'AtlasAlly/1.0' } });
    if (!res.ok) return 0;
    const data  = await res.json();
    let count   = 0;
    for (const item of (data.data || [])) {
      const f     = item.fields || {};
      const title = String(f.title || '').trim();
      const body  = String(f['body-html'] || '').replace(/<[^>]*>/g, '').trim().slice(0, 600);
      const link  = f.url || `https://reliefweb.int/node/${item.id}`;
      if (!title || title.length < 10 || !isEnglish(title)) continue;
      const { type, severity } = classify(`${title} ${body}`);
      const geo = extractLocation(`${title} ${body}`, code);
      const ok  = insertEvent({
        country_code: code, type, severity, title, description: body,
        location: geo?.location || null, lat: geo?.lat || null, lng: geo?.lng || null,
        source: 'ReliefWeb / UN OCHA', source_url: link,
      });
      if (ok) count++;
    }
    return count;
  } catch(e) {
    console.warn(`  ReliefWeb failed ${code}: ${e.message}`);
    return 0;
  }
}

// ── Source 4: GDELT (violence + crime + drug keywords) ────────────────────────
const GDELT_CODES = {
  JO:'JOR', UA:'UKR', LB:'LBN', EG:'EGY', IL:'ISR', IQ:'IRQ', SY:'SYR',
  PK:'PAK', AF:'AFG', YE:'YEM', MX:'MEX', CO:'COL', NG:'NGA', SO:'SOM',
  SD:'SDN', LY:'LBY', ET:'ETH', MM:'MMR', PH:'PHL', FR:'FRA', JP:'JPN',
  ZA:'ZAF', IN:'IND', BR:'BRA', KE:'KEN', TR:'TUR', MA:'MAR', TH:'THA',
  VE:'VEN', HN:'HND', GT:'GTM', HT:'HTI',
};

const STABLE = new Set(['FRA','JPN','IND','BRA','KEN','TUR','MAR','THA']);

// Two query passes per country: security events + crime/drug events
const CONFLICT_KEYWORDS = '"attack" OR "explosion" OR "airstrike" OR "missile" OR "drone" OR "bombing" OR "shooting" OR "killed" OR "casualties"';
const CRIME_KEYWORDS    = '"drug trafficking" OR "narcotics" OR "cartel" OR "cocaine" OR "heroin" OR "murder" OR "kidnapping" OR "gang" OR "organized crime" OR "drug bust" OR "drug seizure"';
const STABLE_KEYWORDS   = '"attack" OR "explosion" OR "shooting" OR "protest" OR "terrorism" OR "drug" OR "crime" OR "murder" OR "trafficking"';

async function ingestGDELT(code) {
  const fips = GDELT_CODES[code];
  if (!fips) return 0;
  let total = 0;

  const queries = STABLE.has(fips)
    ? [STABLE_KEYWORDS]
    : [CONFLICT_KEYWORDS, CRIME_KEYWORDS];

  for (const keywords of queries) {
    const url = `https://api.gdeltproject.org/api/v2/doc/doc`
      + `?query=${fips}+(${encodeURIComponent(keywords)})`
      + `&mode=artlist&maxrecords=10&format=json&timespan=1440&sourcelang=english`;
    try {
      const res  = await fetch(url, { timeout: 12000, headers: { 'User-Agent': 'AtlasAlly/1.0' } });
      if (!res.ok) continue;
      const text = await res.text();
      if (!text.startsWith('{') && !text.startsWith('[')) continue;
      const data = JSON.parse(text);
      for (const art of (data.articles || [])) {
        const title = String(art.title || '').trim();
        if (!title || title.length < 10 || !isEnglish(title)) continue;
        if (!isRelevant(title)) continue;
        // GDELT query uses FIPS code as a free-text keyword, not a country filter,
        // so results routinely include unrelated articles (e.g. US local news tagged
        // JO because "jo" appears somewhere in the text). Drop anything that doesn't
        // actually mention the country.
        if (!isRelevantToCountry(title, code)) continue;
        const { type, severity } = classify(title);
        const geo = extractLocation(title, code);
        const ok  = insertEvent({
          country_code: code, type, severity, title,
          description: art.seendate ? `Reported: ${art.seendate}` : '',
          location: geo?.location || null, lat: geo?.lat || null, lng: geo?.lng || null,
          source: art.domain || 'GDELT', source_url: art.url || 'https://api.gdeltproject.org',
        });
        if (ok) total++;
      }
    } catch(e) {
      console.warn(`  GDELT failed ${code}: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 600));
  }
  return total;
}

// ── Source 5: UCDP (Uppsala Conflict Data Program) ───────────────────────────
// Free academic conflict event data — GPS-tagged.
// As of Feb 2026 UCDP introduced x-ucdp-access-token auth (5,000 req/day limit).
// Request a token at https://ucdp.uu.se/apidocs/ and set UCDP_API_KEY in env.

const UCDP_API_KEY = process.env.UCDP_API_KEY || '';
if (!UCDP_API_KEY) {
  console.warn('⚠️  UCDP_API_KEY not set — UCDP ingestion will be skipped. Request a token at https://ucdp.uu.se/apidocs/');
}

const UCDP_COUNTRIES = {
  // UCDP uses Gleditsch-Ward state codes
  JO:116, UA:369, LB:660, SY:652, IQ:645, YE:678, SO:520, SD:625,
  LY:620, AF:700, PK:770, MM:775, PH:840, NG:475, CD:490, ET:530,
  KE:501, ML:432, MX:70,  CO:100, VE:101, BR:140, IN:750, TR:640,
};

async function ingestUCDP(code) {
  if (!UCDP_API_KEY) return 0;                      // skip silently if no token (warned once at boot)
  const gwCode = UCDP_COUNTRIES[code];
  if (!gwCode) return 0;

  // Fetch last 2 years of conflict events (UCDP GED v25.1 is annually released; coverage runs 12-18 months behind current date)
  // Version 25.1 is current as of April 2026 (was 23.1 pre-auth era)
  const since = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const url   = `https://ucdpapi.pcr.uu.se/api/gedevents/25.1`
    + `?pagesize=50&StartDate=${since}&country=${gwCode}`;

  try {
    const res  = await fetch(url, {
      timeout: 12000,
      headers: {
        'User-Agent': 'AtlasAlly/1.0',
        'Accept': 'application/json',
        'x-ucdp-access-token': UCDP_API_KEY,
      },
    });
    if (!res.ok) {
      // Log loudly — previously this silently returned 0 and hid the Feb 2026 auth change for ~2 months.
      let bodySnippet = '';
      try { bodySnippet = (await res.text()).slice(0, 200); } catch {}
      console.warn(`  UCDP non-OK ${code}: HTTP ${res.status} ${res.statusText} — ${bodySnippet}`);
      return 0;
    }
    const data = await res.json();
    const events = data.Result || [];
    let count = 0;

    for (const ev of events) {
      const desc    = String(ev.source_headline || ev.conflict_name || '').trim();
      const title   = desc.length > 10 ? desc.slice(0, 180) : `${ev.type_of_violence_label || 'Conflict'} in ${ev.country || code}`;
      if (!isEnglish(title)) continue;

      // Map UCDP violence type to our types
      // 1=state-based, 2=non-state, 3=one-sided violence
      const vtype   = parseInt(ev.type_of_violence) || 1;
      const type    = vtype === 1 ? 'explosion' : vtype === 2 ? 'shooting' : 'incident';
      const deaths  = parseInt(ev.best) || 0;
      const severity = deaths > 10 ? 'critical' : deaths > 0 ? 'high' : 'warn';

      const ok = insertEvent({
        country_code: code, type, severity,
        title,
        description:  `Deaths: ${deaths} · ${ev.dyad_name || ''} · ${ev.date_start || ''}`.trim(),
        location:     ev.where_description || ev.adm_2 || ev.adm_1 || null,
        lat:          parseFloat(ev.latitude)  || null,
        lng:          parseFloat(ev.longitude) || null,
        source:       'UCDP / Uppsala University',
        source_url:   `https://ucdp.uu.se/event/${ev.id}`,
      });
      if (ok) count++;
    }
    return count;
  } catch(e) {
    console.warn(`  UCDP failed ${code}: ${e.message}`);
    return 0;
  }
}

// ── Source 6: InSight Crime RSS (organized crime & drug trafficking) ──────────
// Best English-language source for cartel activity, drug seizures, gang violence.
// Primarily covers Latin America but also global drug trafficking routes.

const INSIGHT_CRIME_FEEDS = [
  { name: 'InSight Crime', url: 'https://insightcrime.org/feed/',              code: null }, // global — filter by country
  { name: 'InSight Crime Mexico',    url: 'https://insightcrime.org/tag/mexico/feed/',    code: 'MX' },
  { name: 'InSight Crime Colombia',  url: 'https://insightcrime.org/tag/colombia/feed/',  code: 'CO' },
  { name: 'InSight Crime Venezuela', url: 'https://insightcrime.org/tag/venezuela/feed/', code: 'VE' },
  { name: 'InSight Crime Honduras',  url: 'https://insightcrime.org/tag/honduras/feed/',  code: 'HN' },
  { name: 'InSight Crime Guatemala', url: 'https://insightcrime.org/tag/guatemala/feed/', code: 'GT' },
  { name: 'InSight Crime Haiti',     url: 'https://insightcrime.org/tag/haiti/feed/',     code: 'HT' },
  { name: 'InSight Crime Brazil',    url: 'https://insightcrime.org/tag/brazil/feed/',    code: 'BR' },
];

// Country name keywords for filtering the global feed
const COUNTRY_KEYWORDS = {
  JO:['jordan','amman'],          UA:['ukraine','kyiv'],
  LB:['lebanon','beirut'],        SY:['syria','damascus'],
  IQ:['iraq','baghdad'],          EG:['egypt','cairo'],
  MX:['mexico','cartel','sinaloa','jalisco'],
  CO:['colombia','bogota','farc','eln'],
  VE:['venezuela','caracas'],     BR:['brazil','rio','sao paulo'],
  NG:['nigeria','lagos','abuja'], KE:['kenya','nairobi'],
  ZA:['south africa','johannesburg'], PH:['philippines','manila'],
  TR:['turkey','istanbul'],       IN:['india','mumbai','delhi'],
  AF:['afghanistan','kabul'],     PK:['pakistan','karachi','lahore'],
};

async function ingestInsightCrime() {
  let count = 0;
  for (const feed of INSIGHT_CRIME_FEEDS) {
    const items = await fetchRSS(feed.url);
    for (const raw of items.slice(0, 15)) {
      const { title, desc, url } = parseItem(raw);
      if (!title || title.length < 10 || !isEnglish(title)) continue;
      if (!isRelevant(`${title} ${desc}`)) continue;

      // Determine country from feed tag or text matching
      let targetCode = feed.code;
      if (!targetCode) {
        const lower = `${title} ${desc}`.toLowerCase();
        targetCode = Object.entries(COUNTRY_KEYWORDS).find(([, words]) =>
          words.some(w => lower.includes(w))
        )?.[0] || null;
      }
      if (!targetCode) continue;

      const { type, severity } = classify(`${title} ${desc}`);
      const geo = extractLocation(`${title} ${desc}`, targetCode);
      const ok  = insertEvent({
        country_code: targetCode,
        type: type === 'incident' ? 'drug' : type,
        severity, title, description: desc,
        location: geo?.location || null, lat: geo?.lat || null, lng: geo?.lng || null,
        source: feed.name, source_url: url || feed.url,
      });
      if (ok) count++;
    }
    await new Promise(r => setTimeout(r, 400));
  }
  return count;
}

// ── Source 7: UNODC RSS (UN drug & crime reports) ────────────────────────────
// Global drug seizures, trafficking routes, crime statistics from the UN.

const UNODC_FEEDS = [
  { name: 'UNODC News',   url: 'https://www.unodc.org/rss/news_english.xml' },
  { name: 'UNODC Press',  url: 'https://www.unodc.org/rss/press_english.xml' },
];

async function ingestUNODC() {
  let count = 0;
  for (const feed of UNODC_FEEDS) {
    const items = await fetchRSS(feed.url);
    for (const raw of items.slice(0, 20)) {
      const { title, desc, url } = parseItem(raw);
      if (!title || title.length < 10 || !isEnglish(title)) continue;
      if (!isRelevant(`${title} ${desc}`)) continue;

      const lower   = `${title} ${desc}`.toLowerCase();
      const code    = Object.entries(COUNTRY_KEYWORDS).find(([, words]) =>
        words.some(w => lower.includes(w))
      )?.[0] || null;
      if (!code) continue;

      const { type, severity } = classify(`${title} ${desc}`);
      const geo = extractLocation(`${title} ${desc}`, code);
      const ok  = insertEvent({
        country_code: code,
        type: type === 'incident' ? 'drug' : type,
        severity, title, description: desc,
        location: geo?.location || null, lat: geo?.lat || null, lng: geo?.lng || null,
        source: feed.name, source_url: url || feed.url,
      });
      if (ok) count++;
    }
    await new Promise(r => setTimeout(r, 400));
  }
  return count;
}

// ── Startup purge of non-English events ──────────────────────────────────────
function purgeNonEnglish() {
  try {
    ['ا','ي','ة','و','ن','م','ل','ه','ر','ب','ت','ع','د','س','ك','ف','ق','ح','ج','ص','ط','خ','ذ','ض','ظ','غ','ز','ش','ث','ئ','ء'].forEach(ch => {
      try { db.db.prepare(`DELETE FROM events WHERE submitted_by='auto-ingest' AND title LIKE '%${ch}%'`).run(); } catch {}
    });
  } catch {}
}

// ── Main runner ───────────────────────────────────────────────────────────────
async function ingestSecurityEvents() {
  console.log('⚡ Ingesting security events...');
  purgeNonEnglish();
  let total = 0;

  // 1. US Embassy — highest signal, real shelter-in-place/missile alerts
  const e1 = await ingestEmbassyAlerts();
  if (e1) console.log(`  🏛  Embassy: +${e1}`);
  total += e1;

  // 2. UK FCDO travel alerts
  const e2 = await ingestFCDO();
  if (e2) console.log(`  🇬🇧 FCDO: +${e2}`);
  total += e2;

  // 3. UCDP — free academic conflict data, GPS-tagged, no approval needed
  for (const code of Object.keys(UCDP_COUNTRIES)) {
    const n = await ingestUCDP(code);
    total += n;
    if (n) console.log(`  🎓 UCDP ${code}: +${n}`);
    await new Promise(r => setTimeout(r, 400));
  }

  // 5. InSight Crime — drug/organized crime
  const e5 = await ingestInsightCrime();
  if (e5) console.log(`  💊 InSight Crime: +${e5}`);
  total += e5;

  // 6. UNODC — UN drug & crime
  const e6 = await ingestUNODC();
  if (e6) console.log(`  🌐 UNODC: +${e6}`);
  total += e6;

  // 7. ReliefWeb — humanitarian crises
  for (const code of Object.keys(RELIEFWEB_COUNTRIES)) {
    const n = await ingestReliefWeb(code);
    total += n;
    if (n) console.log(`  🌐 ReliefWeb ${code}: +${n}`);
    await new Promise(r => setTimeout(r, 300));
  }

  // 8. GDELT — both conflict and drug/crime queries
  for (const code of Object.keys(GDELT_CODES)) {
    const n = await ingestGDELT(code);
    total += n;
    if (n) console.log(`  📡 GDELT ${code}: +${n}`);
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`⚡ Ingestion complete — ${total} new events added`);
  return total;
}

module.exports = { ingestSecurityEvents };

// Atlas Ally — Data routes
// Rule: specific routes ALWAYS before parameterized (/crime/:code)
const router = require('express').Router();
const fetch  = require('node-fetch');
const db     = require('../db');

// ── UNODC Baseline per 100k population ───────────────────────────────────────
const UNODC = {
  AF:{homicide:6.5, assault:72,  theft:95,   robbery:38,  year:2022},
  AE:{homicide:0.5, assault:10,  theft:62,   robbery:2,   year:2022},
  AR:{homicide:5.3, assault:142, theft:890,  robbery:88,  year:2022},
  BD:{homicide:2.6, assault:45,  theft:180,  robbery:28,  year:2022},
  BR:{homicide:22.3,assault:248, theft:1580, robbery:156, year:2022},
  CD:{homicide:13.5,assault:165, theft:280,  robbery:95,  year:2022},
  CN:{homicide:0.5, assault:28,  theft:180,  robbery:12,  year:2022},
  CO:{homicide:27.9,assault:198, theft:980,  robbery:112, year:2022},
  DE:{homicide:0.9, assault:132, theft:1420, robbery:42,  year:2022},
  DZ:{homicide:1.9, assault:38,  theft:210,  robbery:18,  year:2022},
  EG:{homicide:3.2, assault:42,  theft:210,  robbery:15,  year:2022},
  ET:{homicide:7.6, assault:95,  theft:185,  robbery:52,  year:2022},
  FR:{homicide:1.3, assault:142, theft:1650, robbery:78,  year:2022},
  GB:{homicide:1.1, assault:164, theft:1820, robbery:52,  year:2022},
  GH:{homicide:1.7, assault:55,  theft:245,  robbery:32,  year:2022},
  GT:{homicide:22.4,assault:165, theft:620,  robbery:98,  year:2022},
  HN:{homicide:38.9,assault:210, theft:720,  robbery:128, year:2022},
  HT:{homicide:35.2,assault:195, theft:580,  robbery:142, year:2022},
  ID:{homicide:0.4, assault:35,  theft:155,  robbery:18,  year:2022},
  IL:{homicide:1.4, assault:22,  theft:890,  robbery:18,  year:2022},
  IN:{homicide:2.8, assault:52,  theft:185,  robbery:18,  year:2022},
  IQ:{homicide:5.8, assault:68,  theft:120,  robbery:22,  year:2022},
  IR:{homicide:3.1, assault:58,  theft:165,  robbery:28,  year:2022},
  IT:{homicide:0.5, assault:58,  theft:1250, robbery:48,  year:2022},
  JO:{homicide:1.8, assault:28,  theft:145,  robbery:8,   year:2022},
  JP:{homicide:0.2, assault:18,  theft:285,  robbery:2,   year:2022},
  KE:{homicide:8.5, assault:98,  theft:380,  robbery:65,  year:2022},
  KR:{homicide:0.6, assault:48,  theft:620,  robbery:8,   year:2022},
  LB:{homicide:2.1, assault:35,  theft:180,  robbery:12,  year:2022},
  LY:{homicide:8.2, assault:95,  theft:280,  robbery:58,  year:2022},
  MA:{homicide:1.4, assault:32,  theft:195,  robbery:22,  year:2022},
  ML:{homicide:9.8, assault:112, theft:195,  robbery:68,  year:2022},
  MM:{homicide:7.8, assault:88,  theft:165,  robbery:45,  year:2022},
  MX:{homicide:29.9,assault:182, theft:1240, robbery:128, year:2022},
  NG:{homicide:10.3,assault:128, theft:420,  robbery:88,  year:2022},
  NP:{homicide:2.8, assault:48,  theft:185,  robbery:22,  year:2022},
  PH:{homicide:8.4, assault:115, theft:380,  robbery:62,  year:2022},
  PK:{homicide:7.8, assault:88,  theft:220,  robbery:45,  year:2022},
  PL:{homicide:0.7, assault:78,  theft:890,  robbery:28,  year:2022},
  RU:{homicide:8.2, assault:95,  theft:680,  robbery:42,  year:2022},
  SA:{homicide:1.5, assault:18,  theft:95,   robbery:6,   year:2022},
  SD:{homicide:12.8,assault:142, theft:210,  robbery:88,  year:2022},
  SO:{homicide:18.2,assault:195, theft:165,  robbery:112, year:2022},
  SY:{homicide:18.5,assault:185, theft:285,  robbery:125, year:2022},
  TH:{homicide:3.2, assault:48,  theft:290,  robbery:22,  year:2022},
  TN:{homicide:2.1, assault:42,  theft:225,  robbery:28,  year:2022},
  TR:{homicide:4.3, assault:55,  theft:320,  robbery:28,  year:2022},
  TZ:{homicide:4.8, assault:68,  theft:285,  robbery:38,  year:2022},
  UA:{homicide:6.2, assault:78,  theft:410,  robbery:35,  year:2022},
  US:{homicide:6.8, assault:246, theft:1958, robbery:82,  year:2022},
  VE:{homicide:49.9,assault:285, theft:1580, robbery:188, year:2022},
  YE:{homicide:21.8,assault:188, theft:195,  robbery:128, year:2022},
  ZA:{homicide:45.5,assault:580, theft:2200, robbery:320, year:2022},
};

const COUNTRY_NAMES = {
  AF:'Afghanistan', AE:'UAE',            AR:'Argentina',   BD:'Bangladesh',
  BR:'Brazil',      CD:'DR Congo',       CN:'China',       CO:'Colombia',
  DE:'Germany',     DZ:'Algeria',        EG:'Egypt',       ET:'Ethiopia',
  FR:'France',      GB:'United Kingdom', GH:'Ghana',       GT:'Guatemala',
  HN:'Honduras',    HT:'Haiti',          ID:'Indonesia',   IL:'Israel',
  IN:'India',       IQ:'Iraq',           IR:'Iran',        IT:'Italy',
  JO:'Jordan',      JP:'Japan',          KE:'Kenya',       KR:'South Korea',
  LB:'Lebanon',     LY:'Libya',          MA:'Morocco',     ML:'Mali',
  MM:'Myanmar',     MX:'Mexico',         NG:'Nigeria',     NP:'Nepal',
  PH:'Philippines', PK:'Pakistan',       PL:'Poland',      RU:'Russia',
  SA:'Saudi Arabia',SD:'Sudan',          SO:'Somalia',     SY:'Syria',
  TH:'Thailand',    TN:'Tunisia',        TR:'Turkey',      TZ:'Tanzania',
  UA:'Ukraine',     US:'United States',  VE:'Venezuela',   YE:'Yemen',
  ZA:'South Africa',
};

// ── World Bank — 3 confirmed indicators ──────────────────────────────────────
async function fetchWorldBank(code) {
  const indicators = [
    { id:'VC.IHR.PSRC.P5',    label:'Homicide Rate',        unit:'per 100k' },
    { id:'VC.IHR.PSRC.FE.P5', label:'Female Homicide Rate', unit:'per 100k' },
    { id:'VC.BTL.DETH',       label:'Battle Deaths',        unit:'annual'   },
  ];
  const results = await Promise.all(indicators.map(async ind => {
    try {
      const url  = `https://api.worldbank.org/v2/country/${code}/indicator/${ind.id}?format=json&mrv=3&per_page=3`;
      const r    = await fetch(url, { timeout:8000, headers:{'User-Agent':'AtlasAlly/1.0'} });
      if (!r.ok) return { ...ind, value:null, date:null };
      const data = await r.json();
      const rows = Array.isArray(data[1]) ? data[1] : [];
      const hit  = rows.find(row => row.value !== null && row.value !== undefined);
      return { ...ind, value: hit ? parseFloat(hit.value.toFixed(2)) : null, date: hit ? hit.date : null };
    } catch(e) {
      return { ...ind, value:null, date:null };
    }
  }));
  return results.some(r => r.value !== null) ? results : null;
}

// ── ACLED OAuth token cache ───────────────────────────────────────────────────
let acledTokenCache = { token: null, expires: 0 };

async function getAcledToken() {
  if (acledTokenCache.token && Date.now() < acledTokenCache.expires) {
    return acledTokenCache.token;
  }
  const email    = process.env.ACLED_EMAIL;
  const password = process.env.ACLED_PASSWORD;
  if (!email || !password) return null;

  try {
    const params = new URLSearchParams({
      username:   email,
      password:   password,
      grant_type: 'password',
      client_id:  'acled',
    });
    const r = await fetch('https://acleddata.com/oauth/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'AtlasAlly/1.0' },
      body:    params.toString(),
      timeout: 10000,
    });
    if (!r.ok) { console.warn('ACLED token request failed:', r.status); return null; }
    const data = await r.json();
    if (!data.access_token) { console.warn('ACLED no access_token in response'); return null; }
    // Token valid for 24h (86400s), cache for 23h to be safe
    acledTokenCache = { token: data.access_token, expires: Date.now() + 23 * 3600 * 1000 };
    console.log('ACLED token obtained successfully');
    return data.access_token;
  } catch(e) {
    console.warn('ACLED token error:', e.message);
    return null;
  }
}

// ── ACLED conflict data fetch ─────────────────────────────────────────────────
async function fetchAcled(countryName) {
  const token = await getAcledToken();
  if (!token) return null;

  try {
    // Fetch last 90 days of events
    const since = new Date(Date.now() - 90 * 24 * 3600 * 1000);
    const dateStr = since.toISOString().slice(0, 10).replace(/-/g, '');
    const url = `https://acleddata.com/api/acled/read?country=${encodeURIComponent(countryName)}&event_date=${dateStr}|${new Date().toISOString().slice(0,10).replace(/-/g,'')}&event_date_where=BETWEEN&limit=500&fields=event_date,event_type,sub_event_type,location,fatalities,notes&format=json`;

    const r = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'AtlasAlly/1.0' },
      timeout: 12000,
    });
    if (!r.ok) { console.warn('ACLED data fetch failed:', r.status); return null; }
    const data = await r.json();
    if (!data.data || !Array.isArray(data.data)) return null;

    const events = data.data;
    const totalFatalities = events.reduce((sum, e) => sum + (parseInt(e.fatalities) || 0), 0);

    // Count by event type
    const typeCounts = {};
    events.forEach(e => {
      const t = e.event_type || 'Other';
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    });
    const eventTypes = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count }));

    // 5 most recent events
    const recent = events
      .sort((a, b) => new Date(b.event_date) - new Date(a.event_date))
      .slice(0, 5)
      .map(e => ({
        date:          e.event_date,
        event_type:    e.event_type,
        sub_event_type:e.sub_event_type,
        location:      e.location,
        fatalities:    parseInt(e.fatalities) || 0,
        notes:         (e.notes || '').slice(0, 200),
      }));

    console.log(`ACLED ${countryName}: ${events.length} events, ${totalFatalities} fatalities`);
    return { total_events: events.length, total_fatalities: totalFatalities, event_types: eventTypes, recent_events: recent };
  } catch(e) {
    console.warn('ACLED fetch error:', e.message);
    return null;
  }
}

// ── Comprehensive crime keyword classifier ────────────────────────────────────
const CRIME_CATEGORIES = [
  {
    key: 'violence', label: 'Violence & Conflict', icon: '💥',
    words: [
      'attack','shoot','bomb','explos','kill','wound','airstrike','missile',
      'murder','terror','massacre','assassin','execution','sniper','gunman',
      'war','battle','clash','hostage','military operation','troops deploy',
      'armed group','militant','insurgent','fatality','casualties','dead body',
    ],
  },
  {
    key: 'drugs', label: 'Drug Crime', icon: '💊',
    words: [
      // Generic
      'drug','narcotic','traffick','smuggl','cocaine','heroin','cannabis',
      'marijuana','hashish','amphetamine','methamphetamine','crystal meth',
      'fentanyl','opioid','opium','ketamine','ecstasy','mdma',
      // Region-specific
      'captagon','tramadol','khat','qat','pills seizure','tablet seizure',
      // Operations
      'drug bust','drug ring','drug lord','drug cartel','drug kingpin',
      'contraband','drug shipment','narco','drug seizure','seized drugs',
      'drug trafficking route','drug haul','drug network','drug lab',
      'cartel','gang drug','drug war','anti-narcotics',
    ],
  },
  {
    key: 'theft', label: 'Theft & Robbery', icon: '🏪',
    words: [
      'theft','robbery','burgl','stolen','steal','pickpocket','carjack',
      'loot','fraud','scam','heist','shoplifting','armed robbery','break-in',
      'home invasion','car theft','cybercrime','identity theft','embezzl',
    ],
  },
  {
    key: 'unrest', label: 'Protests & Unrest', icon: '✊',
    words: [
      'protest','riot','demonstrat','unrest','clash','strike','rally',
      'uprising','march','coup','civil unrest','mob','crowd','tear gas',
      'crackdown','dispersed','detained protesters','political unrest',
    ],
  },
  {
    key: 'security', label: 'Security & Safety', icon: '🚨',
    words: [
      'arrest','detain','police','criminal','security','crime','sentence',
      'convict','custody','wanted','suspect','indictment','prosecution',
      'smuggler arrested','border security','checkpoint','investigation',
      'gang arrest','organized crime','trafficking bust','seized',
    ],
  },
];

// Country-specific drug keywords that boost drug classification
const COUNTRY_DRUG_KEYS = {
  JO: ['captagon','tramadol','hashish','jordan drug','amman drug'],
  SY: ['captagon','hashish','syria drug'],
  LB: ['captagon','hashish','lebanon drug'],
  MX: ['cartel','sinaloa','jalisco','fentanyl','cocaine','drug war','narco'],
  CO: ['cocaine','farc','drug','narco','cartel','trafficking'],
  AF: ['heroin','opium','poppy','taliban drug','afghan drug'],
  ET: ['khat','qat','ethiopia drug'],
  KE: ['khat','heroin','kenya drug'],
  SO: ['khat','somalia drug'],
  BR: ['cocaine','drug','favela','gang','trafficking'],
  PH: ['shabu','meth','drug war','duerte','philippines drug'],
  TH: ['methamphetamine','ya ba','thailand drug','golden triangle'],
  MM: ['heroin','methamphetamine','golden triangle','myanmar drug'],
  IN: ['ganja','opium','drug','india drug'],
  PK: ['heroin','opium','afghanistan border','pakistan drug'],
  NG: ['heroin','cocaine','nigeria drug','drug trafficking'],
};

function classifyArticle(title, countryCode) {
  const t = (title || '').toLowerCase();

  // Check country-specific drug keywords first (high-priority)
  const countryDrugs = COUNTRY_DRUG_KEYS[countryCode] || [];
  if (countryDrugs.some(w => t.includes(w))) return 'drugs';

  // Standard category matching (first match wins, drugs before violence)
  for (const cat of CRIME_CATEGORIES) {
    if (cat.words.some(w => t.includes(w))) return cat.key;
  }
  return null;
}

function monthIndex(dateStr, now) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d)) return -1;
    const diff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    return diff === 0 ? 2 : diff === 1 ? 1 : diff === 2 ? 0 : -1;
  } catch { return -1; }
}

// ── Live Google News fetch for crime tab (fresh, not just cached) ─────────────
async function fetchLiveCrimeNews(countryName, countryCode) {
  const xml2js = require('xml2js');
  const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: false });
  const gl     = countryCode.toUpperCase();

  // Country-specific drug terms to add to query
  const drugBoost = (COUNTRY_DRUG_KEYS[countryCode] || []).slice(0, 3).join(' OR ');
  const queries = [
    `"${countryName}" (crime OR murder OR robbery OR theft OR fraud)`,
    `"${countryName}" (drug OR narcotic OR trafficking OR smuggling OR seizure${drugBoost ? ' OR ' + drugBoost : ''})`,
    `"${countryName}" (arrest OR police OR convicted OR sentenced OR bust)`,
    `"${countryName}" (protest OR riot OR unrest OR demonstration OR clash)`,
  ];

  const results = [];
  for (const q of queries) {
    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en&gl=${gl}&ceid=${gl}:en`;
      const r   = await fetch(url, { timeout: 8000, headers: { 'User-Agent': 'AtlasAlly/1.0' } });
      if (!r.ok) continue;
      const xml  = await r.text();
      const data = await parser.parseStringPromise(xml);
      const items = data?.rss?.channel?.item || [];
      const arr   = Array.isArray(items) ? items : [items];
      for (const item of arr.slice(0, 12)) {
        const raw   = String(item.title?._ || item.title || '');
        const dash  = raw.lastIndexOf(' - ');
        const title = dash > 10 ? raw.slice(0, dash).trim() : raw.trim();
        let pub = new Date().toISOString();
        try { pub = new Date(item.pubDate || '').toISOString(); } catch {}
        const url2 = typeof item.link === 'string' ? item.link : item.guid?._ || item.guid || '';
        if (title.length > 10) results.push({ title, published_at: pub, url: String(url2) });
      }
    } catch {}
    await new Promise(r => setTimeout(r, 300));
  }
  return results;
}

// ── /crime/trend — MUST be before /crime/:code ────────────────────────────────
router.get('/crime/trend', async (req, res) => {
  const code = (req.query.country_code || '').toUpperCase().trim();
  if (!code) return res.status(400).json({ error: 'country_code required' });

  const countryName = COUNTRY_NAMES[code] || code;
  const unodc       = UNODC[code] || null;
  const now         = new Date();

  const monthLabels = [];
  for (let m = 2; m >= 0; m--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - m);
    monthLabels.push(d.toLocaleDateString('en-US', { month: 'long' }));
  }

  // ── Layer 1: Cached news articles ──────────────────────────────────────────
  let cachedArticles = [];
  try { cachedArticles = db.getNewsForCrime(code) || []; } catch(e) {}

  // ── Layer 2: Events table (typed incidents) ────────────────────────────────
  let events = [];
  try {
    events = db.db.prepare(`
      SELECT type, created_at, title FROM events
      WHERE country_code = ? AND status = 'approved' AND is_test = 0
        AND created_at > datetime('now', '-90 days')
      ORDER BY created_at DESC LIMIT 200
    `).all(code);
  } catch(e) {}

  // ── Layer 3: Live Google News fetch ───────────────────────────────────────
  let liveArticles = [];
  try { liveArticles = await fetchLiveCrimeNews(countryName, code); } catch(e) {}

  // Trigger background cache refresh
  if (cachedArticles.length < 10) {
    try { const { refreshNewsForCountry } = require('../news'); refreshNewsForCountry(code, 'en').catch(()=>{}); } catch(e) {}
  }

  // ── Classify all sources ───────────────────────────────────────────────────
  const counts = {};
  CRIME_CATEGORIES.forEach(c => { counts[c.key] = [0, 0, 0]; });
  let total = 0;

  // From news cache + live fetch
  [...cachedArticles, ...liveArticles].forEach(article => {
    const key = classifyArticle(article.title, code);
    if (!key) return;
    const mi = monthIndex(article.published_at, now);
    if (mi >= 0) { counts[key][mi]++; total++; }
  });

  // From events table — map event types to crime categories
  const EVENT_TO_CAT = {
    shooting:'violence', explosion:'violence', missile:'violence', drone:'violence',
    siren:'violence',    bomb:'violence',       attack:'violence',
    drug:'drugs',        crime:'security',
    protest:'unrest',    riot:'unrest',         demonstration:'unrest',
    theft:'theft',       robbery:'theft',
    incident:'security', arrest:'security',
  };
  events.forEach(ev => {
    const key = EVENT_TO_CAT[ev.type] || classifyArticle(ev.title || '', code);
    if (!key) return;
    const mi = monthIndex(ev.created_at, now);
    if (mi >= 0) { counts[key][mi]++; total++; }
  });

  const catResults = CRIME_CATEGORIES.map(cat => ({
    key:    cat.key,
    label:  cat.label,
    icon:   cat.icon,
    months: monthLabels.map((label, i) => ({ label, count: counts[cat.key][i] })),
    total:  counts[cat.key].reduce((a, b) => a + b, 0),
  }));

  const maxVal = Math.max(...catResults.flatMap(c => c.months.map(m => m.count)), 1);

  // Trend based on all crime this month vs 2 months ago
  const thisMonth = catResults.reduce((s, c) => s + c.months[2].count, 0);
  const lastMonth = catResults.reduce((s, c) => s + c.months[0].count, 0);
  const trend = thisMonth > lastMonth * 1.2 ? 'rising'
              : thisMonth < lastMonth * 0.8 ? 'falling'
              : 'stable';

  const [worldBank, acled] = await Promise.all([
    fetchWorldBank(code),
    fetchAcled(countryName),
  ]);

  const sources = ['Google News', 'Security Events'];
  if (worldBank) sources.push('World Bank');
  if (unodc)     sources.push('UNODC');
  if (acled)     sources.push('ACLED');

  console.log(`Crime trend ${code}: ${total} incidents (${cachedArticles.length} cached + ${liveArticles.length} live + ${events.length} events)`);

  return res.json({
    country_code:   code,
    country_name:   countryName,
    categories:     catResults,
    months:         monthLabels,
    grand_total:    total,
    max_val:        maxVal,
    trend,
    unodc_baseline: unodc,
    world_bank:     worldBank,
    acled,
    sources,
    generated_at:   new Date().toISOString(),
  });
});

// ── /crime/near — MUST be before /crime/:code ─────────────────────────────────
router.get('/crime/near', (req, res) => {
  const { lat, lng, radius = 100 } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });
  const latF  = parseFloat(lat);
  const lngF  = parseFloat(lng);
  const delta = parseFloat(radius) / 111;
  const bbox  = [latF, latF, lngF, lngF, latF-delta, latF+delta, lngF-delta, lngF+delta];
  const global_stats = db.db.prepare(`
    SELECT *, ((lat-?)*(lat-?) + (lng-?)*(lng-?)) as dist_sq
    FROM crime_stats WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?
    ORDER BY dist_sq ASC LIMIT 10
  `).all(...bbox);
  const community = db.db.prepare(`
    SELECT *, ((lat-?)*(lat-?) + (lng-?)*(lng-?)) as dist_sq
    FROM community_crime
    WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?
      AND created_at > datetime('now', '-3 months')
    ORDER BY dist_sq ASC LIMIT 20
  `).all(...bbox);
  res.json({ global_stats, community });
});

// ── /crime/:code — MUST be after specific routes ──────────────────────────────
router.get('/crime/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  res.json({ global_stats: db.getCrimeStatsByCountry.all(code), community: db.getCommunityCrime.all(code) });
});

router.get('/crime/:code/detailed', (req, res) => {
  const code     = req.params.code.toUpperCase();
  const allStats = db.db.prepare(`SELECT * FROM crime_stats WHERE country_code=? ORDER BY city, category`).all(code);
  const cities   = {};
  allStats.forEach(s => {
    if (!cities[s.city]) cities[s.city] = { city:s.city, lat:s.lat, lng:s.lng, overall:null, types:{} };
    if (s.category === 'overall') cities[s.city].overall = s;
    else cities[s.city].types[s.category] = s.crime_index;
  });
  res.json({ cities: Object.values(cities), community: db.getCommunityCrime.all(code) });
});

router.post('/crime/community', (req, res) => {
  const { country_code, lat, lng, type, description, severity } = req.body;
  if (!country_code || !lat || !lng || !type) return res.status(400).json({ error: 'Missing required fields' });
  db.addCommunityCrime.run({
    country_code: country_code.toUpperCase(), lat, lng, type,
    description: description || null, reported_by: req.user?.id || null, severity: severity || 'warn',
  });
  res.json({ ok: true });
});

// ── Route planning ────────────────────────────────────────────────────────────
router.get('/route/autocomplete', async (req, res) => {
  const { q, lang = 'en', lat, lng } = req.query;
  if (!q || q.length < 2) return res.json([]);
  try {
    let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1&accept-language=${lang}`;
    if (lat && lng) url += `&viewbox=${parseFloat(lng)-2},${parseFloat(lat)+2},${parseFloat(lng)+2},${parseFloat(lat)-2}&bounded=0`;
    const r = await fetch(url, { headers:{'User-Agent':'AtlasAlly/1.0'}, timeout:5000 });
    const d = await r.json();
    res.json(d.map(p => ({ name:p.display_name, lat:parseFloat(p.lat), lng:parseFloat(p.lon), type:p.type, category:p.class })));
  } catch { res.json([]); }
});

router.post('/route', async (req, res) => {
  const { from_lat, from_lng, to_lat, to_lng } = req.body;
  if (!from_lat || !from_lng || !to_lat || !to_lng) return res.status(400).json({ error: 'Coordinates required' });
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from_lng},${from_lat};${to_lng},${to_lat}?overview=full&geometries=geojson&steps=true`;
    const r   = await fetch(url, { timeout:8000 });
    const d   = await r.json();
    if (!d.routes?.[0]) return res.json({ error: 'No route found' });
    const route    = d.routes[0];
    const warnings = db.getEvents72h.all().filter(e => {
      if (!e.lat || !e.lng) return false;
      return (route.geometry?.coordinates || []).some(([lng, lat]) => Math.sqrt((lat-e.lat)**2+(lng-e.lng)**2) < 0.5);
    });
    res.json({ route, warnings, distance_km:Math.round(route.distance/1000), duration_min:Math.round(route.duration/60) });
  } catch { res.status(500).json({ error: 'Route service unavailable' }); }
});

// ── News ──────────────────────────────────────────────────────────────────────
router.get('/news', (req, res) => {
  const { country_code, lat, lng, lang = 'en' } = req.query;
  if (!country_code) return res.status(400).json({ error: 'country_code required' });
  const code = country_code.toUpperCase();

  // getNewsByCountry is now a function (lang-aware), not a prepared statement
  let items = db.getNewsByCountry(code, lang);

  // If nothing cached for this lang, trigger a background fetch then return empty
  if (!items.length) {
    const { refreshNewsForCountry } = require('../news');
    refreshNewsForCountry(code, lang).catch(() => {});
  }
  const userLat = parseFloat(lat), userLng = parseFloat(lng);
  if (!isNaN(userLat) && !isNaN(userLng)) {
    const { distanceKm, COUNTRY_CENTERS } = require('../geocoder');
    const center = COUNTRY_CENTERS[code] || { lat:userLat, lng:userLng };
    items = items.map(a => ({ ...a,
      distance_km:       Math.round(distanceKm(userLat,userLng,a.lat||center.lat,a.lng||center.lng)),
      has_real_location: !!(a.lat&&a.lng),
    }));
    const nearby = items.filter(a => a.distance_km <= 150);
    items = nearby.length ? nearby : items;
    items.sort((a,b) => {
      if (a.has_real_location&&!b.has_real_location) return -1;
      if (!a.has_real_location&&b.has_real_location) return 1;
      return a.distance_km - b.distance_km;
    });
  }
  res.json(items);
});

// ── Events ────────────────────────────────────────────────────────────────────
// ── Security keyword queries per language for Google News alerts ──────────────
const SECURITY_QUERIES = {
  en: 'security OR attack OR explosion OR missile OR shooting OR protest OR emergency OR incident OR crime OR warning',
  ar: 'أمن OR هجوم OR انفجار OR صاروخ OR إطلاق نار OR احتجاج OR طوارئ OR حادث OR تحذير',
  fr: 'sécurité OR attaque OR explosion OR missile OR fusillade OR manifestation OR urgence OR incident',
  es: 'seguridad OR ataque OR explosión OR misil OR disparos OR protesta OR emergencia OR incidente',
  pt: 'segurança OR ataque OR explosão OR míssil OR tiroteio OR protesto OR emergência OR incidente',
  ru: 'безопасность OR атака OR взрыв OR ракета OR стрельба OR протест OR чрезвычайная OR инцидент',
  zh: '安全 OR 袭击 OR 爆炸 OR 导弹 OR 枪击 OR 抗议 OR 紧急 OR 事件',
  de: 'Sicherheit OR Angriff OR Explosion OR Rakete OR Schießerei OR Protest OR Notfall OR Vorfall',
  ja: '安全 OR 攻撃 OR 爆発 OR ミサイル OR 銃撃 OR 抗議 OR 緊急 OR 事件',
  ko: '보안 OR 공격 OR 폭발 OR 미사일 OR 총격 OR 시위 OR 비상 OR 사건',
  tr: 'güvenlik OR saldırı OR patlama OR füze OR silahlı OR protesto OR acil OR olay',
  hi: 'सुरक्षा OR हमला OR विस्फोट OR मिसाइल OR गोलीबारी OR विरोध OR आपातकाल OR घटना',
};

// English security terms for relevance checking regardless of UI language
const SECURITY_TERMS_EN = [
  'attack','explosion','missile','rocket','drone','bomb','blast','shooting',
  'gunfire','siren','airstrike','military','armed','artillery','evacuation',
  'emergency','conflict','killed','injured','protest','riot','arrest','police',
  'security','crime','earthquake','flood','fire','crash','accident','warning',
  'alert','incident','troops','soldiers','terror','threat','hostage','border',
];

function isSecurityArticle(title) {
  const lower = (title || '').toLowerCase();
  return SECURITY_TERMS_EN.some(k => lower.includes(k));
}

// Fetch security-relevant Google News in the user's language
async function fetchSecurityNewsInLang(countryName, countryCode, lang) {
  // Build query: country name + security terms in user's language
  const query = `"${countryName}" (${SECURITY_QUERIES[lang] || SECURITY_QUERIES.en})`;
  const gl    = countryCode.toUpperCase();
  const url   = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${lang}&gl=${gl}&ceid=${gl}:${lang}`;
  try {
    const xml2js = require('xml2js');
    const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: false });
    const r      = await fetch(url, { timeout: 8000, headers: { 'User-Agent': 'AtlasAlly/1.0' } });
    if (!r.ok) return [];
    const xml    = await r.text();
    const data   = await parser.parseStringPromise(xml);
    const items  = data?.rss?.channel?.item || [];
    const arr    = Array.isArray(items) ? items : [items];

    return arr.slice(0, 20).map(item => {
      const rawTitle = String(item.title?._ || item.title || '');
      const dashIdx  = rawTitle.lastIndexOf(' - ');
      const title    = dashIdx > 10 ? rawTitle.slice(0, dashIdx).trim() : rawTitle.trim();
      const source   = dashIdx > 10 ? rawTitle.slice(dashIdx + 3).trim() : 'Google News';
      const link     = typeof item.link === 'string' ? item.link : item.guid?._ || item.guid || '';
      let published  = new Date().toISOString();
      try { published = new Date(item.pubDate || '').toISOString(); } catch {}
      return { title: title.replace(/<[^>]*>/g, '').trim().slice(0, 200), source, link: String(link).trim(), published };
    })
    .filter(e => {
      if (e.title.length < 10) return false;
      // For English, verify it's actually security-related (other langs trust Google's query matching)
      if (lang === 'en' && !isSecurityArticle(e.title)) return false;
      return true;
    })
    .map(e => ({
      id:           `gnews-${Buffer.from(e.link).toString('base64').slice(0, 20)}`,
      country_code:  countryCode,
      type:         'incident',
      severity:     'warn',
      title:         e.title,
      description:  '',
      location:      countryName,
      lat: null, lng: null,
      source:        e.source,
      source_url:    e.link,
      created_at:    e.published,
      status:       'approved',
      is_gnews:     true,
    }));
  } catch { return []; }
}

router.get('/events', async (req, res) => {
  const { country_code, lat, lng, lang = 'en' } = req.query;
  if (!country_code) return res.status(400).json({ error: 'country_code required' });
  const code = country_code.toUpperCase();

  // Official events from DB (embassy alerts, FCDO, ACLED — always authoritative)
  let events = db.getEventsByCountry.all(code);
  if (!events.length) {
    try { const { ingestSecurityEvents } = require('../services/events-ingest'); ingestSecurityEvents().catch(()=>{}); } catch(e) {}
  }

  // Augment with Google News security feed in the user's selected language
  const countryName = COUNTRY_NAMES[code] || code;
  const gnews = await fetchSecurityNewsInLang(countryName, code, lang);

  // Merge: official events first, then lang-matched Google News, deduped by source_url
  const seen = new Set(events.map(e => e.source_url).filter(Boolean));
  const merged = [
    ...events,
    ...gnews.filter(e => !seen.has(e.source_url)),
  ];

  // Sort newest first
  merged.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  const userLat = parseFloat(lat), userLng = parseFloat(lng);
  if (!isNaN(userLat) && !isNaN(userLng)) {
    const { distanceKm, COUNTRY_CENTERS } = require('../geocoder');
    const center = COUNTRY_CENTERS[code] || { lat: userLat, lng: userLng };
    return res.json(merged.map(ev => ({
      ...ev,
      distance_km: Math.round(distanceKm(userLat, userLng, ev.lat || center.lat, ev.lng || center.lng)),
    })).sort((a, b) => a.distance_km - b.distance_km));
  }

  res.json(merged);
});

module.exports = router;

// Atlas Ally — Crime routes
// Endpoints: /crime/trend, /crime/near, /crime/:code, /crime/:code/detailed, /crime/community
//
// Data sources:
//   - UNODC baseline stats (static table, below)
//   - World Bank indicators (homicide rate, female homicide, battle deaths)
//   - UCDP conflict events (GPS-tagged, free academic data)
//   - News articles classified into crime categories
//   - Stored security events
//   - User-submitted community_crime reports

const router = require('express').Router();
const { fetchWithTimeout } = require('../lib/http');
const db     = require('../db');
const { fetchRSS } = require('../lib/rss');
const { getCountryName, getUcdpCode, getDrugKeywords } = require('../lib/countries-meta');
const { CRIME_CATEGORIES, classifyCrime, EVENT_TYPE_TO_CRIME_CAT } = require('../lib/classify');
const { refreshNewsForCountry } = require('../news');

// ── UNODC baseline per 100k population ───────────────────────────────────────
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

// ── World Bank indicators (3 confirmed) ──────────────────────────────────────
async function fetchWorldBank(code) {
  const indicators = [
    { id:'VC.IHR.PSRC.P5',    label:'Homicide Rate',        unit:'per 100k' },
    { id:'VC.IHR.PSRC.FE.P5', label:'Female Homicide Rate', unit:'per 100k' },
    { id:'VC.BTL.DETH',       label:'Battle Deaths',        unit:'annual'   },
  ];
  const results = await Promise.all(indicators.map(async ind => {
    try {
      const url = `https://api.worldbank.org/v2/country/${code}/indicator/${ind.id}?format=json&mrv=3&per_page=3`;
      const r = await fetchWithTimeout(url, { headers: { 'User-Agent': 'AtlasAlly/1.0' } }, 8000);
      if (!r.ok) return { ...ind, value: null, date: null };
      const data = await r.json();
      const rows = Array.isArray(data[1]) ? data[1] : [];
      const hit = rows.find(row => row.value !== null && row.value !== undefined);
      return { ...ind, value: hit ? parseFloat(hit.value.toFixed(2)) : null, date: hit ? hit.date : null };
    } catch {
      return { ...ind, value: null, date: null };
    }
  }));
  return results.some(r => r.value !== null) ? results : null;
}

// ── UCDP conflict data ───────────────────────────────────────────────────────
async function fetchUCDP(countryName, countryCode) {
  const gw = getUcdpCode(countryCode);
  if (!gw) return null;

  const since = new Date(Date.now() - 90 * 86400e3).toISOString().slice(0, 10);
  const url = `https://ucdpapi.pcr.uu.se/api/gedevents/23.1?pagesize=100&StartDate=${since}&country=${gw}`;

  try {
    const r = await fetchWithTimeout(url, { headers: { 'User-Agent': 'AtlasAlly/1.0', Accept: 'application/json' } }, 10000);
    if (!r.ok) return null;
    const data = await r.json();
    const events = data.Result || [];
    if (!events.length) return null;

    const typeLabel = v => v === 1 ? 'State-based conflict' : v === 2 ? 'Non-state conflict' : 'One-sided violence';
    const totalFatalities = events.reduce((s, e) => s + (parseInt(e.best) || 0), 0);

    const typeCounts = {};
    events.forEach(e => {
      const label = typeLabel(e.type_of_violence);
      typeCounts[label] = (typeCounts[label] || 0) + 1;
    });
    const eventTypes = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count }));

    const recent = events
      .sort((a, b) => new Date(b.date_start) - new Date(a.date_start))
      .slice(0, 5)
      .map(e => ({
        date:       e.date_start,
        event_type: typeLabel(e.type_of_violence),
        location:   e.where_description || e.adm_2 || e.adm_1 || countryName,
        fatalities: parseInt(e.best) || 0,
        notes:      (e.source_headline || '').slice(0, 200),
      }));

    return {
      total_events: events.length,
      total_fatalities: totalFatalities,
      event_types: eventTypes,
      recent_events: recent,
      source: 'UCDP / Uppsala University',
    };
  } catch {
    return null;
  }
}

// ── Live Google News fetch for crime tab ─────────────────────────────────────
async function fetchLiveCrimeNews(countryName, countryCode) {
  const gl = countryCode.toUpperCase();
  const drugBoost = getDrugKeywords(countryCode).slice(0, 3).join(' OR ');

  const queries = [
    `"${countryName}" (crime OR murder OR robbery OR theft OR fraud)`,
    `"${countryName}" (drug OR narcotic OR trafficking OR smuggling OR seizure${drugBoost ? ' OR ' + drugBoost : ''})`,
    `"${countryName}" (arrest OR police OR convicted OR sentenced OR bust)`,
    `"${countryName}" (protest OR riot OR unrest OR demonstration OR clash)`,
  ];

  const urls = queries.map(q => `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en&gl=${gl}&ceid=${gl}:en`);
  const batches = await Promise.all(urls.map(u => fetchRSS(u)));
  const results = [];

  for (const item of batches.flat().slice(0, 60)) {
    const raw = String(item.title || '');
    const dash = raw.lastIndexOf(' - ');
    const title = (dash > 10 ? raw.slice(0, dash) : raw).trim();
    if (title.length <= 10) continue;

    let pub = new Date().toISOString();
    try { pub = new Date(item.published || '').toISOString(); } catch {}

    results.push({ title, published_at: pub, url: item.link });
  }
  return results;
}

// ── /crime/trend ─ MUST be before /crime/:code ───────────────────────────────
router.get('/crime/trend', async (req, res) => {
  const code = (req.query.country_code || '').toUpperCase().trim();
  if (!code) return res.status(400).json({ error: 'country_code required' });

  const countryName = getCountryName(code);
  const unodc = UNODC[code] || null;
  const now = new Date();

  // Build the three month labels (2 months ago, last month, this month)
  const monthLabels = [];
  for (let m = 2; m >= 0; m--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - m);
    monthLabels.push(d.toLocaleDateString('en-US', { month: 'long' }));
  }

  // Classify a date into month index 0/1/2, or -1 if out of window
  const monthIndex = (dateStr) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d)) return -1;
      const diff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
      return diff === 0 ? 2 : diff === 1 ? 1 : diff === 2 ? 0 : -1;
    } catch { return -1; }
  };

  // Layer 1: cached news
  let cachedArticles = [];
  try { cachedArticles = db.getNewsForCrime(code) || []; } catch {}

  // Layer 2: stored security events
  let events = [];
  try {
    events = db.db.prepare(`
      SELECT type, created_at, title FROM events
      WHERE country_code = ? AND status = 'approved' AND is_test = 0
        AND created_at > datetime('now', '-90 days')
      ORDER BY created_at DESC LIMIT 200
    `).all(code);
  } catch {}

  // Layer 3: live Google News
  let liveArticles = [];
  try { liveArticles = await fetchLiveCrimeNews(countryName, code); } catch {}

  // Trigger background cache refresh if thin (fire-and-forget, non-blocking)
  if (cachedArticles.length < 10) {
    refreshNewsForCountry(code, 'en').catch(() => {});
  }

  // Count by category × month
  const counts = {};
  CRIME_CATEGORIES.forEach(c => { counts[c.key] = [0, 0, 0]; });
  let total = 0;

  [...cachedArticles, ...liveArticles].forEach(a => {
    const key = classifyCrime(a.title, code);
    if (!key) return;
    const mi = monthIndex(a.published_at);
    if (mi >= 0) { counts[key][mi]++; total++; }
  });

  events.forEach(ev => {
    const key = EVENT_TYPE_TO_CRIME_CAT[ev.type] || classifyCrime(ev.title || '', code);
    if (!key) return;
    const mi = monthIndex(ev.created_at);
    if (mi >= 0) { counts[key][mi]++; total++; }
  });

  const catResults = CRIME_CATEGORIES.map(cat => ({
    key: cat.key,
    label: cat.label,
    icon: cat.icon,
    months: monthLabels.map((label, i) => ({ label, count: counts[cat.key][i] })),
    total: counts[cat.key].reduce((a, b) => a + b, 0),
  }));

  const maxVal = Math.max(...catResults.flatMap(c => c.months.map(m => m.count)), 1);
  const thisMonth = catResults.reduce((s, c) => s + c.months[2].count, 0);
  const twoAgo = catResults.reduce((s, c) => s + c.months[0].count, 0);
  const trend = thisMonth > twoAgo * 1.2 ? 'rising'
              : thisMonth < twoAgo * 0.8 ? 'falling'
              : 'stable';

  const [worldBank, ucdp] = await Promise.all([fetchWorldBank(code), fetchUCDP(countryName, code)]);

  const sources = ['Google News', 'Security Events'];
  if (worldBank) sources.push('World Bank');
  if (unodc)     sources.push('UNODC');
  if (ucdp)      sources.push('UCDP');

  console.log(`Crime trend ${code}: ${total} incidents (${cachedArticles.length} cached + ${liveArticles.length} live + ${events.length} events)`);

  res.json({
    country_code:   code,
    country_name:   countryName,
    categories:     catResults,
    months:         monthLabels,
    grand_total:    total,
    max_val:        maxVal,
    trend,
    unodc_baseline: unodc,
    world_bank:     worldBank,
    ucdp,
    sources,
    generated_at:   new Date().toISOString(),
  });
});

// ── /crime/near ─ MUST be before /crime/:code ────────────────────────────────
router.get('/crime/near', (req, res) => {
  const { lat, lng, radius = 100 } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });
  const latF = parseFloat(lat);
  const lngF = parseFloat(lng);
  const delta = parseFloat(radius) / 111;
  const bbox = [latF, latF, lngF, lngF, latF - delta, latF + delta, lngF - delta, lngF + delta];

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

// ── /crime/:code — MUST be after specific routes ─────────────────────────────
router.get('/crime/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  res.json({
    global_stats: db.getCrimeStatsByCountry.all(code),
    community:    db.getCommunityCrime.all(code),
  });
});

router.get('/crime/:code/detailed', (req, res) => {
  const code = req.params.code.toUpperCase();
  const allStats = db.db.prepare(`SELECT * FROM crime_stats WHERE country_code=? ORDER BY city, category`).all(code);
  const cities = {};
  allStats.forEach(s => {
    if (!cities[s.city]) cities[s.city] = { city: s.city, lat: s.lat, lng: s.lng, overall: null, types: {} };
    if (s.category === 'overall') cities[s.city].overall = s;
    else cities[s.city].types[s.category] = s.crime_index;
  });
  res.json({ cities: Object.values(cities), community: db.getCommunityCrime.all(code) });
});

router.post('/crime/community', (req, res) => {
  const { country_code, lat, lng, type, description, severity } = req.body;
  if (!country_code || !lat || !lng || !type) return res.status(400).json({ error: 'Missing required fields' });
  db.addCommunityCrime.run({
    country_code: country_code.toUpperCase(),
    lat, lng, type,
    description: description || null,
    reported_by: req.user?.id || null,
    severity:    severity || 'warn',
  });
  res.json({ ok: true });
});

module.exports = router;

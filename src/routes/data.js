// Atlas Ally — Data routes (crime, routes, news, events)
// Route ordering rule: specific routes BEFORE parameterized (/crime/:code)
const router = require('express').Router();
const fetch  = require('node-fetch');
const db     = require('../db');

// ── UNODC Baseline (per 100k population, annual) ──────────────────────────────
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

// ── World Bank live fetch ──────────────────────────────────────────────────────
// Indicators confirmed working (tested April 2026):
//   VC.IHR.PSRC.P5     — intentional homicide rate per 100k
//   VC.IHR.PSRC.FE.P5  — female homicide rate per 100k
//   VC.BTL.DETH         — battle-related deaths (conflict zones)
async function fetchWorldBank(countryCode) {
  const WB_INDICATORS = [
    { id: 'VC.IHR.PSRC.P5',    label: 'Homicide Rate',        unit: 'per 100k' },
    { id: 'VC.IHR.PSRC.FE.P5', label: 'Female Homicide Rate', unit: 'per 100k' },
    { id: 'VC.BTL.DETH',        label: 'Battle Deaths',        unit: 'annual'   },
  ];

  const results = await Promise.all(WB_INDICATORS.map(async ind => {
    const url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/${ind.id}?format=json&mrv=3&per_page=3`;
    try {
      const r    = await fetch(url, { timeout: 8000, headers: { 'User-Agent': 'AtlasAlly/1.0' } });
      if (!r.ok) return { ...ind, value: null, date: null };
      const data = await r.json();
      // mrv=3 gives last 3 years — find most recent non-null
      const rows  = Array.isArray(data[1]) ? data[1] : [];
      const valid = rows.find(r => r.value !== null && r.value !== undefined);
      return {
        ...ind,
        value: valid ? parseFloat(valid.value.toFixed(2)) : null,
        date:  valid ? valid.date : null,
      };
    } catch (e) {
      return { ...ind, value: null, date: null };
    }
  }));

  // Only return if at least one indicator has data
  const hasData = results.some(r => r.value !== null);
  return hasData ? results : null;
}

// ── Crime: GDELT + World Bank trend (MUST be before /crime/:code) ─────────────
router.get('/crime/trend', async (req, res) => {
  const code = (req.query.country_code || '').toUpperCase().trim();
  if (!code) return res.status(400).json({ error: 'country_code required' });

  const countryName = COUNTRY_NAMES[code] || code;
  const unodc       = UNODC[code] || null;

  // Build 3 monthly date ranges
  const now    = new Date();
  const months = [];
  for (let m = 2; m >= 0; m--) {
    const end   = new Date(now);
    end.setMonth(end.getMonth() - m);
    const start = new Date(end);
    start.setMonth(start.getMonth() - 1);
    const fmt = d => d.toISOString().slice(0,10).replace(/-/g,'') + '000000';
    months.push({
      label: end.toLocaleDateString('en-US', { month: 'long' }),
      start: fmt(start),
      end:   fmt(end),
      count: 0,
    });
  }

  // GDELT query
  const q = encodeURIComponent(
    `"${countryName}" (crime OR violence OR attack OR shooting OR bombing OR robbery OR conflict OR security OR explosion)`
  );

  // Run GDELT (3 months) + World Bank in parallel
  const [gdeltCounts, worldBank] = await Promise.all([
    Promise.all(months.map(async mo => {
      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${q}` +
        `&mode=artlist&maxrecords=250&format=json` +
        `&startdatetime=${mo.start}&enddatetime=${mo.end}`;
      try {
        const r = await fetch(url, {
          timeout: 15000,
          headers: { 'User-Agent': 'AtlasAlly/1.0; +https://atlas-ally.com' },
        });
        if (!r.ok) return 0;
        const data = await r.json();
        return Array.isArray(data.articles) ? data.articles.length : 0;
      } catch (e) {
        console.warn(`GDELT failed ${code} ${mo.label}: ${e.message}`);
        return 0;
      }
    })),
    fetchWorldBank(code),
  ]);

  months.forEach((mo, i) => { mo.count = gdeltCounts[i]; });

  const total    = gdeltCounts.reduce((a, b) => a + b, 0);
  const maxMonth = Math.max(...gdeltCounts, 1);
  const trend    = gdeltCounts[2] > gdeltCounts[0] * 1.15 ? 'rising'
                 : gdeltCounts[2] < gdeltCounts[0] * 0.85 ? 'falling'
                 : 'stable';

  const sources = ['GDELT Project'];
  if (worldBank) sources.push('World Bank');
  if (unodc)     sources.push('UNODC');

  return res.json({
    country_code:    code,
    country_name:    countryName,
    months,
    total_incidents: total,
    max_monthly:     maxMonth,
    trend,
    unodc_baseline:  unodc,
    world_bank:      worldBank,
    sources,
    generated_at:    new Date().toISOString(),
  });
});

// ── Crime: Near location (MUST be before /crime/:code) ────────────────────────
router.get('/crime/near', (req, res) => {
  const { lat, lng, radius = 100 } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

  const latF  = parseFloat(lat);
  const lngF  = parseFloat(lng);
  const delta = parseFloat(radius) / 111;
  const bbox  = [latF, latF, lngF, lngF, latF - delta, latF + delta, lngF - delta, lngF + delta];

  const global_stats = db.db.prepare(`
    SELECT *, ((lat-?)*(lat-?) + (lng-?)*(lng-?)) as dist_sq
    FROM crime_stats
    WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?
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

// ── Crime: By country (parameterized — MUST be after specific routes) ──────────
router.get('/crime/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  res.json({
    global_stats: db.getCrimeStatsByCountry.all(code),
    community:    db.getCommunityCrime.all(code),
  });
});

router.get('/crime/:code/detailed', (req, res) => {
  const code     = req.params.code.toUpperCase();
  const allStats = db.db.prepare(
    `SELECT * FROM crime_stats WHERE country_code=? ORDER BY city, category`
  ).all(code);
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
  if (!country_code || !lat || !lng || !type)
    return res.status(400).json({ error: 'Missing required fields' });
  db.addCommunityCrime.run({
    country_code: country_code.toUpperCase(), lat, lng, type,
    description: description || null,
    reported_by: req.user?.id || null,
    severity:    severity || 'warn',
  });
  res.json({ ok: true });
});

// ── Route planning ─────────────────────────────────────────────────────────────
router.get('/route/autocomplete', async (req, res) => {
  const { q, lang = 'en', lat, lng } = req.query;
  if (!q || q.length < 2) return res.json([]);
  try {
    let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1&accept-language=${lang}`;
    if (lat && lng)
      url += `&viewbox=${parseFloat(lng)-2},${parseFloat(lat)+2},${parseFloat(lng)+2},${parseFloat(lat)-2}&bounded=0`;
    const r    = await fetch(url, { headers: { 'User-Agent': 'AtlasAlly/1.0' }, timeout: 5000 });
    const data = await r.json();
    res.json(data.map(p => ({
      name: p.display_name, lat: parseFloat(p.lat), lng: parseFloat(p.lon),
      type: p.type, category: p.class,
    })));
  } catch { res.json([]); }
});

router.post('/route', async (req, res) => {
  const { from_lat, from_lng, to_lat, to_lng } = req.body;
  if (!from_lat || !from_lng || !to_lat || !to_lng)
    return res.status(400).json({ error: 'Coordinates required' });
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from_lng},${from_lat};${to_lng},${to_lat}?overview=full&geometries=geojson&steps=true`;
    const r   = await fetch(url, { timeout: 8000 });
    const d   = await r.json();
    if (!d.routes?.[0]) return res.json({ error: 'No route found' });
    const route    = d.routes[0];
    const events   = db.getEvents72h.all();
    const warnings = events.filter(e => {
      if (!e.lat || !e.lng) return false;
      return (route.geometry?.coordinates || []).some(([lng, lat]) =>
        Math.sqrt((lat - e.lat) ** 2 + (lng - e.lng) ** 2) < 0.5
      );
    });
    res.json({
      route, warnings,
      distance_km:  Math.round(route.distance / 1000),
      duration_min: Math.round(route.duration / 60),
    });
  } catch { res.status(500).json({ error: 'Route service unavailable' }); }
});

// ── News ───────────────────────────────────────────────────────────────────────
router.get('/news', (req, res) => {
  const { country_code, lat, lng } = req.query;
  if (!country_code) return res.status(400).json({ error: 'country_code required' });
  const code = country_code.toUpperCase();
  let items  = db.getNewsByCountry.all(code);

  if (!items.length) {
    const { refreshNewsForCountry } = require('../news');
    refreshNewsForCountry(code).catch(() => {});
  }

  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);
  if (!isNaN(userLat) && !isNaN(userLng)) {
    const { distanceKm, COUNTRY_CENTERS } = require('../geocoder');
    const center = COUNTRY_CENTERS[code] || { lat: userLat, lng: userLng };
    items = items.map(a => ({
      ...a,
      distance_km:       Math.round(distanceKm(userLat, userLng, a.lat || center.lat, a.lng || center.lng)),
      has_real_location: !!(a.lat && a.lng),
    }));
    const nearby = items.filter(a => a.distance_km <= 150);
    items = nearby.length ? nearby : items;
    items.sort((a, b) => {
      if (a.has_real_location && !b.has_real_location) return -1;
      if (!a.has_real_location && b.has_real_location) return 1;
      return a.distance_km - b.distance_km;
    });
  }
  res.json(items);
});

// ── Events ─────────────────────────────────────────────────────────────────────
router.get('/events', (req, res) => {
  const { country_code, lat, lng } = req.query;
  if (!country_code) return res.status(400).json({ error: 'country_code required' });
  const code   = country_code.toUpperCase();
  const events = db.getEventsByCountry.all(code);

  if (!events.length) {
    try {
      const { ingestSecurityEvents } = require('../services/events-ingest');
      ingestSecurityEvents().catch(() => {});
    } catch(e) {}
  }

  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);
  if (!isNaN(userLat) && !isNaN(userLng)) {
    const { distanceKm, COUNTRY_CENTERS } = require('../geocoder');
    const center   = COUNTRY_CENTERS[code] || { lat: userLat, lng: userLng };
    const enriched = events.map(ev => ({
      ...ev,
      distance_km: Math.round(distanceKm(userLat, userLng, ev.lat || center.lat, ev.lng || center.lng)),
    }));
    enriched.sort((a, b) => a.distance_km - b.distance_km);
    return res.json(enriched);
  }
  res.json(events);
});

module.exports = router;

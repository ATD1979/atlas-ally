// Atlas Ally — Crime, route & news routes
const router = require('express').Router();
const fetch  = require('node-fetch');
const db     = require('../db');

// ── Crime stats ───────────────────────────────────────────────────────────────

router.get('/crime/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  res.json({
    global_stats: db.getCrimeStatsByCountry.all(code),
    community:    db.getCommunityCrime.all(code),
  });
});

router.get('/crime/:code/detailed', (req, res) => {
  const code     = req.params.code.toUpperCase();
  const allStats = db.db.prepare(`SELECT * FROM crime_stats WHERE country_code=? ORDER BY city, category`).all(code);

  const cities = {};
  allStats.forEach(s => {
    if (!cities[s.city]) cities[s.city] = { city: s.city, lat: s.lat, lng: s.lng, overall: null, types: {} };
    if (s.category === 'overall') cities[s.city].overall = s;
    else cities[s.city].types[s.category] = s.crime_index;
  });

  res.json({ cities: Object.values(cities), community: db.getCommunityCrime.all(code) });
});

// Crime stats near a location (for geofence)
router.get('/crime/near', (req, res) => {
  const { lat, lng, radius = 100 } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

  const latF  = parseFloat(lat);
  const lngF  = parseFloat(lng);
  const delta = parseFloat(radius) / 111; // 1° ≈ 111 km

  const bbox = [latF, latF, lngF, lngF, latF - delta, latF + delta, lngF - delta, lngF + delta];

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
      AND created_at > datetime('now', '-6 months')
    ORDER BY dist_sq ASC LIMIT 20
  `).all(...bbox);

  res.json({ global_stats, community });
});

router.post('/crime/community', (req, res) => {
  const { country_code, lat, lng, type, description, severity } = req.body;
  if (!country_code || !lat || !lng || !type)
    return res.status(400).json({ error: 'Missing required fields' });
  db.addCommunityCrime.run({
    country_code: country_code.toUpperCase(), lat, lng, type,
    description: description || null, reported_by: req.user?.id || null,
    severity: severity || 'warn',
  });
  res.json({ ok: true });
});

// ── Route planning ────────────────────────────────────────────────────────────

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
  } catch {
    res.json([]);
  }
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
  } catch {
    res.status(500).json({ error: 'Route service unavailable' });
  }
});

// ── News ──────────────────────────────────────────────────────────────────────

router.get('/news', (req, res) => {
  const { country_code, lat, lng } = req.query;
  if (!country_code) return res.status(400).json({ error: 'country_code required' });
  const code = country_code.toUpperCase();
  let items = db.getNewsByCountry.all(code);

  // If nothing cached yet, kick off a background refresh for this country
  if (!items.length) {
    const { refreshNewsForCountry } = require('../news');
    refreshNewsForCountry(code).catch(() => {});
  }

  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);
  if (!isNaN(userLat) && !isNaN(userLng)) {
    const { distanceKm, COUNTRY_CENTERS } = require('../geocoder');
    const center = COUNTRY_CENTERS[code] || { lat: userLat, lng: userLng };
    const RADIUS_KM = 150;

    // Attach distance; fall back to country center for articles with no city coords
    items = items.map(article => {
      const aLat = article.lat || center.lat;
      const aLng = article.lng || center.lng;
      const distance_km = Math.round(distanceKm(userLat, userLng, aLat, aLng));
      return { ...article, distance_km };
    });

    // Keep only articles within 150 km; if that leaves nothing, show all (country fallback)
    const nearby = items.filter(a => a.distance_km <= RADIUS_KM);
    items = nearby.length ? nearby : items;

    // Sort nearest-first
    items.sort((a, b) => a.distance_km - b.distance_km);
  }

  res.json(items);
});

// ── Events ────────────────────────────────────────────────────────────────────

router.get('/events', (req, res) => {
  const { country_code, lat, lng } = req.query;
  if (!country_code) return res.status(400).json({ error: 'country_code required' });
  const code = country_code.toUpperCase();
  const events = db.getEventsByCountry.all(code);

  // If nothing in DB yet, trigger ingest in background
  if (!events.length) {
    try {
      const { ingestSecurityEvents } = require('../services/events-ingest');
      ingestSecurityEvents().catch(() => {});
    } catch(e) {}
  }

  // If user GPS provided, attach distance_km and sort nearest-first
  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);
  if (!isNaN(userLat) && !isNaN(userLng)) {
    const { distanceKm, COUNTRY_CENTERS } = require('../geocoder');
    const center = COUNTRY_CENTERS[code] || { lat: userLat, lng: userLng };
    const enriched = events.map(ev => {
      const evLat = ev.lat || center.lat;
      const evLng = ev.lng || center.lng;
      const distance_km = Math.round(distanceKm(userLat, userLng, evLat, evLng));
      return { ...ev, distance_km };
    });
    enriched.sort((a, b) => a.distance_km - b.distance_km);
    return res.json(enriched);
  }

  res.json(events);
});

module.exports = router;

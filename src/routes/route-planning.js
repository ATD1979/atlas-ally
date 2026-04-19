// Atlas Ally — Route planning
// Endpoints: GET /route/autocomplete, POST /route
//
// Thin wrappers around OpenStreetMap Nominatim (place autocomplete) and
// OSRM (driving directions). Adds event-based warnings along the route.

const router = require('express').Router();
const fetch  = require('node-fetch');
const db     = require('../db');

router.get('/route/autocomplete', async (req, res) => {
  const { q, lang = 'en', lat, lng } = req.query;
  if (!q || q.length < 2) return res.json([]);

  try {
    let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1&accept-language=${lang}`;
    if (lat && lng) {
      const latF = parseFloat(lat), lngF = parseFloat(lng);
      url += `&viewbox=${lngF - 2},${latF + 2},${lngF + 2},${latF - 2}&bounded=0`;
    }
    const r = await fetch(url, { headers: { 'User-Agent': 'AtlasAlly/1.0' }, timeout: 5000 });
    const data = await r.json();
    res.json(data.map(p => ({
      name: p.display_name,
      lat:  parseFloat(p.lat),
      lng:  parseFloat(p.lon),
      type: p.type,
      category: p.class,
    })));
  } catch {
    res.json([]);
  }
});

router.post('/route', async (req, res) => {
  const { from_lat, from_lng, to_lat, to_lng } = req.body;
  if (!from_lat || !from_lng || !to_lat || !to_lng) {
    return res.status(400).json({ error: 'Coordinates required' });
  }

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from_lng},${from_lat};${to_lng},${to_lat}?overview=full&geometries=geojson&steps=true`;
    const r = await fetch(url, { timeout: 8000 });
    const data = await r.json();
    if (!data.routes?.[0]) return res.json({ error: 'No route found' });

    const route = data.routes[0];
    const warnings = db.getEvents72h.all().filter(e => {
      if (!e.lat || !e.lng) return false;
      return (route.geometry?.coordinates || []).some(([lng, lat]) =>
        Math.sqrt((lat - e.lat) ** 2 + (lng - e.lng) ** 2) < 0.5
      );
    });

    res.json({
      route,
      warnings,
      distance_km:  Math.round(route.distance / 1000),
      duration_min: Math.round(route.duration / 60),
    });
  } catch {
    res.status(500).json({ error: 'Route service unavailable' });
  }
});

module.exports = router;

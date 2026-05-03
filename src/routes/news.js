// Atlas Ally — News routes
// Endpoint: GET /api/news
//
// Serves cached news_cache rows, filtered by country relevance (alias test) and
// optionally by GPS proximity. Triggers a non-blocking cache refresh when the
// cache is thin.

const router = require('express').Router();
const db = require('../db');
const {
  getCountryName,
  isRelevantToCountry,
  passesNoiseFilter,
} = require('../lib/countries-meta');
const { refreshNewsForCountry } = require('../news');

const RADIUS_KM = 300; // hard filter when user has GPS

router.get('/news', (req, res) => {
  const { country_code, lat, lng, lang = 'en' } = req.query;
  if (!country_code) return res.status(400).json({ error: 'country_code required' });

  const code = country_code.toUpperCase();
  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);
  const hasGPS = !isNaN(userLat) && !isNaN(userLng);

  let items;
  try {
    items = db.getNewsByCountry(code, lang);
  } catch (e) {
    console.error(`News lookup failed for ${code}:`, e.message);
    items = [];
  }

  // Serve-time relevance + noise filter. Two reasons to run noise filter here in
  // addition to cache-write time:
  //   (1) Stale cache rows inserted before passesNoiseFilter rules existed get
  //       filtered at query time without requiring a cache flush.
  //   (2) Defense-in-depth — alias/noise list updates take effect immediately for
  //       the user-facing feed instead of waiting on the next refresh tick.
  items = items.filter(a =>
    isRelevantToCountry(a.title, code) &&
    passesNoiseFilter(a.title, code)
  );

  // Fire-and-forget refresh if cache is thin
  if (items.length < 5) {
    refreshNewsForCountry(code, lang).catch(() => {});
  }

  if (hasGPS) {
    const { distanceKm, COUNTRY_CENTERS } = require('../geocoder');
    const center = COUNTRY_CENTERS[code] || { lat: userLat, lng: userLng };

    items = items.map(a => ({
      ...a,
      distance_km: a.lat && a.lng
        ? Math.round(distanceKm(userLat, userLng, a.lat, a.lng))
        : Math.round(distanceKm(userLat, userLng, center.lat, center.lng)),
      has_real_location: !!(a.lat && a.lng),
    }));

    // Hard radius filter; empty if nothing qualifies (don't leak irrelevant articles)
    items = items.filter(a => a.distance_km <= RADIUS_KM);

    items.sort((a, b) => {
      if (a.has_real_location && !b.has_real_location) return -1;
      if (!a.has_real_location && b.has_real_location) return 1;
      return a.distance_km - b.distance_km;
    });
  }

  res.json(items);
});

module.exports = router;

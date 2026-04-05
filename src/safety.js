const { COUNTRIES, ADVISORY_LEVELS } = require('./countries');
const db = require('./db');

// ─── Safety score calculation ─────────────────────────────────────────────────
//
// Score is 0–100 where 100 = completely safe, 0 = extreme danger
// Components:
//   Base score from advisory level (50% weight)
//   Recent incidents near location (30% weight)
//   Time of day factor (10% weight)
//   Border proximity factor (10% weight)

const ADVISORY_BASE_SCORES = { 1: 90, 2: 72, 3: 50, 4: 20 };

const SEVERITY_DEDUCTIONS = { danger: 15, warn: 7, info: 2, safe: 0 };

const TYPE_DEDUCTIONS = {
  siren: 20, missile: 25, strike: 22, chemical: 30,
  drone: 15, gunfire: 18, troop: 10, checkpoint: 5,
  weather: 8, health: 6, news: 2, clear: 0,
};

// Haversine distance in km
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Calculate score for a GPS position
function calculateSafetyScore(lat, lng, countryCode) {
  const country = COUNTRIES[countryCode];
  if (!country) return { score: 50, label: 'Unknown', color: '#888', factors: [] };

  const override = db.getAdvisoryOverride.get(countryCode);
  const advisoryLevel = override?.level || country.advisoryLevel;
  let score = ADVISORY_BASE_SCORES[advisoryLevel] || 50;
  const factors = [];

  factors.push({
    label: `Advisory Level ${advisoryLevel} — ${ADVISORY_LEVELS[advisoryLevel]?.label}`,
    impact: -(90 - score),
    type: 'advisory'
  });

  // Check recent incidents within radius
  const recentEvents = db.db.prepare(`
    SELECT * FROM events
    WHERE country_code = ?
    AND lat IS NOT NULL AND lng IS NOT NULL
    AND status = 'approved'
    AND created_at > datetime('now', '-24 hours')
  `).all(countryCode);

  let incidentDeduction = 0;
  const nearbyEvents = [];

  for (const event of recentEvents) {
    const dist = distanceKm(lat, lng, event.lat, event.lng);
    if (dist > 50) continue; // only within 50km

    // Closer events have bigger impact
    const proximityMultiplier = dist < 5 ? 1.0 : dist < 15 ? 0.7 : dist < 30 ? 0.4 : 0.2;
    const baseDeduction = (TYPE_DEDUCTIONS[event.type] || 5) + (SEVERITY_DEDUCTIONS[event.severity] || 5);
    const deduction = Math.round(baseDeduction * proximityMultiplier);

    incidentDeduction += deduction;
    nearbyEvents.push({ ...event, dist: Math.round(dist), deduction });
  }

  if (nearbyEvents.length > 0) {
    const totalDed = Math.min(incidentDeduction, 40); // cap at 40 points
    score -= totalDed;
    factors.push({
      label: `${nearbyEvents.length} recent incident${nearbyEvents.length>1?'s':''} within 50km`,
      impact: -totalDed,
      type: 'incidents',
      events: nearbyEvents.slice(0,3)
    });
  }

  // Time of day factor (night = slightly less safe in most places)
  const localHour = new Date().toLocaleString('en-US', {
    hour: 'numeric', hour12: false,
    timeZone: country.timezone || 'UTC'
  });
  const hour = parseInt(localHour);
  if (hour >= 22 || hour < 5) {
    score -= 5;
    factors.push({ label: 'Late night hours', impact: -5, type: 'time' });
  }

  // Clamp score
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Label and color
  let label, color, emoji;
  if (score >= 80) { label = 'Safe'; color = '#16a34a'; emoji = '🟢'; }
  else if (score >= 60) { label = 'Caution'; color = '#d97706'; emoji = '🟡'; }
  else if (score >= 40) { label = 'Elevated Risk'; color = '#ea580c'; emoji = '🟠'; }
  else if (score >= 20) { label = 'High Risk'; color = '#dc2626'; emoji = '🔴'; }
  else { label = 'Critical Danger'; color = '#7f1d1d'; emoji = '⛔'; }

  return { score, label, color, emoji, factors, nearbyEvents };
}

// Determine which country a GPS position is in (rough check by bounding box)
function detectCountry(lat, lng) {
  const BOUNDS = {
    JO: { minLat:29.18, maxLat:33.37, minLng:34.96, maxLng:39.30 },
    UA: { minLat:44.39, maxLat:52.38, minLng:22.14, maxLng:40.22 },
    LB: { minLat:33.06, maxLat:34.69, minLng:35.10, maxLng:36.62 },
    EG: { minLat:22.00, maxLat:31.67, minLng:24.70, maxLng:36.90 },
    MX: { minLat:14.53, maxLat:32.72, minLng:-117.12, maxLng:-86.74 },
    PK: { minLat:23.69, maxLat:37.10, minLng:60.87, maxLng:77.83 },
    TH: { minLat:5.61,  maxLat:20.46, minLng:97.34, maxLng:105.64 },
    FR: { minLat:41.33, maxLat:51.12, minLng:-5.14, maxLng:9.56 },
    JP: { minLat:24.25, maxLat:45.55, minLng:122.94, maxLng:153.99 },
    ZA: { minLat:-34.83, maxLat:-22.09, minLng:16.46, maxLng:32.89 },
  };

  for (const [code, b] of Object.entries(BOUNDS)) {
    if (lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng) {
      return code;
    }
  }
  return null;
}

// Generate nearby safety points of interest
function getNearbyPOI(lat, lng, countryCode) {
  const country = COUNTRIES[countryCode];
  if (!country) return [];

  const poi = [];

  // Add capital / major cities as reference points
  if (country.cities) {
    country.cities.forEach(city => {
      const dist = distanceKm(lat, lng, city.lat, city.lng);
      if (dist < 200) {
        poi.push({
          type: 'city',
          name: city.name,
          lat: city.lat,
          lng: city.lng,
          dist: Math.round(dist),
          icon: '🏙️'
        });
      }
    });
  }

  // Sort by distance
  return poi.sort((a, b) => a.dist - b.dist).slice(0, 5);
}

module.exports = { calculateSafetyScore, detectCountry, getNearbyPOI, distanceKm };

// Atlas Ally — Crime Tracker (src/crime-tracker.js)
// Pulls 3-month crime trend data from GDELT + UNODC baseline stats
// Routes: GET /api/crime/trend?country_code=XX
//         GET /api/crime/baseline?country_code=XX  (already exists, this enriches it)

const fetch = require('node-fetch');

// ── UNODC Static Baseline Data ──────────────────────────────────────────────
// Source: UNODC Global Study on Homicide + Crime Trends Survey
// Rates per 100,000 population. Updated when UNODC releases new data.
const UNODC_BASELINE = {
  JO: { homicide: 1.8,  assault: 28,  theft: 145, robbery: 8,   year: 2022 },
  LB: { homicide: 2.1,  assault: 35,  theft: 180, robbery: 12,  year: 2022 },
  EG: { homicide: 3.2,  assault: 42,  theft: 210, robbery: 15,  year: 2022 },
  IL: { homicide: 1.4,  assault: 22,  theft: 890, robbery: 18,  year: 2022 },
  IQ: { homicide: 5.8,  assault: 68,  theft: 120, robbery: 22,  year: 2022 },
  SA: { homicide: 1.5,  assault: 18,  theft: 95,  robbery: 6,   year: 2022 },
  AE: { homicide: 0.5,  assault: 10,  theft: 62,  robbery: 2,   year: 2022 },
  TR: { homicide: 4.3,  assault: 55,  theft: 320, robbery: 28,  year: 2022 },
  UA: { homicide: 6.2,  assault: 78,  theft: 410, robbery: 35,  year: 2022 },
  RU: { homicide: 8.2,  assault: 95,  theft: 680, robbery: 42,  year: 2022 },
  GB: { homicide: 1.1,  assault: 164, theft: 1820,robbery: 52,  year: 2022 },
  FR: { homicide: 1.3,  assault: 142, theft: 1650,robbery: 78,  year: 2022 },
  DE: { homicide: 0.9,  assault: 132, theft: 1420,robbery: 42,  year: 2022 },
  US: { homicide: 6.8,  assault: 246, theft: 1958,robbery: 82,  year: 2022 },
  MX: { homicide: 29.9, assault: 182, theft: 1240,robbery: 128, year: 2022 },
  BR: { homicide: 22.3, assault: 248, theft: 1580,robbery: 156, year: 2022 },
  CO: { homicide: 27.9, assault: 198, theft: 980, robbery: 112, year: 2022 },
  ZA: { homicide: 45.5, assault: 580, theft: 2200,robbery: 320, year: 2022 },
  NG: { homicide: 10.3, assault: 128, theft: 420, robbery: 88,  year: 2022 },
  KE: { homicide: 8.5,  assault: 98,  theft: 380, robbery: 65,  year: 2022 },
  IN: { homicide: 2.8,  assault: 52,  theft: 185, robbery: 18,  year: 2022 },
  PK: { homicide: 7.8,  assault: 88,  theft: 220, robbery: 45,  year: 2022 },
  AF: { homicide: 6.5,  assault: 72,  theft: 95,  robbery: 38,  year: 2022 },
  CN: { homicide: 0.5,  assault: 28,  theft: 180, robbery: 12,  year: 2022 },
  TH: { homicide: 3.2,  assault: 48,  theft: 290, robbery: 22,  year: 2022 },
  PH: { homicide: 8.4,  assault: 115, theft: 380, robbery: 62,  year: 2022 },
};

// ── GDELT Crime Trend Query ──────────────────────────────────────────────────
// Queries GDELT for crime/violence events per week over 90 days
async function fetchGdeltTrend(countryCode, countryName) {
  const weeks = [];
  const now = new Date();

  for (let w = 11; w >= 0; w--) {
    const endDate   = new Date(now - w * 7 * 24 * 3600 * 1000);
    const startDate = new Date(endDate - 7 * 24 * 3600 * 1000);

    const fmt = d => d.toISOString().slice(0,10).replace(/-/g,'');
    const query = encodeURIComponent(
      `(crime OR violence OR robbery OR theft OR attack OR shooting OR stabbing) ${countryName}`
    );
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}` +
      `&mode=timelinevolume&startdatetime=${fmt(startDate)}000000` +
      `&enddatetime=${fmt(endDate)}235959&format=json&smoothing=0`;

    try {
      const res = await fetch(url, {
        timeout: 8000,
        headers: { 'User-Agent': 'AtlasAlly/1.0' }
      });
      if (!res.ok) { weeks.push({ week: 12 - w, count: 0, label: weekLabel(endDate) }); continue; }
      const data = await res.json();
      const timeline = data.timeline || [];
      const total = timeline.reduce((s, t) => {
        return s + (t.data || []).reduce((ss, d) => ss + (d.value || 0), 0);
      }, 0);
      weeks.push({ week: 12 - w, count: Math.round(total), label: weekLabel(endDate) });
    } catch (e) {
      weeks.push({ week: 12 - w, count: 0, label: weekLabel(endDate) });
    }
  }
  return weeks;
}

function weekLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Group weeks into 3 months
function groupIntoMonths(weeks) {
  const months = [
    { label: '', count: 0, weeks: [] },
    { label: '', count: 0, weeks: [] },
    { label: '', count: 0, weeks: [] }
  ];
  weeks.forEach((w, i) => {
    const m = Math.floor(i / 4);
    if (m < 3) {
      months[m].weeks.push(w);
      months[m].count += w.count;
    }
  });
  // Label each month
  const now = new Date();
  for (let i = 0; i < 3; i++) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - (2 - i));
    months[i].label = d.toLocaleDateString('en-US', { month: 'long' });
  }
  return months;
}

// ── Route Handler ────────────────────────────────────────────────────────────
async function getCrimeTrend(req, res) {
  const countryCode = (req.query.country_code || '').toUpperCase().trim();
  if (!countryCode) return res.status(400).json({ error: 'country_code required' });

  // Get country name for GDELT query
  const { COUNTRIES } = require('./countries');
  const country = COUNTRIES[countryCode];
  const countryName = country ? country.name : countryCode;

  try {
    const [weeks, baseline] = await Promise.all([
      fetchGdeltTrend(countryCode, countryName),
      Promise.resolve(UNODC_BASELINE[countryCode] || null)
    ]);

    const months = groupIntoMonths(weeks);
    const maxCount = Math.max(...weeks.map(w => w.count), 1);
    const totalIncidents = weeks.reduce((s, w) => s + w.count, 0);

    // Trend direction
    const firstHalf  = weeks.slice(0, 6).reduce((s,w) => s+w.count, 0);
    const secondHalf = weeks.slice(6).reduce((s,w) => s+w.count, 0);
    const trend = secondHalf > firstHalf * 1.1 ? 'rising' : secondHalf < firstHalf * 0.9 ? 'falling' : 'stable';

    res.json({
      country_code: countryCode,
      country_name: countryName,
      period_days: 90,
      total_incidents: totalIncidents,
      trend,
      weeks,
      months,
      max_weekly: maxCount,
      unodc_baseline: baseline,
      sources: ['GDELT Project', baseline ? 'UNODC' : null].filter(Boolean),
      generated_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Crime trend error:', err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getCrimeTrend, UNODC_BASELINE };

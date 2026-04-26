// Atlas Ally — News service
// Background job: refresh news_cache for all subscribed countries.
// On-demand: refresh a single country (called when /api/news sees a thin cache).
//
// Uses the shared RSS fetcher and country-meta table. The HTTP handler for
// /api/news lives in routes/news.js — this file is the service layer only.

const db = require('./db');
const { fetchRSS } = require('./lib/rss');
const { getCountryName, isRelevantToCountry, META } = require('./lib/countries-meta');

// Strip the trailing " - Source Name" that Google News appends to every title.
function cleanTitle(raw) {
  const dash = raw.lastIndexOf(' - ');
  return (dash > 10 ? raw.slice(0, dash) : raw).replace(/<[^>]*>/g, '').trim();
}

function extractSource(raw, fallback = 'Google News') {
  const dash = raw.lastIndexOf(' - ');
  return dash > 10 ? raw.slice(dash + 3).trim() : fallback;
}

// Jordan-specific noise filter. "Jordan" the country collides with Jordan the basketball
// player, Jordan the sneaker brand, Jordan Peterson, Jordan Davis (NFL/college football),
// Barbara Jordan (US politician — Texas park named after her), and NASCAR/racing coverage.
// Only apply when code is JO.
function passesJordanNoiseFilter(title) {
  const t = title.toLowerCase();
  if (/\b(basketball|nba|wnba|michael jordan|air jordan|jordan brand|jordan peterson|sneaker|sports|athlete|game|court|nascar|racing|barbara jordan|jordan davis)\b/.test(t)) {
    return false;
  }
  return true;
}

// Fetch Google News RSS for a country and return DB-shaped news rows.
async function fetchCountryNews(code, lang = 'en') {
  const name = getCountryName(code);
  const gl = code.toUpperCase();

  // A few angled queries for breadth — security, government, general news.
  const queries = [
    `"${name}" (security OR safety OR travel OR tourism OR embassy OR alert)`,
    `"${name}" (government OR minister OR protest OR crisis OR emergency)`,
    `"${name}" (border OR military OR attack OR warning OR incident)`,
  ];

  const urls = queries.map(q =>
    `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=${lang}&gl=${gl}&ceid=${gl}:${lang}`
  );

  const batches = await Promise.all(urls.map(u => fetchRSS(u)));
  const seen = new Set();
  const rows = [];

  for (const item of batches.flat()) {
    if (!item.title) continue;
    const title = cleanTitle(item.title);
    if (title.length < 10) continue;

    const source = extractSource(item.title);
    const url = item.link;
    const key = title.toLowerCase().slice(0, 60);
    if (seen.has(key) || (url && seen.has(url))) continue;
    seen.add(key);
    if (url) seen.add(url);

    // Relevance filter — title must mention the country
    if (!isRelevantToCountry(title + ' ' + item.description, code)) continue;
    if (code === 'JO' && !passesJordanNoiseFilter(title)) continue;

    let published = new Date().toISOString();
    try {
      const d = new Date(item.published);
      if (!isNaN(d.getTime())) published = d.toISOString();
    } catch {}

    rows.push({
      country_code: code,
      lang,
      source_name: source,
      title: title.slice(0, 300),
      description: (item.description || '').slice(0, 500),
      url: url || null,
      lat: null,
      lng: null,
      published_at: published,
    });
  }

  return rows;
}

// Fetch + cache for one country. Safe to call concurrently; DB uses INSERT OR IGNORE.
async function refreshNewsForCountry(code, lang = 'en') {
  try {
    const rows = await fetchCountryNews(code, lang);
    for (const row of rows) {
      try { db.cacheNews.run(row); } catch {}
    }
    return rows.length;
  } catch (e) {
    console.error(`News refresh failed for ${code}:`, e.message);
    return 0;
  }
}

// Background refresh for all countries we have metadata for.
// Runs from server.js on startup and every 30 min.
async function refreshAllNews() {
  try { db.clearOldNews.run(); } catch {}

  const codes = Object.keys(META);
  let total = 0;

  // Sequential with a small delay — we don't want to hammer Google News.
  for (const code of codes) {
    const n = await refreshNewsForCountry(code, 'en');
    total += n;
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`📰 News refresh complete — ${total} articles across ${codes.length} countries`);
  return total;
}

module.exports = {
  refreshNewsForCountry,
  refreshAllNews,
  fetchCountryNews,
};

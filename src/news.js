// Atlas Ally — News service
// Background job: refresh news_cache for all subscribed countries.
// On-demand: refresh a single country (called when /api/news sees a thin cache).
//
// Uses the shared RSS fetcher and country-meta table. The HTTP handler for
// /api/news lives in routes/news.js — this file is the service layer only.

const db = require('./db');
const { fetchRSS } = require('./lib/rss');
const {
  getCountryName,
  classifyRelevance,
  isRelevantToCountry,
  llmIsRelevantToCountry,
  passesNoiseFilter,
  META,
} = require('./lib/countries-meta');

// N20: feature flag for the LLM disambiguation step on weak-tier alias matches.
// When false, weak matches are accepted with only passesNoiseFilter as a guard
// (≈ pre-fix behavior, but with new word-boundary regex tightening leakage).
// When true, weak matches go through Claude Haiku 4.5 for final classification.
// Set NEWS_LLM_DISAMBIGUATION_ENABLED=true in Railway to enable.
const LLM_DISAMBIGUATION = process.env.NEWS_LLM_DISAMBIGUATION_ENABLED === 'true';

// Strip the trailing " - Source Name" that Google News appends to every title.
function cleanTitle(raw) {
  const dash = raw.lastIndexOf(' - ');
  return (dash > 10 ? raw.slice(0, dash) : raw).replace(/<[^>]*>/g, '').trim();
}

function extractSource(raw, fallback = 'Google News') {
  const dash = raw.lastIndexOf(' - ');
  return dash > 10 ? raw.slice(dash + 3).trim() : fallback;
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

    // ── N20: tier-based relevance filtering ──────────────────────────────────
    // Strong alias hit → keep without LLM call.
    // No alias hit at all → drop, no LLM call.
    // Weak alias only → noise filter, then LLM disambiguation (when flag on).
    const fullText = title + ' ' + (item.description || '');
    const tier = classifyRelevance(fullText, code);
    if (tier === 'none') continue;
    if (!passesNoiseFilter(title, code)) continue; // free pre-LLM gate

    if (tier === 'weak') {
      if (LLM_DISAMBIGUATION) {
        const verdict = await llmIsRelevantToCountry(fullText, code, url);
        if (!verdict) continue;
      }
      // Flag off: accept the weak match. Schema deployed but LLM gate inactive.
    }
    // tier === 'strong' falls through to insertion below.

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

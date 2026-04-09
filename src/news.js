// Atlas Ally — News Module
// Uses Google News RSS as primary source — works for ANY country, no API key,
// never blocks server requests. Falls back to country-specific feeds.
// This means adding a new country automatically gets news with zero extra config.

const fetch = require('node-fetch');
const xml2js = require('xml2js');
const { COUNTRIES } = require('./countries');
const db = require('./db');
const { extractLocation } = require('./geocoder');

const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: false });

// Google News RSS — works for any country name or topic, always accessible
function googleNewsUrl(query, lang = 'en', country = 'US') {
  const q = encodeURIComponent(query);
  return `https://news.google.com/rss/search?q=${q}&hl=${lang}&gl=${country}&ceid=${country}:${lang}`;
}

// Country code → Google News language/region config
const GOOGLE_NEWS_CONFIG = {
  JO: { lang: 'en', gl: 'JO', query: 'Jordan news safety travel' },
  UA: { lang: 'en', gl: 'UA', query: 'Ukraine war conflict news' },
  LB: { lang: 'en', gl: 'LB', query: 'Lebanon news security' },
  EG: { lang: 'en', gl: 'EG', query: 'Egypt news' },
  MX: { lang: 'en', gl: 'MX', query: 'Mexico safety security news' },
  PK: { lang: 'en', gl: 'PK', query: 'Pakistan news security' },
  TH: { lang: 'en', gl: 'TH', query: 'Thailand news travel' },
  FR: { lang: 'en', gl: 'FR', query: 'France news security' },
  JP: { lang: 'en', gl: 'JP', query: 'Japan news' },
  ZA: { lang: 'en', gl: 'ZA', query: 'South Africa news safety' },
  IL: { lang: 'en', gl: 'IL', query: 'Israel news conflict' },
  IQ: { lang: 'en', gl: 'IQ', query: 'Iraq news security' },
  CO: { lang: 'en', gl: 'CO', query: 'Colombia news safety' },
  NG: { lang: 'en', gl: 'NG', query: 'Nigeria news security' },
  IN: { lang: 'en', gl: 'IN', query: 'India news' },
  BR: { lang: 'en', gl: 'BR', query: 'Brazil news safety' },
  KE: { lang: 'en', gl: 'KE', query: 'Kenya news security' },
  PH: { lang: 'en', gl: 'PH', query: 'Philippines news' },
  TR: { lang: 'en', gl: 'TR', query: 'Turkey news security' },
  MA: { lang: 'en', gl: 'MA', query: 'Morocco news travel' },
};

// Reliable backup feeds that allow server access
const BACKUP_FEEDS = [
  { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { name: 'AP News', url: 'https://rsshub.app/apnews/topics/apf-intlnews' },
  { name: 'Al Jazeera English', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
];

async function fetchRSS(url) {
  try {
    const res = await fetch(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AtlasAlly/1.0; +https://atlas-ally.com)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const result = await parser.parseStringPromise(xml);
    const items = result?.rss?.channel?.item || result?.feed?.entry || [];
    return Array.isArray(items) ? items : [items];
  } catch(e) {
    console.warn(`  RSS failed: ${url.slice(0,60)}... — ${e.message}`);
    return [];
  }
}

function extractItem(item) {
  const title = item.title?._ || item.title || '';
  const description = item.description?._ || item.description ||
                      item.summary?._ || item.summary || '';
  const url = item.link?.$ ? item.link.$.href :
              (typeof item.link === 'string' ? item.link : item.guid?._ || item.guid || '');
  const published = item.pubDate || item.published || item.updated || new Date().toISOString();

  // Clean Google News redirect URLs
  let cleanUrl = String(url).trim();
  if (cleanUrl.includes('news.google.com/rss/articles')) {
    // Keep as-is — Google News links redirect to original article
  }

  return {
    title: String(title).replace(/<[^>]*>/g, '').replace(/&amp;/g,'&').replace(/&quot;/g,'"').trim().slice(0, 200),
    description: String(description).replace(/<[^>]*>/g, '').trim().slice(0, 500),
    url: cleanUrl,
    published_at: (() => { try { return new Date(published).toISOString(); } catch { return new Date().toISOString(); } })(),
  };
}

async function refreshNewsForCountry(countryCode) {
  const country = COUNTRIES[countryCode];
  if (!country) return;

  const config = GOOGLE_NEWS_CONFIG[countryCode] || {
    lang: 'en', gl: countryCode, query: `${country.name} news safety travel`
  };

  let count = 0;

  // Primary: Google News RSS (always works, auto-scales to any country)
  const gnUrl = googleNewsUrl(config.query, config.lang, config.gl);
  const gnItems = await fetchRSS(gnUrl);

  for (const raw of gnItems.slice(0, 12)) {
    const item = extractItem(raw);
    if (!item.title || item.title.length < 10) continue;
    try {
      const loc = extractLocation(item.title + ' ' + item.description, countryCode);
      db.cacheNews.run({
        country_code: countryCode,
        source_name: 'Google News',
        title: item.title,
        description: item.description,
        url: item.url,
        lat: loc.lat || null,
        lng: loc.lng || null,
        published_at: item.published_at,
      });
      count++;
    } catch(e) { /* duplicate */ }
  }

  // Secondary: country-specific feeds if defined in countries.js
  if (country.newsFeed?.length) {
    for (const feed of country.newsFeed) {
      const items = await fetchRSS(feed.url);
      for (const raw of items.slice(0, 6)) {
        const item = extractItem(raw);
        if (!item.title || item.title.length < 10) continue;
        try {
          const loc = extractLocation(item.title + ' ' + item.description, countryCode);
          db.cacheNews.run({
            country_code: countryCode,
            source_name: feed.name,
            title: item.title,
            description: item.description,
            url: item.url,
            lat: loc.lat || null,
            lng: loc.lng || null,
            published_at: item.published_at,
          });
          count++;
        } catch(e) { /* duplicate */ }
      }
    }
  }

  console.log(`  📰 ${countryCode}: cached ${count} news items`);
  return count;
}

async function refreshAllNews() {
  console.log('🗞  Refreshing news feeds (Google News)...');
  db.clearOldNews.run();

  const codes = Object.keys(COUNTRIES);
  let total = 0;

  for (const code of codes) {
    const n = await refreshNewsForCountry(code);
    total += n || 0;
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 800));
  }

  console.log(`🗞  News refresh complete — ${total} articles cached across ${codes.length} countries`);
}

// Fetch news for a country not yet in COUNTRIES (for future expansion)
async function fetchNewsForAnyCountry(countryName, countryCode) {
  const query = `${countryName} news safety travel security`;
  const url = googleNewsUrl(query, 'en', countryCode || 'US');
  const items = await fetchRSS(url);
  return items.slice(0, 10).map(extractItem).filter(i => i.title.length > 10);
}

module.exports = { refreshAllNews, refreshNewsForCountry, fetchNewsForAnyCountry };

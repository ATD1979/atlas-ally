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
// Expanded to cover all major countries worldwide
const GOOGLE_NEWS_CONFIG = {
  // Middle East & North Africa
  JO: { lang: 'en', gl: 'JO', query: 'Jordan news safety travel' },
  LB: { lang: 'en', gl: 'LB', query: 'Lebanon news security' },
  EG: { lang: 'en', gl: 'EG', query: 'Egypt news' },
  IL: { lang: 'en', gl: 'IL', query: 'Israel news conflict' },
  IQ: { lang: 'en', gl: 'IQ', query: 'Iraq news security' },
  MA: { lang: 'en', gl: 'MA', query: 'Morocco news travel' },
  SA: { lang: 'en', gl: 'SA', query: 'Saudi Arabia news' },
  AE: { lang: 'en', gl: 'AE', query: 'UAE Dubai news' },
  IR: { lang: 'en', gl: 'IR', query: 'Iran news' },
  SY: { lang: 'en', gl: 'SY', query: 'Syria news conflict' },
  YE: { lang: 'en', gl: 'YE', query: 'Yemen news conflict' },
  LY: { lang: 'en', gl: 'LY', query: 'Libya news security' },
  TN: { lang: 'en', gl: 'TN', query: 'Tunisia news' },
  DZ: { lang: 'en', gl: 'DZ', query: 'Algeria news' },
  // Europe
  FR: { lang: 'en', gl: 'FR', query: 'France news security' },
  DE: { lang: 'en', gl: 'DE', query: 'Germany news' },
  GB: { lang: 'en', gl: 'GB', query: 'UK Britain news safety' },
  UA: { lang: 'en', gl: 'UA', query: 'Ukraine war conflict news' },
  TR: { lang: 'en', gl: 'TR', query: 'Turkey news security' },
  RU: { lang: 'en', gl: 'RU', query: 'Russia news conflict' },
  ES: { lang: 'en', gl: 'ES', query: 'Spain news' },
  IT: { lang: 'en', gl: 'IT', query: 'Italy news' },
  PL: { lang: 'en', gl: 'PL', query: 'Poland news' },
  GR: { lang: 'en', gl: 'GR', query: 'Greece news' },
  RS: { lang: 'en', gl: 'RS', query: 'Serbia news Balkans' },
  // Americas
  US: { lang: 'en', gl: 'US', query: 'United States news safety security' },
  MX: { lang: 'en', gl: 'MX', query: 'Mexico safety security news' },
  BR: { lang: 'en', gl: 'BR', query: 'Brazil news safety' },
  CO: { lang: 'en', gl: 'CO', query: 'Colombia news safety' },
  VE: { lang: 'en', gl: 'VE', query: 'Venezuela news crisis' },
  AR: { lang: 'en', gl: 'AR', query: 'Argentina news' },
  HT: { lang: 'en', gl: 'HT', query: 'Haiti news crisis security' },
  GT: { lang: 'en', gl: 'GT', query: 'Guatemala news safety' },
  HN: { lang: 'en', gl: 'HN', query: 'Honduras news safety' },
  // Asia Pacific
  IN: { lang: 'en', gl: 'IN', query: 'India news' },
  PK: { lang: 'en', gl: 'PK', query: 'Pakistan news security' },
  JP: { lang: 'en', gl: 'JP', query: 'Japan news' },
  CN: { lang: 'en', gl: 'CN', query: 'China news' },
  TH: { lang: 'en', gl: 'TH', query: 'Thailand news travel' },
  PH: { lang: 'en', gl: 'PH', query: 'Philippines news' },
  KR: { lang: 'en', gl: 'KR', query: 'South Korea news' },
  ID: { lang: 'en', gl: 'ID', query: 'Indonesia news' },
  MM: { lang: 'en', gl: 'MM', query: 'Myanmar Burma news conflict' },
  BD: { lang: 'en', gl: 'BD', query: 'Bangladesh news' },
  NP: { lang: 'en', gl: 'NP', query: 'Nepal news' },
  AF: { lang: 'en', gl: 'AF', query: 'Afghanistan news security' },
  // Africa
  NG: { lang: 'en', gl: 'NG', query: 'Nigeria news security' },
  ZA: { lang: 'en', gl: 'ZA', query: 'South Africa news safety' },
  KE: { lang: 'en', gl: 'KE', query: 'Kenya news security' },
  ET: { lang: 'en', gl: 'ET', query: 'Ethiopia news conflict' },
  SO: { lang: 'en', gl: 'SO', query: 'Somalia news security' },
  SD: { lang: 'en', gl: 'SD', query: 'Sudan news conflict' },
  CD: { lang: 'en', gl: 'CD', query: 'Congo DRC news conflict' },
  ML: { lang: 'en', gl: 'ML', query: 'Mali news security' },
  GH: { lang: 'en', gl: 'GH', query: 'Ghana news' },
  TZ: { lang: 'en', gl: 'TZ', query: 'Tanzania news' },
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
      timeout: 25000,
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
  } catch (e) {
    console.warn(`  RSS failed: ${url.slice(0, 60)}... — ${e.message}`);
    return [];
  }
}

// Domains clearly outside any of our 20 country regions — drop their articles
// (These outlets cover the world but aren't local sources)
const REMOTE_DOMAINS = [
  'abc.net.au', 'smh.com.au', 'theaustralian.com.au', '9news.com.au',
  'skynews.com.au', 'news.com.au', 'heraldsun.com.au', 'theage.com.au',
  'nzherald.co.nz', 'stuff.co.nz', 'rnz.co.nz',
  'cbc.ca', 'globalnews.ca', 'thestar.com', 'nationalpost.com',
  'independent.ie', 'irishtimes.com', 'rte.ie',
  'scotsman.com', 'heraldscotland.com',
];

function extractItem(item) {
  const rawTitle = String(item.title?._ || item.title || '');
  const description = item.description?._ || item.description ||
    item.summary?._ || item.summary || '';
  const url = item.link?.$ ? item.link.$.href :
    (typeof item.link === 'string' ? item.link : item.guid?._ || item.guid || '');
  const published = item.pubDate || item.published || item.updated || new Date().toISOString();

  // Google News titles are "Article Headline - Publisher Name"
  // Extract publisher from the trailing " - Source" suffix
  let title = rawTitle;
  let sourceDomain = null;
  const dashIdx = rawTitle.lastIndexOf(' - ');
  if (dashIdx > 10) {
    title = rawTitle.slice(0, dashIdx).trim();
    sourceDomain = rawTitle.slice(dashIdx + 3).trim().toLowerCase()
      .replace(/\s+/g, '-').replace(/[^a-z0-9.-]/g, '');
  }

  return {
    title: title.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim().slice(0, 500),
    description: String(description).replace(/<[^>]*>/g, '').trim().slice(0, 500),
    url: String(url).trim(),
    published_at: (() => { try { return new Date(published).toISOString(); } catch { return new Date().toISOString(); } })(),
    sourceDomain,
  };
}

function isRemoteSource(item) {
  if (!item.sourceDomain) return false;
  return REMOTE_DOMAINS.some(d => item.sourceDomain.includes(d.replace('.', '')));
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
  const seen = new Set();
  for (const raw of gnItems.slice(0, 15)) {
    const item = extractItem(raw);
    if (!item.title || item.title.length < 10) continue;
    if (isRemoteSource(item)) continue;  // drop Australian/NZ/Canadian outlets
const titleKey = item.title.toLowerCase().slice(0, 60);
if (seen.has(item.url) || seen.has(titleKey)) continue;
seen.add(item.url);
seen.add(titleKey);
    
    try {
      const loc = extractLocation(item.title + ' ' + item.description, countryCode);
      db.cacheNews.run({
        country_code: countryCode,
        source_name: item.sourceDomain || 'Google News',
        title: item.title,
        description: item.description,
        url: item.url,
        lat: loc.lat || null,
        lng: loc.lng || null,
        published_at: item.published_at,
      });
      count++;
    } catch (e) { /* duplicate */ }
  }

  // Secondary: country-specific feeds if defined in countries.js
  if (country.newsFeed?.length) {
    for (const feed of country.newsFeed) {
      const items = await fetchRSS(feed.url);
      for (const raw of items.slice(0, 6)) {
        const item = extractItem(raw);
        if (!item.title || item.title.length < 10) continue;
const titleKey = item.title.toLowerCase().slice(0, 60);
if (seen.has(item.url) || seen.has(titleKey)) continue;
seen.add(item.url);
seen.add(titleKey);
        try {
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
        } catch (e) { /* duplicate */ }
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

module.exports = { refreshAllNews, refreshNewsForCountry, fetchNewsForAnyCountry, fetchGDELTEvents };

// GDELT event ingestion — real-time conflict and incident data
async function fetchGDELTEvents(countryCode, countryName) {
  const query = encodeURIComponent(countryName + ' conflict protest attack disaster');
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=artlist&maxrecords=10&format=json&timespan=1440`;
  try {
    const res = await fetch(url, {
      timeout: 25000,
      headers: { 'User-Agent': 'AtlasAlly/1.0' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.articles || []).map(a => ({
      country_code: countryCode,
      source_name: a.domain || 'GDELT',
      title: (a.title || '').slice(0, 500),
      description: '',
      url: a.url || '',
      lat: a.socialimage ? null : null,
      lng: null,
      published_at: a.seendate ? new Date(
        a.seendate.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6')
      ).toISOString() : new Date().toISOString(),
      category: 'event'
    }));
  } catch (e) {
    console.warn(`  GDELT timeout for ${countryCode}: ${e.message}`);
    return [];
  }
}

module.exports.fetchGDELTEvents = fetchGDELTEvents;

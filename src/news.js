const fetch = require('node-fetch');
const xml2js = require('xml2js');
const { COUNTRIES } = require('./countries');
const db = require('./db');

const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: false });

async function fetchRSS(url) {
  try {
    const res = await fetch(url, {
      timeout: 8000,
      headers: { 'User-Agent': 'AtlasAlly/1.0 News Aggregator' }
    });
    const xml = await res.text();
    const result = await parser.parseStringPromise(xml);
    const items = result?.rss?.channel?.item || result?.feed?.entry || [];
    return Array.isArray(items) ? items : [items];
  } catch(e) {
    console.warn(`RSS fetch failed for ${url}:`, e.message);
    return [];
  }
}

function extractItem(item) {
  // Handle both RSS 2.0 and Atom formats
  const title = item.title?._ || item.title || '';
  const description = item.description?._ || item.description ||
                      item.summary?._ || item.summary || '';
  const url = item.link?.$ ? item.link.$.href : (item.link || item.guid?._ || item.guid || '');
  const published = item.pubDate || item.published || item.updated || new Date().toISOString();

  return {
    title: String(title).replace(/<[^>]*>/g, '').trim().slice(0, 200),
    description: String(description).replace(/<[^>]*>/g, '').trim().slice(0, 500),
    url: String(url).trim(),
    published_at: new Date(published).toISOString(),
  };
}

async function refreshNewsForCountry(countryCode) {
  const country = COUNTRIES[countryCode];
  if (!country?.newsFeed?.length) return;

  let count = 0;
  for (const feed of country.newsFeed) {
    const items = await fetchRSS(feed.url);
    for (const raw of items.slice(0, 10)) {
      const item = extractItem(raw);
      if (!item.title || !item.url) continue;
      try {
        db.cacheNews.run({
          country_code: countryCode,
          source_name: feed.name,
          title: item.title,
          description: item.description,
          url: item.url,
          published_at: item.published_at,
        });
        count++;
      } catch(e) { /* duplicate — ignore */ }
    }
  }
  console.log(`  📰 ${countryCode}: cached ${count} news items`);
}

async function refreshAllNews() {
  console.log('🗞  Refreshing news feeds...');
  db.clearOldNews.run();
  for (const code of Object.keys(COUNTRIES)) {
    await refreshNewsForCountry(code);
  }
  console.log('🗞  News refresh complete');
}

module.exports = { refreshAllNews, refreshNewsForCountry };

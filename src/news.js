// Atlas Ally — News Module
// Uses Google News RSS as primary source — works for ANY country, no API key.

const fetch = require('node-fetch');
const xml2js = require('xml2js');
const { COUNTRIES } = require('./countries');
const db = require('./db');
const { extractLocation } = require('./geocoder');

const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: false });

// ── Google News RSS config ────────────────────────────────────────────────────

function googleNewsUrl(query, lang = 'en', country = 'US') {
  const q = encodeURIComponent(query);
  return `https://news.google.com/rss/search?q=${q}&hl=${lang}&gl=${country}&ceid=${country}:${lang}`;
}

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

// ── Remote domain blocklist ───────────────────────────────────────────────────
// Outlets geographically distant from all 20 countries — blocked entirely.
// BBC, Al Jazeera, Reuters etc are NOT here — filtered by relevance instead.

const REMOTE_DOMAINS = [
  'abc.net.au','smh.com.au','theaustralian.com.au','9news.com.au',
  'skynews.com.au','news.com.au','heraldsun.com.au','theage.com.au',
  'dailytelegraph.com.au','couriermail.com.au','perthnow.com.au',
  'nzherald.co.nz','stuff.co.nz','rnz.co.nz','1news.co.nz',
  'cbc.ca','globalnews.ca','thestar.com','nationalpost.com',
  'torontostar.com','ottawacitizen.com','montrealgazette.com',
  'independent.ie','irishtimes.com','rte.ie','thejournal.ie',
  'scotsman.com','heraldscotland.com','dailyrecord.co.uk',
];

// ── Country relevance keywords ────────────────────────────────────────────────
// Global outlets (BBC, Al Jazeera, Reuters, CNN) must mention one of these
// before an article is cached for that country.

const COUNTRY_KEYWORDS = {
  JO: ['jordan','amman','aqaba','zarqa','irbid','petra','jordanian'],
  UA: ['ukraine','kyiv','kharkiv','odesa','ukrainian','zelensky','dnipro'],
  LB: ['lebanon','beirut','lebanese','tripoli','sidon','tyre'],
  EG: ['egypt','cairo','egyptian','alexandria','sinai','giza'],
  MX: ['mexico','mexican','mexico city','guadalajara','monterrey','tijuana'],
  PK: ['pakistan','karachi','lahore','islamabad','pakistani','peshawar'],
  TH: ['thailand','thai','bangkok','pattaya','chiang mai','phuket'],
  FR: ['france','french','paris','lyon','marseille','toulouse','nice'],
  JP: ['japan','japanese','tokyo','osaka','kyoto','hiroshima','fukuoka'],
  ZA: ['south africa','johannesburg','cape town','durban','pretoria','south african'],
  IL: ['israel','israeli','tel aviv','jerusalem','haifa','gaza','west bank'],
  IQ: ['iraq','baghdad','iraqi','mosul','basra','erbil','fallujah'],
  CO: ['colombia','colombian','bogota','medellin','cali','cartagena'],
  NG: ['nigeria','nigerian','lagos','abuja','kano','ibadan','enugu'],
  IN: ['india','indian','delhi','mumbai','bangalore','chennai','kolkata'],
  BR: ['brazil','brazilian','sao paulo','rio de janeiro','brasilia','salvador'],
  KE: ['kenya','kenyan','nairobi','mombasa','kisumu','nakuru'],
  PH: ['philippines','philippine','manila','davao','cebu','quezon'],
  TR: ['turkey','turkish','istanbul','ankara','izmir','antalya','erdogan'],
  MA: ['morocco','moroccan','casablanca','marrakech','rabat','fez','tangier'],
};

// These outlets cover the whole world — enforce country keyword check
const GLOBAL_OUTLETS = [
  'bbc','al-jazeera','aljazeera','reuters','apnews','ap-news',
  'cnn','theguardian','guardian','nytimes','washingtonpost',
  'france24','dw','euronews','bloomberg','time','newsweek',
];

function isGlobalOutlet(sourceDomain) {
  if (!sourceDomain) return false;
  return GLOBAL_OUTLETS.some(o => sourceDomain.includes(o));
}

function isRelevantToCountry(text, countryCode) {
  const lower = text.toLowerCase();
  const kws = COUNTRY_KEYWORDS[countryCode] || [];
  return kws.some(kw => lower.includes(kw));
}

function isRemoteDomain(sourceDomain) {
  if (!sourceDomain) return false;
  return REMOTE_DOMAINS.some(d => {
    const clean = d.replace(/\./g, '');
    return sourceDomain.replace(/\./g,'').includes(clean);
  });
}

// ── Title deduplication ───────────────────────────────────────────────────────
// Same story appears from Google News + Al Jazeera + BBC simultaneously.
// Normalise and compare first 80 chars to catch these cross-feed duplicates.

const seenTitles = new Map();

function normTitle(title) {
  return title.toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim().slice(0,80);
}

function isDupe(countryCode, title) {
  const key = normTitle(title);
  if (!seenTitles.has(countryCode)) seenTitles.set(countryCode, new Set());
  const seen = seenTitles.get(countryCode);
  if (seen.has(key)) return true;
  seen.add(key);
  return false;
}

// ── RSS fetching & parsing ────────────────────────────────────────────────────

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
  const rawTitle = String(item.title?._ || item.title || '');
  const description = item.description?._ || item.description ||
                      item.summary?._ || item.summary || '';
  const url = item.link?.$ ? item.link.$.href :
              (typeof item.link === 'string' ? item.link : item.guid?._ || item.guid || '');
  const published = item.pubDate || item.published || item.updated || new Date().toISOString();

  // Google News format: "Headline - Publisher Name"  →  split on last " - "
  let title = rawTitle;
  let sourceDomain = null;
  const dashIdx = rawTitle.lastIndexOf(' - ');
  if (dashIdx > 10) {
    title = rawTitle.slice(0, dashIdx).trim();
    sourceDomain = rawTitle.slice(dashIdx + 3).trim().toLowerCase()
      .replace(/\s+/g, '-').replace(/[^a-z0-9.-]/g, '');
  }

  return {
    title: title.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').trim().slice(0,200),
    description: String(description).replace(/<[^>]*>/g,'').trim().slice(0,500),
    url: String(url).trim(),
    published_at: (() => { try { return new Date(published).toISOString(); } catch { return new Date().toISOString(); } })(),
    sourceDomain,
  };
}

// ── Main cache function ───────────────────────────────────────────────────────

async function refreshNewsForCountry(countryCode) {
  const country = COUNTRIES[countryCode];
  if (!country) return;

  // Reset title dedup set for this refresh cycle
  seenTitles.set(countryCode, new Set());

  const config = GOOGLE_NEWS_CONFIG[countryCode] || {
    lang: 'en', gl: countryCode, query: `${country.name} news safety travel`
  };

  let count = 0;

  // ── Primary: Google News RSS ──
  const gnItems = await fetchRSS(googleNewsUrl(config.query, config.lang, config.gl));

  for (const raw of gnItems.slice(0, 15)) {
    const item = extractItem(raw);
    if (!item.title || item.title.length < 10) continue;

    // Block geographically distant outlets
    if (isRemoteDomain(item.sourceDomain)) continue;

    // Global outlets must mention the country by name or major city
    if (isGlobalOutlet(item.sourceDomain)) {
      if (!isRelevantToCountry(item.title + ' ' + item.description, countryCode)) continue;
    }

    // Title dedup — same story from multiple feeds
    if (isDupe(countryCode, item.title)) continue;

    try {
      const loc = extractLocation(item.title + ' ' + item.description, countryCode);
      db.cacheNews.run({
        country_code: countryCode,
        source_name:  item.sourceDomain || 'Google News',
        title:        item.title,
        description:  item.description,
        url:          item.url,
        lat:          loc.lat || null,
        lng:          loc.lng || null,
        published_at: item.published_at,
      });
      count++;
    } catch(e) { /* URL already in DB */ }
  }

  // ── Secondary: country-specific feeds from countries.js ──
  if (country.newsFeed?.length) {
    for (const feed of country.newsFeed) {
      const items = await fetchRSS(feed.url);
      for (const raw of items.slice(0, 6)) {
        const item = extractItem(raw);
        if (!item.title || item.title.length < 10) continue;
        if (isDupe(countryCode, item.title)) continue;
        try {
          const loc = extractLocation(item.title + ' ' + item.description, countryCode);
          db.cacheNews.run({
            country_code: countryCode,
            source_name:  feed.name,
            title:        item.title,
            description:  item.description,
            url:          item.url,
            lat:          loc.lat || null,
            lng:          loc.lng || null,
            published_at: item.published_at,
          });
          count++;
        } catch(e) { /* URL already in DB */ }
      }
    }
  }

  console.log(`  📰 ${countryCode}: cached ${count} news items`);
  return count;
}

async function refreshAllNews() {
  console.log('🗞  Refreshing news feeds...');
  db.clearOldNews.run();

  const codes = Object.keys(COUNTRIES);
  let total = 0;

  for (const code of codes) {
    const n = await refreshNewsForCountry(code);
    total += n || 0;
    await new Promise(r => setTimeout(r, 800));
  }

  console.log(`🗞  News refresh complete — ${total} articles cached across ${codes.length} countries`);
}

async function fetchNewsForAnyCountry(countryName, countryCode) {
  const query = `${countryName} news safety travel security`;
  const url = googleNewsUrl(query, 'en', countryCode || 'US');
  const items = await fetchRSS(url);
  return items.slice(0, 10).map(extractItem).filter(i => i.title.length > 10);
}

module.exports = { refreshAllNews, refreshNewsForCountry, fetchNewsForAnyCountry };

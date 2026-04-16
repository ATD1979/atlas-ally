// Atlas Ally — News Module
// v2026.04.15 — clean slate
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
  JO: { lang: 'en', gl: 'JO', query: '"Jordan" news security safety' },
  LB: { lang: 'en', gl: 'LB', query: '"Lebanon" news security' },
  EG: { lang: 'en', gl: 'EG', query: '"Egypt" news security' },
  IL: { lang: 'en', gl: 'IL', query: '"Israel" news conflict security' },
  IQ: { lang: 'en', gl: 'IQ', query: '"Iraq" news security conflict' },
  MA: { lang: 'en', gl: 'MA', query: '"Morocco" news travel safety' },
  SA: { lang: 'en', gl: 'SA', query: '"Saudi Arabia" news security' },
  AE: { lang: 'en', gl: 'AE', query: '"UAE" OR "Dubai" news security' },
  IR: { lang: 'en', gl: 'IR', query: '"Iran" news security' },
  SY: { lang: 'en', gl: 'SY', query: '"Syria" news conflict security' },
  YE: { lang: 'en', gl: 'YE', query: '"Yemen" news conflict security' },
  LY: { lang: 'en', gl: 'LY', query: '"Libya" news security conflict' },
  TN: { lang: 'en', gl: 'TN', query: '"Tunisia" news security' },
  DZ: { lang: 'en', gl: 'DZ', query: '"Algeria" news security' },
  // Europe
  FR: { lang: 'en', gl: 'FR', query: '"France" news security safety' },
  DE: { lang: 'en', gl: 'DE', query: '"Germany" news security' },
  GB: { lang: 'en', gl: 'GB', query: '"UK" OR "Britain" news safety security' },
  UA: { lang: 'en', gl: 'UA', query: '"Ukraine" war conflict news' },
  TR: { lang: 'en', gl: 'TR', query: '"Turkey" OR "Türkiye" news security' },
  RU: { lang: 'en', gl: 'RU', query: '"Russia" news conflict security' },
  ES: { lang: 'en', gl: 'ES', query: '"Spain" news security' },
  IT: { lang: 'en', gl: 'IT', query: '"Italy" news security' },
  PL: { lang: 'en', gl: 'PL', query: '"Poland" news security' },
  GR: { lang: 'en', gl: 'GR', query: '"Greece" news security' },
  RS: { lang: 'en', gl: 'RS', query: '"Serbia" news security Balkans' },
  // Americas
  US: { lang: 'en', gl: 'US', query: '"United States" news safety security crime' },
  MX: { lang: 'en', gl: 'MX', query: '"Mexico" safety security crime news' },
  BR: { lang: 'en', gl: 'BR', query: '"Brazil" news safety security' },
  CO: { lang: 'en', gl: 'CO', query: '"Colombia" news safety security' },
  VE: { lang: 'en', gl: 'VE', query: '"Venezuela" news crisis security' },
  AR: { lang: 'en', gl: 'AR', query: '"Argentina" news security' },
  HT: { lang: 'en', gl: 'HT', query: '"Haiti" news crisis security' },
  GT: { lang: 'en', gl: 'GT', query: '"Guatemala" news safety security' },
  HN: { lang: 'en', gl: 'HN', query: '"Honduras" news safety security' },
  // Asia Pacific
  IN: { lang: 'en', gl: 'IN', query: '"India" news security safety' },
  PK: { lang: 'en', gl: 'PK', query: '"Pakistan" news security conflict' },
  JP: { lang: 'en', gl: 'JP', query: '"Japan" news security safety' },
  CN: { lang: 'en', gl: 'CN', query: '"China" news security' },
  TH: { lang: 'en', gl: 'TH', query: '"Thailand" news travel safety' },
  PH: { lang: 'en', gl: 'PH', query: '"Philippines" news security' },
  KR: { lang: 'en', gl: 'KR', query: '"South Korea" news security' },
  ID: { lang: 'en', gl: 'ID', query: '"Indonesia" news security' },
  MM: { lang: 'en', gl: 'MM', query: '"Myanmar" OR "Burma" news conflict security' },
  BD: { lang: 'en', gl: 'BD', query: '"Bangladesh" news security' },
  NP: { lang: 'en', gl: 'NP', query: '"Nepal" news security' },
  AF: { lang: 'en', gl: 'AF', query: '"Afghanistan" news security conflict' },
  // Africa
  NG: { lang: 'en', gl: 'NG', query: '"Nigeria" news security conflict' },
  ZA: { lang: 'en', gl: 'ZA', query: '"South Africa" news safety security' },
  KE: { lang: 'en', gl: 'KE', query: '"Kenya" news security' },
  ET: { lang: 'en', gl: 'ET', query: '"Ethiopia" news conflict security' },
  SO: { lang: 'en', gl: 'SO', query: '"Somalia" news security conflict' },
  SD: { lang: 'en', gl: 'SD', query: '"Sudan" news conflict security' },
  CD: { lang: 'en', gl: 'CD', query: '"Congo" OR "DRC" news conflict security' },
  ML: { lang: 'en', gl: 'ML', query: '"Mali" news security conflict' },
  GH: { lang: 'en', gl: 'GH', query: '"Ghana" news security' },
  TZ: { lang: 'en', gl: 'TZ', query: '"Tanzania" news security' },
};

// Country-specific drug/crime supplement queries
const DRUG_QUERIES = {
  JO: '"Jordan" (captagon OR drug OR trafficking OR narcotics OR hashish OR smuggling OR seized)',
  SY: '"Syria" (captagon OR drug OR trafficking OR narcotics OR hashish)',
  LB: '"Lebanon" (captagon OR drug OR trafficking OR narcotics OR hashish)',
  MX: '"Mexico" (cartel OR drug OR cocaine OR fentanyl OR narco OR trafficking)',
  CO: '"Colombia" (cocaine OR drug OR cartel OR trafficking OR narco)',
  AF: '"Afghanistan" (heroin OR opium OR drug OR poppy OR trafficking)',
  PK: '"Pakistan" (heroin OR drug OR trafficking OR narcotics)',
  MM: '"Myanmar" (methamphetamine OR drug OR golden triangle OR trafficking)',
  PH: '"Philippines" (shabu OR drug OR methamphetamine OR trafficking)',
  TH: '"Thailand" (drug OR methamphetamine OR trafficking OR golden triangle)',
  NG: '"Nigeria" (drug OR cocaine OR heroin OR trafficking)',
  ET: '"Ethiopia" (khat OR drug OR trafficking)',
  KE: '"Kenya" (drug OR heroin OR trafficking OR cocaine)',
  BR: '"Brazil" (drug OR cocaine OR gang OR trafficking OR cartel)',
  VE: '"Venezuela" (drug OR cocaine OR trafficking OR cartel)',
  HN: '"Honduras" (drug OR cartel OR trafficking OR gang)',
  GT: '"Guatemala" (drug OR cartel OR trafficking)',
};

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

// Country-specific keywords — article title must contain at least one to be cached.
// Prevents "Jordan Peterson", "Michael Jordan", etc. from polluting JO feed.
const COUNTRY_TITLE_KEYWORDS = {
  JO: ['jordan','jordanian','amman','zarqa','aqaba','irbid','petra','wadi rum','hashemite'],
  LB: ['lebanon','lebanese','beirut','tripoli','sidon','tyre','hezbollah'],
  IL: ['israel','israeli','jerusalem','tel aviv','gaza','haifa','netanyahu','idf'],
  SY: ['syria','syrian','damascus','aleppo','homs','idlib'],
  IQ: ['iraq','iraqi','baghdad','mosul','basra','erbil','kurdistan'],
  EG: ['egypt','egyptian','cairo','alexandria','sinai'],
  SA: ['saudi','riyadh','jeddah','mecca','medina','aramco'],
  AE: ['uae','dubai','abu dhabi','emirati','emirates'],
  TR: ['turkey','turkish','türkiye','ankara','istanbul','erdogan'],
  IR: ['iran','iranian','tehran','isfahan','khamenei','rouhani'],
  YE: ['yemen','yemeni','sanaa','aden','houthi'],
  LY: ['libya','libyan','tripoli','benghazi'],
  MA: ['morocco','moroccan','rabat','casablanca','marrakech'],
  DZ: ['algeria','algerian','algiers','oran'],
  TN: ['tunisia','tunisian','tunis'],
  UA: ['ukraine','ukrainian','kyiv','kharkiv','odessa','zelensky','zelenskyy'],
  RU: ['russia','russian','moscow','kremlin','putin'],
  PK: ['pakistan','pakistani','islamabad','karachi','lahore','peshawar'],
  AF: ['afghanistan','afghan','kabul','kandahar','taliban'],
  IN: ['india','indian','delhi','mumbai','modi','bangladesh'], // IN/BD often confused
  MX: ['mexico','mexican','cartel','sinaloa','jalisco','juarez','tijuana'],
  CO: ['colombia','colombian','bogota','medellin','farc','coca'],
  BR: ['brazil','brazilian','brasilia','rio','sao paulo'],
  VE: ['venezuela','venezuelan','caracas','maduro'],
  NG: ['nigeria','nigerian','abuja','lagos','boko haram'],
  KE: ['kenya','kenyan','nairobi','mombasa'],
  ET: ['ethiopia','ethiopian','addis ababa','tigray'],
  SO: ['somalia','somali','mogadishu','al shabaab'],
  SD: ['sudan','sudanese','khartoum','darfur'],
  ZA: ['south africa','south african','johannesburg','cape town','pretoria','zuma','ramaphosa'],
  US: ['united states','american','washington','new york','trump','biden','harris','congress'],
  GB: ['uk','britain','british','london','england','scotland','wales','sunak'],
  FR: ['france','french','paris','macron','lyon','marseille'],
  DE: ['germany','german','berlin','munich','scholz'],
  PH: ['philippines','philippine','manila','duterte','marcos','shabu'],
  TH: ['thailand','thai','bangkok','pattaya','chiang mai'],
  MM: ['myanmar','burma','burmese','yangon','naypyidaw','junta'],
  KR: ['south korea','korean','seoul','yoon'],
  JP: ['japan','japanese','tokyo','osaka','kishida'],
  CN: ['china','chinese','beijing','shanghai','xi jinping','ccp'],
  ID: ['indonesia','indonesian','jakarta','bali'],
  BD: ['bangladesh','bangladeshi','dhaka'],
  NP: ['nepal','nepalese','kathmandu'],
  HT: ['haiti','haitian','port-au-prince'],
  HN: ['honduras','honduran','tegucigalpa'],
  GT: ['guatemala','guatemalan','guatemala city'],
  CD: ['congo','drc','kinshasa','democratic republic'],
  ML: ['mali','malian','bamako'],
  GH: ['ghana','ghanaian','accra'],
  TZ: ['tanzania','tanzanian','dar es salaam'],
  PL: ['poland','polish','warsaw','krakow'],
  GR: ['greece','greek','athens','thessaloniki'],
  RS: ['serbia','serbian','belgrade'],
  IT: ['italy','italian','rome','milan','naples'],
  ES: ['spain','spanish','madrid','barcelona'],
  AR: ['argentina','argentine','buenos aires'],
};

// Returns true if the article title is relevant to the target country
function isTitleRelevant(title, countryCode, countryName) {
  const t = (title || '').toLowerCase();
  const keywords = COUNTRY_TITLE_KEYWORDS[countryCode] || [countryName.toLowerCase()];
  return keywords.some(kw => t.includes(kw));
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

async function refreshNewsForCountry(countryCode, langOverride) {
  const country = COUNTRIES[countryCode];
  if (!country) return 0;

  const config = GOOGLE_NEWS_CONFIG[countryCode] || {
    lang: 'en', gl: countryCode, query: `"${country.name}" news safety travel`
  };

  const lang = langOverride || config.lang || 'en';
  let count  = 0;
  const seen = new Set();

  // Helper to fetch and cache a batch of RSS items
  async function fetchAndCache(gnUrl, label) {
    const items = await fetchRSS(gnUrl);
    for (const raw of items.slice(0, 15)) {
      const item = extractItem(raw);
      if (!item.title || item.title.length < 10) continue;
      if (isRemoteSource(item)) continue;
      if (!isTitleRelevant(item.title, countryCode, country.name)) continue; // skip off-topic
      const titleKey = item.title.toLowerCase().slice(0, 60);
      if (seen.has(item.url) || seen.has(titleKey)) continue;
      seen.add(item.url); seen.add(titleKey);
      try {
        const loc = extractLocation(item.title + ' ' + item.description, countryCode);
        db.cacheNews.run({
          country_code: countryCode, lang,
          source_name:  item.sourceDomain || label,
          title:        item.title, description: item.description,
          url:          item.url,
          lat: loc?.lat || null, lng: loc?.lng || null,
          published_at: item.published_at,
        });
        count++;
      } catch (e) { /* duplicate */ }
    }
  }

  // Primary: general safety/security news in user's language
  await fetchAndCache(googleNewsUrl(config.query, lang, config.gl), 'Google News');

  // Secondary: crime & drug focused query (always English for classifier accuracy)
  const crimeName = country.name;
  const crimeQuery = `"${crimeName}" (drug trafficking OR narcotics OR cartel OR crime OR murder OR gang OR smuggling OR seizure OR arrest OR robbery)`;
  await fetchAndCache(googleNewsUrl(crimeQuery, 'en', config.gl), 'Google News Crime');

  // Tertiary: conflict/violence query
  const conflictQuery = `"${crimeName}" (attack OR explosion OR conflict OR violence OR protest OR military OR troops OR airstrike)`;
  await fetchAndCache(googleNewsUrl(conflictQuery, 'en', config.gl), 'Google News Conflict');

  // Quaternary: country-specific drug keywords (captagon, khat, etc.)
  const drugQuery = DRUG_QUERIES[countryCode] || `"${crimeName}" (drug OR narcotic OR trafficking OR seizure)`;
  await fetchAndCache(googleNewsUrl(drugQuery, 'en', config.gl), 'Google News Drugs');

  // Country-specific RSS feeds if defined
  if (country.newsFeed?.length) {
    for (const feed of country.newsFeed) {
      const items = await fetchRSS(feed.url);
      for (const raw of items.slice(0, 6)) {
        const item = extractItem(raw);
        if (!item.title || item.title.length < 10) continue;
        const titleKey = item.title.toLowerCase().slice(0, 60);
        if (seen.has(item.url) || seen.has(titleKey)) continue;
        seen.add(item.url); seen.add(titleKey);
        try {
          const loc = extractLocation(item.title + ' ' + item.description, countryCode);
          db.cacheNews.run({
            country_code: countryCode, lang,
            source_name:  feed.name,
            title:        item.title, description: item.description,
            url:          item.url,
            lat: loc?.lat || null, lng: loc?.lng || null,
            published_at: item.published_at,
          });
          count++;
        } catch (e) { /* duplicate */ }
      }
    }
  }

  console.log(`  📰 ${countryCode} [${lang}]: cached ${count} news items`);
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

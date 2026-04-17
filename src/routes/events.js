// Atlas Ally — Events routes
// Endpoint: GET /api/events
//
// Returns stored security events merged with a live Google News "security" fetch
// in the user's language, plus a 7-day rolling stats summary. Deduped by source_url.

const router = require('express').Router();
const db = require('../db');
const { fetchRSS } = require('../lib/rss');
const { getCountryName } = require('../lib/countries-meta');
const { classifyEvent, EVENT_TYPE_TO_FEED_CAT } = require('../lib/classify');

// Per-language "security" query fragments for the live Google News augmentation.
// English gets 5 angled queries for breadth; other languages get one.
const SECURITY_QUERIES = {
  en: [
    'attack OR explosion OR shooting OR bombing OR airstrike OR missile',
    'protest OR riot OR unrest OR demonstration OR clash',
    'drug OR trafficking OR crime OR murder OR arrested OR seized',
    'earthquake OR flood OR fire OR disaster OR emergency',
    'security OR military OR troops OR border OR threat OR warning',
  ],
  ar: ['هجوم OR انفجار OR صاروخ OR احتجاج OR مخدرات OR جريمة OR كارثة OR تحذير OR أمن'],
  fr: ['attaque OR explosion OR missile OR manifestation OR crime OR catastrophe OR alerte OR sécurité'],
  es: ['ataque OR explosión OR misil OR protesta OR crimen OR catástrofe OR alerta OR seguridad'],
  pt: ['ataque OR explosão OR míssil OR protesto OR crime OR desastre OR alerta OR segurança'],
  ru: ['атака OR взрыв OR ракета OR протест OR преступление OR катастрофа OR предупреждение OR безопасность'],
  zh: ['袭击 OR 爆炸 OR 导弹 OR 抗议 OR 犯罪 OR 灾难 OR 警报 OR 安全'],
  de: ['Angriff OR Explosion OR Rakete OR Protest OR Verbrechen OR Katastrophe OR Warnung OR Sicherheit'],
  ja: ['攻撃 OR 爆発 OR ミサイル OR 抗議 OR 犯罪 OR 災害 OR 警告 OR 安全'],
  ko: ['공격 OR 폭발 OR 미사일 OR 시위 OR 범죄 OR 재난 OR 경고 OR 보안'],
  tr: ['saldırı OR patlama OR füze OR protesto OR suç OR afet OR uyarı OR güvenlik'],
  hi: ['हमला OR विस्फोट OR मिसाइल OR विरोध OR अपराध OR आपदा OR चेतावनी OR सुरक्षा'],
};

// Fetch security-flavoured news and shape it like a stored event row.
async function fetchSecurityNewsInLang(countryName, countryCode, lang) {
  const gl = countryCode.toUpperCase();
  const queryTerms = SECURITY_QUERIES[lang] || SECURITY_QUERIES.en;
  const queries = queryTerms.map(q => `${countryName} ${q}`);

  const urls = queries.map(q =>
    `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=${lang}&gl=${gl}&ceid=${gl}:${lang}`
  );

  const batches = await Promise.all(urls.map(u => fetchRSS(u)));
  const allItems = batches.flat();
  const seen = new Set();
  const results = [];

  for (const item of allItems) {
    const raw = item.title;
    if (!raw) continue;
    const dash = raw.lastIndexOf(' - ');
    const title = (dash > 10 ? raw.slice(0, dash) : raw).replace(/<[^>]*>/g, '').trim();
    const source = dash > 10 ? raw.slice(dash + 3).trim() : 'Google News';
    const url = item.link;
    const key = title.toLowerCase().slice(0, 60);

    if (title.length < 10 || (url && seen.has(url)) || seen.has(key)) continue;
    if (url) seen.add(url);
    seen.add(key);

    let published = new Date().toISOString();
    try {
      const d = new Date(item.published);
      if (!isNaN(d.getTime())) published = d.toISOString();
    } catch {}

    const { type, severity } = classifyEvent(title);
    results.push({
      id:           `gnews-${Buffer.from(url || title).toString('base64').slice(0, 20)}`,
      country_code: countryCode,
      type, severity,
      title:        title.slice(0, 200),
      description:  '',
      location:     countryName,
      lat: null, lng: null,
      source,
      source_url:   url,
      created_at:   published,
      status:       'approved',
      is_gnews:     true,
    });
  }

  console.log(`Security news ${countryCode} [${lang}]: ${results.length} from ${allItems.length} raw`);
  return results;
}

router.get('/events', async (req, res) => {
  const { country_code, lat, lng, lang = 'en' } = req.query;
  if (!country_code) return res.status(400).json({ error: 'country_code required' });
  const code = country_code.toUpperCase();
  const countryName = getCountryName(code);

  // Stored events from DB
  let stored = [];
  try { stored = db.getEventsByCountry.all(code); } catch {}

  // If DB is empty, nudge the ingest job (fire-and-forget, wrapped — the
  // service can be slow or not loaded)
  if (!stored.length) {
    try {
      const { ingestSecurityEvents } = require('../services/events-ingest');
      ingestSecurityEvents().catch(() => {});
    } catch {}
  }

  // Augment with live Google News
  let gnews = [];
  try { gnews = await fetchSecurityNewsInLang(countryName, code, lang); } catch (e) {
    console.error(`Security news fetch failed for ${code}:`, e.message);
  }

  // Dedupe stored vs gnews by source_url
  const seen = new Set(stored.map(e => e.source_url).filter(Boolean));
  const merged = [...stored, ...gnews.filter(e => e.source_url && !seen.has(e.source_url))];
  merged.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  // 7-day rolling stats
  const sevenAgo = Date.now() - 7 * 86400e3;
  const last7 = merged.filter(e => new Date(e.created_at || 0).getTime() > sevenAgo);

  const catCounts = {};
  last7.forEach(ev => {
    const cat = EVENT_TYPE_TO_FEED_CAT[ev.type] || 'other';
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  });

  const stats7d = {
    total:       last7.length,
    per_day:     parseFloat((last7.length / 7).toFixed(1)),
    by_category: catCounts,
    critical:    last7.filter(e => e.severity === 'critical').length,
    high:        last7.filter(e => e.severity === 'high').length,
  };

  // GPS sort
  const userLat = parseFloat(lat), userLng = parseFloat(lng);
  if (!isNaN(userLat) && !isNaN(userLng)) {
    const { distanceKm, COUNTRY_CENTERS } = require('../geocoder');
    const center = COUNTRY_CENTERS[code] || { lat: userLat, lng: userLng };
    const enriched = merged.map(ev => ({
      ...ev,
      distance_km: Math.round(distanceKm(userLat, userLng, ev.lat || center.lat, ev.lng || center.lng)),
    })).sort((a, b) => a.distance_km - b.distance_km);
    return res.json({ events: enriched, stats7d });
  }

  res.json({ events: merged, stats7d });
});

module.exports = router;

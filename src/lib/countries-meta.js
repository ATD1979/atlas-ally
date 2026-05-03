// Atlas Ally — Unified country metadata
// Single source of truth for country name, aliases (for news relevance filtering),
// region-specific drug keywords (for crime classification), and UCDP conflict-data
// country codes. Replaces four separate tables that used to live in news.js and data.js.
//
// `src/countries.js` stays the source for rich per-country app data (embassies, border
// crossings, advisory levels etc.). This file is only the flat lookup needed by the
// news/events/crime pipeline.
//
// Schema v2 (N20): aliases split into `strong` and `weak` tiers.
//   strong = country-specific terms with no significant English-language collision
//   weak   = polysemous tokens (names, common words) requiring further context
//
// Cache-write pipeline (in news.js): strong→keep, none→drop, weak→LLM disambiguate.
// Serve-time check (in routes/news.js): boolean isRelevantToCountry, trusts cache-write
// decisions and uses cheap word-boundary regex.

const config = require('../config');
const { fetchWithTimeout } = require('./http');

const ANTHROPIC_API_KEY = config.ANTHROPIC_API_KEY;
const LLM_MODEL         = 'claude-haiku-4-5';
const LLM_TIMEOUT_MS    = 10000; // classification calls should be fast

const META = {
  AF: { name: 'Afghanistan',    strong: ['afghanistan','afghan','kabul','taliban'],                                   drug: ['heroin','opium','poppy','taliban drug','afghan drug'],              ucdp: 700 },
  AE: { name: 'UAE',            strong: ['uae','dubai','abu dhabi','emirati','emirates'] },
  AR: { name: 'Argentina',      strong: ['argentina','argentine','buenos aires'] },
  AU: { name: 'Australia',      strong: ['australia','australian','sydney','melbourne','canberra'] },
  BD: { name: 'Bangladesh',     strong: ['bangladesh','bangladeshi','dhaka'] },
  BR: { name: 'Brazil',         strong: ['brazil','brazilian','brasilia','rio','sao paulo','são paulo'],              drug: ['cocaine','drug','favela','gang','trafficking'],                      ucdp: 140 },
  CA: { name: 'Canada',         strong: ['canada','canadian','ottawa','toronto','montreal'] },
  CD: { name: 'DR Congo',       strong: ['congo','congolese','kinshasa','dr congo'] },
  CN: { name: 'China',          strong: ['china','chinese','beijing','shanghai'] },
  CO: { name: 'Colombia',       strong: ['colombia','colombian','bogota','medellin','farc'],                          drug: ['cocaine','farc','drug','narco','cartel','trafficking'],              ucdp: 100 },
  DE: { name: 'Germany',        strong: ['germany','german','berlin','munich'] },
  DZ: { name: 'Algeria',        strong: ['algeria','algerian','algiers'] },
  EG: { name: 'Egypt',          strong: ['egypt','egyptian','cairo','alexandria','sinai'],                                                                                                       ucdp: 651 },
  ET: { name: 'Ethiopia',       strong: ['ethiopia','ethiopian','addis ababa'],                                       drug: ['khat','qat','ethiopia drug'],                                        ucdp: 530 },
  FR: { name: 'France',         strong: ['france','french','paris','macron'] },
  GB: { name: 'United Kingdom', strong: ['uk','britain','british','london','england','united kingdom'] },
  GH: { name: 'Ghana',          strong: ['ghana','ghanaian','accra'] },
  GT: { name: 'Guatemala',      strong: ['guatemala','guatemalan','guatemala city'],                                                                                                             ucdp: 90 },
  HN: { name: 'Honduras',       strong: ['honduras','honduran','tegucigalpa'],                                                                                                                   ucdp: 91 },
  HT: { name: 'Haiti',          strong: ['haiti','haitian','port-au-prince'],                                                                                                                    ucdp: 41 },
  ID: { name: 'Indonesia',      strong: ['indonesia','indonesian','jakarta'] },
  IL: { name: 'Israel',         strong: ['israel','israeli','jerusalem','tel aviv','gaza','haifa','idf'],                                                                                        ucdp: 666 },
  IN: { name: 'India',          strong: ['india','indian','delhi','mumbai','new delhi'],                              drug: ['ganja','opium','drug','india drug'],                                 ucdp: 750 },
  IQ: { name: 'Iraq',           strong: ['iraq','iraqi','baghdad','mosul','basra','erbil'],                                                                                                      ucdp: 645 },
  IR: { name: 'Iran',           strong: ['iran','iranian','tehran','isfahan','khamenei'] },
  IT: { name: 'Italy',          strong: ['italy','italian','rome','milan'] },

  // N20: 'jordan' and 'petra' moved to weak tier — both collide with English-language
  // names (Michael Jordan, Jordan Peterson, Petra Kvitova, etc.). LLM disambiguates.
  JO: { name: 'Jordan',         strong: ['jordanian','amman','zarqa','aqaba','irbid','wadi rum','hashemite','king abdullah'],
                                weak:   ['jordan','petra'],
                                drug:   ['captagon','tramadol','hashish','jordan drug','amman drug'],                                                                                            ucdp: 116 },

  JP: { name: 'Japan',          strong: ['japan','japanese','tokyo'] },
  KE: { name: 'Kenya',          strong: ['kenya','kenyan','nairobi','mombasa'],                                       drug: ['khat','heroin','kenya drug'],                                        ucdp: 501 },
  KR: { name: 'South Korea',    strong: ['south korea','korean','seoul'] },
  LB: { name: 'Lebanon',        strong: ['lebanon','lebanese','beirut','tripoli','sidon','hezbollah'],                drug: ['captagon','hashish','lebanon drug'],                                 ucdp: 660 },
  LY: { name: 'Libya',          strong: ['libya','libyan','tripoli','benghazi'],                                                                                                                 ucdp: 620 },
  MA: { name: 'Morocco',        strong: ['morocco','moroccan','rabat','casablanca','marrakech'],                                                                                                 ucdp: 600 },
  ML: { name: 'Mali',           strong: ['mali','malian','bamako'],                                                                                                                              ucdp: 432 },
  MM: { name: 'Myanmar',        strong: ['myanmar','burma','burmese','yangon'],                                       drug: ['heroin','methamphetamine','golden triangle','myanmar drug'],         ucdp: 775 },
  MX: { name: 'Mexico',         strong: ['mexico','mexican','mexico city','cartel','sinaloa','jalisco'],              drug: ['cartel','sinaloa','jalisco','fentanyl','cocaine','drug war','narco'],ucdp: 70  },
  NG: { name: 'Nigeria',        strong: ['nigeria','nigerian','abuja','lagos','boko haram'],                          drug: ['heroin','cocaine','nigeria drug','drug trafficking'],                ucdp: 475 },
  NP: { name: 'Nepal',          strong: ['nepal','nepali','kathmandu'] },
  PH: { name: 'Philippines',    strong: ['philippines','philippine','manila','shabu'],                                drug: ['shabu','meth','drug war','duterte','philippines drug'],              ucdp: 840 },
  PK: { name: 'Pakistan',       strong: ['pakistan','pakistani','islamabad','karachi','lahore'],                      drug: ['heroin','opium','afghanistan border','pakistan drug'],               ucdp: 770 },
  PL: { name: 'Poland',         strong: ['poland','polish','warsaw'] },
  RU: { name: 'Russia',         strong: ['russia','russian','moscow','kremlin','putin'] },
  SA: { name: 'Saudi Arabia',   strong: ['saudi','riyadh','jeddah','mecca','medina','aramco'] },
  SD: { name: 'Sudan',          strong: ['sudan','sudanese','khartoum'] },
  SO: { name: 'Somalia',        strong: ['somalia','somali','mogadishu'],                                             drug: ['khat','somalia drug'] },
  SY: { name: 'Syria',          strong: ['syria','syrian','damascus','aleppo','homs','idlib'],                        drug: ['captagon','hashish','syria drug'],                                   ucdp: 652 },
  TH: { name: 'Thailand',       strong: ['thailand','thai','bangkok'],                                                drug: ['methamphetamine','ya ba','thailand drug','golden triangle'] },
  TN: { name: 'Tunisia',        strong: ['tunisia','tunisian','tunis'] },
  TR: { name: 'Turkey',         strong: ['turkey','turkish','türkiye','ankara','istanbul'],                                                                                                      ucdp: 640 },
  TZ: { name: 'Tanzania',       strong: ['tanzania','tanzanian','dodoma','dar es salaam'] },
  UA: { name: 'Ukraine',        strong: ['ukraine','ukrainian','kyiv','kiev','kharkiv','odessa','zelensky'],                                                                                     ucdp: 369 },
  US: { name: 'United States',  strong: ['united states','american','washington','new york','usa'] },
  VE: { name: 'Venezuela',      strong: ['venezuela','venezuelan','caracas'] },
  YE: { name: 'Yemen',          strong: ['yemen','yemeni','sanaa','aden','houthi'],                                                                                                              ucdp: 678 },
  ZA: { name: 'South Africa',   strong: ['south africa','south african','johannesburg','cape town'] },
};

// ── Accessors ────────────────────────────────────────────────────────────────

function getCountryMeta(code)   { return META[String(code || '').toUpperCase()] || null; }
function getCountryName(code)   { return (getCountryMeta(code) || {}).name || code; }
function getStrongAliases(code) { return (getCountryMeta(code) || {}).strong || []; }
function getWeakAliases(code)   { return (getCountryMeta(code) || {}).weak || []; }

// Back-compat: combine strong + weak. Any caller that previously read `aliases` gets
// the full list, preserving prior behavior.
function getAliases(code) {
  const meta = getCountryMeta(code);
  if (!meta) return [String(code || '').toLowerCase()];
  return [...(meta.strong || []), ...(meta.weak || [])];
}

function getDrugKeywords(code)  { return (getCountryMeta(code) || {}).drug || []; }
function getUcdpCode(code)      { return (getCountryMeta(code) || {}).ucdp || null; }

// ── Relevance matching ───────────────────────────────────────────────────────

// Build a word-boundary regex for an alias. Handles multi-word aliases ('wadi rum',
// 'sao paulo'), hyphenated aliases ('port-au-prince'), and non-ASCII chars ('türkiye',
// 'são paulo') — \b only fires on the ASCII-side word boundaries, which is sufficient
// for the cases we have.
function aliasRegex(alias) {
  const escaped = String(alias).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

// Cheap pre-LLM tier classification.
// Returns 'strong' | 'weak' | 'none' based on word-boundary alias matches.
function classifyRelevance(text, code) {
  const meta = getCountryMeta(code);
  if (!meta) return 'none';
  const lower = String(text || '').toLowerCase();
  const strong = meta.strong || [];
  const weak   = meta.weak   || [];
  if (strong.some(a => aliasRegex(a).test(lower))) return 'strong';
  if (weak.some(a => aliasRegex(a).test(lower)))   return 'weak';
  return 'none';
}

// Boolean form, used by serve-time filter in routes/news.js.
// Returns true for any alias hit (strong or weak). The cache-write pipeline is
// responsible for ensuring weak-only matches in the DB have already been LLM-vetted
// before insert.
function isRelevantToCountry(text, code) {
  return classifyRelevance(text, code) !== 'none';
}

// ── LLM disambiguation for weak matches ──────────────────────────────────────

// In-memory LRU cache for LLM verdicts. Keyed by `${code}|${url}` (URL is the most
// stable per-article identifier and Google News results are URL-stable across
// refreshes). 10K entries ≈ a few MB max. Wipes on process restart.
const _LLM_CACHE_MAX = 10000;
const _llmCache = new Map();

function _cacheGet(key) {
  if (!_llmCache.has(key)) return undefined;
  const v = _llmCache.get(key);
  // Refresh recency
  _llmCache.delete(key);
  _llmCache.set(key, v);
  return v;
}
function _cacheSet(key, v) {
  _llmCache.set(key, v);
  if (_llmCache.size > _LLM_CACHE_MAX) {
    const oldest = _llmCache.keys().next().value;
    _llmCache.delete(oldest);
  }
}

// Returns true if the LLM judges the text genuinely about the country.
// Fail-closed: any error or non-2xx returns false (article dropped). Avoids leaking
// noise during transient API outages.
//
// Uses fetchWithTimeout from lib/http to match the Pack Assistant pattern.
async function llmIsRelevantToCountry(text, code, url = null) {
  const meta = getCountryMeta(code);
  if (!meta) return false;

  const cacheKey = `${code}|${url || String(text).slice(0, 80)}`;
  const cached = _cacheGet(cacheKey);
  if (cached !== undefined) return cached;

  if (!ANTHROPIC_API_KEY) {
    console.error(`[news/relevance] ANTHROPIC_API_KEY not configured — skipping LLM check for ${code}`);
    return false;
  }

  try {
    const r = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      LLM_MODEL,
        max_tokens: 8,
        system:
          'Classify whether a news headline is genuinely about a specific country, ' +
          'as opposed to a person, place, or product that shares a name with the country. ' +
          'Respond with exactly one word: "yes" or "no".',
        messages: [{
          role: 'user',
          content: `Country: ${meta.name}\nText: ${String(text || '').slice(0, 400)}\n\nIs this article about ${meta.name} the country?`,
        }],
      }),
    }, LLM_TIMEOUT_MS);

    if (!r.ok) {
      const errText = await r.text().catch(() => '');
      console.error(`[news/relevance] Anthropic API ${r.status} for ${code}:`, errText.slice(0, 200));
      return false;
    }

    const data = await r.json();
    const block = (data.content || []).find(b => b.type === 'text');
    const answer = (block?.text || '').trim().toLowerCase();
    const verdict = answer.startsWith('yes');
    _cacheSet(cacheKey, verdict);
    return verdict;
  } catch (e) {
    console.error(`[news/relevance] LLM check failed for ${code}:`, e.message);
    return false;
  }
}

// ── Noise filter ─────────────────────────────────────────────────────────────

// Country-specific noise pre-filter for news/events titles. Free, runs before LLM,
// catches obvious collisions without spending tokens. JO-only today; other countries
// return true unconditionally.
//
// N20 cleanup: removed `\bgame\b` and `\bcourt\b` (false positives — Jordanian
// constitutional court coverage was being filtered out). Added missing names that
// surfaced in v6.26 audit (jordan love, jordan mailata, jordan belfort,
// jordan burroughs).
//
// Returns true if the title passes (should be kept), false if it's noise (should be
// dropped).
function passesNoiseFilter(title, code) {
  if (code !== 'JO') return true;
  const t = String(title || '').toLowerCase();
  // Generic sports / product / motorsport terms (no game/court — too aggressive)
  if (/\b(basketball|nba|wnba|sneaker|sports|athlete|premier league|champions league|nascar|racing)\b/.test(t)) {
    return false;
  }
  // Specific named people who collide with "Jordan"
  if (/\b(michael jordan|air jordan|jordan brand|jordan peterson|simon jordan|eddie jordan|jordan henderson|jordan pickford|jordan spieth|jordan clarkson|jordan poole|deandre jordan|vernon jordan|barbara jordan|jordan davis|jordan love|jordan mailata|jordan belfort|jordan burroughs)\b/.test(t)) {
    return false;
  }
  // Place names that share "Jordan" but aren't Jordan-the-country (N20 follow-up:
  // West Jordan UT, Jordan Valley West Bank context, etc. observed in production
  // smoke test). Tradeoff: a strong-tier article that legitimately uses one of
  // these phrases for the Jordanian side of the border will also be filtered;
  // acceptable until a counter-example surfaces.
  if (/\b(west jordan|south jordan|east jordan|jordan valley|jordan creek|jordan lake|jordan, minnesota|jordan, montana|jordan, utah|jordan, new york)\b/.test(t)) {
    return false;
  }
  return true;
}

module.exports = {
  META,
  getCountryMeta,
  getCountryName,
  getAliases,
  getStrongAliases,
  getWeakAliases,
  getDrugKeywords,
  getUcdpCode,
  classifyRelevance,
  isRelevantToCountry,
  llmIsRelevantToCountry,
  passesNoiseFilter,
};

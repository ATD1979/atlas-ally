// Atlas Ally — Unified country metadata
// Single source of truth for country name, aliases (for news relevance filtering),
// region-specific drug keywords (for crime classification), and UCDP conflict-data
// country codes. Replaces four separate tables that used to live in news.js and data.js.
//
// `src/countries.js` stays the source for rich per-country app data (embassies, border
// crossings, advisory levels etc.). This file is only the flat lookup needed by the
// news/events/crime pipeline.

const META = {
  AF: { name: 'Afghanistan',    aliases: ['afghanistan','afghan','kabul','taliban'],                     drug: ['heroin','opium','poppy','taliban drug','afghan drug'],              ucdp: 700 },
  AE: { name: 'UAE',            aliases: ['uae','dubai','abu dhabi','emirati','emirates'] },
  AR: { name: 'Argentina',      aliases: ['argentina','argentine','buenos aires'] },
  AU: { name: 'Australia',      aliases: ['australia','australian','sydney','melbourne','canberra'] },
  BD: { name: 'Bangladesh',     aliases: ['bangladesh','bangladeshi','dhaka'] },
  BR: { name: 'Brazil',         aliases: ['brazil','brazilian','brasilia','rio','sao paulo','são paulo'], drug: ['cocaine','drug','favela','gang','trafficking'],                    ucdp: 140 },
  CA: { name: 'Canada',         aliases: ['canada','canadian','ottawa','toronto','montreal'] },
  CD: { name: 'DR Congo',       aliases: ['congo','congolese','kinshasa','dr congo'] },
  CN: { name: 'China',          aliases: ['china','chinese','beijing','shanghai'] },
  CO: { name: 'Colombia',       aliases: ['colombia','colombian','bogota','medellin','farc'],            drug: ['cocaine','farc','drug','narco','cartel','trafficking'],              ucdp: 100 },
  DE: { name: 'Germany',        aliases: ['germany','german','berlin','munich'] },
  DZ: { name: 'Algeria',        aliases: ['algeria','algerian','algiers'] },
  EG: { name: 'Egypt',          aliases: ['egypt','egyptian','cairo','alexandria','sinai'],                                                                                        ucdp: 651 },
  ET: { name: 'Ethiopia',       aliases: ['ethiopia','ethiopian','addis ababa'],                         drug: ['khat','qat','ethiopia drug'],                                        ucdp: 530 },
  FR: { name: 'France',         aliases: ['france','french','paris','macron'] },
  GB: { name: 'United Kingdom', aliases: ['uk','britain','british','london','england','united kingdom'] },
  GH: { name: 'Ghana',          aliases: ['ghana','ghanaian','accra'] },
  GT: { name: 'Guatemala',      aliases: ['guatemala','guatemalan','guatemala city'],                                                                                              ucdp: 90 },
  HN: { name: 'Honduras',       aliases: ['honduras','honduran','tegucigalpa'],                                                                                                    ucdp: 91 },
  HT: { name: 'Haiti',          aliases: ['haiti','haitian','port-au-prince'],                                                                                                     ucdp: 41 },
  ID: { name: 'Indonesia',      aliases: ['indonesia','indonesian','jakarta'] },
  IL: { name: 'Israel',         aliases: ['israel','israeli','jerusalem','tel aviv','gaza','haifa','idf'],                                                                         ucdp: 666 },
  IN: { name: 'India',          aliases: ['india','indian','delhi','mumbai','new delhi'],                 drug: ['ganja','opium','drug','india drug'],                                 ucdp: 750 },
  IQ: { name: 'Iraq',           aliases: ['iraq','iraqi','baghdad','mosul','basra','erbil'],                                                                                        ucdp: 645 },
  IR: { name: 'Iran',           aliases: ['iran','iranian','tehran','isfahan','khamenei'] },
  IT: { name: 'Italy',          aliases: ['italy','italian','rome','milan'] },
  JO: { name: 'Jordan',         aliases: ['jordan','jordanian','amman','zarqa','aqaba','irbid','petra','wadi rum','hashemite'], drug: ['captagon','tramadol','hashish','jordan drug','amman drug'],    ucdp: 116 },
  JP: { name: 'Japan',          aliases: ['japan','japanese','tokyo'] },
  KE: { name: 'Kenya',          aliases: ['kenya','kenyan','nairobi','mombasa'],                          drug: ['khat','heroin','kenya drug'],                                       ucdp: 501 },
  KR: { name: 'South Korea',    aliases: ['south korea','korean','seoul'] },
  LB: { name: 'Lebanon',        aliases: ['lebanon','lebanese','beirut','tripoli','sidon','hezbollah'],   drug: ['captagon','hashish','lebanon drug'],                                ucdp: 660 },
  LY: { name: 'Libya',          aliases: ['libya','libyan','tripoli','benghazi'],                                                                                                   ucdp: 620 },
  MA: { name: 'Morocco',        aliases: ['morocco','moroccan','rabat','casablanca','marrakech'],                                                                                   ucdp: 600 },
  ML: { name: 'Mali',           aliases: ['mali','malian','bamako'],                                                                                                                ucdp: 432 },
  MM: { name: 'Myanmar',        aliases: ['myanmar','burma','burmese','yangon'],                          drug: ['heroin','methamphetamine','golden triangle','myanmar drug'],        ucdp: 775 },
  MX: { name: 'Mexico',         aliases: ['mexico','mexican','mexico city','cartel','sinaloa','jalisco'], drug: ['cartel','sinaloa','jalisco','fentanyl','cocaine','drug war','narco'], ucdp: 70 },
  NG: { name: 'Nigeria',        aliases: ['nigeria','nigerian','abuja','lagos','boko haram'],             drug: ['heroin','cocaine','nigeria drug','drug trafficking'],               ucdp: 475 },
  NP: { name: 'Nepal',          aliases: ['nepal','nepali','kathmandu'] },
  PH: { name: 'Philippines',    aliases: ['philippines','philippine','manila','shabu'],                   drug: ['shabu','meth','drug war','duterte','philippines drug'],             ucdp: 840 },
  PK: { name: 'Pakistan',       aliases: ['pakistan','pakistani','islamabad','karachi','lahore'],         drug: ['heroin','opium','afghanistan border','pakistan drug'],              ucdp: 770 },
  PL: { name: 'Poland',         aliases: ['poland','polish','warsaw'] },
  RU: { name: 'Russia',         aliases: ['russia','russian','moscow','kremlin','putin'] },
  SA: { name: 'Saudi Arabia',   aliases: ['saudi','riyadh','jeddah','mecca','medina','aramco'] },
  SD: { name: 'Sudan',          aliases: ['sudan','sudanese','khartoum'] },
  SO: { name: 'Somalia',        aliases: ['somalia','somali','mogadishu'],                                drug: ['khat','somalia drug'] },
  SY: { name: 'Syria',          aliases: ['syria','syrian','damascus','aleppo','homs','idlib'],           drug: ['captagon','hashish','syria drug'],                                  ucdp: 652 },
  TH: { name: 'Thailand',       aliases: ['thailand','thai','bangkok'],                                   drug: ['methamphetamine','ya ba','thailand drug','golden triangle'] },
  TN: { name: 'Tunisia',        aliases: ['tunisia','tunisian','tunis'] },
  TR: { name: 'Turkey',         aliases: ['turkey','turkish','türkiye','ankara','istanbul'],                                                                                        ucdp: 640 },
  TZ: { name: 'Tanzania',       aliases: ['tanzania','tanzanian','dodoma','dar es salaam'] },
  UA: { name: 'Ukraine',        aliases: ['ukraine','ukrainian','kyiv','kiev','kharkiv','odessa','zelensky'],                                                                       ucdp: 369 },
  US: { name: 'United States',  aliases: ['united states','american','washington','new york','usa'] },
  VE: { name: 'Venezuela',      aliases: ['venezuela','venezuelan','caracas'] },
  YE: { name: 'Yemen',          aliases: ['yemen','yemeni','sanaa','aden','houthi'],                                                                                                ucdp: 678 },
  ZA: { name: 'South Africa',   aliases: ['south africa','south african','johannesburg','cape town'] },
};

function getCountryMeta(code)   { return META[String(code || '').toUpperCase()] || null; }
function getCountryName(code)   { return (getCountryMeta(code) || {}).name || code; }
function getAliases(code)       { return (getCountryMeta(code) || {}).aliases || [String(code || '').toLowerCase()]; }
function getDrugKeywords(code)  { return (getCountryMeta(code) || {}).drug || []; }
function getUcdpCode(code)      { return (getCountryMeta(code) || {}).ucdp || null; }

// Text relevance test — does this text actually mention the country?
// Used by news filter to reject "Jordan" basketball player articles when asking for Jordan the country.
function isRelevantToCountry(text, code) {
  const aliases = getAliases(code);
  const lower = String(text || '').toLowerCase();
  return aliases.some(alias => lower.includes(alias));
}

// Country-specific noise filter for news/events titles.
//
// "Jordan" the country has heavy English-language collisions: basketball
// (Michael Jordan, NBA), the sneaker brand (Air Jordan), public figures
// (Jordan Peterson, Barbara Jordan), athletes named Jordan (Jordan Davis,
// Jordan Henderson, Jordan Spieth, etc.), and motorsport (NASCAR, F1's
// Eddie Jordan). Without filtering, these articles flood the JO feed.
//
// Other countries with name collisions (Turkey-the-bird, China-the-porcelain,
// India-ink, etc.) were sampled in v6.15 and found to have negligible noise —
// the relevance filter + topic-keyword query construction handle them cleanly.
// JO is the only country requiring this extra filtering layer today.
//
// Returns true if the title passes (should be kept), false if it's noise
// (should be dropped). For non-JO countries, always returns true.
function passesNoiseFilter(title, code) {
  if (code !== 'JO') return true;
  const t = String(title || '').toLowerCase();
  // Generic sports / product / motorsport terms
  if (/\b(basketball|nba|wnba|sneaker|sports|athlete|game|court|premier league|champions league|nascar|racing)\b/.test(t)) {
    return false;
  }
  // Specific named people who collide with "Jordan"
  if (/\b(michael jordan|air jordan|jordan brand|jordan peterson|simon jordan|eddie jordan|jordan henderson|jordan pickford|jordan spieth|jordan clarkson|jordan poole|deandre jordan|vernon jordan|barbara jordan|jordan davis)\b/.test(t)) {
    return false;
  }
  return true;
}

module.exports = {
  META,
  getCountryMeta,
  getCountryName,
  getAliases,
  getDrugKeywords,
  getUcdpCode,
  isRelevantToCountry,
  passesNoiseFilter,
};

// Atlas Ally — Text classifier for news/events
// Maps article titles (or event titles) to (a) a crime category for trend charts,
// and (b) an event type + severity for incident feeds.
//
// Previously three separate classifiers lived in routes/data.js (classifyArticle,
// classifyGNewsTitle) and services/events-ingest.js (TYPE_MAP). This is one source.

const { getDrugKeywords } = require('./countries-meta');

// ── Crime categories — drives the trend chart on the crime tab ───────────────
// Order matters: first match wins. Country-specific drug keywords override this
// via classifyCrime()'s countryCode arg.
const CRIME_CATEGORIES = [
  {
    key: 'violence', label: 'Violence & Conflict', icon: '💥',
    words: [
      'attack','shoot','bomb','explos','kill','wound','airstrike','missile',
      'murder','terror','massacre','assassin','execution','sniper','gunman',
      'war','battle','clash','hostage','military operation','troops deploy',
      'armed group','militant','insurgent','fatality','casualties',
    ],
  },
  {
    key: 'drugs', label: 'Drug Crime', icon: '💊',
    words: [
      'drug','narcotic','traffick','smuggl','cocaine','heroin','cannabis',
      'marijuana','hashish','amphetamine','methamphetamine','crystal meth',
      'fentanyl','opioid','opium','ketamine','ecstasy','mdma',
      'captagon','tramadol','khat','qat','pills seizure','tablet seizure',
      'drug bust','drug ring','drug lord','drug cartel','drug kingpin',
      'contraband','drug shipment','narco','drug seizure','seized drugs',
      'drug trafficking route','drug haul','drug network','drug lab',
      'cartel','gang drug','drug war','anti-narcotics',
    ],
  },
  {
    key: 'theft', label: 'Theft & Robbery', icon: '🏪',
    words: [
      'theft','robbery','burgl','stolen','steal','pickpocket','carjack',
      'loot','fraud','scam','heist','shoplifting','armed robbery','break-in',
      'home invasion','car theft','cybercrime','identity theft','embezzl',
    ],
  },
  {
    key: 'unrest', label: 'Protests & Unrest', icon: '✊',
    words: [
      'protest','riot','demonstrat','unrest','clash','strike','rally',
      'uprising','march','coup','civil unrest','mob','tear gas',
      'crackdown','dispersed','detained protesters','political unrest',
    ],
  },
  {
    key: 'security', label: 'Security & Safety', icon: '🚨',
    words: [
      'arrest','detain','police','criminal','security','crime','sentence',
      'convict','custody','wanted','suspect','indictment','prosecution',
      'smuggler arrested','border security','checkpoint','investigation',
      'gang arrest','organized crime','trafficking bust','seized',
    ],
  },
];

// Return crime category key for a title, or null if nothing matches.
// `countryCode` (optional) boosts country-specific drug keywords before the generic sweep.
function classifyCrime(title, countryCode) {
  const t = String(title || '').toLowerCase();
  if (!t) return null;

  const drugKeys = getDrugKeywords(countryCode);
  if (drugKeys.length && drugKeys.some(w => t.includes(w))) return 'drugs';

  for (const cat of CRIME_CATEGORIES) {
    if (cat.words.some(w => t.includes(w))) return cat.key;
  }
  return null;
}

// ── Event classifier — drives the incidents feed ────────────────────────────
// Returns { type, severity }. Ordered most-specific-first.
const EVENT_RULES = [
  { match: /missile|rocket|airstrike|drone strike|air strike/, type: 'missile',    severity: 'critical' },
  { match: /explos|blast|bombing|\bbomb\b/,                    type: 'explosion',  severity: 'critical' },
  { match: /siren|air raid|shelter in place/,                  type: 'siren',      severity: 'high'     },
  { match: /shoot|gunfire|gun attack|armed attack/,            type: 'shooting',   severity: 'high'     },
  { match: /earthquake|quake|tremor/,                          type: 'earthquake', severity: 'high'     },
  { match: /flood|flash flood|inundation/,                     type: 'flood',      severity: 'high'     },
  { match: /wildfire|blaze|\bfire\b/,                          type: 'fire',       severity: 'high'     },
  { match: /murder|homicide|killed|casualt|fatality/,          type: 'shooting',   severity: 'high'     },
  { match: /evacuation|evacuate|flee/,                         type: 'evacuation', severity: 'high'     },
  { match: /protest|riot|unrest|demonstrat|clash|crackdown/,   type: 'protest',    severity: 'warn'     },
  { match: /drug|narcotic|traffick|cartel|smuggl|seizure|bust/,type: 'drug',       severity: 'warn'     },
  { match: /kidnap|hostage|abduct|extortion/,                  type: 'crime',      severity: 'high'     },
  { match: /theft|robbery|burglar|stolen/,                     type: 'theft',      severity: 'warn'     },
  { match: /arrest|detain|convict|sentence/,                   type: 'crime',      severity: 'warn'     },
  { match: /accident|crash|collision/,                         type: 'incident',   severity: 'warn'     },
];

function classifyEvent(title) {
  const t = String(title || '').toLowerCase();
  for (const rule of EVENT_RULES) {
    if (rule.match.test(t)) return { type: rule.type, severity: rule.severity };
  }
  return { type: 'incident', severity: 'warn' };
}

// Maps event-table `type` column to a crime-category key. Used when merging
// stored security events into the crime trend chart.
const EVENT_TYPE_TO_CRIME_CAT = {
  shooting:   'violence',
  explosion:  'violence',
  missile:    'violence',
  drone:      'violence',
  siren:      'violence',
  bomb:       'violence',
  attack:     'violence',
  drug:       'drugs',
  crime:      'security',
  protest:    'unrest',
  riot:       'unrest',
  demonstration: 'unrest',
  theft:      'theft',
  robbery:    'theft',
  incident:   'security',
  arrest:     'security',
};

// Maps event-table `type` to the 7-day-stats category used on the incidents feed.
const EVENT_TYPE_TO_FEED_CAT = {
  missile: 'air', drone: 'air', siren: 'air', airstrike: 'air', rocket: 'air',
  explosion: 'explosion', bomb: 'explosion', blast: 'explosion',
  shooting: 'armed', gunfire: 'armed', armed: 'armed',
  protest: 'unrest', riot: 'unrest', evacuation: 'unrest', demonstration: 'unrest',
  earthquake: 'weather', flood: 'weather', fire: 'weather', storm: 'weather',
  drug: 'drug', crime: 'crime', theft: 'crime', robbery: 'crime',
};

module.exports = {
  CRIME_CATEGORIES,
  classifyCrime,
  classifyEvent,
  EVENT_TYPE_TO_CRIME_CAT,
  EVENT_TYPE_TO_FEED_CAT,
};

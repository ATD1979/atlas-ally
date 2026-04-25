// Atlas Ally — Pack Generator (v1, Session 3)
// POST /api/pack/generate — personalized pack list with rationale
//
// This endpoint replaces the positional-style /pack/ai with a questionnaire-
// driven version: 7 structured answers + country risk context are bundled
// into a Claude prompt that returns a list where each item has a rationale
// referencing the traveler's specific answers.

const router = require('express').Router();
const { fetchWithTimeout } = require('../lib/http');

const db = require('../db');
const { COUNTRIES, ADVISORY_LEVELS } = require('../countries');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = 'claude-sonnet-4-5-20250929';

// ── System prompt ─────────────────────────────────────────────────────────────
// Validated against Jordan + family + medical persona across 7 API runs.
// See handoffs/HANDOFF_v6_5_MIDSESSION.md and research/pack_dryrun.py.
const SYSTEM_PROMPT = `You are Atlas Ally's Pack Assistant. Your job is to produce a personalized
packing list for a specific traveler going to a specific country, right now.

# Inputs you will receive
- Seven answers describing the traveler (who, how long, style, purpose, health,
  tech needs, experience level)
- Destination country name, climate, season, language(s), currency, plug type
- Current country risk context: active incidents, travel advisory level, any
  ongoing events that could affect the trip

# Output contract
You will call the submit_pack_list tool exactly once. Do not return prose
before, after, or instead of the tool call.

The list should contain 15 to 25 items — never more than 25. Decision fatigue
is real; most travelers stop reading past 20.

# Voice and rationale guidance

Write rationale in warm, concise second-person. 1 to 2 sentences. Like a
well-traveled friend who happens to know current events — not a travel
magazine, not a medical chart, not a breathless marketer.

## Good rationale examples

Traveler answered "prescription medications" + 3-week trip to Jordan:
  "You mentioned regular prescriptions and you're there 3 weeks — bring
  at least 4 weeks' supply. Jordanian pharmacies may not stock your
  exact brand, and customs queues during regional tensions can delay
  deliveries."

Traveler answered "first time in region" + Jordan with active alerts:
  "A battery-powered radio costs ten dollars and runs for days. Jordan
  has had intermittent air-defense alerts this week; if cell networks
  saturate during an incident, a radio keeps you informed."

## Bad rationale (do not write like this)

  "You're going to LOVE packing this essential item for your amazing
  adventure!" (breathless)

  "Patients with chronic conditions requiring daily medication should
  ensure adequate supply throughout the travel duration." (clinical)

  "Passport." (no rationale — always include one)

# Hard rules

1. If the traveler indicated NO for a category (e.g., "None of the above"
   for health), DO NOT include items from that category. Don't recommend
   mobility aids for a traveler with no accessibility needs.

2. Reference the traveler's specific answers in rationale text whenever the
   recommendation depends on them. "You indicated X" or "Since you're
   traveling with kids" is the pattern. Generic rationale = failed list.

3. Reference country context when it changes the recommendation. If the
   destination has active alerts, say so explicitly in the rationale of any
   safety items.

4. If country risk is elevated, safety items go first — don't bury them
   under "Comfort" or "Tech".

5. Do not list the passport, phone, or wallet themselves — travelers have
   those. Related items like photocopies, document backups, protective
   cases, or spare cables ARE fine and often useful. The rule is "don't
   remind them to bring their obvious possessions."

# Categories (use these exact strings for grouping)

- Documents
- Health
- Tech / Power
- Clothing
- Safety / Emergency
- Comfort
- Region-specific — for items that only make sense for this destination.
  Examples: a scarf for mosque visits in Jordan or Turkey; coca leaves for
  altitude in Peru; a reef-safe snorkel mask for Greek islands. Use this
  category when an item wouldn't belong on any other traveler's list.`;

// ── Tool schema ───────────────────────────────────────────────────────────────
const PACK_TOOL = {
  name: 'submit_pack_list',
  description: 'Submit the final personalized packing list for this traveler.',
  input_schema: {
    type: 'object',
    required: ['items'],
    properties: {
      items: {
        type: 'array',
        minItems: 15,
        maxItems: 25,
        items: {
          type: 'object',
          required: ['icon', 'name', 'category', 'priority', 'rationale'],
          properties: {
            icon:     { type: 'string', description: 'Single emoji representing the item' },
            name:     { type: 'string', description: 'Short item name (3-8 words)' },
            category: {
              type: 'string',
              enum: ['Documents', 'Health', 'Tech / Power', 'Clothing',
                     'Safety / Emergency', 'Comfort', 'Region-specific'],
            },
            priority: {
              type: 'string',
              enum: ['essential', 'recommended', 'nice-to-have'],
            },
            rationale: {
              type: 'string',
              description: '1-2 sentence second-person rationale, max 300 chars',
              maxLength: 300,
            },
          },
        },
      },
    },
  },
};

// ── Answer labels (for prompt assembly) ───────────────────────────────────────
// These map the frontend's stable keys to human-readable labels the LLM sees.
// Kept here rather than inline so frontend + backend agree on the vocabulary.
const ANSWER_LABELS = {
  travelers: {
    just_me:                  'Just me',
    me_plus_partner:          'Me + partner',
    me_plus_family_kids:      'Me + family (with kids)',
    small_group:              'Small group (3-5 adults)',
    large_group:              'Large group (6+)',
  },
  duration: {
    weekend:                  'Weekend (1-3 days)',
    short_trip:               'Short trip (4-10 days)',
    extended_2_4_weeks:       'Extended (2-4 weeks)',
    long_haul:                'Long-haul (1+ months)',
  },
  style: {
    hotels_resorts:           'Hotels / resorts (urban comfort)',
    airbnb_rental:            'Airbnb / short-term rental',
    hostels_guesthouses:      'Hostels / guesthouses (budget travel)',
    backpacking_overland:     'Backpacking / overland (variable)',
    camping_rural:            'Camping / rural / remote',
    business:                 'Business travel (structured, meetings)',
  },
  purpose: {
    leisure:                  'Leisure / tourism',
    business:                 'Business / work',
    visiting_family:          'Visiting family or friends',
    volunteer:                'Volunteer / humanitarian',
    adventure:                'Adventure / outdoors',
    medical:                  'Medical / specialized',
    other:                    'Other',
  },
  health: {
    prescription_meds:        'Prescription medications I take regularly',
    chronic_condition:        'Chronic condition (diabetes, asthma, etc.)',
    food_allergies_mild:      'Food allergies or dietary restrictions — non-severe',
    food_allergies_severe:    'Food allergies — severe / anaphylaxis',
    mobility_needs:           'Mobility or accessibility needs',
    none:                     'None of the above',
  },
  tech: {
    stay_reachable:           'Stay reachable for work or family',
    take_photos:              'Take photos / document the trip',
    navigate:                 'Navigate unfamiliar areas',
    work_remote:              'Work remotely (laptop-grade)',
    stream:                   'Stream / entertain during downtime',
    minimal:                  'Minimal tech — offline as much as possible',
  },
  experience: {
    first_time_region:        'First time in this region',
    been_here_before:         'Been here before / know the drill',
    frequent_traveler:        'I travel frequently in general but not here specifically',
    digital_nomad:            'I live internationally / digital nomad',
  },
};

function labelize(key, value) {
  const table = ANSWER_LABELS[key] || {};
  if (Array.isArray(value)) {
    return value.map(v => table[v] || v).join(', ');
  }
  return table[value] || value;
}

// ── Country context assembly ──────────────────────────────────────────────────
// Maps COUNTRIES[code] and recent events table rows into a block of context
// text the prompt injects. Fields come from ./countries.js (see sample in
// HANDOFF v6.5 mid-session notes).
function buildCountryContext(code) {
  const c = COUNTRIES[code];
  if (!c) return null;

  const advisoryCfg = ADVISORY_LEVELS[c.advisoryLevel || 1] || ADVISORY_LEVELS[1];

  // Recent events — title/severity are signal, description contains RSS filler
  // ("The post X appeared first on Y") so we skip it.
  let events = [];
  try {
    events = db.getEventsByCountry.all(code).slice(0, 8);
  } catch (e) {
    events = [];
  }

  const eventLines = events.length
    ? events.map(e => {
        const date = (e.created_at || '').split(' ')[0] || 'recent';
        const sev  = e.severity ? `[${e.severity}] ` : '';
        const loc  = e.location ? ` at ${e.location}` : '';
        return `  - ${date}: ${sev}${e.title || 'event'}${loc}`;
      }).join('\n')
    : '  (no active incidents recorded in our feed)';

  // Health notices — array of short strings like "Routine vaccinations recommended"
  const healthLines = (c.healthNotices && c.healthNotices.length)
    ? c.healthNotices.map(h => `  - ${h}`).join('\n')
    : '  (no specific health notices for this country)';

  // Emergency numbers are short enough to inline naturally.
  const emergency = c.emergency || {};
  const emergencyLine = [emergency.police && `police ${emergency.police}`,
                         emergency.ambulance && `ambulance ${emergency.ambulance}`,
                         emergency.fire && `fire ${emergency.fire}`]
    .filter(Boolean).join(', ') || 'check local sources';

  return {
    country_name: c.name,
    context_text: `# Destination context

- Country: ${c.name}
- Capital: ${c.capital || 'unknown'}
- Language: ${c.language || 'see country metadata'}
- Currency: ${c.currency || 'see country metadata'}
- Timezone: ${c.timezone || 'unknown'}
- Emergency numbers: ${emergencyLine}

# Current risk context

- Travel advisory: Level ${c.advisoryLevel || 1} — ${advisoryCfg.label || 'Normal'}
- Advisory note: ${c.advisoryText || 'Normal precautions apply.'}
- Active incidents in our feed (recent):
${eventLines}

# Health notices for this country

${healthLines}`,
    debug: {
      advisory_level: c.advisoryLevel || 1,
      advisory_label: advisoryCfg.label || null,
      active_events: events.length,
      has_health_notices: !!(c.healthNotices && c.healthNotices.length),
    },
  };
}

// ── Prompt assembly ───────────────────────────────────────────────────────────
function buildUserMessage(answers, ctx) {
  const lines = [
    '# Traveler answers',
    '',
    `- Q1 Who's going: ${labelize('travelers', answers.travelers)}`,
    `- Q2 Duration: ${labelize('duration', answers.duration)}`,
    `- Q3 Style: ${labelize('style', answers.style)}`,
    `- Q4 Purpose: ${labelize('purpose', answers.purpose)}`,
    `- Q5 Health: ${labelize('health', answers.health)}`,
    `- Q6 Tech needs: ${labelize('tech', answers.tech)}`,
    `- Q7 Experience: ${labelize('experience', answers.experience)}`,
    '',
    ctx.context_text,
    '',
    'Please build the pack list.',
  ];
  return lines.join('\n');
}

// ── Main endpoint ─────────────────────────────────────────────────────────────
router.post('/pack/generate', async (req, res) => {
  if (!ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'AI pack not configured — add ANTHROPIC_API_KEY to Railway environment.' });
  }

  const { country_code, answers } = req.body || {};
  if (!country_code || !answers) {
    return res.status(400).json({ error: 'country_code and answers required' });
  }
  const required = ['travelers', 'duration', 'style', 'purpose', 'health', 'tech', 'experience'];
  const missing  = required.filter(k => answers[k] == null);
  if (missing.length) {
    return res.status(400).json({ error: `missing answer fields: ${missing.join(', ')}` });
  }

  const code = country_code.toUpperCase();
  const ctx  = buildCountryContext(code);
  if (!ctx) return res.status(404).json({ error: `country ${code} not found` });

  const userMessage = buildUserMessage(answers, ctx);

  try {
    const r = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:       MODEL,
        max_tokens:  4096,
        system:      SYSTEM_PROMPT,
        tools:       [PACK_TOOL],
        tool_choice: { type: 'tool', name: 'submit_pack_list' },
        messages:    [{ role: 'user', content: userMessage }],
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      console.error(`[pack/generate] Anthropic API ${r.status}:`, err.slice(0, 300));
      return res.status(502).json({ error: 'AI service error. Please try again.' });
    }

    const data = await r.json();
    const toolUse = (data.content || []).find(b => b.type === 'tool_use');
    if (!toolUse || !toolUse.input || !Array.isArray(toolUse.input.items)) {
      console.error('[pack/generate] No tool_use block in response');
      return res.status(502).json({ error: 'AI returned malformed response. Please try again.' });
    }

    console.log(`[pack/generate] ${code} ${answers.travelers}/${answers.duration} → ${toolUse.input.items.length} items (${data.usage?.input_tokens}/${data.usage?.output_tokens} tok)`);

    res.json({
      country_code: code,
      country_name: ctx.country_name,
      items:        toolUse.input.items,
      context_used: ctx.debug,
      generated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[pack/generate] Error:', e.message);
    res.status(502).json({ error: 'AI service unavailable. Please try again.' });
  }
});

module.exports = router;

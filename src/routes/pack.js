// Atlas Ally — AI Pack List routes
// v2026.04.15 — clean slate
const router = require('express').Router();
const fetch  = require('node-fetch');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const TRIP_CONTEXT = {
  leisure:   'a leisure holiday',
  business:  'a business trip',
  adventure: 'an adventure / outdoor trip',
  family:    'a family holiday with children',
  solo:      'a solo backpacking trip',
  medical:   'a medical trip',
};

router.post('/pack/ai', async (req, res) => {
  if (!ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'AI packing not configured — add ANTHROPIC_API_KEY to Railway environment variables.' });
  }

  const { destination, duration, trip_type, climate, special_needs, country_code } = req.body;
  if (!destination) return res.status(400).json({ error: 'destination required' });

  const tripLabel  = TRIP_CONTEXT[trip_type] || 'a trip';
  const days       = parseInt(duration) || 7;
  const climateStr = climate ? ` Climate: ${climate}.` : '';
  const specialStr = special_needs ? ` Special requirements: ${special_needs}.` : '';

  const prompt = `You are a professional travel packer. Generate a detailed packing list for ${tripLabel} to ${destination} lasting ${days} days.${climateStr}${specialStr}

Return ONLY a JSON object — no markdown, no explanation, no backticks. Structure:
{
  "destination": "${destination}",
  "summary": "one sentence describing this pack list",
  "categories": [
    {
      "name": "category name",
      "icon": "single emoji",
      "items": [
        { "text": "item description", "essential": true }
      ]
    }
  ]
}

Rules:
- 6–8 categories covering: Documents, Clothing, Toiletries, Tech & Electronics, Health & Safety, Money & Finance, and trip-specific categories
- 5–10 items per category, specific to the destination and trip type
- Mark as essential:true only items that are truly critical
- Be specific — e.g. "Voltage adapter for ${destination}" not just "power adapter"
- For high-risk or conflict areas, add a Safety & Security category with relevant items
- Keep item text concise (under 60 chars)`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-5-20250929',
        max_tokens: 2000,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      console.error('Anthropic API error:', err);
      return res.status(500).json({ error: 'AI service error. Please try again.' });
    }

    const data = await r.json();
    const text = (data.content || []).map(b => b.text || '').join('').trim();

    // Strip any accidental markdown fences
    const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch(e) {
      console.error('JSON parse failed:', clean.slice(0, 200));
      return res.status(500).json({ error: 'Could not parse AI response. Please try again.' });
    }

    console.log(`AI pack list generated: ${destination} ${days}d ${trip_type}`);
    res.json(parsed);
  } catch(e) {
    console.error('Pack AI error:', e.message);
    res.status(500).json({ error: 'AI service unavailable. Please try again.' });
  }
});

module.exports = router;

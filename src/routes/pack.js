// Atlas Ally — Enhanced AI Pack List routes
// v2026.04.16 — Smart travel safety + connectivity + customs
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

  const prompt = `You are an expert travel safety consultant and packing specialist with deep knowledge of international travel, safety protocols, connectivity solutions, and cultural customs. Generate a comprehensive packing list for ${tripLabel} to ${destination} lasting ${days} days.${climateStr}${specialStr}

CRITICAL: Research ${destination} thoroughly including:
- Current safety situation and crime levels
- Electrical systems (voltage, plug types)
- Mobile network operators and data plans
- Cultural customs and dress codes
- Entry requirements and documentation
- Health risks and medical needs
- Banking/payment systems
- Transportation safety

Return ONLY a JSON object — no markdown, no explanation, no backticks. Structure:
{
  "destination": "${destination}",
  "summary": "one sentence highlighting key safety/travel considerations",
  "categories": [
    {
      "name": "category name",
      "icon": "single emoji", 
      "items": [
        { "text": "specific item description", "essential": true/false }
      ]
    }
  ]
}

REQUIRED CATEGORIES & SMART RECOMMENDATIONS:

📋 **Travel Documents**
- Specific visa requirements for ${destination}
- Travel insurance with ${destination} medical coverage
- Embassy contact information for ${destination}
- Vaccination certificates if required

📱 **Connectivity & Communication**  
- SPECIFIC mobile operators in ${destination} (name the carriers)
- International roaming plans or local SIM recommendations
- Data packages for ${destination} networks
- WhatsApp/messaging apps that work in ${destination}
- Offline translation apps for local language
- VPN if internet is restricted

🔌 **Electronics & Power**
- EXACT plug type for ${destination} (Type A/B/C/etc)
- Voltage converter if needed (110V vs 220V)
- Power bank for areas with unreliable electricity
- Portable WiFi hotspot if needed

💰 **Money & Finance**
- SPECIFIC payment methods accepted in ${destination}
- Cash recommendations (USD/EUR/local currency)
- Banking cards that work without fees in ${destination}
- Money belt for high-theft-risk areas
- Emergency cash stash locations

🏥 **Health & Safety** 
- SPECIFIC medications for ${destination} health risks
- First aid supplies for local medical system gaps
- Water purification for ${destination} water quality
- Insect repellent for region-specific diseases
- Sunscreen SPF for ${destination} UV levels

🛡️ **Security & Personal Safety**
- Personal alarm for high-crime areas
- Secure bag/anti-theft backpack if needed
- Door locks for accommodation security
- Copies of documents stored separately
- Emergency whistle

👕 **Clothing & Cultural Respect**
- SPECIFIC dress codes for ${destination} culture/religion
- Conservative clothing for religious sites
- Weather-appropriate gear for ${destination} climate
- Comfortable walking shoes for ${destination} terrain

🎒 **Local Customs & Culture**
- Small gifts appropriate for ${destination} culture
- Business cards if doing business in ${destination}
- Appropriate tipping amounts in local currency
- Cultural etiquette reminders card

🚨 **Emergency Preparedness**
- Emergency contact list in local language
- Local emergency service numbers for ${destination}
- Backup transportation options
- Safe accommodation backup plans

Rules:
- BE HYPER-SPECIFIC: "Vodacom SIM card for South Africa" not "local SIM"
- INCLUDE SAFETY INTEL: Mention high-crime areas, scams, safety tips
- CULTURAL AWARENESS: Include dress codes, customs, taboos
- CONNECTIVITY FOCUS: Specific carriers, data plans, communication apps
- HEALTH-CONSCIOUS: Region-specific health risks and prevention
- 5-10 items per category, mark essential:true for critical safety items
- Keep item text under 65 chars but pack with specific detail
- If ${destination} is high-risk, add extra security items
- Include current safety considerations and local situational awareness`;

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
        max_tokens: 3000, // Increased for detailed responses
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

    console.log(`Enhanced AI pack list generated: ${destination} ${days}d ${trip_type}`);
    res.json(parsed);
  } catch(e) {
    console.error('Pack AI error:', e.message);
    res.status(500).json({ error: 'AI service unavailable. Please try again.' });
  }
});

module.exports = router;

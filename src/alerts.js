// Atlas Ally — WhatsApp alert dispatch via Twilio
// v2026.04.15 — clean slate
require('dotenv').config();
const twilio = require('twilio');
const config = require('./config');
const { getSubscribersForCountry, isTrialActive, logNotify } = require('./db');
const { COUNTRIES } = require('./countries');

let client = null;
if (config.TWILIO_ACCOUNT_SID && config.TWILIO_AUTH_TOKEN) {
  client = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
  console.log('✅ Twilio WhatsApp ready');
} else {
  console.warn('⚠️  Twilio not configured — alerts disabled');
}

// ── Message formatting ──────────────────────────────────────────────────────

const TYPE_TO_PREF = {
  siren: 'siren', drone: 'drone', missile: 'drone', gunfire: 'drone',
  strike: 'drone', troop: 'troop', checkpoint: 'troop', chemical: 'drone',
  weather: 'weather', health: 'health', news: 'news', clear: 'clear',
};

const SEV_EMOJI  = { danger: '🚨', warn: '⚠️', info: 'ℹ️', safe: '✅' };
const TYPE_ICON  = {
  siren: '🔴', drone: '🛸', missile: '🚀', troop: '🪖',
  strike: '💥', gunfire: '🔫', checkpoint: '🚧', chemical: '☣️',
  weather: '🌪️', health: '🏥', news: '📰', clear: '✅',
};

function buildMessage(event, subscriber) {
  const country   = COUNTRIES[event.country_code];
  const flag      = country?.flag || '🌍';
  const name      = country?.name || event.country_code;
  const sevEmoji  = SEV_EMOJI[event.severity] || '⚠️';
  const typeIcon  = TYPE_ICON[event.type]     || '⚠️';
  const loc       = event.location   ? `\n📍 *${event.location}*`   : '';
  const desc      = event.description ? `\n\n${event.description}`  : '';
  const src       = event.source_url  ? `\n\n🔗 ${event.source_url}` : '';
  const ts        = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
    timeZone: country?.timezone || 'UTC',
  });
  const unsubUrl  = `${config.BASE_URL}/unsubscribe?wa=${encodeURIComponent(subscriber.whatsapp)}`;

  return (
    `${sevEmoji} *ATLAS ALLY ALERT*\n` +
    `${flag} *${name}*\n` +
    `${typeIcon} *${event.title}*` +
    `${loc}${desc}${src}` +
    `\n\n_Atlas Ally · ${ts} local time_\n` +
    `_${name} emergency: ${country?.emergency?.police || '112'}_\n` +
    `_Unsubscribe: ${unsubUrl}_`
  );
}

// ── Transport ────────────────────────────────────────────────────────────────

async function sendWhatsApp(to, body) {
  if (!client) return false;
  const clean = to.replace(/^whatsapp:/i, '').trim();
  try {
    const msg = await client.messages.create({
      from: config.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${clean}`,
      body,
    });
    console.log(`  ✓ WA → ${clean} [${msg.sid}]`);
    return true;
  } catch (e) {
    console.error(`  ✗ WA → ${clean}: ${e.message}`);
    return false;
  }
}

// ── Dispatch ─────────────────────────────────────────────────────────────────

async function dispatchAlerts(event) {
  const prefKey  = TYPE_TO_PREF[event.type] || 'news';
  const allSubs  = getSubscribersForCountry.all(event.country_code);

  const eligible = allSubs.filter(s =>
    s.plan === 'premium' || (s.plan === 'trial' && isTrialActive(s))
  );
  const subs = eligible.filter(s => s[`alert_${prefKey}`] === 1);

  console.log(`\n📤 Dispatching [${event.country_code}] "${event.title}"`);
  console.log(`   ${eligible.length} eligible, ${subs.length} subscribed to ${prefKey}`);

  const results = { sent: 0, failed: 0, skipped: 0 };

  for (const sub of subs) {
    if (!sub.whatsapp) { results.skipped++; continue; }
    const ok = await sendWhatsApp(sub.whatsapp, buildMessage(event, sub));
    logNotify.run({ event_id: event.id, user_id: sub.id, channel: 'whatsapp', status: ok ? 'sent' : 'failed' });
    ok ? results.sent++ : results.failed++;
    if (subs.length > 1) await new Promise(r => setTimeout(r, 200));
  }

  console.log('   Results:', results);
  return results;
}

async function sendCheckinAlert(toNumber, body) {
  if (!client) { console.warn('Twilio not configured'); return false; }
  const clean = toNumber.replace(/^whatsapp:/i, '').trim();
  try {
    await client.messages.create({
      from: config.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${clean}`,
      body,
    });
    return true;
  } catch (e) {
    console.error('Checkin WA failed:', e.message);
    return false;
  }
}

module.exports = { dispatchAlerts, sendCheckinAlert };

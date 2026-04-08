// Atlas Ally — Stripe integration
// Plans:
//   traveler_base  $3/mo — first country
//   traveler_extra $1/mo per additional country
//   family         $8/mo — 1 account + 3 emergency contacts

let stripe = null;

function getStripe() {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    try { stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); }
    catch (e) { console.warn('Stripe not available:', e.message); }
  }
  return stripe;
}

async function createCheckoutSession({ email, whatsapp, plan, countries, successUrl, cancelUrl }) {
  const s = getStripe();
  if (!s) throw new Error('Stripe not configured — add STRIPE_SECRET_KEY to Railway variables');

  const lineItems = plan === 'family'
    ? [{ price: process.env.STRIPE_FAMILY_PRICE_ID, quantity: 1 }]
    : [
        { price: process.env.STRIPE_BASE_PRICE_ID, quantity: 1 },
        ...(Math.max(0, (countries?.length || 1) - 1) > 0 && process.env.STRIPE_EXTRA_PRICE_ID
          ? [{ price: process.env.STRIPE_EXTRA_PRICE_ID, quantity: Math.max(0, (countries?.length || 1) - 1) }]
          : []),
      ];

  const session = await s.checkout.sessions.create({
    mode: 'subscription',
    line_items: lineItems,
    customer_email: email || undefined,
    subscription_data: {
      trial_period_days: 7,
      metadata: {
        whatsapp: whatsapp || '',
        plan: plan || 'traveler',
        countries: (countries || []).join(','),
      },
    },
    metadata: { whatsapp: whatsapp || '', plan: plan || 'traveler' },
    success_url: successUrl || `${process.env.BASE_URL}/?checkout=success`,
    cancel_url: cancelUrl || `${process.env.BASE_URL}/landing`,
    allow_promotion_codes: true,
  });

  return { url: session.url, session_id: session.id };
}

async function handleWebhook(rawBody, signature) {
  const s = getStripe();
  if (!s) return { handled: false };

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return { handled: false, error: 'No webhook secret configured' };

  let event;
  try {
    event = s.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (e) {
    return { handled: false, error: `Webhook signature failed: ${e.message}` };
  }

  const db = require('./db');

  switch (event.type) {
    case 'checkout.session.completed': {
      const { metadata, customer } = event.data.object;
      const whatsapp = metadata?.whatsapp;
      if (whatsapp) {
        db.db.prepare(`UPDATE users SET plan='premium', stripe_id=? WHERE whatsapp=?`).run(customer, whatsapp);
        console.log(`✅ Stripe: ${whatsapp} upgraded to ${metadata?.plan || 'premium'}`);
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const customerId = event.data.object.customer;
      db.db.prepare(`UPDATE users SET plan='free' WHERE stripe_id=?`).run(customerId);
      console.log(`❌ Stripe: subscription cancelled for customer ${customerId}`);
      break;
    }
    case 'customer.subscription.updated': {
      const { status, customer: customerId } = event.data.object;
      const plan = ['active', 'trialing'].includes(status) ? 'premium' : 'free';
      db.db.prepare(`UPDATE users SET plan=? WHERE stripe_id=?`).run(plan, customerId);
      break;
    }
    case 'invoice.payment_failed':
      console.warn(`⚠️ Payment failed for customer ${event.data.object.customer}`);
      break;
  }

  return { handled: true, type: event.type };
}

module.exports = { getStripe, createCheckoutSession, handleWebhook };

// Atlas Ally — Stripe Integration
// Plans:
//   traveler_base: $3/month — first country
//   traveler_extra: $1/month per additional country
//   family: $8/month — 1 account + 3 emergency contacts

let stripe = null;

function getStripe() {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

// Create a Stripe Checkout session for new subscribers
async function createCheckoutSession({ email, whatsapp, plan, countries, successUrl, cancelUrl }) {
  const s = getStripe();
  if (!s) throw new Error('Stripe not configured — add STRIPE_SECRET_KEY to Railway variables');

  // Determine line items based on plan and number of countries
  const lineItems = [];

  if (plan === 'family') {
    lineItems.push({
      price: process.env.STRIPE_FAMILY_PRICE_ID,
      quantity: 1,
    });
  } else {
    // Traveler plan: $3 base + $1 per extra country
    lineItems.push({
      price: process.env.STRIPE_BASE_PRICE_ID,
      quantity: 1,
    });
    const extraCountries = Math.max(0, (countries?.length || 1) - 1);
    if (extraCountries > 0 && process.env.STRIPE_EXTRA_PRICE_ID) {
      lineItems.push({
        price: process.env.STRIPE_EXTRA_PRICE_ID,
        quantity: extraCountries,
      });
    }
  }

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
    metadata: {
      whatsapp: whatsapp || '',
      plan: plan || 'traveler',
    },
    success_url: successUrl || `${process.env.BASE_URL}/?checkout=success`,
    cancel_url: cancelUrl || `${process.env.BASE_URL}/landing`,
    allow_promotion_codes: true,
  });

  return { url: session.url, session_id: session.id };
}

// Handle Stripe webhook events
async function handleWebhook(rawBody, signature) {
  const s = getStripe();
  if (!s) return { handled: false };

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return { handled: false, error: 'No webhook secret configured' };

  let event;
  try {
    event = s.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch(e) {
    return { handled: false, error: `Webhook signature failed: ${e.message}` };
  }

  const db = require('./db');

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const whatsapp = session.metadata?.whatsapp || session.subscription_data?.metadata?.whatsapp;
      const plan = session.metadata?.plan || 'traveler';
      const stripeId = session.customer;

      if (whatsapp) {
        db.db.prepare(`UPDATE users SET plan='premium', stripe_id=? WHERE whatsapp=?`).run(stripeId, whatsapp);
        console.log(`✅ Stripe: ${whatsapp} upgraded to ${plan}`);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const customerId = sub.customer;
      db.db.prepare(`UPDATE users SET plan='free' WHERE stripe_id=?`).run(customerId);
      console.log(`❌ Stripe: subscription cancelled for customer ${customerId}`);
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const status = sub.status;
      const customerId = sub.customer;
      if (status === 'active' || status === 'trialing') {
        db.db.prepare(`UPDATE users SET plan='premium' WHERE stripe_id=?`).run(customerId);
      } else if (status === 'past_due' || status === 'canceled') {
        db.db.prepare(`UPDATE users SET plan='free' WHERE stripe_id=?`).run(customerId);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      console.warn(`⚠️ Payment failed for customer ${invoice.customer}`);
      break;
    }
  }

  return { handled: true, type: event.type };
}

module.exports = { createCheckoutSession, handleWebhook };

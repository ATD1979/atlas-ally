// Atlas Ally — Payment routes (Stripe checkout & webhooks)
// v2026.04.15 — clean slate
const router = require('express').Router();
const express = require('express');
const db      = require('../db');
const { getStripe } = require('../stripe');

// Stripe checkout — creates a session or falls back to trial
router.post('/checkout', async (req, res) => {
  const { whatsapp, plan, countries } = req.body;
  const stripe = getStripe();

  if (!stripe) {
    // No Stripe configured — start trial instead
    if (whatsapp) {
      const clean = whatsapp.replace(/\s/g, '').replace(/^00/, '+');
      db.upsertUser({ whatsapp: clean, name: null, email: null });
      if (countries?.length) {
        const user = db.getUser(clean);
        countries.forEach(c => { try { db.addCountry.run({ user_id: user.id, country_code: c }); } catch {} });
      }
    }
    return res.json({ ok: true, trial: true });
  }

  try {
    const priceId = plan === 'family' ? process.env.STRIPE_FAMILY_PRICE_ID : process.env.STRIPE_BASE_PRICE_ID;
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.BASE_URL}/?checkout=success`,
      cancel_url:  `${process.env.BASE_URL}/landing`,
      metadata:    { whatsapp: whatsapp || '', plan: plan || 'traveler' },
    });
    res.json({ url: session.url });
  } catch {
    res.status(500).json({ error: 'Checkout failed' });
  }
});

// Stripe webhook — raw body required for signature verification
router.post('/stripe-webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.json({ ok: true });

  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return res.status(400).send('Webhook error');
  }

  if (event.type === 'checkout.session.completed') {
    const wa = event.data.object.metadata?.whatsapp;
    if (wa) {
      const user = db.getUser(wa);
      if (user) db.updatePlan({ plan: 'premium', stripe_id: event.data.object.customer, id: user.id });
    }
  }
  res.json({ ok: true });
});

module.exports = router;

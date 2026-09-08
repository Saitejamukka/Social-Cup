import { Router, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../lib/prisma.js';
import { stripe, STRIPE_PRICE_ID } from '../lib/stripe.js';
import { requireAuth, AuthedRequest } from '../lib/auth.js';

const router = Router();

// POST /api/billing/subscribe — creates (or reuses) the member's Stripe Customer and
// Subscription, then hands back everything the mobile app's Stripe PaymentSheet needs
// to collect payment. Nothing in our database changes here — accountStatus/credits are
// only ever granted by the webhook once Stripe actually confirms the first payment.
router.post('/subscribe', requireAuth, async (req: AuthedRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });

  if (user.accountStatus === 'MEMBER' && !user.subscriptionCancelAtPeriodEnd) {
    return res.status(409).json({ success: false, error: 'Already a member' });
  }

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
  }

  // Re-subscribing after a cancellation that hasn't reached period end yet: just
  // undo the pending cancellation on the existing subscription instead of creating
  // a second one for the same customer.
  if (user.stripeSubscriptionId && user.subscriptionCancelAtPeriodEnd) {
    const existing = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { subscriptionCancelAtPeriodEnd: false },
    });
    return res.json({ success: true, reactivated: true, subscriptionId: existing.id });
  }

  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: customerId },
    { apiVersion: Stripe.API_VERSION }
  );

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: STRIPE_PRICE_ID }],
    payment_behavior: 'default_incomplete',
    payment_settings: {
      save_default_payment_method: 'on_subscription',
      // Card stays the default; US bank account (ACH direct debit) is offered
      // alongside it — Stripe's own PaymentElement/PaymentSheet renders the bank
      // search + institution list natively once this is enabled, no custom UI needed.
      payment_method_types: ['card', 'us_bank_account'],
    },
  });

  // As of this API version, invoices no longer carry a `payment_intent` field directly —
  // the PaymentIntent lives on the invoice's default InvoicePayment instead.
  const invoiceId =
    typeof subscription.latest_invoice === 'string'
      ? subscription.latest_invoice
      : subscription.latest_invoice?.id;
  const invoicePayments = invoiceId
    ? await stripe.invoicePayments.list({ invoice: invoiceId, limit: 1 })
    : null;
  const paymentIntentId = invoicePayments?.data[0]?.payment?.payment_intent;
  if (!paymentIntentId || typeof paymentIntentId !== 'string') {
    return res.status(500).json({ success: false, error: 'Stripe did not return a payment intent' });
  }
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (!paymentIntent.client_secret) {
    return res.status(500).json({ success: false, error: 'Stripe did not return a payment intent' });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { stripeSubscriptionId: subscription.id },
  });

  res.json({
    success: true,
    paymentIntentClientSecret: paymentIntent.client_secret,
    ephemeralKeySecret: ephemeralKey.secret,
    customerId,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

// POST /api/billing/cancel — cancels at period end, per the PRD: access and credits
// continue until the paid period is over. The account only actually flips to CANCELED
// when Stripe's customer.subscription.deleted webhook fires at that point.
router.post('/cancel', requireAuth, async (req: AuthedRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user?.stripeSubscriptionId) {
    return res.status(400).json({ success: false, error: 'No active subscription to cancel' });
  }

  const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  const periodEndItem = subscription.items.data[0];
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionCancelAtPeriodEnd: true,
      subscriptionCurrentPeriodEnd: periodEndItem
        ? new Date(periodEndItem.current_period_end * 1000)
        : null,
    },
  });

  res.json({
    success: true,
    message: 'Membership will cancel at the end of the current billing period.',
    periodEnd: periodEndItem ? new Date(periodEndItem.current_period_end * 1000) : null,
  });
});

export { router as billingRoutes };

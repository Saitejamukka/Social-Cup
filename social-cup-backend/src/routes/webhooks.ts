import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../lib/prisma.js';
import { stripe } from '../lib/stripe.js';

const router = Router();

// POST /api/webhooks/stripe — the source of truth for membership state. We never grant
// credits or flip accountStatus from the mobile app's "payment succeeded" callback alone
// (the client can crash or lie mid-flow); only a verified webhook event does that.
router.post('/stripe', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || typeof signature !== 'string') {
    return res.status(400).send('Webhook not configured');
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook signature verification failed`);
  }

  switch (event.type) {
    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
      if (!customerId) break;

      const periodEndSeconds = invoice.lines.data[0]?.period?.end;
      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: {
          accountStatus: 'MEMBER',
          credits: 30,
          subscriptionCancelAtPeriodEnd: false,
          subscriptionCurrentPeriodEnd: periodEndSeconds ? new Date(periodEndSeconds * 1000) : null,
        },
      });
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
      if (!customerId) break;

      // PRD 7.4: a failed renewal disables redemption until the card is fixed. EXPIRED
      // reflects "was a member, currently can't redeem" without discarding their credits/history.
      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: { accountStatus: 'EXPIRED' },
      });
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const periodEndSeconds = subscription.items.data[0]?.current_period_end;
      await prisma.user.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          subscriptionCancelAtPeriodEnd: subscription.cancel_at_period_end,
          subscriptionCurrentPeriodEnd: periodEndSeconds ? new Date(periodEndSeconds * 1000) : null,
        },
      });
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await prisma.user.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          accountStatus: 'CANCELED',
          credits: 0,
          subscriptionCancelAtPeriodEnd: false,
          subscriptionCurrentPeriodEnd: null,
        },
      });
      break;
    }

    default:
      break;
  }

  res.json({ received: true });
});

export { router as webhookRoutes };

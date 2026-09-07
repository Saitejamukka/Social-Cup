import { prisma } from './prisma.js';

// Module 1.2: scheduled jobs.
//
// Credit resets on renewal are handled by Stripe's `invoice.paid` webhook
// (see routes/webhooks.ts), which resets each member to 30 credits on their
// own actual billing date — not a shared calendar-month job like this one
// used to be before real Stripe billing existed.

// Clears codes that were generated but never scanned.
async function runExpiredCodeCleanup() {
  const result = await prisma.redemption.updateMany({
    where: { status: 'PENDING', expiresAt: { lt: new Date() } },
    data: { status: 'EXPIRED' },
  });
  if (result.count > 0) {
    console.log(`[jobs] Expired ${result.count} stale redemption code(s)`);
  }
}

export function startScheduledJobs() {
  const MINUTE = 60 * 1000;

  runExpiredCodeCleanup().catch((e) => console.error('[jobs] cleanup failed', e));

  setInterval(() => runExpiredCodeCleanup().catch((e) => console.error('[jobs] cleanup failed', e)), 5 * MINUTE);
}

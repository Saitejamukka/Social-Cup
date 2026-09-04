import { prisma } from './prisma.js';

// Module 1.2: scheduled jobs.
//
// Without real Stripe subscriptions, credits can't be reset on each member's
// actual renewal date (that date lives in Stripe). This dev-mode approximation
// resets every MEMBER to 30 credits once per calendar day the first time the
// job runs after the 1st of the month. Replace with a Stripe
// `invoice.payment_succeeded` webhook handler in production, which is the
// PRD's actual trigger for a credit reset.
let lastMonthlyResetMonth: number | null = null;

async function runMonthlyCreditReset() {
  const now = new Date();
  if (now.getDate() !== 1) return;
  const monthKey = now.getFullYear() * 12 + now.getMonth();
  if (lastMonthlyResetMonth === monthKey) return;

  await prisma.user.updateMany({ where: { accountStatus: 'MEMBER' }, data: { credits: 30 } });
  lastMonthlyResetMonth = monthKey;
  console.log(`[jobs] Monthly credit reset applied for ${now.toISOString().slice(0, 7)}`);
}

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
  const HOUR = 60 * 60 * 1000;
  const MINUTE = 60 * 1000;

  runMonthlyCreditReset().catch((e) => console.error('[jobs] monthly reset failed', e));
  runExpiredCodeCleanup().catch((e) => console.error('[jobs] cleanup failed', e));

  setInterval(() => runMonthlyCreditReset().catch((e) => console.error('[jobs] monthly reset failed', e)), HOUR);
  setInterval(() => runExpiredCodeCleanup().catch((e) => console.error('[jobs] cleanup failed', e)), 5 * MINUTE);
}

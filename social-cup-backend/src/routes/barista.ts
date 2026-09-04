import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { signDeviceToken, requireDeviceAuth, DeviceAuthedRequest } from '../lib/auth.js';
import { checkPinRateLimit, recordPinFailure, resetPinRateLimit } from '../lib/rateLimit.js';

const router = Router();

// POST /api/barista/verify-pin  { cafeId, pin }
router.post('/verify-pin', async (req: Request, res: Response) => {
  const { cafeId, pin } = req.body ?? {};
  if (!cafeId || !pin) {
    return res.status(400).json({ success: false, error: 'cafeId and pin are required' });
  }

  const limit = checkPinRateLimit(cafeId);
  if (!limit.allowed) {
    return res.status(429).json({
      success: false,
      error: `Too many incorrect attempts. Try again in ${limit.retryAfterSeconds}s.`,
    });
  }

  const cafe = await prisma.cafe.findUnique({ where: { id: cafeId } });
  if (!cafe) return res.status(404).json({ success: false, error: 'Cafe not found' });

  if (pin !== cafe.pinCode) {
    recordPinFailure(cafeId);
    return res.status(401).json({ success: false, error: 'Incorrect cafe PIN' });
  }

  resetPinRateLimit(cafeId);
  const deviceToken = signDeviceToken({ cafeId: cafe.id, pinVersion: cafe.pinVersion, typ: 'device' });
  res.json({ success: true, deviceToken, cafe: { id: cafe.id, name: cafe.name, neighborhood: cafe.neighborhood } });
});

const deviceAuth = requireDeviceAuth((req) => (req.body?.cafeId as string) || (req.query.cafeId as string));

// POST /api/barista/scan  { code, cafeId }  — header: X-Device-Token
router.post('/scan', deviceAuth, async (req: DeviceAuthedRequest, res: Response) => {
  const { code } = req.body ?? {};
  const cafeId = req.cafeId!;

  if (!code) {
    return res.status(400).json({ success: false, error: 'code is required', reason: 'invalid' });
  }

  const numericCode = String(code);
  const backupCode = String(code).toUpperCase();
  // Computed once in JS rather than via SQL now(): the "Redemption" timestamp columns
  // are timestamptz, but pinning a single instant avoids any ambiguity and keeps every
  // comparison in this request consistent regardless of the DB server's session timezone.
  const scanTime = new Date();

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Postgres has real MVCC concurrency (unlike the SQLite dev fallback, which
      // serializes every write and hides races). A plain read-then-write here lets
      // two simultaneous scans both read PENDING and both deduct credits. The fix is
      // to make the claim itself one atomic, row-locked statement: SELECT the target
      // row FOR UPDATE inside a subquery, then UPDATE only that locked row. A second
      // concurrent scan blocks on the lock, then re-reads status as no longer PENDING
      // and claims nothing — exactly the "locked database transaction" the PRD (8.3)
      // and its concurrency test (10.1) require.
      const claimed = await tx.$queryRaw<{ id: string }[]>`
        UPDATE "Redemption"
        SET status = 'REDEEMED', "redeemedAt" = ${scanTime}
        WHERE id = (
          SELECT id FROM "Redemption"
          WHERE ("code" = ${numericCode} OR "backupCode" = ${backupCode})
            AND "cafeId" = ${cafeId}
            AND status = 'PENDING'
            AND "expiresAt" > ${scanTime}
          ORDER BY "createdAt" DESC
          LIMIT 1
          FOR UPDATE
        )
        RETURNING id
      `;

      if (claimed.length === 0) {
        // Nothing claimable — work out why, without mutating anything else's state.
        const existing = await tx.redemption.findFirst({
          where: { OR: [{ code: numericCode }, { backupCode }] },
          orderBy: { createdAt: 'desc' },
        });

        if (!existing) throw { reason: 'invalid', message: 'No matching code found' };
        if (existing.status === 'REDEEMED') throw { reason: 'used', message: 'Code already redeemed' };
        if (existing.status === 'VOIDED') throw { reason: 'invalid', message: 'Code was canceled' };
        if (existing.cafeId !== cafeId) throw { reason: 'wrongCafe', message: 'Generated for a different location' };
        if (existing.expiresAt.getTime() < Date.now()) {
          if (existing.status === 'PENDING') {
            await tx.redemption.update({ where: { id: existing.id }, data: { status: 'EXPIRED' } });
          }
          throw { reason: 'expired', message: 'Code expired (5-minute limit reached)' };
        }
        throw { reason: 'invalid', message: 'Code could not be verified' };
      }

      // We now hold the only claim on this code. Validate the member and credits;
      // if either fails, void the claim rather than leaving a false REDEEMED record.
      const candidate = await tx.redemption.findUniqueOrThrow({ where: { id: claimed[0].id } });
      const user = await tx.user.findUniqueOrThrow({ where: { id: candidate.userId } });

      if (user.accountStatus !== 'MEMBER') {
        await tx.redemption.update({ where: { id: candidate.id }, data: { status: 'VOIDED', voidReason: 'Membership inactive at scan time' } });
        throw { reason: 'inactive', message: 'Membership inactive' };
      }
      if (user.credits < candidate.creditsDeducted) {
        await tx.redemption.update({ where: { id: candidate.id }, data: { status: 'VOIDED', voidReason: 'Insufficient credits at scan time' } });
        throw { reason: 'insufficient', message: 'Not enough credits' };
      }

      const cafe = await tx.cafe.findUnique({ where: { id: cafeId } });
      const drink = await tx.drink.findUnique({ where: { id: candidate.drinkId } });

      await tx.user.update({ where: { id: user.id }, data: { credits: { decrement: candidate.creditsDeducted } } });
      const redeemed = await tx.redemption.update({
        where: { id: candidate.id },
        data: { payoutRateSnapshot: cafe?.payoutRate ?? 0 },
      });

      return { user, drink, redemption: redeemed };
    });

    res.json({
      success: true,
      message: 'Scan verified successfully',
      member: { name: result.user.name },
      drink: { name: result.drink?.name ?? 'Drink' },
      credits: result.redemption.creditsDeducted,
    });
  } catch (err: any) {
    if (err?.reason) {
      return res.status(400).json({ success: false, error: err.message, reason: err.reason });
    }
    throw err;
  }
});

// GET /api/barista/today?cafeId=...
router.get('/today', deviceAuth, async (req: DeviceAuthedRequest, res: Response) => {
  const cafeId = req.cafeId!;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const redemptions = await prisma.redemption.findMany({
    where: { cafeId, status: 'REDEEMED', redeemedAt: { gte: startOfDay } },
    include: { user: true, drink: true },
    orderBy: { redeemedAt: 'desc' },
  });

  res.json({
    success: true,
    count: redemptions.length,
    redemptions: redemptions.map((r) => ({
      id: r.id,
      member: r.user.name,
      drink: r.drink.name,
      credits: r.creditsDeducted,
      time: r.redeemedAt,
    })),
  });
});

// GET /api/barista/earnings?cafeId=...  — this cafe's current-month totals only.
router.get('/earnings', deviceAuth, async (req: DeviceAuthedRequest, res: Response) => {
  const cafeId = req.cafeId!;
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const period = startOfMonth.toISOString().slice(0, 7);

  const [cafe, redemptions, payout] = await Promise.all([
    prisma.cafe.findUnique({ where: { id: cafeId } }),
    prisma.redemption.findMany({ where: { cafeId, status: 'REDEEMED', redeemedAt: { gte: startOfMonth } } }),
    prisma.payout.findUnique({ where: { cafeId_billingPeriod: { cafeId, billingPeriod: period } } }),
  ]);

  const totalCredits = redemptions.reduce((sum, r) => sum + r.creditsDeducted, 0);
  const amountOwed = redemptions.reduce((sum, r) => sum + r.creditsDeducted * (r.payoutRateSnapshot ?? cafe?.payoutRate ?? 0), 0);

  res.json({
    success: true,
    earnings: {
      period,
      totalDrinks: redemptions.length,
      totalCredits,
      amountOwed: Number(amountOwed.toFixed(2)),
      status: payout?.status ?? 'PENDING',
      paidAt: payout?.paidAt ?? null,
    },
  });
});

export { router as baristaRoutes };

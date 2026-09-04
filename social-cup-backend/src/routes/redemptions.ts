import { Router, Response } from 'express';
import { randomInt } from 'crypto';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole, AuthedRequest } from '../lib/auth.js';

const router = Router();

const CODE_TTL_MS = 5 * 60 * 1000;

function generateNumericCode(): string {
  return String(randomInt(1000, 10000));
}

function generateBackupCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let out = '';
  for (let i = 0; i < 6; i++) out += alphabet[randomInt(0, alphabet.length)];
  return out;
}

function serializeRedemption(r: any) {
  return {
    id: r.id,
    code: r.code,
    backupCode: r.backupCode,
    cafeId: r.cafeId,
    drinkId: r.drinkId,
    creditsCost: r.creditsDeducted,
    status: r.status,
    expiresAt: r.expiresAt,
    redeemedAt: r.redeemedAt,
  };
}

// POST /api/redemptions/generate  { cafeId, drinkId }
// Per PRD 7.3/8.3: credits are deducted only when a barista scans the code,
// never when the code is generated/shown.
router.post('/generate', requireAuth, requireRole('CUSTOMER'), async (req: AuthedRequest, res: Response) => {
  const { cafeId, drinkId } = req.body ?? {};
  if (!cafeId || !drinkId) {
    return res.status(400).json({ success: false, error: 'cafeId and drinkId are required' });
  }

  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });

  if (user.accountStatus !== 'MEMBER') {
    return res.status(403).json({ success: false, error: 'An active membership is required to redeem' });
  }

  const drink = await prisma.drink.findFirst({ where: { id: drinkId, cafeId, isEnabled: true } });
  if (!drink) {
    return res.status(400).json({ success: false, error: 'Invalid cafe or drink' });
  }

  if (user.credits < drink.creditsCost) {
    return res.status(400).json({ success: false, error: 'Insufficient credits', remainingCredits: user.credits });
  }

  const redemption = await prisma.$transaction(async (tx) => {
    // A member may hold only one live code at a time.
    await tx.redemption.updateMany({
      where: { userId: user.id, status: 'PENDING' },
      data: { status: 'VOIDED', voidReason: 'Superseded by a new code' },
    });

    return tx.redemption.create({
      data: {
        code: generateNumericCode(),
        backupCode: generateBackupCode(),
        userId: user.id,
        cafeId,
        drinkId,
        creditsDeducted: drink.creditsCost,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
      },
    });
  });

  res.status(201).json({
    success: true,
    redemption: serializeRedemption(redemption),
    projectedRemainingCredits: user.credits - drink.creditsCost,
    validSeconds: CODE_TTL_MS / 1000,
  });
});

// POST /api/redemptions/cancel  { id }
router.post('/cancel', requireAuth, requireRole('CUSTOMER'), async (req: AuthedRequest, res: Response) => {
  const { id } = req.body ?? {};
  const redemption = await prisma.redemption.findFirst({ where: { id, userId: req.userId! } });

  if (!redemption || redemption.status !== 'PENDING') {
    return res.status(400).json({ success: false, error: 'Redemption code not found or already closed' });
  }

  await prisma.redemption.update({
    where: { id: redemption.id },
    data: { status: 'VOIDED', voidReason: 'Canceled by member' },
  });

  res.json({ success: true, message: 'Code canceled' });
});

// GET /api/redemptions/active — the member's current live code, if any.
// Lets the app recover state (e.g. after a reload) and poll for the barista's scan.
router.get('/active', requireAuth, requireRole('CUSTOMER'), async (req: AuthedRequest, res: Response) => {
  let redemption = await prisma.redemption.findFirst({
    where: { userId: req.userId!, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  });

  if (redemption && redemption.expiresAt.getTime() < Date.now()) {
    redemption = await prisma.redemption.update({ where: { id: redemption.id }, data: { status: 'EXPIRED' } });
  }

  res.json({ success: true, redemption: redemption ? serializeRedemption(redemption) : null });
});

// GET /api/redemptions/:id — poll a specific code's status (used while the countdown runs).
router.get('/:id', requireAuth, requireRole('CUSTOMER'), async (req: AuthedRequest, res: Response) => {
  const redemption = await prisma.redemption.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!redemption) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({ success: true, redemption: serializeRedemption(redemption) });
});

export { router as redemptionRoutes };

import { Router, Response } from 'express';
import { randomBytes } from 'crypto';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole, AuthedRequest } from '../lib/auth.js';

const router = Router();
router.use(requireAuth, requireRole('ADMIN'));

// ---------------- Dashboard ----------------

// GET /api/admin/metrics
router.get('/metrics', async (_req: AuthedRequest, res: Response) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [activeMembers, partnerCafes, redemptionsThisMonth] = await Promise.all([
    prisma.user.count({ where: { accountStatus: 'MEMBER' } }),
    prisma.cafe.count(),
    prisma.redemption.findMany({
      where: { status: 'REDEEMED', redeemedAt: { gte: startOfMonth } },
    }),
  ]);

  const creditsRedeemed = redemptionsThisMonth.reduce((sum, r) => sum + r.creditsDeducted, 0);
  const totalOwed = redemptionsThisMonth.reduce(
    (sum, r) => sum + r.creditsDeducted * (r.payoutRateSnapshot ?? 0),
    0
  );
  const totalMargin = creditsRedeemed - totalOwed;

  res.json({
    success: true,
    metrics: {
      activeMembers,
      partnerCafes,
      redemptionsThisMonth: redemptionsThisMonth.length,
      creditsRedeemed,
      totalOwed: Number(totalOwed.toFixed(2)),
      totalMargin: Number(totalMargin.toFixed(2)),
    },
  });
});

// ---------------- Cafes ----------------

// GET /api/admin/cafes
router.get('/cafes', async (_req: AuthedRequest, res: Response) => {
  const cafes = await prisma.cafe.findMany({ include: { drinks: true }, orderBy: { name: 'asc' } });
  res.json({ success: true, cafes });
});

// POST /api/admin/cafes
router.post('/cafes', async (req: AuthedRequest, res: Response) => {
  const { name, neighborhood, address, hours, payoutRate, isFeatured, vibeTags, image } = req.body ?? {};
  if (!name || !neighborhood || !address) {
    return res.status(400).json({ success: false, error: 'name, neighborhood, and address are required' });
  }

  const cafe = await prisma.cafe.create({
    data: {
      name,
      neighborhood,
      address,
      hours: hours || '',
      payoutRate: payoutRate !== undefined ? Number(payoutRate) : 3.5,
      isFeatured: Boolean(isFeatured),
      vibeTags: Array.isArray(vibeTags) ? vibeTags : [],
      image: image || null,
      pinCode: String(randomBytes(2).readUInt16BE(0) % 9000 + 1000),
    },
  });

  res.status(201).json({ success: true, cafe });
});

// PATCH /api/admin/cafes/:id
router.patch('/cafes/:id', async (req: AuthedRequest, res: Response) => {
  const { name, neighborhood, address, hours, isOpen, payoutRate, isFeatured, vibeTags, image, priceTier } = req.body ?? {};

  const cafe = await prisma.cafe.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(neighborhood !== undefined ? { neighborhood } : {}),
      ...(address !== undefined ? { address } : {}),
      ...(hours !== undefined ? { hours } : {}),
      ...(isOpen !== undefined ? { isOpen: Boolean(isOpen) } : {}),
      ...(payoutRate !== undefined ? { payoutRate: Number(payoutRate) } : {}),
      ...(isFeatured !== undefined ? { isFeatured: Boolean(isFeatured) } : {}),
      ...(vibeTags !== undefined ? { vibeTags: Array.isArray(vibeTags) ? vibeTags : [vibeTags] } : {}),
      ...(image !== undefined ? { image } : {}),
      ...(priceTier !== undefined ? { priceTier } : {}),
    },
  });

  res.json({ success: true, cafe });
});

// DELETE /api/admin/cafes/:id
router.delete('/cafes/:id', async (req: AuthedRequest, res: Response) => {
  await prisma.cafe.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// POST /api/admin/cafes/:id/reset-pin
// Bumps pinVersion, which invalidates every device token already trusted for this cafe.
router.post('/cafes/:id/reset-pin', async (req: AuthedRequest, res: Response) => {
  const newPin = String(randomBytes(2).readUInt16BE(0) % 9000 + 1000);
  const cafe = await prisma.cafe.update({
    where: { id: req.params.id },
    data: { pinCode: newPin, pinVersion: { increment: 1 } },
  });
  res.json({ success: true, pinCode: cafe.pinCode });
});

// ---------------- Drinks / Menu ----------------

// POST /api/admin/cafes/:cafeId/drinks
router.post('/cafes/:cafeId/drinks', async (req: AuthedRequest, res: Response) => {
  const { name, description, creditsCost, retailPrice, isSignature, category, image } = req.body ?? {};
  if (!name || creditsCost === undefined || retailPrice === undefined) {
    return res.status(400).json({ success: false, error: 'name, creditsCost, and retailPrice are required' });
  }

  const drink = await prisma.drink.create({
    data: {
      cafeId: req.params.cafeId,
      name,
      description: description || '',
      creditsCost: Number(creditsCost),
      retailPrice: Number(retailPrice),
      isSignature: Boolean(isSignature),
      category: category || 'Espresso drink',
      image: image || null,
    },
  });

  res.status(201).json({ success: true, drink });
});

// PATCH /api/admin/drinks/:id
router.patch('/drinks/:id', async (req: AuthedRequest, res: Response) => {
  const { name, description, creditsCost, retailPrice, isSignature, isEnabled, category, image } = req.body ?? {};

  const drink = await prisma.drink.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(creditsCost !== undefined ? { creditsCost: Number(creditsCost) } : {}),
      ...(retailPrice !== undefined ? { retailPrice: Number(retailPrice) } : {}),
      ...(isSignature !== undefined ? { isSignature: Boolean(isSignature) } : {}),
      ...(isEnabled !== undefined ? { isEnabled: Boolean(isEnabled) } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(image !== undefined ? { image } : {}),
    },
  });

  res.json({ success: true, drink });
});

// DELETE /api/admin/drinks/:id
router.delete('/drinks/:id', async (req: AuthedRequest, res: Response) => {
  await prisma.drink.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// ---------------- Members ----------------

// GET /api/admin/members
router.get('/members', async (_req: AuthedRequest, res: Response) => {
  const members = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    orderBy: { createdAt: 'desc' },
  });
  res.json({
    success: true,
    count: members.length,
    members: members.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      status: m.accountStatus,
      credits: m.credits,
      joined: m.createdAt,
    })),
  });
});

// PATCH /api/admin/members/:id/status  { status: 'MEMBER' | 'CANCELED' | ... }
router.patch('/members/:id/status', async (req: AuthedRequest, res: Response) => {
  const { status } = req.body ?? {};
  if (!['VISITOR', 'MEMBER', 'EXPIRED', 'CANCELED'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status' });
  }
  const member = await prisma.user.update({ where: { id: req.params.id }, data: { accountStatus: status } });
  res.json({ success: true, member: { id: member.id, status: member.accountStatus } });
});

// ---------------- Redemption log ----------------

function redemptionWhere(query: AuthedRequest['query']) {
  const { cafeId, from, to } = query as Record<string, string | undefined>;
  return {
    ...(cafeId ? { cafeId } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };
}

function toRow(r: any) {
  const value = r.creditsDeducted;
  const payout = r.payoutRateSnapshot !== null ? Number((r.creditsDeducted * r.payoutRateSnapshot).toFixed(2)) : null;
  return {
    id: r.id,
    member: r.user.name,
    cafe: r.cafe.name,
    drink: r.drink.name,
    credits: r.creditsDeducted,
    memberValue: value,
    cafePayout: payout,
    margin: payout !== null ? Number((value - payout).toFixed(2)) : null,
    status: r.status,
    time: r.redeemedAt ?? r.createdAt,
    voidReason: r.voidReason,
    voidedBy: r.voidedBy?.name ?? null,
  };
}

// GET /api/admin/redemptions?cafeId=&from=&to=
router.get('/redemptions', async (req: AuthedRequest, res: Response) => {
  const redemptions = await prisma.redemption.findMany({
    where: redemptionWhere(req.query),
    include: { user: true, cafe: true, drink: true, voidedBy: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, count: redemptions.length, redemptions: redemptions.map(toRow) });
});

// GET /api/admin/redemptions/export?cafeId=&from=&to=
router.get('/redemptions/export', async (req: AuthedRequest, res: Response) => {
  const redemptions = await prisma.redemption.findMany({
    where: redemptionWhere(req.query),
    include: { user: true, cafe: true, drink: true, voidedBy: true },
    orderBy: { createdAt: 'desc' },
  });

  const header = 'Member,Cafe,Drink,Credits,Member Value,Cafe Payout,Margin,Status,Time';
  const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = redemptions.map(toRow).map((r) =>
    [r.member, r.cafe, r.drink, r.credits, r.memberValue, r.cafePayout ?? '', r.margin ?? '', r.status, new Date(r.time).toISOString()]
      .map(escape)
      .join(',')
  );

  const csv = [header, ...lines].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="redemptions.csv"');
  res.send(csv);
});

// POST /api/admin/redemptions/:id/void  { reason }
router.post('/redemptions/:id/void', async (req: AuthedRequest, res: Response) => {
  const { reason } = req.body ?? {};
  if (!reason) {
    return res.status(400).json({ success: false, error: 'A void reason is required' });
  }

  try {
    const restored = await prisma.$transaction(async (tx) => {
      const redemption = await tx.redemption.findUnique({ where: { id: req.params.id } });
      if (!redemption) throw new Error('NOT_FOUND');
      if (redemption.status !== 'REDEEMED') throw new Error('NOT_REDEEMED');

      await tx.user.update({
        where: { id: redemption.userId },
        data: { credits: { increment: redemption.creditsDeducted } },
      });

      return tx.redemption.update({
        where: { id: redemption.id },
        data: { status: 'VOIDED', voidReason: reason, voidedById: req.userId! },
      });
    });

    res.json({ success: true, message: 'Redemption voided and credits refunded', restoredCredits: restored.creditsDeducted });
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, error: 'Redemption not found' });
    if (err.message === 'NOT_REDEEMED') return res.status(400).json({ success: false, error: 'Only a completed redemption can be voided' });
    throw err;
  }
});

// ---------------- Payouts ----------------

// GET /api/admin/payouts?period=2026-08
router.get('/payouts', async (req: AuthedRequest, res: Response) => {
  const period = (req.query.period as string) || new Date().toISOString().slice(0, 7);
  const [year, month] = period.split('-').map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const cafes = await prisma.cafe.findMany({
    include: {
      redemptions: {
        where: { status: 'REDEEMED', redeemedAt: { gte: start, lt: end } },
      },
      payouts: { where: { billingPeriod: period } },
    },
  });

  const rows = cafes
    .filter((c) => c.redemptions.length > 0 || c.payouts.length > 0)
    .map((c) => {
      const totalCredits = c.redemptions.reduce((sum, r) => sum + r.creditsDeducted, 0);
      const amountOwed = c.redemptions.reduce((sum, r) => sum + r.creditsDeducted * (r.payoutRateSnapshot ?? c.payoutRate), 0);
      const payoutRecord = c.payouts[0];
      return {
        cafeId: c.id,
        cafe: c.name,
        period,
        redemptions: c.redemptions.length,
        totalCredits,
        amountOwed: Number(amountOwed.toFixed(2)),
        status: payoutRecord?.status ?? 'PENDING',
        paidAt: payoutRecord?.paidAt ?? null,
        reference: payoutRecord?.reference ?? null,
      };
    });

  res.json({ success: true, period, payouts: rows });
});

// POST /api/admin/payouts/:cafeId/pay  { period, amount, reference }
router.post('/payouts/:cafeId/pay', async (req: AuthedRequest, res: Response) => {
  const { period, amount, reference } = req.body ?? {};
  if (!period || amount === undefined) {
    return res.status(400).json({ success: false, error: 'period and amount are required' });
  }

  const payout = await prisma.payout.upsert({
    where: { cafeId_billingPeriod: { cafeId: req.params.cafeId, billingPeriod: period } },
    create: {
      cafeId: req.params.cafeId,
      billingPeriod: period,
      totalRedemptions: 0,
      totalCredits: 0,
      amountOwed: Number(amount),
      status: 'PAID',
      reference: reference || null,
      paidAt: new Date(),
    },
    update: {
      status: 'PAID',
      amountOwed: Number(amount),
      reference: reference || null,
      paidAt: new Date(),
    },
  });

  res.json({ success: true, payout });
});

export { router as adminRoutes };

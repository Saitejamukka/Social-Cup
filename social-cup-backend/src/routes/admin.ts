import { Router, Response } from 'express';
import { randomBytes } from 'crypto';
import { prisma } from '../lib/prisma.js';
import { stripe, STRIPE_PRICE_ID } from '../lib/stripe.js';
import { requireAuth, requireRole, AuthedRequest } from '../lib/auth.js';
import {
  isPrismaNotFoundError,
  isPrismaForeignKeyError,
  isValidMoneyOrCreditAmount,
  isValidPayoutRate,
  isValidLatitude,
  isValidLongitude,
  isValidHttpUrl,
  cleanText,
  parseDateParam,
  parseBillingPeriod,
  escapeCsvCell,
} from '../lib/validation.js';

const router = Router();
router.use(requireAuth, requireRole('ADMIN'));

// GET /api/admin/settings — PRD 9.2: credit value and plan price/credits, both
// read-only here since the plan price actually lives in Stripe and the credit
// value / monthly allowance are fixed business constants, not admin-editable yet.
router.get('/settings', async (_req: AuthedRequest, res: Response) => {
  const price = await stripe.prices.retrieve(STRIPE_PRICE_ID, { expand: ['product'] });
  const product = price.product as import('stripe').Stripe.Product;

  res.json({
    success: true,
    settings: {
      creditValueUsd: 1,
      creditsPerMonth: 30,
      planName: product.name,
      planPriceUsd: price.unit_amount !== null ? price.unit_amount / 100 : null,
      planInterval: price.recurring?.interval ?? null,
      currency: price.currency.toUpperCase(),
    },
  });
});

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
  const { name, neighborhood, address, latitude, longitude, hours, payoutRate, isFeatured, vibeTags, image, gallery, perkLine } = req.body ?? {};

  const cleanName = cleanText(name, 200);
  const cleanNeighborhood = cleanText(neighborhood, 100);
  const cleanAddress = cleanText(address, 300);
  if (!cleanName || !cleanNeighborhood || !cleanAddress) {
    return res.status(400).json({ success: false, error: 'name, neighborhood, and address are required' });
  }
  if (payoutRate !== undefined && !isValidPayoutRate(payoutRate)) {
    return res.status(400).json({ success: false, error: 'payoutRate must be a positive number up to 100' });
  }
  if (latitude !== undefined && latitude !== '' && !isValidLatitude(latitude)) {
    return res.status(400).json({ success: false, error: 'latitude must be between -90 and 90' });
  }
  if (longitude !== undefined && longitude !== '' && !isValidLongitude(longitude)) {
    return res.status(400).json({ success: false, error: 'longitude must be between -180 and 180' });
  }
  if (image && !isValidHttpUrl(image)) {
    return res.status(400).json({ success: false, error: 'image must be a valid http(s) URL' });
  }

  const cafe = await prisma.cafe.create({
    data: {
      name: cleanName,
      neighborhood: cleanNeighborhood,
      address: cleanAddress,
      latitude: latitude !== undefined && latitude !== '' ? Number(latitude) : null,
      longitude: longitude !== undefined && longitude !== '' ? Number(longitude) : null,
      hours: cleanText(hours, 200) || '',
      payoutRate: payoutRate !== undefined ? Number(payoutRate) : 3.5,
      isFeatured: Boolean(isFeatured),
      vibeTags: Array.isArray(vibeTags) ? vibeTags.map((t) => cleanText(t, 60)).filter((t): t is string => !!t) : [],
      image: image || null,
      gallery: Array.isArray(gallery) ? gallery : [],
      perkLine: cleanText(perkLine, 200),
      pinCode: String(randomBytes(2).readUInt16BE(0) % 9000 + 1000),
    },
  });

  res.status(201).json({ success: true, cafe });
});

// PATCH /api/admin/cafes/:id
router.patch('/cafes/:id', async (req: AuthedRequest, res: Response) => {
  const { name, neighborhood, address, latitude, longitude, hours, isOpen, payoutRate, isFeatured, vibeTags, image, gallery, perkLine, priceTier } = req.body ?? {};

  if (name !== undefined && !cleanText(name, 200)) {
    return res.status(400).json({ success: false, error: 'name cannot be blank' });
  }
  if (neighborhood !== undefined && !cleanText(neighborhood, 100)) {
    return res.status(400).json({ success: false, error: 'neighborhood cannot be blank' });
  }
  if (address !== undefined && !cleanText(address, 300)) {
    return res.status(400).json({ success: false, error: 'address cannot be blank' });
  }
  if (payoutRate !== undefined && !isValidPayoutRate(payoutRate)) {
    return res.status(400).json({ success: false, error: 'payoutRate must be a positive number up to 100' });
  }
  if (latitude !== undefined && latitude !== '' && !isValidLatitude(latitude)) {
    return res.status(400).json({ success: false, error: 'latitude must be between -90 and 90' });
  }
  if (longitude !== undefined && longitude !== '' && !isValidLongitude(longitude)) {
    return res.status(400).json({ success: false, error: 'longitude must be between -180 and 180' });
  }
  if (image && !isValidHttpUrl(image)) {
    return res.status(400).json({ success: false, error: 'image must be a valid http(s) URL' });
  }

  try {
    const cafe = await prisma.cafe.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined ? { name: cleanText(name, 200)! } : {}),
        ...(neighborhood !== undefined ? { neighborhood: cleanText(neighborhood, 100)! } : {}),
        ...(address !== undefined ? { address: cleanText(address, 300)! } : {}),
        ...(latitude !== undefined ? { latitude: latitude === '' ? null : Number(latitude) } : {}),
        ...(longitude !== undefined ? { longitude: longitude === '' ? null : Number(longitude) } : {}),
        ...(hours !== undefined ? { hours: cleanText(hours, 200) || '' } : {}),
        ...(isOpen !== undefined ? { isOpen: Boolean(isOpen) } : {}),
        ...(payoutRate !== undefined ? { payoutRate: Number(payoutRate) } : {}),
        ...(isFeatured !== undefined ? { isFeatured: Boolean(isFeatured) } : {}),
        ...(vibeTags !== undefined
          ? { vibeTags: (Array.isArray(vibeTags) ? vibeTags : [vibeTags]).map((t) => cleanText(t, 60)).filter((t): t is string => !!t) }
          : {}),
        ...(image !== undefined ? { image } : {}),
        ...(gallery !== undefined ? { gallery: Array.isArray(gallery) ? gallery : [gallery] } : {}),
        ...(perkLine !== undefined ? { perkLine: cleanText(perkLine, 200) } : {}),
        ...(priceTier !== undefined ? { priceTier } : {}),
      },
    });
    res.json({ success: true, cafe });
  } catch (err) {
    if (isPrismaNotFoundError(err)) return res.status(404).json({ success: false, error: 'Cafe not found' });
    throw err;
  }
});

// DELETE /api/admin/cafes/:id
router.delete('/cafes/:id', async (req: AuthedRequest, res: Response) => {
  try {
    await prisma.cafe.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    if (isPrismaNotFoundError(err)) return res.status(404).json({ success: false, error: 'Cafe not found' });
    if (isPrismaForeignKeyError(err)) {
      return res.status(409).json({ success: false, error: 'This cafe has redemption or payout history and cannot be deleted' });
    }
    throw err;
  }
});

// POST /api/admin/cafes/:id/reset-pin
// Bumps pinVersion, which invalidates every device token already trusted for this cafe.
router.post('/cafes/:id/reset-pin', async (req: AuthedRequest, res: Response) => {
  const newPin = String(randomBytes(2).readUInt16BE(0) % 9000 + 1000);
  try {
    const cafe = await prisma.cafe.update({
      where: { id: req.params.id },
      data: { pinCode: newPin, pinVersion: { increment: 1 } },
    });
    res.json({ success: true, pinCode: cafe.pinCode });
  } catch (err) {
    if (isPrismaNotFoundError(err)) return res.status(404).json({ success: false, error: 'Cafe not found' });
    throw err;
  }
});

// ---------------- Drinks / Menu ----------------

// POST /api/admin/cafes/:cafeId/drinks
router.post('/cafes/:cafeId/drinks', async (req: AuthedRequest, res: Response) => {
  const { name, description, creditsCost, retailPrice, isSignature, category, image } = req.body ?? {};
  const cleanName = cleanText(name, 200);
  if (!cleanName || creditsCost === undefined || retailPrice === undefined) {
    return res.status(400).json({ success: false, error: 'name, creditsCost, and retailPrice are required' });
  }
  if (!isValidMoneyOrCreditAmount(creditsCost, 1000)) {
    return res.status(400).json({ success: false, error: 'creditsCost must be a positive number up to 1000' });
  }
  if (!isValidMoneyOrCreditAmount(retailPrice, 1000)) {
    return res.status(400).json({ success: false, error: 'retailPrice must be a positive number up to 1000' });
  }
  if (image && !isValidHttpUrl(image)) {
    return res.status(400).json({ success: false, error: 'image must be a valid http(s) URL' });
  }

  try {
    const drink = await prisma.drink.create({
      data: {
        cafeId: req.params.cafeId,
        name: cleanName,
        description: cleanText(description, 500) || '',
        creditsCost: Number(creditsCost),
        retailPrice: Number(retailPrice),
        isSignature: Boolean(isSignature),
        category: cleanText(category, 100) || 'Espresso drink',
        image: image || null,
      },
    });
    res.status(201).json({ success: true, drink });
  } catch (err) {
    if (isPrismaNotFoundError(err)) return res.status(404).json({ success: false, error: 'Cafe not found' });
    throw err;
  }
});

// PATCH /api/admin/drinks/:id
router.patch('/drinks/:id', async (req: AuthedRequest, res: Response) => {
  const { name, description, creditsCost, retailPrice, isSignature, isEnabled, category, image } = req.body ?? {};

  if (name !== undefined && !cleanText(name, 200)) {
    return res.status(400).json({ success: false, error: 'name cannot be blank' });
  }
  if (creditsCost !== undefined && !isValidMoneyOrCreditAmount(creditsCost, 1000)) {
    return res.status(400).json({ success: false, error: 'creditsCost must be a positive number up to 1000' });
  }
  if (retailPrice !== undefined && !isValidMoneyOrCreditAmount(retailPrice, 1000)) {
    return res.status(400).json({ success: false, error: 'retailPrice must be a positive number up to 1000' });
  }
  if (image && !isValidHttpUrl(image)) {
    return res.status(400).json({ success: false, error: 'image must be a valid http(s) URL' });
  }

  try {
    const drink = await prisma.drink.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined ? { name: cleanText(name, 200)! } : {}),
        ...(description !== undefined ? { description: cleanText(description, 500) || '' } : {}),
        ...(creditsCost !== undefined ? { creditsCost: Number(creditsCost) } : {}),
        ...(retailPrice !== undefined ? { retailPrice: Number(retailPrice) } : {}),
        ...(isSignature !== undefined ? { isSignature: Boolean(isSignature) } : {}),
        ...(isEnabled !== undefined ? { isEnabled: Boolean(isEnabled) } : {}),
        ...(category !== undefined ? { category: cleanText(category, 100) || 'Espresso drink' } : {}),
        ...(image !== undefined ? { image } : {}),
      },
    });
    res.json({ success: true, drink });
  } catch (err) {
    if (isPrismaNotFoundError(err)) return res.status(404).json({ success: false, error: 'Drink not found' });
    throw err;
  }
});

// DELETE /api/admin/drinks/:id
router.delete('/drinks/:id', async (req: AuthedRequest, res: Response) => {
  try {
    await prisma.drink.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    if (isPrismaNotFoundError(err)) return res.status(404).json({ success: false, error: 'Drink not found' });
    if (isPrismaForeignKeyError(err)) {
      return res.status(409).json({
        success: false,
        error: 'This drink has redemption history and cannot be deleted — disable it instead',
      });
    }
    throw err;
  }
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

// PATCH /api/admin/members/:id/status  { status: 'VISITOR' | 'EXPIRED' | 'CANCELED' }
// MEMBER is deliberately not a settable value here — real membership is only
// ever granted by Stripe's webhook once a payment actually clears (PRD 7.2).
// This endpoint exists to deactivate an account (PRD 9.6), not to grant one.
router.patch('/members/:id/status', async (req: AuthedRequest, res: Response) => {
  const { status } = req.body ?? {};
  if (!['VISITOR', 'EXPIRED', 'CANCELED'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid status. Membership can only be granted through a real Stripe payment — this endpoint can only deactivate an account.',
    });
  }
  try {
    const member = await prisma.user.update({ where: { id: req.params.id }, data: { accountStatus: status } });
    res.json({ success: true, member: { id: member.id, status: member.accountStatus } });
  } catch (err) {
    if (isPrismaNotFoundError(err)) return res.status(404).json({ success: false, error: 'Member not found' });
    throw err;
  }
});

// ---------------- Redemption log ----------------

function redemptionWhere(cafeId: string | undefined, from: Date | undefined, to: Date | undefined) {
  return {
    ...(cafeId ? { cafeId } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
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
  const { cafeId, from, to } = req.query as Record<string, string | undefined>;
  const fromParsed = parseDateParam(from);
  const toParsed = parseDateParam(to);
  if (!fromParsed.ok || !toParsed.ok) {
    return res.status(400).json({ success: false, error: 'from/to must be valid dates' });
  }

  const redemptions = await prisma.redemption.findMany({
    where: redemptionWhere(cafeId, fromParsed.date, toParsed.date),
    include: { user: true, cafe: true, drink: true, voidedBy: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, count: redemptions.length, redemptions: redemptions.map(toRow) });
});

// GET /api/admin/redemptions/export?cafeId=&from=&to=
router.get('/redemptions/export', async (req: AuthedRequest, res: Response) => {
  const { cafeId, from, to } = req.query as Record<string, string | undefined>;
  const fromParsed = parseDateParam(from);
  const toParsed = parseDateParam(to);
  if (!fromParsed.ok || !toParsed.ok) {
    return res.status(400).json({ success: false, error: 'from/to must be valid dates' });
  }

  const redemptions = await prisma.redemption.findMany({
    where: redemptionWhere(cafeId, fromParsed.date, toParsed.date),
    include: { user: true, cafe: true, drink: true, voidedBy: true },
    orderBy: { createdAt: 'desc' },
  });

  const header = 'Member,Cafe,Drink,Credits,Member Value,Cafe Payout,Margin,Status,Time';
  const lines = redemptions.map(toRow).map((r) =>
    [r.member, r.cafe, r.drink, r.credits, r.memberValue, r.cafePayout ?? '', r.margin ?? '', r.status, new Date(r.time).toISOString()]
      .map(escapeCsvCell)
      .join(',')
  );

  const csv = [header, ...lines].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="redemptions.csv"');
  res.send(csv);
});

// POST /api/admin/redemptions/:id/void  { reason }
router.post('/redemptions/:id/void', async (req: AuthedRequest, res: Response) => {
  const reason = cleanText(req.body?.reason, 500);
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
  const now = new Date();
  const periodStr = (req.query.period as string) || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const parsed = parseBillingPeriod(periodStr);
  if (!parsed) {
    return res.status(400).json({ success: false, error: 'period must be in YYYY-MM format' });
  }
  const { year, month } = parsed;
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const cafes = await prisma.cafe.findMany({
    include: {
      redemptions: {
        where: { status: 'REDEEMED', redeemedAt: { gte: start, lt: end } },
      },
      payouts: { where: { billingPeriod: periodStr } },
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
        period: periodStr,
        redemptions: c.redemptions.length,
        totalCredits,
        amountOwed: Number(amountOwed.toFixed(2)),
        status: payoutRecord?.status ?? 'PENDING',
        paidAt: payoutRecord?.paidAt ?? null,
        reference: payoutRecord?.reference ?? null,
      };
    });

  res.json({ success: true, period: periodStr, payouts: rows });
});

// POST /api/admin/payouts/:cafeId/pay  { period, amount, reference }
router.post('/payouts/:cafeId/pay', async (req: AuthedRequest, res: Response) => {
  const { period, amount, reference } = req.body ?? {};
  if (!period || !parseBillingPeriod(String(period))) {
    return res.status(400).json({ success: false, error: 'period must be in YYYY-MM format' });
  }
  if (amount === undefined || !Number.isFinite(Number(amount)) || Number(amount) < 0) {
    return res.status(400).json({ success: false, error: 'amount must be a non-negative number' });
  }

  try {
    const payout = await prisma.payout.upsert({
      where: { cafeId_billingPeriod: { cafeId: req.params.cafeId, billingPeriod: period } },
      create: {
        cafeId: req.params.cafeId,
        billingPeriod: period,
        totalRedemptions: 0,
        totalCredits: 0,
        amountOwed: Number(amount),
        status: 'PAID',
        reference: cleanText(reference, 200),
        paidAt: new Date(),
      },
      update: {
        status: 'PAID',
        amountOwed: Number(amount),
        reference: cleanText(reference, 200),
        paidAt: new Date(),
      },
    });
    res.json({ success: true, payout });
  } catch (err) {
    if (isPrismaNotFoundError(err)) return res.status(404).json({ success: false, error: 'Cafe not found' });
    throw err;
  }
});

export { router as adminRoutes };

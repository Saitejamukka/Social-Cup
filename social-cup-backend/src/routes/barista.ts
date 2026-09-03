import { Router, Request, Response } from 'express';
import { activeRedemptions } from './redemptions.js';
import { DALLAS_CAFES } from '../data/dallasCafes.js';

const router = Router();

export interface CompletedLog {
  id: string;
  cafeId: string;
  member: string;
  drink: string;
  credits: number;
  time: string;
  value: string;
  payout: string;
  margin: string;
}

export const todayCompletedLogs: CompletedLog[] = [
  { id: 'c1', cafeId: 'roastery-coffee-house', member: 'Maya P.', drink: 'Cascara Brew', credits: 6, time: '11:42 AM', value: '$6.00', payout: '$21.00', margin: '-$15.00' },
  { id: 'c2', cafeId: 'roastery-coffee-house', member: 'Chris D.', drink: 'Sea Salt Caramel Cold Brew', credits: 6, time: '10:15 AM', value: '$6.00', payout: '$21.00', margin: '-$15.00' },
  { id: 'c3', cafeId: 'roastery-coffee-house', member: 'Priya N.', drink: 'Niloufer Special Irani Chai', credits: 3, time: '9:08 AM', value: '$3.00', payout: '$10.50', margin: '-$7.50' },
];

// POST /api/barista/verify-pin
router.post('/verify-pin', (req: Request, res: Response) => {
  const { pin, cafeId = 'roastery-coffee-house' } = req.body;
  const cafe = DALLAS_CAFES.find((c) => c.id === cafeId);

  if (pin === (cafe?.pinCode || '4821')) {
    res.json({ success: true, authorized: true, cafe: { id: cafe?.id, name: cafe?.name } });
  } else {
    res.status(401).json({ success: false, authorized: false, error: 'Incorrect cafe PIN' });
  }
});

// POST /api/barista/scan
router.post('/scan', (req: Request, res: Response) => {
  const { code, cafeId = 'roastery-coffee-house' } = req.body;

  const target = activeRedemptions.find(
    (r) => (r.code === code || r.backupCode === code) && r.status === 'PENDING'
  );

  if (!target) {
    return res.status(400).json({ success: false, error: 'Invalid or already used code' });
  }

  if (Date.now() > target.expiresAt) {
    target.status = 'EXPIRED';
    return res.status(400).json({ success: false, error: 'Code expired (5-minute limit reached)' });
  }

  if (target.cafeId !== cafeId) {
    return res.status(400).json({ success: false, error: 'Wrong cafe — generated for a different location' });
  }

  // Mark as redeemed
  target.status = 'REDEEMED';
  const cafe = DALLAS_CAFES.find((c) => c.id === target.cafeId);
  const drink = cafe?.drinks.find((d) => d.id === target.drinkId);

  const log: CompletedLog = {
    id: 'c_' + Date.now(),
    cafeId: target.cafeId,
    member: 'Jordan Avery',
    drink: drink?.name || 'Specialty Drink',
    credits: target.creditsCost,
    time: 'Just now',
    value: `$${target.creditsCost.toFixed(2)}`,
    payout: `$${(target.creditsCost * 3.5).toFixed(2)}`,
    margin: `$${(target.creditsCost - target.creditsCost * 3.5).toFixed(2)}`,
  };

  todayCompletedLogs.unshift(log);

  res.json({
    success: true,
    message: 'Scan verified successfully',
    member: log.member,
    drink: log.drink,
    credits: log.credits,
  });
});

// GET /api/barista/today?cafeId=roastery-coffee-house
router.get('/today', (req: Request, res: Response) => {
  const { cafeId = 'roastery-coffee-house' } = req.query;
  const filtered = todayCompletedLogs.filter((l) => l.cafeId === cafeId);
  res.json({ success: true, count: filtered.length, redemptions: filtered });
});

export { router as baristaRoutes };

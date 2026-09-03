import { Router, Request, Response } from 'express';
import { currentUser } from './auth.js';
import { DALLAS_CAFES } from '../data/dallasCafes.js';

const router = Router();

export interface ActiveCode {
  id: string;
  code: string;
  backupCode: string;
  cafeId: string;
  drinkId: string;
  creditsCost: number;
  expiresAt: number;
  status: 'PENDING' | 'REDEEMED' | 'EXPIRED' | 'VOIDED';
}

export const activeRedemptions: ActiveCode[] = [];

// POST /api/redemptions/generate
router.post('/generate', (req: Request, res: Response) => {
  const { cafeId, drinkId } = req.body;

  const cafe = DALLAS_CAFES.find((c) => c.id === cafeId);
  const drink = cafe?.drinks.find((d) => d.id === drinkId);

  if (!cafe || !drink) {
    return res.status(400).json({ success: false, error: 'Invalid cafe or drink' });
  }

  if (currentUser.credits < drink.credits) {
    return res.status(400).json({ success: false, error: 'Insufficient credits' });
  }

  // Deduct credits
  currentUser.credits -= drink.credits;

  const random4 = String(Math.floor(1000 + Math.random() * 9000));
  const randomBackup = Math.random().toString(36).substring(2, 8).toUpperCase();

  const newCode: ActiveCode = {
    id: 'rdm_' + Date.now(),
    code: random4,
    backupCode: randomBackup,
    cafeId,
    drinkId,
    creditsCost: drink.credits,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes TTL
    status: 'PENDING',
  };

  activeRedemptions.unshift(newCode);

  res.status(201).json({
    success: true,
    redemption: newCode,
    remainingCredits: currentUser.credits,
    validSeconds: 300,
  });
});

// POST /api/redemptions/cancel
router.post('/cancel', (req: Request, res: Response) => {
  const { code } = req.body;
  const item = activeRedemptions.find((r) => r.code === code || r.backupCode === code);

  if (!item || item.status !== 'PENDING') {
    return res.status(400).json({ success: false, error: 'Redemption code not found or already closed' });
  }

  // Refund credits
  currentUser.credits += item.creditsCost;
  item.status = 'VOIDED';

  res.json({ success: true, message: 'Code canceled and credits refunded', remainingCredits: currentUser.credits });
});

export { router as redemptionRoutes };

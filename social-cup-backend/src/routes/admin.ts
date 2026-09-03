import { Router, Request, Response } from 'express';
import { DALLAS_CAFES } from '../data/dallasCafes.js';
import { todayCompletedLogs } from './barista.js';
import { currentUser } from './auth.js';

const router = Router();

let adminMembers = [
  { id: 'm1', name: 'Jordan Avery', plan: 'Standard $24.99', status: 'Active', joined: 'Mar 2026', credits: '22/30' },
  { id: 'm2', name: 'Priya Nair', plan: 'Standard $24.99', status: 'Active', joined: 'Feb 2026', credits: '19/30' },
  { id: 'm3', name: 'Chris Delgado', plan: 'Standard $24.99', status: 'Active', joined: 'Jan 2026', credits: '25/30' },
  { id: 'm4', name: 'Maya Park', plan: 'Standard $24.99', status: 'Active', joined: 'Mar 2026', credits: '14/30' },
  { id: 'm5', name: 'Sam Rivera', plan: 'Standard $24.99', status: 'Paused', joined: 'Apr 2026', credits: '30/30' },
  { id: 'm6', name: 'Ben Foster', plan: 'Standard $24.99', status: 'Active', joined: 'May 2026', credits: '21/30' },
];

let adminPayouts = [
  { id: 'p1', cafe: 'Roastery Coffee House', redemptions: 42, credits: 248, amount: '$868.00', status: 'Pending' },
  { id: 'p2', cafe: 'Café Niloufer', redemptions: 56, credits: 198, amount: '$693.00', status: 'Pending' },
  { id: 'p3', cafe: 'Conçu', redemptions: 38, credits: 218, amount: '$763.00', status: 'Paid' },
  { id: 'p4', cafe: 'True Black Specialty Coffee', redemptions: 34, credits: 196, amount: '$686.00', status: 'Pending' },
  { id: 'p5', cafe: 'Subko Coffee', redemptions: 29, credits: 168, amount: '$588.00', status: 'Paid' },
];

// GET /api/admin/metrics
router.get('/metrics', (_req: Request, res: Response) => {
  res.json({
    success: true,
    metrics: {
      activeMembers: '1,284',
      mrr: '$32,058',
      redemptionsToday: todayCompletedLogs.length + 93,
      partnerCafes: DALLAS_CAFES.length + '+',
      avgCreditsUsed: '22.4',
      churnRate30d: '3.1%',
    },
  });
});

// GET /api/admin/members
router.get('/members', (_req: Request, res: Response) => {
  res.json({ success: true, count: adminMembers.length, members: adminMembers });
});

// PATCH /api/admin/members/:id/status
router.patch('/members/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  adminMembers = adminMembers.map((m) => (m.id === id ? { ...m, status } : m));
  res.json({ success: true, member: adminMembers.find((m) => m.id === id) });
});

// GET /api/admin/redemptions
router.get('/redemptions', (_req: Request, res: Response) => {
  res.json({ success: true, count: todayCompletedLogs.length, redemptions: todayCompletedLogs });
});

// POST /api/admin/redemptions/:id/void
router.post('/redemptions/:id/void', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = todayCompletedLogs.findIndex((l) => l.id === id);

  if (idx >= 0) {
    const item = todayCompletedLogs[idx];
    currentUser.credits += item.credits; // restore credits
    todayCompletedLogs.splice(idx, 1);
    return res.json({ success: true, message: 'Redemption voided and credits refunded', restoredCredits: item.credits });
  }

  res.status(404).json({ success: false, error: 'Redemption log entry not found' });
});

// GET /api/admin/payouts
router.get('/payouts', (_req: Request, res: Response) => {
  res.json({ success: true, payouts: adminPayouts });
});

// POST /api/admin/payouts/:id/pay
router.post('/payouts/:id/pay', (req: Request, res: Response) => {
  const { id } = req.params;
  adminPayouts = adminPayouts.map((p) => (p.id === id ? { ...p, status: 'Paid' } : p));
  res.json({ success: true, payout: adminPayouts.find((p) => p.id === id) });
});

export { router as adminRoutes };

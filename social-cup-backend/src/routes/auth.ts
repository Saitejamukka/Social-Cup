import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { hashPassword, verifyPassword, signUserToken, requireAuth, AuthedRequest } from '../lib/auth.js';

const router = Router();

function serializeUser(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  accountStatus: string;
  credits: number;
  neighborhood: string | null;
  preferences: string[];
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    accountStatus: user.accountStatus,
    credits: user.credits,
    neighborhood: user.neighborhood,
    preferences: user.preferences,
  };
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const { email, password, name } = req.body ?? {};

  if (!email || !password || !name) {
    return res.status(400).json({ success: false, error: 'email, password, and name are required' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
  }

  const existing = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
  if (existing) {
    return res.status(409).json({ success: false, error: 'An account with this email already exists' });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email: String(email).toLowerCase(),
      passwordHash,
      name,
      role: 'CUSTOMER',
      accountStatus: 'VISITOR',
      credits: 0,
    },
  });

  const token = signUserToken({ sub: user.id, role: user.role });
  res.status(201).json({ success: true, token, user: serializeUser(user) });
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'email and password are required' });
  }

  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }

  const token = signUserToken({ sub: user.id, role: user.role });
  res.json({ success: true, token, user: serializeUser(user) });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthedRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  res.json({ success: true, user: serializeUser(user) });
});

// PATCH /api/auth/profile — display name, neighbourhood, coffee preferences
router.patch('/profile', requireAuth, async (req: AuthedRequest, res: Response) => {
  const { name, neighborhood, preferences } = req.body ?? {};
  const user = await prisma.user.update({
    where: { id: req.userId! },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(neighborhood !== undefined ? { neighborhood } : {}),
      ...(preferences !== undefined ? { preferences: Array.isArray(preferences) ? preferences : [preferences] } : {}),
    },
  });
  res.json({ success: true, user: serializeUser(user) });
});

// POST /api/auth/subscribe
// Simulates a successful Stripe checkout confirmation. Real Stripe subscriptions,
// the payment sheet, and webhooks are not wired up in this environment — see
// project notes. This endpoint is where a verified Stripe webhook handler would
// call the same credit-grant logic in production.
router.post('/subscribe', requireAuth, async (req: AuthedRequest, res: Response) => {
  const user = await prisma.user.update({
    where: { id: req.userId! },
    data: { accountStatus: 'MEMBER', credits: 30 },
  });
  res.json({ success: true, message: 'Subscribed — 30 drink credits granted', user: serializeUser(user) });
});

// POST /api/auth/cancel — cancel membership (access continues until period end is
// not modeled without real Stripe billing periods, so this deactivates immediately
// and is clearly labeled as a dev-mode simplification to the client).
router.post('/cancel', requireAuth, async (req: AuthedRequest, res: Response) => {
  const user = await prisma.user.update({
    where: { id: req.userId! },
    data: { accountStatus: 'CANCELED' },
  });
  res.json({ success: true, user: serializeUser(user) });
});

// DELETE /api/auth/account — required by Apple; cancels any active membership.
// Redemption and payout history must survive account deletion (cafes' monthly
// statements stay auditable), so this anonymizes the user rather than removing
// the row outright.
router.delete('/account', requireAuth, async (req: AuthedRequest, res: Response) => {
  const id = req.userId!;
  await prisma.user.update({
    where: { id },
    data: {
      email: `deleted-${id}@social-cup.invalid`,
      passwordHash: 'deleted',
      name: 'Deleted user',
      accountStatus: 'CANCELED',
      credits: 0,
    },
  });
  res.json({ success: true, message: 'Account deleted' });
});

export { router as authRoutes };

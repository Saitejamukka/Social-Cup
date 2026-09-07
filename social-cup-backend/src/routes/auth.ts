import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import {
  hashPassword,
  verifyPassword,
  signUserToken,
  requireAuth,
  AuthedRequest,
  verifyOAuthIdToken,
  providerLabel,
  OAuthVerificationError,
  OAuthProvider,
} from '../lib/auth.js';

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
  authProvider: string;
  subscriptionCancelAtPeriodEnd: boolean;
  subscriptionCurrentPeriodEnd: Date | null;
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
    authProvider: user.authProvider,
    subscriptionCancelAtPeriodEnd: user.subscriptionCancelAtPeriodEnd,
    subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd,
  };
}

function isOAuthProvider(value: string): value is OAuthProvider {
  return value === 'google' || value === 'apple';
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
      authProvider: 'EMAIL',
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
  if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }
  if (user.authProvider !== 'EMAIL') {
    return res.status(403).json({
      success: false,
      error: `This account was created using ${providerLabel(user.authProvider)}. Please sign in with ${providerLabel(user.authProvider)} instead.`,
      code: 'PROVIDER_MISMATCH',
      authProvider: user.authProvider,
    });
  }

  const token = signUserToken({ sub: user.id, role: user.role });
  res.json({ success: true, token, user: serializeUser(user) });
});

// POST /api/auth/oauth/:provider/signup — creates a new account from a verified
// Google/Apple identity. Idempotent: signing up again with the same provider
// identity just logs the existing account in instead of erroring.
router.post('/oauth/:provider/signup', async (req: Request, res: Response) => {
  const provider = req.params.provider;
  if (!isOAuthProvider(provider)) {
    return res.status(400).json({ success: false, error: 'Unsupported provider' });
  }
  const { idToken, name: clientName } = req.body ?? {};

  let identity;
  try {
    identity = await verifyOAuthIdToken(provider, idToken);
  } catch (err) {
    const message = err instanceof OAuthVerificationError ? err.message : 'Could not verify sign-in';
    return res.status(401).json({ success: false, error: message });
  }

  const providerKey = provider.toUpperCase() as 'GOOGLE' | 'APPLE';

  const existingByProvider = await prisma.user.findUnique({
    where: { authProvider_providerUserId: { authProvider: providerKey, providerUserId: identity.sub } },
  });
  if (existingByProvider) {
    const token = signUserToken({ sub: existingByProvider.id, role: existingByProvider.role });
    return res.json({ success: true, token, user: serializeUser(existingByProvider) });
  }

  if (!identity.email) {
    return res.status(400).json({ success: false, error: `${providerLabel(provider)} did not share an email address for this account` });
  }

  const existingByEmail = await prisma.user.findUnique({ where: { email: identity.email } });
  if (existingByEmail) {
    return res.status(409).json({
      success: false,
      error: `An account with this email already exists using ${providerLabel(existingByEmail.authProvider)}. Please sign in with ${providerLabel(existingByEmail.authProvider)} instead.`,
      code: 'PROVIDER_MISMATCH',
      authProvider: existingByEmail.authProvider,
    });
  }

  const name = (typeof clientName === 'string' && clientName.trim()) || identity.name || 'New user';
  const user = await prisma.user.create({
    data: {
      email: identity.email,
      name,
      role: 'CUSTOMER',
      accountStatus: 'VISITOR',
      credits: 0,
      authProvider: providerKey,
      providerUserId: identity.sub,
    },
  });

  const token = signUserToken({ sub: user.id, role: user.role });
  res.status(201).json({ success: true, token, user: serializeUser(user) });
});

// POST /api/auth/oauth/:provider/signin — restricted to the provider the account
// was originally created with; never auto-creates an account.
router.post('/oauth/:provider/signin', async (req: Request, res: Response) => {
  const provider = req.params.provider;
  if (!isOAuthProvider(provider)) {
    return res.status(400).json({ success: false, error: 'Unsupported provider' });
  }
  const { idToken } = req.body ?? {};

  let identity;
  try {
    identity = await verifyOAuthIdToken(provider, idToken);
  } catch (err) {
    const message = err instanceof OAuthVerificationError ? err.message : 'Could not verify sign-in';
    return res.status(401).json({ success: false, error: message });
  }

  if (!identity.email) {
    return res.status(400).json({ success: false, error: `${providerLabel(provider)} did not share an email address for this account` });
  }

  const user = await prisma.user.findUnique({ where: { email: identity.email } });
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'No account found for this email. Please sign up first.',
      code: 'NO_ACCOUNT',
    });
  }

  const providerKey = provider.toUpperCase() as 'GOOGLE' | 'APPLE';
  if (user.authProvider !== providerKey || user.providerUserId !== identity.sub) {
    return res.status(403).json({
      success: false,
      error: `This account was created using ${providerLabel(user.authProvider)}. Please sign in with ${providerLabel(user.authProvider)} instead.`,
      code: 'PROVIDER_MISMATCH',
      authProvider: user.authProvider,
    });
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

// Subscribe/cancel now live at POST /api/billing/subscribe and /api/billing/cancel,
// backed by real Stripe subscriptions + webhooks — see routes/billing.ts.

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
      passwordHash: null,
      providerUserId: null,
      name: 'Deleted user',
      accountStatus: 'CANCELED',
      credits: 0,
    },
  });
  res.json({ success: true, message: 'Account deleted' });
});

export { router as authRoutes };

import { randomBytes } from 'crypto';
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
import { sendVerificationEmail, sendPasswordResetEmail } from '../lib/email.js';

const router = Router();

function newToken(): string {
  return randomBytes(32).toString('hex');
}

// A minimal styled page for the two links that land in a user's inbox — the
// mobile app itself can't render these (no in-app browser step in this flow),
// so the backend hosts them directly rather than needing app deep-linking.
function renderPage(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — Social Cup</title>
  <style>
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; background: #FCFCF8; color: #2B3320; margin: 0; padding: 48px 24px; display: flex; justify-content: center; }
    .card { max-width: 380px; width: 100%; background: #FFFFFF; border: 1px solid #DEE3D0; border-radius: 16px; padding: 32px; text-align: center; }
    h1 { font-size: 20px; margin: 0 0 12px; }
    p { font-size: 14px; color: #6E7359; line-height: 20px; }
    input { width: 100%; box-sizing: border-box; padding: 13px; border-radius: 10px; border: 1px solid #DEE3D0; font-size: 14px; margin-top: 12px; }
    button { width: 100%; padding: 14px; border-radius: 12px; border: none; background: #6B7A3B; color: #FFFFFF; font-weight: 600; font-size: 15px; margin-top: 16px; cursor: pointer; }
    .error { color: #B84C3E; font-size: 13px; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 15px; font-weight: 700; margin-bottom: 16px;">☕ Social Cup</div>
    ${bodyHtml}
  </div>
</body>
</html>`;
}

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
  emailVerified: boolean;
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
    emailVerified: user.emailVerified,
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
  const verificationToken = newToken();
  const user = await prisma.user.create({
    data: {
      email: String(email).toLowerCase(),
      passwordHash,
      name,
      role: 'CUSTOMER',
      accountStatus: 'VISITOR',
      credits: 0,
      authProvider: 'EMAIL',
      emailVerificationToken: verificationToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  await sendVerificationEmail(user.email, user.name, verificationToken);

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
      // The provider already verified this address — no confirmation email needed.
      emailVerified: true,
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

// GET /api/auth/verify-email?token=... — the link tapped from the verification email.
router.get('/verify-email', async (req: Request, res: Response) => {
  const token = String(req.query.token || '');
  const user = token ? await prisma.user.findUnique({ where: { emailVerificationToken: token } }) : null;

  if (!user || !user.emailVerificationExpires || user.emailVerificationExpires.getTime() < Date.now()) {
    return res.status(400).send(
      renderPage(
        'Link expired',
        `<h1>This link has expired</h1><p>Verification links are valid for 24 hours. Open the app and request a new one from the verify-email screen.</p>`
      )
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerificationToken: null, emailVerificationExpires: null },
  });

  res.send(renderPage('Email verified', `<h1>Email verified ✓</h1><p>You're all set — head back to the Social Cup app to continue.</p>`));
});

// POST /api/auth/resend-verification — requires the caller to already be signed
// in (they get a token from register), so this can't be used to enumerate emails.
router.post('/resend-verification', requireAuth, async (req: AuthedRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  if (user.emailVerified) {
    return res.json({ success: true, message: 'Email already verified' });
  }

  const verificationToken = newToken();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationToken: verificationToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  await sendVerificationEmail(user.email, user.name, verificationToken);

  res.json({ success: true, message: 'Verification email sent' });
});

// POST /api/auth/forgot-password — always responds success regardless of whether
// the email exists, so this endpoint can't be used to check who has an account.
router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body ?? {};
  if (email) {
    const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
    if (user && user.authProvider === 'EMAIL') {
      const resetToken = newToken();
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken: resetToken, passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000) },
      });
      await sendPasswordResetEmail(user.email, user.name, resetToken);
    }
  }
  res.json({ success: true, message: 'If that email has an account, a reset link is on its way.' });
});

// GET /api/auth/reset-password?token=... — the link tapped from the reset email;
// hosts the actual "type a new password" form since the mobile app has no way
// to collect that from inside the email itself.
router.get('/reset-password', async (req: Request, res: Response) => {
  const token = String(req.query.token || '');
  const user = token ? await prisma.user.findUnique({ where: { passwordResetToken: token } }) : null;

  if (!user || !user.passwordResetExpires || user.passwordResetExpires.getTime() < Date.now()) {
    return res.status(400).send(
      renderPage('Link expired', `<h1>This link has expired</h1><p>Password reset links are valid for one hour. Request a new one from the app.</p>`)
    );
  }

  res.send(
    renderPage(
      'Reset your password',
      `<h1>Choose a new password</h1>
       <form id="f">
         <input type="password" id="password" placeholder="New password (min 8 characters)" minlength="8" required />
         <button type="submit">Reset password</button>
       </form>
       <div class="error" id="err"></div>
       <script>
         document.getElementById('f').addEventListener('submit', async (e) => {
           e.preventDefault();
           const password = document.getElementById('password').value;
           const res = await fetch('/api/auth/reset-password', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ token: ${JSON.stringify(token)}, password }),
           });
           const body = await res.json();
           if (body.success) {
             document.querySelector('.card').innerHTML = '<div style="font-size:15px;font-weight:700;margin-bottom:16px;">☕ Social Cup</div><h1>Password updated ✓</h1><p>Head back to the app and log in with your new password.</p>';
           } else {
             document.getElementById('err').textContent = body.error || 'Something went wrong.';
           }
         });
       </script>`
    )
  );
});

// POST /api/auth/reset-password — called by the form above via fetch.
router.post('/reset-password', async (req: Request, res: Response) => {
  const { token, password } = req.body ?? {};
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
  }

  const user = token ? await prisma.user.findUnique({ where: { passwordResetToken: String(token) } }) : null;
  if (!user || !user.passwordResetExpires || user.passwordResetExpires.getTime() < Date.now()) {
    return res.status(400).json({ success: false, error: 'This reset link has expired' });
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, passwordResetToken: null, passwordResetExpires: null },
  });

  res.json({ success: true });
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

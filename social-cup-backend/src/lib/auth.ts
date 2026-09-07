import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { Request, Response, NextFunction } from 'express';
import { prisma } from './prisma.js';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set');
}
const JWT_SECRET: string = process.env.JWT_SECRET;

export interface UserTokenPayload {
  sub: string;
  role: 'CUSTOMER' | 'BARISTA' | 'ADMIN';
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signUserToken(payload: UserTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

// ---- OAuth (Google / Apple) sign-up / sign-in ----
// Both providers hand the client a signed JWT ("ID token" for Google, "identity
// token" for Apple) instead of a raw credential, so the server verifies it against
// the provider's public JWKS rather than trusting whatever the client claims.

export type OAuthProvider = 'google' | 'apple';

export interface OAuthIdentity {
  sub: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
}

const PROVIDER_CONFIG: Record<
  OAuthProvider,
  { issuers: string[]; jwksUri: string; audiences: string[] }
> = {
  google: {
    issuers: ['https://accounts.google.com', 'accounts.google.com'],
    jwksUri: 'https://www.googleapis.com/oauth2/v3/certs',
    audiences: (process.env.GOOGLE_CLIENT_IDS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  },
  apple: {
    issuers: ['https://appleid.apple.com'],
    jwksUri: 'https://appleid.apple.com/auth/keys',
    audiences: (process.env.APPLE_CLIENT_IDS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  },
};

const jwksClients: Record<OAuthProvider, jwksClient.JwksClient> = {
  google: jwksClient({ jwksUri: PROVIDER_CONFIG.google.jwksUri, cache: true, rateLimit: true }),
  apple: jwksClient({ jwksUri: PROVIDER_CONFIG.apple.jwksUri, cache: true, rateLimit: true }),
};

function getSigningKey(provider: OAuthProvider, kid: string): Promise<string> {
  return new Promise((resolve, reject) => {
    jwksClients[provider].getSigningKey(kid, (err, key) => {
      if (err || !key) return reject(err || new Error('Signing key not found'));
      resolve(key.getPublicKey());
    });
  });
}

export class OAuthVerificationError extends Error {}

/** Verifies a Google ID token or Apple identity token and returns the caller's identity. */
export async function verifyOAuthIdToken(provider: OAuthProvider, idToken: string): Promise<OAuthIdentity> {
  if (typeof idToken !== 'string' || !idToken) {
    throw new OAuthVerificationError('Missing ID token');
  }

  const config = PROVIDER_CONFIG[provider];
  if (config.audiences.length === 0) {
    throw new OAuthVerificationError(`${provider} sign-in is not configured on this server`);
  }

  const decoded = jwt.decode(idToken, { complete: true });
  if (!decoded || typeof decoded === 'string' || !decoded.header.kid) {
    throw new OAuthVerificationError('Malformed ID token');
  }

  let signingKey: string;
  try {
    signingKey = await getSigningKey(provider, decoded.header.kid);
  } catch {
    throw new OAuthVerificationError('Could not resolve token signing key');
  }

  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(idToken, signingKey, {
      algorithms: ['RS256'],
      issuer: config.issuers as [string, ...string[]],
      audience: config.audiences as [string, ...string[]],
    }) as jwt.JwtPayload;
  } catch {
    throw new OAuthVerificationError('Invalid or expired ID token');
  }

  if (!payload.sub) {
    throw new OAuthVerificationError('ID token missing subject claim');
  }

  return {
    sub: payload.sub,
    email: typeof payload.email === 'string' ? payload.email.toLowerCase() : null,
    emailVerified: payload.email_verified === true || payload.email_verified === 'true',
    name: typeof payload.name === 'string' ? payload.name : null,
  };
}

export function providerLabel(provider: OAuthProvider | 'EMAIL' | 'GOOGLE' | 'APPLE'): string {
  const key = provider.toString().toLowerCase();
  if (key === 'google') return 'Google';
  if (key === 'apple') return 'Apple';
  return 'email and password';
}

export interface AuthedRequest extends Request {
  userId?: string;
  userRole?: 'CUSTOMER' | 'BARISTA' | 'ADMIN';
}

/** Requires a valid `Authorization: Bearer <token>` header, attaches userId/userRole. */
export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, error: 'Missing authorization token' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as unknown as UserTokenPayload;
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    req.userId = user.id;
    req.userRole = user.role;
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: Array<'CUSTOMER' | 'BARISTA' | 'ADMIN'>) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    next();
  };
}

// ---- Barista device tokens ----
// Issued after a correct cafe PIN entry. Scoped to one cafe and embeds the cafe's
// current pinVersion, so resetting the PIN (which bumps pinVersion) invalidates
// every previously trusted device at once, without a server-side session table.

export interface DeviceTokenPayload {
  cafeId: string;
  pinVersion: number;
  typ: 'device';
}

export function signDeviceToken(payload: DeviceTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '180d' });
}

export interface DeviceAuthedRequest extends Request {
  cafeId?: string;
}

export function requireDeviceAuth(paramCafeId: (req: Request) => string | undefined) {
  return async (req: DeviceAuthedRequest, res: Response, next: NextFunction) => {
    const header = req.headers['x-device-token'];
    const token = typeof header === 'string' ? header : undefined;
    const cafeId = paramCafeId(req);

    if (!token || !cafeId) {
      return res.status(401).json({ success: false, error: 'Missing device token' });
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET) as unknown as DeviceTokenPayload;
      if (payload.typ !== 'device' || payload.cafeId !== cafeId) {
        return res.status(401).json({ success: false, error: 'Device token does not match cafe' });
      }
      const cafe = await prisma.cafe.findUnique({ where: { id: cafeId } });
      if (!cafe || cafe.pinVersion !== payload.pinVersion) {
        return res.status(401).json({ success: false, error: 'Device no longer trusted — PIN was reset' });
      }
      req.cafeId = cafeId;
      next();
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid or expired device token' });
    }
  };
}

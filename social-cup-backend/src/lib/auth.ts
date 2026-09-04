import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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

// Simple in-memory rate limiter for barista PIN attempts, keyed by cafeId.
// Good enough for a single backend instance; a multi-instance deployment
// would move this to Redis.

interface Bucket {
  count: number;
  windowStart: number;
  lockedUntil?: number;
}

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 10 * 60 * 1000; // 10 minutes

export function checkPinRateLimit(cafeId: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const bucket = buckets.get(cafeId);

  if (bucket?.lockedUntil && bucket.lockedUntil > now) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.lockedUntil - now) / 1000) };
  }

  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    buckets.set(cafeId, { count: 0, windowStart: now });
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordPinFailure(cafeId: string): void {
  const now = Date.now();
  const bucket = buckets.get(cafeId) ?? { count: 0, windowStart: now };

  if (now - bucket.windowStart > WINDOW_MS) {
    bucket.count = 0;
    bucket.windowStart = now;
  }

  bucket.count += 1;
  if (bucket.count >= MAX_ATTEMPTS) {
    bucket.lockedUntil = now + LOCKOUT_MS;
  }
  buckets.set(cafeId, bucket);
}

export function resetPinRateLimit(cafeId: string): void {
  buckets.delete(cafeId);
}

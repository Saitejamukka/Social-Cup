// Simple in-memory rate limiter, keyed by whatever the caller chooses (cafeId,
// email, IP, etc). Good enough for a single backend instance; a multi-instance
// deployment would move this to Redis.

interface Bucket {
  count: number;
  windowStart: number;
  lockedUntil?: number;
}

interface RateLimiterOptions {
  windowMs: number;
  maxAttempts: number;
  lockoutMs: number;
}

function createRateLimiter({ windowMs, maxAttempts, lockoutMs }: RateLimiterOptions) {
  const buckets = new Map<string, Bucket>();

  return {
    check(key: string): { allowed: boolean; retryAfterSeconds?: number } {
      const now = Date.now();
      const bucket = buckets.get(key);

      if (bucket?.lockedUntil && bucket.lockedUntil > now) {
        return { allowed: false, retryAfterSeconds: Math.ceil((bucket.lockedUntil - now) / 1000) };
      }

      if (!bucket || now - bucket.windowStart > windowMs) {
        buckets.set(key, { count: 0, windowStart: now });
        return { allowed: true };
      }

      return { allowed: true };
    },

    recordFailure(key: string): void {
      const now = Date.now();
      const bucket = buckets.get(key) ?? { count: 0, windowStart: now };

      if (now - bucket.windowStart > windowMs) {
        bucket.count = 0;
        bucket.windowStart = now;
      }

      bucket.count += 1;
      if (bucket.count >= maxAttempts) {
        bucket.lockedUntil = now + lockoutMs;
      }
      buckets.set(key, bucket);
    },

    reset(key: string): void {
      buckets.delete(key);
    },
  };
}

// Barista PIN attempts, keyed by cafeId — 5 attempts per 5 minutes, then a
// 10-minute lockout. Kept as named functions for the existing call sites.
const pinLimiter = createRateLimiter({ windowMs: 5 * 60 * 1000, maxAttempts: 5, lockoutMs: 10 * 60 * 1000 });
export const checkPinRateLimit = (cafeId: string) => pinLimiter.check(cafeId);
export const recordPinFailure = (cafeId: string) => pinLimiter.recordFailure(cafeId);
export const resetPinRateLimit = (cafeId: string) => pinLimiter.reset(cafeId);

// Login attempts, keyed by email — 10 attempts per 10 minutes, then a
// 15-minute lockout. Looser than the PIN limiter since a shared cafe PIN has
// a much smaller keyspace than a password.
const loginLimiter = createRateLimiter({ windowMs: 10 * 60 * 1000, maxAttempts: 10, lockoutMs: 15 * 60 * 1000 });
export const checkLoginRateLimit = (email: string) => loginLimiter.check(email.toLowerCase());
export const recordLoginFailure = (email: string) => loginLimiter.recordFailure(email.toLowerCase());
export const resetLoginRateLimit = (email: string) => loginLimiter.reset(email.toLowerCase());

// Barista code-scan attempts, keyed by cafeId — the code space is only 6
// digits, so this needs to be tight: 20 attempts per minute, then a 2-minute
// lockout. Successful scans don't call recordFailure, so a legitimate cafe
// scanning many real member codes in a minute is unaffected.
const scanLimiter = createRateLimiter({ windowMs: 60 * 1000, maxAttempts: 20, lockoutMs: 2 * 60 * 1000 });
export const checkScanRateLimit = (cafeId: string) => scanLimiter.check(cafeId);
export const recordScanFailure = (cafeId: string) => scanLimiter.recordFailure(cafeId);

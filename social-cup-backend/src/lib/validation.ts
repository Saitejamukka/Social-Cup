// Small shared validation helpers used across the admin routes — nothing
// fancy (no zod/joi dependency), just the checks the QA pass found missing:
// positive/bounded numbers, reasonable text lengths, and safe date parsing.

export function isPrismaNotFoundError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === 'P2025';
}

// A delete that would orphan existing rows referencing it (e.g. a cafe/drink
// with redemption history) — surface as a clean 409, not a raw 500.
export function isPrismaForeignKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === 'P2003';
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

// Credits/retail prices: must be a positive, finite number under a sane cap —
// closes API-007/API-014/ADM-004 (negative or absurdly large drink pricing).
export function isValidMoneyOrCreditAmount(value: unknown, max = 1000): boolean {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 && n <= max;
}

export function isValidPayoutRate(value: unknown): boolean {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 && n <= 100;
}

export function isValidLatitude(value: unknown): boolean {
  const n = Number(value);
  return Number.isFinite(n) && n >= -90 && n <= 90;
}

export function isValidLongitude(value: unknown): boolean {
  const n = Number(value);
  return Number.isFinite(n) && n >= -180 && n <= 180;
}

// Trims and caps free-text fields — ADM-005's "5000-char name" gap. Doesn't
// HTML-escape: both the admin portal (React) and mobile app (React Native
// <Text>) already render this verbatim as text, never as markup, so there's
// no injection to neutralize there — CSV export has its own escaping (see
// escapeCsvCell) since spreadsheet formula injection is a distinct concern.
export function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.slice(0, maxLength);
}

// A basic http(s) URL check for photo/image fields — rejects javascript:,
// data: (outside the profile-photo upload path, which validates separately),
// and other non-http schemes someone could paste into a "Cover Photo URL" box.
export function isValidHttpUrl(value: unknown): boolean {
  if (typeof value !== 'string' || !value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Parses a `from`/`to` query date param safely — API-009's crash on
// `from=not-a-date`. Returns null for both "absent" and "invalid" so callers
// can tell the difference from a real, usable Date only via the ok flag.
export function parseDateParam(value: string | undefined): { ok: true; date: Date | undefined } | { ok: false } {
  if (value === undefined) return { ok: true, date: undefined };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { ok: false };
  return { ok: true, date };
}

// Validates a `period=YYYY-MM` query param — API-009's crash on `period=garbage`.
export function parseBillingPeriod(value: string): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

// Excel/Sheets treat a cell starting with =, +, -, or @ as a formula — API-011's
// CSV formula-injection gap. Prefixing with a tab neutralizes it while staying
// invisible to a human reading the exported file.
export function escapeCsvCell(value: unknown): string {
  const str = String(value ?? '');
  const neutralized = /^[=+\-@]/.test(str) ? `\t${str}` : str;
  return `"${neutralized.replace(/"/g, '""')}"`;
}

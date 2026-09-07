import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY must be set');
}
if (!process.env.EMAIL_FROM) {
  throw new Error('EMAIL_FROM must be set');
}
if (!process.env.APP_BASE_URL) {
  throw new Error('APP_BASE_URL must be set');
}

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM;
export const APP_BASE_URL = process.env.APP_BASE_URL;

function wrapper(bodyHtml: string): string {
  return `
    <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #2B3320;">
      <div style="font-size: 22px; font-weight: 700; margin-bottom: 24px;">☕ Social Cup</div>
      ${bodyHtml}
      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #DEE3D0; font-size: 12px; color: #6E7359;">
        If you didn't request this, you can safely ignore this email.
      </div>
    </div>
  `;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display: inline-block; margin-top: 20px; padding: 14px 28px; background-color: #6B7A3B; color: #FFFFFF; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px;">${label}</a>`;
}

// Emails are a side effect of the real action (registering, requesting a reset,
// redeeming) — a delivery failure here must never fail that action, only log.
async function sendSafely(params: { to: string; subject: string; html: string }) {
  try {
    await resend.emails.send({ from: FROM, ...params });
  } catch (err) {
    console.error(`[email] Failed to send "${params.subject}" to ${params.to}:`, err);
  }
}

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const link = `${APP_BASE_URL}/api/auth/verify-email?token=${token}`;
  await sendSafely({
    to,
    subject: 'Verify your Social Cup email',
    html: wrapper(`
      <p>Hi ${name},</p>
      <p>Tap the button below to verify your email address and finish setting up your Social Cup account.</p>
      ${button(link, 'Verify email')}
    `),
  });
}

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const link = `${APP_BASE_URL}/api/auth/reset-password?token=${token}`;
  await sendSafely({
    to,
    subject: 'Reset your Social Cup password',
    html: wrapper(`
      <p>Hi ${name},</p>
      <p>We got a request to reset your Social Cup password. This link expires in one hour.</p>
      ${button(link, 'Reset password')}
    `),
  });
}

export async function sendRedemptionConfirmationEmail(
  to: string,
  name: string,
  details: { drinkName: string; cafeName: string; creditsDeducted: number }
) {
  await sendSafely({
    to,
    subject: `You redeemed ${details.drinkName} at ${details.cafeName}`,
    html: wrapper(`
      <p>Hi ${name},</p>
      <p>Your redemption just went through:</p>
      <div style="margin-top: 12px; padding: 16px; background-color: #FAFBF6; border-radius: 10px; border: 1px solid #EEF1E3;">
        <div style="font-weight: 700; font-size: 16px;">${details.drinkName}</div>
        <div style="color: #6E7359; font-size: 13px; margin-top: 2px;">${details.cafeName}</div>
        <div style="color: #6B7A3B; font-weight: 600; font-size: 13px; margin-top: 8px;">${details.creditsDeducted} credits deducted</div>
      </div>
      <p style="margin-top: 20px;">Enjoy your drink! Don't forget to rate it in the app.</p>
    `),
  });
}

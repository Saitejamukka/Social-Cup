# ☕ Social Cup — Specialty Coffee Subscription & Counter Verification Platform

A modern specialty coffee subscription platform connecting coffee lovers with premier local specialty coffee roasters and cafes.

---

## 🏛️ Architecture Overview

The codebase is organized into three clean layers:

```
Social Cup/
├── social-cup-mobile/   # 📱 Customer Mobile App (React Native · Expo SDK 57 · React 19)
├── social-cup-portal/   # 💻 Unified Business & Staff Web Portal (React 19 · Vite · TypeScript)
└── social-cup-backend/  # ⚙️ REST API & PostgreSQL Database (Node.js · Express · Prisma)
```

---

## 🚀 Applications

### 1. 📱 Customer Mobile App (`social-cup-mobile`)
- **Built with**: React Native, Expo, TypeScript, Zustand.
- **Features**:
  - Sign up/log in with email or Google (real OAuth, verified server-side against Google's JWKS); Apple Sign-In is implemented but gated behind a paid Apple Developer account.
  - Real email verification and "forgot password" flows (Resend) — a verification link and a hosted reset-password page, both sent from real emails; a confirmation email also lands after every drink redemption.
  - Real Stripe subscriptions (test mode) — native PaymentSheet checkout, webhook-driven credit granting, cancel-at-period-end.
  - Browse curated specialty cafes mapped to Dallas neighborhoods (Bishop Arts, Deep Ellum, Uptown, Knox-Henderson, etc.), with real GPS-based distance sorting (toggle-able) and a neighbourhood fallback when location is off.
  - Interactive photo galleries for cafes and signature specialty drinks.
  - 5-minute redemption codes shown as a real scannable QR code, with a live countdown timer and 6-character backup code.
  - Personal Coffee Diary with 1–5 star ratings and tasting notes.
  - A custom Source Serif 4 / Work Sans / Dancing Script type system and smooth entrance/press animations throughout, built on React Native's `Animated` API (no native animation dependency).

### 2. 💻 Unified Business Web Portal (`social-cup-portal`)
- **Built with**: React 19, Vite, TypeScript.
- **Role-Based Portals**:
  - **👑 HQ Administration**: Platform MRR, subscriber directory, live pricing and margin calculator, a Settings tab showing the live Stripe plan price, a partner-cafe management drawer (coordinates, cover photo, gallery, vibe tags, perk line), redemption audit trail with voiding modal, and monthly payout batches.
  - **☕ Cafe Staff / Baristas**: Locked strictly to their assigned counter station, 4-digit station PIN security, real camera-based QR scanning (auto-detects and redeems), manual backup code entry as a fallback, scan verification (Success / Expired / Already used / Wrong cafe), today's live redemption log, and monthly cafe earnings summary.

### 3. ⚙️ Central Backend API (`social-cup-backend`)
- **Built with**: Node.js, Express, TypeScript, Prisma, PostgreSQL, Stripe, Resend.
- **Features**:
  - Modular REST endpoints for authentication (email/Google/Apple), email verification & password reset, cafe catalog with distance-based sorting, redemption code generation & double-spend-safe scan verification, Stripe billing + webhooks, and admin financial reports.
  - Complete PostgreSQL schema (`User`, `Cafe`, `Drink`, `Redemption`, `Payout`, `Review`).

> Not yet built: native on-device testing of Stripe/Google Sign-In (blocked on a native Android build issue, unrelated to either feature), a verified sending domain with SPF/DKIM (email currently sends through Resend's shared test domain), AWS S3/CloudFront photo storage, Sentry, CI/CD, and everything under the PRD's Phase 2 (cafe self-service portal, push notifications, connections/meetup features, etc).

---

## 🛠️ Getting Started

### Prerequisites
- Node.js >= 18
- npm or yarn
- A local PostgreSQL instance
- A free [Stripe](https://stripe.com) account (test mode) if you want billing to work
- The [Stripe CLI](https://docs.stripe.com/stripe-cli) if you want to receive webhooks locally
- A free [Resend](https://resend.com) account if you want verification/reset/redemption emails to actually send

### 1. Backend API
```bash
cd social-cup-backend
npm install
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, Stripe keys, OAuth client IDs, Resend key
npx prisma migrate deploy
npm run seed
npm run dev
```
To receive Stripe webhooks locally, in a second terminal run:
```bash
stripe listen --forward-to localhost:4000/api/webhooks/stripe --print-secret
```
and put the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET` in `.env`.

For email, grab an API key from Resend's dashboard (Developers → API Keys) and set `RESEND_API_KEY` — the default `EMAIL_FROM` (`onboarding@resend.dev`) sends real emails immediately, no domain verification needed for local dev.

### 2. Mobile App
```bash
cd social-cup-mobile
npm install
npm run web   # see note below on native-only features
```
> Google Sign-In works today via `npm run web` (a web OAuth client). Native iOS/Android Google Sign-In and Stripe's PaymentSheet are native-only and need a custom dev build (`npx expo run:android` / `run:ios`), not Expo Go — `npm run web` is the fastest path for everything else.

### 3. Business Web Portal
```bash
cd social-cup-portal
npm install
npm run dev
```

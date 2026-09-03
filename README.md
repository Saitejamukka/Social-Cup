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
- **Built with**: React Native, Expo, TypeScript, Zustand, Lucide React Native.
- **Features**:
  - Browse curated specialty cafes mapped to Dallas neighborhoods (Bishop Arts, Deep Ellum, Uptown, Knox-Henderson, etc.).
  - Interactive photo galleries for cafes and signature specialty drinks.
  - 5-Minute dynamic QR redemption code generator with live countdown timer and 6-character backup code.
  - Personal Coffee Diary with 1–5 star ratings and tasting notes.
  - Social midpoint cafe recommender for meeting up with friends.

### 2. 💻 Unified Business Web Portal (`social-cup-portal`)
- **Built with**: React 19, Vite, TypeScript.
- **Role-Based Portals**:
  - **👑 HQ Administration**: Platform MRR, subscriber directory, live pricing and margin calculator, 30+ Dallas partner cafes management drawer, redemption audit trail with voiding modal, and monthly payout batches.
  - **☕ Cafe Staff / Baristas**: Locked strictly to their assigned counter station, 4-digit station PIN security, camera viewfinder with green scanline animation, manual backup code entry, scan verification (Success / Expired / Already used / Wrong cafe), today's live redemption log, and monthly cafe earnings summary.

### 3. ⚙️ Central Backend API (`social-cup-backend`)
- **Built with**: Node.js, Express, TypeScript, Prisma, PostgreSQL.
- **Features**:
  - Modular REST endpoints for authentication, cafe catalog, redemption code generation & double-spend protection, barista scan verification, and admin financial reports.
  - Complete PostgreSQL schema (`User`, `Cafe`, `Drink`, `Redemption`, `Payout`, `Review`).

---

## 🛠️ Getting Started

### Prerequisites
- Node.js >= 18
- npm or yarn

### 1. Mobile App
```bash
cd social-cup-mobile
npm install
npm run start # or npm run web
```

### 2. Business Web Portal
```bash
cd social-cup-portal
npm install
npm run dev
```

### 3. Backend API
```bash
cd social-cup-backend
npm install
npm start
```

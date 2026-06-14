# Booking System - Design Document

> **Date:** 2026-06-15 | **Status:** Draft | **Author:** AI-assisted

---

## 1. Overview

A web-based booking system for a venue (10 seats configurable). Supports B2C self-booking and Sales proxy-booking. Hong Kong based with Cantonese/Traditional Chinese UI (also Simplified Chinese and English via i18n).

---

## 2. Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js 14 (App Router) | Single TypeScript codebase, Server Actions, SSR |
| Language | TypeScript (strict) | Type safety end-to-end |
| Database | PostgreSQL | Relational integrity, rich query support |
| ORM | Prisma | Type-safe queries, migrations, seed support |
| Auth | NextAuth.js v5 | OAuth (Google), credentials (Email/Phone) |
| Styling | Tailwind CSS | Rapid UI, responsive by nature |
| i18n | next-intl | App Router compatible, 3 locales |
| Calendar | Custom build | No library fits the exact spec (per-hour ratio, split columns) |
| Payments | Admin-managed QR codes | No payment gateway integration; receipt upload only |
| File Upload | Server Actions + local/cloud storage | Receipt images (png/jpg/jpeg) |
| Holidays | data.gov.hk API | Hong Kong public holidays |
| Deployment | VPS (Docker or PM2 + Nginx) | User-managed hosting |

---

## 3. Data Model

```prisma
enum Role { USER VIP SALES ADMIN }
enum BookingStatus { PENDING CONFIRMED CANCELLED }
enum PaymentStatus { PENDING VERIFIED REJECTED }
enum AvailableDays { WEEKDAY WEEKDAY_NO_HOLIDAY ANY }
enum LeaveDay { SAME NEXT }

model User {
  id            String    @id @default(cuid())
  name          String
  phone         String?   @unique
  email         String?   @unique
  passwordHash  String?
  role          Role      @default(USER)
  totalSpent    Float     @default(0)
  createdAt     DateTime  @default(now())
  bookings      Booking[]
  accounts      OAuthAccount[]
}

model OAuthAccount {
  id                String  @id @default(cuid())
  userId            String
  user              User    @relation(fields: [userId], references: [id])
  provider          String  // google, facebook, instagram
  providerAccountId String
  @@unique([provider, providerAccountId])
}

model Plan {
  id               String       @id @default(cuid())
  name             String
  playHours        Int          // hours
  availableDays    AvailableDays
  timeStart        String       // "HH:mm" 
  timeEnd          String       // "HH:mm"
  earliestEntry    String       // "HH:mm"
  latestLeave      String       // "HH:mm"
  latestLeaveDay   LeaveDay     @default(SAME)
  price            Float
  deposit          Float
  overtimeRate     Float        // per hour
  isActive         Boolean      @default(true)
  createdAt        DateTime     @default(now())
  bookings         Booking[]
}

model Booking {
  id         String         @id @default(cuid())
  userId     String
  user       User           @relation(fields: [userId], references: [id])
  planId     String
  plan       Plan           @relation(fields: [planId], references: [id])
  date       DateTime       // booking date (UTC, truncated to date)
  startTime  String         // "HH:mm"
  endTime    String         // "HH:mm"
  persons    Int
  status     BookingStatus  @default(PENDING)
  amount     Float          // persons * plan.price
  deposit    Float          // persons * plan.deposit
  total      Float          // amount + deposit
  createdAt  DateTime       @default(now())
  payment    Payment?
}

model Payment {
  id            String        @id @default(cuid())
  bookingId     String        @unique
  booking       Booking       @relation(fields: [bookingId], references: [id])
  methodId      String?
  method        PaymentMethod? @relation(fields: [methodId], references: [id])
  receiptImage  String?       // file path/URL
  status        PaymentStatus @default(PENDING)
  uploadedAt    DateTime?
}

model PaymentMethod {
  id         String  @id @default(cuid())
  name       String
  qrImage    String  // file path/URL
  isActive   Boolean @default(true)
}

model Holiday {
  id    String   @id @default(cuid())
  date  DateTime @unique
  name  String
}

model Setting {
  key   String @id
  value String
}
```

---

## 4. Route Map

### Public (Frontend)

| Route | Page | Auth |
|-------|------|------|
| `/` | Home (landing, slideshow, plans, footer) | Public |
| `/[locale]/auth/login` | Login (Google OAuth + Email/Phone) | Guest |
| `/[locale]/auth/register` | Register (name, WhatsApp, email, password) | Guest |
| `/[locale]/booking` | Weekly calendar booking view | Member+ |
| `/[locale]/booking/payment?bookingId=` | Payment page (summary + receipt upload) | Member+ |
| `/[locale]/account` | My account (profile + history + upload) | Member+ |

### Admin (Backend)

| Route | Page | Auth |
|-------|------|------|
| `/[locale]/admin` | Booking overview (show member names/phones) | Admin |
| `/[locale]/admin/plans` | Plan CRUD | Admin |
| `/[locale]/admin/payments` | Payment method CRUD | Admin |
| `/[locale]/admin/users` | Member list + history | Admin |
| `/[locale]/admin/settings` | System settings (max seats, etc.) | Admin |

Sales users redirected to admin booking overview with limited write access (TBD).

---

## 5. Key Feature Designs

### 5.1 Booking Calendar (Most Complex)

**View:**
- Desktop: 7-day week view (today + 6 days)
- Mobile: 2-day view with prev/next buttons
- Time grid: 1-hour slots, appointments sized proportionally within slot
- Different colors per booking status/plan
- Split columns for overlapping bookings

**Logic:**
- Fetch HK public holidays via `data.gov.hk` API (cache daily)
- Sat/Sun marked as holiday (non-bookable unless plan allows "ANY")
- Plan filters: only show plans valid for the selected day
- If user is admin|sales: show member name + phone inside every booking cell
- If user is member: own bookings shown with detail (gray background); other users' bookings shown as occupied gray blocks with NO personal data visible, only indicating the slot is taken
- Remaining seats = maxSeats - confirmedBookings for that slot → show in blue

**State per slot:**
- Available (blue) — seats remaining > 0
- Partially booked — seats remaining < maxSeats
- Full (red/disabled) — seats remaining = 0
- User's own booking (gray with detail) — current user can see their own booking info
- Others' booking (gray block, no detail) — slot occupied, member info hidden
- Holiday/weekend (dimmed/disabled) — unless plan allows

### 5.2 Auth Flow

- Register: name, WhatsApp, email, password, confirm password
- Login: email OR phone + password; OR Google OAuth
- Facebook/IG OAuth deferred (infrastructure ready but not active)
- Session: NextAuth.js JWT strategy (no DB sessions needed)

### 5.3 Payment Flow

1. User selects booking slot + plan + persons → clicks "Confirm"
2. Navigate to `/booking/payment?bookingId=xxx`
3. Shows: member info, persons, plan, date, time, amount, deposit, total
4. Shows available payment methods (admin-managed QR codes)
5. User uploads receipt (png/jpg/jpeg) via file input
6. Booking status → PENDING; Payment status → PENDING
7. Admin later verifies payment → Booking CONFIRMED

### 5.4 Admin - Plan Management

Fields per plan:
- Name
- Play hours (integer)
- Available days: WEEKDAY / WEEKDAY_NO_HOLIDAY / ANY
- Available time: start (HH:mm) to end (HH:mm)
- Earliest entry (HH:mm)
- Latest leave (HH:mm) + day selector (SAME / NEXT)
- Price, Deposit, Overtime rate (per hour)

### 5.5 i18n

- `next-intl` with 3 locales: `zh-HK` (default), `zh-CN`, `en`
- All UI strings in JSON message files
- Language switcher in header/footer

---

## 6. AI Model Assignment

| Phase | Task | Model | Reason |
|-------|------|-------|--------|
| 1 | Prisma Schema + Seed | DeepSeek V4 Pro | Complex relational modeling |
| 2 | Auth (NextAuth) | Qwen 3.7 Max | Broad framework knowledge |
| 2 | Home Page | Qwen 3.7 Plus | Pure UI, low complexity |
| 2 | Booking Calendar | DeepSeek V4 Pro | Highest logic complexity |
| 2 | Admin Panel | Kimi K2.6 | CRUD forms, moderate complexity |
| 2 | Account Page | Qwen 3.7 Plus | Moderate UI complexity |
| 3 | Payment Flow | MiniMax M3 | Form validation + file handling |
| 3 | i18n (3 locales) | Mimo V2.5 Pro | Translation files, systematic work |
| Final | Verification | DeepSeek V4 Flash | Fast, thorough type/compat checks |

---

## 7. Project Directory Structure

```
booking-pixel/
  prisma/
    schema.prisma
    seed.ts
    migrations/
  src/
    app/
      [locale]/
        layout.tsx          # i18n provider
        page.tsx            # Home page
        auth/
          login/page.tsx
          register/page.tsx
        booking/
          page.tsx          # Calendar
          payment/page.tsx  # Payment summary
        account/
          page.tsx          # My account
        admin/
          page.tsx          # Booking overview
          plans/page.tsx
          payments/page.tsx
          users/page.tsx
          settings/page.tsx
        api/
          auth/[...nextauth]/route.ts
          holidays/route.ts        # proxy for HK gov API
          bookings/route.ts
          payments/route.ts
          upload/route.ts
    components/
      ui/                   # shared: Button, Input, Modal, etc.
      layout/               # Header, Footer, Sidebar
      booking/              # CalendarGrid, TimeSlot, BookingCell
      admin/                # PlanForm, PaymentMethodForm, UserTable
    lib/
      auth.ts               # NextAuth config
      prisma.ts             # Prisma client singleton
      holidays.ts           # Fetch + cache HK holidays
      utils.ts
    i18n/
      messages/
        zh-HK.json
        zh-CN.json
        en.json
      request.ts
    middleware.ts
  public/
    uploads/                # Receipts + QR codes
  .env.example
  next.config.mjs
  tailwind.config.ts
  tsconfig.json
  package.json
  docker-compose.yml        # PostgreSQL for dev
  Dockerfile                # Production deploy
```

---

## 8. Docs Organization

| File | Purpose | Audience |
|------|---------|----------|
| `docs/PRD.md` | Product requirements (what & why) | Humans |
| `AGENTS.md` | Dev guide for AI agents (how) | AI agents |
| `docs/oauth-setup.md` | OAuth application steps | Admin/dev |
| `docs/deployment.md` | VPS deployment guide | Admin/dev |
| `docs/holiday-api.md` | HK gov holiday API integration | Dev |

---

## 9. Non-Goals (Out of Scope v1)

- Instagram/Facebook OAuth login
- Real-time WebSocket updates (polling sufficient)
- Online payment gateway (Stripe/PayMe API)
- Email/SMS notifications
- VIP loyalty rules (placeholder only)
- Sales role fine-grained permissions
- Mobile native app

---

## 10. Open Questions

- [ ] VIP discount/benefit rules (deferred to post-launch)
- [ ] Sales role: which admin pages does Sales access vs Admin?
- [ ] Receipt storage: local disk vs S3-compatible storage?
- [ ] Exact VPS provider (recommend: AWS Lightsail / DigitalOcean / HK provider)

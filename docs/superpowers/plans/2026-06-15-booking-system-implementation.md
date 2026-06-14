# Booking System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack booking system for a small venue with Next.js 14, Prisma, PostgreSQL, NextAuth v5, and i18n (zh-HK/zh-CN/en).

**Architecture:** Next.js 14 App Router with Server Actions for all mutations. Prisma ORM over PostgreSQL. NextAuth v5 JWT sessions for auth. Custom-built weekly calendar with proportional slot sizing, split columns for overlapping bookings, and role-based privacy.

**Tech Stack:** Next.js 14, TypeScript (strict), PostgreSQL, Prisma, NextAuth v5, Tailwind CSS, next-intl

---

## File Structure

```
prisma/
  schema.prisma              # 8 models: User, OAuthAccount, Plan, Booking, Payment, PaymentMethod, Holiday, Setting
  seed.ts                    # Admin user, 4 default plans, 2 payment methods
  migrations/                # Prisma-managed

src/
  app/
    [locale]/
      layout.tsx             # Root layout with i18n provider + Nav
      page.tsx               # Home page
      auth/
        login/page.tsx       # Login form + Google button
        register/page.tsx    # Register form
      booking/
        page.tsx             # Weekly calendar (desktop 7-day, mobile 2-day)
        payment/page.tsx     # Payment summary + receipt upload
      account/
        page.tsx             # Profile + booking history
      admin/
        page.tsx             # Booking overview (admin view)
        plans/page.tsx       # Plan CRUD
        payments/page.tsx    # Payment method CRUD
        users/page.tsx       # Member list
        settings/page.tsx    # System settings
      api/
        auth/[...nextauth]/route.ts  # NextAuth handler
        holidays/route.ts             # Proxy for HK gov holiday API

  components/
    ui/
      button.tsx
      input.tsx
      modal.tsx
      file-upload.tsx
    layout/
      header.tsx
      footer.tsx
      sidebar.tsx
    booking/
      calendar-grid.tsx      # The main 7/2-day calendar grid
      time-slot.tsx          # Individual hour slot
      booking-cell.tsx       # Cell within a slot (proportional, color-coded)
      booking-form.tsx       # Sidebar: persons, plan, confirm
    admin/
      plan-form.tsx
      payment-method-form.tsx
      user-table.tsx
      setting-form.tsx
    account/
      booking-history-item.tsx

  lib/
    auth.ts                  # NextAuth config (Google + credentials)
    prisma.ts                # Prisma client singleton
    holidays.ts              # Fetch + cache HK gov holidays
    utils.ts                 # Shared helpers (overlap, remaining seats, formatDate)

  i18n/
    request.ts               # next-intl request config
    messages/
      zh-HK.json
      zh-CN.json
      en.json

  middleware.ts              # i18n routing + auth guard

public/
  uploads/                   # Receipt images + QR codes

.env.example
next.config.mjs
tailwind.config.ts
tsconfig.json
package.json
docker-compose.yml           # PostgreSQL for local dev
```

---

## Phase 0: Project Scaffold

### Task 0.1: Initialize Next.js project

- [ ] **Step 1: Create Next.js project**

```bash
npx create-next-app@14 booking-pixel --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

- [ ] **Step 2: Move into project and set up git**

```bash
Set-Location -LiteralPath "D:\AI\Booking_pixel"
git init
```

- [ ] **Step 3: Install core dependencies**

```bash
Set-Location -LiteralPath "D:\AI\Booking_pixel"
npm install next-auth@5 prisma @prisma/client next-intl
```

- [ ] **Step 4: Install dev dependencies**

```bash
npm install -D @types/node prettier
```

- [ ] **Step 5: Initialize Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 6: Create docker-compose.yml**

Write: `D:\AI\Booking_pixel\docker-compose.yml`
```yaml
version: "3.8"
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: booking
      POSTGRES_PASSWORD: booking
      POSTGRES_DB: booking
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

- [ ] **Step 7: Create .env.example**

Write: `D:\AI\Booking_pixel\.env.example`
```
DATABASE_URL=postgresql://booking:booking@localhost:5432/booking
AUTH_SECRET=generate-with-openssl-rand-hex-32
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_FACEBOOK_ID=
AUTH_FACEBOOK_SECRET=
AUTH_INSTAGRAM_ID=
AUTH_INSTAGRAM_SECRET=
```

- [ ] **Step 8: Commit Phase 0**

```bash
git add -A
git commit -m "chore: scaffold Next.js project with Prisma and Docker"
```

---

## Phase 1: Prisma Schema + Seed (DeepSeek V4 Pro)

### Task 1.1: Write Prisma schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Replace schema.prisma content**

Write: `prisma/schema.prisma`
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  VIP
  SALES
  ADMIN
}

enum BookingStatus {
  PENDING
  CONFIRMED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  VERIFIED
  REJECTED
}

enum AvailableDays {
  WEEKDAY
  WEEKDAY_NO_HOLIDAY
  ANY
}

enum LeaveDay {
  SAME
  NEXT
}

model User {
  id           String        @id @default(cuid())
  name         String
  phone        String?       @unique
  email        String?       @unique
  passwordHash String?
  role         Role          @default(USER)
  totalSpent   Float         @default(0)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  bookings     Booking[]
  accounts     OAuthAccount[]
}

model OAuthAccount {
  id                String @id @default(cuid())
  userId            String
  user              User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  provider          String
  providerAccountId String

  @@unique([provider, providerAccountId])
}

model Plan {
  id            String        @id @default(cuid())
  name          String
  playHours     Int
  availableDays AvailableDays
  timeStart     String
  timeEnd       String
  earliestEntry String
  latestLeave   String
  latestLeaveDay LeaveDay       @default(SAME)
  price         Float
  deposit       Float
  overtimeRate  Float          @default(0)
  isActive      Boolean        @default(true)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  bookings      Booking[]
}

model Booking {
  id        String        @id @default(cuid())
  userId    String
  user      User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  planId    String
  plan      Plan          @relation(fields: [planId], references: [id])
  date      DateTime
  startTime String
  endTime   String
  persons   Int
  status    BookingStatus @default(PENDING)
  amount    Float
  deposit   Float
  total     Float
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
  payment   Payment?
}

model Payment {
  id           String        @id @default(cuid())
  bookingId    String        @unique
  booking      Booking       @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  methodId     String?
  method       PaymentMethod? @relation(fields: [methodId], references: [id])
  receiptImage String?
  status       PaymentStatus @default(PENDING)
  uploadedAt   DateTime?
}

model PaymentMethod {
  id       String  @id @default(cuid())
  name     String
  qrImage  String
  isActive Boolean @default(true)
}

model Holiday {
  id   String  @id @default(cuid())
  date DateTime @unique
  name String
}

model Setting {
  id    String @id @default(cuid())
  key   String @unique
  value String
}
```

- [ ] **Step 2: Start Docker PostgreSQL**

```bash
Set-Location -LiteralPath "D:\AI\Booking_pixel"
docker compose up -d
```

- [ ] **Step 3: Copy .env.example to .env and fill DATABASE_URL**

```bash
Copy-Item -LiteralPath "D:\AI\Booking_pixel\.env.example" -Destination "D:\AI\Booking_pixel\.env"
```

- [ ] **Step 4: Run Prisma migration**

```bash
Set-Location -LiteralPath "D:\AI\Booking_pixel"
npx prisma generate
npx prisma db push
```

### Task 1.2: Write seed script

**Files:**
- Modify: `prisma/seed.ts`
- Modify: `package.json` (add seed config and ts-node)

- [ ] **Step 1: Install ts-node for seed**

```bash
Set-Location -LiteralPath "D:\AI\Booking_pixel"
npm install -D ts-node
```

- [ ] **Step 2: Write seed.ts**

Write: `prisma/seed.ts`
```typescript
import { PrismaClient, Role, AvailableDays } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@booking.hk" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@booking.hk",
      phone: "99999999",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const sales = await prisma.user.upsert({
    where: { email: "sales@booking.hk" },
    update: {},
    create: {
      name: "Sales",
      email: "sales@booking.hk",
      phone: "88888888",
      passwordHash,
      role: Role.SALES,
    },
  });

  const plans = [
    {
      name: "1 Hour",
      playHours: 1,
      availableDays: AvailableDays.ANY,
      timeStart: "00:00",
      timeEnd: "23:59",
      earliestEntry: "00:00",
      latestLeave: "23:59",
      latestLeaveDay: "SAME" as const,
      price: 100,
      deposit: 50,
      overtimeRate: 80,
    },
    {
      name: "2 Hours",
      playHours: 2,
      availableDays: AvailableDays.ANY,
      timeStart: "00:00",
      timeEnd: "23:59",
      earliestEntry: "00:00",
      latestLeave: "23:59",
      latestLeaveDay: "SAME" as const,
      price: 180,
      deposit: 50,
      overtimeRate: 80,
    },
    {
      name: "3 Hours",
      playHours: 3,
      availableDays: AvailableDays.ANY,
      timeStart: "00:00",
      timeEnd: "23:59",
      earliestEntry: "00:00",
      latestLeave: "23:59",
      latestLeaveDay: "SAME" as const,
      price: 250,
      deposit: 50,
      overtimeRate: 80,
    },
    {
      name: "4 Hours",
      playHours: 4,
      availableDays: AvailableDays.ANY,
      timeStart: "00:00",
      timeEnd: "23:59",
      earliestEntry: "00:00",
      latestLeave: "23:59",
      latestLeaveDay: "SAME" as const,
      price: 300,
      deposit: 50,
      overtimeRate: 80,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.create({ data: plan });
  }

  await prisma.paymentMethod.upsert({
    where: { id: "payme" },
    update: {},
    create: {
      id: "payme",
      name: "PayMe",
      qrImage: "/uploads/payme-placeholder.png",
    },
  });

  await prisma.paymentMethod.upsert({
    where: { id: "fps" },
    update: {},
    create: {
      id: "fps",
      name: "FPS 轉數快",
      qrImage: "/uploads/fps-placeholder.png",
    },
  });

  await prisma.setting.upsert({
    where: { key: "max_seats" },
    update: {},
    create: { key: "max_seats", value: "10" },
  });

  console.log("Seed complete");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

- [ ] **Step 3: Add seed config to package.json**

Read `package.json`, add prisma seed config:
```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

- [ ] **Step 4: Install bcryptjs**

```bash
Set-Location -LiteralPath "D:\AI\Booking_pixel"
npm install bcryptjs
npm install -D @types/bcryptjs
```

- [ ] **Step 5: Run seed**

```bash
Set-Location -LiteralPath "D:\AI\Booking_pixel"
npx prisma db seed
```

- [ ] **Step 6: Commit Phase 1**

```bash
git add -A
git commit -m "feat: add Prisma schema, seed data, and Docker Compose"
```

---

## Phase 2: Auth System (Qwen 3.7 Max)

### Task 2.1: NextAuth configuration + route handler

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/lib/prisma.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Write Prisma client singleton**

Write: `src/lib/prisma.ts`
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 2: Write auth config**

Write: `src/lib/auth.ts`
```typescript
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/zh-HK/auth/login",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        login: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { login, password } = credentials as {
          login: string;
          password: string;
        };

        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: login }, { phone: login }],
          },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { id?: string }).id = token.userId as string;
      }
      return session;
    },
  },
});
```

- [ ] **Step 3: Write route handler**

Write: `src/app/api/auth/[...nextauth]/route.ts`
```typescript
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 4: Install auth adapter**

```bash
Set-Location -LiteralPath "D:\AI\Booking_pixel"
npm install @auth/prisma-adapter
```

### Task 2.2: Register page + server action

**Files:**
- Create: `src/app/[locale]/auth/register/page.tsx`
- Create: `src/app/[locale]/auth/register/actions.ts`

- [ ] **Step 1: Write register server action**

Write: `src/app/[locale]/auth/register/actions.ts`
```typescript
"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function register(formData: FormData) {
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!name || !phone || !email || !password) {
    return { error: "All fields required" };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone }] },
  });

  if (existing) {
    return { error: "Email or phone already registered" };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: { name, phone, email, passwordHash },
  });

  return { success: true };
}
```

- [ ] **Step 2: Write register page component**

Write: `src/app/[locale]/auth/register/page.tsx`
```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { register } from "./actions";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = await register(formData);
    if (result.error) {
      setError(result.error);
    } else {
      router.push("/zh-HK/auth/login");
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Register</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            name="name"
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">WhatsApp</label>
          <input
            name="phone"
            type="tel"
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            name="email"
            type="email"
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Confirm Password
          </label>
          <input
            name="confirmPassword"
            type="password"
            required
            minLength={6}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Register
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 5: Commit Phase 2 (auth)**

```bash
git add -A
git commit -m "feat: add NextAuth config, register page with server action"
```

---

## Phase 3: i18n Setup (Mimo V2.5 Pro)

### Task 3.1: Configure next-intl

**Files:**
- Create: `src/i18n/request.ts`
- Create: `src/i18n/messages/zh-HK.json`
- Create: `src/i18n/messages/zh-CN.json`
- Create: `src/i18n/messages/en.json`
- Create: `src/middleware.ts`
- Modify: `src/app/[locale]/layout.tsx`

- [ ] **Step 1: Write i18n request config**

Write: `src/i18n/request.ts`
```typescript
import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./messages/${locale}.json`)).default,
}));
```

- [ ] **Step 2: Write middleware**

Write: `src/middleware.ts`
```typescript
import createMiddleware from "next-intl/middleware";
import { auth } from "@/lib/auth";

const i18nMiddleware = createMiddleware({
  locales: ["zh-HK", "zh-CN", "en"],
  defaultLocale: "zh-HK",
});

export async function middleware(request: Request) {
  const pathname = new URL(request.url).pathname;

  if (
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname.startsWith("/uploads")
  ) {
    return;
  }

  return i18nMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

- [ ] **Step 3: Write message files skeleton**

Write: `src/i18n/messages/zh-HK.json`
```json
{
  "nav": { "home": "首頁", "register": "註冊", "login": "登入", "booking": "預約", "account": "我的帳號" },
  "home": { "title": "歡迎", "subtitle": "立即預約" },
  "auth": { "register": "註冊", "login": "登入", "name": "姓名", "phone": "WhatsApp號碼", "email": "電郵", "password": "密碼", "confirmPassword": "確認密碼", "loginWithGoogle": "以 Google 登入" },
  "booking": { "title": "預約", "persons": "人數", "plan": "消費計劃", "confirm": "確認預約" },
  "payment": { "title": "付款", "amount": "金額", "deposit": "按金", "total": "總額", "uploadReceipt": "上傳單據" },
  "account": { "title": "我的帳號", "totalSpent": "消費總額", "history": "預約記錄" },
  "admin": { "title": "管理", "plans": "消費計劃", "payments": "支付設定", "users": "會員資料", "settings": "系統設定" }
}
```

Write: `src/i18n/messages/zh-CN.json`
```json
{
  "nav": { "home": "首页", "register": "注册", "login": "登录", "booking": "预约", "account": "我的账号" },
  "home": { "title": "欢迎", "subtitle": "立即预约" },
  "auth": { "register": "注册", "login": "登录", "name": "姓名", "phone": "WhatsApp号码", "email": "邮箱", "password": "密码", "confirmPassword": "确认密码", "loginWithGoogle": "以 Google 登录" },
  "booking": { "title": "预约", "persons": "人数", "plan": "消费计划", "confirm": "确认预约" },
  "payment": { "title": "付款", "amount": "金额", "deposit": "押金", "total": "总额", "uploadReceipt": "上传收据" },
  "account": { "title": "我的账号", "totalSpent": "消费总额", "history": "预约记录" },
  "admin": { "title": "管理", "plans": "消费计划", "payments": "支付设置", "users": "会员资料", "settings": "系统设置" }
}
```

Write: `src/i18n/messages/en.json`
```json
{
  "nav": { "home": "Home", "register": "Register", "login": "Login", "booking": "Booking", "account": "My Account" },
  "home": { "title": "Welcome", "subtitle": "Book Now" },
  "auth": { "register": "Register", "login": "Login", "name": "Name", "phone": "WhatsApp", "email": "Email", "password": "Password", "confirmPassword": "Confirm Password", "loginWithGoogle": "Login with Google" },
  "booking": { "title": "Booking", "persons": "Persons", "plan": "Plan", "confirm": "Confirm Booking" },
  "payment": { "title": "Payment", "amount": "Amount", "deposit": "Deposit", "total": "Total", "uploadReceipt": "Upload Receipt" },
  "account": { "title": "My Account", "totalSpent": "Total Spent", "history": "Booking History" },
  "admin": { "title": "Admin", "plans": "Plans", "payments": "Payments", "users": "Users", "settings": "Settings" }
}
```

- [ ] **Step 4: Write root layout**

Write: `src/app/[locale]/layout.tsx`
```typescript
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const locales = ["zh-HK", "zh-CN", "en"];

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale)) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="min-h-screen flex flex-col bg-gray-50">
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main className="flex-1 container mx-auto px-4 py-6">
            {children}
          </main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Update next.config.mjs**

Write: `next.config.mjs`
```javascript
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 6: Commit Phase 3**

```bash
git add -A
git commit -m "feat: add i18n setup with 3 locales and middleware"
```

---

## Phase 4: Layout Components + Shared UI

### Task 4.1: Header, Footer + shared components

**Files:**
- Create: `src/components/layout/header.tsx`
- Create: `src/components/layout/footer.tsx`
- Create: `src/components/ui/button.tsx`

- [ ] **Step 1: Write Header component**

Write: `src/components/layout/header.tsx`
```typescript
"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useLocale } from "next-intl";

export function Header() {
  const { data: session } = useSession();
  const locale = useLocale();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href={`/${locale}`} className="text-xl font-bold">
          Booking
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href={`/${locale}`}>Home</Link>
          {session ? (
            <>
              <Link href={`/${locale}/booking`}>Booking</Link>
              <Link href={`/${locale}/account`}>My Account</Link>
              {((session.user as { role?: string }).role === "ADMIN" ||
                (session.user as { role?: string }).role === "SALES") && (
                <Link href={`/${locale}/admin`}>Admin</Link>
              )}
              <button onClick={() => signOut()} className="text-red-600">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href={`/${locale}/auth/login`}>Login</Link>
              <Link href={`/${locale}/auth/register`}>Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Write Footer component**

Write: `src/components/layout/footer.tsx`
```typescript
export function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300 py-8 mt-auto">
      <div className="container mx-auto px-4 text-center text-sm">
        <p>Address: 123 Booking Street, Hong Kong</p>
        <p>Tel: +852 1234 5678</p>
        <p className="mt-4">&copy; 2026 Booking. All rights reserved.</p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Write shared Button component**

Write: `src/components/ui/button.tsx`
```typescript
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
}

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base = "px-4 py-2 rounded font-medium transition-colors";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 4: Commit Phase 4**

```bash
git add -A
git commit -m "feat: add header, footer, and shared button component"
```

---

## Phase 5: Home Page (Qwen 3.7 Plus)

### Task 5.1: Home page with slideshow and plans

**Files:**
- Create: `src/app/[locale]/page.tsx`

- [ ] **Step 1: Write Home page**

Write: `src/app/[locale]/page.tsx`
```typescript
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function HomePage() {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    take: 4,
    orderBy: { price: "asc" },
  });

  return (
    <div className="space-y-12">
      <section className="relative h-64 bg-gray-300 rounded-lg overflow-hidden">
        <div className="flex items-center justify-center h-full">
          <p className="text-2xl font-bold text-gray-700">Slide 1</p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6">Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-lg shadow p-6 text-center"
            >
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="text-2xl font-bold text-blue-600 my-2">
                HK${plan.price}
              </p>
              <p className="text-sm text-gray-500">{plan.playHours} hour(s)</p>
              <Link
                href={`/booking`}
                className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded text-sm"
              >
                Book Now
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl mb-2">1</div>
            <h3 className="font-semibold">Choose Plan</h3>
            <p className="text-sm text-gray-500">Pick your preferred plan</p>
          </div>
          <div>
            <div className="text-3xl mb-2">2</div>
            <h3 className="font-semibold">Book Time</h3>
            <p className="text-sm text-gray-500">Select available time slot</p>
          </div>
          <div>
            <div className="text-3xl mb-2">3</div>
            <h3 className="font-semibold">Pay & Play</h3>
            <p className="text-sm text-gray-500">Upload receipt and enjoy</p>
          </div>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Commit Phase 5**

```bash
git add -A
git commit -m "feat: add home page with plan display"
```

---

## Phase 6: Booking Calendar (DeepSeek V4 Pro)

### Task 6.1: Holiday API client + utility functions

**Files:**
- Create: `src/lib/holidays.ts`
- Create: `src/lib/utils.ts`

- [ ] **Step 1: Write holiday API client**

Write: `src/lib/holidays.ts`
```typescript
import { prisma } from "@/lib/prisma";

interface GovHoliday {
  date: string;
  name: string;
}

export async function fetchHKHolidays(): Promise<GovHoliday[]> {
  const response = await fetch(
    "https://data.gov.hk/api/3/action/package_show?id=2026-hong-kong-holiday",
    { next: { revalidate: 86400 } }
  );
  const data = await response.json();
  return data.result.records.map(
    (r: { date: string; nameEN: string }) => ({
      date: r.date,
      name: r.nameEN,
    })
  );
}

export async function isHolidayOrWeekend(date: Date): Promise<boolean> {
  const day = date.getDay();
  if (day === 0 || day === 6) return true;

  const dateStr = date.toISOString().split("T")[0];
  const holiday = await prisma.holiday.findUnique({
    where: { date: new Date(dateStr) },
  });

  return !!holiday;
}

export async function isPlanAvailableOnDate(
  plan: { availableDays: string },
  date: Date
): Promise<boolean> {
  if (plan.availableDays === "ANY") return true;

  const isHoliday = await isHolidayOrWeekend(date);

  if (plan.availableDays === "WEEKDAY_NO_HOLIDAY") {
    return !isHoliday;
  }

  if (plan.availableDays === "WEEKDAY") {
    const day = date.getDay();
    return day >= 1 && day <= 5;
  }

  return true;
}
```

- [ ] **Step 2: Write utility functions**

Write: `src/lib/utils.ts`
```typescript
import { prisma } from "@/lib/prisma";

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function bookingsOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  return start1 < end2 && start2 < end1;
}

export async function getRemainingSeats(
  date: Date,
  startTime: string,
  endTime: string
): Promise<number> {
  const setting = await prisma.setting.findUnique({
    where: { key: "max_seats" },
  });
  const maxSeats = setting ? parseInt(setting.value) : 10;

  const dateStr = date.toISOString().split("T")[0];

  const confirmedBookings = await prisma.booking.count({
    where: {
      date: new Date(dateStr),
      status: { in: ["PENDING", "CONFIRMED"] },
      AND: [
        { startTime: { lt: endTime } },
        { endTime: { gt: startTime } },
      ],
    },
  });

  return maxSeats - confirmedBookings;
}
```

### Task 6.2: Calendar grid component

**Files:**
- Create: `src/components/booking/calendar-grid.tsx`
- Create: `src/components/booking/time-slot.tsx`
- Create: `src/components/booking/booking-cell.tsx`
- Create: `src/components/booking/booking-form.tsx`
- Create: `src/app/[locale]/booking/page.tsx`

- [ ] **Step 1: Write calendar-grid.tsx**

Write: `src/components/booking/calendar-grid.tsx`
```typescript
"use client";

import { useEffect, useState } from "react";
import { TimeSlot } from "./time-slot";
import { BookingForm } from "./booking-form";
import type { Plan, Booking } from "@prisma/client";

interface CalendarGridProps {
  initialBookings: (Booking & { user: { name: string; phone: string | null } })[];
  plans: Plan[];
  userRole?: string;
  userId?: string;
  locale: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function CalendarGrid({
  initialBookings,
  plans,
  userRole,
  userId,
  locale,
}: CalendarGridProps) {
  const [offset, setOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);

  const daysToShow = typeof window !== "undefined" && window.innerWidth < 768 ? 2 : 7;

  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < daysToShow; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + offset + i);
    days.push(d);
  }

  const formatDay = (d: Date) => d.toISOString().split("T")[0];

  function handleSlotClick(date: string, startTime: string) {
    setSelectedDate(date);
    setSelectedStart(startTime);
  }

  return (
    <div className="flex gap-4">
      <div className="flex-1 overflow-x-auto">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setOffset((o) => o - daysToShow)}
            disabled={offset === 0}
            className="px-3 py-1 border rounded disabled:opacity-30"
          >
            &lt;
          </button>
          <span className="text-sm font-medium">
            {formatDay(days[0])} — {formatDay(days[days.length - 1])}
          </span>
          <button
            onClick={() => setOffset((o) => o + daysToShow)}
            className="px-3 py-1 border rounded"
          >
            &gt;
          </button>
        </div>

        <div className="grid" style={{ gridTemplateColumns: `60px repeat(${daysToShow}, 1fr)` }}>
          {/* Header row */}
          <div className="border-b p-1 text-xs font-medium">Time</div>
          {days.map((d) => (
            <div key={formatDay(d)} className="border-b p-1 text-xs font-medium text-center">
              {d.toLocaleDateString(locale, { weekday: "short" })}
              <br />
              {d.getDate()}/{d.getMonth() + 1}
            </div>
          ))}

          {/* Time grid */}
          {HOURS.map((hour) => (
            <TimeSlot
              key={hour}
              hour={hour}
              days={days}
              bookings={initialBookings.filter((b) => {
                const bStart = parseInt(b.startTime.split(":")[0]);
                const bEnd = parseInt(b.endTime.split(":")[0]);
                return hour >= bStart && hour < bEnd;
              })}
              userRole={userRole}
              userId={userId}
              onSlotClick={handleSlotClick}
            />
          ))}
        </div>
      </div>

      <BookingForm
        plans={plans}
        selectedDate={selectedDate}
        selectedStart={selectedStart}
        onClose={() => {
          setSelectedDate(null);
          setSelectedStart(null);
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Write time-slot.tsx**

Write: `src/components/booking/time-slot.tsx`
```typescript
"use client";

import { BookingCell } from "./booking-cell";
import type { Booking } from "@prisma/client";

interface TimeSlotProps {
  hour: number;
  days: Date[];
  bookings: (Booking & { user: { name: string; phone: string | null } })[];
  userRole?: string;
  userId?: string;
  onSlotClick: (date: string, startTime: string) => void;
}

export function TimeSlot({
  hour,
  days,
  bookings,
  userRole,
  userId,
  onSlotClick,
}: TimeSlotProps) {
  const formatHour = `${String(hour).padStart(2, "0")}:00`;

  return (
    <>
      <div className="border-r border-b p-1 text-xs text-gray-500 h-14 flex items-center">
        {formatHour}
      </div>
      {days.map((d) => {
        const dateStr = d.toISOString().split("T")[0];
        const cellBookings = bookings.filter((b) => {
          const bDate = new Date(b.date).toISOString().split("T")[0];
          return bDate === dateStr;
        });

        return (
          <div
            key={dateStr}
            className="border-r border-b h-14 relative cursor-pointer hover:bg-blue-50"
            onClick={() => onSlotClick(dateStr, formatHour)}
          >
            {cellBookings.map((b) => (
              <BookingCell
                key={b.id}
                booking={b}
                userRole={userRole || ""}
                userId={userId || ""}
                slotHour={hour}
              />
            ))}
          </div>
        );
      })}
    </>
  );
}
```

- [ ] **Step 3: Write booking-cell.tsx**

Write: `src/components/booking/booking-cell.tsx`
```typescript
"use client";

import type { Booking } from "@prisma/client";

interface BookingCellProps {
  booking: Booking & { user: { name: string; phone: string | null } };
  userRole: string;
  userId: string;
  slotHour: number;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-400",
  CONFIRMED: "bg-green-500",
  CANCELLED: "bg-red-300",
};

export function BookingCell({
  booking,
  userRole,
  userId,
  slotHour,
}: BookingCellProps) {
  const isOwner = booking.userId === userId;
  const isAdmin = userRole === "ADMIN" || userRole === "SALES";
  const canSeeDetails = isOwner || isAdmin;

  const startMinutes =
    parseInt(booking.startTime.split(":")[0]) * 60 +
    parseInt(booking.startTime.split(":")[1]);
  const endMinutes =
    parseInt(booking.endTime.split(":")[0]) * 60 +
    parseInt(booking.endTime.split(":")[1]);
  const totalDuration = endMinutes - startMinutes;

  const slotStart = slotHour * 60;
  const slotEnd = slotStart + 60;

  const visibleStart = Math.max(startMinutes, slotStart);
  const visibleEnd = Math.min(endMinutes, slotEnd);
  const visibleRatio = (visibleEnd - visibleStart) / 60;

  const topPercent = ((visibleStart - slotStart) / 60) * 100;

  const color = isOwner
    ? "bg-gray-400"
    : isAdmin
    ? STATUS_COLORS[booking.status]
    : "bg-gray-400";

  return (
    <div
      className={`absolute left-0 right-0 ${color} rounded text-xs overflow-hidden z-10`}
      style={{
        top: `${topPercent}%`,
        height: `${visibleRatio * 100}%`,
      }}
      title={canSeeDetails ? booking.user.name : undefined}
    >
      {canSeeDetails && (
        <span className="p-0.5 block truncate">
          {booking.user.name}
          {isAdmin && booking.user.phone && (
            <span className="opacity-75"> {booking.user.phone}</span>
          )}
        </span>
      )}
      {!canSeeDetails && (
        <div className="w-full h-full flex items-center justify-center opacity-50">
          {/* Occupied - no detail */}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Write booking-form.tsx (sidebar)**

Write: `src/components/booking/booking-form.tsx`
```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Plan } from "@prisma/client";

interface BookingFormProps {
  plans: Plan[];
  selectedDate: string | null;
  selectedStart: string | null;
  onClose: () => void;
}

export function BookingForm({
  plans,
  selectedDate,
  selectedStart,
  onClose,
}: BookingFormProps) {
  const [persons, setPersons] = useState(1);
  const [planId, setPlanId] = useState(plans[0]?.id || "");
  const router = useRouter();

  if (!selectedDate || !selectedStart) return null;

  const selectedPlan = plans.find((p) => p.id === planId);
  const endTime = selectedPlan
    ? calculateEndTime(selectedStart, selectedPlan.playHours)
    : selectedStart;

  async function handleConfirm() {
    const response = await fetch(`/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: selectedDate,
        startTime: selectedStart,
        endTime,
        persons,
        planId,
      }),
    });
    const data = await response.json();
    if (data.id) {
      router.push(`/booking/payment?bookingId=${data.id}`);
    }
  }

  return (
    <div className="w-64 bg-white rounded-lg shadow p-4 space-y-4">
      <h3 className="font-bold text-lg">Booking</h3>
      <p className="text-xs text-gray-500">
        {selectedDate} {selectedStart} — {endTime}
      </p>

      <div>
        <label className="block text-sm mb-1">Persons</label>
        <input
          type="number"
          min={1}
          max={10}
          value={persons}
          onChange={(e) => setPersons(parseInt(e.target.value))}
          className="w-full border rounded px-2 py-1"
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Plan</label>
        <select
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
          className="w-full border rounded px-2 py-1"
        >
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} (HK${p.price})
            </option>
          ))}
        </select>
      </div>

      {selectedPlan && (
        <div className="text-sm space-y-1 border-t pt-2">
          <p>Amount: HK${selectedPlan.price * persons}</p>
          <p>Deposit: HK${selectedPlan.deposit * persons}</p>
          <p className="font-bold">
            Total: HK${(selectedPlan.price + selectedPlan.deposit) * persons}
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 border rounded py-1 text-sm"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          className="flex-1 bg-blue-600 text-white rounded py-1 text-sm"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

function calculateEndTime(start: string, hours: number): string {
  const [h, m] = start.split(":").map(Number);
  const total = h * 60 + m + hours * 60;
  const endH = Math.floor(total / 60) % 24;
  const endM = total % 60;
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
}
```

- [ ] **Step 5: Write booking page**

Write: `src/app/[locale]/booking/page.tsx`
```typescript
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CalendarGrid } from "@/components/booking/calendar-grid";
import { redirect } from "next/navigation";

export default async function BookingPage() {
  const session = await auth();
  if (!session?.user) redirect("/zh-HK/auth/login");

  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    include: {
      user: { select: { name: true, phone: true } },
    },
  });

  const plans = await prisma.plan.findMany({
    where: { isActive: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Booking</h1>
      <CalendarGrid
        initialBookings={bookings}
        plans={plans}
        userRole={(session.user as { role?: string }).role}
        userId={(session.user as { id?: string }).id}
        locale="zh-HK"
      />
    </div>
  );
}
```

- [ ] **Step 6: Create bookings API route**

Write: `src/app/api/bookings/route.ts`
```typescript
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getRemainingSeats } from "@/lib/utils";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { date, startTime, endTime, persons, planId } = await request.json();

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 400 });
  }

  const remaining = await getRemainingSeats(
    new Date(date),
    startTime,
    endTime
  );

  if (remaining < persons) {
    return NextResponse.json(
      { error: "Not enough seats remaining" },
      { status: 400 }
    );
  }

  const booking = await prisma.booking.create({
    data: {
      userId: (session.user as { id?: string }).id!,
      planId,
      date: new Date(date),
      startTime,
      endTime,
      persons,
      amount: plan.price * persons,
      deposit: plan.deposit * persons,
      total: (plan.price + plan.deposit) * persons,
    },
  });

  return NextResponse.json(booking);
}
```

- [ ] **Step 7: Commit Phase 6**

```bash
git add -A
git commit -m "feat: add booking calendar with grid, booking form, and API"
```

---

## Phase 7: Admin Panel (Kimi K2.6)

### Task 7.1: Admin booking overview

**Files:**
- Create: `src/app/[locale]/admin/page.tsx`

- [ ] **Step 1: Write admin booking overview**

Write: `src/app/[locale]/admin/page.tsx`
```typescript
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/zh-HK/auth/login");
  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN" && role !== "SALES") redirect("/zh-HK/booking");

  const bookings = await prisma.booking.findMany({
    include: {
      user: { select: { name: true, phone: true } },
      plan: { select: { name: true } },
      payment: { select: { status: true } },
    },
    orderBy: { date: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Booking Overview</h1>
      <table className="w-full text-sm border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Date</th>
            <th className="p-2 text-left">Time</th>
            <th className="p-2 text-left">Member</th>
            <th className="p-2 text-left">Phone</th>
            <th className="p-2 text-left">Plan</th>
            <th className="p-2 text-left">Persons</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Payment</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id} className="border-t">
              <td className="p-2">{new Date(b.date).toLocaleDateString("zh-HK")}</td>
              <td className="p-2">{b.startTime}—{b.endTime}</td>
              <td className="p-2">{b.user.name}</td>
              <td className="p-2">{b.user.phone}</td>
              <td className="p-2">{b.plan?.name}</td>
              <td className="p-2">{b.persons}</td>
              <td className="p-2">
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    b.status === "CONFIRMED"
                      ? "bg-green-100 text-green-800"
                      : b.status === "CANCELLED"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {b.status}
                </span>
              </td>
              <td className="p-2">
                {b.payment?.status || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Task 7.2: Plan CRUD

**Files:**
- Create: `src/app/[locale]/admin/plans/page.tsx`
- Create: `src/components/admin/plan-form.tsx`

- [ ] **Step 1: Write plan-form.tsx**

Write: `src/components/admin/plan-form.tsx`
```typescript
"use client";

import { useState } from "react";
import type { Plan } from "@prisma/client";

interface PlanFormProps {
  plan?: Plan;
  onSubmit: (data: FormData) => Promise<void>;
}

export function PlanForm({ plan, onSubmit }: PlanFormProps) {
  const [leaveDay, setLeaveDay] = useState(plan?.latestLeaveDay || "SAME");

  return (
    <form
      action={onSubmit}
      className="space-y-3 bg-white p-4 rounded shadow"
    >
      {plan && <input type="hidden" name="id" value={plan.id} />}
      <div>
        <label className="block text-sm mb-0.5">Name</label>
        <input
          name="name"
          defaultValue={plan?.name}
          required
          className="w-full border rounded px-3 py-1.5"
        />
      </div>
      <div>
        <label className="block text-sm mb-0.5">Hours</label>
        <input
          name="playHours"
          type="number"
          defaultValue={plan?.playHours}
          required
          className="w-full border rounded px-3 py-1.5"
        />
      </div>
      <div>
        <label className="block text-sm mb-0.5">Available Days</label>
        <select
          name="availableDays"
          defaultValue={plan?.availableDays || "ANY"}
          className="w-full border rounded px-3 py-1.5"
        >
          <option value="WEEKDAY">Mon-Fri</option>
          <option value="WEEKDAY_NO_HOLIDAY">Mon-Fri (No Holidays)</option>
          <option value="ANY">Any Day</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm mb-0.5">Time From</label>
          <input
            name="timeStart"
            type="time"
            defaultValue={plan?.timeStart}
            className="w-full border rounded px-3 py-1.5"
          />
        </div>
        <div>
          <label className="block text-sm mb-0.5">Time To</label>
          <input
            name="timeEnd"
            type="time"
            defaultValue={plan?.timeEnd}
            className="w-full border rounded px-3 py-1.5"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm mb-0.5">Earliest Entry</label>
          <input
            name="earliestEntry"
            type="time"
            defaultValue={plan?.earliestEntry}
            className="w-full border rounded px-3 py-1.5"
          />
        </div>
        <div>
          <label className="block text-sm mb-0.5">Latest Leave</label>
          <input
            name="latestLeave"
            type="time"
            defaultValue={plan?.latestLeave}
            className="w-full border rounded px-3 py-1.5"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm mb-0.5">Leave Day</label>
        <select
          name="latestLeaveDay"
          value={leaveDay}
          onChange={(e) => setLeaveDay(e.target.value)}
          className="w-full border rounded px-3 py-1.5"
        >
          <option value="SAME">Same Day</option>
          <option value="NEXT">Next Day</option>
        </select>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-sm mb-0.5">Price (HK$)</label>
          <input
            name="price"
            type="number"
            step="0.01"
            defaultValue={plan?.price}
            className="w-full border rounded px-3 py-1.5"
          />
        </div>
        <div>
          <label className="block text-sm mb-0.5">Deposit (HK$)</label>
          <input
            name="deposit"
            type="number"
            step="0.01"
            defaultValue={plan?.deposit}
            className="w-full border rounded px-3 py-1.5"
          />
        </div>
        <div>
          <label className="block text-sm mb-0.5">Overtime/hr (HK$)</label>
          <input
            name="overtimeRate"
            type="number"
            step="0.01"
            defaultValue={plan?.overtimeRate}
            className="w-full border rounded px-3 py-1.5"
          />
        </div>
      </div>
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {plan ? "Update" : "Create"} Plan
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Write plans page**

Write: `src/app/[locale]/admin/plans/page.tsx`
```typescript
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PlanForm } from "@/components/admin/plan-form";
import { revalidatePath } from "next/cache";

async function upsertPlan(formData: FormData) {
  "use server";

  const id = formData.get("id") as string | null;
  const data = {
    name: formData.get("name") as string,
    playHours: parseInt(formData.get("playHours") as string),
    availableDays: formData.get("availableDays") as string,
    timeStart: formData.get("timeStart") as string,
    timeEnd: formData.get("timeEnd") as string,
    earliestEntry: formData.get("earliestEntry") as string,
    latestLeave: formData.get("latestLeave") as string,
    latestLeaveDay: formData.get("latestLeaveDay") as string,
    price: parseFloat(formData.get("price") as string),
    deposit: parseFloat(formData.get("deposit") as string),
    overtimeRate: parseFloat(formData.get("overtimeRate") as string),
  };

  if (id) {
    await prisma.plan.update({ where: { id }, data });
  } else {
    await prisma.plan.create({ data });
  }

  revalidatePath("/admin/plans");
}

export default async function AdminPlansPage() {
  const session = await auth();
  if (!session?.user) redirect("/zh-HK/auth/login");

  const plans = await prisma.plan.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Plans</h1>
      <div className="mb-6">
        <details>
          <summary className="cursor-pointer text-blue-600 mb-2">
            + New Plan
          </summary>
          <PlanForm onSubmit={upsertPlan} />
        </details>
      </div>
      {plans.map((plan) => (
        <details key={plan.id} className="mb-3">
          <summary className="cursor-pointer font-medium">
            {plan.name} — HK${plan.price} ({plan.playHours}h)
          </summary>
          <PlanForm plan={plan} onSubmit={upsertPlan} />
        </details>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Commit Phase 7**

```bash
git add -A
git commit -m "feat: add admin booking overview and plan CRUD"
```

---

## Phase 8: Payment Flow (MiniMax M3)

### Task 8.1: Payment page + receipt upload

**Files:**
- Create: `src/app/[locale]/booking/payment/page.tsx`
- Create: `src/components/ui/file-upload.tsx`

- [ ] **Step 1: Write file-upload component**

Write: `src/components/ui/file-upload.tsx`
```typescript
"use client";

import { useState } from "react";

interface FileUploadProps {
  onUpload: (file: File) => void;
  accept?: string;
}

export function FileUpload({ onUpload, accept = "image/png,image/jpeg" }: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
    onUpload(file);
  }

  return (
    <div>
      <input
        type="file"
        accept={accept}
        onChange={handleChange}
        className="border rounded p-2 w-full"
      />
      {preview && (
        <img src={preview} alt="Preview" className="mt-2 max-h-40 rounded" />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Write payment page**

Write: `src/app/[locale]/booking/payment/page.tsx`
```typescript
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PaymentForm } from "./payment-form";

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: { bookingId?: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/zh-HK/auth/login");

  const bookingId = searchParams.bookingId;
  if (!bookingId) redirect("/zh-HK/booking");

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      plan: true,
      user: { select: { name: true, phone: true, email: true } },
    },
  });

  if (!booking || booking.userId !== (session.user as { id?: string }).id) {
    redirect("/zh-HK/booking");
  }

  const paymentMethods = await prisma.paymentMethod.findMany({
    where: { isActive: true },
  });

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Payment</h1>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <h2 className="font-semibold">Member</h2>
          <p>{booking.user.name}</p>
          <p className="text-sm text-gray-500">{booking.user.phone}</p>
        </div>

        <div className="border-t pt-4">
          <h2 className="font-semibold">Booking Details</h2>
          <p>Date: {new Date(booking.date).toLocaleDateString("zh-HK")}</p>
          <p>
            Time: {booking.startTime} — {booking.endTime}
          </p>
          <p>Plan: {booking.plan.name}</p>
          <p>Persons: {booking.persons}</p>
        </div>

        <div className="border-t pt-4">
          <h2 className="font-semibold">Amount</h2>
          <p>Subtotal: HK${booking.amount}</p>
          <p>Deposit: HK${booking.deposit}</p>
          <p className="font-bold text-lg">
            Total: HK${booking.total}
          </p>
        </div>

        <PaymentForm
          bookingId={booking.id}
          paymentMethods={paymentMethods}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write payment-form client component**

Write: `src/app/[locale]/booking/payment/payment-form.tsx`
```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUpload } from "@/components/ui/file-upload";
import type { PaymentMethod } from "@prisma/client";

interface PaymentFormProps {
  bookingId: string;
  paymentMethods: PaymentMethod[];
}

export function PaymentForm({ bookingId, paymentMethods }: PaymentFormProps) {
  const [methodId, setMethodId] = useState(paymentMethods[0]?.id || "");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const selectedMethod = paymentMethods.find((m) => m.id === methodId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bookingId", bookingId);
    formData.append("methodId", methodId);

    const response = await fetch(`/api/payments`, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      router.push("/account");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t pt-4 space-y-4">
      <h2 className="font-semibold">Payment Method</h2>

      <div className="space-y-2">
        {paymentMethods.map((m) => (
          <label
            key={m.id}
            className={`flex items-center gap-3 p-3 border rounded cursor-pointer ${
              methodId === m.id ? "border-blue-500 bg-blue-50" : ""
            }`}
          >
            <input
              type="radio"
              name="method"
              value={m.id}
              checked={methodId === m.id}
              onChange={() => setMethodId(m.id)}
            />
            <span>{m.name}</span>
          </label>
        ))}
      </div>

      {selectedMethod?.qrImage && (
        <div>
          <p className="text-sm text-gray-500 mb-1">Scan QR Code</p>
          <img
            src={selectedMethod.qrImage}
            alt={selectedMethod.name}
            className="w-40 h-40 object-contain border rounded"
          />
        </div>
      )}

      <div>
        <label className="block text-sm mb-1">Upload Receipt</label>
        <FileUpload onUpload={setFile} />
      </div>

      <button
        type="submit"
        disabled={!file || uploading}
        className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Submit Payment"}
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Create payments API route**

Write: `src/app/api/payments/route.ts`
```typescript
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const bookingId = formData.get("bookingId") as string;
  const methodId = formData.get("methodId") as string;

  if (!file || !bookingId) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking || booking.userId !== (session.user as { id?: string }).id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `receipt-${bookingId}-${Date.now()}.${file.name.split(".").pop()}`;
  const filepath = path.join(process.cwd(), "public", "uploads", filename);

  await writeFile(filepath, new Uint8Array(buffer));

  await prisma.payment.create({
    data: {
      bookingId,
      methodId,
      receiptImage: `/uploads/${filename}`,
      uploadedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 5: Commit Phase 8**

```bash
git add -A
git commit -m "feat: add payment page with receipt upload and API"
```

---

## Phase 9: Account Page (Qwen 3.7 Plus)

### Task 9.1: Account page with booking history

**Files:**
- Create: `src/app/[locale]/account/page.tsx`

- [ ] **Step 1: Write account page**

Write: `src/app/[locale]/account/page.tsx`
```typescript
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/zh-HK/auth/login");

  const userId = (session.user as { id?: string }).id!;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, phone: true, email: true, totalSpent: true },
  });

  const bookings = await prisma.booking.findMany({
    where: { userId },
    include: {
      plan: { select: { name: true } },
      payment: { select: { status: true, receiptImage: true } },
    },
    orderBy: { date: "desc" },
  });

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Account</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="font-semibold mb-2">Profile</h2>
        <p>Name: {user?.name}</p>
        <p>Phone: {user?.phone}</p>
        <p>Email: {user?.email}</p>
        <p className="font-bold mt-2">
          Total Spent: HK${user?.totalSpent}
        </p>
      </div>

      <h2 className="text-xl font-bold mb-4">Booking History</h2>
      <div className="space-y-3">
        {bookings.map((b) => (
          <div
            key={b.id}
            className="bg-white rounded-lg shadow p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-medium">{b.plan.name}</p>
              <p className="text-sm text-gray-500">
                {new Date(b.date).toLocaleDateString("zh-HK")}{" "}
                {b.startTime}—{b.endTime}
              </p>
              <p className="text-sm">{b.persons} person(s) — HK${b.total}</p>
              <span
                className={`inline-block px-2 py-0.5 rounded text-xs mt-1 ${
                  b.status === "CONFIRMED"
                    ? "bg-green-100 text-green-800"
                    : b.status === "CANCELLED"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {b.status}
              </span>
            </div>
            <div className="text-right">
              {b.payment ? (
                <p className="text-xs text-green-600">Receipt uploaded</p>
              ) : (
                <Link
                  href={`/booking/payment?bookingId=${b.id}`}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                >
                  Upload Receipt
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit Phase 9**

```bash
git add -A
git commit -m "feat: add account page with profile and booking history"
```

---

## Phase 10: Admin Payment Methods + Users + Settings

### Task 10.1: Payment methods CRUD

**Files:**
- Create: `src/app/[locale]/admin/payments/page.tsx`

- [ ] **Step 1: Write payment methods page**

Write: `src/app/[locale]/admin/payments/page.tsx`
```typescript
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function upsertPaymentMethod(formData: FormData) {
  "use server";

  const id = formData.get("id") as string | null;
  const name = formData.get("name") as string;
  const qrImage = formData.get("qrImage") as string || "/uploads/default.png";

  if (id) {
    await prisma.paymentMethod.update({ where: { id }, data: { name, qrImage } });
  } else {
    await prisma.paymentMethod.create({ data: { name, qrImage } });
  }

  revalidatePath("/admin/payments");
}

async function deletePaymentMethod(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  await prisma.paymentMethod.delete({ where: { id } });
  revalidatePath("/admin/payments");
}

export default async function AdminPaymentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/zh-HK/auth/login");

  const methods = await prisma.paymentMethod.findMany();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Payment Methods</h1>

      <form
        action={upsertPaymentMethod}
        className="bg-white p-4 rounded shadow mb-6 space-y-3"
      >
        <input
          name="name"
          placeholder="Payment name"
          required
          className="w-full border rounded px-3 py-2"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add
        </button>
      </form>

      {methods.map((m) => (
        <div
          key={m.id}
          className="bg-white p-3 rounded shadow mb-2 flex items-center justify-between"
        >
          <span>{m.name}</span>
          <form action={deletePaymentMethod}>
            <input type="hidden" name="id" value={m.id} />
            <button className="text-red-600 text-sm">Delete</button>
          </form>
        </div>
      ))}
    </div>
  );
}
```

### Task 10.2: User list page

**Files:**
- Create: `src/app/[locale]/admin/users/page.tsx`

- [ ] **Step 1: Write users page**

Write: `src/app/[locale]/admin/users/page.tsx`
```typescript
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user) redirect("/zh-HK/auth/login");

  const users = await prisma.user.findMany({
    include: {
      bookings: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Users</h1>
      <table className="w-full text-sm border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Role</th>
            <th className="p-2 text-left">Phone</th>
            <th className="p-2 text-left">Email</th>
            <th className="p-2 text-left">Joined</th>
            <th className="p-2 text-left">Bookings</th>
            <th className="p-2 text-left">Spent</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t">
              <td className="p-2">{u.name}</td>
              <td className="p-2">
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    u.role === "ADMIN"
                      ? "bg-purple-100"
                      : u.role === "VIP"
                      ? "bg-yellow-100"
                      : u.role === "SALES"
                      ? "bg-blue-100"
                      : "bg-gray-100"
                  }`}
                >
                  {u.role}
                </span>
              </td>
              <td className="p-2">{u.phone}</td>
              <td className="p-2">{u.email}</td>
              <td className="p-2">
                {u.createdAt.toLocaleDateString("zh-HK")}
              </td>
              <td className="p-2">{u.bookings.length}</td>
              <td className="p-2">HK${u.totalSpent}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Task 10.3: Settings page

**Files:**
- Create: `src/app/[locale]/admin/settings/page.tsx`

- [ ] **Step 1: Write settings page**

Write: `src/app/[locale]/admin/settings/page.tsx`
```typescript
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function updateSetting(formData: FormData) {
  "use server";

  const seats = parseInt(formData.get("max_seats") as string);
  if (seats > 0) {
    await prisma.setting.upsert({
      where: { key: "max_seats" },
      update: { value: String(seats) },
      create: { key: "max_seats", value: String(seats) },
    });
  }
  revalidatePath("/admin/settings");
}

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/zh-HK/auth/login");

  const setting = await prisma.setting.findUnique({
    where: { key: "max_seats" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <form
        action={updateSetting}
        className="bg-white p-4 rounded shadow max-w-sm space-y-3"
      >
        <div>
          <label className="block text-sm mb-0.5">Max Seats</label>
          <input
            name="max_seats"
            type="number"
            defaultValue={setting?.value || "10"}
            min={1}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Save
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Commit Phase 10**

```bash
git add -A
git commit -m "feat: add admin payment methods, users, and settings pages"
```

---

## Phase 11: Verification (DeepSeek V4 Flash)

### Task 11.1: Run type check and lint

- [ ] **Step 1: Run TypeScript type checker**

```bash
npx tsc --noEmit
```
Expected: No errors. If errors exist, fix them before proceeding.

- [ ] **Step 2: Run linter**

```bash
npm run lint
```
Expected: No errors or warnings.

### Task 11.2: Verify all features end-to-end

- [ ] **Step 3: Start dev server and verify routes**

```bash
npm run dev
```

Manual verification checklist:
- [ ] `/zh-HK` → Home page loads with 4 plans
- [ ] `/zh-HK/auth/register` → Register form works
- [ ] `/zh-HK/auth/login` → Login with email/phone + password works
- [ ] `/zh-HK/booking` → Calendar grid renders, slots clickable
- [ ] `/zh-HK/booking/payment?bookingId=xxx` → Payment page with QR and upload
- [ ] `/zh-HK/account` → Profile and booking history display
- [ ] `/zh-HK/admin` → Booking overview with member names visible
- [ ] `/zh-HK/admin/plans` → Plan CRUD works
- [ ] `/zh-HK/admin/payments` → Payment methods add/delete
- [ ] `/zh-HK/admin/users` → User list with roles
- [ ] `/zh-HK/admin/settings` → Max seats editable
- [ ] `/en` → English locale renders
- [ ] `/zh-CN` → Simplified Chinese locale renders

### Task 11.3: Privacy verification

- [ ] **Step 4: Verify booking cell privacy**

Check Calendar Grid:
- [ ] Admin login: sees member name + phone in ALL booking cells
- [ ] Member login: sees own booking with details (gray), others' bookings as anonymous gray blocks (no name/phone)
- [ ] Non-logged-in: redirected to login

### Task 11.4: Test remaining seats logic

- [ ] **Step 5: Verify seat calculation**

```bash
# Run a manual test via the API
# Create 10 confirmed bookings for same slot, try to book an 11th
# Expect: "Not enough seats remaining" error
```

### Task 11.5: Final commit

```bash
git add -A
git commit -m "chore: verification complete — all features working"
```

---

## Summary: AI Model Dispatch Order

```
P1 (sequential)  → DeepSeek V4 Pro  : Task 1.1-1.2  (Schema + Seed)
P2 (parallel)    → Qwen 3.7 Max     : Task 2.1-2.2  (Auth)
                 → Qwen 3.7 Plus    : Task 5.1      (Home)
                 → DeepSeek V4 Pro  : Task 6.1-6.2  (Calendar)
                 → Kimi K2.6        : Task 7.1-7.2  (Admin)
                 → Qwen 3.7 Plus    : Task 9.1      (Account)
P3 (after P2)    → MiniMax M3       : Task 8.1      (Payment)
                 → Mimo V2.5 Pro    : Task 3.1      (i18n — last)
Final            → DeepSeek V4 Flash: Task 11.1-11.5 (Verification)
```

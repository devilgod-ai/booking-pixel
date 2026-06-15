# AGENTS.md

## Project State
- Booking system for a small venue (10 seats configurable). PRD in `docs/PRD.md`. Full design spec in `docs/superpowers/specs/2026-06-15-booking-system-design.md`.

## Environment
- OS: Windows (PowerShell 5.1)
- Use `; if ($?) { ... }` to chain commands. Avoid `&&`.
- Quote paths containing spaces with double quotes.

## Tech Stack
- **Framework:** Next.js 14 (App Router) + TypeScript (strict)
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js v5 (JWT strategy)
- **Styling:** Tailwind CSS
- **i18n:** next-intl (locales: zh-HK, zh-CN, en)
- **File Upload:** Server Actions, png/jpg/jpeg only

## Commands

```powershell
# Development
npm run dev

# Database
npx prisma generate
npx prisma db push
npx prisma migrate dev --name <name>
npx prisma db seed

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Build
npm run build
npm start

# Git sync
npm run pull      # git pull
npm run push      # git add -A; git commit; git push
```

## Git Workflow

- **Clone on new machine:** `git clone https://github.com/devilgod-ai/booking-pixel.git`
- **Pull latest:** `npm run pull`
- **Commit & push:** `npm run push` — stages all, prompts for commit message, pushes

## Project Structure

```
src/
  app/[locale]/           # i18n routes (zh-HK default)
    page.tsx              # Home
    auth/login/           # Login (Google OAuth + credentials)
    auth/register/        # Register
    booking/              # Weekly calendar
    booking/payment/      # Payment summary + receipt upload
    account/              # My account + history
    admin/                # Booking overview, plans, payments, users, settings
    api/                  # Route handlers
  components/
    ui/                   # Shared components
    layout/               # Header, Footer, Sidebar
    booking/              # Calendar-specific components
    admin/                # Admin-specific forms/tables
  lib/
    auth.ts               # NextAuth config
    prisma.ts             # Prisma client singleton
    holidays.ts           # HK gov holiday API client
  i18n/                   # next-intl messages
  middleware.ts           # i18n routing + auth guard
prisma/
  schema.prisma           # Data model
  seed.ts                 # Seed: admin user, default plans, payment methods
```

## Conventions
- **Server Actions** for all mutations (forms, file uploads). No REST API except for external data (holidays).
- **i18n always:** Every page is under `[locale]`. Use `next-intl` hooks.
- **Auth:** `auth()` from `@/lib/auth` in Server Components. `useSession()` client-side.
- **File uploads:** Validate MIME type server-side (image/png, image/jpeg). Store in `public/uploads/`.
- **Time format:** Store as `"HH:mm"` strings. All times in local HK timezone (UTC+8).
- **Holidays:** Fetch from `data.gov.hk` API, cache in DB (refresh daily via cron or on-demand with TTL).

## Gotchas
- **Calendar logic is hand-built** — no library. Must handle: proportional sizing within hour slots, split columns for overlapping bookings, color coding, mobile 2-day view.
- **Privacy:** Admin/Sales see member name+phone in every booking cell. Members see only their own booking details; others' bookings appear as anonymous gray blocks.
- **Remaining seats formula:** `maxSeats (from Setting) - COUNT(confirmed bookings for that date+time_slot)`.
- **Booking overlap detection:** Two bookings overlap if `(start1 < end2) AND (start2 < end1)`.
- **Prisma client:** Import from `@/lib/prisma.ts` (singleton) — never create new PrismaClient directly.
- **NextAuth v5:** Uses `auth.ts` at project root (not `[...nextauth].ts`). Route handler at `app/api/auth/[...nextauth]/route.ts`.

## Environment Variables (.env)

```
DATABASE_URL=postgresql://...
AUTH_SECRET=openssl-rand-hex-32
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_FACEBOOK_ID=
AUTH_FACEBOOK_SECRET=
AUTH_INSTAGRAM_ID=
AUTH_INSTAGRAM_SECRET=
```

## Related Docs
- `docs/PRD.md` — Product requirements
- `docs/oauth-setup.md` — OAuth application steps
- `docs/superpowers/specs/2026-06-15-booking-system-design.md` — Full design spec

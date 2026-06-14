# PRD: Booking System (Booking Pixel)

> **Status:** Draft | **Date:** 2026-06-15

---

## 1. Executive Summary

A web-based booking management system for a small venue (10 seats, configurable). Supports customer self-booking (B2C) and Sales agent proxy-booking. Hong Kong market, with Traditional Chinese / Simplified Chinese / English trilingual support.

## 2. Problem Statement

Manual booking via phone/messaging is error-prone, time-consuming, and lacks real-time availability visibility. This system automates slot management, reduces double-booking, and provides self-service booking for customers while giving staff a unified management dashboard.

## 3. Target Audience / Personas

| Persona | Description | Primary Need |
|---------|-------------|--------------|
| Customer (會員) | End user booking their own time slots | See availability, book, pay, view history |
| VIP (VIP) | High-value repeat customers | Discounts and perks (TBD post-launch) |
| Sales | Staff who book on behalf of customers | Proxy booking, view customer info |
| Admin (管理員) | System administrator | Full CRUD, payment verification, settings |

## 4. Goals & Success Metrics

| Goal | Metric | Target |
|------|--------|--------|
| Reduce manual booking overhead | Bookings completed online vs manual | >80% online |
| Eliminate double-booking | Double-booking incidents | 0 |
| Streamline payment verification | Avg. time from upload to verify | <2 hours |

## 5. Core Features

### 5.1 Home Page
- **User Story:** As a visitor, I want to see the venue offerings, location, and branding so that I can decide to book.
- **Acceptance Criteria:**
  - [ ] Header with logo + nav (Home, Register, Login, Booking, My Account)
  - [ ] Image slideshow/carousel
  - [ ] Display 4 main consumption plans with name/price
  - [ ] Footer with address, phone, map embed

### 5.2 Auth (Register / Login)
- **User Story:** As a user, I want to register with minimal info and login via Google so that I can book quickly.
- **Acceptance Criteria:**
  - [ ] Register: name, WhatsApp, email, password, confirm password
  - [ ] Login: email or phone + password
  - [ ] Google OAuth one-click login
  - [ ] Facebook/Instagram OAuth deferred (placeholder ready)
  - [ ] Session persists across pages

### 5.3 Booking Calendar
- **User Story:** As a customer, I want to see a weekly calendar showing available slots so that I can pick the best time.
- **Acceptance Criteria:**
  - [ ] 7-day week view on desktop, 2-day view on mobile with nav buttons
  - [ ] 1-hour grid with appointment blocks sized proportionally
  - [ ] Color-coded by booking status/plan type
  - [ ] Overlapping bookings displayed in split columns
  - [ ] HK public holidays (from data.gov.hk) + Sat/Sun marked
  - [ ] Admin/Sales view: show member name + phone inside every booking cell
  - [ ] Member view: own bookings shown with detail (gray); other users' bookings shown as occupied gray blocks with no personal data revealed
  - [ ] Left sidebar: person count selector, plan selector, confirm button
  - [ ] 24-hour selectable slots

### 5.4 Payment
- **User Story:** As a customer, I want to see the payment summary, select a method, and upload my receipt.
- **Acceptance Criteria:**
  - [ ] Show member info, persons, plan, date, time
  - [ ] Show amount (persons x price), deposit, total
  - [ ] Show admin-managed payment methods with QR codes
  - [ ] Upload receipt (png, jpg, jpeg only)
  - [ ] Booking status set to PENDING after confirmation

### 5.5 My Account
- **User Story:** As a member, I want to view my profile and booking history.
- **Acceptance Criteria:**
  - [ ] Show name, phone, total spent
  - [ ] Booking history list with status (confirmed/pending/cancelled)
  - [ ] Show payment receipt status; "Upload Receipt" button if missing
  - [ ] Click to re-upload receipt

### 5.6 Admin Panel
- **User Story:** As an admin, I want to manage plans, payments, users, and system settings.
- **Acceptance Criteria:**
  - [ ] Booking overview with member name/phone visible
  - [ ] Plan CRUD: name, hours, available days, time range, price, deposit, overtime rate
  - [ ] Payment method CRUD: name, QR image upload
  - [ ] User list with role, phone, email, join date, booking/consumption history
  - [ ] System settings: max seats (editable)

## 6. Non-Goals / Out of Scope (v1)

- Instagram / Facebook OAuth login
- Online payment gateway integration (Stripe, PayMe API)
- Email / SMS notifications
- Real-time WebSocket seat updates
- VIP loyalty rules
- Native mobile app

## 7. Technical Constraints & Dependencies

| Constraint | Description |
|------------|-------------|
| Next.js 14 App Router | Must use Server Actions pattern |
| PostgreSQL via Prisma | ORM for all DB operations |
| NextAuth.js v5 | JWT session strategy |
| HK Gov Holiday API | data.gov.hk for public holidays |
| VPS Deployment | PM2 + Nginx + PostgreSQL |
| i18n (3 locales) | next-intl: zh-HK, zh-CN, en |

## 8. Open Questions

- [ ] VIP discount/perk rules
- [ ] Sales role detailed permissions
- [ ] Receipt file storage strategy (local vs cloud)

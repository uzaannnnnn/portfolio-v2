# Muhamad Fauzan — Professional Portfolio & CMS

A production-grade Software Engineering Portfolio and custom Content Management System engineered with Next.js 15 (App Router, React 19, TypeScript Strict), Tailwind CSS v4, and Supabase PostgreSQL with database-level Row-Level Security (RLS).

---

## Architecture Highlights

1. **Dual-Mode Data Persistence:**
   - **Production Mode (`DATA_ADAPTER_MODE=supabase`):** Supabase PostgreSQL acts as the single source of truth using SSR clients, normalized schemas, and database RLS. Never silently falls back to local data.
   - **Fixture Mode (`DATA_ADAPTER_MODE=fixture`):** Lightweight in-memory publishing adapter used for local development and deterministic automated testing.
2. **Draft → Preview → Publish Workflow:**
   - Explicit separation of working drafts (`draft_data`) and public projections (`published_data`).
   - Authenticated administrators can preview unpublished drafts with visual indicator banners.
   - Initial projects (`GeoEntity`, `ClayCV`, `SPK Bansos SAW`) are seeded strictly as `draft` and remain isolated from public routes, sitemap, and search engines until explicitly published.
3. **Single-Admin Security Architecture:**
   - Zero public user registration.
   - Protected admin routes (`/admin/*`) and server actions enforced with server-side authorization checks and HMAC-SHA256 signed session cookies.
   - Complete Row-Level Security (RLS) policies for all 19 database tables.
   - Private resume PDF protection (`/api/resume/download/[id]`) with admin preview and public download restricted strictly to the single active published version.
   - Strict HTTP security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).
4. **Indonesian Regional First-Boot Experience:**
   - First-time visitors are welcomed with a regional Indonesian greeting sequence (Acehnese, Sundanese, Javanese, Balinese, Minangkabau, Batak, Bugis, Banjar, and Indonesian).
   - Fully accessible with skip controls, reduced-motion compliance, and localStorage state persistence.
5. **14-Section Engineering Case Study Builder:**
   - Projects feature up to 14 structured case study sections (Overview, Problem, Objectives, Solution, Architecture, Implementation, Database, API, Challenges, Tradeoffs, Testing, Deployment, Results, Lessons).
   - Full reordering, toggling, and markdown editing in the Admin Dashboard.

---

## Technology Stack

- **Framework:** Next.js 15.5.29 (App Router, React 19)
- **Language:** TypeScript 5.8 (Strict Mode)
- **Styling:** Tailwind CSS v4, Geist Sans & Geist Mono typography
- **Validation:** Zod 3.24
- **Database & Storage:** Supabase PostgreSQL & Storage (RLS enforced)
- **Icons:** Lucide React
- **Testing:** Vitest 3.2.7 (Unit & Integration), Playwright 1.52 (End-to-End browser tests)

---

## Getting Started

### 1. Prerequisites
- Node.js >= 20.x
- npm >= 10.x

### 2. Installation
```bash
git clone https://github.com/uzaannnnnn/portfolio.git
cd portfolio
npm install
```

### 3. Local Development (Fixture Mode)
By default, the application runs in local fixture mode without requiring an external database connection:
```bash
npm run dev
```
- Public Portfolio: [http://localhost:3000](http://localhost:3000)
- Admin Login: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
  - Email: `admin@muhamadfauzan.dev`
  - Password: `AdminPortfolio2026!`

### 4. Running Verification Gates
```bash
# TypeScript type check
npm run typecheck

# ESLint audit
npm run lint

# Unit & integration test suites
npm run test

# Production build verification
npm run build

# Playwright End-to-End tests
npx playwright test
```

---

## Production Operations & Deployment

For Supabase database provisioning, migration scripts, single-admin account setup, storage bucket policies, and Vercel deployment instructions, see the complete guide:

👉 [**Operations & Production Deployment Guide**](file:///Users/zannho/Desktop/portfolio/docs/OPERATIONS_AND_DEPLOYMENT.md)

---

## License

Copyright © 2026 Muhamad Fauzan. All rights reserved.

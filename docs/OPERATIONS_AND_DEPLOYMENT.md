# Operations & Production Deployment Guide
## Professional Portfolio & Content Management System

**Owner:** Muhamad Fauzan  
**System Architecture:** Next.js 15 (App Router, React 19) + Supabase PostgreSQL & Storage + Dual-Mode Data Adapter (Fixture / Supabase SSR)

---

## 1. Environment Variables Reference

Configure environment variables in Vercel or your hosting environment. Never commit `.env` or `.env.local` to version control.

| Variable | Scope | Required in Prod | Description & Example |
| :--- | :--- | :--- | :--- |
| `DATA_ADAPTER_MODE` | Server | **Yes** | Persistence mode: `"supabase"` (production source of truth) or `"fixture"` (local development/tests). |
| `NEXT_PUBLIC_SUPABASE_URL` | Public (Client & Server) | **Yes** (when mode=supabase) | Supabase project HTTPS URL, e.g. `https://xyzproject.supabase.co`. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (Client & Server) | **Yes** (when mode=supabase) | Supabase anonymous public API key. Protected by Row-Level Security (RLS). |
| `ADMIN_SESSION_SECRET` | **Server-Only** | **Yes** | Dedicated standalone secret for signing and verifying admin session HMAC tokens (minimum 32 characters). High entropy. No fallback. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-Only** | **Yes** | High-privilege secret key. Used exclusively server-side for administrative provisioning and maintenance scripts. **Never prefix with `NEXT_PUBLIC_`**. |
| `ADMIN_ALLOWED_EMAIL` | **Server-Only** | **Yes** | Authorized single-admin email address, e.g. `admin@muhamadfauzan.dev`. Provides server-side defense-in-depth alongside `public.admin_users`. |
| `ADMIN_FIXTURE_PASSWORD` | Server (Dev/Test Only) | No | Default password used when `DATA_ADAPTER_MODE=fixture` for automated testing and local preview (`portfolio-admin-2026-secret`). |
| `NEXT_PUBLIC_SITE_URL` | Public | **Yes** | Canonical production origin, e.g. `https://muhamadfauzan.dev`. Used for sitemap, robots, Open Graph, and JSON-LD structured data. |

---

## 2. Supabase Infrastructure Setup & Provisioning

### 2.1 Database Schema Migrations
Execute the migrations strictly in sequential order using the Supabase CLI or the Supabase SQL Editor:

1. **Migration 00001 — Initial Schema:**  
   Path: [`supabase/migrations/00001_initial_schema.sql`](file:///Users/zannho/Desktop/portfolio/supabase/migrations/00001_initial_schema.sql)  
   - Enables `pgcrypto`.
   - Creates `admin_users` table with strict single-admin role constraints.
   - Creates append-only `content_revisions`, `content_publications`, and `audit_logs` tables.
   - Creates all normalized entity tables (`profiles`, `site_settings`, `hero_contents`, `about_contents`, `skill_categories`, `skills`, `projects`, `project_technologies`, `project_sections`, `experiences`, `educations`, `certifications`, `notes`, `boot_greetings`, `media_assets`, `resume_files`).
   - Sets up `set_updated_at()` trigger functions and indexes.

2. **Migration 00002 — Row-Level Security & Storage Policies:**  
   Path: [`supabase/migrations/00002_rls_and_storage_policies.sql`](file:///Users/zannho/Desktop/portfolio/supabase/migrations/00002_rls_and_storage_policies.sql)  
   - Creates `public.is_admin()` `SECURITY DEFINER` function with strict search path.
   - Enables RLS on all 19 CMS tables.
   - Enforces read-only published projections for anonymous public visitors (`status = 'published' AND published_data IS NOT NULL`).
   - Restricts draft access, mutations, publications, and audit logs exclusively to verified administrators (`public.is_admin()`).
   - Configures Supabase Storage bucket access policies.

3. **Migration 00003 — Transactional Publishing & Unpublishing RPC:**  
   Path: [`supabase/migrations/00003_transactional_publishing_rpc.sql`](file:///Users/zannho/Desktop/portfolio/supabase/migrations/00003_transactional_publishing_rpc.sql)  
   - Creates `public.publish_entity` and `public.unpublish_entity` `SECURITY DEFINER` stored procedures.
   - Executes atomic publish/unpublish transitions inside a single PostgreSQL transaction.
   - Updates target entity table (`status`, `published_data`, `published_at`), inserts publication record into `content_publications`, and writes audit log to `audit_logs`.
   - Validates draft exists and enforces `is_admin()` caller authorization.

4. **Migration 00004 — Idempotency Unique Indexes:**  
   Path: [`supabase/migrations/00004_idempotency_unique_indexes.sql`](file:///Users/zannho/Desktop/portfolio/supabase/migrations/00004_idempotency_unique_indexes.sql)  
   - Creates `idx_boot_greetings_language_unique` on `public.boot_greetings (language)`.
   - Creates `idx_skills_category_name_unique` on `public.skills (category_id, name)`.
   - Guarantees database-level protection against accidental duplicates.

5. **Seeding Initial Approved Fixtures:**  
   Path: [`supabase/seed.sql`](file:///Users/zannho/Desktop/portfolio/supabase/seed.sql)  
   - Populates initial verified data using deterministic static UUIDs and `ON CONFLICT DO NOTHING`.
   - Seeds `GeoEntity`, `ClayCV`, and `SPK Bansos SAW` strictly with `status = 'draft'` and `published_data = NULL` so they remain isolated from public routes until explicitly published.
   - Seeds published site settings and profile pointing to `https://muhamadfauzan.dev`.

---

## 3. Storage Bucket Setup

Configure 6 dedicated storage buckets in the Supabase Dashboard (`Storage > Buckets`) or via SQL migration:

| Bucket Name | Visibility | Max Size | Allowed MIME Types | Allowed Extensions |
| :--- | :--- | :--- | :--- | :--- |
| `projects` | **Public** | 10 MB | `image/jpeg`, `image/png`, `image/webp`, `image/avif` | `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif` |
| `profile` | **Public** | 5 MB | `image/jpeg`, `image/png`, `image/webp`, `image/avif` | `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif` |
| `certificates` | **Public** | 10 MB | `image/jpeg`, `image/png`, `image/webp`, `application/pdf` | `.jpg`, `.jpeg`, `.png`, `.webp`, `.pdf` |
| `articles` | **Public** | 10 MB | `image/jpeg`, `image/png`, `image/webp`, `image/avif` | `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif` |
| `og-images` | **Public** | 5 MB | `image/jpeg`, `image/png`, `image/webp` | `.jpg`, `.jpeg`, `.png`, `.webp` |
| `resume` | **Private** | 10 MB | `application/pdf` | `.pdf` |

> [!IMPORTANT]
> The `resume` bucket is strictly **Private**. Resume files are only accessible to public visitors through the validated `/api/resume/download/[id]` route, which verifies that the requested resume version is marked `status = 'published'` and `isActive = true`.

---

## 4. Single-Admin Provisioning Workflow

Public registration is disabled. To provision the sole administrator account:

1. **Create Supabase Auth User:**
   In the Supabase Dashboard, navigate to `Authentication > Users > Add user > Create user`:
   - Email: `admin@muhamadfauzan.dev` (or your chosen admin email)
   - Password: Generate a high-entropy password (min 16 characters).
   - Auto-confirm user: **Checked** (Enabled).

2. **Register in `admin_users` Table:**
   Retrieve the generated `id` (UUID) from Supabase Auth and execute the SQL command:
   ```sql
   INSERT INTO public.admin_users (auth_user_id, email, role, is_active)
   VALUES (
     'PASTE-AUTH-USER-UUID-HERE',
     'admin@muhamadfauzan.dev',
     'admin',
     TRUE
   )
   ON CONFLICT (auth_user_id) DO UPDATE
   SET email = EXCLUDED.email, is_active = TRUE;
   ```

3. **Set Server Environment Variable:**
   Set `ADMIN_ALLOWED_EMAIL="admin@muhamadfauzan.dev"` in your production environment variables.

---

## 5. Vercel Deployment Configuration

1. **Connect Repository:**
   Import the Git repository into Vercel.
2. **Build & Development Settings:**
   - Framework Preset: **Next.js**
   - Node.js Version: **20.x** (or later)
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
3. **Environment Variables:**
   Add all required production variables from Section 1 (`DATA_ADAPTER_MODE`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_ALLOWED_EMAIL`, `NEXT_PUBLIC_SITE_URL`).
4. **Deploy:** Click **Deploy**.

---

## 6. Security Headers & CSP Verification

The application includes enterprise-grade HTTP security headers configured in `next.config.ts`:
- **Content-Security-Policy (CSP):** Restricts script, style, and object execution.
- **X-Frame-Options:** `DENY` (prevents clickjacking).
- **X-Content-Type-Options:** `nosniff` (prevents MIME sniffing).
- **Referrer-Policy:** `strict-origin-when-cross-origin`.
- **Permissions-Policy:** Disables unused browser hardware APIs (`camera=()`, `microphone=()`, `geolocation=()`).
- **Strict-Transport-Security (HSTS):** `max-age=63072000; includeSubDomains; preload`.

Verify headers post-deployment:
```bash
curl -I https://muhamadfauzan.dev
```

---

## 7. Backup & Disaster Recovery Procedures

### 7.1 Database Snapshots
- **Automated Backups:** Supabase automatically creates daily database backups.
- **Manual Backups:** Before performing major schema modifications or database upgrades, execute:
  ```bash
  supabase db dump --data-only -f backup_$(date +%Y%m%d_%H%M%S).sql
  ```

### 7.2 Rollback via Immutable Revision Snapshots
If accidental corruption occurs in CMS content:
1. Open `/admin/settings` to inspect the **Immutable Revision History**.
2. Find the previous stable revision record (`vN`).
3. The content snapshot is preserved in `content_revisions.snapshot`. You can restore and publish that version directly through the Admin CMS or SQL procedure without data loss.

# DGP LOGISTICS – Deployment, Supabase Setup & Handover Notes

## 1. Branding & Flyer Discrepancy Note
- The website uses **DGP LOGISTICS** throughout all navigation, metadata, headers, footers, and WhatsApp handovers as specified in the brief.
- The reference flyer displays a slightly different brand mark/logo treatment. Rather than hardcoding a conflicting logo, the header wordmark and logo are database-managed and replaceable in **Admin Dashboard → Website Content → Replaceable Logo**.

## 2. Unpublished Draft Content (Requires Owner Confirmation)
The following figures from the reference flyer are seeded in the database with `is_published = false` (never shown publicly until confirmed and published in the Admin Dashboard):
1. **Sea freight rate**: `US$240 per CBM` (draft).
2. **Air / general goods rate**: `US$15 per kg` (draft).
3. **Phone shipping rate**: `150 yuan` for iPhone and Android phones (draft — unit is unspecified in the flyer; confirm whether per phone or per parcel before publishing).
4. **Sea transit estimate**: `50 days` to Accra and Kumasi (draft — do not publish as a guaranteed arrival date).
5. **Reference exchange-rate figure**: `0.546` (draft — currency pair and calculation basis are unspecified).
6. **Draft office locations**: `Adabraka, opposite the Police Station` (Ghana) and `Foshan, Guangdong` (China) are stored as unpublished drafts until the owner confirms exact addresses and hours.

Until rates are confirmed and published, public pages display: *"Contact us for current rates and shipment terms."*

## 3. Supabase Setup & Migrations
Run the SQL migration files in `supabase/migrations/` in order inside your Supabase SQL Editor (or via `supabase db push`):
1. `supabase/migrations/001_initial_schema.sql` — Creates all 11 tables (`media_assets`, `site_settings`, `pages`, `services`, `service_rates`, `cargo_categories`, `faqs`, `enquiries`, `enquiry_notes`, `admin_users`, `audit_logs`), foreign keys, and indexes.
2. `supabase/migrations/002_rls_policies.sql` — Enables Row Level Security on all tables, creates `public.is_dgp_admin()`, exposes safe `public.public_site_settings` view, and prevents anonymous access to enquiries, notes, audit logs, or admin membership.
3. `supabase/migrations/003_storage_and_seed.sql` — Creates the `public-media` storage bucket (`5 MB` limit, image MIME restrictions), storage RLS policies, and safe unpublished seed defaults.

## 4. Secure Owner Account Provisioning
- No default password, owner email, or public admin registration exists in frontend code, public env vars, or seed files.
- **Password Policy**: Minimum 10 characters including uppercase, lowercase, number, and special character. (Note: An initial password like `Omakitchen` does not satisfy the number + symbol policy and will be rejected unless a stronger password is supplied; do not weaken the policy.)
- **Option A (First-time setup UI)**: Visit `/admin/login` when `0` administrators exist to provision the real owner email and a strong password once.
- **Option B (CLI provisioning)**:
  ```bash
  npx tsx scripts/provision-owner.ts "owner@yourdomain.com" "YourStrong!Pass2026" "Owner Name"
  ```

## 5. Required Environment Variables (Development, Preview & Production)
Configure in `.env` locally and in **Vercel → Project Settings → Environment Variables** before building:
- `NEXT_PUBLIC_SITE_URL` / `VITE_SITE_URL` — Canonical production domain (e.g. `https://dgplogistics.com`)
- `NEXT_PUBLIC_SUPABASE_URL` & `SUPABASE_URL` — Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` & `SUPABASE_ANON_KEY` — Supabase anon/publishable key
- `SUPABASE_SERVICE_ROLE_KEY` — Server-only secret key (NEVER prefix with `NEXT_PUBLIC_` or `VITE_`)
- `SESSION_SECRET` — Server-only random 32+ character signing secret for HTTP-only admin cookies

## 6. Image Attribution & Remaining Media Needs
All 6 bundled logistics photographs (`/src/assets/images/*`) are editorial representative cargo/freight visuals generated for initial launch and catalogued in `media_assets`:
- `hero_cargo_port_1794939878382.jpg` — Commercial container port terminal (representative logistics photo; not labelled as Tema Port).
- `warehouse_repacking_station_1794939878340.jpg` — Consolidation & repacking table (representative warehouse photo).
- `air_cargo_loading_1794939877714.jpg` — Air freight loading apron (representative air cargo photo).
- `local_cargo_delivery_1794939879425.jpg` — Urban parcel handover van (representative local delivery photo).
- `cargo_electronics_clean_1794939915590.jpg` — Cushioned smartphone & laptop export carton.
- `cargo_wholesale_goods_1794939917144.jpg` — Wholesale apparel, footwear, and bags staged for export.

**Remaining owner-supplied items recommended before full launch:**
1. Official high-resolution **DGP LOGISTICS logo** file (upload via Admin → Media Library → Website Content).
2. Authentic **Ghana & China warehouse / handling photographs** owned by DGP LOGISTICS.
3. Confirmed Ghana & China **office addresses**, receiving instructions, and verified **rates/units/transit terms**.

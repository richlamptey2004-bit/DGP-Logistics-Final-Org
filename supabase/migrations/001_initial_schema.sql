-- DGP LOGISTICS - Initial PostgreSQL Schema for Supabase
-- Run via Supabase SQL Editor or `supabase db push`

create extension if not exists "pgcrypto";

-- 1. Media Assets
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  storage_path text not null,
  url text not null,
  alt_text text not null default '',
  source_credit text not null default '',
  licence_info text not null default '',
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 5242880),
  created_at timestamptz not null default now()
);

-- 2. Site Settings (Singleton row)
create table if not exists public.site_settings (
  id text primary key default 'default',
  business_name text not null default 'DGP LOGISTICS',
  route_label text not null default 'China → Ghana',
  ghana_whatsapp text not null default '+233266663700',
  china_whatsapp text not null default '+8615820200000',
  logo_media_id uuid references public.media_assets(id) on delete set null,
  logo_url text,
  logo_alt text not null default 'DGP LOGISTICS',
  draft_ghana_office text not null default 'Adabraka, opposite the Police Station (Draft — unconfirmed)',
  draft_china_office text not null default 'Foshan, Guangdong (Draft — unconfirmed)',
  confirmed_ghana_office text not null default '',
  confirmed_china_office text not null default '',
  office_details_published boolean not null default false,
  repacking_heading text not null default 'Free repacking included in shipments',
  repacking_body text not null default 'Our repacking service helps prepare your goods for onward shipping. Contact us to confirm the packaging arrangements for your shipment.',
  repacking_conditions text not null default '',
  repacking_published boolean not null default true,
  pricing_fallback_notice text not null default 'Contact us for current rates and shipment terms.',
  updated_at timestamptz not null default now()
);

-- 3. Editable Pages
create table if not exists public.pages (
  slug text primary key,
  title text not null,
  meta_title text not null,
  meta_description text not null,
  hero_headline text not null default '',
  hero_subheadline text not null default '',
  hero_media_id uuid references public.media_assets(id) on delete set null,
  hero_image_url text,
  hero_image_alt text not null default '',
  body_sections jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- 4. Services
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  short_description text not null,
  full_description text not null,
  suitable_for text not null default '',
  quote_requirements text not null default '',
  conditions text not null default '',
  icon_name text not null default 'Package',
  media_id uuid references public.media_assets(id) on delete set null,
  image_url text,
  image_alt text not null default '',
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('published', 'draft', 'archived')),
  show_on_home boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_services_status_order on public.services(status, sort_order);

-- 5. Service Rates (Draft flyer figures remain is_published = false until verified)
create table if not exists public.service_rates (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  label text not null,
  amount_display text not null,
  currency text not null default '',
  unit text not null default '',
  estimated_transit text not null default '',
  conditions text not null default '',
  effective_date text not null default '',
  is_published boolean not null default false,
  internal_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_service_rates_service on public.service_rates(service_id, is_published);

-- 6. Cargo Categories
create table if not exists public.cargo_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  restricted_notice text not null default '',
  media_id uuid references public.media_assets(id) on delete set null,
  image_url text,
  image_alt text not null default '',
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cargo_categories_order on public.cargo_categories(is_published, sort_order);

-- 7. FAQs
create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. Enquiries (Strictly Private)
create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique,
  client_submission_id text not null unique,
  full_name text not null,
  phone_whatsapp text not null,
  email text not null default '',
  destination_city text not null,
  delivery_area text not null default '',
  service_slug text not null default 'not-sure',
  service_name text not null default 'Not sure',
  cargo_category_slug text not null default '',
  cargo_category_name text not null default '',
  goods_description text not null,
  quantity text not null default 'Not sure',
  estimated_weight_kg text not null default 'Not sure',
  dimensions_cm text not null default 'Not sure',
  estimated_volume_cbm text not null default 'Not sure',
  china_location text not null default '',
  preferred_shipping_method text not null default 'Not sure',
  door_to_door_required boolean not null default false,
  preferred_office text not null check (preferred_office in ('Ghana', 'China')),
  additional_notes text not null default '',
  consent_accepted boolean not null check (consent_accepted = true),
  status text not null default 'New' check (status in ('New', 'Contacted', 'Quoted', 'Booked', 'Closed')),
  whatsapp_message text not null,
  whatsapp_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_enquiries_status_created on public.enquiries(status, created_at desc);
create index if not exists idx_enquiries_service_slug on public.enquiries(service_slug);

-- 9. Private Admin Notes on Enquiries
create table if not exists public.enquiry_notes (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries(id) on delete cascade,
  author_user_id uuid references auth.users(id) on delete set null,
  author_email text not null,
  note text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_enquiry_notes_enquiry on public.enquiry_notes(enquiry_id, created_at desc);

-- 10. Admin Users (Linked to auth.users)
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default 'DGP Administrator',
  role text not null default 'owner' check (role in ('owner', 'admin')),
  is_active boolean not null default true,
  must_change_password boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 11. Audit Logs
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_email text not null,
  action text not null,
  entity_type text not null,
  entity_id text not null default '',
  summary text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_created on public.audit_logs(created_at desc);

-- DGP LOGISTICS - Row Level Security (RLS) Policies (Idempotent)
-- Least-privilege enforcement across all tables

alter table public.media_assets enable row level security;
alter table public.site_settings enable row level security;
alter table public.pages enable row level security;
alter table public.services enable row level security;
alter table public.service_rates enable row level security;
alter table public.cargo_categories enable row level security;
alter table public.faqs enable row level security;
alter table public.enquiries enable row level security;
alter table public.enquiry_notes enable row level security;
alter table public.admin_users enable row level security;
alter table public.audit_logs enable row level security;

-- Helper function checking verified administrator membership
create or replace function public.is_dgp_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where auth_user_id = auth.uid()
      and is_active = true
  );
$$;

-- Safe public view for site_settings excluding unpublished draft office fields
create or replace view public.public_site_settings as
select
  id,
  business_name,
  route_label,
  ghana_whatsapp,
  china_whatsapp,
  logo_media_id,
  logo_url,
  logo_alt,
  case when office_details_published then confirmed_ghana_office else '' end as confirmed_ghana_office,
  case when office_details_published then confirmed_china_office else '' end as confirmed_china_office,
  office_details_published,
  repacking_heading,
  repacking_body,
  repacking_conditions,
  repacking_published,
  pricing_fallback_notice,
  updated_at
from public.site_settings;

grant select on public.public_site_settings to anon, authenticated;

-- Media Assets
drop policy if exists "Public read media_assets" on public.media_assets;
create policy "Public read media_assets"
  on public.media_assets for select
  using (true);

drop policy if exists "Admins manage media_assets" on public.media_assets;
create policy "Admins manage media_assets"
  on public.media_assets for all
  using (public.is_dgp_admin())
  with check (public.is_dgp_admin());

-- Site Settings
drop policy if exists "Admins manage site_settings" on public.site_settings;
create policy "Admins manage site_settings"
  on public.site_settings for all
  using (public.is_dgp_admin())
  with check (public.is_dgp_admin());

-- Pages
drop policy if exists "Public read pages" on public.pages;
create policy "Public read pages"
  on public.pages for select
  using (true);

drop policy if exists "Admins manage pages" on public.pages;
create policy "Admins manage pages"
  on public.pages for all
  using (public.is_dgp_admin())
  with check (public.is_dgp_admin());

-- Services
drop policy if exists "Public read published services" on public.services;
create policy "Public read published services"
  on public.services for select
  using (status = 'published' or public.is_dgp_admin());

drop policy if exists "Admins manage services" on public.services;
create policy "Admins manage services"
  on public.services for all
  using (public.is_dgp_admin())
  with check (public.is_dgp_admin());

-- Service Rates
drop policy if exists "Public read published service_rates" on public.service_rates;
create policy "Public read published service_rates"
  on public.service_rates for select
  using (
    (is_published = true and exists (
      select 1 from public.services s where s.id = service_id and s.status = 'published'
    ))
    or public.is_dgp_admin()
  );

drop policy if exists "Admins manage service_rates" on public.service_rates;
create policy "Admins manage service_rates"
  on public.service_rates for all
  using (public.is_dgp_admin())
  with check (public.is_dgp_admin());

-- Cargo Categories
drop policy if exists "Public read published cargo_categories" on public.cargo_categories;
create policy "Public read published cargo_categories"
  on public.cargo_categories for select
  using (is_published = true or public.is_dgp_admin());

drop policy if exists "Admins manage cargo_categories" on public.cargo_categories;
create policy "Admins manage cargo_categories"
  on public.cargo_categories for all
  using (public.is_dgp_admin())
  with check (public.is_dgp_admin());

-- FAQs
drop policy if exists "Public read published faqs" on public.faqs;
create policy "Public read published faqs"
  on public.faqs for select
  using (is_published = true or public.is_dgp_admin());

drop policy if exists "Admins manage faqs" on public.faqs;
create policy "Admins manage faqs"
  on public.faqs for all
  using (public.is_dgp_admin())
  with check (public.is_dgp_admin());

-- Enquiries (STRICTLY ADMIN READ/UPDATE; validated public INSERT when consent_accepted = true)
drop policy if exists "Public insert enquiries" on public.enquiries;
create policy "Public insert enquiries"
  on public.enquiries for insert
  to anon, authenticated
  with check (consent_accepted = true);

drop policy if exists "Admins read and update enquiries" on public.enquiries;
create policy "Admins read and update enquiries"
  on public.enquiries for select
  using (public.is_dgp_admin());

drop policy if exists "Admins update enquiries" on public.enquiries;
create policy "Admins update enquiries"
  on public.enquiries for update
  using (public.is_dgp_admin())
  with check (public.is_dgp_admin());

-- Enquiry Notes (STRICTLY ADMIN ONLY)
drop policy if exists "Admins manage enquiry_notes" on public.enquiry_notes;
create policy "Admins manage enquiry_notes"
  on public.enquiry_notes for all
  using (public.is_dgp_admin())
  with check (public.is_dgp_admin());

-- Admin Users
drop policy if exists "Admins read admin_users" on public.admin_users;
create policy "Admins read admin_users"
  on public.admin_users for select
  using (auth_user_id = auth.uid() or public.is_dgp_admin());

-- Audit Logs
drop policy if exists "Admins read audit_logs" on public.audit_logs;
create policy "Admins read audit_logs"
  on public.audit_logs for select
  using (public.is_dgp_admin());

drop policy if exists "Admins insert audit_logs" on public.audit_logs;
create policy "Admins insert audit_logs"
  on public.audit_logs for insert
  with check (public.is_dgp_admin());

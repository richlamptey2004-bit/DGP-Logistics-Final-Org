import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type {
  AdminUserPublic,
  AuditLog,
  CargoCategory,
  EditablePage,
  EnquiryNote,
  EnquiryStatus,
  FAQItem,
  LogisticsService,
  MediaAsset,
  PublicBootstrapPayload,
  ServiceRate,
  ShipmentEnquiry,
  SiteSettings,
} from '../src/types/logistics';
import {
  SEED_CARGO_CATEGORIES,
  SEED_FAQS,
  SEED_MEDIA_ASSETS,
  SEED_PAGES,
  SEED_SERVICES,
  SEED_SERVICE_RATES,
  SEED_SITE_SETTINGS,
} from './seed-data';
import { hashPassword, verifyPassword } from './security';

interface AdminUserRecord extends AdminUserPublic {
  password_hash: string;
  is_active: boolean;
}

interface LocalDatabase {
  settings: SiteSettings;
  pages: Record<string, EditablePage>;
  services: LogisticsService[];
  rates: ServiceRate[];
  categories: CargoCategory[];
  faqs: FAQItem[];
  media: MediaAsset[];
  enquiries: ShipmentEnquiry[];
  enquiry_notes: EnquiryNote[];
  admin_users: AdminUserRecord[];
  audit_logs: AuditLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'dgp-store.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export function getUploadsDir(): string {
  ensureDirs();
  return UPLOADS_DIR;
}

function normalizeSupabaseUrl(raw: string): string {
  return raw
    .trim()
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/+$/, '');
}

function getSupabaseConfig(): { url: string; serviceKey: string; anonKey: string } | null {
  const rawUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const url = normalizeSupabaseUrl(rawUrl);
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const anonKey = (
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    ''
  ).trim();
  if (url && (serviceKey || anonKey)) {
    return { url, serviceKey, anonKey };
  }
  return null;
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}

export function hasSupabaseServiceRole(): boolean {
  const cfg = getSupabaseConfig();
  return Boolean(cfg && cfg.serviceKey);
}

function getSupabaseClient(sbAccessToken?: string): SupabaseClient {
  const cfg = getSupabaseConfig();
  if (!cfg) {
    throw new Error('Supabase credentials are not configured.');
  }
  const key = cfg.serviceKey || cfg.anonKey;
  const globalHeaders =
    !cfg.serviceKey && sbAccessToken
      ? { Authorization: `Bearer ${sbAccessToken}` }
      : undefined;

  return createClient(cfg.url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    ...(globalHeaders ? { global: { headers: globalHeaders } } : {}),
  });
}

function getSupabaseAdmin(sbAccessToken?: string): SupabaseClient {
  return getSupabaseClient(sbAccessToken);
}

function createInitialDb(): LocalDatabase {
  return {
    settings: { ...SEED_SITE_SETTINGS },
    pages: JSON.parse(JSON.stringify(SEED_PAGES)),
    services: JSON.parse(JSON.stringify(SEED_SERVICES)),
    rates: JSON.parse(JSON.stringify(SEED_SERVICE_RATES)),
    categories: JSON.parse(JSON.stringify(SEED_CARGO_CATEGORIES)),
    faqs: JSON.parse(JSON.stringify(SEED_FAQS)),
    media: JSON.parse(JSON.stringify(SEED_MEDIA_ASSETS)),
    enquiries: [],
    enquiry_notes: [],
    admin_users: [],
    audit_logs: [],
  };
}

function readLocalDb(): LocalDatabase {
  ensureDirs();
  if (!fs.existsSync(STORE_PATH)) {
    const initial = createInitialDb();
    writeLocalDb(initial);
    return initial;
  }
  const raw = fs.readFileSync(STORE_PATH, 'utf8');
  return JSON.parse(raw) as LocalDatabase;
}

function writeLocalDb(db: LocalDatabase): void {
  ensureDirs();
  const tmpPath = `${STORE_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmpPath, STORE_PATH);
}

export function getStorageMode(): 'supabase' | 'local_store' {
  return isSupabaseConfigured() ? 'supabase' : 'local_store';
}

export async function getAdminCount(): Promise<number> {
  if (isSupabaseConfigured()) {
    if (!hasSupabaseServiceRole()) {
      // Anon key cannot query admin_users due to RLS; return 1 so /admin/login shows sign-in instead of owner setup
      return 1;
    }
    const sb = getSupabaseAdmin();
    const { count, error } = await sb
      .from('admin_users')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);
    if (error) throw new Error(`Supabase error checking admin users: ${error.message}`);
    return count ?? 0;
  }
  const db = readLocalDb();
  return db.admin_users.filter((u) => u.is_active).length;
}

export async function provisionOwnerAccount(input: {
  email?: string;
  fullName?: string;
  password: string;
}): Promise<AdminUserPublic> {
  const existingCount = await getAdminCount();
  if (existingCount > 0) {
    throw new Error('Owner account already provisioned. Please sign in at /admin/login.');
  }

  const normalizedEmail = (input.email || 'owner@dgplogistics.local').trim().toLowerCase();
  const fullName = (input.fullName || 'DGP LOGISTICS Owner').trim();
  const now = new Date().toISOString();

  if (isSupabaseConfigured()) {
    if (!hasSupabaseServiceRole()) {
      throw new Error(
        'Web UI owner provisioning requires SUPABASE_SERVICE_ROLE_KEY. Create the user in Supabase Auth and link public.admin_users in SQL Editor, or set SUPABASE_SERVICE_ROLE_KEY.',
      );
    }
    const sb = getSupabaseAdmin();
    const { data: authData, error: authErr } = await sb.auth.admin.createUser({
      email: normalizedEmail,
      password: input.password,
      email_confirm: true,
    });
    if (authErr || !authData.user) {
      throw new Error(authErr?.message || 'Failed to create Supabase Auth user.');
    }
    const { data: adminRow, error: insertErr } = await sb
      .from('admin_users')
      .insert({
        auth_user_id: authData.user.id,
        email: normalizedEmail,
        full_name: fullName,
        role: 'owner',
        is_active: true,
        must_change_password: false,
      })
      .select()
      .single();
    if (insertErr || !adminRow) {
      throw new Error(insertErr?.message || 'Failed to create admin_users record.');
    }
    await recordAuditLog({
      actorEmail: normalizedEmail,
      action: 'owner_provisioned',
      entityType: 'admin_users',
      entityId: adminRow.id,
      summary: `Initial owner account provisioned (${normalizedEmail})`,
    });
    return {
      id: adminRow.id,
      email: adminRow.email,
      full_name: adminRow.full_name,
      role: adminRow.role,
      must_change_password: adminRow.must_change_password,
      created_at: adminRow.created_at,
    };
  }

  const db = readLocalDb();
  const newUser: AdminUserRecord = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    full_name: fullName,
    role: 'owner',
    is_active: true,
    must_change_password: false,
    password_hash: hashPassword(input.password),
    created_at: now,
  };
  db.admin_users.push(newUser);
  db.audit_logs.unshift({
    id: crypto.randomUUID(),
    actor_email: normalizedEmail,
    action: 'owner_provisioned',
    entity_type: 'admin_users',
    entity_id: newUser.id,
    summary: `Initial owner account provisioned (${normalizedEmail})`,
    created_at: now,
  });
  writeLocalDb(db);
  const { password_hash: _ignored, is_active: _active, ...pub } = newUser;
  return pub;
}

export type AuthenticatedAdminResult = AdminUserPublic & { sbAccessToken?: string };

export async function authenticateAdmin(
  email: string,
  password: string,
): Promise<AuthenticatedAdminResult | null> {
  const normalized = email.trim().toLowerCase();
  if (isSupabaseConfigured()) {
    const cfg = getSupabaseConfig()!;
    const sbAuth = createClient(cfg.url, cfg.anonKey || cfg.serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await sbAuth.auth.signInWithPassword({
      email: normalized,
      password,
    });
    if (error || !data.user) return null;
    const accessToken = data.session?.access_token;
    const sb = getSupabaseAdmin(accessToken);
    const { data: adminRow, error: adminErr } = await sb
      .from('admin_users')
      .select('id, email, full_name, role, is_active, must_change_password, created_at')
      .eq('auth_user_id', data.user.id)
      .eq('is_active', true)
      .single();
    if (adminErr || !adminRow) return null;
    return {
      id: adminRow.id,
      email: adminRow.email,
      full_name: adminRow.full_name,
      role: adminRow.role,
      must_change_password: adminRow.must_change_password,
      created_at: adminRow.created_at,
      sbAccessToken: accessToken,
    };
  }

  const db = readLocalDb();
  const user = db.admin_users.find((u) => u.email.toLowerCase() === normalized && u.is_active);
  if (!user) return null;
  if (!verifyPassword(password, user.password_hash)) return null;
  const { password_hash: _ignored, is_active: _active, ...pub } = user;
  return pub;
}

export async function authenticateAdminByPassword(
  password: string,
): Promise<AuthenticatedAdminResult | null> {
  if (!password) return null;

  if (isSupabaseConfigured()) {
    if (!hasSupabaseServiceRole()) {
      const ownerEmail = (process.env.ADMIN_OWNER_EMAIL || '').trim().toLowerCase();
      if (!ownerEmail) return null;
      return authenticateAdmin(ownerEmail, password);
    }

    const sb = getSupabaseAdmin();
    const { data: rows, error } = await sb
      .from('admin_users')
      .select('id, email, full_name, role, is_active, must_change_password, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: true });
    if (error || !rows || rows.length === 0) return null;

    const cfg = getSupabaseConfig()!;
    const sbAuth = createClient(cfg.url, cfg.anonKey || cfg.serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    for (const row of rows) {
      const { data, error: signErr } = await sbAuth.auth.signInWithPassword({
        email: row.email,
        password,
      });
      if (!signErr && data.user) {
        return {
          id: row.id,
          email: row.email,
          full_name: row.full_name,
          role: row.role,
          must_change_password: row.must_change_password,
          created_at: row.created_at,
          sbAccessToken: data.session?.access_token,
        };
      }
    }
    return null;
  }

  const db = readLocalDb();
  const user = db.admin_users.find((u) => u.is_active && verifyPassword(password, u.password_hash));
  if (!user) return null;
  const { password_hash: _ignored, is_active: _active, ...pub } = user;
  return pub;
}

export async function getAdminUserById(
  userId: string,
  sbAccessToken?: string,
): Promise<AdminUserPublic | null> {
  if (isSupabaseConfigured()) {
    if (!hasSupabaseServiceRole() && !sbAccessToken) return null;
    const sb = getSupabaseAdmin(sbAccessToken);
    const { data, error } = await sb
      .from('admin_users')
      .select('id, email, full_name, role, is_active, must_change_password, created_at')
      .eq('id', userId)
      .eq('is_active', true)
      .single();
    if (error || !data) return null;
    return {
      id: data.id,
      email: data.email,
      full_name: data.full_name,
      role: data.role,
      must_change_password: data.must_change_password,
      created_at: data.created_at,
    };
  }
  const db = readLocalDb();
  const user = db.admin_users.find((u) => u.id === userId && u.is_active);
  if (!user) return null;
  const { password_hash: _ignored, is_active: _active, ...pub } = user;
  return pub;
}

export async function changeAdminPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  sbAccessToken?: string,
): Promise<{ ok: boolean; error?: string }> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin(sbAccessToken);
    const { data: adminRow } = await sb
      .from('admin_users')
      .select('id, auth_user_id, email')
      .eq('id', userId)
      .single();
    if (!adminRow) return { ok: false, error: 'Administrator record not found.' };

    if (hasSupabaseServiceRole()) {
      const authOk = await authenticateAdmin(adminRow.email, currentPassword);
      if (!authOk) return { ok: false, error: 'Current password is incorrect.' };
      const { error: updErr } = await sb.auth.admin.updateUserById(adminRow.auth_user_id, {
        password: newPassword,
      });
      if (updErr) return { ok: false, error: updErr.message };
      await sb.from('admin_users').update({ must_change_password: false }).eq('id', userId);
      await recordAuditLog({
        actorEmail: adminRow.email,
        action: 'password_changed',
        entityType: 'admin_users',
        entityId: userId,
        summary: 'Administrator password updated',
      });
      return { ok: true };
    }

    const cfg = getSupabaseConfig()!;
    const sbAuth = createClient(cfg.url, cfg.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: signInData, error: signErr } = await sbAuth.auth.signInWithPassword({
      email: adminRow.email,
      password: currentPassword,
    });
    if (signErr || !signInData.session) {
      return { ok: false, error: 'Current password is incorrect.' };
    }
    const { error: updErr } = await sbAuth.auth.updateUser({ password: newPassword });
    if (updErr) return { ok: false, error: updErr.message };
    await recordAuditLog(
      {
        actorEmail: adminRow.email,
        action: 'password_changed',
        entityType: 'admin_users',
        entityId: userId,
        summary: 'Administrator password updated',
      },
      signInData.session.access_token,
    );
    return { ok: true };
  }

  const db = readLocalDb();
  const user = db.admin_users.find((u) => u.id === userId && u.is_active);
  if (!user) return { ok: false, error: 'Administrator account not found.' };
  if (!verifyPassword(currentPassword, user.password_hash)) {
    return { ok: false, error: 'Current password is incorrect.' };
  }
  user.password_hash = hashPassword(newPassword);
  user.must_change_password = false;
  db.audit_logs.unshift({
    id: crypto.randomUUID(),
    actor_email: user.email,
    action: 'password_changed',
    entity_type: 'admin_users',
    entityId: user.id,
    entity_id: user.id,
    summary: 'Administrator password updated',
    created_at: new Date().toISOString(),
  } as AuditLog);
  writeLocalDb(db);
  return { ok: true };
}

export async function recordAuditLog(
  input: {
    actorEmail: string;
    action: string;
    entityType: string;
    entityId: string;
    summary: string;
  },
  sbAccessToken?: string,
): Promise<void> {
  const now = new Date().toISOString();
  if (isSupabaseConfigured()) {
    if (!hasSupabaseServiceRole() && !sbAccessToken) return;
    const sb = getSupabaseAdmin(sbAccessToken);
    await sb.from('audit_logs').insert({
      actor_email: input.actorEmail,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId,
      summary: input.summary,
    });
    return;
  }
  const db = readLocalDb();
  db.audit_logs.unshift({
    id: crypto.randomUUID(),
    actor_email: input.actorEmail,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    summary: input.summary,
    created_at: now,
  });
  db.audit_logs = db.audit_logs.slice(0, 500);
  writeLocalDb(db);
}

// ---------- PUBLIC READS (STRICTLY PUBLISHED DATA ONLY) ----------

export async function getPublicBootstrap(): Promise<PublicBootstrapPayload> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseClient();
    const [settingsRes, pagesRes, servicesRes, ratesRes, categoriesRes, faqsRes, mediaRes] =
      await Promise.all([
        sb.from('public_site_settings').select('*').eq('id', 'default').single(),
        sb.from('pages').select('*'),
        sb.from('services').select('*').eq('status', 'published').order('sort_order', { ascending: true }),
        sb.from('service_rates').select('*').eq('is_published', true),
        sb.from('cargo_categories').select('*').eq('is_published', true).order('sort_order', { ascending: true }),
        sb.from('faqs').select('*').eq('is_published', true).order('sort_order', { ascending: true }),
        sb.from('media_assets').select('*').order('created_at', { ascending: false }),
      ]);

    if (settingsRes.error) throw new Error(`Supabase error: ${settingsRes.error.message}`);
    const publishedRates = (ratesRes.data || []) as ServiceRate[];
    const services = ((servicesRes.data || []) as LogisticsService[]).map((svc) => ({
      ...svc,
      rates: publishedRates.filter((r) => r.service_id === svc.id),
    }));
    const pagesMap: Record<string, EditablePage> = {};
    for (const p of (pagesRes.data || []) as EditablePage[]) {
      pagesMap[p.slug] = p;
    }

    return {
      settings: settingsRes.data,
      pages: pagesMap,
      services,
      categories: (categoriesRes.data || []) as CargoCategory[],
      faqs: (faqsRes.data || []) as FAQItem[],
      media: (mediaRes.data || []) as MediaAsset[],
    };
  }

  const db = readLocalDb();
  const { draft_ghana_office: _dg, draft_china_office: _dc, ...safeSettings } = db.settings;
  if (!safeSettings.office_details_published) {
    safeSettings.confirmed_ghana_office = '';
    safeSettings.confirmed_china_office = '';
  }

  const publishedRates = db.rates.filter((r) => r.is_published);
  const publishedServices = db.services
    .filter((s) => s.status === 'published')
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((svc) => ({
      ...svc,
      rates: publishedRates.filter((r) => r.service_id === svc.id),
    }));

  const publishedCategories = db.categories
    .filter((c) => c.is_published)
    .sort((a, b) => a.sort_order - b.sort_order);

  const publishedFaqs = db.faqs
    .filter((f) => f.is_published)
    .sort((a, b) => a.sort_order - b.sort_order);

  return {
    settings: safeSettings,
    pages: db.pages,
    services: publishedServices,
    categories: publishedCategories,
    faqs: publishedFaqs,
    media: db.media,
  };
}

// ---------- ENQUIRIES (PUBLIC WRITE WITH DEDUPLICATION, ADMIN-ONLY READ/UPDATE) ----------

export async function createOrGetEnquiry(
  payload: Omit<ShipmentEnquiry, 'id' | 'created_at' | 'updated_at' | 'status'>,
): Promise<{ enquiry: ShipmentEnquiry; deduplicated: boolean }> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured()) {
    if (hasSupabaseServiceRole()) {
      const sb = getSupabaseAdmin();
      const { data: existing } = await sb
        .from('enquiries')
        .select('*')
        .eq('client_submission_id', payload.client_submission_id)
        .maybeSingle();

      if (existing) {
        return { enquiry: existing as ShipmentEnquiry, deduplicated: true };
      }

      const { data: inserted, error } = await sb
        .from('enquiries')
        .insert({
          ...payload,
          status: 'New',
        })
        .select()
        .single();

      if (error || !inserted) {
        throw new Error(error?.message || 'Unable to save enquiry to Supabase.');
      }
      return { enquiry: inserted as ShipmentEnquiry, deduplicated: false };
    }

    // Anon key path: insert without chaining .select() so anon never needs SELECT RLS on enquiries
    const sb = getSupabaseClient();
    const { error } = await sb.from('enquiries').insert({
      ...payload,
      status: 'New',
    });

    if (error) {
      if (error.code === '23505') {
        const dedupEnquiry: ShipmentEnquiry = {
          ...payload,
          id: payload.client_submission_id,
          status: 'New',
          created_at: now,
          updated_at: now,
        };
        return { enquiry: dedupEnquiry, deduplicated: true };
      }
      if (error.code === '42501') {
        throw new Error(
          'Supabase Row Level Security blocked public enquiry submission. Run the "Public insert enquiries" policy in Supabase SQL Editor or set SUPABASE_SERVICE_ROLE_KEY.',
        );
      }
      throw new Error(error.message || 'Unable to save enquiry to Supabase.');
    }

    const createdEnquiry: ShipmentEnquiry = {
      ...payload,
      id: crypto.randomUUID(),
      status: 'New',
      created_at: now,
      updated_at: now,
    };
    return { enquiry: createdEnquiry, deduplicated: false };
  }

  const db = readLocalDb();
  const existing = db.enquiries.find((e) => e.client_submission_id === payload.client_submission_id);
  if (existing) {
    return { enquiry: existing, deduplicated: true };
  }

  const newEnquiry: ShipmentEnquiry = {
    ...payload,
    id: crypto.randomUUID(),
    status: 'New',
    created_at: now,
    updated_at: now,
  };
  db.enquiries.unshift(newEnquiry);
  writeLocalDb(db);
  return { enquiry: newEnquiry, deduplicated: false };
}

// ---------- ADMIN DASHBOARD & CRUD ----------

export async function getAdminDashboardData(sbAccessToken?: string) {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin(sbAccessToken);
    const [
      settingsRes,
      pagesRes,
      servicesRes,
      ratesRes,
      categoriesRes,
      faqsRes,
      mediaRes,
      enquiriesRes,
      notesRes,
      auditRes,
    ] = await Promise.all([
      sb.from('site_settings').select('*').eq('id', 'default').single(),
      sb.from('pages').select('*'),
      sb.from('services').select('*').order('sort_order', { ascending: true }),
      sb.from('service_rates').select('*').order('updated_at', { ascending: false }),
      sb.from('cargo_categories').select('*').order('sort_order', { ascending: true }),
      sb.from('faqs').select('*').order('sort_order', { ascending: true }),
      sb.from('media_assets').select('*').order('created_at', { ascending: false }),
      sb.from('enquiries').select('*').order('created_at', { ascending: false }),
      sb.from('enquiry_notes').select('*').order('created_at', { ascending: false }),
      sb.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100),
    ]);

    if (settingsRes.error) throw new Error(settingsRes.error.message);

    const allNotes = (notesRes.data || []) as EnquiryNote[];
    const enquiries = ((enquiriesRes.data || []) as ShipmentEnquiry[]).map((e) => ({
      ...e,
      notes: allNotes.filter((n) => n.enquiry_id === e.id),
    }));

    const pagesMap: Record<string, EditablePage> = {};
    for (const p of (pagesRes.data || []) as EditablePage[]) {
      pagesMap[p.slug] = p;
    }

    return {
      storageMode: 'supabase' as const,
      settings: settingsRes.data as SiteSettings,
      pages: pagesMap,
      services: (servicesRes.data || []) as LogisticsService[],
      rates: (ratesRes.data || []) as ServiceRate[],
      categories: (categoriesRes.data || []) as CargoCategory[],
      faqs: (faqsRes.data || []) as FAQItem[],
      media: (mediaRes.data || []) as MediaAsset[],
      enquiries,
      auditLogs: (auditRes.data || []) as AuditLog[],
    };
  }

  const db = readLocalDb();
  const enquiriesWithNotes = db.enquiries.map((e) => ({
    ...e,
    notes: db.enquiry_notes.filter((n) => n.enquiry_id === e.id),
  }));

  return {
    storageMode: 'local_store' as const,
    settings: db.settings,
    pages: db.pages,
    services: [...db.services].sort((a, b) => a.sort_order - b.sort_order),
    rates: db.rates,
    categories: [...db.categories].sort((a, b) => a.sort_order - b.sort_order),
    faqs: [...db.faqs].sort((a, b) => a.sort_order - b.sort_order),
    media: db.media,
    enquiries: enquiriesWithNotes,
    auditLogs: db.audit_logs,
  };
}

export async function updateSiteSettings(
  patch: Partial<SiteSettings>,
  actorEmail: string,
  sbAccessToken?: string,
): Promise<SiteSettings> {
  const now = new Date().toISOString();
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin(sbAccessToken);
    const { data, error } = await sb
      .from('site_settings')
      .update({ ...patch, updated_at: now })
      .eq('id', 'default')
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || 'Failed to update settings');
    await recordAuditLog(
      {
        actorEmail,
        action: 'settings_updated',
        entityType: 'site_settings',
        entityId: 'default',
        summary: 'Updated site settings / contact or repacking details',
      },
      sbAccessToken,
    );
    return data as SiteSettings;
  }

  const db = readLocalDb();
  db.settings = { ...db.settings, ...patch, updated_at: now };
  writeLocalDb(db);
  await recordAuditLog({
    actorEmail,
    action: 'settings_updated',
    entityType: 'site_settings',
    entityId: 'default',
    summary: 'Updated site settings / contact or repacking details',
  });
  return db.settings;
}

export async function updateEditablePage(
  slug: string,
  patch: Partial<EditablePage>,
  actorEmail: string,
  sbAccessToken?: string,
): Promise<EditablePage> {
  const now = new Date().toISOString();
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin(sbAccessToken);
    const { data, error } = await sb
      .from('pages')
      .update({ ...patch, updated_at: now })
      .eq('slug', slug)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || 'Failed to update page');
    await recordAuditLog(
      {
        actorEmail,
        action: 'page_updated',
        entityType: 'pages',
        entityId: slug,
        summary: `Updated content for /${slug === 'home' ? '' : slug}`,
      },
      sbAccessToken,
    );
    return data as EditablePage;
  }

  const db = readLocalDb();
  if (!db.pages[slug]) throw new Error('Page not found');
  db.pages[slug] = { ...db.pages[slug], ...patch, updated_at: now };
  writeLocalDb(db);
  await recordAuditLog({
    actorEmail,
    action: 'page_updated',
    entityType: 'pages',
    entityId: slug,
    summary: `Updated content for /${slug === 'home' ? '' : slug}`,
  });
  return db.pages[slug];
}

export async function saveService(
  service: Partial<LogisticsService> & { id?: string },
  actorEmail: string,
  sbAccessToken?: string,
): Promise<LogisticsService> {
  const now = new Date().toISOString();
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin(sbAccessToken);
    if (service.id) {
      const { data, error } = await sb
        .from('services')
        .update({ ...service, updated_at: now })
        .eq('id', service.id)
        .select()
        .single();
      if (error || !data) throw new Error(error?.message || 'Failed to update service');
      await recordAuditLog(
        {
          actorEmail,
          action: 'service_updated',
          entityType: 'services',
          entityId: data.id,
          summary: `Updated service "${data.title}" (${data.status})`,
        },
        sbAccessToken,
      );
      return data as LogisticsService;
    } else {
      const { data, error } = await sb
        .from('services')
        .insert({ ...service, updated_at: now })
        .select()
        .single();
      if (error || !data) throw new Error(error?.message || 'Failed to create service');
      await recordAuditLog(
        {
          actorEmail,
          action: 'service_created',
          entityType: 'services',
          entityId: data.id,
          summary: `Created service "${data.title}"`,
        },
        sbAccessToken,
      );
      return data as LogisticsService;
    }
  }

  const db = readLocalDb();
  if (service.id) {
    const idx = db.services.findIndex((s) => s.id === service.id);
    if (idx === -1) throw new Error('Service not found');
    db.services[idx] = { ...db.services[idx], ...service, updated_at: now };
    writeLocalDb(db);
    await recordAuditLog({
      actorEmail,
      action: 'service_updated',
      entityType: 'services',
      entityId: db.services[idx].id,
      summary: `Updated service "${db.services[idx].title}" (${db.services[idx].status})`,
    });
    return db.services[idx];
  }

  const created: LogisticsService = {
    id: crypto.randomUUID(),
    slug: service.slug || `service-${Date.now()}`,
    title: service.title || 'New Service',
    short_description: service.short_description || '',
    full_description: service.full_description || '',
    suitable_for: service.suitable_for || '',
    quote_requirements: service.quote_requirements || '',
    conditions: service.conditions || '',
    icon_name: service.icon_name || 'Package',
    media_id: service.media_id || null,
    image_url: service.image_url || null,
    image_alt: service.image_alt || '',
    sort_order: service.sort_order ?? db.services.length + 1,
    status: service.status || 'draft',
    show_on_home: service.show_on_home ?? false,
    updated_at: now,
  };
  db.services.push(created);
  writeLocalDb(db);
  await recordAuditLog({
    actorEmail,
    action: 'service_created',
    entityType: 'services',
    entityId: created.id,
    summary: `Created service "${created.title}"`,
  });
  return created;
}

export async function reorderServices(
  orderedIds: string[],
  actorEmail: string,
  sbAccessToken?: string,
): Promise<void> {
  const now = new Date().toISOString();
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin(sbAccessToken);
    await Promise.all(
      orderedIds.map((id, idx) =>
        sb.from('services').update({ sort_order: idx + 1, updated_at: now }).eq('id', id),
      ),
    );
    await recordAuditLog(
      {
        actorEmail,
        action: 'services_reordered',
        entityType: 'services',
        entityId: 'batch',
        summary: 'Reordered services display sequence',
      },
      sbAccessToken,
    );
    return;
  }

  const db = readLocalDb();
  orderedIds.forEach((id, idx) => {
    const svc = db.services.find((s) => s.id === id);
    if (svc) {
      svc.sort_order = idx + 1;
      svc.updated_at = now;
    }
  });
  writeLocalDb(db);
  await recordAuditLog({
    actorEmail,
    action: 'services_reordered',
    entityType: 'services',
    entityId: 'batch',
    summary: 'Reordered services display sequence',
  });
}

export async function saveServiceRate(
  rate: Partial<ServiceRate> & { id?: string },
  actorEmail: string,
  sbAccessToken?: string,
): Promise<ServiceRate> {
  const now = new Date().toISOString();
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin(sbAccessToken);
    if (rate.id) {
      const { data, error } = await sb
        .from('service_rates')
        .update({ ...rate, updated_at: now })
        .eq('id', rate.id)
        .select()
        .single();
      if (error || !data) throw new Error(error?.message || 'Failed to update rate');
      await recordAuditLog(
        {
          actorEmail,
          action: 'rate_updated',
          entityType: 'service_rates',
          entityId: data.id,
          summary: `Updated rate "${data.label}" (published: ${data.is_published})`,
        },
        sbAccessToken,
      );
      return data as ServiceRate;
    } else {
      const { data, error } = await sb
        .from('service_rates')
        .insert({ ...rate, updated_at: now })
        .select()
        .single();
      if (error || !data) throw new Error(error?.message || 'Failed to create rate');
      await recordAuditLog(
        {
          actorEmail,
          action: 'rate_created',
          entityType: 'service_rates',
          entityId: data.id,
          summary: `Created rate "${data.label}"`,
        },
        sbAccessToken,
      );
      return data as ServiceRate;
    }
  }

  const db = readLocalDb();
  if (rate.id) {
    const idx = db.rates.findIndex((r) => r.id === rate.id);
    if (idx === -1) throw new Error('Rate not found');
    db.rates[idx] = { ...db.rates[idx], ...rate, updated_at: now };
    writeLocalDb(db);
    await recordAuditLog({
      actorEmail,
      action: 'rate_updated',
      entityType: 'service_rates',
      entityId: db.rates[idx].id,
      summary: `Updated rate "${db.rates[idx].label}" (published: ${db.rates[idx].is_published})`,
    });
    return db.rates[idx];
  }
  const created: ServiceRate = {
    id: crypto.randomUUID(),
    service_id: rate.service_id || '',
    label: rate.label || 'Standard Rate',
    amount_display: rate.amount_display || '',
    currency: rate.currency || 'USD',
    unit: rate.unit || '',
    estimated_transit: rate.estimated_transit || '',
    conditions: rate.conditions || '',
    effective_date: rate.effective_date || '',
    is_published: Boolean(rate.is_published),
    internal_note: rate.internal_note || '',
    updated_at: now,
  };
  db.rates.push(created);
  writeLocalDb(db);
  await recordAuditLog({
    actorEmail,
    action: 'rate_created',
    entityType: 'service_rates',
    entityId: created.id,
    summary: `Created rate "${created.label}"`,
  });
  return created;
}

export async function saveCargoCategory(
  category: Partial<CargoCategory> & { id?: string },
  actorEmail: string,
  sbAccessToken?: string,
): Promise<CargoCategory> {
  const now = new Date().toISOString();
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin(sbAccessToken);
    if (category.id) {
      const { data, error } = await sb
        .from('cargo_categories')
        .update({ ...category, updated_at: now })
        .eq('id', category.id)
        .select()
        .single();
      if (error || !data) throw new Error(error?.message || 'Failed to update category');
      await recordAuditLog(
        {
          actorEmail,
          action: 'category_updated',
          entityType: 'cargo_categories',
          entityId: data.id,
          summary: `Updated cargo category "${data.name}"`,
        },
        sbAccessToken,
      );
      return data as CargoCategory;
    } else {
      const { data, error } = await sb
        .from('cargo_categories')
        .insert({ ...category, updated_at: now })
        .select()
        .single();
      if (error || !data) throw new Error(error?.message || 'Failed to create category');
      await recordAuditLog(
        {
          actorEmail,
          action: 'category_created',
          entityType: 'cargo_categories',
          entityId: data.id,
          summary: `Created cargo category "${data.name}"`,
        },
        sbAccessToken,
      );
      return data as CargoCategory;
    }
  }

  const db = readLocalDb();
  if (category.id) {
    const idx = db.categories.findIndex((c) => c.id === category.id);
    if (idx === -1) throw new Error('Cargo category not found');
    db.categories[idx] = { ...db.categories[idx], ...category, updated_at: now };
    writeLocalDb(db);
    await recordAuditLog({
      actorEmail,
      action: 'category_updated',
      entityType: 'cargo_categories',
      entityId: db.categories[idx].id,
      summary: `Updated cargo category "${db.categories[idx].name}"`,
    });
    return db.categories[idx];
  }
  const created: CargoCategory = {
    id: crypto.randomUUID(),
    slug: category.slug || `category-${Date.now()}`,
    name: category.name || 'New Category',
    description: category.description || '',
    restricted_notice: category.restricted_notice || '',
    media_id: category.media_id || null,
    image_url: category.image_url || null,
    image_alt: category.image_alt || '',
    sort_order: category.sort_order ?? db.categories.length + 1,
    is_published: category.is_published ?? true,
    updated_at: now,
  };
  db.categories.push(created);
  writeLocalDb(db);
  await recordAuditLog({
    actorEmail,
    action: 'category_created',
    entityType: 'cargo_categories',
    entityId: created.id,
    summary: `Created cargo category "${created.name}"`,
  });
  return created;
}

export async function reorderCategories(
  orderedIds: string[],
  actorEmail: string,
  sbAccessToken?: string,
): Promise<void> {
  const now = new Date().toISOString();
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin(sbAccessToken);
    await Promise.all(
      orderedIds.map((id, idx) =>
        sb.from('cargo_categories').update({ sort_order: idx + 1, updated_at: now }).eq('id', id),
      ),
    );
    await recordAuditLog(
      {
        actorEmail,
        action: 'categories_reordered',
        entityType: 'cargo_categories',
        entityId: 'batch',
        summary: 'Reordered cargo categories',
      },
      sbAccessToken,
    );
    return;
  }

  const db = readLocalDb();
  orderedIds.forEach((id, idx) => {
    const cat = db.categories.find((c) => c.id === id);
    if (cat) {
      cat.sort_order = idx + 1;
      cat.updated_at = now;
    }
  });
  writeLocalDb(db);
  await recordAuditLog({
    actorEmail,
    action: 'categories_reordered',
    entityType: 'cargo_categories',
    entityId: 'batch',
    summary: 'Reordered cargo categories',
  });
}

export async function saveFaq(
  faq: Partial<FAQItem> & { id?: string },
  actorEmail: string,
  sbAccessToken?: string,
): Promise<FAQItem> {
  const now = new Date().toISOString();
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin(sbAccessToken);
    if (faq.id) {
      const { data, error } = await sb
        .from('faqs')
        .update({ ...faq, updated_at: now })
        .eq('id', faq.id)
        .select()
        .single();
      if (error || !data) throw new Error(error?.message || 'Failed to update FAQ');
      await recordAuditLog(
        {
          actorEmail,
          action: 'faq_updated',
          entityType: 'faqs',
          entityId: data.id,
          summary: `Updated FAQ: "${data.question.slice(0, 50)}"`,
        },
        sbAccessToken,
      );
      return data as FAQItem;
    } else {
      const { data, error } = await sb
        .from('faqs')
        .insert({ ...faq, updated_at: now })
        .select()
        .single();
      if (error || !data) throw new Error(error?.message || 'Failed to create FAQ');
      await recordAuditLog(
        {
          actorEmail,
          action: 'faq_created',
          entityType: 'faqs',
          entityId: data.id,
          summary: `Created FAQ: "${data.question.slice(0, 50)}"`,
        },
        sbAccessToken,
      );
      return data as FAQItem;
    }
  }

  const db = readLocalDb();
  if (faq.id) {
    const idx = db.faqs.findIndex((f) => f.id === faq.id);
    if (idx === -1) throw new Error('FAQ not found');
    db.faqs[idx] = { ...db.faqs[idx], ...faq, updated_at: now };
    writeLocalDb(db);
    await recordAuditLog({
      actorEmail,
      action: 'faq_updated',
      entityType: 'faqs',
      entityId: db.faqs[idx].id,
      summary: `Updated FAQ: "${db.faqs[idx].question.slice(0, 50)}"`,
    });
    return db.faqs[idx];
  }
  const created: FAQItem = {
    id: crypto.randomUUID(),
    question: faq.question || '',
    answer: faq.answer || '',
    sort_order: faq.sort_order ?? db.faqs.length + 1,
    is_published: faq.is_published ?? true,
    updated_at: now,
  };
  db.faqs.push(created);
  writeLocalDb(db);
  await recordAuditLog({
    actorEmail,
    action: 'faq_created',
    entityType: 'faqs',
    entityId: created.id,
    summary: `Created FAQ: "${created.question.slice(0, 50)}"`,
  });
  return created;
}

export async function deleteFaq(id: string, actorEmail: string, sbAccessToken?: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin(sbAccessToken);
    const { error } = await sb.from('faqs').delete().eq('id', id);
    if (error) throw new Error(error.message);
  } else {
    const db = readLocalDb();
    db.faqs = db.faqs.filter((f) => f.id !== id);
    writeLocalDb(db);
  }
  await recordAuditLog(
    {
      actorEmail,
      action: 'faq_deleted',
      entityType: 'faqs',
      entityId: id,
      summary: 'Deleted FAQ item',
    },
    sbAccessToken,
  );
}

export async function updateEnquiryStatus(
  id: string,
  status: EnquiryStatus,
  actorEmail: string,
  sbAccessToken?: string,
): Promise<ShipmentEnquiry> {
  const now = new Date().toISOString();
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin(sbAccessToken);
    const { data, error } = await sb
      .from('enquiries')
      .update({ status, updated_at: now })
      .eq('id', id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || 'Failed to update enquiry status');
    await recordAuditLog(
      {
        actorEmail,
        action: 'enquiry_status_updated',
        entityType: 'enquiries',
        entityId: id,
        summary: `Changed enquiry ${data.reference_code} status to ${status}`,
      },
      sbAccessToken,
    );
    return data as ShipmentEnquiry;
  }

  const db = readLocalDb();
  const item = db.enquiries.find((e) => e.id === id);
  if (!item) throw new Error('Enquiry not found');
  item.status = status;
  item.updated_at = now;
  writeLocalDb(db);
  await recordAuditLog({
    actorEmail,
    action: 'enquiry_status_updated',
    entityType: 'enquiries',
    entityId: id,
    summary: `Changed enquiry ${item.reference_code} status to ${status}`,
  });
  return item;
}

export async function addEnquiryNote(
  enquiryId: string,
  note: string,
  actorEmail: string,
  sbAccessToken?: string,
): Promise<EnquiryNote> {
  const now = new Date().toISOString();
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin(sbAccessToken);
    const { data, error } = await sb
      .from('enquiry_notes')
      .insert({ enquiry_id: enquiryId, author_email: actorEmail, note })
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || 'Failed to save internal note');
    await recordAuditLog(
      {
        actorEmail,
        action: 'enquiry_note_added',
        entityType: 'enquiry_notes',
        entityId: enquiryId,
        summary: `Added private internal note on enquiry ${enquiryId}`,
      },
      sbAccessToken,
    );
    return data as EnquiryNote;
  }

  const db = readLocalDb();
  const created: EnquiryNote = {
    id: crypto.randomUUID(),
    enquiry_id: enquiryId,
    author_email: actorEmail,
    note,
    created_at: now,
  };
  db.enquiry_notes.unshift(created);
  writeLocalDb(db);
  await recordAuditLog({
    actorEmail,
    action: 'enquiry_note_added',
    entityType: 'enquiry_notes',
    entityId: enquiryId,
    summary: `Added private internal note on enquiry ${enquiryId}`,
  });
  return created;
}

export async function uploadMediaAsset(input: {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  altText: string;
  sourceCredit: string;
  licenceInfo: string;
  actorEmail: string;
  sbAccessToken?: string;
}): Promise<MediaAsset> {
  const ext =
    input.mimeType === 'image/png'
      ? 'png'
      : input.mimeType === 'image/webp'
        ? 'webp'
        : input.mimeType === 'image/svg+xml'
          ? 'svg'
          : 'jpg';
  const safeBase = input.fileName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40) || 'asset';
  const storedName = `${safeBase}_${Date.now()}.${ext}`;
  const now = new Date().toISOString();

  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin(input.sbAccessToken);
    const storagePath = `uploads/${storedName}`;
    const { error: upErr } = await sb.storage
      .from('public-media')
      .upload(storagePath, input.buffer, { contentType: input.mimeType, upsert: false });
    if (upErr) throw new Error(`Supabase Storage upload failed: ${upErr.message}`);

    const { data: pubUrl } = sb.storage.from('public-media').getPublicUrl(storagePath);
    const { data: row, error: dbErr } = await sb
      .from('media_assets')
      .insert({
        file_name: storedName,
        storage_path: storagePath,
        url: pubUrl.publicUrl,
        alt_text: input.altText,
        source_credit: input.sourceCredit,
        licence_info: input.licenceInfo,
        mime_type: input.mimeType,
        size_bytes: input.buffer.length,
      })
      .select()
      .single();
    if (dbErr || !row) throw new Error(dbErr?.message || 'Failed to save media record');
    await recordAuditLog(
      {
        actorEmail: input.actorEmail,
        action: 'media_uploaded',
        entityType: 'media_assets',
        entityId: row.id,
        summary: `Uploaded image "${storedName}"`,
      },
      input.sbAccessToken,
    );
    return row as MediaAsset;
  }

  ensureDirs();
  fs.writeFileSync(path.join(UPLOADS_DIR, storedName), input.buffer);
  const asset: MediaAsset = {
    id: crypto.randomUUID(),
    file_name: storedName,
    url: `/uploads/${storedName}`,
    alt_text: input.altText,
    source_credit: input.sourceCredit,
    licence_info: input.licenceInfo,
    mime_type: input.mimeType,
    size_bytes: input.buffer.length,
    created_at: now,
  };
  const db = readLocalDb();
  db.media.unshift(asset);
  writeLocalDb(db);
  await recordAuditLog({
    actorEmail: input.actorEmail,
    action: 'media_uploaded',
    entityType: 'media_assets',
    entityId: asset.id,
    summary: `Uploaded image "${storedName}"`,
  });
  return asset;
}

export async function updateMediaAsset(
  id: string,
  patch: Partial<Pick<MediaAsset, 'alt_text' | 'source_credit' | 'licence_info'>>,
  actorEmail: string,
  sbAccessToken?: string,
): Promise<MediaAsset> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin(sbAccessToken);
    const { data, error } = await sb
      .from('media_assets')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || 'Failed to update media asset');
    await recordAuditLog(
      {
        actorEmail,
        action: 'media_updated',
        entityType: 'media_assets',
        entityId: id,
        summary: `Updated media metadata for ${data.file_name}`,
      },
      sbAccessToken,
    );
    return data as MediaAsset;
  }

  const db = readLocalDb();
  const item = db.media.find((m) => m.id === id);
  if (!item) throw new Error('Media asset not found');
  Object.assign(item, patch);
  writeLocalDb(db);
  await recordAuditLog({
    actorEmail,
    action: 'media_updated',
    entityType: 'media_assets',
    entityId: id,
    summary: `Updated media metadata for ${item.file_name}`,
  });
  return item;
}

export async function deleteMediaAsset(id: string, actorEmail: string, sbAccessToken?: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin(sbAccessToken);
    const { data: item } = await sb.from('media_assets').select('*').eq('id', id).single();
    if (item?.storage_path) {
      await sb.storage.from('public-media').remove([item.storage_path]);
    }
    const { error } = await sb.from('media_assets').delete().eq('id', id);
    if (error) throw new Error(error.message);
  } else {
    const db = readLocalDb();
    const item = db.media.find((m) => m.id === id);
    if (item && item.url.startsWith('/uploads/')) {
      const target = path.join(UPLOADS_DIR, path.basename(item.url));
      if (fs.existsSync(target)) fs.unlinkSync(target);
    }
    db.media = db.media.filter((m) => m.id !== id);
    writeLocalDb(db);
  }
  await recordAuditLog(
    {
      actorEmail,
      action: 'media_deleted',
      entityType: 'media_assets',
      entityId: id,
      summary: `Deleted media asset ${id}`,
    },
    sbAccessToken,
  );
}

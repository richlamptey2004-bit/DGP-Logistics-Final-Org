import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import type { EnquiryStatus, OfficePreference } from './src/types/logistics';
import {
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  checkRateLimit,
  clearSessionCookie,
  createSessionToken,
  formatSessionCookie,
  generateEnquiryReference,
  getSessionCookieName,
  parseCookies,
  sanitizeText,
  validatePasswordStrength,
  verifySessionToken,
} from './server/security';
import {
  addEnquiryNote,
  authenticateAdmin,
  authenticateAdminByPassword,
  changeAdminPassword,
  createOrGetEnquiry,
  deleteFaq,
  deleteMediaAsset,
  getAdminCount,
  getAdminDashboardData,
  getAdminUserById,
  getPublicBootstrap,
  getStorageMode,
  getUploadsDir,
  provisionOwnerAccount,
  recordAuditLog,
  reorderCategories,
  reorderServices,
  saveCargoCategory,
  saveFaq,
  saveService,
  saveServiceRate,
  updateEditablePage,
  updateEnquiryStatus,
  updateMediaAsset,
  updateSiteSettings,
  uploadMediaAsset,
} from './server/store';

interface AuthenticatedRequest extends Request {
  adminUser?: {
    id: string;
    email: string;
    full_name: string;
    role: 'owner' | 'admin';
    must_change_password: boolean;
  };
  sbAccessToken?: string;
}

function getClientIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim();
  return req.socket.remoteAddress || 'unknown';
}

async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[getSessionCookieName()];
    const payload = verifySessionToken(token);
    if (!payload) {
      res.status(401).json({ error: 'Administrator sign-in required.' });
      return;
    }
    const admin = await getAdminUserById(payload.userId, payload.sbAccessToken);
    if (!admin) {
      res.status(401).json({ error: 'Administrator session is invalid or inactive.' });
      return;
    }
    req.adminUser = admin;
    req.sbAccessToken = payload.sbAccessToken;
    next();
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Authentication check failed.' });
  }
}

function escapeCsvCell(val: unknown): string {
  const str = String(val ?? '').replace(/\r?\n/g, ' ');
  if (str.includes(',') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);
  const isProd = process.env.NODE_ENV === 'production';

  app.disable('x-powered-by');
  app.use(express.json({ limit: '8mb' }));

  // Serve uploaded local media safely
  app.get('/uploads/:filename', (req, res) => {
    const safeName = path.basename(req.params.filename);
    const fullPath = path.join(getUploadsDir(), safeName);
    if (!fs.existsSync(fullPath)) {
      res.status(404).send('Not found');
      return;
    }
    res.sendFile(fullPath);
  });

  // SEO robots.txt
  app.get('/robots.txt', (req, res) => {
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.VITE_SITE_URL ||
      process.env.APP_URL ||
      `${req.protocol}://${req.get('host')}`;
    const cleanOrigin = origin.replace(/\/+$/, '');
    res.type('text/plain').send(
      [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin',
        'Disallow: /admin/',
        'Disallow: /api/',
        `Sitemap: ${cleanOrigin}/sitemap.xml`,
      ].join('\n'),
    );
  });

  // SEO dynamic sitemap.xml
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const origin =
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.VITE_SITE_URL ||
        process.env.APP_URL ||
        `${req.protocol}://${req.get('host')}`;
      const cleanOrigin = origin.replace(/\/+$/, '');
      const data = await getPublicBootstrap();
      const staticRoutes = ['', '/about', '/services', '/what-we-ship', '/contact', '/request-quote', '/privacy'];
      const serviceRoutes = data.services.map((s) => `/services/${s.slug}`);
      const allUrls = [...staticRoutes, ...serviceRoutes];

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (route) => `  <url>
    <loc>${cleanOrigin}${route || '/'}</loc>
    <changefreq>weekly</changefreq>
  </url>`,
  )
  .join('\n')}
</urlset>`;
      res.type('application/xml').send(xml);
    } catch {
      res.status(500).type('text/plain').send('Failed to generate sitemap');
    }
  });

  // ---------- PUBLIC API ----------

  app.get('/api/public/bootstrap', async (_req, res) => {
    try {
      const payload = await getPublicBootstrap();
      res.json(payload);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Unable to load website configuration.',
      });
    }
  });

  app.post('/api/enquiries', async (req, res) => {
    try {
      const ip = getClientIp(req);
      const limit = checkRateLimit(`enquiry:${ip}`, 10, 10 * 60 * 1000);
      if (!limit.allowed) {
        res.status(429).json({
          error: `Too many enquiry submissions from this connection. Please wait ${limit.retryAfterSec} seconds or contact us directly on WhatsApp.`,
        });
        return;
      }

      const body = req.body || {};

      // Spam protection: honeypot field + minimum render dwell check (1.5s)
      if (typeof body.company_website === 'string' && body.company_website.trim().length > 0) {
        res.status(400).json({ error: 'Submission could not be verified.' });
        return;
      }
      if (typeof body.form_started_at === 'number' && Date.now() - body.form_started_at < 1200) {
        res.status(400).json({ error: 'Please review your shipment details before submitting.' });
        return;
      }

      const full_name = sanitizeText(body.full_name, 140);
      const phone_whatsapp = sanitizeText(body.phone_whatsapp, 50);
      const email = sanitizeText(body.email, 160);
      const destination_city = sanitizeText(body.destination_city, 120);
      const delivery_area = sanitizeText(body.delivery_area, 180);
      const service_slug = sanitizeText(body.service_slug, 100) || 'not-sure';
      const service_name = sanitizeText(body.service_name, 140) || 'Not sure';
      const cargo_category_slug = sanitizeText(body.cargo_category_slug, 100);
      const cargo_category_name = sanitizeText(body.cargo_category_name, 140);
      const goods_description = sanitizeText(body.goods_description, 1500);
      const quantity = sanitizeText(body.quantity, 80) || 'Not sure';
      const estimated_weight_kg = sanitizeText(body.estimated_weight_kg, 80) || 'Not sure';
      const dimensions_cm = sanitizeText(body.dimensions_cm, 120) || 'Not sure';
      const estimated_volume_cbm = sanitizeText(body.estimated_volume_cbm, 80) || 'Not sure';
      const china_location = sanitizeText(body.china_location, 180);
      const preferred_shipping_method = sanitizeText(body.preferred_shipping_method, 80) || 'Not sure';
      const door_to_door_required = Boolean(body.door_to_door_required);
      const preferred_office: OfficePreference = body.preferred_office === 'China' ? 'China' : 'Ghana';
      const additional_notes = sanitizeText(body.additional_notes, 1000);
      const consent_accepted = body.consent_accepted === true;
      const client_submission_id =
        sanitizeText(body.client_submission_id, 100) || generateEnquiryReference();

      // Validation
      if (full_name.length < 2) {
        res.status(400).json({ error: 'Please enter your full name.' });
        return;
      }
      if (phone_whatsapp.replace(/[^0-9+]/g, '').length < 7) {
        res.status(400).json({ error: 'Please enter a valid phone or WhatsApp number.' });
        return;
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.status(400).json({ error: 'Please enter a valid email address or leave it blank.' });
        return;
      }
      if (destination_city.length < 2) {
        res.status(400).json({ error: 'Please enter your Ghana destination city or town.' });
        return;
      }
      if (goods_description.length < 3) {
        res.status(400).json({ error: 'Please describe the goods you want to ship.' });
        return;
      }
      if (!consent_accepted) {
        res.status(400).json({
          error: 'Please accept the consent notice to process your enquiry and continue on WhatsApp.',
        });
        return;
      }

      const pub = await getPublicBootstrap();
      const reference_code = generateEnquiryReference();

      const whatsapp_message = buildWhatsAppMessage({
        referenceCode: reference_code,
        fullName: full_name,
        phoneWhatsapp: phone_whatsapp,
        serviceName: service_name,
        cargoCategoryName: cargo_category_name,
        goodsDescription: goods_description,
        quantity,
        estimatedWeightKg: estimated_weight_kg,
        dimensionsCm: dimensions_cm,
        estimatedVolumeCbm: estimated_volume_cbm,
        chinaLocation: china_location,
        destinationCity: destination_city,
        deliveryArea: delivery_area,
        doorToDoorRequired: door_to_door_required,
        additionalNotes: additional_notes,
      });

      const whatsapp_url = buildWhatsAppUrl(
        preferred_office,
        pub.settings.ghana_whatsapp,
        pub.settings.china_whatsapp,
        whatsapp_message,
      );

      const { enquiry, deduplicated } = await createOrGetEnquiry({
        reference_code,
        client_submission_id,
        full_name,
        phone_whatsapp,
        email,
        destination_city,
        delivery_area,
        service_slug,
        service_name,
        cargo_category_slug,
        cargo_category_name,
        goods_description,
        quantity,
        estimated_weight_kg,
        dimensions_cm,
        estimated_volume_cbm,
        china_location,
        preferred_shipping_method,
        door_to_door_required,
        preferred_office,
        additional_notes,
        consent_accepted: true,
        whatsapp_message,
        whatsapp_url,
      });

      res.status(deduplicated ? 200 : 201).json({
        enquiry: {
          reference_code: enquiry.reference_code,
          preferred_office: enquiry.preferred_office,
          whatsapp_message: enquiry.whatsapp_message,
          whatsapp_url: enquiry.whatsapp_url,
        },
        deduplicated,
      });
    } catch (err) {
      res.status(500).json({
        error:
          err instanceof Error
            ? err.message
            : 'Unable to save your enquiry at the moment. Please use the direct WhatsApp button below.',
      });
    }
  });

  // ---------- ADMIN AUTH API ----------

  app.get('/api/admin/session', async (req: AuthenticatedRequest, res) => {
    try {
      res.setHeader('Cache-Control', 'no-store, private');
      const adminCount = await getAdminCount();
      const cookies = parseCookies(req.headers.cookie);
      const token = cookies[getSessionCookieName()];
      const payload = verifySessionToken(token);
      if (!payload) {
        res.json({ authenticated: false, needsOwnerSetup: adminCount === 0, storageMode: getStorageMode() });
        return;
      }
      const admin = await getAdminUserById(payload.userId, payload.sbAccessToken);
      if (!admin) {
        res.json({ authenticated: false, needsOwnerSetup: adminCount === 0, storageMode: getStorageMode() });
        return;
      }
      res.json({
        authenticated: true,
        needsOwnerSetup: false,
        user: admin,
        storageMode: getStorageMode(),
      });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Session check failed.' });
    }
  });

  app.post('/api/admin/setup-owner', async (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-store, private');
      const ip = getClientIp(req);
      const limit = checkRateLimit(`setup:${ip}`, 8, 15 * 60 * 1000);
      if (!limit.allowed) {
        res.status(429).json({ error: 'Too many setup attempts. Please wait and try again.' });
        return;
      }

      const emailInput = sanitizeText(req.body?.email, 160).toLowerCase();
      const email = emailInput || 'owner@dgplogistics.local';
      const fullName = sanitizeText(req.body?.fullName, 120) || 'DGP LOGISTICS Owner';
      const password = typeof req.body?.password === 'string' ? req.body.password : '';

      if (emailInput && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
        res.status(400).json({ error: 'Please enter a valid owner email address or leave blank.' });
        return;
      }

      const pwCheck = validatePasswordStrength(password);
      if (!pwCheck.valid) {
        res.status(400).json({ error: pwCheck.reason });
        return;
      }

      const owner = await provisionOwnerAccount({ email, fullName, password });
      const token = createSessionToken({ userId: owner.id, email: owner.email, role: owner.role });
      res.setHeader('Set-Cookie', formatSessionCookie(token));
      res.status(201).json({ user: owner });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Owner provisioning failed.' });
    }
  });

  app.post('/api/admin/login', async (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-store, private');
      const ip = getClientIp(req);
      const limit = checkRateLimit(`login:${ip}`, 10, 10 * 60 * 1000);
      if (!limit.allowed) {
        res.status(429).json({
          error: `Too many sign-in attempts. Wait ${limit.retryAfterSec} seconds and try again.`,
        });
        return;
      }

      const email = sanitizeText(req.body?.email, 160).toLowerCase();
      const password = typeof req.body?.password === 'string' ? req.body.password : '';

      if (!password) {
        res.status(400).json({ error: 'Administrator password is required.' });
        return;
      }

      const admin = email
        ? await authenticateAdmin(email, password)
        : await authenticateAdminByPassword(password);
      if (!admin) {
        res.status(401).json({ error: 'Incorrect administrator password.' });
        return;
      }

      const { sbAccessToken, ...publicAdmin } = admin;

      await recordAuditLog(
        {
          actorEmail: admin.email,
          action: 'admin_login',
          entityType: 'admin_users',
          entityId: admin.id,
          summary: 'Administrator signed in',
        },
        sbAccessToken,
      );

      const token = createSessionToken({
        userId: admin.id,
        email: admin.email,
        role: admin.role,
        sbAccessToken,
      });
      res.setHeader('Set-Cookie', formatSessionCookie(token));
      res.json({ user: publicAdmin });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Sign-in failed.' });
    }
  });

  app.post('/api/admin/logout', async (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    const payload = verifySessionToken(cookies[getSessionCookieName()]);
    if (payload) {
      await recordAuditLog(
        {
          actorEmail: payload.email,
          action: 'admin_logout',
          entityType: 'admin_users',
          entityId: payload.userId,
          summary: 'Administrator signed out',
        },
        payload.sbAccessToken,
      ).catch(() => undefined);
    }
    res.setHeader('Set-Cookie', clearSessionCookie());
    res.json({ ok: true });
  });

  app.post('/api/admin/password-recovery', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, private');
    const email = sanitizeText(req.body?.email, 160).toLowerCase();
    if (!email) {
      res.status(400).json({ error: 'Please enter the administrator email address.' });
      return;
    }
    res.json({
      message:
        getStorageMode() === 'supabase'
          ? 'If this email belongs to an active administrator in Supabase Auth, check your inbox or use the Supabase Auth dashboard to send a password reset link.'
          : 'In local preview storage without Supabase email SMTP configured, ask a server administrator to reset credentials via scripts/provision-owner.ts or connect Supabase Auth in production.',
    });
  });

  // ---------- PROTECTED ADMIN ROUTES ----------

  app.use('/api/admin', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, private');
    if (
      req.path === '/session' ||
      req.path === '/login' ||
      req.path === '/logout' ||
      req.path === '/setup-owner' ||
      req.path === '/password-recovery'
    ) {
      next();
      return;
    }
    void requireAdmin(req as AuthenticatedRequest, res, next);
  });

  app.get('/api/admin/dashboard', async (req: AuthenticatedRequest, res) => {
    try {
      const data = await getAdminDashboardData(req.sbAccessToken);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to load dashboard data.' });
    }
  });

  app.post('/api/admin/change-password', async (req: AuthenticatedRequest, res) => {
    try {
      const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
      const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
      const check = validatePasswordStrength(newPassword);
      if (!check.valid) {
        res.status(400).json({ error: check.reason });
        return;
      }
      const result = await changeAdminPassword(
        req.adminUser!.id,
        currentPassword,
        newPassword,
        req.sbAccessToken,
      );
      if (!result.ok) {
        res.status(400).json({ error: result.error });
        return;
      }
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Password change failed.' });
    }
  });

  app.patch('/api/admin/settings', async (req: AuthenticatedRequest, res) => {
    try {
      const allowed = req.body || {};
      const updated = await updateSiteSettings(allowed, req.adminUser!.email, req.sbAccessToken);
      res.json({ settings: updated });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to update settings.' });
    }
  });

  app.patch('/api/admin/pages/:slug', async (req: AuthenticatedRequest, res) => {
    try {
      const updated = await updateEditablePage(
        req.params.slug,
        req.body || {},
        req.adminUser!.email,
        req.sbAccessToken,
      );
      res.json({ page: updated });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to update page.' });
    }
  });

  app.post('/api/admin/services', async (req: AuthenticatedRequest, res) => {
    try {
      const saved = await saveService(req.body || {}, req.adminUser!.email, req.sbAccessToken);
      res.status(201).json({ service: saved });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to create service.' });
    }
  });

  app.patch('/api/admin/services/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const saved = await saveService(
        { ...req.body, id: req.params.id },
        req.adminUser!.email,
        req.sbAccessToken,
      );
      res.json({ service: saved });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to update service.' });
    }
  });

  app.post('/api/admin/services/reorder', async (req: AuthenticatedRequest, res) => {
    try {
      const ids = Array.isArray(req.body?.orderedIds) ? req.body.orderedIds : [];
      await reorderServices(ids, req.adminUser!.email, req.sbAccessToken);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to reorder services.' });
    }
  });

  app.post('/api/admin/rates', async (req: AuthenticatedRequest, res) => {
    try {
      const saved = await saveServiceRate(req.body || {}, req.adminUser!.email, req.sbAccessToken);
      res.status(201).json({ rate: saved });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to create rate.' });
    }
  });

  app.patch('/api/admin/rates/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const saved = await saveServiceRate(
        { ...req.body, id: req.params.id },
        req.adminUser!.email,
        req.sbAccessToken,
      );
      res.json({ rate: saved });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to update rate.' });
    }
  });

  app.post('/api/admin/categories', async (req: AuthenticatedRequest, res) => {
    try {
      const saved = await saveCargoCategory(req.body || {}, req.adminUser!.email, req.sbAccessToken);
      res.status(201).json({ category: saved });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to create category.' });
    }
  });

  app.patch('/api/admin/categories/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const saved = await saveCargoCategory(
        { ...req.body, id: req.params.id },
        req.adminUser!.email,
        req.sbAccessToken,
      );
      res.json({ category: saved });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to update category.' });
    }
  });

  app.post('/api/admin/categories/reorder', async (req: AuthenticatedRequest, res) => {
    try {
      const ids = Array.isArray(req.body?.orderedIds) ? req.body.orderedIds : [];
      await reorderCategories(ids, req.adminUser!.email, req.sbAccessToken);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to reorder categories.' });
    }
  });

  app.post('/api/admin/faqs', async (req: AuthenticatedRequest, res) => {
    try {
      const saved = await saveFaq(req.body || {}, req.adminUser!.email, req.sbAccessToken);
      res.status(201).json({ faq: saved });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to save FAQ.' });
    }
  });

  app.patch('/api/admin/faqs/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const saved = await saveFaq(
        { ...req.body, id: req.params.id },
        req.adminUser!.email,
        req.sbAccessToken,
      );
      res.json({ faq: saved });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to update FAQ.' });
    }
  });

  app.delete('/api/admin/faqs/:id', async (req: AuthenticatedRequest, res) => {
    try {
      await deleteFaq(req.params.id, req.adminUser!.email, req.sbAccessToken);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to delete FAQ.' });
    }
  });

  app.patch('/api/admin/enquiries/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const validStatuses: EnquiryStatus[] = ['New', 'Contacted', 'Quoted', 'Booked', 'Closed'];
      const status = req.body?.status as EnquiryStatus;
      if (!validStatuses.includes(status)) {
        res.status(400).json({ error: 'Invalid enquiry status.' });
        return;
      }
      const updated = await updateEnquiryStatus(
        req.params.id,
        status,
        req.adminUser!.email,
        req.sbAccessToken,
      );
      res.json({ enquiry: updated });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to update enquiry.' });
    }
  });

  app.post('/api/admin/enquiries/:id/notes', async (req: AuthenticatedRequest, res) => {
    try {
      const note = sanitizeText(req.body?.note, 1500);
      if (!note) {
        res.status(400).json({ error: 'Please write a note before saving.' });
        return;
      }
      const created = await addEnquiryNote(
        req.params.id,
        note,
        req.adminUser!.email,
        req.sbAccessToken,
      );
      res.status(201).json({ note: created });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to save internal note.' });
    }
  });

  app.get('/api/admin/enquiries/export.csv', async (req: AuthenticatedRequest, res) => {
    try {
      const data = await getAdminDashboardData(req.sbAccessToken);
      const headers = [
        'Reference',
        'Status',
        'Created At',
        'Full Name',
        'Phone/WhatsApp',
        'Email',
        'Service',
        'Cargo Category',
        'Goods Description',
        'Quantity',
        'Weight (kg)',
        'Dimensions (cm)',
        'Volume (CBM)',
        'China Location',
        'Destination City',
        'Delivery Area',
        'Door-to-Door',
        'Preferred Office',
        'Additional Notes',
      ];
      const rows = data.enquiries.map((e) =>
        [
          e.reference_code,
          e.status,
          e.created_at,
          e.full_name,
          e.phone_whatsapp,
          e.email,
          e.service_name,
          e.cargo_category_name,
          e.goods_description,
          e.quantity,
          e.estimated_weight_kg,
          e.dimensions_cm,
          e.estimated_volume_cbm,
          e.china_location,
          e.destination_city,
          e.delivery_area,
          e.door_to_door_required ? 'Yes' : 'No',
          e.preferred_office,
          e.additional_notes,
        ]
          .map(escapeCsvCell)
          .join(','),
      );
      const csv = [headers.join(','), ...rows].join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="dgp-logistics-enquiries.csv"');
      res.send(csv);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to export CSV.' });
    }
  });

  app.post('/api/admin/media/upload', async (req: AuthenticatedRequest, res) => {
    try {
      const fileName = sanitizeText(req.body?.fileName, 120);
      const mimeType = sanitizeText(req.body?.mimeType, 60);
      const base64Data = typeof req.body?.base64Data === 'string' ? req.body.base64Data : '';
      const altText = sanitizeText(req.body?.altText, 240);
      const sourceCredit = sanitizeText(req.body?.sourceCredit, 240);
      const licenceInfo = sanitizeText(req.body?.licenceInfo, 240);

      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
      if (!allowedMimes.includes(mimeType)) {
        res.status(400).json({ error: 'Only JPEG, PNG, WebP, or SVG images are accepted.' });
        return;
      }
      if (!altText) {
        res.status(400).json({ error: 'Please provide descriptive alternative text for accessibility.' });
        return;
      }

      const rawBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
      const buffer = Buffer.from(rawBase64, 'base64');
      if (buffer.length === 0 || buffer.length > 5 * 1024 * 1024) {
        res.status(400).json({ error: 'Image must be non-empty and under 5 MB.' });
        return;
      }

      const asset = await uploadMediaAsset({
        fileName,
        mimeType,
        buffer,
        altText,
        sourceCredit,
        licenceInfo,
        actorEmail: req.adminUser!.email,
        sbAccessToken: req.sbAccessToken,
      });
      res.status(201).json({ asset });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to upload image.' });
    }
  });

  app.patch('/api/admin/media/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const asset = await updateMediaAsset(
        req.params.id,
        {
          alt_text: sanitizeText(req.body?.alt_text, 240),
          source_credit: sanitizeText(req.body?.source_credit, 240),
          licence_info: sanitizeText(req.body?.licence_info, 240),
        },
        req.adminUser!.email,
        req.sbAccessToken,
      );
      res.json({ asset });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to update media.' });
    }
  });

  app.delete('/api/admin/media/:id', async (req: AuthenticatedRequest, res) => {
    try {
      await deleteMediaAsset(req.params.id, req.adminUser!.email, req.sbAccessToken);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to delete media.' });
    }
  });

  // Unknown API endpoints return JSON 404
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  // Frontend Vite middleware (dev) or static dist serving (prod)
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DGP LOGISTICS server listening on http://localhost:${PORT} (storage: ${getStorageMode()})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

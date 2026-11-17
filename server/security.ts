import crypto from 'crypto';
import type { OfficePreference } from '../src/types/logistics';

const SESSION_COOKIE_NAME = 'dgp_admin_session';

// Fallback runtime secret if SESSION_SECRET env is not set during local dev;
// never exposes secrets to client and rotates if process restarts without env.
const RUNTIME_FALLBACK_SECRET = crypto.randomBytes(32).toString('hex');

function getSigningSecret(): string {
  return process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16
    ? process.env.SESSION_SECRET
    : RUNTIME_FALLBACK_SECRET;
}

export function validatePasswordStrength(password: string): { valid: boolean; reason?: string } {
  if (typeof password !== 'string' || password.length < 10) {
    return { valid: false, reason: 'Password must be at least 10 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: 'Password must include at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: 'Password must include at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: 'Password must include at least one number.' };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, reason: 'Password must include at least one special character (e.g. !@#$%).' };
  }
  return { valid: true };
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, originalHex] = parts;
  const derivedBuffer = crypto.scryptSync(password, salt, 64);
  const originalBuffer = Buffer.from(originalHex, 'hex');
  if (derivedBuffer.length !== originalBuffer.length) return false;
  return crypto.timingSafeEqual(derivedBuffer, originalBuffer);
}

export interface SessionPayload {
  userId: string;
  email: string;
  role: 'owner' | 'admin';
  sbAccessToken?: string;
  exp: number;
}

export function createSessionToken(payload: Omit<SessionPayload, 'exp'>, ttlHours = 12): string {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Date.now() + ttlHours * 60 * 60 * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(fullPayload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', getSigningSecret()).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', getSigningSecret()).update(encoded).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (!parsed.exp || Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  const result: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = decodeURIComponent(part.slice(idx + 1).trim());
    result[key] = val;
  }
  return result;
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

export function formatSessionCookie(token: string, maxAgeSeconds = 12 * 3600): string {
  const isProd = process.env.NODE_ENV === 'production';
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (isProd) parts.push('Secure');
  return parts.join('; ');
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

// Simple in-memory sliding-window rate limiter
const rateBuckets = new Map<string, number[]>();

export function checkRateLimit(key: string, maxRequests: number, windowMs: number): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const existing = rateBuckets.get(key) || [];
  const valid = existing.filter((ts) => now - ts < windowMs);
  if (valid.length >= maxRequests) {
    const oldest = valid[0] || now;
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
    rateBuckets.set(key, valid);
    return { allowed: false, retryAfterSec };
  }
  valid.push(now);
  rateBuckets.set(key, valid);
  return { allowed: true, retryAfterSec: 0 };
}

export function sanitizeText(value: unknown, maxLen = 1000): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

export function generateEnquiryReference(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `DGP-${y}${m}${d}-${suffix}`;
}

export function buildWhatsAppMessage(input: {
  referenceCode: string;
  fullName: string;
  phoneWhatsapp: string;
  serviceName: string;
  cargoCategoryName?: string;
  goodsDescription: string;
  quantity?: string;
  estimatedWeightKg?: string;
  dimensionsCm?: string;
  estimatedVolumeCbm?: string;
  chinaLocation?: string;
  destinationCity: string;
  deliveryArea?: string;
  doorToDoorRequired: boolean;
  additionalNotes?: string;
}): string {
  const lines = [
    'Hello DGP LOGISTICS,',
    '',
    'I would like a shipping quotation.',
    '',
    `Reference: ${input.referenceCode}`,
    `Name: ${input.fullName}`,
    `Phone: ${input.phoneWhatsapp}`,
    `Service: ${input.serviceName || 'Not sure'}`,
  ];
  if (input.cargoCategoryName) {
    lines.push(`Cargo category: ${input.cargoCategoryName}`);
  }
  lines.push(`Goods: ${input.goodsDescription}`);
  if (input.quantity && input.quantity !== 'Not sure') {
    lines.push(`Quantity: ${input.quantity}`);
  }
  if (input.estimatedWeightKg && input.estimatedWeightKg !== 'Not sure') {
    lines.push(`Estimated weight: ${input.estimatedWeightKg} kg`);
  }
  if (input.dimensionsCm && input.dimensionsCm !== 'Not sure') {
    lines.push(`Dimensions: ${input.dimensionsCm} cm`);
  }
  if (input.estimatedVolumeCbm && input.estimatedVolumeCbm !== 'Not sure') {
    lines.push(`Estimated volume: ${input.estimatedVolumeCbm} CBM`);
  }
  if (input.chinaLocation) {
    lines.push(`Goods location in China: ${input.chinaLocation}`);
  }
  const dest = input.deliveryArea ? `${input.destinationCity} (${input.deliveryArea})` : input.destinationCity;
  lines.push(`Destination: ${dest}`);
  lines.push(`Door-to-door delivery: ${input.doorToDoorRequired ? 'Yes' : 'No'}`);
  if (input.additionalNotes) {
    lines.push(`Additional details: ${input.additionalNotes}`);
  }
  lines.push('', 'Please confirm the available shipping options and quotation.');
  return lines.join('\n');
}

export function buildWhatsAppUrl(office: OfficePreference, ghanaNumber: string, chinaNumber: string, message: string): string {
  const raw = office === 'China' ? chinaNumber : ghanaNumber;
  const digits = raw.replace(/[^0-9]/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

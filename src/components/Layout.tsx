import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { LayoutDashboard, Menu, MessageCircle, X } from 'lucide-react';
import { useSiteData } from '../context/SiteDataContext';

function formatWaUrl(number: string, text?: string): string {
  const digits = number.replace(/[^0-9]/g, '');
  return text ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : `https://wa.me/${digits}`;
}

export function ContactStrip() {
  const { data } = useSiteData();
  const ghanaWa = data?.settings.ghana_whatsapp || '+233266663700';
  const chinaWa = data?.settings.china_whatsapp || '+8615820200000';

  return (
    <section className="bg-[#082B59] text-white border-t border-[#0F3B75]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-14 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
        <div className="max-w-xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Ready to send your goods?
          </h2>
          <p className="mt-2 text-base text-slate-200 leading-relaxed">
            Speak with our Ghana or China team about your shipment.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={formatWaUrl(ghanaWa, 'Hello DGP LOGISTICS Ghana team, I would like to enquire about shipping goods from China to Ghana.')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg bg-[#FFD43B] text-[#082B59] font-bold text-sm hover:bg-[#f5c418] transition-colors whitespace-nowrap shrink-0"
          >
            <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            WhatsApp Ghana
          </a>
          <a
            href={formatWaUrl(chinaWa, 'Hello DGP LOGISTICS China team, I would like to enquire about shipping goods from China to Ghana.')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg bg-white text-[#082B59] font-bold text-sm hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            WhatsApp China
          </a>
          <Link
            to="/request-quote"
            className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-lg border border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-colors whitespace-nowrap shrink-0"
          >
            Request quote
          </Link>
        </div>
      </div>
    </section>
  );
}

const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About us', end: false },
  { to: '/services', label: 'Services', end: false },
  { to: '/what-we-ship', label: 'What we ship', end: false },
  { to: '/contact', label: 'Contact', end: false },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { data, error, refresh } = useSiteData();
  const [mobileOpen, setMobileOpen] = useState(false);

  const businessName = data?.settings.business_name || 'DGP LOGISTICS';
  const logoUrl = data?.settings.logo_url;
  const logoAlt = data?.settings.logo_alt || businessName;
  const ghanaWa = data?.settings.ghana_whatsapp || '+233266663700';
  const chinaWa = data?.settings.china_whatsapp || '+8615820200000';
  const officePublished = Boolean(data?.settings.office_details_published);
  const confirmedGhanaOffice = data?.settings.confirmed_ghana_office;
  const confirmedChinaOffice = data?.settings.confirmed_china_office;

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#172536]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#082B59] focus:text-white focus:rounded-md focus:text-sm focus:font-semibold"
      >
        Skip to main content
      </a>

      {/* Clean 3-zone sticky header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          {/* Zone 1: Brand wordmark / custom logo */}
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0 text-[#082B59] font-extrabold text-lg tracking-tight"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={logoAlt}
                className="h-9 w-auto max-w-[160px] object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <>
                <span
                  aria-hidden="true"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-[#082B59] text-[#FFD43B] font-extrabold text-xs tracking-wider"
                >
                  DGP
                </span>
                <span>{businessName}</span>
              </>
            )}
          </Link>

          {/* Zone 2: Primary navigation links */}
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-7">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `text-sm font-semibold whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                    isActive
                      ? 'text-[#082B59] border-[#FFD43B]'
                      : 'text-slate-600 border-transparent hover:text-[#082B59] hover:border-slate-300'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Zone 3: Primary CTA + small Admin Dashboard icon */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/request-quote"
              className="hidden sm:inline-flex items-center justify-center min-h-[40px] px-4 py-2 rounded-lg bg-[#082B59] text-white text-sm font-semibold hover:bg-[#051d3d] transition-colors whitespace-nowrap shrink-0"
            >
              Request quote
            </Link>
            <Link
              to="/admin/login"
              aria-label="Admin dashboard"
              title="Admin dashboard"
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-600 hover:text-[#082B59] hover:bg-[#F3F6FA] transition-colors shrink-0"
            >
              <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg text-[#082B59] hover:bg-[#F3F6FA] transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile navigation drawer */}
        {mobileOpen && (
          <nav
            aria-label="Mobile navigation"
            className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-1"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-3 rounded-lg text-base font-semibold ${
                    isActive
                      ? 'bg-[#F3F6FA] text-[#082B59]'
                      : 'text-slate-700 hover:bg-[#F3F6FA] hover:text-[#082B59]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="pt-3">
              <Link
                to="/request-quote"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center w-full min-h-[44px] px-4 py-3 rounded-lg bg-[#FFD43B] text-[#082B59] font-bold text-base"
              >
                Request a shipping quote
              </Link>
            </div>
          </nav>
        )}
      </header>

      {/* Configuration / API failure banner if backend cannot load */}
      {error && (
        <div role="alert" className="bg-red-50 border-b border-red-200 text-red-900 px-4 py-3 text-sm">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <span>Unable to load live website settings: {error}</span>
            <button
              type="button"
              onClick={() => void refresh()}
              className="px-3 py-1.5 rounded-md bg-red-900 text-white text-xs font-semibold hover:bg-red-800"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <main id="main-content" className="flex-1">
        {children}
      </main>

      {/* Shared contact footer */}
      <footer className="bg-[#051d3d] text-slate-200 border-t border-[#082B59]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <div className="text-lg font-extrabold text-white tracking-tight">
              {businessName}
            </div>
            <p className="text-sm text-slate-300 max-w-md leading-relaxed">
              Shipping, repacking and door-to-door delivery for your goods from China to Ghana.
            </p>
            <p className="text-xs text-slate-400">
              {data?.settings.route_label || 'China → Ghana'}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-3">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-[#FFD43B] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#FFD43B] transition-colors">
                  About us
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-[#FFD43B] transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/what-we-ship" className="hover:text-[#FFD43B] transition-colors">
                  What we ship
                </Link>
              </li>
              <li>
                <Link to="/request-quote" className="hover:text-[#FFD43B] transition-colors">
                  Request quote
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-[#FFD43B] transition-colors">
                  Privacy policy
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3 text-sm">
            <h3 className="text-sm font-bold text-white">WhatsApp Teams</h3>
            <div>
              <div className="text-xs text-slate-400">Ghana WhatsApp</div>
              <a
                href={formatWaUrl(ghanaWa)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono-tabular font-semibold text-white hover:text-[#FFD43B] transition-colors"
              >
                {ghanaWa}
              </a>
              {officePublished && confirmedGhanaOffice && (
                <p className="text-xs text-slate-300 mt-0.5">{confirmedGhanaOffice}</p>
              )}
            </div>
            <div>
              <div className="text-xs text-slate-400">China WhatsApp</div>
              <a
                href={formatWaUrl(chinaWa)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono-tabular font-semibold text-white hover:text-[#FFD43B] transition-colors"
              >
                {chinaWa}
              </a>
              {officePublished && confirmedChinaOffice && (
                <p className="text-xs text-slate-300 mt-0.5">{confirmedChinaOffice}</p>
              )}
            </div>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-400">
            <span>© {new Date().getFullYear()} {businessName}. All rights reserved.</span>
            <span>China to Ghana cargo freight &amp; logistics enquiries</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

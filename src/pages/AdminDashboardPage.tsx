import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Inbox,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Shield,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';
import { AdminAccountTab } from '../components/admin/AdminAccountTab';
import { AdminCategoriesTab } from '../components/admin/AdminCategoriesTab';
import { AdminContentTab } from '../components/admin/AdminContentTab';
import { AdminEnquiriesTab } from '../components/admin/AdminEnquiriesTab';
import { AdminMediaTab } from '../components/admin/AdminMediaTab';
import { AdminServicesTab } from '../components/admin/AdminServicesTab';
import { useSiteData } from '../context/SiteDataContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import type {
  AdminUserPublic,
  AuditLog,
  CargoCategory,
  EditablePage,
  FAQItem,
  LogisticsService,
  MediaAsset,
  ServiceRate,
  ShipmentEnquiry,
  SiteSettings,
} from '../types/logistics';

type AdminTab = 'overview' | 'enquiries' | 'services' | 'categories' | 'content' | 'media' | 'account';

interface DashboardPayload {
  storageMode: 'supabase' | 'local_store';
  settings: SiteSettings;
  pages: Record<string, EditablePage>;
  services: LogisticsService[];
  rates: ServiceRate[];
  categories: CargoCategory[];
  faqs: FAQItem[];
  media: MediaAsset[];
  enquiries: ShipmentEnquiry[];
  auditLogs: AuditLog[];
}

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { refresh: refreshPublicSite } = useSiteData();

  useDocumentMeta({
    title: 'Admin Dashboard – DGP LOGISTICS',
    description: 'Administrator management dashboard for DGP LOGISTICS.',
    noindex: true,
  });

  const [user, setUser] = useState<AdminUserPublic | null>(null);
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [toast, setToast] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const sessRes = await fetch('/api/admin/session', { cache: 'no-store' });
      const sessBody = await sessRes.json();
      if (!sessBody.authenticated || !sessBody.user) {
        navigate('/admin/login', { replace: true });
        return;
      }
      setUser(sessBody.user);

      const dashRes = await fetch('/api/admin/dashboard', { cache: 'no-store' });
      if (dashRes.status === 401) {
        navigate('/admin/login', { replace: true });
        return;
      }
      if (!dashRes.ok) {
        const body = await dashRes.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to load dashboard.');
      }
      const payload = (await dashRes.json()) as DashboardPayload;
      setDashboard(payload);
      await refreshPublicSite();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, [navigate, refreshPublicSite]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 4500);
  }

  function handleTabSwitch(tab: AdminTab) {
    if (hasUnsavedChanges) {
      const ok = window.confirm('You have unsaved changes in the editor. Leave this section without saving?');
      if (!ok) return;
      setHasUnsavedChanges(false);
    }
    setActiveTab(tab);
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    navigate('/admin/login', { replace: true });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F6FA] p-8 flex items-center justify-center">
        <div className="text-sm font-semibold text-[#082B59]">Loading administrator console...</div>
      </div>
    );
  }

  if (error || !dashboard || !user) {
    return (
      <div className="min-h-screen bg-[#F3F6FA] p-8 flex items-center justify-center">
        <div className="bg-white border border-red-200 rounded-xl p-6 max-w-md space-y-3">
          <h1 className="text-lg font-bold text-red-900">Dashboard error</h1>
          <p className="text-sm text-red-700">{error || 'Session expired.'}</p>
          <Link
            to="/admin/login"
            className="inline-block px-4 py-2 rounded-lg bg-[#082B59] text-white text-xs font-bold"
          >
            Go to sign-in
          </Link>
        </div>
      </div>
    );
  }

  const totalEnquiries = dashboard.enquiries.length;
  const newEnquiries = dashboard.enquiries.filter((e) => e.status === 'New').length;
  const publishedServices = dashboard.services.filter((s) => s.status === 'published').length;
  const draftServices = dashboard.services.filter((s) => s.status !== 'published').length;

  const NAV: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'enquiries', label: `Enquiries (${totalEnquiries})`, icon: <Inbox className="w-4 h-4" /> },
    { id: 'services', label: 'Services & Rates', icon: <Settings className="w-4 h-4" /> },
    { id: 'categories', label: 'Cargo Categories', icon: <Package className="w-4 h-4" /> },
    { id: 'content', label: 'Website Content', icon: <FileText className="w-4 h-4" /> },
    { id: 'media', label: 'Media Library', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'account', label: 'Account & Logs', icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#F3F6FA] flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-[#082B59] text-white shrink-0 flex flex-col justify-between">
        <div>
          <div className="p-5 border-b border-white/10">
            <div className="text-sm font-extrabold tracking-tight text-[#FFD43B]">
              {dashboard.settings.business_name}
            </div>
            <div className="text-xs text-slate-300 mt-0.5">Administrator Portal</div>
          </div>

          <nav aria-label="Admin sections" className="p-3 flex lg:flex-col gap-1 overflow-x-auto">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabSwitch(item.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  activeTab === item.id
                    ? 'bg-[#FFD43B] text-[#082B59]'
                    : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-white/10 hidden lg:block space-y-2 text-xs">
          <div className="text-slate-300 truncate">{user.email}</div>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="inline-flex items-center gap-1.5 text-white hover:text-[#FFD43B] font-semibold"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-500">
              Admin / {NAV.find((n) => n.id === activeTab)?.label}
            </div>
            <h1 className="text-xl font-extrabold text-[#082B59]">
              {NAV.find((n) => n.id === activeTab)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <span className="text-xs font-bold text-amber-700">Unsaved changes</span>
            )}
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-[#082B59] hover:bg-[#F3F6FA]"
            >
              View public site
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="lg:hidden inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#082B59] text-white text-xs font-bold"
            >
              Sign out
            </button>
          </div>
        </header>

        {toast && (
          <div
            role="status"
            className="mx-6 mt-5 rounded-lg bg-[#082B59] text-white px-4 py-3 text-xs font-semibold flex items-center justify-between"
          >
            <span>{toast}</span>
            <button type="button" onClick={() => setToast(null)} className="text-[#FFD43B] font-bold">
              Dismiss
            </button>
          </div>
        )}

        <main className="p-6 flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1">
                  <div className="text-xs font-semibold text-slate-500">Total enquiries</div>
                  <div className="text-3xl font-extrabold text-[#082B59] tabular-nums">
                    {totalEnquiries}
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1">
                  <div className="text-xs font-semibold text-slate-500">New enquiries</div>
                  <div className="text-3xl font-extrabold text-[#082B59] tabular-nums">
                    {newEnquiries}
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1">
                  <div className="text-xs font-semibold text-slate-500">Published services</div>
                  <div className="text-3xl font-extrabold text-[#082B59] tabular-nums">
                    {publishedServices}
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1">
                  <div className="text-xs font-semibold text-slate-500">Draft / archived services</div>
                  <div className="text-3xl font-extrabold text-[#082B59] tabular-nums">
                    {draftServices}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-[#082B59]">Recent submissions</h2>
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('enquiries')}
                    className="text-xs font-bold text-[#082B59] hover:underline"
                  >
                    Manage all enquiries
                  </button>
                </div>
                {dashboard.enquiries.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500">
                    No customer enquiries submitted yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#F3F6FA] border-b border-slate-200 font-bold text-slate-600">
                          <th className="py-3 px-4">Reference</th>
                          <th className="py-3 px-4">Customer</th>
                          <th className="py-3 px-4">Service</th>
                          <th className="py-3 px-4">Destination</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboard.enquiries.slice(0, 8).map((enq) => (
                          <tr key={enq.id} className="border-b border-slate-100">
                            <td className="py-3 px-4 font-mono-tabular font-bold text-[#082B59]">
                              {enq.reference_code}
                            </td>
                            <td className="py-3 px-4 font-semibold">{enq.full_name}</td>
                            <td className="py-3 px-4 text-slate-600">{enq.service_name}</td>
                            <td className="py-3 px-4 text-slate-600">{enq.destination_city}</td>
                            <td className="py-3 px-4 font-bold text-[#082B59]">{enq.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'enquiries' && (
            <AdminEnquiriesTab
              enquiries={dashboard.enquiries}
              services={dashboard.services}
              onReload={loadAll}
              onNotify={notify}
            />
          )}

          {activeTab === 'services' && (
            <AdminServicesTab
              services={dashboard.services}
              rates={dashboard.rates}
              media={dashboard.media}
              onReload={loadAll}
              onNotify={notify}
            />
          )}

          {activeTab === 'categories' && (
            <AdminCategoriesTab
              categories={dashboard.categories}
              media={dashboard.media}
              onReload={loadAll}
              onNotify={notify}
            />
          )}

          {activeTab === 'content' && (
            <AdminContentTab
              settings={dashboard.settings}
              pages={dashboard.pages}
              faqs={dashboard.faqs}
              media={dashboard.media}
              onReload={loadAll}
              onNotify={notify}
              onDirtyChange={setHasUnsavedChanges}
            />
          )}

          {activeTab === 'media' && (
            <AdminMediaTab media={dashboard.media} onReload={loadAll} onNotify={notify} />
          )}

          {activeTab === 'account' && (
            <AdminAccountTab
              user={user}
              storageMode={dashboard.storageMode}
              auditLogs={dashboard.auditLogs}
              onNotify={notify}
            />
          )}
        </main>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { ArrowDown, ArrowUp, Plus } from 'lucide-react';
import type { LogisticsService, MediaAsset, ServiceRate, ServiceStatus } from '../../types/logistics';

interface AdminServicesTabProps {
  services: LogisticsService[];
  rates: ServiceRate[];
  media: MediaAsset[];
  onReload: () => Promise<void>;
  onNotify: (msg: string) => void;
}

export function AdminServicesTab({
  services,
  rates,
  media,
  onReload,
  onNotify,
}: AdminServicesTabProps) {
  const [editingService, setEditingService] = useState<Partial<LogisticsService> | null>(null);
  const [editingRate, setEditingRate] = useState<Partial<ServiceRate> | null>(null);
  const [saving, setSaving] = useState(false);

  async function saveSvc() {
    if (!editingService) return;
    setSaving(true);
    try {
      const url = editingService.id
        ? `/api/admin/services/${editingService.id}`
        : '/api/admin/services';
      const res = await fetch(url, {
        method: editingService.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingService),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Failed to save service.');
      setEditingService(null);
      await onReload();
      onNotify('Service saved and synced.');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function moveService(index: number, dir: -1 | 1) {
    const next = [...services];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setSaving(true);
    try {
      await fetch('/api/admin/services/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: next.map((s) => s.id) }),
      });
      await onReload();
      onNotify('Service order updated.');
    } finally {
      setSaving(false);
    }
  }

  async function saveRate() {
    if (!editingRate) return;
    setSaving(true);
    try {
      const url = editingRate.id ? `/api/admin/rates/${editingRate.id}` : '/api/admin/rates';
      const res = await fetch(url, {
        method: editingRate.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRate),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Failed to save rate.');
      setEditingRate(null);
      await onReload();
      onNotify('Rate entry updated.');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Rate update failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Services List */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-[#082B59]">Services catalogue</h2>
            <p className="text-xs text-slate-600">
              Publish, unpublish, archive, edit copy, and reorder service cards.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setEditingService({
                title: '',
                slug: '',
                short_description: '',
                full_description: '',
                suitable_for: '',
                quote_requirements: '',
                conditions: '',
                icon_name: 'Package',
                status: 'draft',
                show_on_home: false,
                image_url: media[0]?.url || '',
                image_alt: media[0]?.alt_text || '',
              })
            }
            className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg bg-[#082B59] text-white text-xs font-bold hover:bg-[#051d3d]"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Add service
          </button>
        </div>

        <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
          {services.map((svc, idx) => (
            <div key={svc.id} className="p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2 text-sm font-bold text-[#082B59]">
                  <span>{svc.title}</span>
                  <span className="text-xs font-normal text-slate-500">· /{svc.slug}</span>
                  <span className="text-xs font-semibold text-slate-700">· {svc.status}</span>
                  {svc.show_on_home && (
                    <span className="text-xs text-slate-500">· Shown on Home</span>
                  )}
                </div>
                <p className="text-xs text-slate-600">{svc.short_description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={idx === 0 || saving}
                  onClick={() => void moveService(idx, -1)}
                  aria-label={`Move ${svc.title} up`}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={idx === services.length - 1 || saving}
                  onClick={() => void moveService(idx, 1)}
                  aria-label={`Move ${svc.title} down`}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingService(svc)}
                  className="min-h-[36px] px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-[#082B59] hover:bg-[#F3F6FA]"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Service Modal / Inline Drawer */}
      {editingService && (
        <div className="bg-white border-2 border-[#082B59] rounded-xl p-6 space-y-4">
          <h3 className="text-base font-extrabold text-[#082B59]">
            {editingService.id ? `Edit service: ${editingService.title}` : 'Create service'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Title</label>
              <input
                type="text"
                value={editingService.title || ''}
                onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">URL slug</label>
              <input
                type="text"
                value={editingService.slug || ''}
                onChange={(e) => setEditingService({ ...editingService, slug: e.target.value })}
                className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Publication status</label>
              <select
                value={editingService.status || 'draft'}
                onChange={(e) =>
                  setEditingService({ ...editingService, status: e.target.value as ServiceStatus })
                }
                className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Service image (from Media Library)</label>
              <select
                value={editingService.image_url || ''}
                onChange={(e) => {
                  const asset = media.find((m) => m.url === e.target.value);
                  setEditingService({
                    ...editingService,
                    image_url: e.target.value,
                    media_id: asset?.id || null,
                    image_alt: asset?.alt_text || editingService.image_alt || '',
                  });
                }}
                className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
              >
                <option value="">Select image...</option>
                {media.map((m) => (
                  <option key={m.id} value={m.url}>
                    {m.file_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold mb-1">Short description</label>
              <input
                type="text"
                value={editingService.short_description || ''}
                onChange={(e) =>
                  setEditingService({ ...editingService, short_description: e.target.value })
                }
                className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold mb-1">Full description</label>
              <textarea
                rows={3}
                value={editingService.full_description || ''}
                onChange={(e) =>
                  setEditingService({ ...editingService, full_description: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold mb-1">Suitable shipment types</label>
              <textarea
                rows={2}
                value={editingService.suitable_for || ''}
                onChange={(e) =>
                  setEditingService({ ...editingService, suitable_for: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold mb-1">Information needed for quotation</label>
              <textarea
                rows={2}
                value={editingService.quote_requirements || ''}
                onChange={(e) =>
                  setEditingService({ ...editingService, quote_requirements: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold mb-1">Relevant conditions</label>
              <textarea
                rows={2}
                value={editingService.conditions || ''}
                onChange={(e) =>
                  setEditingService({ ...editingService, conditions: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(editingService.show_on_home)}
                onChange={(e) =>
                  setEditingService({ ...editingService, show_on_home: e.target.checked })
                }
              />
              Show in Home page highlights
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => void saveSvc()}
              className="min-h-[40px] px-5 py-2 rounded-lg bg-[#FFD43B] text-[#082B59] text-xs font-extrabold"
            >
              {saving ? 'Saving...' : 'Save service'}
            </button>
            <button
              type="button"
              onClick={() => setEditingService(null)}
              className="min-h-[40px] px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Draft & Published Service Rates */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-[#082B59]">
              Service rates &amp; flyer draft figures
            </h2>
            <p className="text-xs text-slate-600">
              Unverified flyer figures remain unpublished until confirmed. Public pages display
              &ldquo;Contact us for current rates and shipment terms.&rdquo; until a rate is published.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setEditingRate({
                service_id: services[0]?.id || '',
                label: '',
                amount_display: '',
                currency: 'USD',
                unit: '',
                estimated_transit: '',
                conditions: '',
                effective_date: '',
                is_published: false,
                internal_note: '',
              })
            }
            className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg border border-slate-300 text-xs font-bold text-[#082B59] hover:bg-[#F3F6FA]"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Add rate
          </button>
        </div>

        <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
          {rates.map((rate) => {
            const svc = services.find((s) => s.id === rate.service_id);
            return (
              <div key={rate.id} className="p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1 max-w-2xl">
                  <div className="text-sm font-bold text-[#082B59]">
                    {rate.label} ·{' '}
                    <span className="font-mono-tabular">
                      {rate.amount_display} {rate.unit}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600">
                    Service: {svc?.title || 'Unlinked'} ·{' '}
                    <strong className={rate.is_published ? 'text-emerald-700' : 'text-amber-700'}>
                      {rate.is_published ? 'Published publicly' : 'Draft (Unpublished)'}
                    </strong>
                    {rate.estimated_transit ? ` · Transit: ${rate.estimated_transit}` : ''}
                  </div>
                  {rate.conditions && <p className="text-xs text-slate-500">{rate.conditions}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => setEditingRate(rate)}
                  className="min-h-[36px] px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-[#082B59] hover:bg-[#F3F6FA]"
                >
                  Edit / Publish
                </button>
              </div>
            );
          })}
        </div>

        {editingRate && (
          <div className="border-2 border-[#082B59] rounded-xl p-5 space-y-4 bg-[#F3F6FA]">
            <h3 className="text-sm font-extrabold text-[#082B59]">Edit rate entry</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Service</label>
                <select
                  value={editingRate.service_id || ''}
                  onChange={(e) => setEditingRate({ ...editingRate, service_id: e.target.value })}
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Rate label</label>
                <input
                  type="text"
                  value={editingRate.label || ''}
                  onChange={(e) => setEditingRate({ ...editingRate, label: e.target.value })}
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Amount display</label>
                <input
                  type="text"
                  value={editingRate.amount_display || ''}
                  onChange={(e) =>
                    setEditingRate({ ...editingRate, amount_display: e.target.value })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Currency</label>
                <input
                  type="text"
                  value={editingRate.currency || ''}
                  onChange={(e) => setEditingRate({ ...editingRate, currency: e.target.value })}
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Unit (e.g. per CBM, per kg)</label>
                <input
                  type="text"
                  value={editingRate.unit || ''}
                  onChange={(e) => setEditingRate({ ...editingRate, unit: e.target.value })}
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Effective date</label>
                <input
                  type="date"
                  value={editingRate.effective_date || ''}
                  onChange={(e) =>
                    setEditingRate({ ...editingRate, effective_date: e.target.value })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1">Estimated transit</label>
                <input
                  type="text"
                  value={editingRate.estimated_transit || ''}
                  onChange={(e) =>
                    setEditingRate({ ...editingRate, estimated_transit: e.target.value })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1">Pricing conditions</label>
                <textarea
                  rows={2}
                  value={editingRate.conditions || ''}
                  onChange={(e) => setEditingRate({ ...editingRate, conditions: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-[#082B59] cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(editingRate.is_published)}
                  onChange={(e) =>
                    setEditingRate({ ...editingRate, is_published: e.target.checked })
                  }
                />
                Confirm and publish this rate on the public website
              </label>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveRate()}
                className="min-h-[40px] px-5 py-2 rounded-lg bg-[#FFD43B] text-[#082B59] text-xs font-extrabold"
              >
                {saving ? 'Saving...' : 'Save rate'}
              </button>
              <button
                type="button"
                onClick={() => setEditingRate(null)}
                className="min-h-[40px] px-4 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

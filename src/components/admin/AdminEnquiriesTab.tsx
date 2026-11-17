import { useMemo, useState } from 'react';
import { Download, MessageCircle, Search } from 'lucide-react';
import type { EnquiryStatus, LogisticsService, ShipmentEnquiry } from '../../types/logistics';

interface AdminEnquiriesTabProps {
  enquiries: ShipmentEnquiry[];
  services: LogisticsService[];
  onReload: () => Promise<void>;
  onNotify: (msg: string) => void;
}

const STATUSES: EnquiryStatus[] = ['New', 'Contacted', 'Quoted', 'Booked', 'Closed'];

export function AdminEnquiriesTab({
  enquiries,
  services,
  onReload,
  onNotify,
}: AdminEnquiriesTabProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [serviceFilter, setServiceFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string | null>(enquiries[0]?.id || null);
  const [noteInput, setNoteInput] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enquiries.filter((e) => {
      if (statusFilter !== 'All' && e.status !== statusFilter) return false;
      if (serviceFilter !== 'All' && e.service_slug !== serviceFilter) return false;
      if (dateFilter && !e.created_at.startsWith(dateFilter)) return false;
      if (q) {
        const hay = `${e.reference_code} ${e.full_name} ${e.phone_whatsapp} ${e.destination_city} ${e.goods_description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [enquiries, search, statusFilter, serviceFilter, dateFilter]);

  const active = useMemo(
    () => enquiries.find((e) => e.id === selectedId) || filtered[0] || null,
    [enquiries, filtered, selectedId],
  );

  async function handleStatusChange(id: string, status: EnquiryStatus) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Failed to update status.');
      await onReload();
      onNotify(`Updated enquiry status to ${status}.`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Status update failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddNote(id: string) {
    if (!noteInput.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/enquiries/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteInput.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Failed to add note.');
      setNoteInput('');
      await onReload();
      onNotify('Private internal note saved.');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to save note.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[220px] flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference, name, phone, goods..."
              aria-label="Search enquiries"
              className="w-full min-h-[40px] pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
            className="min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
          >
            <option value="All">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            aria-label="Filter by service"
            className="min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
          >
            <option value="All">All services</option>
            <option value="not-sure">Not sure</option>
            {services.map((s) => (
              <option key={s.id} value={s.slug}>
                {s.title}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            aria-label="Filter by submission date"
            className="min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
          />
        </div>

        <a
          href="/api/admin/enquiries/export.csv"
          className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-lg bg-[#082B59] text-white text-xs font-bold hover:bg-[#051d3d] whitespace-nowrap"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          Export CSV
        </a>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-2">
          <p className="text-base font-bold text-[#082B59]">No matching enquiries</p>
          <p className="text-sm text-slate-600">
            Submitted customer enquiries from Request Quote and Contact will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Table List */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#F3F6FA] text-xs font-bold text-slate-600">
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const isSelected = active?.id === item.id;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        className={`border-b border-slate-100 cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#F3F6FA]' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono-tabular text-xs font-bold text-[#082B59] whitespace-nowrap">
                          {item.reference_code}
                          <div className="text-[11px] font-normal text-slate-500">
                            {item.created_at.slice(0, 10)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#172536]">{item.full_name}</div>
                          <div className="text-xs text-slate-500">{item.destination_city}</div>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-700">{item.service_name}</td>
                        <td className="py-3 px-4 text-xs font-bold text-[#082B59] whitespace-nowrap">
                          {item.status}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail Inspector */}
          {active && (
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <div className="font-mono-tabular text-xs font-bold text-slate-500">
                    {active.reference_code} · {active.created_at.slice(0, 16).replace('T', ' ')}
                  </div>
                  <h3 className="text-lg font-extrabold text-[#082B59] mt-0.5">
                    {active.full_name}
                  </h3>
                  <div className="font-mono-tabular text-sm text-slate-700">
                    {active.phone_whatsapp}
                  </div>
                  {active.email && <div className="text-xs text-slate-500">{active.email}</div>}
                </div>

                <div>
                  <label htmlFor="active-status" className="sr-only">
                    Status
                  </label>
                  <select
                    id="active-status"
                    disabled={saving}
                    value={active.status}
                    onChange={(e) => void handleStatusChange(active.id, e.target.value as EnquiryStatus)}
                    className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-[#082B59] bg-white"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Service</span>
                  <span className="font-semibold text-[#172536]">{active.service_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Cargo category</span>
                  <span className="font-semibold text-[#172536]">
                    {active.cargo_category_name || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Destination</span>
                  <span className="font-semibold text-[#172536]">
                    {active.destination_city}
                    {active.delivery_area ? ` (${active.delivery_area})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Door-to-door</span>
                  <span className="font-semibold text-[#172536]">
                    {active.door_to_door_required ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Quantity / Weight</span>
                  <span className="font-semibold text-[#172536]">
                    {active.quantity} / {active.estimated_weight_kg}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Dimensions / CBM</span>
                  <span className="font-semibold text-[#172536]">
                    {active.dimensions_cm} / {active.estimated_volume_cbm}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">China location</span>
                  <span className="font-semibold text-[#172536]">
                    {active.china_location || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Preferred office</span>
                  <span className="font-semibold text-[#172536]">{active.preferred_office}</span>
                </div>
              </div>

              <div className="bg-[#F3F6FA] border border-slate-200 rounded-lg p-3.5 text-xs space-y-1">
                <div className="font-bold text-[#082B59]">Goods description</div>
                <p className="text-slate-700 leading-relaxed">{active.goods_description}</p>
                {active.additional_notes && (
                  <p className="text-slate-600 pt-1 border-t border-slate-200 mt-1">
                    <strong>Notes:</strong> {active.additional_notes}
                  </p>
                )}
              </div>

              <a
                href={`https://wa.me/${active.phone_whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `Hello ${active.full_name}, following up from DGP LOGISTICS regarding your shipment enquiry (${active.reference_code}).`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 min-h-[42px] w-full px-4 py-2 rounded-lg bg-[#FFD43B] text-[#082B59] text-xs font-extrabold hover:bg-[#f5c418]"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                Message customer on WhatsApp
              </a>

              {/* Private Internal Notes */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Private internal notes (never public)
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(active.notes || []).length === 0 ? (
                    <p className="text-xs text-slate-500">No internal notes yet.</p>
                  ) : (
                    active.notes!.map((n) => (
                      <div key={n.id} className="bg-[#F3F6FA] rounded-lg p-2.5 text-xs space-y-1">
                        <div className="text-[11px] text-slate-500">
                          {n.author_email} · {n.created_at.slice(0, 16).replace('T', ' ')}
                        </div>
                        <div className="text-[#172536]">{n.note}</div>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="Add private internal note..."
                    className="flex-1 min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                  <button
                    type="button"
                    disabled={saving || !noteInput.trim()}
                    onClick={() => void handleAddNote(active.id)}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#082B59] text-white text-xs font-bold disabled:opacity-50"
                  >
                    Save note
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

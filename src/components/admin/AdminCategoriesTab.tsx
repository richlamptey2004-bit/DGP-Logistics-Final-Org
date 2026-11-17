import { useState } from 'react';
import { ArrowDown, ArrowUp, Plus } from 'lucide-react';
import type { CargoCategory, MediaAsset } from '../../types/logistics';

interface AdminCategoriesTabProps {
  categories: CargoCategory[];
  media: MediaAsset[];
  onReload: () => Promise<void>;
  onNotify: (msg: string) => void;
}

export function AdminCategoriesTab({
  categories,
  media,
  onReload,
  onNotify,
}: AdminCategoriesTabProps) {
  const [editing, setEditing] = useState<Partial<CargoCategory> | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    try {
      const url = editing.id ? `/api/admin/categories/${editing.id}` : '/api/admin/categories';
      const res = await fetch(url, {
        method: editing.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Failed to save category.');
      setEditing(null);
      await onReload();
      onNotify('Cargo category saved.');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const next = [...categories];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setSaving(true);
    try {
      await fetch('/api/admin/categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: next.map((c) => c.id) }),
      });
      await onReload();
      onNotify('Cargo categories reordered.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-[#082B59]">What we ship categories</h2>
            <p className="text-xs text-slate-600">
              Add, edit, assign images, reorder, and publish cargo categories.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setEditing({
                name: '',
                slug: '',
                description: '',
                restricted_notice: '',
                is_published: true,
                image_url: media[0]?.url || '',
                image_alt: media[0]?.alt_text || '',
              })
            }
            className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg bg-[#082B59] text-white text-xs font-bold hover:bg-[#051d3d]"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Add category
          </button>
        </div>

        <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
          {categories.map((cat, idx) => (
            <div key={cat.id} className="p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 max-w-xl">
                {cat.image_url && (
                  <img
                    src={cat.image_url}
                    alt={cat.image_alt || cat.name}
                    className="w-14 h-11 rounded object-cover border border-slate-200 shrink-0"
                  />
                )}
                <div>
                  <div className="text-sm font-bold text-[#082B59]">
                    {cat.name}{' '}
                    <span className="text-xs font-normal text-slate-500">
                      · {cat.is_published ? 'Published' : 'Hidden'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{cat.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={idx === 0 || saving}
                  onClick={() => void move(idx, -1)}
                  aria-label={`Move ${cat.name} up`}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={idx === categories.length - 1 || saving}
                  onClick={() => void move(idx, 1)}
                  aria-label={`Move ${cat.name} down`}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(cat)}
                  className="min-h-[36px] px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-[#082B59] hover:bg-[#F3F6FA]"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>

        {editing && (
          <div className="border-2 border-[#082B59] rounded-xl p-5 space-y-4 bg-[#F3F6FA]">
            <h3 className="text-sm font-extrabold text-[#082B59]">
              {editing.id ? `Edit category: ${editing.name}` : 'Create category'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Category name</label>
                <input
                  type="text"
                  value={editing.name || ''}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Slug</label>
                <input
                  type="text"
                  value={editing.slug || ''}
                  onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1">Image (from Media Library)</label>
                <select
                  value={editing.image_url || ''}
                  onChange={(e) => {
                    const asset = media.find((m) => m.url === e.target.value);
                    setEditing({
                      ...editing,
                      image_url: e.target.value,
                      media_id: asset?.id || null,
                      image_alt: asset?.alt_text || editing.image_alt || '',
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
                <label className="block text-xs font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editing.description || ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1">
                  Restricted item notice (optional)
                </label>
                <input
                  type="text"
                  value={editing.restricted_notice || ''}
                  onChange={(e) => setEditing({ ...editing, restricted_notice: e.target.value })}
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-[#082B59] cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(editing.is_published)}
                  onChange={(e) => setEditing({ ...editing, is_published: e.target.checked })}
                />
                Published on What We Ship page
              </label>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className="min-h-[40px] px-5 py-2 rounded-lg bg-[#FFD43B] text-[#082B59] text-xs font-extrabold"
              >
                {saving ? 'Saving...' : 'Save category'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
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

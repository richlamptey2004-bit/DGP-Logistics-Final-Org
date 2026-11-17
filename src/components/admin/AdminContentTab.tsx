import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { EditablePage, FAQItem, MediaAsset, SiteSettings } from '../../types/logistics';

interface AdminContentTabProps {
  settings: SiteSettings;
  pages: Record<string, EditablePage>;
  faqs: FAQItem[];
  media: MediaAsset[];
  onReload: () => Promise<void>;
  onNotify: (msg: string) => void;
  onDirtyChange: (dirty: boolean) => void;
}

export function AdminContentTab({
  settings,
  pages,
  faqs,
  media,
  onReload,
  onNotify,
  onDirtyChange,
}: AdminContentTabProps) {
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(settings);
  const [homeForm, setHomeForm] = useState<EditablePage>(pages.home);
  const [aboutForm, setAboutForm] = useState<EditablePage>(pages.about);
  const [contactForm, setContactForm] = useState<EditablePage>(pages.contact);
  const [editingFaq, setEditingFaq] = useState<Partial<FAQItem> | null>(null);
  const [saving, setSaving] = useState(false);

  async function saveSettings() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Failed to save settings.');
      onDirtyChange(false);
      await onReload();
      onNotify('Business settings, logo, repacking, and contact info saved.');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function savePage(slug: string, pageData: EditablePage) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/pages/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageData),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Failed to save ${slug} page.`);
      onDirtyChange(false);
      await onReload();
      onNotify(`Saved ${pageData.title} page content.`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function saveFaq() {
    if (!editingFaq) return;
    setSaving(true);
    try {
      const url = editingFaq.id ? `/api/admin/faqs/${editingFaq.id}` : '/api/admin/faqs';
      const res = await fetch(url, {
        method: editingFaq.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingFaq),
      });
      if (!res.ok) throw new Error('Failed to save FAQ.');
      setEditingFaq(null);
      await onReload();
      onNotify('FAQ saved.');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'FAQ save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteFaq(id: string) {
    setSaving(true);
    try {
      await fetch(`/api/admin/faqs/${id}`, { method: 'DELETE' });
      await onReload();
      onNotify('FAQ removed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Business Settings, Logo, Repacking & Confirmed Office Details */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-lg font-extrabold text-[#082B59]">
            Business identity, WhatsApp contacts, logo &amp; repacking
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Flyer office details stay private as drafts until confirmed and published here.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Business name</label>
            <input
              type="text"
              value={settingsForm.business_name}
              onChange={(e) => {
                onDirtyChange(true);
                setSettingsForm({ ...settingsForm, business_name: e.target.value });
              }}
              className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Replaceable Logo (Media Library)</label>
            <select
              value={settingsForm.logo_url || ''}
              onChange={(e) => {
                onDirtyChange(true);
                const asset = media.find((m) => m.url === e.target.value);
                setSettingsForm({
                  ...settingsForm,
                  logo_url: e.target.value || null,
                  logo_media_id: asset?.id || null,
                  logo_alt: asset?.alt_text || settingsForm.business_name,
                });
              }}
              className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
            >
              <option value="">Default DGP LOGISTICS wordmark</option>
              {media.map((m) => (
                <option key={m.id} value={m.url}>
                  {m.file_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Ghana WhatsApp number</label>
            <input
              type="text"
              value={settingsForm.ghana_whatsapp}
              onChange={(e) => {
                onDirtyChange(true);
                setSettingsForm({ ...settingsForm, ghana_whatsapp: e.target.value });
              }}
              className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono-tabular"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">China WhatsApp number</label>
            <input
              type="text"
              value={settingsForm.china_whatsapp}
              onChange={(e) => {
                onDirtyChange(true);
                setSettingsForm({ ...settingsForm, china_whatsapp: e.target.value });
              }}
              className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono-tabular"
            />
          </div>
        </div>

        {/* Repacking Feature */}
        <div className="border-t border-slate-200 pt-4 space-y-3">
          <h3 className="text-sm font-extrabold text-[#082B59]">Repacking highlight section</h3>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Repacking heading</label>
              <input
                type="text"
                value={settingsForm.repacking_heading}
                onChange={(e) => {
                  onDirtyChange(true);
                  setSettingsForm({ ...settingsForm, repacking_heading: e.target.value });
                }}
                className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Repacking body copy</label>
              <textarea
                rows={2}
                value={settingsForm.repacking_body}
                onChange={(e) => {
                  onDirtyChange(true);
                  setSettingsForm({ ...settingsForm, repacking_body: e.target.value });
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Eligibility conditions (optional — shown publicly when filled)
              </label>
              <input
                type="text"
                value={settingsForm.repacking_conditions}
                onChange={(e) => {
                  onDirtyChange(true);
                  setSettingsForm({ ...settingsForm, repacking_conditions: e.target.value });
                }}
                placeholder="e.g. Standard repacking applies to consolidated parcels confirmed with our China warehouse."
                className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Office Details (Draft vs Confirmed) */}
        <div className="border-t border-slate-200 pt-4 space-y-3">
          <h3 className="text-sm font-extrabold text-[#082B59]">
            Office locations (Draft flyer reference vs Confirmed public text)
          </h3>
          <div className="bg-[#F3F6FA] border border-slate-200 rounded-lg p-3.5 text-xs text-slate-600 space-y-1">
            <div>
              <strong>Draft Ghana office (from flyer):</strong> {settingsForm.draft_ghana_office}
            </div>
            <div>
              <strong>Draft China office (from flyer):</strong> {settingsForm.draft_china_office}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Confirmed Ghana office address</label>
              <input
                type="text"
                value={settingsForm.confirmed_ghana_office}
                onChange={(e) => {
                  onDirtyChange(true);
                  setSettingsForm({ ...settingsForm, confirmed_ghana_office: e.target.value });
                }}
                placeholder="Enter verified Ghana office details"
                className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Confirmed China office address</label>
              <input
                type="text"
                value={settingsForm.confirmed_china_office}
                onChange={(e) => {
                  onDirtyChange(true);
                  setSettingsForm({ ...settingsForm, confirmed_china_office: e.target.value });
                }}
                placeholder="Enter verified China office details"
                className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs font-bold text-[#082B59] cursor-pointer">
            <input
              type="checkbox"
              checked={settingsForm.office_details_published}
              onChange={(e) => {
                onDirtyChange(true);
                setSettingsForm({ ...settingsForm, office_details_published: e.target.checked });
              }}
            />
            Publish confirmed office details on Contact page &amp; Footer
          </label>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={() => void saveSettings()}
          className="min-h-[42px] px-5 py-2 rounded-lg bg-[#FFD43B] text-[#082B59] text-xs font-extrabold hover:bg-[#f5c418]"
        >
          {saving ? 'Saving...' : 'Save business settings'}
        </button>
      </section>

      {/* Homepage Hero Editor */}
      {homeForm && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-extrabold text-[#082B59]">Home page hero</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Hero headline</label>
              <input
                type="text"
                value={homeForm.hero_headline}
                onChange={(e) => {
                  onDirtyChange(true);
                  setHomeForm({ ...homeForm, hero_headline: e.target.value });
                }}
                className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Hero photograph</label>
              <select
                value={homeForm.hero_image_url || ''}
                onChange={(e) => {
                  onDirtyChange(true);
                  const asset = media.find((m) => m.url === e.target.value);
                  setHomeForm({
                    ...homeForm,
                    hero_image_url: e.target.value,
                    hero_media_id: asset?.id || null,
                    hero_image_alt: asset?.alt_text || homeForm.hero_image_alt,
                  });
                }}
                className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
              >
                {media.map((m) => (
                  <option key={m.id} value={m.url}>
                    {m.file_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold mb-1">Hero supporting text</label>
              <textarea
                rows={2}
                value={homeForm.hero_subheadline}
                onChange={(e) => {
                  onDirtyChange(true);
                  setHomeForm({ ...homeForm, hero_subheadline: e.target.value });
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => void savePage('home', homeForm)}
            className="min-h-[40px] px-5 py-2 rounded-lg bg-[#082B59] text-white text-xs font-bold"
          >
            Save Home hero
          </button>
        </section>
      )}

      {/* About & Contact Copy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {aboutForm && (
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-extrabold text-[#082B59]">About us page</h2>
            <div>
              <label className="block text-xs font-semibold mb-1">Headline</label>
              <input
                type="text"
                value={aboutForm.hero_headline}
                onChange={(e) => {
                  onDirtyChange(true);
                  setAboutForm({ ...aboutForm, hero_headline: e.target.value });
                }}
                className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Introduction text</label>
              <textarea
                rows={3}
                value={aboutForm.hero_subheadline}
                onChange={(e) => {
                  onDirtyChange(true);
                  setAboutForm({ ...aboutForm, hero_subheadline: e.target.value });
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => void savePage('about', aboutForm)}
              className="min-h-[40px] px-5 py-2 rounded-lg bg-[#082B59] text-white text-xs font-bold"
            >
              Save About content
            </button>
          </section>
        )}

        {contactForm && (
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-extrabold text-[#082B59]">Contact page</h2>
            <div>
              <label className="block text-xs font-semibold mb-1">Headline</label>
              <input
                type="text"
                value={contactForm.hero_headline}
                onChange={(e) => {
                  onDirtyChange(true);
                  setContactForm({ ...contactForm, hero_headline: e.target.value });
                }}
                className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Introduction text</label>
              <textarea
                rows={3}
                value={contactForm.hero_subheadline}
                onChange={(e) => {
                  onDirtyChange(true);
                  setContactForm({ ...contactForm, hero_subheadline: e.target.value });
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => void savePage('contact', contactForm)}
              className="min-h-[40px] px-5 py-2 rounded-lg bg-[#082B59] text-white text-xs font-bold"
            >
              Save Contact content
            </button>
          </section>
        )}
      </div>

      {/* FAQs Editor */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-[#082B59]">FAQs</h2>
          <button
            type="button"
            onClick={() => setEditingFaq({ question: '', answer: '', is_published: true })}
            className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#082B59] text-white text-xs font-bold"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Add FAQ
          </button>
        </div>

        <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
          {faqs.map((faq) => (
            <div key={faq.id} className="p-4 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="text-sm font-bold text-[#082B59]">{faq.question}</div>
                <div className="text-xs text-slate-600">{faq.answer}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingFaq(faq)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-[#082B59]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void deleteFaq(faq.id)}
                  aria-label="Delete FAQ"
                  className="p-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {editingFaq && (
          <div className="border-2 border-[#082B59] rounded-xl p-4 space-y-3 bg-[#F3F6FA]">
            <div>
              <label className="block text-xs font-semibold mb-1">Question</label>
              <input
                type="text"
                value={editingFaq.question || ''}
                onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Answer</label>
              <textarea
                rows={3}
                value={editingFaq.answer || ''}
                onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveFaq()}
                className="min-h-[38px] px-4 py-1.5 rounded-lg bg-[#FFD43B] text-[#082B59] text-xs font-extrabold"
              >
                Save FAQ
              </button>
              <button
                type="button"
                onClick={() => setEditingFaq(null)}
                className="min-h-[38px] px-4 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

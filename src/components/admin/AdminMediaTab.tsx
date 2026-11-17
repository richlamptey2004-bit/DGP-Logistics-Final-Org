import React, { useState } from 'react';
import { Trash2, Upload } from 'lucide-react';
import type { MediaAsset } from '../../types/logistics';

interface AdminMediaTabProps {
  media: MediaAsset[];
  onReload: () => Promise<void>;
  onNotify: (msg: string) => void;
}

export function AdminMediaTab({ media, onReload, onNotify }: AdminMediaTabProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [altText, setAltText] = useState('');
  const [sourceCredit, setSourceCredit] = useState('');
  const [licenceInfo, setLicenceInfo] = useState('');
  const [uploading, setUploading] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] || null;
    if (!selected) return;
    if (selected.size > 5 * 1024 * 1024) {
      onNotify('Image exceeds the 5 MB limit.');
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(selected.type)) {
      onNotify('Unsupported format. Upload JPEG, PNG, WebP, or SVG.');
      return;
    }
    setFile(selected);
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result || ''));
    reader.readAsDataURL(selected);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !preview) {
      onNotify('Select an image file first.');
      return;
    }
    if (!altText.trim()) {
      onNotify('Provide descriptive alternative text before uploading.');
      return;
    }
    setUploading(true);
    try {
      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          base64Data: preview,
          altText: altText.trim(),
          sourceCredit: sourceCredit.trim(),
          licenceInfo: licenceInfo.trim(),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Upload failed.');
      setFile(null);
      setPreview(null);
      setAltText('');
      setSourceCredit('');
      setLicenceInfo('');
      await onReload();
      onNotify('Image uploaded to Media Library.');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/media/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete image.');
      await onReload();
      onNotify('Image removed from Media Library.');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Delete failed.');
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleUpload}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
      >
        <div>
          <h2 className="text-lg font-extrabold text-[#082B59]">Upload image</h2>
          <p className="text-xs text-slate-600">
            Accepted formats: JPEG, PNG, WebP, SVG (max 5 MB). Images are stored persistently and
            available for the logo, hero, services, and cargo categories.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Image file *</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              onChange={handleFileChange}
              className="block w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#082B59] file:text-white file:font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Alternative text (required) *</label>
            <input
              type="text"
              required
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Describe what the photo shows"
              className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Source / photographer credit</label>
            <input
              type="text"
              value={sourceCredit}
              onChange={(e) => setSourceCredit(e.target.value)}
              placeholder="e.g. DGP LOGISTICS Accra team"
              className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Licence information</label>
            <input
              type="text"
              value={licenceInfo}
              onChange={(e) => setLicenceInfo(e.target.value)}
              placeholder="e.g. Company owned photo"
              className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
        </div>

        {preview && (
          <div className="w-48 aspect-[4/3] rounded-lg overflow-hidden border border-slate-200">
            <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
          </div>
        )}

        <button
          type="submit"
          disabled={uploading}
          className="inline-flex items-center gap-2 min-h-[42px] px-5 py-2 rounded-lg bg-[#FFD43B] text-[#082B59] text-xs font-extrabold hover:bg-[#f5c418] disabled:opacity-60"
        >
          <Upload className="w-4 h-4" aria-hidden="true" />
          {uploading ? 'Uploading...' : 'Upload to Media Library'}
        </button>
      </form>

      {/* Gallery */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {media.map((asset) => (
          <div
            key={asset.id}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col"
          >
            <div className="aspect-[4/3] bg-[#F3F6FA] overflow-hidden">
              <img
                src={asset.url}
                alt={asset.alt_text}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="font-bold text-[#082B59] truncate">{asset.file_name}</div>
                <div className="text-slate-600">{asset.alt_text}</div>
                {asset.source_credit && (
                  <div className="text-[11px] text-slate-500">Source: {asset.source_credit}</div>
                )}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="font-mono-tabular text-[11px] text-slate-500">
                  {Math.round(asset.size_bytes / 1024)} KB
                </span>
                <button
                  type="button"
                  onClick={() => void handleDelete(asset.id)}
                  className="inline-flex items-center gap-1 text-red-700 font-semibold hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

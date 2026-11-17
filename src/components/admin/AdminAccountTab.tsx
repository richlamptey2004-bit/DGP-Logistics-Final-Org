import React, { useState } from 'react';
import type { AdminUserPublic, AuditLog } from '../../types/logistics';

interface AdminAccountTabProps {
  user: AdminUserPublic;
  storageMode: 'supabase' | 'local_store';
  auditLogs: AuditLog[];
  onNotify: (msg: string) => void;
}

export function AdminAccountTab({
  user,
  storageMode,
  auditLogs,
  onNotify,
}: AdminAccountTabProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      onNotify('New passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Failed to update password.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onNotify('Password updated securely.');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Password change failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Storage Connection Info */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-2">
        <h2 className="text-lg font-extrabold text-[#082B59]">Environment &amp; database mode</h2>
        <p className="text-sm text-slate-700">
          Active storage backend:{' '}
          <strong className="text-[#082B59]">
            {storageMode === 'supabase'
              ? 'Supabase PostgreSQL + Auth + Storage'
              : 'Local persistent server store (preview mode — configure server-side Supabase credentials for production)'}
          </strong>
        </p>
        <p className="text-xs text-slate-500">
          Signed in as <span className="font-semibold">{user.email}</span> ({user.role})
        </p>
      </section>

      {/* Change Password */}
      <form
        onSubmit={handlePasswordChange}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 max-w-lg"
      >
        <h2 className="text-lg font-extrabold text-[#082B59]">Change password</h2>
        <div>
          <label className="block text-xs font-semibold mb-1">Current password</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">New strong password</label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Minimum 10 characters with uppercase, lowercase, number, and special character.
          </p>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Confirm new password</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="min-h-[40px] px-5 py-2 rounded-lg bg-[#082B59] text-white text-xs font-bold"
        >
          {saving ? 'Updating...' : 'Update password'}
        </button>
      </form>

      {/* Audit Logs */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-extrabold text-[#082B59]">Administrative audit log</h2>
          <p className="text-xs text-slate-600">
            Recent sign-ins, content publications, rate changes, and enquiry updates.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F3F6FA] border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Summary</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 px-4 text-center text-slate-500">
                    No audit records yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100">
                    <td className="py-2.5 px-4 font-mono-tabular text-slate-500 whitespace-nowrap">
                      {log.created_at.slice(0, 19).replace('T', ' ')}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-[#172536]">{log.actor_email}</td>
                    <td className="py-2.5 px-4 font-mono-tabular text-[#082B59]">{log.action}</td>
                    <td className="py-2.5 px-4 text-slate-700">{log.summary}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

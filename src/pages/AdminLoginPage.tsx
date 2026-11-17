import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export function AdminLoginPage() {
  const navigate = useNavigate();

  useDocumentMeta({
    title: 'Administrator Sign-In – DGP LOGISTICS',
    description: 'Protected administrator portal for DGP LOGISTICS.',
    noindex: true,
  });

  const [checking, setChecking] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/session', { cache: 'no-store' })
      .then((r) => r.json())
      .then((body) => {
        if (!active) return;
        if (body.authenticated) {
          navigate('/admin', { replace: true });
          return;
        }
        setNeedsSetup(Boolean(body.needsOwnerSetup));
      })
      .catch(() => {
        if (active) setError('Unable to check administrator session.');
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Sign-in failed.');
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOwnerSetup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/setup-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Owner provisioning failed.');
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Owner provisioning failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F6FA] flex flex-col justify-center py-12 px-4 sm:px-6">
      <div className="max-w-md w-full mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#082B59] hover:underline underline-offset-4"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to DGP LOGISTICS
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#082B59]">
              {needsSetup ? (
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Lock className="w-4 h-4" aria-hidden="true" />
              )}
              <span>DGP LOGISTICS · Administration</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#082B59]">
              {needsSetup ? 'Set administrator password' : 'Administrator sign-in'}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              {needsSetup
                ? 'No administrator password has been configured yet. Create a strong password (10+ characters with uppercase, lowercase, number, and symbol).'
                : 'Enter your administrator password to access the dashboard.'}
            </p>
          </div>

          {checking ? (
            <div className="h-36 rounded-lg bg-[#F3F6FA] animate-pulse" />
          ) : (
            <>
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs sm:text-sm text-red-900 flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              {needsSetup ? (
                <form onSubmit={handleOwnerSetup} className="space-y-4">
                  <div>
                    <label htmlFor="setup-pw" className="block text-sm font-semibold mb-1.5">
                      Administrator password
                    </label>
                    <div className="relative">
                      <input
                        id="setup-pw"
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full min-h-[44px] pl-3.5 pr-11 py-2.5 rounded-lg border border-slate-300 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-[#082B59]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="setup-pw2" className="block text-sm font-semibold mb-1.5">
                      Confirm password
                    </label>
                    <input
                      id="setup-pw2"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full min-h-[44px] px-5 py-2.5 rounded-lg bg-[#FFD43B] text-[#082B59] font-extrabold text-sm hover:bg-[#f5c418] disabled:opacity-60"
                  >
                    {submitting ? 'Setting password...' : 'Save password & open dashboard'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label htmlFor="login-pw" className="block text-sm font-semibold mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="login-pw"
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoFocus
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter administrator password"
                        className="w-full min-h-[44px] pl-3.5 pr-11 py-2.5 rounded-lg border border-slate-300 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-[#082B59]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full min-h-[44px] px-5 py-2.5 rounded-lg bg-[#082B59] text-white font-bold text-sm hover:bg-[#051d3d] disabled:opacity-60"
                  >
                    {submitting ? 'Signing in...' : 'Sign in to dashboard'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

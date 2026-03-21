'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Stage = 'loading' | 'form' | 'error';

export default function AccountSetupPage() {
  const [stage, setStage]       = useState<Stage>('loading');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const router = useRouter();

  /* ── Controleer sessie — ondersteunt implicit flow (hash) én PKCE (callback) ── */
  useEffect(() => {
    const supabase = createClient();

    // Implicit flow: Supabase stuurt #access_token=... in de URL hash
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      // De Supabase client verwerkt de hash automatisch; haal daarna de sessie op
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setStage('form');
        } else {
          supabase.auth.getUser().then(({ data: { user } }) => {
            setStage(user ? 'form' : 'error');
          });
        }
      });
    } else {
      // PKCE flow: sessie is al ingesteld door /auth/callback
      supabase.auth.getUser().then(({ data: { user } }) => {
        setStage(user ? 'form' : 'error');
      });
    }
  }, []);

  /* ── Stel het wachtwoord in ── */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Wachtwoorden komen niet overeen.');
      return;
    }
    if (password.length < 8) {
      setError('Wachtwoord moet minimaal 8 tekens bevatten.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError('Er is iets misgegaan. Probeer het opnieuw.');
      setLoading(false);
      return;
    }

    router.push('/admin');
    router.refresh();
  }

  /* ── Loading ── */
  if (stage === 'loading') {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <svg className="animate-spin w-8 h-8 text-[#00A651]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }

  /* ── Fout / verlopen link ── */
  if (stage === 'error') {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/15 mb-6">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-white text-xl font-semibold mb-2">Link verlopen</h1>
          <p className="text-gray-400 text-sm">
            De uitnodigingslink is verlopen of ongeldig.
            Vraag een nieuwe uitnodiging aan bij de beheerder.
          </p>
        </div>
      </div>
    );
  }

  /* ── Wachtwoord-formulier ── */
  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo / titel */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#00A651] mb-6">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-white" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
          <h1
            className="text-5xl text-white tracking-wide"
            style={{ fontFamily: 'Bebas Neue, sans-serif' }}
          >
            De Groene Pijl
          </h1>
          <p className="text-gray-400 mt-2 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
            CMS — Beheeromgeving
          </p>
        </div>

        {/* Formulier */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8">
          <h2
            className="text-white text-xl font-semibold mb-1"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Wachtwoord instellen
          </h2>
          <p className="text-gray-400 text-sm mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
            Stel een wachtwoord in om toegang te krijgen tot het CMS.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5" style={{ fontFamily: 'Inter, sans-serif' }}>

            {/* Nieuw wachtwoord */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                Nieuw wachtwoord
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full bg-[#111111] border border-white/15 text-white placeholder-gray-600
                           rounded-lg px-4 py-3 text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#00A651] focus:border-transparent
                           transition-all duration-200"
              />
            </div>

            {/* Bevestig wachtwoord */}
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-300 mb-1.5">
                Bevestig wachtwoord
              </label>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full bg-[#111111] border border-white/15 text-white placeholder-gray-600
                           rounded-lg px-4 py-3 text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#00A651] focus:border-transparent
                           transition-all duration-200"
              />
            </div>

            {/* Foutmelding */}
            {error && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                <svg
                  className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00A651] hover:bg-[#009147] active:bg-[#007a3d]
                         text-white font-semibold py-3 rounded-lg text-sm
                         transition-colors duration-200
                         disabled:opacity-60 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Bezig…
                </>
              ) : (
                'Wachtwoord instellen'
              )}
            </button>

          </form>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6" style={{ fontFamily: 'Inter, sans-serif' }}>
          © {new Date().getFullYear()} De Groene Pijl
        </p>

      </div>
    </div>
  );
}

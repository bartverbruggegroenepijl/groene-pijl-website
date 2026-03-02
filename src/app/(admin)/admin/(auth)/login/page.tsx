'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('Ongeldig e-mailadres of wachtwoord. Probeer het opnieuw.');
      setLoading(false);
      return;
    }

    router.push('/admin');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo / titel */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#00A651] mb-6">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-8 h-8 text-white"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
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
            className="text-white text-xl font-semibold mb-6"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Inloggen
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5" style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* E-mail */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-1.5"
              >
                E-mailadres
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="naam@example.com"
                className="w-full bg-[#111111] border border-white/15 text-white placeholder-gray-600
                           rounded-lg px-4 py-3 text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#00A651] focus:border-transparent
                           transition-all duration-200"
              />
            </div>

            {/* Wachtwoord */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-1.5"
              >
                Wachtwoord
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
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
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
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
                    <circle
                      className="opacity-25"
                      cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Bezig met inloggen…
                </>
              ) : (
                'Inloggen'
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

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { KeyRound, CheckCircle2, Info } from 'lucide-react';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function WachtwoordWijzigenPage() {
  const [huidig, setHuidig]       = useState('');
  const [nieuw, setNieuw]         = useState('');
  const [bevestig, setBevestig]   = useState('');
  const [status, setStatus]       = useState<Status>('idle');
  const [fout, setFout]           = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);

  /* ── Haal het e-mailadres van de ingelogde gebruiker op ── */
  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => setUserEmail(user?.email ?? null));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFout('');
    setStatus('idle');

    if (nieuw !== bevestig) {
      setFout('Nieuwe wachtwoorden komen niet overeen.');
      return;
    }
    if (nieuw.length < 8) {
      setFout('Nieuw wachtwoord moet minimaal 8 tekens bevatten.');
      return;
    }
    if (!userEmail) {
      setFout('Gebruiker niet gevonden. Probeer opnieuw in te loggen.');
      return;
    }

    setStatus('loading');
    const supabase = createClient();

    /* ── Stap 1: verifieer huidig wachtwoord via re-authenticatie ── */
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: huidig,
    });

    if (signInError) {
      setFout('Huidig wachtwoord is onjuist. Probeer het opnieuw.');
      setStatus('error');
      return;
    }

    /* ── Stap 2: stel het nieuwe wachtwoord in ── */
    const { error: updateError } = await supabase.auth.updateUser({ password: nieuw });

    if (updateError) {
      setFout('Er is iets misgegaan bij het opslaan. Probeer het opnieuw.');
      setStatus('error');
      return;
    }

    /* ── Gelukt! Maak het formulier leeg ── */
    setHuidig('');
    setNieuw('');
    setBevestig('');
    setStatus('success');
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── Paginakoptekst ── */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[#00A651]/15 flex items-center justify-center flex-shrink-0">
          <KeyRound className="w-5 h-5 text-[#00A651]" />
        </div>
        <div>
          <h1
            className="text-white"
            style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem', letterSpacing: '0.05em' }}
          >
            Wachtwoord Wijzigen
          </h1>
          <p className="text-gray-500 text-sm">Stel een nieuw wachtwoord in voor jouw account.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Hoofd kolom: formulier ── */}
        <div className="lg:col-span-2">
          <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-6">

            {/* Succesmelding */}
            {status === 'success' && (
              <div className="flex items-start gap-3 bg-[#00A651]/10 border border-[#00A651]/30 rounded-lg px-4 py-3 mb-6">
                <CheckCircle2 className="w-4 h-4 text-[#00A651] mt-0.5 flex-shrink-0" />
                <p className="text-[#00A651] text-sm font-medium">
                  Wachtwoord is succesvol gewijzigd.
                </p>
              </div>
            )}

            {/* Foutmelding */}
            {fout && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-6">
                <svg
                  className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-400 text-sm">{fout}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Huidig wachtwoord */}
              <div>
                <label htmlFor="huidig" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Huidig wachtwoord
                </label>
                <input
                  id="huidig"
                  type="password"
                  value={huidig}
                  onChange={(e) => { setHuidig(e.target.value); setFout(''); setStatus('idle'); }}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full bg-[#111111] border border-white/15 text-white placeholder-gray-600
                             rounded-lg px-4 py-3 text-sm
                             focus:outline-none focus:ring-2 focus:ring-[#00A651] focus:border-transparent
                             transition-all duration-200"
                />
              </div>

              {/* Nieuw wachtwoord */}
              <div>
                <label htmlFor="nieuw" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Nieuw wachtwoord
                </label>
                <input
                  id="nieuw"
                  type="password"
                  value={nieuw}
                  onChange={(e) => { setNieuw(e.target.value); setFout(''); setStatus('idle'); }}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full bg-[#111111] border border-white/15 text-white placeholder-gray-600
                             rounded-lg px-4 py-3 text-sm
                             focus:outline-none focus:ring-2 focus:ring-[#00A651] focus:border-transparent
                             transition-all duration-200"
                />
              </div>

              {/* Bevestig nieuw wachtwoord */}
              <div>
                <label htmlFor="bevestig" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Bevestig nieuw wachtwoord
                </label>
                <input
                  id="bevestig"
                  type="password"
                  value={bevestig}
                  onChange={(e) => { setBevestig(e.target.value); setFout(''); setStatus('idle'); }}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full bg-[#111111] border border-white/15 text-white placeholder-gray-600
                             rounded-lg px-4 py-3 text-sm
                             focus:outline-none focus:ring-2 focus:ring-[#00A651] focus:border-transparent
                             transition-all duration-200"
                />
              </div>

              {/* Submit */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="bg-[#00A651] hover:bg-[#009147] active:bg-[#007a3d]
                             text-white font-semibold py-3 px-6 rounded-lg text-sm
                             transition-colors duration-200
                             disabled:opacity-60 disabled:cursor-not-allowed
                             flex items-center gap-2"
                >
                  {status === 'loading' ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10"
                          stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Bezig…
                    </>
                  ) : (
                    'Wachtwoord wijzigen'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* ── Info kolom ── */}
        <div>
          <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-gray-500" />
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest">Info</p>
            </div>
            <ul className="space-y-2 text-xs text-gray-500 leading-relaxed">
              <li>• Voer altijd eerst je huidige wachtwoord in als beveiliging.</li>
              <li>• Het nieuwe wachtwoord moet minimaal 8 tekens bevatten.</li>
              <li>• Gebruik een combinatie van letters, cijfers en symbolen voor een sterker wachtwoord.</li>
              <li>• Na het wijzigen blijf je ingelogd op dit apparaat.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Logo from '@/components/ui/Logo';

export default function VraagPopup() {
  const [showTrigger, setShowTrigger] = useState(false);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [question, setQuestion] = useState('');
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const t = setTimeout(() => setShowTrigger(true), 5000);
    return () => clearTimeout(t);
  }, []);

  if (pathname?.startsWith('/admin')) return null;

  async function submit() {
    setError('');
    if (!email.includes('@')) return setError('Vul een geldig e-mailadres in.');
    if (!question.trim()) return setError('Stel eerst een vraag!');

    setLoading(true);
    const res = await fetch('/api/vraag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, question }),
    });
    setLoading(false);
    if (res.ok) setStep('success');
    else setError('Er ging iets mis, probeer het opnieuw.');
  }

  return (
    <>
      {showTrigger && !open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-[#00FA61] text-[#1a1361] font-extrabold px-5 py-3 rounded-full text-sm hover:opacity-90 transition-all shadow-lg"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          Stel je vraag! 💬
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl p-8"
            style={{
              background: '#1a1361',
              border: '1.5px solid #00FA61',
              fontFamily: 'Montserrat, sans-serif',
            }}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 text-white/40 hover:text-white/80 text-xl transition"
            >
              ✕
            </button>

            {step === 'form' ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00FA61]" />
                  <span className="text-[#00FA61] text-xs font-bold uppercase tracking-widest">
                    Jouw vraag
                  </span>
                </div>

                <h2 className="text-3xl font-extrabold text-white mb-1">Stel je vraag!</h2>
                <p className="text-white/60 text-sm mb-6 leading-relaxed">
                  Wie weet wordt jouw vraag beantwoord in de volgende aflevering.
                </p>

                <label className="block text-[#00FA61] text-xs font-bold uppercase tracking-wide mb-1.5">
                  E-mailadres
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jouw@email.nl"
                  className="w-full bg-white/10 border border-[#00FA61]/30 focus:border-[#00FA61] rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm mb-4 outline-none transition"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                />

                <label className="block text-[#00FA61] text-xs font-bold uppercase tracking-wide mb-1.5">
                  Jouw vraag
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Wat wil jij weten over FPL?"
                  rows={4}
                  className="w-full bg-white/10 border border-[#00FA61]/30 focus:border-[#00FA61] rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm mb-4 outline-none transition resize-none"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                />

                {error && (
                  <p className="text-red-400 text-sm mb-3 font-semibold">{error}</p>
                )}

                <button
                  onClick={submit}
                  disabled={loading}
                  className="w-full bg-[#00FA61] text-[#1a1361] font-extrabold py-3.5 rounded-xl text-base hover:opacity-90 transition disabled:opacity-60"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {loading ? 'Versturen...' : 'Verstuur vraag →'}
                </button>

                <p className="text-center text-white/25 text-xs mt-3">
                  We houden je e-mailadres voor ons
                </p>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="flex justify-center mb-4">
                  <Logo size="lg" linked={false} showText={false} />
                </div>
                <h2 className="text-2xl font-extrabold text-white mb-2">Vraag ontvangen!</h2>
                <p className="text-white/60 text-sm mb-6 leading-relaxed">
                  Bedankt! Wie weet horen we je terug in de volgende aflevering van{' '}
                  <span className="text-[#00FA61] font-bold">De Groene Pijl</span>.
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="border border-[#00FA61] text-[#00FA61] px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-[#00FA61]/10 transition"
                >
                  Sluiten
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

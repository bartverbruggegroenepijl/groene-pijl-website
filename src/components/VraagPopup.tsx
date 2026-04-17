'use client';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Logo from '@/components/ui/Logo';

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

export default function VraagPopup() {
  const [showTrigger, setShowTrigger] = useState(false);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [question, setQuestion] = useState('');
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachment, setAttachment] = useState<{ naam: string; data: string; type: string } | null>(null);
  const [fileError, setFileError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const t = setTimeout(() => setShowTrigger(true), 5000);
    return () => clearTimeout(t);
  }, []);

  if (pathname?.startsWith('/admin')) return null;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError('');
    const file = e.target.files?.[0];
    if (!file) { setAttachment(null); return; }
    if (file.size > MAX_FILE_BYTES) {
      setFileError('Bestand is te groot (max 5 MB).');
      setAttachment(null);
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // strip "data:<type>;base64," prefix
      const base64 = dataUrl.split(',')[1];
      setAttachment({ naam: file.name, data: base64, type: file.type });
    };
    reader.readAsDataURL(file);
  }

  async function submit() {
    setError('');
    if (!email.includes('@')) return setError('Vul een geldig e-mailadres in.');
    if (!question.trim()) return setError('Stel eerst een vraag!');

    setLoading(true);
    const res = await fetch('/api/vraag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, question, bijlage: attachment }),
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

                <label className="block text-[#00FA61] text-xs font-bold uppercase tracking-wide mb-1.5">
                  Screenshot toevoegen (optioneel)
                </label>
                <label
                  className="flex items-center gap-3 w-full bg-white/10 border border-[#00FA61]/30 rounded-xl px-4 py-3 text-sm mb-1 cursor-pointer hover:border-[#00FA61]/60 transition"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  <span className="text-[#00FA61] font-bold shrink-0">📎 Kies bestand</span>
                  <span className="text-white/40 truncate text-xs">
                    {attachment ? attachment.naam : 'Geen bestand gekozen'}
                  </span>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFile}
                  />
                </label>
                {fileError && (
                  <p className="text-red-400 text-xs mb-2 font-semibold">{fileError}</p>
                )}
                <p className="text-white/25 text-xs mb-4">Max 5 MB · jpg, png, webp, gif</p>

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

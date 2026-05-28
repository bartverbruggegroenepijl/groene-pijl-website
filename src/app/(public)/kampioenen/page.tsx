import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Trophy } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Kampioenen | De Groene Pijl',
  description: 'De winnaars van de Groene Pijl League.',
};

export default function KampioenenPage() {
  return (
    <main
      className="min-h-screen text-white overflow-x-hidden"
      style={{ background: '#0D0B2A', fontFamily: 'Montserrat, sans-serif' }}
    >
      <style>{`
        @keyframes starPulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.15); }
        }
        .star-pulse { animation: starPulse 2s ease-in-out infinite; }
      `}</style>

      {/* ── GOUDEN BANNER ────────────────────────────────────────── */}
      <div
        className="text-center text-sm sm:text-base font-extrabold px-4 py-4"
        style={{
          background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
          color: '#1F0E84',
          fontFamily: 'Montserrat, sans-serif',
          letterSpacing: '0.01em',
        }}
      >
        🏆 De Groene Pijl League heeft zijn eerste kampioen — Serge van &apos;t Westeinde (FC the Westend)
      </div>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section
        className="relative pt-32 pb-24 px-4 text-center"
        style={{
          backgroundImage: "url('/gradient-bg.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderBottom: '2px solid rgba(255,215,0,0.2)',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,11,42,0.55)', pointerEvents: 'none' }} />
        <div className="relative">
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em] mb-4"
            style={{ color: '#FFD700' }}
          >
            Groene Pijl League
          </p>
          <h1
            className="text-5xl sm:text-7xl font-black mb-4"
            style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em', color: '#FFD700' }}
          >
            🏆 Kampioenen
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            De winnaars van de Groene Pijl League
          </p>
        </div>
      </section>

      {/* ── CONTENT ──────────────────────────────────────────────── */}
      <section className="px-4 py-20">
        <div className="max-w-2xl mx-auto">

          {/* Back link */}
          <Link
            href="/rankings"
            className="inline-flex items-center gap-2 text-sm font-medium mb-12 transition-colors"
            style={{ color: 'rgba(0,250,97,0.7)' }}
          >
            <ArrowLeft size={14} />
            Terug naar rankings
          </Link>

          {/* ── KAMPIOENKAART ──────────────────────────────────────── */}
          <div
            className="champion-card rounded-3xl p-8 sm:p-10 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #0f0a3a 0%, #1a1060 50%, #0f0a3a 100%)',
              border: '1.5px solid rgba(255,215,0,0.4)',
            }}
          >
            {/* Achtergrond sterren */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
              {[
                { top: '8%',  left: '5%',  size: 18, delay: '0s'   },
                { top: '15%', left: '88%', size: 14, delay: '0.6s' },
                { top: '70%', left: '92%', size: 20, delay: '1.2s' },
                { top: '80%', left: '4%',  size: 16, delay: '0.9s' },
                { top: '45%', left: '96%', size: 12, delay: '1.8s' },
              ].map((s, i) => (
                <span
                  key={i}
                  className="star-pulse"
                  style={{
                    position: 'absolute',
                    top: s.top,
                    left: s.left,
                    fontSize: s.size,
                    animationDelay: s.delay,
                    color: '#FFD700',
                  }}
                >
                  ★
                </span>
              ))}
            </div>

            <div className="relative">

              {/* Badge */}
              <div className="flex justify-center mb-6">
                <span
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full"
                  style={{
                    background: 'rgba(255,215,0,0.15)',
                    border: '1px solid rgba(255,215,0,0.5)',
                    color: '#FFD700',
                  }}
                >
                  🥇 Eerste Kampioen Ooit
                </span>
              </div>

              {/* Seizoen */}
              <p
                className="text-center text-sm font-semibold uppercase tracking-widest mb-6"
                style={{ color: 'rgba(255,215,0,0.6)' }}
              >
                Seizoen 2025-26
              </p>

              {/* Trophy icon */}
              <div className="flex justify-center mb-6">
                <span className="trophy-glow">🏆</span>
              </div>

              {/* Naam & team */}
              <div className="text-center mb-6">
                <h2
                  className="text-3xl sm:text-4xl font-black text-white mb-1"
                  style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}
                >
                  Serge van &apos;t Westeinde
                </h2>
                <p className="text-white/50 text-sm font-semibold tracking-wide">
                  FC the Westend
                </p>
              </div>

              {/* Punten */}
              <div className="flex justify-center mb-8">
                <div
                  className="px-8 py-4 rounded-2xl text-center"
                  style={{
                    background: 'rgba(255,215,0,0.1)',
                    border: '1px solid rgba(255,215,0,0.25)',
                  }}
                >
                  <p
                    className="text-4xl font-black"
                    style={{ color: '#FFD700', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}
                  >
                    2357
                  </p>
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mt-1">
                    Totale punten
                  </p>
                </div>
              </div>

              {/* Scheidingslijn */}
              <div
                className="mb-8"
                style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.3), transparent)' }}
              />

              {/* Quote */}
              <blockquote
                className="text-center"
                style={{
                  borderLeft: 'none',
                  padding: 0,
                }}
              >
                <p
                  className="text-white/70 text-sm sm:text-base leading-relaxed italic mb-4"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  &ldquo;Bedankt heren van de podcast en alle deelnemers dit jaar. Tot het einde was het spannend maar met een mooie eindsprint lukte het me net om de anderen in te halen. Hopelijk gaan jullie komende jaren door met de content en blijven jullie doorgroeien. Tot volgend jaar!&rdquo;
                </p>
                <footer className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,215,0,0.7)' }}>
                  — Serge van &apos;t Westeinde, FC the Westend
                </footer>
              </blockquote>

            </div>
          </div>

          {/* ── VOLGENDE EDITIE ────────────────────────────────────── */}
          <div
            className="mt-12 rounded-2xl p-8 text-center"
            style={{
              background: 'rgba(0,250,97,0.05)',
              border: '1px solid rgba(0,250,97,0.15)',
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: '#00FA61' }}
            >
              Volgende editie
            </p>
            <h3 className="text-xl font-bold text-white mb-3">
              Wie kroont zich tot kampioen in 2026-27?
            </h3>
            <p className="text-white/50 text-sm mb-6 max-w-md mx-auto">
              Doe mee aan de Groene Pijl League en schrijf jouw naam in de geschiedenis.
            </p>
            <Link
              href="/rankings"
              className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl transition-all hover:opacity-90"
              style={{
                background: '#00FA61',
                color: '#1a1361',
                boxShadow: '0 0 20px rgba(0,250,97,0.25)',
              }}
            >
              <Trophy size={16} />
              Bekijk de huidige stand
            </Link>
          </div>

        </div>
      </section>
    </main>
  );
}

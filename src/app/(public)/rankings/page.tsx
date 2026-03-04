import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Trophy } from 'lucide-react';
import StandingsTable from '@/components/public/StandingsTable';
import type { LeagueApiResponse } from '@/app/api/fpl/league/route';

export const metadata: Metadata = {
  title: 'Mini-League Stand | De Groene Pijl',
  description: 'Bekijk de actuele stand van de De Groene Pijl FPL Mini-League.',
};

async function fetchStandings(): Promise<{ data: LeagueApiResponse | null; error: string | null }> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const res = await fetch(`${baseUrl}/api/fpl/league`, {
      next: { revalidate: 1800 },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { data: null, error: body.error ?? 'Stand tijdelijk niet beschikbaar.' };
    }

    const data: LeagueApiResponse = await res.json();
    return { data, error: null };
  } catch {
    return { data: null, error: 'Stand tijdelijk niet beschikbaar.' };
  }
}

export default async function RankingsPage() {
  const { data, error } = await fetchStandings();

  return (
    <main
      className="min-h-screen pt-24 pb-20 px-4"
      style={{ background: '#1F0E84' }}
    >
      <div className="max-w-4xl mx-auto">

        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium mb-8 transition-colors"
          style={{ color: 'rgba(0,250,97,0.7)' }}
        >
          <ArrowLeft size={14} />
          Terug naar home
        </Link>

        {/* Header */}
        <div className="flex items-start gap-4 mb-10">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(0,250,97,0.12)', border: '1px solid rgba(0,250,97,0.2)' }}
          >
            <Trophy size={22} style={{ color: '#00FA61' }} />
          </div>
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color: '#00FA61' }}
            >
              Mini-League
            </p>
            <h1
              className="text-4xl sm:text-5xl font-bold text-white leading-tight"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              MINI-LEAGUE STAND
            </h1>
            <p className="text-white/50 text-sm mt-2">
              {data?.league?.name ?? 'De Groene Pijl competitie'}
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ background: 'rgba(0,250,97,0.25)', border: '1.5px solid #00FA61' }}
            />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              De Groene Pijl managers
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">🥇🥈🥉</span>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Top 3
            </span>
          </div>
        </div>

        {/* Column header labels */}
        <div
          className="grid grid-cols-[40px_1fr_auto_auto_auto] gap-2 px-4 py-2 mb-1 text-[10px] font-semibold uppercase tracking-widest rounded-lg"
          style={{ color: 'rgba(0,250,97,0.6)', background: 'rgba(0,250,97,0.04)' }}
        >
          <span>#</span>
          <span>Team / Manager</span>
          <span className="text-right w-14">GW</span>
          <span className="text-right w-16">Totaal</span>
          <span className="text-center w-10">↕</span>
        </div>

        {/* Standings */}
        <StandingsTable
          initialData={data}
          initialError={error ?? undefined}
        />

        {/* Join league CTA */}
        <div
          className="mt-10 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{
            background: 'rgba(200,33,195,0.08)',
            border: '1px solid rgba(200,33,195,0.2)',
          }}
        >
          <div>
            <p className="text-white font-semibold text-sm">Doe mee aan de mini-league!</p>
            <p className="text-white/40 text-xs mt-0.5">
              Gebruik de auto-join link om direct mee te spelen.
            </p>
          </div>
          <a
            href="https://fantasy.premierleague.com/leagues/auto-join/t5mggi"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-xl transition-all flex-shrink-0"
            style={{
              background: '#00FA61',
              color: '#000',
              boxShadow: '0 0 20px rgba(0,250,97,0.3)',
            }}
          >
            Join Mini-League ⚽
          </a>
        </div>

      </div>
    </main>
  );
}

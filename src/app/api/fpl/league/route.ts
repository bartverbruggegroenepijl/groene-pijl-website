import { NextResponse } from 'next/server';
import type { LeagueApiResponse } from '@/lib/fpl/league';

// Re-export types for backward compat (client components may import from here)
export type { LeagueApiResponse, LeagueEntry } from '@/lib/fpl/league';

// ─── Config ───────────────────────────────────────────────────────────────────

/**
 * Set FPL_LEAGUE_ID in .env.local to your numeric mini-league ID.
 * Find it by opening your FPL mini-league standings and reading the URL:
 *   https://fantasy.premierleague.com/leagues/XXXXXX/standings/c
 * where XXXXXX is your league ID.
 */
const LEAGUE_ID = process.env.FPL_LEAGUE_ID;

const FPL_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  Referer: 'https://fantasy.premierleague.com/',
};

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  if (!LEAGUE_ID) {
    return NextResponse.json(
      {
        error: 'FPL_LEAGUE_ID niet geconfigureerd.',
        hint: 'Voeg FPL_LEAGUE_ID=<jouw league id> toe aan .env.local. Vind het in de URL van jouw mini-league standings op fantasy.premierleague.com.',
      },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') ?? '1', 10);

  try {
    const url = `https://fantasy.premierleague.com/api/leagues-classic/${LEAGUE_ID}/standings/?page_standings=${page}`;

    const res = await fetch(url, {
      next: { revalidate: 1800 }, // cache 30 minutes
      headers: FPL_HEADERS,
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `FPL API fout: ${res.status}` },
        { status: 502 }
      );
    }

    const data: LeagueApiResponse = await res.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    });
  } catch (err) {
    console.error('[/api/fpl/league] fetch error:', err);
    return NextResponse.json(
      { error: 'Kon de stand niet ophalen.' },
      { status: 500 }
    );
  }
}

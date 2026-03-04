/**
 * Direct FPL API utility — call this from Server Components instead of
 * fetching the internal /api/fpl/league route.
 *
 * Self-referential HTTP fetches (server → own API route) are unreliable on
 * Vercel: the server can't always reach itself during SSR, causing runtime
 * crashes even though the build succeeds.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LeagueEntry {
  id: number;
  event_total: number;   // GW points this round
  player_name: string;   // FPL manager name (first + last)
  rank: number;          // current rank
  last_rank: number;     // rank last gameweek (0 = new entry)
  rank_sort: number;
  total: number;         // total points
  entry: number;         // FPL team id
  entry_name: string;    // FPL team name
}

export interface LeagueApiResponse {
  league: {
    id: number;
    name: string;
    created: string;
    closed: boolean;
    admin_entry: number | null;
  };
  standings: {
    has_next: boolean;
    page: number;
    results: LeagueEntry[];
  };
}

// ─── Config ───────────────────────────────────────────────────────────────────

const FPL_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  Referer: 'https://fantasy.premierleague.com/',
};

// ─── Fetch utility ────────────────────────────────────────────────────────────

/**
 * Fetch mini-league standings directly from the FPL API.
 * Returns null silently when:
 *  - FPL_LEAGUE_ID is not configured
 *  - The FPL API is unreachable or returns an error
 *  - Any other unexpected error
 *
 * Safe to call from any Next.js Server Component or Route Handler.
 */
export async function fetchLeagueStandings(): Promise<LeagueApiResponse | null> {
  const leagueId = process.env.FPL_LEAGUE_ID;

  if (!leagueId) {
    // Not configured — rankings section will simply be hidden
    return null;
  }

  try {
    const url = `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`;

    const res = await fetch(url, {
      next: { revalidate: 1800 }, // ISR: revalidate every 30 minutes
      headers: FPL_HEADERS,
    });

    if (!res.ok) {
      console.warn(`[fetchLeagueStandings] FPL API returned ${res.status}`);
      return null;
    }

    const data = await res.json() as LeagueApiResponse;
    return data;
  } catch (err) {
    console.warn('[fetchLeagueStandings] error:', err);
    return null;
  }
}

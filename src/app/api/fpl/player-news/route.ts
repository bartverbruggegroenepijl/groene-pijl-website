import { NextResponse } from 'next/server';

// ─── FPL API types ────────────────────────────────────────────────────────────

interface FplApiPlayer {
  id: number;
  code: number;
  first_name: string;
  second_name: string;
  web_name: string;
  team: number;
  element_type: number;
  status: 'a' | 'i' | 'd' | 's' | 'u';
  news: string;
  news_added: string | null;
  chance_of_playing_next_round: number | null;
  chance_of_playing_this_round: number | null;
}

interface FplApiTeam {
  id: number;
  name: string;
  short_name: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const POSITION_MAP: Record<number, string> = {
  1: 'GK',
  2: 'DEF',
  3: 'MID',
  4: 'FWD',
};

const FPL_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  Referer: 'https://fantasy.premierleague.com/',
};

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const res = await fetch(
      'https://fantasy.premierleague.com/api/bootstrap-static/',
      {
        // Cache for 30 minutes — player news changes infrequently
        next: { revalidate: 1800 },
        headers: FPL_HEADERS,
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `FPL API antwoordde met status ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();

    // Build team id → { name, short } map
    const teamMap: Record<number, { name: string; short: string }> = {};
    (data.teams as FplApiTeam[]).forEach((t) => {
      teamMap[t.id] = { name: t.name, short: t.short_name };
    });

    // Filter to players with a non-empty news string, sort newest first
    const players = (data.elements as FplApiPlayer[])
      .filter((p) => p.news && p.news.trim() !== '')
      .sort((a, b) => {
        const da = a.news_added ? new Date(a.news_added).getTime() : 0;
        const db = b.news_added ? new Date(b.news_added).getTime() : 0;
        return db - da;
      })
      .map((p) => ({
        id:           p.id,
        name:         p.web_name,
        fullName:     `${p.first_name} ${p.second_name}`,
        team:         teamMap[p.team]?.short ?? '',
        teamFull:     teamMap[p.team]?.name  ?? '',
        position:     POSITION_MAP[p.element_type] ?? 'FWD',
        status:       p.status,
        news:         p.news,
        newsAdded:    p.news_added,
        chanceOfPlaying: p.chance_of_playing_next_round,
      }));

    return NextResponse.json(
      { players },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
        },
      }
    );
  } catch (err) {
    console.error('FPL player-news fetch error:', err);
    return NextResponse.json(
      { error: 'Kon spelersnieuws niet ophalen' },
      { status: 500 }
    );
  }
}

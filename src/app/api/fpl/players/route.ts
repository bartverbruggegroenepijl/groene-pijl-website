import { NextResponse } from 'next/server';

interface FplApiPlayer {
  id: number;
  code: number;
  photo: string;      // e.g. "80201.jpg" — empty string means no photo available
  first_name: string;
  second_name: string;
  web_name: string;
  team: number;
  element_type: number;
  total_points: number;
  event_points: number;
  now_cost: number;
  selected_by_percent: string;  // bijv. "18.5"
  goals_scored: number;
  assists: number;
  minutes: number;
  clean_sheets: number;
  expected_goals: string;       // bijv. "2.45"
}

interface FplApiTeam {
  id: number;
  short_name: string;
}

const POSITION_MAP: Record<number, 'GK' | 'DEF' | 'MID' | 'FWD'> = {
  1: 'GK',
  2: 'DEF',
  3: 'MID',
  4: 'FWD',
};

export async function GET() {
  try {
    const res = await fetch(
      'https://fantasy.premierleague.com/api/bootstrap-static/',
      {
        // Cache for 1 hour via Next.js fetch cache
        next: { revalidate: 3600 },
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
            '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          Referer: 'https://fantasy.premierleague.com/',
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `FPL API antwoordde met status ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();

    // Build team id → short name map
    const teamMap: Record<number, string> = {};
    (data.teams as FplApiTeam[]).forEach((t) => {
      teamMap[t.id] = t.short_name;
    });

    // Map players to our format
    const players = (data.elements as FplApiPlayer[]).map((p) => {
      // Only build a photo URL when the FPL API confirms a photo exists.
      // The `photo` field is e.g. "80201.jpg"; empty string means no photo.
      const imageUrl = p.photo
        ? `https://resources.premierleague.com/premierleague/photos/players/110x140/p${p.code}.png`
        : null;

      return {
        id: p.id,
        code: p.code,
        name: p.web_name,
        fullName: `${p.first_name} ${p.second_name}`,
        team: teamMap[p.team] ?? '',
        teamId: p.team,
        position: POSITION_MAP[p.element_type] ?? 'FWD',
        totalPoints: p.total_points,
        eventPoints: p.event_points,
        price: p.now_cost / 10,
        imageUrl,
        ownership: p.selected_by_percent,
        goals: p.goals_scored,
        assists: p.assists,
        minutes: p.minutes,
        cleanSheets: p.clean_sheets,
        xGoals: p.expected_goals,
      };
    });

    return NextResponse.json(
      { players },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (err) {
    console.error('FPL fetch error:', err);
    return NextResponse.json(
      { error: 'Kon FPL data niet ophalen' },
      { status: 500 }
    );
  }
}

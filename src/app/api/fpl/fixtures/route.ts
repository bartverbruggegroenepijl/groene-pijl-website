import { NextResponse } from 'next/server';

const FPL_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  Referer: 'https://fantasy.premierleague.com/',
};

interface FplFixture {
  event: number | null;
  team_h: number;
  team_a: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
  finished: boolean;
}

interface FplTeam {
  id: number;
  name: string;
  short_name: string;
}

interface FplEvent {
  id: number;
  deadline_time: string;
  is_current: boolean;
  is_next: boolean;
}

export interface FixtureCell {
  gw: number;
  opponent: string;
  location: 'H' | 'A';
  difficulty: number;
}

export interface TeamFDR {
  id: number;
  name: string;
  shortName: string;
  fixtures: FixtureCell[];
  avgDifficulty: number;
}

export async function GET() {
  try {
    const [bootstrapRes, fixturesRes] = await Promise.all([
      fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
        next: { revalidate: 3600 },
        headers: FPL_HEADERS,
      }),
      fetch('https://fantasy.premierleague.com/api/fixtures/', {
        next: { revalidate: 3600 },
        headers: FPL_HEADERS,
      }),
    ]);

    if (!bootstrapRes.ok || !fixturesRes.ok) {
      return NextResponse.json(
        { error: `FPL API fout: bootstrap=${bootstrapRes.status} fixtures=${fixturesRes.status}` },
        { status: 502 }
      );
    }

    const bootstrap = await bootstrapRes.json();
    const allFixtures: FplFixture[] = await fixturesRes.json();

    const teams: FplTeam[] = bootstrap.teams;
    const events: FplEvent[] = bootstrap.events;

    // Start vanaf de VOLGENDE gameweek (huidige GW niet meer tonen)
    const currentEvent = events.find((e) => e.is_current);
    const nextEvent    = events.find((e) => e.is_next);
    const nextGW       = nextEvent?.id ?? (currentEvent ? currentEvent.id + 1 : 1);

    // Alle resterende GWs van nextGW tot en met GW38
    const gwRange = Array.from(
      { length: Math.max(0, 38 - nextGW + 1) },
      (_, i) => nextGW + i,
    ).filter((gw) => gw >= 1 && gw <= 38);

    // Team lookup map
    const teamMap: Record<number, FplTeam> = {};
    teams.forEach((t) => { teamMap[t.id] = t; });

    // Build fixtures per team for the 6 GWs
    const teamFixturesMap: Record<number, FixtureCell[]> = {};
    teams.forEach((t) => { teamFixturesMap[t.id] = []; });

    allFixtures
      .filter((f) => f.event !== null && gwRange.includes(f.event!))
      .forEach((f) => {
        const gw = f.event!;
        teamFixturesMap[f.team_h].push({
          gw,
          opponent: teamMap[f.team_a]?.short_name ?? '?',
          location: 'H',
          difficulty: f.team_h_difficulty,
        });
        teamFixturesMap[f.team_a].push({
          gw,
          opponent: teamMap[f.team_h]?.short_name ?? '?',
          location: 'A',
          difficulty: f.team_a_difficulty,
        });
      });

    // Deadline per GW
    const eventDeadlines: Record<number, string> = {};
    (events as FplEvent[]).forEach((e) => {
      if (gwRange.includes(e.id)) eventDeadlines[e.id] = e.deadline_time;
    });

    const result: TeamFDR[] = teams.map((t) => {
      const fixtures = (teamFixturesMap[t.id] ?? []).sort((a, b) => a.gw - b.gw);
      const avgDifficulty =
        fixtures.length > 0
          ? fixtures.reduce((sum, f) => sum + f.difficulty, 0) / fixtures.length
          : 5;
      return { id: t.id, name: t.name, shortName: t.short_name, fixtures, avgDifficulty };
    });

    return NextResponse.json(
      { teams: result, gameweeks: gwRange, eventDeadlines },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (err) {
    console.error('FPL fixtures fetch error:', err);
    return NextResponse.json({ error: 'Kon fixtures niet ophalen' }, { status: 500 });
  }
}

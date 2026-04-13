// FPL fixtures utility — haalt eerstvolgende wedstrijd(en) per team op
// Ondersteunt DGW: retourneert alle fixtures in het volgende GW per team
// Gebruikt direct de FPL API (geen self-referential /api/... calls)

const FPL_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept:            'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  Referer:           'https://fantasy.premierleague.com/',
};

export interface NextFixture {
  gw:         number;
  opponent:   string; // Short name (bijv. "ARS", "CHE")
  location:   'H' | 'A';
  difficulty: number; // 1–5
}

interface FplFixture {
  event:              number | null;
  finished:           boolean;
  team_h:             number;
  team_a:             number;
  team_h_difficulty:  number;
  team_a_difficulty:  number;
}

interface FplTeam {
  id:         number;
  name:       string;
  short_name: string;
}

interface FplEvent {
  id:         number;
  is_current: boolean;
  is_next:    boolean;
}

/**
 * Geeft een Map terug die zowel via de volledige teamnaam (lowercase)
 * als via de korte naam (lowercase) ALLE fixtures in het volgende GW bevat.
 *
 * DGW: een team met twee wedstrijden in hetzelfde GW krijgt een array van 2 fixtures.
 *
 * Voorbeeld sleutels: "arsenal" → NextFixture[], "ars" → NextFixture[]
 *
 * Retourneert een lege Map bij een API-fout.
 */
export async function fetchNextFixturesMap(): Promise<Map<string, NextFixture[]>> {
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

    if (!bootstrapRes.ok || !fixturesRes.ok) return new Map();

    const bootstrap          = await bootstrapRes.json();
    const allFixtures: FplFixture[] = await fixturesRes.json();

    const teams:  FplTeam[]  = bootstrap.teams;
    const events: FplEvent[] = bootstrap.events;

    // Bepaal huidig / volgend GW
    const currentEvent = events.find((e) => e.is_current);
    const nextEvent    = events.find((e) => e.is_next);
    const startGW      = currentEvent?.id ?? nextEvent?.id ?? 1;

    // Team-lookup op id
    const teamById: Record<number, FplTeam> = {};
    teams.forEach((t) => { teamById[t.id] = t; });

    // Toekomstige fixtures (niet gespeeld), gesorteerd op GW
    const upcoming = allFixtures
      .filter((f) => f.event !== null && f.event >= startGW && !f.finished)
      .sort((a, b) => (a.event ?? 0) - (b.event ?? 0));

    // Bepaal het vroegste GW waarop elk team speelt
    const firstGwPerTeam: Record<number, number> = {};
    for (const f of upcoming) {
      if (!(f.team_h in firstGwPerTeam)) firstGwPerTeam[f.team_h] = f.event!;
      if (!(f.team_a in firstGwPerTeam)) firstGwPerTeam[f.team_a] = f.event!;
    }

    // Verzamel ALLE fixtures voor elk team in zijn vroegste GW (DGW support)
    const fixturesPerTeam: Record<number, NextFixture[]> = {};
    for (const f of upcoming) {
      // Thuisteam
      if (f.event === firstGwPerTeam[f.team_h]) {
        if (!fixturesPerTeam[f.team_h]) fixturesPerTeam[f.team_h] = [];
        fixturesPerTeam[f.team_h].push({
          gw:         f.event!,
          opponent:   teamById[f.team_a]?.short_name ?? '?',
          location:   'H',
          difficulty: f.team_h_difficulty,
        });
      }
      // Uitteam
      if (f.event === firstGwPerTeam[f.team_a]) {
        if (!fixturesPerTeam[f.team_a]) fixturesPerTeam[f.team_a] = [];
        fixturesPerTeam[f.team_a].push({
          gw:         f.event!,
          opponent:   teamById[f.team_h]?.short_name ?? '?',
          location:   'A',
          difficulty: f.team_a_difficulty,
        });
      }
    }

    // Bouw Map met zowel volledige naam als korte naam als sleutel
    const map = new Map<string, NextFixture[]>();
    for (const team of teams) {
      const fixes = fixturesPerTeam[team.id];
      if (fixes && fixes.length > 0) {
        map.set(team.name.toLowerCase(), fixes);
        map.set(team.short_name.toLowerCase(), fixes);
      }
    }

    return map;
  } catch {
    return new Map();
  }
}

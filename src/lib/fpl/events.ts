// FPL Gameweek / deadline utility
// Shared between the server (page.tsx, API routes) and test code.

export const FPL_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept:           'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  Referer:          'https://fantasy.premierleague.com/',
};

interface FplEvent {
  id:            number;
  deadline_time: string;
  is_current:    boolean;
  is_next:       boolean;
  finished:      boolean;
}

export interface GameweekInfo {
  currentGW:    number | null;
  nextGW:       number | null;
  nextDeadline: string | null; // ISO timestamp
}

export async function fetchGameweekInfo(): Promise<GameweekInfo> {
  try {
    const res = await fetch(
      'https://fantasy.premierleague.com/api/bootstrap-static/',
      { next: { revalidate: 300 }, headers: FPL_HEADERS }
    );
    if (!res.ok) return { currentGW: null, nextGW: null, nextDeadline: null };

    const data   = await res.json();
    const events = data.events as FplEvent[];

    const current = events.find((e) => e.is_current);

    // Eerstvolgende deadline: filter op deadline_time in de toekomst,
    // sorteer oplopend, pak de eerste. Dit werkt altijd — ook als is_next
    // nog niet gezet is door FPL tussen twee gameweeks in.
    const now = new Date().toISOString();
    const upcoming = events
      .filter((e) => e.deadline_time > now)
      .sort((a, b) => a.deadline_time.localeCompare(b.deadline_time));

    const next = upcoming[0] ?? null;

    return {
      currentGW:    current?.id         ?? null,
      nextGW:       next?.id            ?? null,
      nextDeadline: next?.deadline_time ?? null,
    };
  } catch {
    return { currentGW: null, nextGW: null, nextDeadline: null };
  }
}

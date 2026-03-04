// FPL Gameweek / deadline utility
// Shared between the server (page.tsx, API routes) and test code.

const FPL_HEADERS = {
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
      { next: { revalidate: 1800 }, headers: FPL_HEADERS }
    );
    if (!res.ok) return { currentGW: null, nextGW: null, nextDeadline: null };

    const data  = await res.json();
    const events = data.events as FplEvent[];

    const current = events.find((e) => e.is_current);
    const next    = events.find((e) => e.is_next);

    return {
      currentGW:    current?.id            ?? null,
      nextGW:       next?.id               ?? null,
      nextDeadline: next?.deadline_time    ?? null,
    };
  } catch {
    return { currentGW: null, nextGW: null, nextDeadline: null };
  }
}

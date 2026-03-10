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

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id || !/^\d+$/.test(id)) {
    return NextResponse.json({ error: 'Ongeldig speler-ID' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://fantasy.premierleague.com/api/element-summary/${id}/`,
      {
        // Cache 10 minuten — xG verandert alleen na een wedstrijd
        next: { revalidate: 600 },
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

    // Geef alleen het laatste item uit history[] terug om bandbreedte te sparen
    const history: Array<{ expected_goals: string; round: number; total_points: number }> =
      data.history ?? [];
    const last = history.length > 0 ? history[history.length - 1] : null;

    return NextResponse.json(
      {
        last_match: last
          ? {
              round: last.round,
              expected_goals: last.expected_goals,
              total_points: last.total_points,
            }
          : null,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        },
      }
    );
  } catch (err) {
    console.error('element-summary fetch error:', err);
    return NextResponse.json(
      { error: 'Kon element-summary niet ophalen' },
      { status: 500 }
    );
  }
}

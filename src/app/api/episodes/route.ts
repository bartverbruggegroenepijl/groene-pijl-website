import { NextResponse } from 'next/server';
import { fetchEpisodes } from '@/lib/episodes/feed';

// Force Node.js runtime – rss-parser requires it
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const episodes = await fetchEpisodes();
    return NextResponse.json(
      { episodes },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' } }
    );
  } catch (err) {
    console.error('RSS parse error:', err);
    return NextResponse.json(
      { error: 'Kon RSS feed niet laden' },
      { status: 500 }
    );
  }
}

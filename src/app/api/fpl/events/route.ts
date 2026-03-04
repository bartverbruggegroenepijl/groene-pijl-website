import { NextResponse } from 'next/server';
import { fetchGameweekInfo } from '@/lib/fpl/events';

export async function GET() {
  const info = await fetchGameweekInfo();
  return NextResponse.json(info, {
    headers: {
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
    },
  });
}

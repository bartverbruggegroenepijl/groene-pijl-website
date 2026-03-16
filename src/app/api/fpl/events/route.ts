import { NextResponse } from 'next/server';
import { fetchGameweekInfo } from '@/lib/fpl/events';

export async function GET() {
  const info = await fetchGameweekInfo();
  return NextResponse.json(info, {
    headers: {
      // 5 minuten cache zodat de counter na een deadline snel de volgende GW oppikt
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}

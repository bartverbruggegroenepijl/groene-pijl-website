/**
 * Vercel Cron Job — automatische RSS → Supabase sync
 *
 * Schedule: 2× per dag (zie vercel.json)
 * Auth:     Vercel stuurt automatisch `Authorization: Bearer $CRON_SECRET`
 * Client:   service-role key om RLS te omzeilen (geen user-sessie in cron context)
 */

import { createClient } from '@supabase/supabase-js';
import { fetchEpisodes } from '@/lib/episodes/feed';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // ── Auth: verifieer CRON_SECRET ────────────────────────────────
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Supabase service-role client (bypass RLS) ──────────────────
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return Response.json(
      { error: 'NEXT_PUBLIC_SUPABASE_URL of SUPABASE_SERVICE_ROLE_KEY ontbreekt' },
      { status: 500 },
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // ── 1. Haal RSS feed op ────────────────────────────────────────
    const episodes = await fetchEpisodes();

    // ── 2. Bestaande spotify_ids ophalen ───────────────────────────
    const { data: existing, error: fetchError } = await supabase
      .from('episodes')
      .select('spotify_id');

    if (fetchError) throw new Error(fetchError.message);

    const savedIds = new Set(
      (existing ?? []).map((r: { spotify_id: string }) => r.spotify_id),
    );

    // ── 3. Filter: alleen nieuwe afleveringen ──────────────────────
    const newEpisodes = episodes.filter(
      (ep) => ep.guid && !savedIds.has(ep.guid),
    );

    if (newEpisodes.length === 0) {
      console.log('[cron/sync-episodes] Alles al gesynchroniseerd');
      return Response.json({ inserted: 0, message: 'Alles al gesynchroniseerd' });
    }

    // ── 4. Insert nieuwe rijen ─────────────────────────────────────
    const rows = newEpisodes.map((ep) => ({
      spotify_id:   ep.guid,
      title:        ep.title,
      description:  ep.description  || null,
      duration:     ep.duration     || null,
      published_at: ep.pubDate      || null,
      spotify_url:  ep.spotifyUrl   || null,
      image_url:    ep.imageUrl     || null,
    }));

    const { error: insertError } = await supabase.from('episodes').insert(rows);
    if (insertError) throw new Error(insertError.message);

    console.log(`[cron/sync-episodes] ${newEpisodes.length} nieuwe afleveringen gesynchroniseerd`);
    return Response.json({ inserted: newEpisodes.length });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Onbekende fout';
    console.error('[cron/sync-episodes] Fout:', message);
    return Response.json({ error: message }, { status: 500 });
  }
}

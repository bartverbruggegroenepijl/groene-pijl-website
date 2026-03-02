'use server';

import { createClient } from '@/lib/supabase/server';
import { fetchEpisodes } from '@/lib/episodes/feed';
import { revalidatePath } from 'next/cache';
import type { RssEpisode } from '@/lib/episodes/feed';

// ─── Sync all (RSS → Supabase, skip duplicates) ───────────────

export async function syncAllEpisodes(): Promise<{ inserted: number }> {
  const supabase = createClient();

  // Fetch RSS feed
  const episodes = await fetchEpisodes();

  // Fetch all already-saved spotify_ids
  const { data: existing, error: fetchError } = await supabase
    .from('episodes')
    .select('spotify_id');

  if (fetchError) throw new Error(fetchError.message);

  const savedIds = new Set((existing ?? []).map((r) => r.spotify_id));

  // Only insert new episodes
  const newEpisodes = episodes.filter((ep) => ep.guid && !savedIds.has(ep.guid));

  if (newEpisodes.length === 0) {
    return { inserted: 0 };
  }

  const rows = newEpisodes.map((ep) => ({
    spotify_id:   ep.guid,
    title:        ep.title,
    description:  ep.description,
    duration:     ep.duration || null,
    published_at: ep.pubDate || null,
    spotify_url:  ep.spotifyUrl || null,
    image_url:    ep.imageUrl  || null,
  }));

  const { error } = await supabase.from('episodes').insert(rows);
  if (error) throw new Error(error.message);

  revalidatePath('/admin/afleveringen');
  return { inserted: newEpisodes.length };
}

// ─── Save single episode ──────────────────────────────────────

export async function saveEpisode(episode: RssEpisode): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from('episodes').upsert(
    {
      spotify_id:   episode.guid,
      title:        episode.title,
      description:  episode.description,
      duration:     episode.duration || null,
      published_at: episode.pubDate  || null,
      spotify_url:  episode.spotifyUrl || null,
      image_url:    episode.imageUrl   || null,
    },
    { onConflict: 'spotify_id' }
  );

  if (error) throw new Error(error.message);
  revalidatePath('/admin/afleveringen');
}

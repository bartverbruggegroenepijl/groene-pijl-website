'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

interface CaptainPickPlayerData {
  rank: number;
  player_name: string;
  player_club: string;
  position: string;
  motivation: string;
  fpl_player_id: number;
  image_url: string | null;
}

function parseCaptainPickFormData(formData: FormData) {
  const gameweek  = formData.get('gameweek')
    ? parseInt(formData.get('gameweek') as string, 10)
    : null;
  const season    = (formData.get('season') as string) || null;
  const published = formData.get('published') === 'true';
  const playersJson = (formData.get('players') as string) || '[]';
  const players: CaptainPickPlayerData[] = JSON.parse(playersJson);
  return { gameweek, season, published, players };
}

// ─── Create ──────────────────────────────────────────────────

export async function createCaptainPick(formData: FormData): Promise<void> {
  const supabase = createClient();
  const { gameweek, season, published, players } = parseCaptainPickFormData(formData);

  const { data: pick, error: pickError } = await supabase
    .from('captain_picks')
    .insert({ gameweek, season, published })
    .select('id')
    .single();

  if (pickError || !pick) {
    throw new Error(pickError?.message ?? 'Kon captain keuze niet aanmaken');
  }

  if (players.length > 0) {
    const rows = players.map((p) => ({ ...p, captain_pick_id: pick.id }));
    const { error } = await supabase.from('captain_pick_players').insert(rows);
    if (error) throw new Error(error.message);
  }

  revalidatePath('/admin/captain-keuze');
  redirect('/admin/captain-keuze');
}

// ─── Delete ──────────────────────────────────────────────────

export async function deleteCaptainPick(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('captain_picks')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/captain-keuze');
}

// ─── Toggle publish ──────────────────────────────────────────

export async function togglePublishCaptainPick(
  id: string,
  published: boolean
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('captain_picks')
    .update({ published })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/captain-keuze');
}

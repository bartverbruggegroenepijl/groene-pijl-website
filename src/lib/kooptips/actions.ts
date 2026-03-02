'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

interface BuyTipPlayerData {
  player_name: string;
  player_club: string;
  position: string;
  price: number;
  motivation: string;
  fpl_player_id: number;
  image_url: string | null;
}

function parseBuyTipFormData(formData: FormData) {
  const gameweek  = formData.get('gameweek')
    ? parseInt(formData.get('gameweek') as string, 10)
    : null;
  const season    = (formData.get('season') as string) || null;
  const published = formData.get('published') === 'true';
  const playersJson = (formData.get('players') as string) || '[]';
  const players: BuyTipPlayerData[] = JSON.parse(playersJson);
  return { gameweek, season, published, players };
}

// ─── Create ──────────────────────────────────────────────────

export async function createBuyTip(formData: FormData): Promise<void> {
  const supabase = createClient();
  const { gameweek, season, published, players } = parseBuyTipFormData(formData);

  const { data: tip, error: tipError } = await supabase
    .from('buy_tips')
    .insert({ gameweek, season, published })
    .select('id')
    .single();

  if (tipError || !tip) {
    throw new Error(tipError?.message ?? 'Kon kooptips niet aanmaken');
  }

  if (players.length > 0) {
    const rows = players.map((p) => ({ ...p, buy_tip_id: tip.id }));
    const { error } = await supabase.from('buy_tip_players').insert(rows);
    if (error) throw new Error(error.message);
  }

  revalidatePath('/admin/kooptips');
  redirect('/admin/kooptips');
}

// ─── Delete ──────────────────────────────────────────────────

export async function deleteBuyTip(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('buy_tips')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/kooptips');
}

// ─── Toggle publish ──────────────────────────────────────────

export async function togglePublishBuyTip(
  id: string,
  published: boolean
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('buy_tips')
    .update({ published })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/kooptips');
}

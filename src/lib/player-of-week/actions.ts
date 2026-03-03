'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// ─── Create ─────────────────────────────────────────────────

export async function createPlayerOfWeek(formData: FormData): Promise<void> {
  const supabase = createClient();

  const gameweek    = formData.get('gameweek')    ? Number(formData.get('gameweek'))    : null;
  const season      = (formData.get('season')     as string)?.trim() || null;
  const player_name = (formData.get('player_name') as string)?.trim() || null;
  const player_club = (formData.get('player_club') as string)?.trim() || null;
  const position    = (formData.get('position')   as string)?.trim() || null;
  const points      = formData.get('points')   ? Number(formData.get('points'))   : null;
  const goals       = formData.get('goals')    ? Number(formData.get('goals'))    : null;
  const assists     = formData.get('assists')  ? Number(formData.get('assists'))  : null;
  const bonus       = formData.get('bonus')    ? Number(formData.get('bonus'))    : null;
  const motivatie   = (formData.get('motivatie') as string)?.trim() || null;
  const image_url   = (formData.get('image_url')  as string)?.trim() || null;
  const published   = formData.get('published') === 'true';

  if (!player_name) throw new Error('Spelernaam is verplicht.');

  const { error } = await supabase
    .from('player_of_the_week')
    .insert({ gameweek, season, player_name, player_club, position, points, goals, assists, bonus, motivatie, image_url, published });

  if (error) throw new Error(error.message);

  revalidatePath('/admin/speler-van-de-week');
  revalidatePath('/');
  redirect('/admin/speler-van-de-week');
}

// ─── Delete ─────────────────────────────────────────────────

export async function deletePlayerOfWeek(id: string): Promise<void> {
  const supabase = createClient();

  const { data } = await supabase
    .from('player_of_the_week')
    .select('image_url')
    .eq('id', id)
    .single();

  if (data?.image_url) {
    const marker = '/object/public/player-images/';
    const idx = data.image_url.indexOf(marker);
    if (idx !== -1) {
      const path = decodeURIComponent(data.image_url.slice(idx + marker.length));
      await supabase.storage.from('player-images').remove([path]);
    }
  }

  const { error } = await supabase
    .from('player_of_the_week')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/speler-van-de-week');
  revalidatePath('/');
}

// ─── Toggle publish ──────────────────────────────────────────

export async function togglePublishPlayerOfWeek(id: string, published: boolean): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('player_of_the_week')
    .update({ published })
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/speler-van-de-week');
  revalidatePath('/');
}

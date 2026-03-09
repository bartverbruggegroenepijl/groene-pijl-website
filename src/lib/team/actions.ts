'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

interface PlayerData {
  player_name: string;
  player_club: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  points: number;
  is_star_player: boolean;
  player_image_url: string;
}

function parseTeamFormData(formData: FormData) {
  const week_number = formData.get('week_number')
    ? parseInt(formData.get('week_number') as string, 10)
    : null;
  const season      = (formData.get('season') as string) || null;
  const formation   = (formData.get('formation') as string) || null;
  const published   = formData.get('published') === 'true';
  const playersJson = (formData.get('players') as string) || '[]';
  const players: PlayerData[] = JSON.parse(playersJson);
  return { week_number, season, formation, published, players };
}

// ─── Create ──────────────────────────────────────────────────

export async function createTeam(formData: FormData): Promise<void> {
  const supabase = createClient();
  const { week_number, season, formation, published, players } =
    parseTeamFormData(formData);

  const { data: team, error: teamError } = await supabase
    .from('team_of_the_week')
    .insert({ week_number, season, formation, published })
    .select('id')
    .single();

  if (teamError || !team) {
    throw new Error(teamError?.message ?? 'Kon team niet aanmaken');
  }

  if (players.length > 0) {
    const rows = players.map((p) => ({ ...p, team_id: team.id }));
    const { error } = await supabase.from('team_players').insert(rows);
    if (error) throw new Error(error.message);
  }

  revalidatePath('/admin/team-van-de-week');
  redirect('/admin/team-van-de-week');
}

// ─── Update ──────────────────────────────────────────────────

export async function updateTeam(id: string, formData: FormData): Promise<void> {
  const supabase = createClient();
  const { week_number, season, formation, published, players } =
    parseTeamFormData(formData);

  const { error: teamError } = await supabase
    .from('team_of_the_week')
    .update({ week_number, season, formation, published })
    .eq('id', id);

  if (teamError) throw new Error(teamError.message);

  // Replace all players: delete existing, insert new
  await supabase.from('team_players').delete().eq('team_id', id);

  if (players.length > 0) {
    const rows = players.map((p) => ({ ...p, team_id: id }));
    const { error } = await supabase.from('team_players').insert(rows);
    if (error) throw new Error(error.message);
  }

  revalidatePath('/admin/team-van-de-week');
  revalidatePath(`/admin/team-van-de-week/${id}/bewerken`);
  redirect('/admin/team-van-de-week');
}

// ─── Delete ──────────────────────────────────────────────────

export async function deleteTeam(id: string): Promise<void> {
  const supabase = createClient();
  // team_players are cascade-deleted by the FK constraint
  const { error } = await supabase
    .from('team_of_the_week')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/team-van-de-week');
}

// ─── Toggle publish ──────────────────────────────────────────

export async function togglePublishTeam(
  id: string,
  published: boolean
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('team_of_the_week')
    .update({ published })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/team-van-de-week');
}

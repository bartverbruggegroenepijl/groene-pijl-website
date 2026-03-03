import { createClient } from '@/lib/supabase/server';
import { updateCaptainPick } from '@/lib/captain/actions';
import CaptainPickBuilder from '@/components/admin/CaptainPickBuilder';
import { notFound } from 'next/navigation';
import type { CaptainPick, CaptainPickPlayer } from '@/types';

interface BewerkenPageProps {
  params: { id: string };
}

export default async function BewerkenCaptainKeuzePage({ params }: BewerkenPageProps) {
  const supabase = createClient();

  const [{ data: pick, error: pickError }, { data: players }] = await Promise.all([
    supabase
      .from('captain_picks')
      .select('*')
      .eq('id', params.id)
      .single(),
    supabase
      .from('captain_pick_players')
      .select('*')
      .eq('captain_pick_id', params.id)
      .order('rank'),
  ]);

  if (pickError || !pick) {
    notFound();
  }

  const updateCaptainPickWithId = updateCaptainPick.bind(null, params.id);

  return (
    <CaptainPickBuilder
      existingPick={pick as CaptainPick}
      existingPlayers={(players ?? []) as CaptainPickPlayer[]}
      action={updateCaptainPickWithId}
      mode="bewerken"
    />
  );
}

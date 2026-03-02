import { createClient } from '@/lib/supabase/server';
import { updateTeam } from '@/lib/team/actions';
import TeamBuilder from '@/components/admin/TeamBuilder';
import { notFound } from 'next/navigation';
import type { TeamOfTheWeek, TeamPlayer } from '@/types';

interface BewerkenPageProps {
  params: { id: string };
}

export default async function BewerkenTeamPage({ params }: BewerkenPageProps) {
  const supabase = createClient();

  const [{ data: team, error: teamError }, { data: players }] = await Promise.all([
    supabase
      .from('team_of_the_week')
      .select('*')
      .eq('id', params.id)
      .single(),
    supabase
      .from('team_players')
      .select('*')
      .eq('team_id', params.id)
      .order('position'),
  ]);

  if (teamError || !team) {
    notFound();
  }

  const updateTeamWithId = updateTeam.bind(null, params.id);

  return (
    <TeamBuilder
      existingTeam={team as TeamOfTheWeek}
      existingPlayers={(players ?? []) as TeamPlayer[]}
      action={updateTeamWithId}
      mode="bewerken"
    />
  );
}

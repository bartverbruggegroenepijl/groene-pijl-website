import { createTeam } from '@/lib/team/actions';
import TeamBuilder from '@/components/admin/TeamBuilder';

export default function NieuwTeamPage() {
  return (
    <TeamBuilder
      action={createTeam}
      mode="nieuw"
    />
  );
}

import { createPlayerOfWeek } from '@/lib/player-of-week/actions';
import PlayerOfWeekForm from '@/components/admin/PlayerOfWeekForm';

export default function NieuweSpelerVanDeWeekPage() {
  return (
    <PlayerOfWeekForm action={createPlayerOfWeek} />
  );
}

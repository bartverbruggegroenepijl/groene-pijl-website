'use client';

import { useTransition } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { deletePlayerOfWeek } from '@/lib/player-of-week/actions';

interface DeletePlayerOfWeekButtonProps {
  id: string;
  gameweek: number | null;
}

export default function DeletePlayerOfWeekButton({ id, gameweek }: DeletePlayerOfWeekButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const label = gameweek ? `GW ${gameweek}` : 'deze speler';
    if (!confirm(`Weet je zeker dat je de Speler van de Week (${label}) wilt verwijderen?`)) {
      return;
    }
    startTransition(async () => {
      await deletePlayerOfWeek(id);
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      title="Verwijderen"
      className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10
                 rounded-md transition-all disabled:opacity-50"
    >
      {isPending
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : <Trash2 className="w-4 h-4" />
      }
    </button>
  );
}

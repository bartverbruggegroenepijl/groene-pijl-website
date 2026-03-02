'use client';

import { useTransition } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteTeam } from '@/lib/team/actions';

interface DeleteTeamButtonProps {
  id: string;
  weekNumber: number | null;
}

export default function DeleteTeamButton({ id, weekNumber }: DeleteTeamButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const label = weekNumber ? `Gameweek ${weekNumber}` : 'dit team';
    if (!confirm(`Weet je zeker dat je ${label} wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`)) {
      return;
    }
    startTransition(async () => {
      await deleteTeam(id);
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

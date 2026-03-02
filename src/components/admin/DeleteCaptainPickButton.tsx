'use client';

import { useTransition } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteCaptainPick } from '@/lib/captain/actions';

interface DeleteCaptainPickButtonProps {
  id: string;
  gameweek: number | null;
}

export default function DeleteCaptainPickButton({ id, gameweek }: DeleteCaptainPickButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const label = gameweek ? `GW ${gameweek}` : 'deze captain keuze';
    if (!confirm(`Weet je zeker dat je de captain keuze voor ${label} wilt verwijderen?`)) return;

    startTransition(async () => {
      await deleteCaptainPick(id);
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      title="Verwijderen"
      className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10
                 rounded-md transition-all disabled:opacity-40"
    >
      {isPending
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : <Trash2 className="w-4 h-4" />
      }
    </button>
  );
}

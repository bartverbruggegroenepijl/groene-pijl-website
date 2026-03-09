'use client';

import { useTransition } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteBuyTip } from '@/lib/kooptips/actions';

interface DeleteBuyTipButtonProps {
  id: string;
  gameweek: number | null;
}

export default function DeleteBuyTipButton({ id, gameweek }: DeleteBuyTipButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const label = gameweek ? `GW ${gameweek}` : 'deze transfertips';
    if (!confirm(`Weet je zeker dat je de transfertips voor ${label} wilt verwijderen?`)) return;

    startTransition(async () => {
      await deleteBuyTip(id);
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

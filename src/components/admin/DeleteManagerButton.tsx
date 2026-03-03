'use client';

import { useTransition } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteManager } from '@/lib/managers/actions';

interface DeleteManagerButtonProps {
  id: string;
  name: string;
}

export default function DeleteManagerButton({ id, name }: DeleteManagerButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Weet je zeker dat je "${name}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`)) {
      return;
    }
    startTransition(async () => {
      await deleteManager(id);
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      title="Verwijderen"
      className="flex items-center gap-1.5 text-xs font-medium text-gray-600
                 hover:text-red-400 transition-colors disabled:opacity-50"
    >
      {isPending
        ? <Loader2 className="w-3 h-3 animate-spin" />
        : <Trash2 className="w-3 h-3" />
      }
      {isPending ? 'Verwijderen...' : 'Verwijderen'}
    </button>
  );
}

'use client';

import { useTransition } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteArticle } from '@/lib/articles/actions';

interface DeleteArticleButtonProps {
  id: string;
  title: string;
}

export default function DeleteArticleButton({ id, title }: DeleteArticleButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Weet je zeker dat je "${title}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`)) {
      return;
    }
    startTransition(async () => {
      await deleteArticle(id);
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

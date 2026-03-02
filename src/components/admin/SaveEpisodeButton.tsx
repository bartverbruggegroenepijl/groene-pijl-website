'use client';

import { useState, useTransition } from 'react';
import { Check, Loader2, BookmarkPlus } from 'lucide-react';

interface SaveEpisodeButtonProps {
  isSaved: boolean;
  action:  () => Promise<void>;
}

export default function SaveEpisodeButton({ isSaved: initialSaved, action }: SaveEpisodeButtonProps) {
  const [saved, setSaved]            = useState(initialSaved);
  const [isPending, startTransition] = useTransition();
  const [error, setError]            = useState('');

  // Already saved
  if (saved) {
    return (
      <span className="flex items-center gap-1.5 text-[#00A651] text-xs font-medium
                       bg-[#00A651]/10 border border-[#00A651]/25 px-3 py-1.5 rounded-full">
        <Check className="w-3.5 h-3.5" />
        Opgeslagen
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            try {
              await action();
              setSaved(true);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Opslaan mislukt');
              setTimeout(() => setError(''), 4000);
            }
          })
        }
        className="flex items-center gap-1.5 bg-[#00A651] hover:bg-[#009147]
                   text-white text-xs font-semibold px-3 py-1.5 rounded-full
                   transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <BookmarkPlus className="w-3.5 h-3.5" />
        }
        {isPending ? 'Opslaan...' : 'Opslaan'}
      </button>

      {error && (
        <span className="text-red-400 text-xs">{error}</span>
      )}
    </div>
  );
}

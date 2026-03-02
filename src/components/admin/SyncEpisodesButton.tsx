'use client';

import { useState, useTransition } from 'react';
import { RefreshCw, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { syncAllEpisodes } from '@/lib/episodes/actions';

export default function SyncEpisodesButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult]          = useState<{ inserted: number } | null>(null);
  const [syncError, setSyncError]    = useState('');

  function handleSync() {
    setResult(null);
    setSyncError('');

    startTransition(async () => {
      try {
        const res = await syncAllEpisodes();
        setResult(res);
        // Auto-hide feedback after 5s
        setTimeout(() => setResult(null), 5000);
      } catch (err) {
        setSyncError(err instanceof Error ? err.message : 'Synchronisatie mislukt');
        setTimeout(() => setSyncError(''), 5000);
      }
    });
  }

  return (
    <div className="flex items-center gap-3">

      {/* Feedback */}
      {result !== null && !isPending && (
        <span className="flex items-center gap-1.5 text-[#00A651] text-sm font-medium">
          <CheckCircle className="w-4 h-4" />
          {result.inserted === 0
            ? 'Al up-to-date'
            : `${result.inserted} nieuwe ${result.inserted === 1 ? 'aflevering' : 'afleveringen'} toegevoegd`
          }
        </span>
      )}

      {syncError && !isPending && (
        <span className="flex items-center gap-1.5 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {syncError}
        </span>
      )}

      {/* Button */}
      <button
        type="button"
        onClick={handleSync}
        disabled={isPending}
        className="flex items-center gap-2 bg-white/8 hover:bg-white/12 border border-white/10
                   text-white font-medium px-4 py-2.5 rounded-lg text-sm
                   transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <RefreshCw className="w-4 h-4" />
        }
        {isPending ? 'Synchroniseren...' : 'Synchroniseer RSS'}
      </button>
    </div>
  );
}

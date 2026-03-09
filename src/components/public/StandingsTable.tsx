'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowUp, ArrowDown, Minus, RefreshCw, Loader2 } from 'lucide-react';
import type { LeagueApiResponse, LeagueEntry } from '@/lib/fpl/league';

// ─── Config ───────────────────────────────────────────────────────────────────

/** Exacte volledige namen van De Groene Pijl managers */
const MANAGER_FULL_NAMES = [
  'bart verbrugge',
  'jeffrey nederlof',
  'thomas verbrugge',
  'kieran walsh',
];

const isManager = (playerName: string) => {
  const lower = playerName.toLowerCase().trim();
  return MANAGER_FULL_NAMES.includes(lower);
};

const MEDAL = ['🥇', '🥈', '🥉'];

// ─── Movement badge ────────────────────────────────────────────────────────────

function MovementBadge({ rank, lastRank }: { rank: number; lastRank: number }) {
  if (lastRank === 0) {
    return <span className="text-xs text-white/30 font-medium">Nieuw</span>;
  }
  const diff = lastRank - rank;
  if (diff > 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs font-bold" style={{ color: '#00FA61' }}>
        <ArrowUp size={12} />
        {diff}
      </span>
    );
  }
  if (diff < 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs font-bold text-red-400">
        <ArrowDown size={12} />
        {Math.abs(diff)}
      </span>
    );
  }
  return <Minus size={14} className="text-white/30" />;
}

// ─── Main component ───────────────────────────────────────────────────────────

interface StandingsTableProps {
  initialData: LeagueApiResponse | null;
  initialError?: string;
  /** Maximum number of rows to show (undefined = all) */
  limit?: number;
  /** Compact mode for homepage preview */
  compact?: boolean;
}

export default function StandingsTable({
  initialData,
  initialError,
  limit,
  compact = false,
}: StandingsTableProps) {
  const [data, setData] = useState<LeagueApiResponse | null>(initialData);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(initialData ? new Date() : null);

  // Pagination state
  const [allResults, setAllResults] = useState<LeagueEntry[]>(
    initialData?.standings.results ?? []
  );
  const [hasNext, setHasNext] = useState(initialData?.standings.has_next ?? false);
  const [nextPage, setNextPage] = useState(2);
  const [loadingMore, setLoadingMore] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/fpl/league', { cache: 'no-store' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'Stand tijdelijk niet beschikbaar.');
      } else {
        const json: LeagueApiResponse = await res.json();
        setData(json);
        setAllResults(json.standings.results);
        setHasNext(json.standings.has_next);
        setNextPage(2);
        setError(null);
        setLastUpdated(new Date());
      }
    } catch {
      setError('Stand tijdelijk niet beschikbaar.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/fpl/league?page=${nextPage}`, { cache: 'no-store' });
      if (res.ok) {
        const json: LeagueApiResponse = await res.json();
        setAllResults((prev) => [...prev, ...json.standings.results]);
        setHasNext(json.standings.has_next);
        setNextPage((n) => n + 1);
      }
    } catch {
      // Silently fail — keep existing results
    } finally {
      setLoadingMore(false);
    }
  }, [nextPage]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const id = setInterval(refresh, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [refresh]);

  // ── Error state ──────────────────────────────────────────────────────────────
  if (error && !data) {
    return (
      <div
        className="rounded-2xl p-8 text-center"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <p className="text-white/50 text-sm mb-3">Stand tijdelijk niet beschikbaar</p>
        <button
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          style={{ background: 'rgba(0,250,97,0.1)', color: '#00FA61', border: '1px solid rgba(0,250,97,0.2)' }}
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Opnieuw proberen
        </button>
      </div>
    );
  }

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (!data) {
    return (
      <div className="space-y-2 animate-pulse">
        {Array.from({ length: limit ?? 10 }).map((_, i) => (
          <div
            key={i}
            className="h-12 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          />
        ))}
      </div>
    );
  }

  const rows = limit ? allResults.slice(0, limit) : allResults;

  // ── Table ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-1">
      {/* Header row */}
      {!compact && (
        <div
          className="grid grid-cols-[40px_1fr_auto_auto_auto] gap-2 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: 'rgba(0,250,97,0.6)' }}
        >
          <span>#</span>
          <span>Team</span>
          <span className="text-right w-14">GW</span>
          <span className="text-right w-16">Totaal</span>
          <span className="text-center w-10">↕</span>
        </div>
      )}

      {rows.map((entry) => {
        const manager = isManager(entry.player_name);
        const topThree = entry.rank <= 3;

        return (
          <div
            key={entry.entry}
            className="grid grid-cols-[40px_1fr_auto_auto_auto] gap-2 items-center px-4 py-3 rounded-xl transition-all duration-200"
            style={{
              background: topThree
                ? 'rgba(0,250,97,0.06)'
                : manager
                ? 'rgba(0,250,97,0.03)'
                : 'rgba(255,255,255,0.03)',
              border: manager
                ? '1px solid rgba(0,250,97,0.25)'
                : topThree
                ? '1px solid rgba(0,250,97,0.12)'
                : '1px solid rgba(255,255,255,0.05)',
              borderLeft: manager
                ? '3px solid #00FA61'
                : topThree
                ? '3px solid rgba(0,250,97,0.4)'
                : '1px solid rgba(255,255,255,0.05)',
            }}
          >
            {/* Rank / medal */}
            <div className="flex items-center justify-center">
              {entry.rank <= 3 ? (
                <span className="text-lg leading-none">{MEDAL[entry.rank - 1]}</span>
              ) : (
                <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {entry.rank}
                </span>
              )}
            </div>

            {/* Team + manager */}
            <div className="min-w-0">
              <p
                className="text-sm font-semibold leading-tight truncate"
                style={{ color: manager ? '#00FA61' : 'white' }}
              >
                {entry.entry_name}
              </p>
              {!compact && (
                <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {entry.player_name}
                </p>
              )}
            </div>

            {/* GW points */}
            <div className="text-right w-14">
              <span
                className="text-sm font-bold"
                style={{ color: entry.event_total > 0 ? '#00FA61' : 'rgba(255,255,255,0.4)' }}
              >
                {entry.event_total}
              </span>
            </div>

            {/* Total points */}
            <div className="text-right w-16">
              <span className="text-sm font-semibold text-white">{entry.total}</span>
            </div>

            {/* Movement */}
            <div className="flex justify-center w-10">
              <MovementBadge rank={entry.rank} lastRank={entry.last_rank} />
            </div>
          </div>
        );
      })}

      {/* Laad meer knop — alleen op volledige stand (niet compact/limit) */}
      {!compact && !limit && hasNext && (
        <div className="pt-4 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 font-semibold text-sm px-6 py-3 rounded-xl transition-all"
            style={{
              background: 'rgba(0,250,97,0.08)',
              color: '#00FA61',
              border: '1px solid rgba(0,250,97,0.25)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,250,97,0.15)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,250,97,0.08)';
            }}
          >
            {loadingMore ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Laden...
              </>
            ) : (
              <>
                Toon volledige stand ↓
              </>
            )}
          </button>
        </div>
      )}

      {/* Last updated + refresh */}
      {!compact && (
        <div className="flex items-center justify-between pt-3 px-2">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {lastUpdated
              ? `Bijgewerkt: ${lastUpdated.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`
              : 'Automatisch verversen elke 5 min'}
          </p>
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
            style={{
              color: 'rgba(0,250,97,0.7)',
              background: 'rgba(0,250,97,0.06)',
              border: '1px solid rgba(0,250,97,0.15)',
            }}
          >
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            Ververs
          </button>
        </div>
      )}
    </div>
  );
}

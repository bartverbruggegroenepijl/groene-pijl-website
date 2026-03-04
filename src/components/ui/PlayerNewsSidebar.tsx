'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight, Zap, RefreshCw } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlayerNewsItem {
  id: number;
  name: string;
  team: string;
  position: string;
  status: 'a' | 'i' | 'd' | 's' | 'u';
  news: string;
  newsAdded: string | null;
  chanceOfPlaying: number | null;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
  i: { emoji: '🔴', label: 'Geblesseerd',      color: '#ef4444', bg: 'rgba(239,68,68,0.15)'   },
  d: { emoji: '🟡', label: 'Twijfelgeval',      color: '#eab308', bg: 'rgba(234,179,8,0.15)'   },
  s: { emoji: '🔵', label: 'Geschorst',         color: '#3b82f6', bg: 'rgba(59,130,246,0.15)'  },
  u: { emoji: '⚫', label: 'Niet beschikbaar',  color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
  a: { emoji: '🟢', label: 'Hersteld',          color: '#22c55e', bg: 'rgba(34,197,94,0.15)'   },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  if (mins < 60)  return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}u`;
  return `${Math.floor(hours / 24)}d`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PlayerNewsSidebar() {
  const [players,     setPlayers]     = useState<PlayerNewsItem[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [spinning,    setSpinning]    = useState(false);

  const fetchNews = useCallback(async (showSpin = false) => {
    if (showSpin) setSpinning(true);
    try {
      const res = await fetch('/api/fpl/player-news', { cache: 'no-store' });
      if (!res.ok) throw new Error('API error');
      const data: { players: PlayerNewsItem[] } = await res.json();
      setPlayers(data.players ?? []);
      setLastUpdated(new Date());
    } catch {
      // Sidebar is non-critical — silently fail
    } finally {
      setLoading(false);
      if (showSpin) setSpinning(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
    // Auto-refresh every 10 minutes
    const iv = setInterval(() => fetchNews(), 10 * 60_000);
    return () => clearInterval(iv);
  }, [fetchNews]);

  const top10 = players.slice(0, 10);

  return (
    <aside
      className="flex flex-col h-full"
      style={{
        background:  '#0d0d1a',
        borderLeft:  '1px solid rgba(0,250,97,0.2)',
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(0,250,97,0.15)' }}
      >
        <div className="flex items-center gap-2">
          <Zap size={13} style={{ color: '#00FA61' }} />
          <span
            className="text-[11px] font-bold tracking-widest uppercase"
            style={{ fontFamily: 'Montserrat, sans-serif', color: '#00FA61' }}
          >
            Spelersnieuws
          </span>
        </div>
        <button
          onClick={() => fetchNews(true)}
          title="Vernieuwen"
          className="text-white/25 hover:text-white/60 transition-colors p-1 rounded"
        >
          <RefreshCw size={11} className={spinning ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* ── News list ── */}
      <div className="flex-1 overflow-y-auto sidebar-scroll">
        {loading ? (
          /* Skeleton */
          <div className="flex flex-col gap-0 divide-y divide-white/5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="px-4 py-3 animate-pulse">
                <div className="flex gap-2 mb-1.5">
                  <div className="w-10 h-4 rounded bg-white/6" />
                  <div className="flex-1 h-4 rounded bg-white/5" />
                </div>
                <div className="h-3 rounded bg-white/4 w-full mb-1" />
                <div className="h-3 rounded bg-white/4 w-4/5" />
              </div>
            ))}
          </div>
        ) : top10.length === 0 ? (
          <div className="px-4 py-10 text-center text-white/20 text-xs">
            Geen nieuws beschikbaar
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {top10.map((p) => {
              const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.a;
              return (
                <div
                  key={p.id}
                  className="px-4 py-3 hover:bg-white/[0.03] transition-colors"
                >
                  {/* Status badge + player name */}
                  <div className="flex items-start gap-2 mb-1.5">
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5 leading-tight"
                      style={{ color: cfg.color, background: cfg.bg }}
                    >
                      {cfg.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-xs font-semibold leading-snug truncate">
                        {p.name}
                      </p>
                      <p className="text-white/35 text-[10px] leading-none mt-0.5">
                        {p.team} · {p.position}
                      </p>
                    </div>
                  </div>

                  {/* News text */}
                  <p className="text-white/50 text-[10px] leading-relaxed line-clamp-2">
                    {p.news}
                  </p>

                  {/* Chance + time */}
                  <div className="flex items-center justify-between mt-1.5">
                    {p.chanceOfPlaying !== null ? (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          color:      p.chanceOfPlaying >= 75 ? '#22c55e' : p.chanceOfPlaying >= 25 ? '#eab308' : '#ef4444',
                          background: p.chanceOfPlaying >= 75 ? 'rgba(34,197,94,0.12)' : p.chanceOfPlaying >= 25 ? 'rgba(234,179,8,0.12)' : 'rgba(239,68,68,0.12)',
                        }}
                      >
                        {p.chanceOfPlaying}%
                      </span>
                    ) : (
                      <span />
                    )}
                    {p.newsAdded && (
                      <span className="text-white/20 text-[9px]">
                        {timeAgo(p.newsAdded)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div
        className="shrink-0 px-4 py-3"
        style={{ borderTop: '1px solid rgba(0,250,97,0.1)' }}
      >
        <Link
          href="/spelersnieuws"
          className="flex items-center justify-between text-xs font-semibold transition-colors group"
          style={{ color: '#00FA61' }}
        >
          <span>Meer updates</span>
          <ArrowRight
            size={12}
            className="group-hover:translate-x-0.5 transition-transform"
          />
        </Link>
        {lastUpdated && (
          <p className="text-[9px] text-white/20 mt-1">
            Bijgewerkt {timeAgo(lastUpdated.toISOString())} geleden
          </p>
        )}
      </div>
    </aside>
  );
}

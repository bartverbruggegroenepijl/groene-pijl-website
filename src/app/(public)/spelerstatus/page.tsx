'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Activity, Search } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlayerNewsItem {
  id: number;
  name: string;
  fullName: string;
  team: string;
  teamFull: string;
  position: string;
  status: 'a' | 'i' | 'd' | 's' | 'u';
  news: string;
  newsAdded: string | null;
  chanceOfPlaying: number | null;
}

type FilterStatus = 'all' | 'i' | 'd' | 's' | 'u' | 'a';

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, {
  emoji: string; label: string; color: string; bg: string; border: string;
}> = {
  i: { emoji: '🔴', label: 'Geblesseerd',      color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.3)'   },
  d: { emoji: '🟡', label: 'Twijfelgeval',      color: '#eab308', bg: 'rgba(234,179,8,0.08)',   border: 'rgba(234,179,8,0.3)'   },
  s: { emoji: '🔵', label: 'Geschorst',         color: '#3b82f6', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.3)'  },
  u: { emoji: '⚫', label: 'Niet beschikbaar',  color: '#6b7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.3)' },
  a: { emoji: '🟢', label: 'Hersteld',          color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.3)'   },
};

const FILTERS: { status: FilterStatus; label: string; emoji: string }[] = [
  { status: 'all', label: 'Alle',              emoji: '📋' },
  { status: 'i',   label: 'Geblesseerd',       emoji: '🔴' },
  { status: 'd',   label: 'Twijfelgeval',      emoji: '🟡' },
  { status: 's',   label: 'Geschorst',         emoji: '🔵' },
  { status: 'u',   label: 'Niet beschikbaar',  emoji: '⚫' },
  { status: 'a',   label: 'Hersteld',          emoji: '🟢' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  if (mins < 60)  return `${mins} minuten geleden`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} uur geleden`;
  const days  = Math.floor(hours / 24);
  return `${days} dag${days !== 1 ? 'en' : ''} geleden`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SpelerstatusPage() {
  const [players,     setPlayers]     = useState<PlayerNewsItem[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState<FilterStatus>('all');
  const [search,      setSearch]      = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/fpl/player-news', { cache: 'no-store' });
      if (!res.ok) throw new Error('API error');
      const data: { players: PlayerNewsItem[] } = await res.json();
      setPlayers(data.players ?? []);
      setLastUpdated(new Date());
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const iv = setInterval(fetchStatus, 10 * 60_000);
    return () => clearInterval(iv);
  }, [fetchStatus]);

  const filtered = players
    .filter((p) => filter === 'all' || p.status === filter)
    .filter((p) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.teamFull || p.team).toLowerCase().includes(q)
      );
    });

  return (
    <main className="min-h-screen text-white" style={{ background: '#1F0E84' }}>

      {/* ── Header ── */}
      <div
        className="pt-24 pb-8 px-4"
        style={{ borderBottom: '1px solid rgba(0,250,97,0.2)' }}
      >
        <div className="max-w-6xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/35 hover:text-white/65 text-sm mb-6 transition-colors"
          >
            <ArrowLeft size={14} /> Terug naar home
          </Link>

          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Activity size={18} style={{ color: '#00FA61' }} />
                <span
                  className="text-xs font-bold tracking-widest uppercase"
                  style={{ color: '#00FA61' }}
                >
                  Live Updates
                </span>
              </div>
              <h1
                className="text-4xl sm:text-5xl font-bold text-white leading-tight"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Spelerstatus
              </h1>
              <p className="text-white/40 text-sm mt-2">
                {loading ? 'Laden...' : `${players.length} spelers met statusupdate`}
                {lastUpdated && ` · ${timeAgo(lastUpdated.toISOString())}`}
              </p>
            </div>

            <button
              onClick={fetchStatus}
              disabled={loading}
              className="flex items-center gap-2 border border-white/20 hover:border-primary/60 text-white/50 hover:text-primary px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Vernieuwen
            </button>
          </div>

          {/* Zoekbalk */}
          <div className="flex justify-center mt-6 mb-1">
            <div style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#00FA61',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Zoek op spelernaam of club..."
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(0,250,97,0.4)',
                  borderRadius: '25px',
                  padding: '10px 20px 10px 44px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Filter buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            {FILTERS.map((f) => {
              const count  = f.status === 'all'
                ? players.length
                : players.filter((p) => p.status === f.status).length;
              const active = filter === f.status;
              return (
                <button
                  key={f.status}
                  onClick={() => setFilter(f.status)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                  style={{
                    background: active ? '#00FA61' : 'rgba(255,255,255,0.08)',
                    color:      active ? '#000000' : 'rgba(255,255,255,0.65)',
                    border:     active ? '1px solid #00FA61' : '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  {f.emoji} {f.label}
                  <span
                    className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                    style={{
                      background: active ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.12)',
                      color:      active ? '#000' : 'rgba(255,255,255,0.45)',
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl h-40"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-white/25 text-sm">
            Geen spelers gevonden met dit filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => {
              const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.a;
              return (
                <div
                  key={p.id}
                  className="rounded-xl p-5 flex flex-col gap-3 transition-all hover:scale-[1.01]"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border:     `1px solid ${cfg.border}`,
                  }}
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-white font-bold text-base leading-tight truncate">
                        {p.name}
                      </p>
                      <p className="text-white/40 text-xs mt-0.5">
                        {p.teamFull || p.team} · {p.position}
                      </p>
                    </div>
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
                      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
                    >
                      {cfg.emoji} {cfg.label}
                    </span>
                  </div>

                  {/* News */}
                  <p className="text-white/70 text-sm leading-relaxed flex-1">
                    {p.news}
                  </p>

                  {/* Footer */}
                  <div
                    className="flex items-center justify-between pt-3"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {p.chanceOfPlaying !== null ? (
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded"
                        style={{
                          color:
                            p.chanceOfPlaying >= 75 ? '#22c55e' :
                            p.chanceOfPlaying >= 25 ? '#eab308' : '#ef4444',
                          background:
                            p.chanceOfPlaying >= 75 ? 'rgba(34,197,94,0.15)' :
                            p.chanceOfPlaying >= 25 ? 'rgba(234,179,8,0.15)' :
                            'rgba(239,68,68,0.15)',
                        }}
                      >
                        {p.chanceOfPlaying}% kans op spelen
                      </span>
                    ) : (
                      <span />
                    )}
                    <span className="text-white/30 text-xs">
                      {timeAgo(p.newsAdded)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

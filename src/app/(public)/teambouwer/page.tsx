'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import {
  Search, X, ChevronLeft, ChevronRight, RotateCcw, Save,
  ArrowUpDown, ArrowUp, ArrowDown, Plus, Minus, Users,
} from 'lucide-react';

/* ─────────────────────────── types ─────────────────────────── */

type Position = 'GK' | 'DEF' | 'MID' | 'FWD';

interface FplPlayer {
  id: number;
  code: number;
  name: string;
  fullName: string;
  team: string;       // short_name
  teamId: number;
  position: Position;
  totalPoints: number;
  eventPoints: number;
  price: number;
  imageUrl: string;
}

interface FixtureCell {
  gw: number;
  opponent: string;
  location: 'H' | 'A';
  difficulty: number;
}

interface TeamFDR {
  id: number;
  name: string;
  shortName: string;
  fixtures: FixtureCell[];
  avgDifficulty: number;
}

interface SelectedPlayer extends FplPlayer {
  slotId: string; // e.g. "GK-0", "DEF-2", "BENCH-1"
}

/* ─────────────────────── constants ─────────────────────────── */

const BUDGET = 100.0;
const PAGE_SIZE = 10;
const LS_KEY = 'dgp_teambouwer_v1';

const MAX_PER_POS: Record<Position, number> = { GK: 2, DEF: 5, MID: 5, FWD: 3 };
const MAX_TOTAL = 15;
const MAX_PER_CLUB = 3;

// Starting 11 formation slots: 1 GK, 4 DEF, 4 MID, 2 FWD
const STARTING_SLOTS: { pos: Position; idx: number }[] = [
  { pos: 'GK',  idx: 0 },
  { pos: 'DEF', idx: 0 }, { pos: 'DEF', idx: 1 }, { pos: 'DEF', idx: 2 }, { pos: 'DEF', idx: 3 },
  { pos: 'MID', idx: 0 }, { pos: 'MID', idx: 1 }, { pos: 'MID', idx: 2 }, { pos: 'MID', idx: 3 },
  { pos: 'FWD', idx: 0 }, { pos: 'FWD', idx: 1 },
];

const BENCH_SLOTS = [
  { slotId: 'BENCH-0', label: 'Bank GK',  pos: 'GK'  as Position },
  { slotId: 'BENCH-1', label: 'Bank 1',   pos: null },
  { slotId: 'BENCH-2', label: 'Bank 2',   pos: null },
  { slotId: 'BENCH-3', label: 'Bank 3',   pos: null },
];

/* ─────────────────────── FDR helpers ───────────────────────── */

const FDR_STYLE: Record<number, { bg: string; color: string }> = {
  1: { bg: '#375523', color: '#fff'  },
  2: { bg: '#01FC7A', color: '#111'  },
  3: { bg: '#E7E7E7', color: '#111'  },
  4: { bg: '#FF1751', color: '#fff'  },
  5: { bg: '#80072D', color: '#fff'  },
};

function FdrBadge({ cell }: { cell: FixtureCell }) {
  const s = FDR_STYLE[cell.difficulty] ?? { bg: '#444', color: '#fff' };
  return (
    <span
      className="inline-flex flex-col items-center justify-center rounded text-[9px] font-bold leading-tight"
      style={{ background: s.bg, color: s.color, minWidth: 34, padding: '2px 3px' }}
    >
      <span>{cell.opponent}</span>
      <span style={{ opacity: 0.75 }}>{cell.location}</span>
    </span>
  );
}

/* ─────────────────────── pitch card ────────────────────────── */

function PitchCard({
  player,
  onRemove,
  nextFixtures,
}: {
  player: SelectedPlayer | null;
  slotId: string;
  posLabel: string;
  onRemove: () => void;
  nextFixtures: FixtureCell[];
}) {
  if (!player) {
    return (
      <div className="flex flex-col items-center gap-1 w-14 sm:w-16">
        <div
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.25)' }}
        >
          <Plus size={14} className="text-white/30" />
        </div>
        <span className="text-white/20 text-[9px] text-center leading-tight">—</span>
      </div>
    );
  }

  const fdr = nextFixtures[0];

  return (
    <div className="flex flex-col items-center gap-0.5 w-14 sm:w-16 group relative">
      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <X size={8} />
      </button>

      {/* Photo */}
      <div
        className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-white/20 shrink-0"
        style={{ background: 'rgba(0,0,0,0.3)' }}
      >
        <Image
          src={player.imageUrl}
          alt={player.name}
          fill
          className="object-cover"
          style={{ objectPosition: '50% 10%' }}
          unoptimized
        />
      </div>

      {/* Name */}
      <span className="text-white text-[9px] sm:text-[10px] font-semibold text-center leading-tight line-clamp-1 max-w-full px-0.5">
        {player.name}
      </span>

      {/* Price */}
      <span className="text-primary text-[8px] font-medium">£{player.price.toFixed(1)}m</span>

      {/* FDR */}
      {fdr && <FdrBadge cell={fdr} />}
    </div>
  );
}

/* ─────────────────────── main component ────────────────────── */

export default function TeambouwerPage() {
  const [players, setPlayers] = useState<FplPlayer[]>([]);
  const [fdrMap, setFdrMap] = useState<Record<number, FixtureCell[]>>({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState<Position | 'ALL'>('ALL');
  const [sortField, setSortField] = useState<'price' | 'totalPoints' | 'eventPoints'>('totalPoints');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(0);

  // Team: slotId → player
  const [team, setTeam] = useState<Record<string, SelectedPlayer>>({});

  /* ── load data ── */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [pRes, fRes] = await Promise.all([
          fetch('/api/fpl/players'),
          fetch('/api/fpl/fixtures'),
        ]);
        const pData = await pRes.json();
        const fData = await fRes.json();

        setPlayers(pData.players ?? []);

        // Build fdrMap: teamId → next 3 fixtures
        const map: Record<number, FixtureCell[]> = {};
        for (const t of (fData.teams ?? []) as TeamFDR[]) {
          map[t.id] = t.fixtures.slice(0, 3);
        }
        setFdrMap(map);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── persist team to localStorage ── */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) setTeam(JSON.parse(saved));
    } catch {}
  }, []);

  const saveTeam = useCallback(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(team));
      alert('Team opgeslagen! ✓');
    } catch {}
  }, [team]);

  const resetTeam = () => {
    if (confirm('Team resetten? Alle spelers worden verwijderd.')) {
      setTeam({});
      localStorage.removeItem(LS_KEY);
    }
  };

  /* ── team stats ── */
  const teamValues = useMemo(() => {
    const selected = Object.values(team);
    const total = selected.reduce((s, p) => s + p.price, 0);
    const remaining = BUDGET - total;
    const count = selected.length;

    const countByPos: Record<Position, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    const countByClub: Record<string, number> = {};
    for (const p of selected) {
      countByPos[p.position]++;
      countByClub[p.team] = (countByClub[p.team] ?? 0) + 1;
    }

    return { total, remaining, count, countByPos, countByClub };
  }, [team]);

  /* ── validation ── */
  const canAdd = useCallback((player: FplPlayer): { ok: boolean; reason?: string } => {
    const sel = Object.values(team);
    if (sel.find((p) => p.id === player.id)) return { ok: false, reason: 'Al in team' };
    if (sel.length >= MAX_TOTAL) return { ok: false, reason: 'Team vol (15)' };
    if (teamValues.countByPos[player.position] >= MAX_PER_POS[player.position])
      return { ok: false, reason: `Max ${MAX_PER_POS[player.position]} ${player.position}` };
    if ((teamValues.countByClub[player.team] ?? 0) >= MAX_PER_CLUB)
      return { ok: false, reason: 'Max 3/club' };
    if (teamValues.remaining < player.price)
      return { ok: false, reason: 'Budget te laag' };
    return { ok: true };
  }, [team, teamValues]);

  /* ── add player to next free slot ── */
  const addPlayer = useCallback((player: FplPlayer) => {
    const { ok, reason } = canAdd(player);
    if (!ok) { if (reason) alert(reason); return; }

    // Find first free slot for this position in starting 11
    const startingForPos = STARTING_SLOTS.filter((s) => s.pos === player.position);
    let slotId: string | null = null;
    for (const s of startingForPos) {
      const id = `${s.pos}-${s.idx}`;
      if (!team[id]) { slotId = id; break; }
    }

    // If no starting slot free, try bench (any pos bench slot for GK, any for others)
    if (!slotId) {
      if (player.position === 'GK') {
        if (!team['BENCH-0']) slotId = 'BENCH-0';
      } else {
        for (const b of ['BENCH-1', 'BENCH-2', 'BENCH-3']) {
          if (!team[b]) { slotId = b; break; }
        }
      }
    }

    if (!slotId) { alert('Geen vrij slot beschikbaar.'); return; }

    setTeam((prev) => ({ ...prev, [slotId!]: { ...player, slotId: slotId! } }));
  }, [team, canAdd]);

  /* ── remove player ── */
  const removePlayer = useCallback((slotId: string) => {
    setTeam((prev) => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
  }, []);

  /* ── filtered & sorted player list ── */
  const filteredPlayers = useMemo(() => {
    let list = players;
    if (posFilter !== 'ALL') list = list.filter((p) => p.position === posFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.fullName.toLowerCase().includes(q) ||
          p.team.toLowerCase().includes(q),
      );
    }
    list = [...list].sort((a, b) => {
      const diff = a[sortField] - b[sortField];
      return sortDir === 'desc' ? -diff : diff;
    });
    return list;
  }, [players, posFilter, search, sortField, sortDir]);

  const totalPages = Math.ceil(filteredPlayers.length / PAGE_SIZE);
  const pagePlayers = filteredPlayers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [search, posFilter, sortField, sortDir]);

  function toggleSort(field: typeof sortField) {
    if (sortField === field) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortField(field); setSortDir('desc'); }
  }

  function SortIcon({ field }: { field: typeof sortField }) {
    if (sortField !== field) return <ArrowUpDown size={11} className="opacity-30" />;
    return sortDir === 'desc' ? <ArrowDown size={11} className="text-primary" /> : <ArrowUp size={11} className="text-primary" />;
  }

  /* ─────────────── pitch rows ─────────────── */
  function PitchRow({ positions, label }: { positions: { pos: Position; idx: number }[]; label: string }) {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-white/25 text-[9px] uppercase tracking-widest font-semibold">{label}</span>
        <div className="flex gap-2 sm:gap-3 justify-center flex-wrap">
          {positions.map(({ pos, idx }) => {
            const slotId = `${pos}-${idx}`;
            const player = team[slotId] ?? null;
            const fixtures = player ? (fdrMap[player.teamId] ?? []).slice(0, 1) : [];
            return (
              <PitchCard
                key={slotId}
                slotId={slotId}
                posLabel={pos}
                player={player}
                onRemove={() => removePlayer(slotId)}
                nextFixtures={fixtures}
              />
            );
          })}
        </div>
      </div>
    );
  }

  /* ─────────────── render ─────────────── */
  return (
    <main
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #1a1361 0%, #1F0E84 40%, #2D1B69 70%, #0d3d2a 100%)',
      }}
    >
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">

        {/* Header */}
        <div className="mb-8">
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 block" style={{ color: '#00FA61' }}>
            Teambouwer
          </span>
          <h1
            className="font-extrabold"
            style={{
              fontFamily: 'Montserrat, sans-serif',
              fontSize: 'clamp(28px, 4vw, 48px)',
              color: 'white',
              lineHeight: 1.1,
            }}
          >
            Bouw Mijn Team
          </h1>
          <p className="text-white/40 text-sm mt-2">
            Stel jouw ideale FPL-elftal samen. Budget: £{BUDGET.toFixed(1)}m · Max 3 per club · 15 spelers totaal.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── LEFT: player list ── */}
          <div className="flex-1 lg:w-[60%] flex flex-col gap-4">

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  placeholder="Zoek speler of club…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-medium text-white placeholder-white/30 outline-none border border-white/10 focus:border-primary/40 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Position filter */}
              <div className="flex gap-1">
                {(['ALL', 'GK', 'DEF', 'MID', 'FWD'] as const).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setPosFilter(pos)}
                    className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: posFilter === pos ? '#00FA61' : 'rgba(255,255,255,0.06)',
                      color: posFilter === pos ? '#111' : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div
              className="rounded-2xl border border-white/8 overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              {/* Table header */}
              <div
                className="grid text-[10px] font-semibold uppercase tracking-widest text-white/30 px-3 py-2 border-b border-white/8"
                style={{ gridTemplateColumns: '2fr 80px 50px 110px 60px 60px 44px' }}
              >
                <span>Speler</span>
                <span>Club</span>
                <span>Pos</span>
                <span className="text-center">Wedstrijden</span>
                <button className="flex items-center gap-1 hover:text-white/60 transition-colors" onClick={() => toggleSort('price')}>
                  Prijs <SortIcon field="price" />
                </button>
                <button className="flex items-center gap-1 hover:text-white/60 transition-colors" onClick={() => toggleSort('totalPoints')}>
                  Ptn <SortIcon field="totalPoints" />
                </button>
                <span />
              </div>

              {/* Rows */}
              {loading ? (
                <div className="py-12 text-center text-white/30 text-sm">Spelers laden…</div>
              ) : pagePlayers.length === 0 ? (
                <div className="py-12 text-center text-white/30 text-sm">Geen spelers gevonden.</div>
              ) : (
                pagePlayers.map((p) => {
                  const { ok } = canAdd(p);
                  const inTeam = !!Object.values(team).find((t) => t.id === p.id);
                  const fixtures = (fdrMap[p.teamId] ?? []).slice(0, 3);

                  return (
                    <div
                      key={p.id}
                      className="grid items-center px-3 py-2 border-b border-white/5 last:border-b-0 hover:bg-white/3 transition-colors"
                      style={{ gridTemplateColumns: '2fr 80px 50px 110px 60px 60px 44px' }}
                    >
                      {/* Name + photo */}
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="relative w-7 h-7 rounded-full overflow-hidden shrink-0 border border-white/10"
                          style={{ background: 'rgba(0,0,0,0.3)' }}
                        >
                          <Image
                            src={p.imageUrl}
                            alt={p.name}
                            fill
                            className="object-cover"
                            style={{ objectPosition: '50% 10%' }}
                            unoptimized
                          />
                        </div>
                        <span className="text-white text-xs font-medium truncate">{p.name}</span>
                      </div>

                      {/* Club */}
                      <span className="text-white/50 text-xs truncate">{p.team}</span>

                      {/* Position */}
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-md w-fit"
                        style={{
                          background:
                            p.position === 'GK' ? 'rgba(255,215,0,0.15)' :
                            p.position === 'DEF' ? 'rgba(0,250,97,0.12)' :
                            p.position === 'MID' ? 'rgba(99,102,241,0.15)' :
                            'rgba(239,68,68,0.15)',
                          color:
                            p.position === 'GK' ? '#FFD700' :
                            p.position === 'DEF' ? '#00FA61' :
                            p.position === 'MID' ? '#818CF8' :
                            '#F87171',
                        }}
                      >
                        {p.position}
                      </span>

                      {/* FDR badges */}
                      <div className="flex gap-1 justify-center">
                        {fixtures.length > 0
                          ? fixtures.map((f, i) => <FdrBadge key={i} cell={f} />)
                          : <span className="text-white/20 text-[9px]">—</span>}
                      </div>

                      {/* Price */}
                      <span className="text-white/70 text-xs font-medium">£{p.price.toFixed(1)}m</span>

                      {/* Points */}
                      <span className="text-white/50 text-xs">{p.totalPoints}pt</span>

                      {/* Add/Remove button */}
                      <button
                        onClick={() => inTeam ? removePlayer(Object.values(team).find((t) => t.id === p.id)!.slotId) : addPlayer(p)}
                        disabled={!inTeam && !ok}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 disabled:opacity-25"
                        style={{
                          background: inTeam ? 'rgba(239,68,68,0.15)' : 'rgba(0,250,97,0.12)',
                          color: inTeam ? '#F87171' : '#00FA61',
                        }}
                        title={inTeam ? 'Verwijder uit team' : 'Voeg toe aan team'}
                      >
                        {inTeam ? <Minus size={12} /> : <Plus size={12} />}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <span className="text-white/30 text-xs">
                {filteredPlayers.length} spelers · pagina {page + 1} / {Math.max(totalPages, 1)}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-25 transition-all hover:bg-white/8"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <ChevronLeft size={14} className="text-white/60" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-25 transition-all hover:bg-white/8"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <ChevronRight size={14} className="text-white/60" />
                </button>
              </div>
            </div>
          </div>

          {/* ── RIGHT: pitch ── */}
          <div className="lg:w-[40%] flex flex-col gap-4">

            {/* Budget stats */}
            <div
              className="rounded-2xl p-4 border border-white/8 grid grid-cols-3 gap-3"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <div className="text-center">
                <div className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Waarde</div>
                <div className="text-white font-bold text-base">£{teamValues.total.toFixed(1)}m</div>
              </div>
              <div className="text-center">
                <div className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Resterend</div>
                <div
                  className="font-bold text-base"
                  style={{ color: teamValues.remaining < 0 ? '#F87171' : '#00FA61' }}
                >
                  £{teamValues.remaining.toFixed(1)}m
                </div>
              </div>
              <div className="text-center">
                <div className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Spelers</div>
                <div className="text-white font-bold text-base">{teamValues.count}/15</div>
              </div>
            </div>

            {/* Pitch */}
            <div
              className="rounded-2xl overflow-hidden border border-white/8"
              style={{
                background: 'linear-gradient(180deg, #1a5c20 0%, #2d7a35 30%, #2d7a35 70%, #1a5c20 100%)',
                minHeight: 440,
              }}
            >
              {/* Field markings */}
              <div className="relative w-full h-full py-4 px-2">
                {/* Centre circle decoration */}
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 pointer-events-none"
                  style={{ width: 80, height: 80 }}
                />
                {/* Halfway line */}
                <div className="absolute left-4 right-4 border-t border-white/10 pointer-events-none" style={{ top: '50%' }} />

                <div className="flex flex-col gap-4 relative z-10">
                  <PitchRow
                    label="Aanval"
                    positions={[{ pos: 'FWD', idx: 0 }, { pos: 'FWD', idx: 1 }]}
                  />
                  <PitchRow
                    label="Middenveld"
                    positions={[
                      { pos: 'MID', idx: 0 }, { pos: 'MID', idx: 1 },
                      { pos: 'MID', idx: 2 }, { pos: 'MID', idx: 3 },
                    ]}
                  />
                  <PitchRow
                    label="Verdediging"
                    positions={[
                      { pos: 'DEF', idx: 0 }, { pos: 'DEF', idx: 1 },
                      { pos: 'DEF', idx: 2 }, { pos: 'DEF', idx: 3 },
                    ]}
                  />
                  <PitchRow label="Keeper" positions={[{ pos: 'GK', idx: 0 }]} />
                </div>
              </div>
            </div>

            {/* Bench */}
            <div
              className="rounded-2xl p-4 border border-white/8"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold mb-3">Bank</p>
              <div className="flex gap-3 justify-around">
                {BENCH_SLOTS.map(({ slotId, label }) => {
                  const player = team[slotId] ?? null;
                  const fixtures = player ? (fdrMap[player.teamId] ?? []).slice(0, 1) : [];
                  return (
                    <div key={slotId} className="flex flex-col items-center gap-1">
                      <span className="text-white/20 text-[9px] mb-1">{label}</span>
                      <PitchCard
                        slotId={slotId}
                        posLabel={label}
                        player={player}
                        onRemove={() => removePlayer(slotId)}
                        nextFixtures={fixtures}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Position summary */}
            <div
              className="rounded-2xl p-4 border border-white/8"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold mb-3 flex items-center gap-2">
                <Users size={11} /> Samenstelling
              </p>
              <div className="grid grid-cols-4 gap-2 text-center">
                {(['GK', 'DEF', 'MID', 'FWD'] as Position[]).map((pos) => {
                  const count = teamValues.countByPos[pos];
                  const max = MAX_PER_POS[pos];
                  const full = count >= max;
                  return (
                    <div key={pos}>
                      <div
                        className="text-xs font-bold"
                        style={{ color: full ? '#F87171' : '#00FA61' }}
                      >
                        {count}/{max}
                      </div>
                      <div className="text-white/30 text-[10px]">{pos}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={saveTeam}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all btn-glow"
                style={{ background: '#00FA61', color: '#111' }}
              >
                <Save size={14} /> Opslaan
              </button>
              <button
                onClick={resetTeam}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all border border-white/10 hover:border-white/25 text-white/60 hover:text-white"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <RotateCcw size={14} /> Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

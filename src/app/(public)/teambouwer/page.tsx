'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import {
  Search, X, ChevronLeft, ChevronRight, RotateCcw, Save,
  ArrowUpDown, ArrowUp, ArrowDown, Plus, Minus, Users, ArrowLeftRight,
} from 'lucide-react';

/* ─────────────────────────── types ─────────────────────────── */

type Position = 'GK' | 'DEF' | 'MID' | 'FWD';

interface FplPlayer {
  id: number;
  code: number;
  name: string;
  fullName: string;
  team: string;
  teamId: number;
  position: Position;
  totalPoints: number;
  eventPoints: number;
  price: number;
  imageUrl: string;
  goals: number;
  assists: number;
  minutes: number;
  cleanSheets: number;
  ownership: string;
  xGoals: string;
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
  slotId: string;
}

/* ─────────────────────── constants ─────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BUDGET    = 100.0;
const PAGE_SIZE = 10;
const LS_KEY    = 'dgp_teambouwer_v1';

const MAX_PER_POS: Record<Position, number> = { GK: 2, DEF: 5, MID: 5, FWD: 3 };
const MAX_TOTAL   = 15;
const MAX_PER_CLUB = 3;

/* ── Formaties ── */
type FormationKey = '4-4-2' | '4-3-3' | '4-5-1' | '3-5-2' | '3-4-3' | '5-3-2' | '5-4-1';

const FORMATIONS: Record<FormationKey, { def: number; mid: number; fwd: number }> = {
  '4-4-2': { def: 4, mid: 4, fwd: 2 },
  '4-3-3': { def: 4, mid: 3, fwd: 3 },
  '4-5-1': { def: 4, mid: 5, fwd: 1 },
  '3-5-2': { def: 3, mid: 5, fwd: 2 },
  '3-4-3': { def: 3, mid: 4, fwd: 3 },
  '5-3-2': { def: 5, mid: 3, fwd: 2 },
  '5-4-1': { def: 5, mid: 4, fwd: 1 },
};

const FORMATION_KEYS = Object.keys(FORMATIONS) as FormationKey[];
const DEFAULT_FORMATION: FormationKey = '4-4-2';

const BENCH_SLOTS = [
  { slotId: 'BENCH-0', label: 'Bank GK', pos: 'GK' as Position },
  { slotId: 'BENCH-1', label: 'Bank 1',  pos: null },
  { slotId: 'BENCH-2', label: 'Bank 2',  pos: null },
  { slotId: 'BENCH-3', label: 'Bank 3',  pos: null },
];

/* ── FDR stijlen voor spelerslijst (bestaand) ── */
const FDR_STYLE: Record<number, { bg: string; color: string }> = {
  1: { bg: '#375523', color: '#fff' },
  2: { bg: '#01FC7A', color: '#111' },
  3: { bg: '#E7E7E7', color: '#111' },
  4: { bg: '#FF1751', color: '#fff' },
  5: { bg: '#80072D', color: '#fff' },
};

/* ── FDR kleuren voor veldweergave ── */
const FDR_PITCH_BG: Record<number, string> = {
  1: '#00FA61', 2: '#00FA61', 3: '#FFA500', 4: '#FF4444', 5: '#FF4444',
};
const FDR_PITCH_TEXT: Record<number, string> = {
  1: '#111', 2: '#111', 3: '#111', 4: '#fff', 5: '#fff',
};

/* ── Teamkleuren Premier League 2024-25 ── */
const TEAM_PRIMARY: Record<string, string> = {
  ARS: '#EF0107', AVL: '#95BFE5', BOU: '#DA291C', BRE: '#E30613',
  BHA: '#0057B8', CHE: '#034694', CRY: '#1B458F', EVE: '#003399',
  FUL: '#2D2D2D', IPS: '#0044A9', LEI: '#003090', LIV: '#C8102E',
  MCI: '#6CABDD', MUN: '#DA291C', NEW: '#241F20', NFO: '#E53233',
  SOU: '#D71920', TOT: '#132257', WHU: '#7A263A', WOL: '#FDB913',
};

/* ─────────────── ShirtIcon ─────────────── */

function ShirtIcon({ shortName, size = 30 }: { shortName: string; size?: number }) {
  const fill = TEAM_PRIMARY[shortName] ?? '#374151';
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <path
        d="M22 7 L6 18 L14 27 L18 20 L18 54 L42 54 L42 20 L46 27 L54 18 L38 7 C36 11 33 13 30 13 C27 13 24 11 22 7 Z"
        fill={fill}
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─────────────── FdrBadge (spelerslijst) ─────────────── */

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

/* ─────────────── PitchViewCard (veldweergave) ─────────────── */

function PitchViewCard({
  player,
  slotId,
  onRemove,
  fixture1,
  isSelected,
  onCardClick,
  onWisselClick,
}: {
  player: SelectedPlayer | null;
  slotId: string;
  onRemove: () => void;
  fixture1: FixtureCell | null;
  isSelected: boolean;
  onCardClick: () => void;
  onWisselClick: (e: React.MouseEvent) => void;
}) {
  if (!player) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 52 }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          border: '1.5px dashed rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Plus size={10} style={{ color: 'rgba(255,255,255,0.15)' }} />
        </div>
        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 8, fontFamily: 'Montserrat, sans-serif' }}>—</span>
      </div>
    );
  }

  return (
    <div
      className="pitch-card"
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        minWidth: 52, maxWidth: 68,
        cursor: 'pointer',
        position: 'relative',
      }}
      onClick={onCardClick}
      // slotId prop used by parent for key; suppress TS warning
      data-slot={slotId}
    >
      {/* Verwijder knop */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="remove-btn"
        style={{
          position: 'absolute', top: -2, right: -2,
          width: 14, height: 14, borderRadius: '50%', background: '#EF4444',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10, border: 'none', cursor: 'pointer',
          opacity: 0, transition: 'opacity 0.15s',
        }}
        title="Verwijder"
      >
        <X size={7} />
      </button>

      {/* Shirt + selectieglow */}
      <div style={{ position: 'relative' }}>
        <div style={{
          borderRadius: '50%',
          padding: 2,
          boxShadow: isSelected ? '0 0 0 2px #00FA61, 0 0 14px rgba(0,250,97,0.55)' : 'none',
          transition: 'box-shadow 0.15s',
        }}>
          <ShirtIcon shortName={player.team} size={30} />
        </div>

        {/* Wissel icoon: altijd zichtbaar op mobiel, hover op desktop */}
        <button
          onClick={onWisselClick}
          className="swap-icon"
          style={{
            position: 'absolute', bottom: -5, right: -9,
            width: 16, height: 16, borderRadius: '50%',
            background: isSelected ? '#00FA61' : 'rgba(255,255,255,0.18)',
            color: isSelected ? '#111' : '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', cursor: 'pointer',
            zIndex: 5, padding: 0,
            transition: 'background 0.15s, opacity 0.15s',
          }}
          title="Wissel"
        >
          <ArrowLeftRight size={8} />
        </button>
      </div>

      {/* Naam */}
      <span style={{
        color: '#fff', fontSize: 9, fontWeight: 700, textAlign: 'center',
        lineHeight: 1.2, maxWidth: 62, overflow: 'hidden', textOverflow: 'ellipsis',
        whiteSpace: 'nowrap', fontFamily: 'Montserrat, sans-serif',
      }}>
        {player.name}
      </span>

      {/* Prijs */}
      <span style={{ color: '#00FA61', fontSize: 8, fontFamily: 'Montserrat, sans-serif' }}>
        £{player.price.toFixed(1)}m
      </span>

      {/* Fixture badge (één per gameweek) */}
      <div style={{ marginTop: 1 }}>
        {fixture1 ? (
          <span style={{
            fontSize: 7, fontWeight: 700,
            background: FDR_PITCH_BG[fixture1.difficulty] ?? '#888',
            color: FDR_PITCH_TEXT[fixture1.difficulty] ?? '#fff',
            padding: '1px 3px', borderRadius: 2,
            lineHeight: 1.4, fontFamily: 'Montserrat, sans-serif', whiteSpace: 'nowrap',
          }}>
            {fixture1.opponent} {fixture1.location}
          </span>
        ) : (
          <span style={{
            fontSize: 7, color: 'rgba(255,255,255,0.3)',
            background: 'rgba(255,255,255,0.06)',
            padding: '1px 4px', borderRadius: 2, lineHeight: 1.4,
          }}>–</span>
        )}
      </div>
    </div>
  );
}

/* ─────────────── PitchCard (teambuilder rechterkolom, bestaand) ─────────────── */

function PitchCard({
  player, onRemove, nextFixtures,
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
      <button
        onClick={onRemove}
        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <X size={8} />
      </button>
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
      <span className="text-white text-[9px] sm:text-[10px] font-semibold text-center leading-tight line-clamp-1 max-w-full px-0.5">
        {player.name}
      </span>
      <span className="text-primary text-[8px] font-medium">£{player.price.toFixed(1)}m</span>
      {fdr && <FdrBadge cell={fdr} />}
    </div>
  );
}

/* ─────────────────────── main component ────────────────────── */

export default function TeambouwerPage() {
  const [players,        setPlayers]        = useState<FplPlayer[]>([]);
  const [fdrMap,         setFdrMap]         = useState<Record<number, FixtureCell[]>>({});
  const [gameweeks,      setGameweeks]      = useState<number[]>([]);
  const [eventDeadlines, setEventDeadlines] = useState<Record<number, string>>({});
  const [loading,        setLoading]        = useState(true);
  const [formation,      setFormation]      = useState<FormationKey>(DEFAULT_FORMATION);

  // Filters
  const [search,    setSearch]    = useState('');
  const [posFilter, setPosFilter] = useState<Position | 'ALL'>('ALL');
  const [sortField, setSortField] = useState<'price' | 'totalPoints' | 'eventPoints'>('totalPoints');
  const [sortDir,   setSortDir]   = useState<'desc' | 'asc'>('desc');
  const [page,      setPage]      = useState(0);

  // Team: slotId → player
  const [team, setTeam] = useState<Record<string, SelectedPlayer>>({});

  // Extra filters
  const [budgetFilter, setBudgetFilter] = useState<number | null>(null);

  // Tooltip state (spelerslijst hover)
  const [tooltip, setTooltip] = useState<{ player: FplPlayer; x: number; y: number } | null>(null);

  // Veld GW offset
  const [plannerOffset, setPlannerOffset] = useState(0);

  // Wissel state: per GW een mapping van display-slot → bron-slot
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [gwSwaps,      setGwSwaps]      = useState<Record<number, Record<string, string>>>({});

  // Speler info popup (veldweergave klik)
  const [playerPopup, setPlayerPopup] = useState<SelectedPlayer | null>(null);

  // Wissel foutmelding (positie-mismatch)
  const [swapError, setSwapError] = useState<string | null>(null);

  // Aanpasbaar startbudget
  const [customBudget,     setCustomBudget]     = useState(100.0);
  const [budgetEditing,    setBudgetEditing]    = useState(false);
  const [budgetInputValue, setBudgetInputValue] = useState('100.0');

  /* ── load FPL data ── */
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
        setGameweeks(fData.gameweeks ?? []);
        setEventDeadlines(fData.eventDeadlines ?? {});
        // Sla ALLE wedstrijden op (geen slice) — lookup op GW-nummer
        const map: Record<number, FixtureCell[]> = {};
        for (const t of (fData.teams ?? []) as TeamFDR[]) {
          map[t.id] = t.fixtures;
        }
        setFdrMap(map);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── load from localStorage ── */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && parsed.team) {
        setTeam(parsed.team);
        if (parsed.formation && FORMATIONS[parsed.formation as FormationKey]) {
          setFormation(parsed.formation);
        }
      } else {
        setTeam(parsed);
      }
    } catch {}
  }, []);

  // Wis wissel-foutmelding automatisch na 2 seconden
  useEffect(() => {
    if (!swapError) return;
    const t = setTimeout(() => setSwapError(null), 2000);
    return () => clearTimeout(t);
  }, [swapError]);

  const saveTeam = useCallback(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ team, formation }));
      alert('Team opgeslagen! ✓');
    } catch {}
  }, [team, formation]);

  const resetTeam = () => {
    if (confirm('Team resetten? Alle spelers worden verwijderd.')) {
      setTeam({});
      setFormation(DEFAULT_FORMATION);
      localStorage.removeItem(LS_KEY);
    }
  };

  const commitBudget = () => {
    const val = parseFloat(budgetInputValue);
    if (!isNaN(val)) {
      setCustomBudget(Math.min(120, Math.max(50, parseFloat(val.toFixed(1)))));
    }
    setBudgetEditing(false);
  };

  /* ── formation change ── */
  const changeFormation = useCallback((newFormation: FormationKey) => {
    const { def, mid, fwd } = FORMATIONS[newFormation];
    const startingCounts: Record<Position, number> = { GK: 1, DEF: def, MID: mid, FWD: fwd };

    const playersByPos: Record<Position, SelectedPlayer[]> = { GK: [], DEF: [], MID: [], FWD: [] };
    for (const player of Object.values(team)) {
      playersByPos[player.position].push(player);
    }

    const newTeam: Record<string, SelectedPlayer> = {};
    const benchOutfield: SelectedPlayer[] = [];

    for (const pos of (['GK', 'DEF', 'MID', 'FWD'] as Position[])) {
      playersByPos[pos].forEach((player, i) => {
        if (i < startingCounts[pos]) {
          const slotId = `${pos}-${i}`;
          newTeam[slotId] = { ...player, slotId };
        } else if (pos === 'GK') {
          newTeam['BENCH-0'] = { ...player, slotId: 'BENCH-0' };
        } else {
          benchOutfield.push(player);
        }
      });
    }

    benchOutfield.slice(0, 3).forEach((player, i) => {
      const slotId = `BENCH-${i + 1}`;
      newTeam[slotId] = { ...player, slotId };
    });

    setFormation(newFormation);
    setTeam(newTeam);
  }, [team]);

  /* ── team stats ── */
  const teamValues = useMemo(() => {
    const selected = Object.values(team);
    const total    = selected.reduce((s, p) => s + p.price, 0);
    const remaining = customBudget - total;
    const count = selected.length;
    const countByPos: Record<Position, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    const countByClub: Record<string, number> = {};
    for (const p of selected) {
      countByPos[p.position]++;
      countByClub[p.team] = (countByClub[p.team] ?? 0) + 1;
    }
    return { total, remaining, count, countByPos, countByClub };
  }, [team, customBudget]);

  /* ── validatie ── */
  const canAdd = useCallback((player: FplPlayer): { ok: boolean; reason?: string } => {
    const sel = Object.values(team);
    if (sel.find((p) => p.id === player.id))                          return { ok: false, reason: 'Al in team' };
    if (sel.length >= MAX_TOTAL)                                      return { ok: false, reason: 'Team vol (15)' };
    if (teamValues.countByPos[player.position] >= MAX_PER_POS[player.position])
      return { ok: false, reason: `Max ${MAX_PER_POS[player.position]} ${player.position}` };
    if ((teamValues.countByClub[player.team] ?? 0) >= MAX_PER_CLUB) return { ok: false, reason: 'Max 3/club' };
    if (teamValues.remaining < player.price)                          return { ok: false, reason: 'Budget te laag' };
    return { ok: true };
  }, [team, teamValues]);

  /* ── speler toevoegen ── */
  const addPlayer = useCallback((player: FplPlayer) => {
    const { ok, reason } = canAdd(player);
    if (!ok) { if (reason) alert(reason); return; }

    const { def, mid, fwd } = FORMATIONS[formation];
    const startingCounts: Record<Position, number> = { GK: 1, DEF: def, MID: mid, FWD: fwd };

    let slotId: string | null = null;
    for (let i = 0; i < startingCounts[player.position]; i++) {
      const id = `${player.position}-${i}`;
      if (!team[id]) { slotId = id; break; }
    }

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
  }, [team, canAdd, formation]);

  /* ── speler verwijderen ── */
  const removePlayer = useCallback((slotId: string) => {
    setTeam((prev) => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
  }, []);

  /* ── gefilterde spelerslijst ── */
  const filteredPlayers = useMemo(() => {
    let list = players;
    if (posFilter !== 'ALL') list = list.filter((p) => p.position === posFilter);
    if (budgetFilter !== null) list = list.filter((p) => p.price <= budgetFilter);
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
  }, [players, posFilter, budgetFilter, search, sortField, sortDir]);

  const totalPages = Math.ceil(filteredPlayers.length / PAGE_SIZE);
  const pagePlayers = filteredPlayers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  useEffect(() => { setPage(0); }, [search, posFilter, budgetFilter, sortField, sortDir]);

  function toggleSort(field: typeof sortField) {
    if (sortField === field) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortField(field); setSortDir('desc'); }
  }

  function SortIcon({ field }: { field: typeof sortField }) {
    if (sortField !== field) return <ArrowUpDown size={11} className="opacity-30" />;
    return sortDir === 'desc' ? <ArrowDown size={11} className="text-primary" /> : <ArrowUp size={11} className="text-primary" />;
  }

  /* ── pitch rows (teambuilder rechterkolom) ── */
  function PitchRow({ positions, label }: { positions: { pos: Position; idx: number }[]; label: string }) {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-white/25 text-[9px] uppercase tracking-widest font-semibold">{label}</span>
        <div className="flex gap-2 sm:gap-3 justify-center flex-wrap">
          {positions.map(({ pos, idx }) => {
            const slotId  = `${pos}-${idx}`;
            const player  = team[slotId] ?? null;
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

  /* ── slot arrays uit actieve formatie ── */
  const { def: defCount, mid: midCount, fwd: fwdCount } = FORMATIONS[formation];
  const defSlots = Array.from({ length: defCount }, (_, i) => ({ pos: 'DEF' as Position, idx: i }));
  const midSlots = Array.from({ length: midCount }, (_, i) => ({ pos: 'MID' as Position, idx: i }));
  const fwdSlots = Array.from({ length: fwdCount }, (_, i) => ({ pos: 'FWD' as Position, idx: i }));

  /* ── veld GW navigatie: berekeningen ── */
  const selectedPlayersList = useMemo(() => {
    const allSlots = [
      'GK-0',
      ...Array.from({ length: defCount }, (_, i) => `DEF-${i}`),
      ...Array.from({ length: midCount }, (_, i) => `MID-${i}`),
      ...Array.from({ length: fwdCount }, (_, i) => `FWD-${i}`),
      'BENCH-0', 'BENCH-1', 'BENCH-2', 'BENCH-3',
    ];
    return allSlots.map((s) => team[s]).filter(Boolean) as SelectedPlayer[];
  }, [team, defCount, midCount, fwdCount]);

  const plannerMaxOffset = useMemo(() => Math.max(0, gameweeks.length - 1), [gameweeks]);
  const safePlannerOffset = Math.min(plannerOffset, plannerMaxOffset);

  const currentGW = gameweeks[safePlannerOffset] ?? null;
  const currentDeadlineIso = currentGW ? (eventDeadlines[currentGW] ?? null) : null;

  const formattedDeadline = useMemo(() => {
    if (!currentDeadlineIso) return null;
    try {
      return new Date(currentDeadlineIso).toLocaleString('nl-NL', {
        weekday: 'short', day: 'numeric', month: 'short',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return null; }
  }, [currentDeadlineIso]);

  /* ── Haal fixture op voor huidig GW ── */
  const getFixture1 = useCallback(
    (teamId: number): FixtureCell | null => {
      if (!currentGW) return null;
      return (fdrMap[teamId] ?? []).find((f) => f.gw === currentGW) ?? null;
    },
    [fdrMap, currentGW],
  );

  /* ── Effectieve speler voor een slot (rekening houdend met wissels) ── */
  const getEffectivePlayer = useCallback(
    (displaySlot: string): SelectedPlayer | null => {
      const sourceSlot = currentGW ? (gwSwaps[currentGW]?.[displaySlot] ?? displaySlot) : displaySlot;
      const p = team[sourceSlot];
      return p ? { ...p, slotId: sourceSlot } : null;
    },
    [team, gwSwaps, currentGW],
  );

  /* ── Wissel twee slots voor huidig GW ── */
  const handleSwap = useCallback(
    (slotA: string, slotB: string) => {
      if (!currentGW) return;
      setGwSwaps((prev) => {
        const existing = { ...(prev[currentGW] ?? {}) };
        const origA = existing[slotA] ?? slotA;
        const origB = existing[slotB] ?? slotB;
        existing[slotA] = origB;
        existing[slotB] = origA;
        if (existing[slotA] === slotA) delete existing[slotA];
        if (existing[slotB] === slotB) delete existing[slotB];
        return { ...prev, [currentGW]: existing };
      });
    },
    [currentGW],
  );

  /* ── Reset wissels voor huidig GW ── */
  const resetGwSwaps = useCallback(() => {
    if (!currentGW) return;
    setGwSwaps((prev) => {
      const next = { ...prev };
      delete next[currentGW];
      return next;
    });
    setSelectedSlot(null);
  }, [currentGW]);

  /* ── Hulpfunctie: valideer of twee slots mogen wisselen ── */
  const canSwap = useCallback(
    (slotA: string, slotB: string): boolean => {
      const pA = getEffectivePlayer(slotA);
      const pB = getEffectivePlayer(slotB);
      if (!pA || !pB) return false;
      if (pA.position !== pB.position) {
        setSwapError('Je kunt alleen spelers van dezelfde positie wisselen');
        return false;
      }
      return true;
    },
    [getEffectivePlayer],
  );

  /* ── Klik op spelerkaart ── */
  const handleCardClick = useCallback(
    (displaySlot: string) => {
      const player = getEffectivePlayer(displaySlot);
      if (!player) return;
      if (selectedSlot === null) {
        // Geen selectie: open popup
        setPlayerPopup(player);
      } else if (selectedSlot === displaySlot) {
        // Zelfde slot: deselecteer
        setSelectedSlot(null);
      } else {
        // Positie validatie
        if (!canSwap(selectedSlot, displaySlot)) {
          setSelectedSlot(null);
          return;
        }
        handleSwap(selectedSlot, displaySlot);
        setSelectedSlot(null);
      }
    },
    [selectedSlot, getEffectivePlayer, handleSwap, canSwap],
  );

  /* ── Klik op wissel-icoon ── */
  const handleWisselClick = useCallback(
    (e: React.MouseEvent, displaySlot: string) => {
      e.stopPropagation();
      if (selectedSlot === displaySlot) {
        setSelectedSlot(null);
      } else if (selectedSlot !== null) {
        // Positie validatie
        if (!canSwap(selectedSlot, displaySlot)) {
          setSelectedSlot(null);
          return;
        }
        handleSwap(selectedSlot, displaySlot);
        setSelectedSlot(null);
      } else {
        setSelectedSlot(displaySlot);
      }
    },
    [selectedSlot, handleSwap, canSwap],
  );


  /* ── Veldweergave rij ── */
  function PitchViewRow({ positions, label }: { positions: { pos: Position; idx: number }[]; label: string }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <span style={{
          color: 'rgba(255,255,255,0.3)', fontSize: 9, textTransform: 'uppercase',
          letterSpacing: '0.12em', fontFamily: 'Montserrat, sans-serif', fontWeight: 600,
        }}>
          {label}
        </span>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {positions.map(({ pos, idx }) => {
            const displaySlot = `${pos}-${idx}`;
            const player = getEffectivePlayer(displaySlot);
            const fixture1 = player ? getFixture1(player.teamId) : null;
            return (
              <PitchViewCard
                key={displaySlot}
                slotId={displaySlot}
                player={player}
                onRemove={() => { if (player) removePlayer(player.slotId); }}
                fixture1={fixture1}
                isSelected={selectedSlot === displaySlot}
                onCardClick={() => handleCardClick(displaySlot)}
                onWisselClick={(e) => handleWisselClick(e, displaySlot)}
              />
            );
          })}
        </div>
      </div>
    );
  }

  /* ─────────────── render ─────────────── */
  const hasGwSwaps = currentGW != null && Object.keys(gwSwaps[currentGW] ?? {}).length > 0;

  return (
    <main
      className="min-h-screen relative"
      style={{
        backgroundImage: "url('/gradient-bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* ── Stijlen ── */}
      <style>{`
        @media (max-width: 768px) {
          .tb-grid-header,
          .tb-grid-row {
            grid-template-columns: 1fr 52px 34px 50px 36px !important;
            padding-left: 8px !important;
            padding-right: 8px !important;
          }
          .tb-grid-row {
            padding-top: 6px !important;
            padding-bottom: 6px !important;
          }
          .tb-col-wedstrijden,
          .tb-col-ptn {
            display: none !important;
          }
          .tb-grid-header span,
          .tb-grid-row .tb-cell-name span,
          .tb-grid-row .tb-cell-club {
            font-size: 9px !important;
          }
        }
        /* Wissel icoon: altijd zichtbaar op mobiel */
        .swap-icon { opacity: 1; }
        /* Op desktop: verborgen tenzij hover op kaart */
        @media (min-width: 769px) {
          .swap-icon { opacity: 0; }
          .pitch-card:hover .swap-icon { opacity: 1; }
          .pitch-card:hover .remove-btn { opacity: 1; }
        }
      `}</style>

      {/* Semi-transparante overlay */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.35)',
        zIndex: 0, pointerEvents: 'none',
      }} />

      {/* Pagina content */}
      <div className="relative" style={{ zIndex: 1 }}>
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
              Stel jouw ideale FPL-elftal samen. Max 3 per club · 15 spelers totaal.
            </p>
          </div>

          {/* Two-column layout */}
          <div className="flex flex-col lg:flex-row gap-6">

            {/* ── LEFT: spelerslijst ── */}
            <div className="flex-1 lg:w-[60%] flex flex-col gap-4">

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    placeholder="Zoek speler of club…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-medium text-white placeholder-white/30 outline-none border border-white/10 focus:border-primary/40 transition-colors"
                    style={{ background: 'rgba(0,0,0,0.25)' }}
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                      <X size={12} />
                    </button>
                  )}
                </div>
                <div className="flex gap-1 flex-wrap">
                  {(['ALL', 'GK', 'DEF', 'MID', 'FWD'] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setPosFilter(pos)}
                      className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: posFilter === pos ? '#00FA61' : 'rgba(255,255,255,0.08)',
                        color: posFilter === pos ? '#111' : 'rgba(255,255,255,0.5)',
                      }}
                    >
                      {pos}
                    </button>
                  ))}
                  {/* Budget filter */}
                  <select
                    value={budgetFilter ?? ''}
                    onChange={(e) =>
                      setBudgetFilter(e.target.value === '' ? null : parseFloat(e.target.value))
                    }
                    className="px-2 py-2 rounded-lg text-xs font-semibold outline-none border border-white/10 transition-all"
                    style={{
                      background: budgetFilter !== null ? 'rgba(0,250,97,0.12)' : 'rgba(255,255,255,0.08)',
                      color: budgetFilter !== null ? '#00FA61' : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    <option value="" style={{ background: '#0d0d1a', color: '#fff' }}>Max £</option>
                    {Array.from({ length: 22 }, (_, i) => {
                      const val = parseFloat((15.0 - i * 0.5).toFixed(1));
                      return (
                        <option key={val} value={val} style={{ background: '#0d0d1a', color: '#fff' }}>
                          £{val.toFixed(1)}m
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Tabel */}
              <div
                className="rounded-2xl border border-white/8 overflow-hidden"
                style={{ background: 'rgba(0,0,0,0.3)' }}
              >
                {/* Header */}
                <div
                  className="tb-grid-header grid text-[10px] font-semibold uppercase tracking-widest text-white/30 px-3 py-2 border-b border-white/8"
                  style={{ gridTemplateColumns: '2fr 80px 50px 110px 60px 60px 44px' }}
                >
                  <span>Speler</span>
                  <span>Club</span>
                  <span>Pos</span>
                  <span className="tb-col-wedstrijden text-center">Wedstrijden</span>
                  <button className="flex items-center gap-1 hover:text-white/60 transition-colors" onClick={() => toggleSort('price')}>
                    Prijs <SortIcon field="price" />
                  </button>
                  <button className="tb-col-ptn flex items-center gap-1 hover:text-white/60 transition-colors" onClick={() => toggleSort('totalPoints')}>
                    Ptn <SortIcon field="totalPoints" />
                  </button>
                  <span />
                </div>

                {/* Rijen */}
                {loading ? (
                  <div className="py-12 text-center text-white/30 text-sm">Spelers laden…</div>
                ) : pagePlayers.length === 0 ? (
                  <div className="py-12 text-center text-white/30 text-sm">Geen spelers gevonden.</div>
                ) : (
                  pagePlayers.map((p) => {
                    const { ok } = canAdd(p);
                    const inTeam  = !!Object.values(team).find((t) => t.id === p.id);
                    const fixtures = (fdrMap[p.teamId] ?? []).slice(0, 3);
                    return (
                      <div
                        key={p.id}
                        className="tb-grid-row grid items-center px-3 py-2 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors"
                        style={{ gridTemplateColumns: '2fr 80px 50px 110px 60px 60px 44px' }}
                        onMouseEnter={(e) => {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          setTooltip({ player: p, x: rect.right, y: rect.top });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      >
                        {/* Naam + foto */}
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="relative w-7 h-7 rounded-full overflow-hidden shrink-0 border border-white/10"
                            style={{ background: 'rgba(0,0,0,0.3)' }}
                          >
                            <Image src={p.imageUrl} alt={p.name} fill className="object-cover" style={{ objectPosition: '50% 10%' }} unoptimized />
                          </div>
                          <span className="text-white text-xs font-medium truncate">{p.name}</span>
                        </div>

                        {/* Club */}
                        <span className="text-white/50 text-xs truncate">{p.team}</span>

                        {/* Positie badge */}
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-md w-fit"
                          style={{
                            background:
                              p.position === 'GK'  ? 'rgba(255,215,0,0.15)' :
                              p.position === 'DEF' ? 'rgba(0,250,97,0.12)' :
                              p.position === 'MID' ? 'rgba(99,102,241,0.15)' :
                              'rgba(239,68,68,0.15)',
                            color:
                              p.position === 'GK'  ? '#FFD700' :
                              p.position === 'DEF' ? '#00FA61' :
                              p.position === 'MID' ? '#818CF8' :
                              '#F87171',
                          }}
                        >
                          {p.position}
                        </span>

                        {/* FDR badges */}
                        <div className="tb-col-wedstrijden flex gap-1 justify-center">
                          {fixtures.length > 0
                            ? fixtures.map((f, i) => <FdrBadge key={i} cell={f} />)
                            : <span className="text-white/20 text-[9px]">—</span>}
                        </div>

                        {/* Prijs */}
                        <span className="text-white/70 text-xs font-medium">£{p.price.toFixed(1)}m</span>

                        {/* Punten */}
                        <span className="tb-col-ptn text-white/50 text-xs">{p.totalPoints}pt</span>

                        {/* Toevoegen/verwijderen */}
                        <button
                          onClick={() => inTeam
                            ? removePlayer(Object.values(team).find((t) => t.id === p.id)!.slotId)
                            : addPlayer(p)}
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

              {/* Paginering */}
              <div className="flex items-center justify-between">
                <span className="text-white/30 text-xs">
                  {filteredPlayers.length} spelers · pagina {page + 1} / {Math.max(totalPages, 1)}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-25 transition-all hover:bg-white/8"
                    style={{ background: 'rgba(0,0,0,0.2)' }}
                  >
                    <ChevronLeft size={14} className="text-white/60" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-25 transition-all hover:bg-white/8"
                    style={{ background: 'rgba(0,0,0,0.2)' }}
                  >
                    <ChevronRight size={14} className="text-white/60" />
                  </button>
                </div>
              </div>
            </div>

            {/* ── RIGHT: veld + controls ── */}
            <div className="lg:w-[40%] flex flex-col gap-4">

              {/* Budget stats */}
              <div
                className="rounded-2xl p-4 border border-white/8 flex flex-col gap-3"
                style={{ background: 'rgba(0,0,0,0.3)' }}
              >
                {/* Budget aanpasbaar */}
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-white/40 text-[10px] uppercase tracking-widest">Budget</span>
                  {budgetEditing ? (
                    <div className="flex items-center gap-1">
                      <span className="text-white/40 text-xs">£</span>
                      <input
                        type="number"
                        value={budgetInputValue}
                        onChange={(e) => setBudgetInputValue(e.target.value)}
                        onBlur={commitBudget}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitBudget();
                          if (e.key === 'Escape') setBudgetEditing(false);
                        }}
                        autoFocus
                        min={50} max={120} step={0.1}
                        className="rounded-lg text-sm font-bold text-white outline-none border border-primary/40 text-right"
                        style={{ width: 72, background: 'rgba(0,250,97,0.08)', padding: '3px 6px' }}
                      />
                      <span className="text-white/40 text-xs">m</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setBudgetEditing(true); setBudgetInputValue(customBudget.toFixed(1)); }}
                      className="flex items-center gap-1.5 text-sm font-bold hover:opacity-80 transition-opacity"
                      style={{ color: '#00FA61' }}
                      title="Klik om budget aan te passen"
                    >
                      £{customBudget.toFixed(1)}m
                      <span style={{ fontSize: 10, opacity: 0.6 }}>✏️</span>
                    </button>
                  )}
                </div>
                {/* Waarde / Resterend / Spelers */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Waarde</div>
                    <div className="text-white font-bold text-base">£{teamValues.total.toFixed(1)}m</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Resterend</div>
                    <div className="font-bold text-base" style={{ color: teamValues.remaining < 0 ? '#F87171' : '#00FA61' }}>
                      £{teamValues.remaining.toFixed(1)}m
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Spelers</div>
                    <div className="text-white font-bold text-base">{teamValues.count}/15</div>
                  </div>
                </div>
              </div>

              {/* Formatie selector */}
              <div
                className="rounded-2xl p-3 border border-white/8"
                style={{ background: 'rgba(0,0,0,0.3)' }}
              >
                <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold mb-2">Formatie</p>
                <div className="flex flex-wrap gap-1.5">
                  {FORMATION_KEYS.map((f) => (
                    <button
                      key={f}
                      onClick={() => changeFormation(f)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={{
                        background: formation === f ? '#00FA61' : 'rgba(255,255,255,0.06)',
                        color:      formation === f ? '#111'    : 'rgba(255,255,255,0.5)',
                        border:     formation === f ? 'none'    : '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      {f}
                    </button>
                  ))}
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
                <div className="relative w-full h-full py-4 px-2">
                  <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 pointer-events-none"
                    style={{ width: 80, height: 80 }}
                  />
                  <div className="absolute left-4 right-4 border-t border-white/10 pointer-events-none" style={{ top: '50%' }} />
                  <div className="flex flex-col gap-4 relative z-10">
                    <PitchRow label="Aanval"      positions={fwdSlots} />
                    <PitchRow label="Middenveld"  positions={midSlots} />
                    <PitchRow label="Verdediging" positions={defSlots} />
                    <PitchRow label="Keeper"      positions={[{ pos: 'GK', idx: 0 }]} />
                  </div>
                </div>
              </div>

              {/* Bank */}
              <div
                className="rounded-2xl p-4 border border-white/8"
                style={{ background: 'rgba(0,0,0,0.3)' }}
              >
                <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold mb-3">Bank</p>
                <div className="flex gap-3 justify-around">
                  {BENCH_SLOTS.map(({ slotId, label }) => {
                    const player   = team[slotId] ?? null;
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

              {/* Positie overzicht */}
              <div
                className="rounded-2xl p-4 border border-white/8"
                style={{ background: 'rgba(0,0,0,0.3)' }}
              >
                <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold mb-3 flex items-center gap-2">
                  <Users size={11} /> Samenstelling
                </p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {(['GK', 'DEF', 'MID', 'FWD'] as Position[]).map((pos) => {
                    const count = teamValues.countByPos[pos];
                    const max   = MAX_PER_POS[pos];
                    const full  = count >= max;
                    return (
                      <div key={pos}>
                        <div className="text-xs font-bold" style={{ color: full ? '#F87171' : '#00FA61' }}>
                          {count}/{max}
                        </div>
                        <div className="text-white/30 text-[10px]">{pos}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Acties */}
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
                  style={{ background: 'rgba(0,0,0,0.2)' }}
                >
                  <RotateCcw size={14} /> Reset
                </button>
              </div>
            </div>
          </div>

          {/* ── Veld met GW navigatie ── */}
          {selectedPlayersList.length > 0 && (
            <div className="mt-8" style={{ fontFamily: 'Montserrat, sans-serif' }}>

              {/* GW nav header */}
              <div style={{
                background: '#1F0E84',
                borderRadius: '16px 16px 0 0',
                padding: '20px 24px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}>
                {/* Navigatie + titel */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <button
                    onClick={() => { setPlannerOffset((o) => Math.max(0, o - 1)); setSelectedSlot(null); }}
                    disabled={plannerOffset === 0}
                    style={{
                      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                      background: plannerOffset === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: plannerOffset === 0 ? 'rgba(255,255,255,0.2)' : '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: plannerOffset === 0 ? 'not-allowed' : 'pointer',
                      transition: 'background 0.15s',
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <h2 style={{
                      color: '#fff', fontWeight: 800, fontSize: 20, margin: 0,
                      fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.01em',
                    }}>
                      {currentGW ? `Gameweek ${currentGW}` : '—'}
                    </h2>
                    {formattedDeadline && (
                      <p style={{
                        color: 'rgba(255,255,255,0.4)', fontSize: 11,
                        margin: '3px 0 0', fontFamily: 'Montserrat, sans-serif',
                      }}>
                        Deadline: {formattedDeadline}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => { setPlannerOffset((o) => Math.min(plannerMaxOffset, o + 1)); setSelectedSlot(null); }}
                    disabled={plannerOffset >= plannerMaxOffset}
                    style={{
                      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                      background: plannerOffset >= plannerMaxOffset ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: plannerOffset >= plannerMaxOffset ? 'rgba(255,255,255,0.2)' : '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: plannerOffset >= plannerMaxOffset ? 'not-allowed' : 'pointer',
                      transition: 'background 0.15s',
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Stats balk: alleen In the bank */}
                <div style={{ marginTop: 16, background: 'rgba(0,0,0,0.25)', borderRadius: 10, textAlign: 'center', padding: '10px 8px' }}>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3, fontFamily: 'Montserrat, sans-serif' }}>
                    In the bank
                  </div>
                  <div style={{
                    fontWeight: 800, fontSize: 20, fontFamily: 'Montserrat, sans-serif', lineHeight: 1,
                    color: teamValues.remaining >= 0 ? '#00FA61' : '#FF4444',
                  }}>
                    £{teamValues.remaining.toFixed(1)}m
                  </div>
                </div>
              </div>

              {/* Wissel status + reset knop boven het veld */}
              {(selectedSlot || hasGwSwaps || swapError) && (
                <div style={{
                  background: 'rgba(0,0,0,0.45)',
                  padding: '10px 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <span style={{
                    color: swapError ? '#F87171' : selectedSlot ? '#00FA61' : 'rgba(255,255,255,0.4)',
                    fontSize: 11, fontFamily: 'Montserrat, sans-serif',
                  }}>
                    {swapError
                      ? swapError
                      : selectedSlot
                        ? `Selecteer een andere speler om te wisselen…`
                        : `GW${currentGW}: wissels actief`}
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {selectedSlot && (
                      <button
                        onClick={() => setSelectedSlot(null)}
                        style={{
                          padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                          background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)',
                          border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer',
                          fontFamily: 'Montserrat, sans-serif',
                        }}
                      >
                        Annuleer
                      </button>
                    )}
                    {hasGwSwaps && (
                      <button
                        onClick={resetGwSwaps}
                        style={{
                          padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                          background: 'rgba(255,100,100,0.12)', color: '#F87171',
                          border: '1px solid rgba(255,100,100,0.2)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 5,
                          fontFamily: 'Montserrat, sans-serif',
                        }}
                      >
                        <RotateCcw size={10} /> Reset wissels
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Voetbalveld */}
              <div style={{
                background: 'linear-gradient(180deg, #1a5c20 0%, #2d7a35 35%, #2d7a35 65%, #1a5c20 100%)',
                padding: '20px 12px',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Veldlijnen */}
                <div style={{
                  position: 'absolute', left: '50%', top: '50%',
                  transform: 'translate(-50%,-50%)',
                  width: 80, height: 80, borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.08)',
                  pointerEvents: 'none',
                }} />
                <div style={{
                  position: 'absolute', left: 16, right: 16, top: '50%',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  pointerEvents: 'none',
                }} />

                {/* Spelersrijen: FWD → MID → DEF → GK */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 1 }}>
                  <PitchViewRow label="Aanval"      positions={fwdSlots} />
                  <PitchViewRow label="Middenveld"  positions={midSlots} />
                  <PitchViewRow label="Verdediging" positions={defSlots} />
                  <PitchViewRow label="Keeper"      positions={[{ pos: 'GK', idx: 0 }]} />
                </div>
              </div>

              {/* Bank (veldweergave) */}
              <div style={{
                background: '#1F0E84',
                borderRadius: '0 0 16px 16px',
                padding: '14px 20px',
                borderTop: '1px solid rgba(255,255,255,0.08)',
              }}>
                <p style={{
                  color: 'rgba(255,255,255,0.3)', fontSize: 9, textTransform: 'uppercase',
                  letterSpacing: '0.12em', fontWeight: 600, marginBottom: 12,
                  fontFamily: 'Montserrat, sans-serif',
                }}>
                  Bank
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'space-around', flexWrap: 'wrap' }}>
                  {BENCH_SLOTS.map(({ slotId, label }) => {
                    const effectivePlayer = getEffectivePlayer(slotId);
                    const fixture1 = effectivePlayer ? getFixture1(effectivePlayer.teamId) : null;
                    return (
                      <div key={slotId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, fontFamily: 'Montserrat, sans-serif' }}>
                          {label}
                        </span>
                        <PitchViewCard
                          slotId={slotId}
                          player={effectivePlayer}
                          onRemove={() => { if (effectivePlayer) removePlayer(effectivePlayer.slotId); }}
                          fixture1={fixture1}
                          isSelected={selectedSlot === slotId}
                          onCardClick={() => handleCardClick(slotId)}
                          onWisselClick={(e) => handleWisselClick(e, slotId)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Geselecteerde spelers lijst: wisselen + hover stats ── */}
              {(() => {
                const allSlots = [
                  'GK-0',
                  ...Array.from({ length: defCount }, (_, i) => `DEF-${i}`),
                  ...Array.from({ length: midCount }, (_, i) => `MID-${i}`),
                  ...Array.from({ length: fwdCount }, (_, i) => `FWD-${i}`),
                  'BENCH-0', 'BENCH-1', 'BENCH-2', 'BENCH-3',
                ];
                const rows = allSlots
                  .map((ds) => ({ displaySlot: ds, player: getEffectivePlayer(ds) }))
                  .filter((r): r is { displaySlot: string; player: SelectedPlayer } => r.player !== null);
                if (rows.length === 0) return null;
                const posBg: Record<string, string> = {
                  GK: 'rgba(255,215,0,0.15)', DEF: 'rgba(0,250,97,0.12)',
                  MID: 'rgba(99,102,241,0.15)', FWD: 'rgba(239,68,68,0.15)',
                };
                const posColor: Record<string, string> = {
                  GK: '#FFD700', DEF: '#00FA61', MID: '#818CF8', FWD: '#F87171',
                };
                return (
                  <div style={{
                    background: 'rgba(0,0,0,0.18)',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    padding: '14px 20px',
                    fontFamily: 'Montserrat, sans-serif',
                  }}>
                    <p style={{
                      color: 'rgba(255,255,255,0.3)', fontSize: 9, textTransform: 'uppercase',
                      letterSpacing: '0.12em', fontWeight: 600, marginBottom: 10,
                    }}>
                      Opstelling — klik ⇄ om te wisselen · hover voor stats
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {rows.map(({ displaySlot, player }) => {
                        const isBench = displaySlot.startsWith('BENCH');
                        const isSelectedHere = selectedSlot === displaySlot;
                        return (
                          <div
                            key={displaySlot}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: '5px 8px', borderRadius: 8,
                              background: isSelectedHere ? 'rgba(0,250,97,0.08)' : 'transparent',
                              border: isSelectedHere ? '1px solid rgba(0,250,97,0.25)' : '1px solid transparent',
                              transition: 'background 0.15s, border 0.15s',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => {
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                              setTooltip({ player, x: rect.right, y: rect.top });
                            }}
                            onMouseLeave={() => setTooltip(null)}
                            onClick={() => setPlayerPopup(player)}
                          >
                            <span style={{
                              fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 4,
                              background: isBench ? 'rgba(255,255,255,0.06)' : (posBg[player.position] ?? 'rgba(255,255,255,0.06)'),
                              color: isBench ? 'rgba(255,255,255,0.35)' : (posColor[player.position] ?? '#fff'),
                              minWidth: 26, textAlign: 'center', flexShrink: 0,
                            }}>
                              {isBench ? 'BNK' : player.position}
                            </span>
                            <ShirtIcon shortName={player.team} size={18} />
                            <span style={{ color: '#fff', fontSize: 11, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {player.name}
                            </span>
                            <span style={{ color: '#00FA61', fontSize: 10, flexShrink: 0 }}>
                              £{player.price.toFixed(1)}m
                            </span>
                            <button
                              onClick={(e) => handleWisselClick(e, displaySlot)}
                              style={{
                                width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                                background: isSelectedHere ? '#00FA61' : 'rgba(255,255,255,0.08)',
                                color: isSelectedHere ? '#111' : 'rgba(255,255,255,0.55)',
                                border: isSelectedHere ? 'none' : '1px solid rgba(255,255,255,0.12)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer',
                              }}
                              title="Wissel"
                            >
                              <ArrowLeftRight size={10} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

            </div>
          )}

        </div>
      </div>

      {/* ── Speler info popup (veldweergave klik) ── */}
      {playerPopup && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 9998,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setPlayerPopup(null)}
        >
          <div
            style={{
              background: 'rgba(31,14,132,0.97)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderRadius: 18,
              padding: 24,
              width: '100%',
              maxWidth: 320,
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
              position: 'relative',
              fontFamily: 'Montserrat, sans-serif',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sluitknop */}
            <button
              onClick={() => setPlayerPopup(null)}
              style={{
                position: 'absolute', top: 14, right: 14,
                width: 28, height: 28, borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>

            {/* Speler naam + info */}
            <div style={{ marginBottom: 16, paddingRight: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <ShirtIcon shortName={playerPopup.team} size={36} />
                <div>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, lineHeight: 1.2 }}>
                    {playerPopup.name}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>
                    {playerPopup.team} · {playerPopup.position} · £{playerPopup.price.toFixed(1)}m
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 10, overflow: 'hidden' }}>
              {[
                { label: '⚽ Goals', value: playerPopup.goals },
                { label: '🅰️ Assists', value: playerPopup.assists },
                ...(playerPopup.position === 'GK' || playerPopup.position === 'DEF'
                  ? [{ label: '🧤 Clean sheets', value: playerPopup.cleanSheets }]
                  : []),
                { label: '🎯 xG dit seizoen', value: parseFloat(playerPopup.xGoals || '0').toFixed(2) },
                { label: '👥 Eigendom', value: `${playerPopup.ownership}%` },
                { label: '⏱️ Minuten', value: playerPopup.minutes },
              ].map((row, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '9px 12px',
                    background: i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                  }}
                >
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{row.label}</span>
                  <span style={{ color: '#00FA61', fontWeight: 700, fontSize: 13 }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Spelerslijst hover tooltip ── */}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x + 12,
            top: tooltip.y,
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        >
          <div
            className="rounded-xl px-3 py-2.5 text-xs border border-white/15"
            style={{
              background: 'rgba(12,8,35,0.94)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              minWidth: 148,
            }}
          >
            <div className="font-semibold text-white mb-2 text-[11px] truncate">
              {tooltip.player.name}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <span className="text-white/40 text-[10px]">Goals</span>
              <span className="text-white font-medium text-[10px]">{tooltip.player.goals}</span>
              <span className="text-white/40 text-[10px]">Assists</span>
              <span className="text-white font-medium text-[10px]">{tooltip.player.assists}</span>
              <span className="text-white/40 text-[10px]">Punten</span>
              <span className="text-white font-medium text-[10px]">{tooltip.player.totalPoints}</span>
              <span className="text-white/40 text-[10px]">Minuten</span>
              <span className="text-white font-medium text-[10px]">{tooltip.player.minutes}</span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

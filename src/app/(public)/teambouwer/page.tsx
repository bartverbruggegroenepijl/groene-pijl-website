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

/* ── FDR kleuren voor veldweergave (gebruikersinstructies) ── */
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
  player, onRemove, fixtures3,
}: {
  player: SelectedPlayer | null;
  slotId: string;
  onRemove: () => void;
  fixtures3: (FixtureCell | null)[];
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
      className="group relative"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 52, maxWidth: 68 }}
    >
      <button
        onClick={onRemove}
        className="absolute -top-0.5 -right-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          width: 14, height: 14, borderRadius: '50%', background: '#EF4444',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10, border: 'none', cursor: 'pointer',
        }}
      >
        <X size={7} />
      </button>

      <ShirtIcon shortName={player.team} size={30} />

      <span style={{
        color: '#fff', fontSize: 9, fontWeight: 700, textAlign: 'center',
        lineHeight: 1.2, maxWidth: 62, overflow: 'hidden', textOverflow: 'ellipsis',
        whiteSpace: 'nowrap', fontFamily: 'Montserrat, sans-serif',
      }}>
        {player.name}
      </span>

      <span style={{ color: '#00FA61', fontSize: 8, fontFamily: 'Montserrat, sans-serif' }}>
        £{player.price.toFixed(1)}m
      </span>

      <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', marginTop: 1 }}>
        {fixtures3.map((f, i) =>
          f ? (
            <span key={i} style={{
              fontSize: 7, fontWeight: 700,
              background: FDR_PITCH_BG[f.difficulty] ?? '#888',
              color: FDR_PITCH_TEXT[f.difficulty] ?? '#fff',
              padding: '1px 3px', borderRadius: 2,
              lineHeight: 1.4, fontFamily: 'Montserrat, sans-serif', whiteSpace: 'nowrap',
            }}>
              {f.opponent}({f.location})
            </span>
          ) : (
            <span key={i} style={{
              fontSize: 7, color: 'rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.06)',
              padding: '1px 4px', borderRadius: 2, lineHeight: 1.4,
            }}>–</span>
          )
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

  // Tooltip state (player stats on hover)
  const [tooltip, setTooltip] = useState<{ player: FplPlayer; x: number; y: number } | null>(null);

  // Veld GW offset
  const [plannerOffset, setPlannerOffset] = useState(0);

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

  /* ── load from localStorage (handles old + new format) ── */
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

  /* ── formation change: redistribute players ── */
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
    if (sel.find((p) => p.id === player.id))                          return { ok: false, reason: 'Al in team' };
    if (sel.length >= MAX_TOTAL)                                      return { ok: false, reason: 'Team vol (15)' };
    if (teamValues.countByPos[player.position] >= MAX_PER_POS[player.position])
      return { ok: false, reason: `Max ${MAX_PER_POS[player.position]} ${player.position}` };
    if ((teamValues.countByClub[player.team] ?? 0) >= MAX_PER_CLUB) return { ok: false, reason: 'Max 3/club' };
    if (teamValues.remaining < player.price)                          return { ok: false, reason: 'Budget te laag' };
    return { ok: true };
  }, [team, teamValues]);

  /* ── add player to next free slot (formation-aware) ── */
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

  /* ── pitch rows (bestaand teambuilder veld) ── */
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

  /* ── compute slot arrays from active formation ── */
  const { def: defCount, mid: midCount, fwd: fwdCount } = FORMATIONS[formation];
  const defSlots = Array.from({ length: defCount }, (_, i) => ({ pos: 'DEF' as Position, idx: i }));
  const midSlots = Array.from({ length: midCount }, (_, i) => ({ pos: 'MID' as Position, idx: i }));
  const fwdSlots = Array.from({ length: fwdCount }, (_, i) => ({ pos: 'FWD' as Position, idx: i }));

  /* ── Veld GW navigatie: computed ── */
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

  // Huidig GW-nummer en deadline
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

  // 3 GW-nummers voor fixture badges per speler
  const pitchGws = useMemo(() => {
    return (
      [gameweeks[safePlannerOffset], gameweeks[safePlannerOffset + 1], gameweeks[safePlannerOffset + 2]] as
        (number | undefined)[]
    ).filter((g): g is number => g !== undefined);
  }, [gameweeks, safePlannerOffset]);

  // Hulpfunctie: haal 3 fixtures op per speler op basis van pitchGws
  const getFixtures3 = useCallback(
    (teamId: number): (FixtureCell | null)[] => {
      const all = fdrMap[teamId] ?? [];
      return pitchGws.map((gw) => all.find((f) => f.gw === gw) ?? null);
    },
    [fdrMap, pitchGws],
  );

  // Veld stats: Rating en xPts
  const pitchStats = useMemo(() => {
    if (!currentGW || selectedPlayersList.length === 0) return { rating: 0, xPts: 0 };
    const starters    = selectedPlayersList.filter((p) => !p.slotId.startsWith('BENCH'));
    const completedGWs = Math.max(1, (gameweeks[0] ?? 31) - 1);
    let ratingSum = 0;
    let xPtsTotal = 0;
    for (const p of starters) {
      const f = (fdrMap[p.teamId] ?? []).find((fx) => fx.gw === currentGW);
      ratingSum += f ? (6 - f.difficulty) / 5 : 0;
      xPtsTotal += p.totalPoints / completedGWs;
    }
    return {
      rating: Math.round((ratingSum / Math.max(1, starters.length)) * 100),
      xPts:   Math.round(xPtsTotal),
    };
  }, [selectedPlayersList, fdrMap, currentGW, gameweeks]);

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
            const slotId = `${pos}-${idx}`;
            const player = team[slotId] ?? null;
            return (
              <PitchViewCard
                key={slotId}
                slotId={slotId}
                player={player}
                onRemove={() => removePlayer(slotId)}
                fixtures3={player ? getFixtures3(player.teamId) : pitchGws.map(() => null)}
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
      className="min-h-screen relative"
      style={{
        backgroundImage: "url('/gradient-bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* ── Mobiele tabel fixes ── */}
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
      `}</style>

      {/* Semi-transparante overlay voor leesbaarheid */}
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
              Stel jouw ideale FPL-elftal samen. Budget: £{BUDGET.toFixed(1)}m · Max 3 per club · 15 spelers totaal.
            </p>
          </div>

          {/* Two-column layout */}
          <div className="flex flex-col lg:flex-row gap-6">

            {/* ── LEFT: player list ── */}
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

              {/* Table */}
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

                {/* Rows */}
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
                        {/* Name + photo */}
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

                        {/* Position badge */}
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

                        {/* Price */}
                        <span className="text-white/70 text-xs font-medium">£{p.price.toFixed(1)}m</span>

                        {/* Points */}
                        <span className="tb-col-ptn text-white/50 text-xs">{p.totalPoints}pt</span>

                        {/* Add/Remove */}
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

            {/* ── RIGHT: pitch + controls ── */}
            <div className="lg:w-[40%] flex flex-col gap-4">

              {/* Budget stats */}
              <div
                className="rounded-2xl p-4 border border-white/8 grid grid-cols-3 gap-3"
                style={{ background: 'rgba(0,0,0,0.3)' }}
              >
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

              {/* ── Formation selector ── */}
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
                  {/* Field markings */}
                  <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 pointer-events-none"
                    style={{ width: 80, height: 80 }}
                  />
                  <div className="absolute left-4 right-4 border-t border-white/10 pointer-events-none" style={{ top: '50%' }} />

                  {/* Rows: FWD → MID → DEF → GK */}
                  <div className="flex flex-col gap-4 relative z-10">
                    <PitchRow label="Aanval"      positions={fwdSlots} />
                    <PitchRow label="Middenveld"  positions={midSlots} />
                    <PitchRow label="Verdediging" positions={defSlots} />
                    <PitchRow label="Keeper"      positions={[{ pos: 'GK', idx: 0 }]} />
                  </div>
                </div>
              </div>

              {/* Bench */}
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

              {/* Position summary */}
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
                    onClick={() => setPlannerOffset((o) => Math.max(0, o - 1))}
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
                    onClick={() => setPlannerOffset((o) => Math.min(plannerMaxOffset, o + 1))}
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

                {/* Stats balk */}
                <div style={{
                  display: 'flex', gap: 0, justifyContent: 'center', marginTop: 16,
                  background: 'rgba(0,0,0,0.25)', borderRadius: 10, overflow: 'hidden',
                }}>
                  <div style={{ flex: 1, textAlign: 'center', padding: '10px 8px', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3, fontFamily: 'Montserrat, sans-serif' }}>
                      Team Rating
                    </div>
                    <div style={{ color: '#00FA61', fontWeight: 800, fontSize: 20, fontFamily: 'Montserrat, sans-serif', lineHeight: 1 }}>
                      {pitchStats.rating}%
                    </div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center', padding: '10px 8px', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3, fontFamily: 'Montserrat, sans-serif' }}>
                      Predicted Pts
                    </div>
                    <div style={{ color: '#fff', fontWeight: 800, fontSize: 20, fontFamily: 'Montserrat, sans-serif', lineHeight: 1 }}>
                      {pitchStats.xPts}
                    </div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center', padding: '10px 8px' }}>
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
              </div>

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

              {/* Bank */}
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
                    const player = team[slotId] ?? null;
                    return (
                      <div key={slotId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, fontFamily: 'Montserrat, sans-serif' }}>
                          {label}
                        </span>
                        <PitchViewCard
                          slotId={slotId}
                          player={player}
                          onRemove={() => removePlayer(slotId)}
                          fixtures3={player ? getFixtures3(player.teamId) : pitchGws.map(() => null)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* ── Player stats tooltip (fixed overlay) ── */}
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

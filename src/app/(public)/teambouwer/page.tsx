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

/* ── FDR stijlen voor spelerslijst ── */
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

/* ─────────────── PitchCard (veldweergave spelerkaart) ─────────────── */

function PitchCard({
  player,
  isSelected,
  fixture,
  onSwapClick,
  onCardClick,
  onHoverEnter,
  onHoverLeave,
}: {
  player: SelectedPlayer & { isBank: boolean };
  isSelected: boolean;
  fixture: FixtureCell | null;
  onSwapClick: (e: React.MouseEvent) => void;
  onCardClick: () => void;
  onHoverEnter: (e: React.MouseEvent<HTMLDivElement>) => void;
  onHoverLeave: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="pitch-card"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        cursor: 'pointer',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'transform 180ms ease',
      }}
      onClick={onCardClick}
      onMouseEnter={(e) => { setHovered(true); onHoverEnter(e); }}
      onMouseLeave={() => { setHovered(false); onHoverLeave(); }}
    >
      {/* Avatar cirkel */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          flexShrink: 0,
          border: isSelected ? '2.5px solid #00FA61' : '2px solid rgba(255,255,255,0.22)',
          boxShadow: isSelected
            ? '0 0 18px rgba(0,250,97,0.65), 0 0 36px rgba(0,250,97,0.25)'
            : hovered
            ? '0 0 12px rgba(0,250,97,0.35)'
            : undefined,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(0,250,97,0.15) 0%, rgba(31,14,132,0.55) 100%)',
          position: 'relative',
        }}
      >
        {player.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={player.imageUrl}
            alt={player.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 10%' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, rgba(0,250,97,0.22) 0%, rgba(123,47,255,0.32) 100%)',
            }}
          >
            <span
              style={{
                color: '#00FA61',
                fontWeight: 800,
                fontSize: 16,
                fontFamily: 'Montserrat, sans-serif',
                userSelect: 'none',
              }}
            >
              {player.name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Naam badge */}
      <span
        style={{
          background: isSelected ? '#00FA61' : 'rgba(0,0,0,0.72)',
          color: isSelected ? '#111' : '#fff',
          fontSize: 9,
          fontWeight: 700,
          padding: '2px 6px',
          borderRadius: 4,
          maxWidth: 72,
          textAlign: 'center' as const,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap' as const,
          fontFamily: 'Montserrat, sans-serif',
          display: 'block',
          lineHeight: 1.4,
          flexShrink: 0,
          textShadow: 'none',
        }}
      >
        {player.name}
      </span>

      {/* Fixture badge */}
      {fixture ? (
        <span
          style={{
            fontSize: 7.5,
            fontWeight: 700,
            background: FDR_PITCH_BG[fixture.difficulty] ?? '#888',
            color: FDR_PITCH_TEXT[fixture.difficulty] ?? '#fff',
            padding: '1px 4px',
            borderRadius: 3,
            lineHeight: 1.4,
            fontFamily: 'Montserrat, sans-serif',
            whiteSpace: 'nowrap' as const,
          }}
        >
          {fixture.opponent}({fixture.location})
        </span>
      ) : (
        <span style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.3)', fontFamily: 'Montserrat, sans-serif' }}>
          —
        </span>
      )}

      {/* Wissel icoon (altijd op mobiel, hover op desktop) */}
      <button
        className="swap-icon"
        onClick={onSwapClick}
        style={{
          position: 'absolute',
          top: -6,
          right: -6,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: isSelected ? '#00FA61' : 'rgba(0,0,0,0.65)',
          color: isSelected ? '#111' : 'rgba(255,255,255,0.8)',
          border: `1.5px solid ${isSelected ? '#00FA61' : 'rgba(255,255,255,0.25)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: isSelected ? '0 0 8px rgba(0,250,97,0.5)' : undefined,
        }}
        title="Wissel"
      >
        <ArrowLeftRight size={9} />
      </button>
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

  // Tooltip state (hover in spelerslijst en veld)
  const [tooltip, setTooltip] = useState<{ player: FplPlayer; x: number; y: number; side?: 'left' | 'right' } | null>(null);

  // Veld GW offset
  const [plannerOffset, setPlannerOffset] = useState(0);

  // Wissel state
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [gwPlayerBank,     setGwPlayerBank]     = useState<Record<number, Record<number, boolean>>>({});

  // Speler info popup (klik op veldkaart)
  const [playerPopup, setPlayerPopup] = useState<SelectedPlayer | null>(null);

  // Wissel foutmelding
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

  /* ── veld GW navigatie: berekeningen ── */
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

  /* ── GW team: alle spelers met effectief isBank per GW ── */
  const gwTeamPlayers = useMemo<Array<SelectedPlayer & { isBank: boolean }>>(() => {
    return Object.values(team).map((p) => {
      const defaultIsBank = p.slotId.startsWith('BENCH');
      const gwOverride    = currentGW != null ? gwPlayerBank[currentGW]?.[p.id] : undefined;
      return { ...p, isBank: gwOverride !== undefined ? gwOverride : defaultIsBank };
    });
  }, [team, gwPlayerBank, currentGW]);

  /* ── GW starter/bench rijen ── */
  const gwStarters = gwTeamPlayers.filter((p) => !p.isBank);
  const gwGkRow    = gwStarters.filter((p) => p.position === 'GK');
  const gwDefRow   = gwStarters.filter((p) => p.position === 'DEF');
  const gwMidRow   = gwStarters.filter((p) => p.position === 'MID');
  const gwFwdRow   = gwStarters.filter((p) => p.position === 'FWD');
  const gwBenchRow = gwTeamPlayers
    .filter((p) => p.isBank)
    .sort((a, b) => {
      const ord: Record<Position, number> = { GK: 0, DEF: 1, MID: 2, FWD: 3 };
      return ord[a.position] - ord[b.position];
    });

  /* ── GW effectieve formatie ── */
  const gwFormKey = `${gwDefRow.length}-${gwMidRow.length}-${gwFwdRow.length}` as FormationKey;
  const effectiveGwFormation: FormationKey = FORMATIONS[gwFormKey] ? gwFormKey : formation;

  /* ── Haal fixture op voor huidig GW ── */
  const getFixture1 = useCallback(
    (teamId: number): FixtureCell | null => {
      if (!currentGW) return null;
      return (fdrMap[teamId] ?? []).find((f) => f.gw === currentGW) ?? null;
    },
    [fdrMap, currentGW],
  );

  /* ── Valideer en voer wissel uit voor huidig GW ── */
  const performGwSwap = useCallback(
    (playerIdA: number, playerIdB: number) => {
      if (!currentGW) return;
      const pA = gwTeamPlayers.find((p) => p.id === playerIdA);
      const pB = gwTeamPlayers.find((p) => p.id === playerIdB);
      if (!pA || !pB) return;

      const simulated = gwTeamPlayers.map((p) => {
        if (p.id === playerIdA) return { ...p, isBank: pB.isBank };
        if (p.id === playerIdB) return { ...p, isBank: pA.isBank };
        return p;
      });

      const simStarters = simulated.filter((p) => !p.isBank);
      const gkCount  = simStarters.filter((p) => p.position === 'GK').length;
      const defCount = simStarters.filter((p) => p.position === 'DEF').length;
      const midCount = simStarters.filter((p) => p.position === 'MID').length;
      const fwdCount = simStarters.filter((p) => p.position === 'FWD').length;
      const newKey   = `${defCount}-${midCount}-${fwdCount}` as FormationKey;

      if (gkCount !== 1 || !FORMATIONS[newKey]) {
        setSwapError('Deze wissel resulteert in een ongeldige opstelling');
        setSelectedPlayerId(null);
        return;
      }

      setGwPlayerBank((prev) => ({
        ...prev,
        [currentGW]: {
          ...(prev[currentGW] ?? {}),
          [playerIdA]: pB.isBank,
          [playerIdB]: pA.isBank,
        },
      }));
      setSelectedPlayerId(null);
    },
    [currentGW, gwTeamPlayers],
  );

  /* ── Reset wissels voor huidig GW ── */
  const resetGwSwaps = useCallback(() => {
    if (!currentGW) return;
    setGwPlayerBank((prev) => {
      const next = { ...prev };
      delete next[currentGW];
      return next;
    });
    setSelectedPlayerId(null);
  }, [currentGW]);

  /* ── Klik op wissel-icoon ── */
  const handleWisselClick = useCallback(
    (e: React.MouseEvent, playerId: number) => {
      e.stopPropagation();
      if (selectedPlayerId === playerId) {
        setSelectedPlayerId(null);
      } else if (selectedPlayerId !== null) {
        performGwSwap(selectedPlayerId, playerId);
      } else {
        setSelectedPlayerId(playerId);
      }
    },
    [selectedPlayerId, performGwSwap],
  );

  /* ─────────────── render ─────────────── */
  const hasGwSwaps = currentGW != null && Object.keys(gwPlayerBank[currentGW] ?? {}).length > 0;
  const rowGap = 'clamp(6px, 2.8vw, 28px)';

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
      {/* ── CSS Keyframes + stijlen ── */}
      <style>{`
        @keyframes gpCaptainRing {
          0%, 100% { box-shadow: 0 0 0 4px rgba(0,250,97,0.18), 0 0 20px rgba(0,250,97,0.28); }
          50%       { box-shadow: 0 0 0 7px rgba(0,250,97,0.36), 0 0 34px rgba(0,250,97,0.52); }
        }
        @media (max-width: 768px) {
          .tb-grid-header,
          .tb-grid-row {
            grid-template-columns: 1fr 52px 34px 50px 36px !important;
            padding-left: 8px !important;
            padding-right: 8px !important;
          }
          .tb-grid-row { padding-top: 6px !important; padding-bottom: 6px !important; }
          .tb-col-wedstrijden, .tb-col-ptn { display: none !important; }
          .tb-grid-header span, .tb-grid-row .tb-cell-name span, .tb-grid-row .tb-cell-club {
            font-size: 9px !important;
          }
        }
        /* Wissel icoon: altijd zichtbaar op mobiel */
        .swap-icon { opacity: 1; }
        /* Op desktop: verborgen tenzij hover op kaart */
        @media (min-width: 769px) {
          .swap-icon { opacity: 0; }
          .pitch-card:hover .swap-icon { opacity: 1; }
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
                          setTooltip({ player: p, x: rect.right, y: rect.top, side: 'right' });
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

            {/* ── RIGHT: Veld met GW navigatie ── */}
            <div className="lg:w-[40%] flex flex-col gap-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>

              {/* ── PITCH BOX ── */}
              <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: '#050312' }}>

                {/* GW navigatie balk */}
                <div style={{
                  background: 'rgba(10,6,45,0.97)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  padding: '10px 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                }}>
                  <button
                    onClick={() => { setPlannerOffset((o) => Math.max(0, o - 1)); setSelectedPlayerId(null); }}
                    disabled={plannerOffset === 0}
                    style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: plannerOffset === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: plannerOffset === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.85)',
                      cursor: plannerOffset === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { if (plannerOffset !== 0) e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
                    onMouseLeave={(e) => { if (plannerOffset !== 0) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                    aria-label="Vorige gameweek"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ color: '#00FA61', fontWeight: 800, fontSize: 14, fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.01em' }}>
                      {currentGW ? `Gameweek ${currentGW}` : '—'}
                    </div>
                    {formattedDeadline && (
                      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 1, fontFamily: 'Montserrat, sans-serif' }}>
                        Deadline: {formattedDeadline}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => { setPlannerOffset((o) => Math.min(plannerMaxOffset, o + 1)); setSelectedPlayerId(null); }}
                    disabled={plannerOffset >= plannerMaxOffset}
                    style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: plannerOffset >= plannerMaxOffset ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: plannerOffset >= plannerMaxOffset ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.85)',
                      cursor: plannerOffset >= plannerMaxOffset ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { if (plannerOffset < plannerMaxOffset) e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
                    onMouseLeave={(e) => { if (plannerOffset < plannerMaxOffset) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                    aria-label="Volgende gameweek"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>

                {/* Stats bar: in the bank + formatie + reset wissels */}
                <div style={{
                  background: 'rgba(0,0,0,0.5)',
                  padding: '8px 16px',
                  display: 'flex', gap: 8, alignItems: 'center',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 2, fontFamily: 'Montserrat, sans-serif' }}>
                      In the bank
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 15, fontFamily: 'Montserrat, sans-serif', lineHeight: 1, color: teamValues.remaining >= 0 ? '#00FA61' : '#FF4444' }}>
                      £{teamValues.remaining.toFixed(1)}m
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '0 10px' }}>
                    <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 2, fontFamily: 'Montserrat, sans-serif' }}>
                      Formatie
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 15, fontFamily: 'Montserrat, sans-serif', lineHeight: 1, color: hasGwSwaps ? '#00FA61' : '#fff' }}>
                      {effectiveGwFormation}
                    </div>
                  </div>
                  {hasGwSwaps && (
                    <button
                      onClick={resetGwSwaps}
                      style={{
                        padding: '5px 10px', borderRadius: 7, fontSize: 10, fontWeight: 600,
                        background: 'rgba(255,100,100,0.12)', color: '#F87171',
                        border: '1px solid rgba(255,100,100,0.2)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontFamily: 'Montserrat, sans-serif', flexShrink: 0,
                      }}
                    >
                      <RotateCcw size={9} /> Reset
                    </button>
                  )}
                </div>

                {/* Wissel status bar */}
                {(selectedPlayerId !== null || swapError) && (
                  <div style={{
                    background: 'rgba(0,0,0,0.35)',
                    padding: '7px 16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <span style={{ color: swapError ? '#F87171' : '#00FA61', fontSize: 11, fontFamily: 'Montserrat, sans-serif' }}>
                      {swapError ?? 'Selecteer een andere speler om te wisselen…'}
                    </span>
                    {selectedPlayerId !== null && (
                      <button
                        onClick={() => setSelectedPlayerId(null)}
                        style={{
                          padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                          background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)',
                          border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer',
                          fontFamily: 'Montserrat, sans-serif', flexShrink: 0,
                        }}
                      >
                        Annuleer
                      </button>
                    )}
                  </div>
                )}

                {/* ── VELD ── */}
                {gwTeamPlayers.length === 0 ? (
                  /* Leeg veld met achtergrond en bericht */
                  <div style={{ position: 'relative', minHeight: 340 }}>
                    {/* Pitch achtergrond */}
                    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
                      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(180deg, #1b5f2e 0px, #1b5f2e 42px, #1f6c34 42px, #1f6c34 84px)' }} />
                      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 400 340" preserveAspectRatio="none" aria-hidden="true">
                        <rect x="16" y="16" width="368" height="308" rx="3" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
                        <line x1="16" y1="170" x2="384" y2="170" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
                        <circle cx="200" cy="170" r="48" fill="none" stroke="rgba(255,255,255,0.11)" strokeWidth="1.5" />
                        <circle cx="200" cy="170" r="3" fill="rgba(255,255,255,0.2)" />
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 90px rgba(3,1,18,0.82)' }} />
                    </div>
                    {/* Bericht */}
                    <div style={{
                      position: 'relative', zIndex: 1,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      height: 340, textAlign: 'center', padding: '20px 24px',
                    }}>
                      <Users size={32} style={{ color: 'rgba(255,255,255,0.12)', marginBottom: 12 }} />
                      <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 13, fontFamily: 'Montserrat, sans-serif', margin: 0, lineHeight: 1.6 }}>
                        Voeg spelers toe uit de lijst<br />om je team op het veld te zien
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Gevuld veld */}
                    <div style={{ position: 'relative' }}>
                      {/* Pitch achtergrond (identiek aan Team van de Week) */}
                      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
                        {/* Maaibanen */}
                        <div style={{
                          position: 'absolute', inset: 0,
                          background: 'repeating-linear-gradient(180deg, #1b5f2e 0px, #1b5f2e 42px, #1f6c34 42px, #1f6c34 84px)',
                        }} />

                        {/* Veldlijnen SVG */}
                        <svg
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                          viewBox="0 0 400 540"
                          preserveAspectRatio="none"
                          aria-hidden="true"
                        >
                          {/* Buitengrens */}
                          <rect x="16" y="16" width="368" height="508" rx="3" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                          {/* Middenlijn */}
                          <line x1="16" y1="270" x2="384" y2="270" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                          {/* Middencirkel */}
                          <circle cx="200" cy="270" r="54" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" />
                          {/* Middenstip */}
                          <circle cx="200" cy="270" r="3" fill="rgba(255,255,255,0.24)" />
                          {/* Strafschopgebied boven */}
                          <rect x="106" y="16" width="188" height="98" fill="none" stroke="rgba(255,255,255,0.11)" strokeWidth="1.5" />
                          {/* Doelgebied boven */}
                          <rect x="150" y="16" width="100" height="36" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
                          {/* Strafschopstip boven */}
                          <circle cx="200" cy="80" r="3" fill="rgba(255,255,255,0.19)" />
                          {/* Strafschopgebied onder */}
                          <rect x="106" y="426" width="188" height="98" fill="none" stroke="rgba(255,255,255,0.11)" strokeWidth="1.5" />
                          {/* Doelgebied onder */}
                          <rect x="150" y="488" width="100" height="36" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
                          {/* Strafschopstip onder */}
                          <circle cx="200" cy="460" r="3" fill="rgba(255,255,255,0.19)" />
                          {/* Hoekbogen */}
                          <path d="M16,16 Q26,16 26,26"   fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1.5" />
                          <path d="M384,16 Q374,16 374,26" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1.5" />
                          <path d="M16,524 Q16,514 26,514" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1.5" />
                          <path d="M384,524 Q384,514 374,514" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1.5" />
                        </svg>

                        {/* Vignette */}
                        <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 90px rgba(3,1,18,0.70)' }} />
                        {/* Rand highlight */}
                        <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.07)' }} />
                      </div>

                      {/* Spelers (positie: relative + z-index 10 → tooltips kunnen overlopen) */}
                      <div style={{
                        position: 'relative',
                        zIndex: 10,
                        padding: '28px 12px 24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'clamp(14px, 2.4vw, 28px)',
                      }}>
                        {/* FWD rij — bovenaan */}
                        {gwFwdRow.length > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'center', gap: rowGap, overflow: 'visible' }}>
                            {gwFwdRow.map((p) => (
                              <PitchCard
                                key={p.id}
                                player={p}
                                isSelected={selectedPlayerId === p.id}
                                fixture={getFixture1(p.teamId)}
                                onSwapClick={(e) => handleWisselClick(e, p.id)}
                                onCardClick={() => setPlayerPopup(p)}
                                onHoverEnter={(e) => {
                                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                  setTooltip({ player: p, x: rect.left, y: rect.top, side: 'left' });
                                }}
                                onHoverLeave={() => setTooltip(null)}
                              />
                            ))}
                          </div>
                        )}

                        {/* MID rij */}
                        {gwMidRow.length > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(4px, 2vw, 20px)', overflow: 'visible' }}>
                            {gwMidRow.map((p) => (
                              <PitchCard
                                key={p.id}
                                player={p}
                                isSelected={selectedPlayerId === p.id}
                                fixture={getFixture1(p.teamId)}
                                onSwapClick={(e) => handleWisselClick(e, p.id)}
                                onCardClick={() => setPlayerPopup(p)}
                                onHoverEnter={(e) => {
                                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                  setTooltip({ player: p, x: rect.left, y: rect.top, side: 'left' });
                                }}
                                onHoverLeave={() => setTooltip(null)}
                              />
                            ))}
                          </div>
                        )}

                        {/* DEF rij */}
                        {gwDefRow.length > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(3px, 1.8vw, 16px)', overflow: 'visible' }}>
                            {gwDefRow.map((p) => (
                              <PitchCard
                                key={p.id}
                                player={p}
                                isSelected={selectedPlayerId === p.id}
                                fixture={getFixture1(p.teamId)}
                                onSwapClick={(e) => handleWisselClick(e, p.id)}
                                onCardClick={() => setPlayerPopup(p)}
                                onHoverEnter={(e) => {
                                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                  setTooltip({ player: p, x: rect.left, y: rect.top, side: 'left' });
                                }}
                                onHoverLeave={() => setTooltip(null)}
                              />
                            ))}
                          </div>
                        )}

                        {/* GK rij — onderaan */}
                        {gwGkRow.length > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'center', overflow: 'visible' }}>
                            {gwGkRow.map((p) => (
                              <PitchCard
                                key={p.id}
                                player={p}
                                isSelected={selectedPlayerId === p.id}
                                fixture={getFixture1(p.teamId)}
                                onSwapClick={(e) => handleWisselClick(e, p.id)}
                                onCardClick={() => setPlayerPopup(p)}
                                onHoverEnter={(e) => {
                                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                  setTooltip({ player: p, x: rect.left, y: rect.top, side: 'left' });
                                }}
                                onHoverLeave={() => setTooltip(null)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bank sectie */}
                    <div style={{
                      background: 'rgba(5,3,16,0.92)',
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                      padding: '12px 12px 16px',
                    }}>
                      <div style={{
                        fontSize: 8, fontWeight: 700,
                        color: 'rgba(255,255,255,0.22)',
                        textTransform: 'uppercase', letterSpacing: '0.18em',
                        textAlign: 'center', marginBottom: 12,
                        fontFamily: 'Montserrat, sans-serif',
                      }}>
                        Bank
                      </div>
                      {gwBenchRow.length > 0 ? (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: rowGap, overflow: 'visible' }}>
                          {gwBenchRow.map((p) => (
                            <PitchCard
                              key={p.id}
                              player={p}
                              isSelected={selectedPlayerId === p.id}
                              fixture={getFixture1(p.teamId)}
                              onSwapClick={(e) => handleWisselClick(e, p.id)}
                              onCardClick={() => setPlayerPopup(p)}
                              onHoverEnter={(e) => {
                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                setTooltip({ player: p, x: rect.left, y: rect.top, side: 'left' });
                              }}
                              onHoverLeave={() => setTooltip(null)}
                            />
                          ))}
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.18)', fontSize: 11, fontFamily: 'Montserrat, sans-serif' }}>
                          Geen bankspelers
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Budget stats */}
              <div
                className="rounded-2xl p-4 border border-white/8 flex flex-col gap-3"
                style={{ background: 'rgba(0,0,0,0.3)' }}
              >
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


        </div>
      </div>

      {/* ── Speler info popup (klik op veldkaart) ── */}
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
                  ? [{ label: '🧤 Clean Sheets', value: playerPopup.cleanSheets ?? 0 }]
                  : []),
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
            ...(tooltip.side === 'left'
              ? { right: `calc(100vw - ${tooltip.x}px + 12px)` }
              : { left: tooltip.x + 12 }),
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
              {(tooltip.player.position === 'GK' || tooltip.player.position === 'DEF') && (
                <>
                  <span className="text-white/40 text-[10px]">Clean Sheets</span>
                  <span className="text-white font-medium text-[10px]">{tooltip.player.cleanSheets ?? 0}</span>
                </>
              )}
              <span className="text-white/40 text-[10px]">Eigendom</span>
              <span className="text-white font-medium text-[10px]">{tooltip.player.ownership}%</span>
              <span className="text-white/40 text-[10px]">Minuten</span>
              <span className="text-white font-medium text-[10px]">{tooltip.player.minutes}</span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

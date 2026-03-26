'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Search, X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { batchedAll } from '@/lib/utils/batch';

/* ─────────────────────── types ─────────────────────────── */

interface StatsPlayer {
  id: number;
  code: number;
  name: string;
  fullName: string;
  team: string;
  teamFull: string;
  teamId: number;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  imageUrl: string | null;
  total_points: number;
  event_points: number;
  points_per_game: number;
  form: number;
  price: number;
  ownership: number;
  minutes: number;
  goals_scored: number;
  assists: number;
  expected_goals: number;
  expected_assists: number;
  expected_goal_involvements: number;
  expected_goals_conceded: number;
  clean_sheets: number;
  saves: number;
  goals_conceded: number;
  yellow_cards: number;
  red_cards: number;
  bonus: number;
  bps: number;
}

interface StatsTeam {
  id: number;
  name: string;
  fullName: string;
  xG: number;
  xGC: number;
  goals_scored: number;
  goals_conceded: number;
  clean_sheets: number;
  minutes: number;
}

interface HistoryEntry {
  round: number;
  total_points: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  saves: number;
  expected_goals: number;
  expected_assists: number;
  minutes: number;
}

type TabId =
  | 'goals'
  | 'expected_goals'
  | 'assists'
  | 'expected_assists'
  | 'clean_sheets'
  | 'saves'
  | 'total_points'
  | 'points_per_game'
  | 'teams';

type Position = 'ALL' | 'GK' | 'DEF' | 'MID' | 'FWD';
type MinMinutes = 0 | 90 | 270 | 450 | 900;

/* ─────────────────────── helpers ────────────────────────── */

function per90(stat: number, minutes: number): number | null {
  if (!minutes || minutes === 0) return null;
  return (stat / minutes) * 90;
}

function fmt(val: number | null, decimals = 2): string {
  if (val === null) return '–';
  return val.toFixed(decimals);
}

function fmtStat(val: number, decimals = 0): string {
  return val.toFixed(decimals);
}

/* ─────────────────────── tab config ─────────────────────── */

interface TabConfig {
  id: TabId;
  label: string;
  sortKey: string;
  posFilter?: Position[];
  heroStat: (p: StatsPlayer) => number;
  heroLabel: string;
  heroDecimals?: number;
  heroSec: (p: StatsPlayer) => [string, string];
}

const PLAYER_TABS: TabConfig[] = [
  {
    id: 'goals',
    label: 'Goals',
    sortKey: 'goals_scored',
    heroStat: (p) => p.goals_scored,
    heroLabel: 'Goals',
    heroDecimals: 0,
    heroSec: (p) => [
      `${fmt(per90(p.goals_scored, p.minutes))} p90`,
      `${fmtStat(p.expected_goals, 2)} xG`,
    ],
  },
  {
    id: 'expected_goals',
    label: 'Expected Goals',
    sortKey: 'expected_goals',
    heroStat: (p) => p.expected_goals,
    heroLabel: 'xG',
    heroDecimals: 2,
    heroSec: (p) => [
      `${fmt(per90(p.expected_goals, p.minutes))} p90`,
      `${p.goals_scored} Goals`,
    ],
  },
  {
    id: 'assists',
    label: 'Assists',
    sortKey: 'assists',
    heroStat: (p) => p.assists,
    heroLabel: 'Assists',
    heroDecimals: 0,
    heroSec: (p) => [
      `${fmt(per90(p.assists, p.minutes))} p90`,
      `${fmtStat(p.expected_assists, 2)} xA`,
    ],
  },
  {
    id: 'expected_assists',
    label: 'Expected Assists',
    sortKey: 'expected_assists',
    heroStat: (p) => p.expected_assists,
    heroLabel: 'xA',
    heroDecimals: 2,
    heroSec: (p) => [
      `${fmt(per90(p.expected_assists, p.minutes))} p90`,
      `${p.assists} Assists`,
    ],
  },
  {
    id: 'clean_sheets',
    label: 'Clean Sheets',
    sortKey: 'clean_sheets',
    posFilter: ['GK', 'DEF'],
    heroStat: (p) => p.clean_sheets,
    heroLabel: 'CS',
    heroDecimals: 0,
    heroSec: (p) => [`${p.minutes} min`, `${p.position}`],
  },
  {
    id: 'saves',
    label: 'Saves',
    sortKey: 'saves',
    posFilter: ['GK'],
    heroStat: (p) => p.saves,
    heroLabel: 'Saves',
    heroDecimals: 0,
    heroSec: (p) => [
      `${fmt(per90(p.saves, p.minutes))} p90`,
      `${p.minutes} min`,
    ],
  },
  {
    id: 'total_points',
    label: 'Total Points',
    sortKey: 'total_points',
    heroStat: (p) => p.total_points,
    heroLabel: 'pts',
    heroDecimals: 0,
    heroSec: (p) => [`${fmtStat(p.points_per_game, 2)} p/g`, `${fmtStat(p.form, 1)} form`],
  },
  {
    id: 'points_per_game',
    label: 'Points per Game',
    sortKey: 'points_per_game',
    heroStat: (p) => p.points_per_game,
    heroLabel: 'p/g',
    heroDecimals: 2,
    heroSec: (p) => [`${p.total_points} pts`, `${p.minutes} min`],
  },
];

interface ColDef {
  key: string;
  label: string;
  decimals?: number;
  getValue: (p: StatsPlayer) => number | null;
  isSortable?: boolean;
}

function getColumns(tab: TabId): ColDef[] {
  switch (tab) {
    case 'goals':
      return [
        { key: 'goals_scored', label: 'Goals', decimals: 0, getValue: (p) => p.goals_scored },
        { key: 'goals_per90', label: 'Goals p90', decimals: 2, getValue: (p) => per90(p.goals_scored, p.minutes) },
        { key: 'expected_goals', label: 'xG', decimals: 2, getValue: (p) => p.expected_goals },
        { key: 'xg_per90', label: 'xG p90', decimals: 2, getValue: (p) => per90(p.expected_goals, p.minutes) },
        { key: 'minutes', label: 'Minutes', decimals: 0, getValue: (p) => p.minutes },
      ];
    case 'expected_goals':
      return [
        { key: 'expected_goals', label: 'xG', decimals: 2, getValue: (p) => p.expected_goals },
        { key: 'xg_per90', label: 'xG p90', decimals: 2, getValue: (p) => per90(p.expected_goals, p.minutes) },
        { key: 'goals_scored', label: 'Goals', decimals: 0, getValue: (p) => p.goals_scored },
        { key: 'minutes', label: 'Minutes', decimals: 0, getValue: (p) => p.minutes },
      ];
    case 'assists':
      return [
        { key: 'assists', label: 'Assists', decimals: 0, getValue: (p) => p.assists },
        { key: 'assists_per90', label: 'Assists p90', decimals: 2, getValue: (p) => per90(p.assists, p.minutes) },
        { key: 'expected_assists', label: 'xA', decimals: 2, getValue: (p) => p.expected_assists },
        { key: 'xa_per90', label: 'xA p90', decimals: 2, getValue: (p) => per90(p.expected_assists, p.minutes) },
        { key: 'minutes', label: 'Minutes', decimals: 0, getValue: (p) => p.minutes },
      ];
    case 'expected_assists':
      return [
        { key: 'expected_assists', label: 'xA', decimals: 2, getValue: (p) => p.expected_assists },
        { key: 'xa_per90', label: 'xA p90', decimals: 2, getValue: (p) => per90(p.expected_assists, p.minutes) },
        { key: 'assists', label: 'Assists', decimals: 0, getValue: (p) => p.assists },
        { key: 'minutes', label: 'Minutes', decimals: 0, getValue: (p) => p.minutes },
      ];
    case 'clean_sheets':
      return [
        { key: 'clean_sheets', label: 'Clean Sheets', decimals: 0, getValue: (p) => p.clean_sheets },
        { key: 'minutes', label: 'Minutes', decimals: 0, getValue: (p) => p.minutes },
      ];
    case 'saves':
      return [
        { key: 'saves', label: 'Saves', decimals: 0, getValue: (p) => p.saves },
        { key: 'saves_per90', label: 'Saves p90', decimals: 2, getValue: (p) => per90(p.saves, p.minutes) },
        { key: 'minutes', label: 'Minutes', decimals: 0, getValue: (p) => p.minutes },
      ];
    case 'total_points':
      return [
        { key: 'total_points', label: 'Total Points', decimals: 0, getValue: (p) => p.total_points },
        { key: 'points_per_game', label: 'Points/Game', decimals: 2, getValue: (p) => p.points_per_game },
        { key: 'form', label: 'Form', decimals: 1, getValue: (p) => p.form },
        { key: 'price', label: 'Price', decimals: 1, getValue: (p) => p.price },
        { key: 'ownership', label: 'Ownership%', decimals: 1, getValue: (p) => p.ownership },
      ];
    case 'points_per_game':
      return [
        { key: 'points_per_game', label: 'Points/Game', decimals: 2, getValue: (p) => p.points_per_game },
        { key: 'total_points', label: 'Total Points', decimals: 0, getValue: (p) => p.total_points },
        { key: 'form', label: 'Form', decimals: 1, getValue: (p) => p.form },
        { key: 'minutes', label: 'Minutes', decimals: 0, getValue: (p) => p.minutes },
      ];
    default:
      return [];
  }
}

/* ─────────────────────── rank styles ───────────────────── */
const RANK_STYLES = {
  1: { border: '#FFD700', glow: 'rgba(255,215,0,0.4)', bg: 'rgba(255,215,0,0.08)', label: '#FFD700' },
  2: { border: '#C0C0C0', glow: 'rgba(192,192,192,0.3)', bg: 'rgba(192,192,192,0.06)', label: '#C0C0C0' },
  3: { border: '#CD7F32', glow: 'rgba(205,127,50,0.3)', bg: 'rgba(205,127,50,0.06)', label: '#CD7F32' },
} as const;

const POS_COLOR: Record<string, { bg: string; color: string }> = {
  GK:  { bg: 'rgba(255,215,0,0.15)',    color: '#FFD700' },
  DEF: { bg: 'rgba(0,250,97,0.12)',     color: '#00FA61' },
  MID: { bg: 'rgba(99,102,241,0.15)',   color: '#818CF8' },
  FWD: { bg: 'rgba(239,68,68,0.15)',    color: '#F87171' },
};

const PAGE_SIZE = 25;

/* ─────────────────────── main component ─────────────────── */

export default function StatistiekenPage() {
  const [players, setPlayers]       = useState<StatsPlayer[]>([]);
  const [teams,   setTeams]         = useState<StatsTeam[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error,   setError]         = useState<string | null>(null);

  // Navigation
  const [activeTab, setActiveTab]   = useState<TabId>('goals');

  // Filters
  const [search,    setSearch]    = useState('');
  const [posFilter, setPosFilter] = useState<Position>('ALL');
  const [clubFilter, setClubFilter] = useState<string>('ALL');
  const [minMinutes, setMinMinutes] = useState<MinMinutes>(0);

  // Sort
  const [sortKey, setSortKey]     = useState<string>('goals_scored');
  const [sortDir, setSortDir]     = useState<'desc' | 'asc'>('desc');

  // Pagination
  const [page, setPage]           = useState(0);

  // Modal
  const [modalPlayer, setModalPlayer] = useState<StatsPlayer | null>(null);

  // Laatste 5 GW history cache (lazy-loaded per zichtbare speler)
  const [historyData, setHistoryData] = useState<Record<number, HistoryEntry[]>>({});
  const fetchingRef = useRef(new Set<number>());

  /* ── fetch data ── */
  useEffect(() => {
    setLoading(true);
    fetch('/api/fpl/stats')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        setPlayers(d.players ?? []);
        setTeams(d.teams ?? []);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  }, []);

  /* ── tab change → reset sort/page/filters ── */
  const tabConfig = PLAYER_TABS.find((t) => t.id === activeTab);

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
    setPage(0);
    setSearch('');
    setPosFilter('ALL');
    setClubFilter('ALL');
    // Default sort
    if (tab === 'teams') {
      setSortKey('xG');
    } else {
      const cfg = PLAYER_TABS.find((t) => t.id === tab);
      setSortKey(cfg?.sortKey ?? 'total_points');
    }
    setSortDir('desc');
  }, []);

  /* ── unique clubs ── */
  const allClubs = useMemo(() => {
    const names = Array.from(new Set(players.map((p) => p.team))).sort();
    return names;
  }, [players]);

  /* ── filtered + sorted players ── */
  const filteredPlayers = useMemo(() => {
    const cfg = PLAYER_TABS.find((t) => t.id === activeTab);
    let list = players;

    // Position restriction per tab
    if (cfg?.posFilter) {
      list = list.filter((p) => cfg.posFilter!.includes(p.position));
    }

    // User filters
    if (posFilter !== 'ALL') list = list.filter((p) => p.position === posFilter);
    if (clubFilter !== 'ALL') list = list.filter((p) => p.team === clubFilter);
    if (minMinutes > 0) list = list.filter((p) => p.minutes >= minMinutes);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.fullName.toLowerCase().includes(q) || p.team.toLowerCase().includes(q),
      );
    }

    // Sort
    const cols = getColumns(activeTab);
    const colDef = cols.find((c) => c.key === sortKey);
    list = [...list].sort((a, b) => {
      let va: number, vb: number;
      if (colDef) {
        va = colDef.getValue(a) ?? -Infinity;
        vb = colDef.getValue(b) ?? -Infinity;
      } else {
        // direct field
        va = (a as unknown as Record<string, number>)[sortKey] ?? 0;
        vb = (b as unknown as Record<string, number>)[sortKey] ?? 0;
      }
      return sortDir === 'desc' ? vb - va : va - vb;
    });

    return list;
  }, [players, activeTab, posFilter, clubFilter, minMinutes, search, sortKey, sortDir]);

  /* ── filtered + sorted teams ── */
  const filteredTeams = useMemo(() => {
    let list = teams;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q) || t.fullName.toLowerCase().includes(q));
    }
    list = [...list].sort((a, b) => {
      const va = (a as unknown as Record<string, number>)[sortKey] ?? 0;
      const vb = (b as unknown as Record<string, number>)[sortKey] ?? 0;
      return sortDir === 'desc' ? vb - va : va - vb;
    });
    return list;
  }, [teams, search, sortKey, sortDir]);

  const isTeamsTab   = activeTab === 'teams';
  const isPointsTab  = activeTab === 'total_points' || activeTab === 'points_per_game';
  const listLen    = isTeamsTab ? filteredTeams.length : filteredPlayers.length;
  const totalPages = Math.max(1, Math.ceil(listLen / PAGE_SIZE));

  useEffect(() => { setPage(0); }, [search, posFilter, clubFilter, minMinutes, sortKey, sortDir]);

  /* ── hero players (top 3, unsearched) ── */
  const heroPlayers = useMemo(() => {
    if (!tabConfig || isTeamsTab || search.trim()) return [];
    const cfg = tabConfig;
    let base = players;
    if (cfg.posFilter) base = base.filter((p) => cfg.posFilter!.includes(p.position));
    if (posFilter !== 'ALL') base = base.filter((p) => p.position === posFilter);
    if (clubFilter !== 'ALL') base = base.filter((p) => p.team === clubFilter);
    if (minMinutes > 0) base = base.filter((p) => p.minutes >= minMinutes);
    return [...base].sort((a, b) => cfg.heroStat(b) - cfg.heroStat(a)).slice(0, 3);
  }, [players, tabConfig, isTeamsTab, search, posFilter, clubFilter, minMinutes]);

  /* ── sort handler ── */
  function handleSort(key: string) {
    if (sortKey === key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortKey(key); setSortDir('desc'); }
  }

  function SortIndicator({ colKey }: { colKey: string }) {
    if (sortKey !== colKey) return <span style={{ opacity: 0.25, fontSize: 10 }}>⇅</span>;
    return sortDir === 'desc'
      ? <ChevronDown size={12} style={{ color: '#00FA61' }} />
      : <ChevronUp size={12} style={{ color: '#00FA61' }} />;
  }

  /* ── Laatste 5 GW helpers ── */
  function getHistoryStat(entry: HistoryEntry, tab: TabId): number {
    switch (tab) {
      case 'goals':           return entry.goals_scored;
      case 'expected_goals':  return entry.expected_goals;
      case 'assists':         return entry.assists;
      case 'expected_assists': return entry.expected_assists;
      case 'clean_sheets':    return entry.clean_sheets;
      case 'saves':           return entry.saves;
      case 'total_points':    return entry.total_points;
      case 'points_per_game': return entry.total_points;
      default:                return entry.total_points;
    }
  }

  function getHistoryDecimals(tab: TabId): number {
    return (tab === 'expected_goals' || tab === 'expected_assists') ? 1 : 0;
  }

  function ptsBadgeStyle(pts: number): { bg: string; color: string } {
    if (pts >= 10) return { bg: 'rgba(255,215,0,0.22)',  color: '#FFD700' };
    if (pts >= 7)  return { bg: 'rgba(0,250,97,0.18)',   color: '#00FA61' };
    if (pts >= 4)  return { bg: 'rgba(255,165,0,0.18)',  color: '#FFA500' };
    return              { bg: 'rgba(239,68,68,0.14)',  color: '#F87171' };
  }

  /* ── page data ── */
  const pageData = isTeamsTab
    ? filteredTeams.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
    : filteredPlayers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const cols = isTeamsTab ? [] : getColumns(activeTab);

  /* ── Lazy-load history voor zichtbare spelers ── */
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (isTeamsTab) return;
    const visiblePlayers = pageData as StatsPlayer[];
    const toFetch = visiblePlayers.filter(
      (p) => !(p.id in historyData) && !fetchingRef.current.has(p.id),
    );
    if (toFetch.length === 0) return;
    toFetch.forEach((p) => fetchingRef.current.add(p.id));
    // Max 5 gelijktijdige calls, 100ms pauze tussen batches
    batchedAll(
      toFetch,
      async (p) => {
        try {
          const res = await fetch(`/api/fpl/element-summary/${p.id}`);
          const d = await res.json();
          return { id: p.id, history: (d.history ?? []) as HistoryEntry[] };
        } catch {
          return { id: p.id, history: [] as HistoryEntry[] };
        }
      },
      5,
      100,
    ).then((results) => {
      const updates: Record<number, HistoryEntry[]> = {};
      results.forEach(({ id, history }) => {
        updates[id] = history;
        fetchingRef.current.delete(id);
      });
      setHistoryData((prev) => ({ ...prev, ...updates }));
    });
  }, [pageData, isTeamsTab]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── hero podium order: [#2, #1, #3] ── */
  const podium = heroPlayers.length >= 2
    ? [heroPlayers[1], heroPlayers[0], heroPlayers[2]].filter(Boolean)
    : heroPlayers;

  /* ─────────────── render ─────────────── */
  return (
    <main
      className="min-h-screen relative"
      style={{ background: '#0a0628', fontFamily: 'Montserrat, sans-serif' }}
    >
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .stat-hero { animation: fadeInUp 0.4s ease both; }
        .stat-hero:nth-child(1) { animation-delay: 0.05s; }
        .stat-hero:nth-child(2) { animation-delay: 0.0s;  }
        .stat-hero:nth-child(3) { animation-delay: 0.1s;  }
        .stat-row:hover { background: rgba(0,250,97,0.06) !important; }
        .tab-btn:hover { background: rgba(255,255,255,0.07) !important; }
        .hero-card:hover { transform: translateY(-6px) !important; }
        .sort-th:hover { color: rgba(0,250,97,0.9) !important; cursor: pointer; }
      `}</style>

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">

        {/* ── Header ── */}
        <div className="mb-8">
          <span style={{ color: '#00FA61', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', display: 'block', marginBottom: 6 }}>
            Premier League
          </span>
          <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: '#fff', lineHeight: 1.1, margin: 0 }}>
            Statistieken
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 8, margin: '8px 0 0' }}>
            Belangrijke FPL data inzichten
          </p>
        </div>

        {/* ── Tab navigation ── */}
        <div style={{ overflowX: 'auto', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 4, minWidth: 'max-content', padding: '0 2px 8px' }}>
            {PLAYER_TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  className="tab-btn"
                  onClick={() => handleTabChange(tab.id)}
                  style={{
                    padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: active ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    background: active ? '#00FA61' : 'rgba(255,255,255,0.04)',
                    color: active ? '#111' : 'rgba(255,255,255,0.6)',
                    cursor: 'pointer', transition: 'all 0.15s',
                    fontFamily: 'Montserrat, sans-serif', whiteSpace: 'nowrap' as const,
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
            <button
              className="tab-btn"
              onClick={() => handleTabChange('teams')}
              style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: activeTab === 'teams' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                background: activeTab === 'teams' ? '#00FA61' : 'rgba(255,255,255,0.04)',
                color: activeTab === 'teams' ? '#111' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer', transition: 'all 0.15s',
                fontFamily: 'Montserrat, sans-serif',
              }}
            >
              Teams
            </button>
          </div>
        </div>

        {/* ── Loading / Error ── */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>
            <div style={{ marginBottom: 12, fontSize: 28 }}>⚽</div>
            Statistieken laden…
          </div>
        )}
        {error && !loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#F87171', fontSize: 14 }}>
            Kon statistieken niet ophalen. Probeer de pagina te herladen.
          </div>
        )}

        {!loading && !error && (
          <>
            {/* ── Filters + search ── */}
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 10, marginBottom: 24, alignItems: 'center' }}>
              {/* Search */}
              <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
                <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder={isTeamsTab ? 'Zoek club…' : 'Search player...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%', paddingLeft: 34, paddingRight: search ? 34 : 12, paddingTop: 9, paddingBottom: 9,
                    background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, color: '#fff', fontSize: 13, fontFamily: 'Montserrat, sans-serif',
                    outline: 'none',
                  }}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center' }}>
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Position filter (not for teams tab) */}
              {!isTeamsTab && (
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['ALL', 'GK', 'DEF', 'MID', 'FWD'] as Position[]).map((pos) => {
                    const active = posFilter === pos;
                    const disabled = !!tabConfig?.posFilter && pos !== 'ALL' && !tabConfig.posFilter.includes(pos as 'GK' | 'DEF' | 'MID' | 'FWD');
                    return (
                      <button
                        key={pos}
                        onClick={() => !disabled && setPosFilter(pos)}
                        disabled={disabled}
                        style={{
                          padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                          background: active ? '#00FA61' : 'rgba(255,255,255,0.07)',
                          color: active ? '#111' : disabled ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.55)',
                          border: 'none', cursor: disabled ? 'default' : 'pointer',
                          fontFamily: 'Montserrat, sans-serif',
                        }}
                      >
                        {pos}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Club dropdown (not for teams tab) */}
              {!isTeamsTab && (
                <select
                  value={clubFilter}
                  onChange={(e) => setClubFilter(e.target.value)}
                  style={{
                    padding: '7px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: clubFilter !== 'ALL' ? 'rgba(0,250,97,0.1)' : 'rgba(255,255,255,0.07)',
                    color: clubFilter !== 'ALL' ? '#00FA61' : 'rgba(255,255,255,0.55)',
                    border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
                    fontFamily: 'Montserrat, sans-serif', outline: 'none',
                  }}
                >
                  <option value="ALL" style={{ background: '#0d0d1a' }}>Alle clubs</option>
                  {allClubs.map((c) => (
                    <option key={c} value={c} style={{ background: '#0d0d1a', color: '#fff' }}>{c}</option>
                  ))}
                </select>
              )}

              {/* Min minutes (not for teams tab) */}
              {!isTeamsTab && (
                <select
                  value={minMinutes}
                  onChange={(e) => setMinMinutes(parseInt(e.target.value) as MinMinutes)}
                  style={{
                    padding: '7px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: minMinutes > 0 ? 'rgba(0,250,97,0.1)' : 'rgba(255,255,255,0.07)',
                    color: minMinutes > 0 ? '#00FA61' : 'rgba(255,255,255,0.55)',
                    border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
                    fontFamily: 'Montserrat, sans-serif', outline: 'none',
                  }}
                >
                  {([
                    [0,   'Alle minuten'],
                    [90,  '90+ min'],
                    [270, '270+ min'],
                    [450, '450+ min'],
                    [900, '900+ min'],
                  ] as [MinMinutes, string][]).map(([val, label]) => (
                    <option key={val} value={val} style={{ background: '#0d0d1a', color: '#fff' }}>{label}</option>
                  ))}
                </select>
              )}

              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginLeft: 'auto' }}>
                {listLen} {isTeamsTab ? 'clubs' : 'spelers'}
              </span>
            </div>

            {/* ── Hero podium (only when no search) ── */}
            {!isTeamsTab && !search.trim() && heroPlayers.length > 0 && tabConfig && (
              <div style={{ marginBottom: 32 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-end',
                    gap: 16,
                    flexWrap: 'wrap' as const,
                  }}
                >
                  {podium.map((player) => {
                    // Real rank in sorted list
                    const realRank = heroPlayers.indexOf(player) + 1;
                    const rs = RANK_STYLES[realRank as 1 | 2 | 3] ?? RANK_STYLES[3];
                    const isFirst = realRank === 1;
                    const cardH = isFirst ? 220 : 190;

                    return (
                      <div
                        key={player.id}
                        className="stat-hero hero-card"
                        onClick={() => setModalPlayer(player)}
                        style={{
                          width: isFirst ? 180 : 150,
                          height: cardH,
                          borderRadius: 16,
                          border: `${isFirst ? 2 : 1.5}px solid ${rs.border}`,
                          background: rs.bg,
                          boxShadow: `0 0 ${isFirst ? 28 : 18}px ${rs.glow}`,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          padding: '0 10px 14px',
                          cursor: 'pointer',
                          position: 'relative',
                          overflow: 'hidden',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        }}
                      >
                        {/* Rank badge */}
                        <div style={{
                          position: 'absolute', top: 8, left: 8,
                          width: 22, height: 22, borderRadius: '50%',
                          background: rs.border, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 800, color: '#111', zIndex: 2,
                        }}>
                          {realRank}
                        </div>

                        {/* Star for #1 */}
                        {isFirst && (
                          <Star size={12} style={{ position: 'absolute', top: 9, right: 8, color: '#FFD700', fill: '#FFD700', zIndex: 2 }} />
                        )}

                        {/* Player photo */}
                        {player.imageUrl ? (
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '65%', overflow: 'hidden' }}>
                            <Image
                              src={player.imageUrl}
                              alt={player.name}
                              fill
                              className="object-cover"
                              style={{ objectPosition: '50% 10%' }}
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '65%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,250,97,0.05)' }}>
                            <span style={{ color: rs.border, fontSize: 28, fontWeight: 800 }}>{player.name.charAt(0)}</span>
                          </div>
                        )}

                        {/* Content below photo */}
                        <div style={{ position: 'relative', zIndex: 3, width: '100%', textAlign: 'center' }}>
                          {/* Main stat */}
                          <div style={{ color: '#FFFFFF', fontWeight: 800, fontSize: isFirst ? 22 : 18, lineHeight: 1, marginBottom: 2, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                            {tabConfig.heroDecimals === 0
                              ? Math.round(tabConfig.heroStat(player))
                              : tabConfig.heroStat(player).toFixed(tabConfig.heroDecimals ?? 2)}
                            <span style={{ fontSize: isFirst ? 11 : 9, marginLeft: 3, fontWeight: 600 }}>{tabConfig.heroLabel}</span>
                          </div>

                          {/* Name */}
                          <div style={{ color: '#fff', fontWeight: 700, fontSize: isFirst ? 12 : 10, marginBottom: 3, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' as const }}>
                            {player.name}
                          </div>

                          {/* Club + position */}
                          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 4 }}>
                            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{player.team}</span>
                            <span style={{
                              fontSize: 8, fontWeight: 700,
                              background: POS_COLOR[player.position]?.bg,
                              color: POS_COLOR[player.position]?.color,
                              padding: '1px 4px', borderRadius: 3,
                            }}>{player.position}</span>
                          </div>

                          {/* Secondary stats */}
                          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                            {tabConfig.heroSec(player).map((s, i) => (
                              <span key={i} style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>{s}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Data table ── */}
            <div style={{ borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', background: 'rgba(0,0,0,0.25)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isTeamsTab ? 600 : 920 }}>
                  {/* Table head */}
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: '#00FA61', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', width: 36 }}>#</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: '#00FA61', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', minWidth: 160 }}>
                        {isTeamsTab ? 'Club' : 'Player'}
                      </th>
                      {!isTeamsTab && (
                        <>
                          <th style={{ padding: '10px 8px', textAlign: 'center', color: '#00FA61', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Club</th>
                          <th style={{ padding: '10px 8px', textAlign: 'center', color: '#00FA61', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Pos</th>
                        </>
                      )}
                      {isTeamsTab ? (
                        <>
                          {[
                            { key: 'xG',             label: 'xG' },
                            { key: 'xg_per90',       label: 'xG p90' },
                            { key: 'xGC',            label: 'xGC' },
                            { key: 'xgc_per90',      label: 'xGC p90' },
                            { key: 'clean_sheets',   label: 'Clean Sheets' },
                            { key: 'goals_scored',   label: 'Goals' },
                            { key: 'goals_conceded', label: 'Goals Conceded' },
                          ].map((col) => (
                            <th
                              key={col.key}
                              className="sort-th"
                              onClick={() => handleSort(col.key)}
                              style={{ padding: '10px 10px', textAlign: 'right', color: sortKey === col.key ? '#00FA61' : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' as const }}
                            >
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                {col.label} <SortIndicator colKey={col.key} />
                              </span>
                            </th>
                          ))}
                        </>
                      ) : (
                        cols.map((col) => (
                          <th
                            key={col.key}
                            className="sort-th"
                            onClick={() => handleSort(col.key)}
                            style={{ padding: '10px 10px', textAlign: 'right', color: sortKey === col.key ? '#00FA61' : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' as const }}
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
                              {col.label} <SortIndicator colKey={col.key} />
                            </span>
                          </th>
                        ))
                      )}
                      {/* Laatste 5 GW kolom — alleen voor spelerstabbladen */}
                      {!isTeamsTab && (
                        <th style={{
                          padding: '10px 10px', textAlign: 'center',
                          color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700,
                          textTransform: 'uppercase', letterSpacing: '0.08em',
                          whiteSpace: 'nowrap' as const,
                        }}>
                          Laatste 5 GW
                        </th>
                      )}
                    </tr>
                  </thead>

                  {/* Table body */}
                  <tbody>
                    {pageData.length === 0 ? (
                      <tr>
                        <td colSpan={20} style={{ textAlign: 'center', padding: '40px 16px', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
                          Geen resultaten gevonden
                        </td>
                      </tr>
                    ) : isTeamsTab ? (
                      // Teams rows
                      (pageData as StatsTeam[]).map((team, i) => {
                        const globalRank = page * PAGE_SIZE + i + 1;
                        const rankColor = globalRank === 1 ? '#FFD700' : globalRank === 2 ? '#C0C0C0' : globalRank === 3 ? '#CD7F32' : 'rgba(255,255,255,0.3)';
                        const xgP90 = per90(team.xG, team.minutes);
                        const xgcP90 = per90(team.xGC, team.minutes);
                        return (
                          <tr
                            key={team.id}
                            className="stat-row"
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.1s' }}
                          >
                            <td style={{ padding: '10px 12px', color: rankColor, fontWeight: 700, fontSize: 12 }}>{globalRank}</td>
                            <td style={{ padding: '10px 12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,250,97,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <span style={{ color: '#00FA61', fontWeight: 800, fontSize: 11 }}>{team.name.slice(0, 3)}</span>
                                </div>
                                <div>
                                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{team.fullName}</div>
                                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>{team.name}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '10px 10px', textAlign: 'right', color: '#00FA61', fontWeight: 700, fontSize: 13 }}>{fmtStat(team.xG, 2)}</td>
                            <td style={{ padding: '10px 10px', textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{fmt(xgP90)}</td>
                            <td style={{ padding: '10px 10px', textAlign: 'right', color: '#F87171', fontWeight: 700, fontSize: 13 }}>{fmtStat(team.xGC, 2)}</td>
                            <td style={{ padding: '10px 10px', textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{fmt(xgcP90)}</td>
                            <td style={{ padding: '10px 10px', textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{team.clean_sheets}</td>
                            <td style={{ padding: '10px 10px', textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{team.goals_scored}</td>
                            <td style={{ padding: '10px 10px', textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{team.goals_conceded}</td>
                          </tr>
                        );
                      })
                    ) : (
                      // Player rows
                      (pageData as StatsPlayer[]).map((player, i) => {
                        const globalRank = page * PAGE_SIZE + i + 1;
                        const rankColor = globalRank === 1 ? '#FFD700' : globalRank === 2 ? '#C0C0C0' : globalRank === 3 ? '#CD7F32' : 'rgba(255,255,255,0.3)';
                        const pc = POS_COLOR[player.position] ?? { bg: 'rgba(255,255,255,0.1)', color: '#fff' };
                        return (
                          <tr
                            key={player.id}
                            className="stat-row"
                            onClick={() => setModalPlayer(player)}
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.1s' }}
                          >
                            {/* Rank */}
                            <td style={{ padding: '9px 12px', color: rankColor, fontWeight: 700, fontSize: 12 }}>{globalRank}</td>

                            {/* Player */}
                            <td style={{ padding: '9px 12px', minWidth: 160 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                <div style={{ width: 30, height: 30, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                  {player.imageUrl ? (
                                    <Image src={player.imageUrl} alt={player.name} width={30} height={30} style={{ objectFit: 'cover', objectPosition: '50% 10%', width: '100%', height: '100%' }} unoptimized />
                                  ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <span style={{ color: '#00FA61', fontSize: 11, fontWeight: 800 }}>{player.name.charAt(0)}</span>
                                    </div>
                                  )}
                                </div>
                                <span style={{ color: '#fff', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' as const }}>{player.name}</span>
                              </div>
                            </td>

                            {/* Club */}
                            <td style={{ padding: '9px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: 11, whiteSpace: 'nowrap' as const }}>{player.team}</td>

                            {/* Position */}
                            <td style={{ padding: '9px 8px', textAlign: 'center' }}>
                              <span style={{ fontSize: 9, fontWeight: 700, background: pc.bg, color: pc.color, padding: '2px 5px', borderRadius: 4 }}>
                                {player.position}
                              </span>
                            </td>

                            {/* Stats columns */}
                            {cols.map((col, ci) => {
                              const val = col.getValue(player);
                              const isPrimary = ci === 0;
                              return (
                                <td
                                  key={col.key}
                                  style={{
                                    padding: '9px 10px', textAlign: 'right',
                                    color: isPrimary ? '#00FA61' : 'rgba(255,255,255,0.65)',
                                    fontWeight: isPrimary ? 700 : 500,
                                    fontSize: isPrimary ? 13 : 12,
                                    whiteSpace: 'nowrap' as const,
                                  }}
                                >
                                  {val === null ? '–' : val.toFixed(col.decimals ?? 0)}
                                </td>
                              );
                            })}

                            {/* Laatste 5 GW */}
                            <td style={{ padding: '9px 10px', textAlign: 'center', whiteSpace: 'nowrap' as const }}>
                              {historyData[player.id] ? (
                                historyData[player.id].length > 0 ? (
                                  <div style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
                                    {historyData[player.id].map((entry) => {
                                      const val = getHistoryStat(entry, activeTab);
                                      const dec = getHistoryDecimals(activeTab);
                                      const bs  = isPointsTab ? ptsBadgeStyle(entry.total_points) : null;
                                      return (
                                        <span
                                          key={entry.round}
                                          title={`GW${entry.round}: ${val.toFixed(dec)}`}
                                          style={{
                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                            minWidth: 22, height: 20, borderRadius: 4,
                                            fontSize: 9.5, fontWeight: 700,
                                            fontFamily: 'Montserrat, sans-serif',
                                            cursor: 'default',
                                            background: bs
                                              ? bs.bg
                                              : val > 0 ? 'rgba(0,250,97,0.15)' : 'rgba(255,255,255,0.06)',
                                            color: bs
                                              ? bs.color
                                              : val > 0 ? '#00FA61' : 'rgba(255,255,255,0.3)',
                                            padding: '0 3px',
                                          }}
                                        >
                                          {val.toFixed(dec)}
                                        </span>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>—</span>
                                )
                              ) : (
                                <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: 10 }}>·</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Teams tab disclaimer ── */}
            {isTeamsTab && (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontStyle: 'italic', marginTop: 8 }}>
                * Team xG is berekend op basis van FPL spelersdata en kan afwijken van officiële Opta statistieken.
              </p>
            )}

            {/* ── Pagination ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, flexWrap: 'wrap' as const, gap: 8 }}>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                {listLen} {isTeamsTab ? 'clubs' : 'spelers'} · pagina {page + 1} / {totalPages}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  style={{
                    width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                    color: page === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
                    cursor: page === 0 ? 'default' : 'pointer',
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  style={{
                    width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                    color: page >= totalPages - 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
                    cursor: page >= totalPages - 1 ? 'default' : 'pointer',
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Player detail modal ── */}
      {modalPlayer && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setModalPlayer(null)}
        >
          <div
            style={{
              background: 'rgba(15,8,65,0.98)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(0,250,97,0.2)',
              borderRadius: 20,
              padding: 0,
              width: '100%',
              maxWidth: 480,
              overflow: 'hidden',
              boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
              fontFamily: 'Montserrat, sans-serif',
              animation: 'fadeInUp 0.25s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
              {/* Photo */}
              <div style={{ width: 80, height: 100, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: 'rgba(0,250,97,0.08)', border: '1px solid rgba(0,250,97,0.15)' }}>
                {modalPlayer.imageUrl ? (
                  <Image src={modalPlayer.imageUrl} alt={modalPlayer.name} width={80} height={100} style={{ objectFit: 'cover', objectPosition: '50% 10%', width: '100%', height: '100%' }} unoptimized />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#00FA61', fontSize: 32, fontWeight: 800 }}>{modalPlayer.name.charAt(0)}</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, paddingTop: 4 }}>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, lineHeight: 1.2, marginBottom: 4 }}>{modalPlayer.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginBottom: 8 }}>{modalPlayer.fullName}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                  <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{modalPlayer.teamFull}</span>
                  <span style={{
                    background: POS_COLOR[modalPlayer.position]?.bg,
                    color: POS_COLOR[modalPlayer.position]?.color,
                    padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                  }}>{modalPlayer.position}</span>
                  <span style={{ background: 'rgba(0,250,97,0.12)', color: '#00FA61', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                    £{modalPlayer.price.toFixed(1)}m
                  </span>
                </div>
              </div>

              {/* Close */}
              <button
                onClick={() => setModalPlayer(null)}
                style={{ position: 'absolute', top: 14, right: 14, width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Stats grid */}
            <div style={{ padding: '12px 20px 20px' }}>
              {/* Row builder */}
              {(() => {
                const p = modalPlayer;
                const p90g  = per90(p.goals_scored, p.minutes);
                const p90xg = per90(p.expected_goals, p.minutes);
                const p90a  = per90(p.assists, p.minutes);
                const p90xa = per90(p.expected_assists, p.minutes);
                const p90xi = per90(p.expected_goal_involvements, p.minutes);
                const p90sv = per90(p.saves, p.minutes);
                const rows = [
                  ['⚽ Goals', p.goals_scored, `xG: ${p.expected_goals.toFixed(2)}`, `xG p90: ${fmt(p90xg)}`],
                  ['Goals p90', fmt(p90g, 2), `xG p90: ${fmt(p90xg)}`, ''],
                  ['🅰️ Assists', p.assists, `xA: ${p.expected_assists.toFixed(2)}`, `xA p90: ${fmt(p90xa)}`],
                  ['Assists p90', fmt(p90a, 2), '', ''],
                  ['📊 xGI', p.expected_goal_involvements.toFixed(2), `xGI p90: ${fmt(p90xi)}`, ''],
                  ...(p.position === 'GK' ? [
                    ['🧤 Saves', p.saves, `Saves p90: ${fmt(p90sv)}`, ''],
                    ['Clean Sheets', p.clean_sheets, '', ''],
                  ] : p.position === 'DEF' ? [
                    ['Clean Sheets', p.clean_sheets, '', ''],
                  ] : []),
                  ['⭐ Total Points', p.total_points, `p/g: ${p.points_per_game.toFixed(2)}`, `Form: ${p.form.toFixed(1)}`],
                  ['👥 Ownership', `${p.ownership.toFixed(1)}%`, '', ''],
                  ['⏱️ Minutes', p.minutes, '', ''],
                  ['🟨 Yellow Cards', p.yellow_cards, '🟥 Red Cards', String(p.red_cards)],
                  ['Bonus', p.bonus, 'BPS', String(p.bps)],
                ];
                return rows.map(([label, val, sub1, sub2], ri) => (
                  <div
                    key={ri}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 10px',
                      background: ri % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent',
                      borderRadius: 6, gap: 8,
                    }}
                  >
                    <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>{label}</span>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      {sub1 && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{sub1}</span>}
                      {sub2 && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{sub2}</span>}
                      <span style={{ color: '#00FA61', fontWeight: 700, fontSize: 14, minWidth: 30, textAlign: 'right' }}>{String(val)}</span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

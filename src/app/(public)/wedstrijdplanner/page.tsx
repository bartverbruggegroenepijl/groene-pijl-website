'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

// ─── FDR kleurenschema (exact zoals FPL website) ──────────────────────────────

const FDR_CONFIG: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: '#375523', text: '#ffffff', label: 'Zeer makkelijk' },
  2: { bg: '#01FC7A', text: '#111111', label: 'Makkelijk'      },
  3: { bg: '#E7E7E7', text: '#111111', label: 'Neutraal'       },
  4: { bg: '#FF1751', text: '#ffffff', label: 'Moeilijk'       },
  5: { bg: '#80072D', text: '#ffffff', label: 'Zeer moeilijk'  },
};

const TEAM_COL_WIDTH = 180; // px — sticky teamnaam kolom
const GW_VISIBLE     = 5;   // aantal zichtbare GW kolommen tegelijk

// ─── Types ────────────────────────────────────────────────────────────────────

interface FixtureCell {
  gw:         number;
  opponent:   string;
  location:   'H' | 'A';
  difficulty: number;
}

interface TeamFDR {
  id:            number;
  name:          string;
  shortName:     string;
  fixtures:      FixtureCell[];
  avgDifficulty: number;
}

// ─── Sticky kolom achtergronden (opaque over page gradient) ───────────────────
const STICKY_BG     = '#1a1460';
const STICKY_HDR_BG = '#1a1361';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WedstrijdplannerPage() {
  const [teams,             setTeams]             = useState<TeamFDR[]>([]);
  const [gameweeks,         setGameweeks]         = useState<number[]>([]);
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState<string | null>(null);
  const [lastUpdated,       setLastUpdated]       = useState<Date | null>(null);
  const [visibleStartIndex, setVisibleStartIndex] = useState(0);
  const [gwColWidth,        setGwColWidth]        = useState(80); // fallback

  const scrollRef    = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Meet containerbreedte → bereken GW kolombreedtes ────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const measure = () => {
      const w = containerRef.current?.clientWidth ?? 0;
      const colW = Math.floor((w - TEAM_COL_WIDTH) / GW_VISIBLE);
      setGwColWidth(Math.max(colW, 68)); // minimaal 68px
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/fpl/fixtures');
      if (!res.ok) throw new Error('Kan fixtures niet laden');
      const data = await res.json();
      setTeams(data.teams ?? []);
      setGameweeks(data.gameweeks ?? []);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Onbekende fout');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Navigatie ────────────────────────────────────────────────────────────────
  const totalGWs   = gameweeks.length;
  const canPrev    = visibleStartIndex > 0;
  const canNext    = visibleStartIndex + GW_VISIBLE < totalGWs;

  const scrollPrev = () => {
    if (!canPrev) return;
    scrollRef.current!.scrollLeft -= gwColWidth;
    setVisibleStartIndex((i) => i - 1);
  };

  const scrollNext = () => {
    if (!canNext) return;
    scrollRef.current!.scrollLeft += gwColWidth;
    setVisibleStartIndex((i) => i + 1);
  };

  // Label: "GW30 — GW34"
  const labelStart = gameweeks[visibleStartIndex];
  const labelEnd   = gameweeks[Math.min(visibleStartIndex + GW_VISIBLE - 1, totalGWs - 1)];

  const sortedTeams = [...teams].sort((a, b) => a.avgDifficulty - b.avgDifficulty);

  const PAGE_BG = 'linear-gradient(135deg, #1a1361 0%, #1F0E84 30%, #2D1B69 60%, #0d3d2a 85%, #0a4a1a 100%)';

  const navBtnStyle = (disabled: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '8px 16px', borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.2)',
    background: disabled ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.1)',
    color: disabled ? 'rgba(255,255,255,0.25)' : 'white',
    fontSize: 13, fontWeight: 600,
    fontFamily: 'Montserrat, sans-serif',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.3 : 1,
    transition: 'background 0.15s',
  });

  return (
    <main style={{ minHeight: '100vh', background: PAGE_BG }}>

      {/* Scrollbar verbergen — navigatie via knoppen */}
      <style>{`
        .fdr-scroll { scrollbar-width: none; }
        .fdr-scroll::-webkit-scrollbar { display: none; }
        .nav-btn:hover:not(:disabled) { background: rgba(0,250,97,0.2) !important; }
      `}</style>

      <div
        ref={containerRef}
        style={{ maxWidth: 1400, margin: '0 auto', padding: '100px 24px 80px' }}
      >

        {/* Terug link */}
        <Link
          href="/"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            color: 'rgba(255,255,255,0.45)', fontSize: 13,
            textDecoration: 'none', marginBottom: 36,
            fontFamily: 'Montserrat, sans-serif',
          }}
        >
          <ArrowLeft size={13} /> Terug naar home
        </Link>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <span style={{
            display: 'inline-block', fontSize: 11, fontWeight: 600,
            color: '#00FA61', letterSpacing: '0.15em',
            fontFamily: 'Montserrat, sans-serif',
            marginBottom: 10, textTransform: 'uppercase',
          }}>
            FPL Tools
          </span>
          <h1 style={{
            fontSize: 'clamp(30px, 4vw, 54px)', fontWeight: 800,
            color: 'white', margin: '0 0 10px',
            fontFamily: 'Montserrat, sans-serif', lineHeight: 1.1,
          }}>
            WEDSTRIJDPLANNER
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, margin: 0, fontFamily: 'Montserrat, sans-serif' }}>
            Fixture Difficulty Rating per team — gesorteerd op makkelijkste fixtures
          </p>
        </div>

        {/* Controls: ververs + navigatie */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>

          {/* Ververs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {lastUpdated && (
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontFamily: 'Montserrat, sans-serif' }}>
                {lastUpdated.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={fetchData}
              disabled={loading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 16px', borderRadius: 20,
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.55)', fontSize: 12,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'Montserrat, sans-serif',
              }}
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              Verversen
            </button>
          </div>

          {/* GW navigatie — alleen tonen als data geladen is */}
          {!loading && !error && totalGWs > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                className="nav-btn"
                onClick={scrollPrev}
                disabled={!canPrev}
                style={navBtnStyle(!canPrev)}
              >
                <ChevronLeft size={14} /> Vorige
              </button>

              <span style={{
                color: 'white', fontWeight: 600, fontSize: 13,
                fontFamily: 'Montserrat, sans-serif',
                minWidth: 100, textAlign: 'center',
              }}>
                {labelStart !== undefined && labelEnd !== undefined
                  ? `GW${labelStart} — GW${labelEnd}`
                  : ''}
              </span>

              <button
                className="nav-btn"
                onClick={scrollNext}
                disabled={!canNext}
                style={navBtnStyle(!canNext)}
              >
                Volgende <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Legenda */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
          {Object.entries(FDR_CONFIG).map(([score, cfg]) => (
            <div key={score} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, background: cfg.bg, flexShrink: 0 }} />
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontFamily: 'Montserrat, sans-serif' }}>
                {score} – {cfg.label}
              </span>
            </div>
          ))}
        </div>

        {/* Tabel */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.3)', fontFamily: 'Montserrat, sans-serif' }}>
            Fixtures laden...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#FF1751', fontFamily: 'Montserrat, sans-serif' }}>
            {error}
          </div>
        ) : (
          /* Relatieve wrapper voor fade-overlay */
          <div style={{ position: 'relative' }}>

            {/* Fade-overlay rechts */}
            {canNext && (
              <div style={{
                position: 'absolute',
                right: 0, top: 0, bottom: 0,
                width: 48,
                background: 'linear-gradient(to right, transparent, rgba(26,19,97,0.9))',
                pointerEvents: 'none',
                zIndex: 5,
              }} />
            )}

            {/* Scrollbare tabelcontainer — scrollbar verborgen */}
            <div
              ref={scrollRef}
              className="fdr-scroll"
              style={{
                width: '100%',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch' as unknown as undefined,
                scrollBehavior: 'smooth',
              }}
            >
              <table style={{
                tableLayout: 'fixed',
                borderCollapse: 'collapse',
                width: `${TEAM_COL_WIDTH + totalGWs * gwColWidth}px`,
              }}>

                {/* Vaste kolombreedtes via colgroup */}
                <colgroup>
                  <col style={{ width: TEAM_COL_WIDTH }} />
                  {gameweeks.map((gw) => (
                    <col key={gw} style={{ width: gwColWidth }} />
                  ))}
                </colgroup>

                <thead>
                  <tr>
                    <th style={{
                      position: 'sticky', left: 0, zIndex: 20,
                      background: STICKY_HDR_BG,
                      textAlign: 'left', padding: '0 16px 10px',
                      color: 'rgba(255,255,255,0.35)', fontSize: 11,
                      fontWeight: 700, letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      fontFamily: 'Montserrat, sans-serif',
                      whiteSpace: 'nowrap',
                    }}>
                      Team
                    </th>
                    {gameweeks.map((gw) => (
                      <th key={gw} style={{
                        textAlign: 'center', padding: '0 2px 10px',
                        color: 'rgba(255,255,255,0.35)', fontSize: 11,
                        fontWeight: 700, letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        fontFamily: 'Montserrat, sans-serif',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                      }}>
                        GW{gw}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {sortedTeams.map((team) => (
                    <tr key={team.id}>
                      {/* Sticky teamnaam */}
                      <td style={{
                        position: 'sticky', left: 0, zIndex: 10,
                        background: STICKY_BG,
                        padding: '5px 16px',
                        verticalAlign: 'middle', whiteSpace: 'nowrap',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        borderBottom: '3px solid transparent',
                      }}>
                        <span style={{
                          color: 'white', fontSize: 13, fontWeight: 600,
                          fontFamily: 'Montserrat, sans-serif',
                        }}>
                          {team.name}
                        </span>
                      </td>

                      {/* Fixture cellen */}
                      {gameweeks.map((gw) => {
                        const fixture = team.fixtures.find((f) => f.gw === gw);
                        const cfg     = fixture ? (FDR_CONFIG[fixture.difficulty] ?? FDR_CONFIG[3]) : null;
                        return (
                          <td
                            key={gw}
                            style={{
                              padding: '3px 2px',
                              background: 'rgba(255,255,255,0.06)',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              borderBottom: '3px solid transparent',
                              overflow: 'hidden',
                            }}
                          >
                            {fixture && cfg ? (
                              <div style={{
                                background: cfg.bg, color: cfg.text,
                                borderRadius: 5, padding: '7px 2px',
                                fontSize: 11, fontWeight: 700,
                                fontFamily: 'Montserrat, sans-serif',
                                lineHeight: 1.2,
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', gap: 1,
                              }}>
                                <span>{fixture.opponent}</span>
                                <span style={{ fontSize: 9, opacity: 0.8, fontWeight: 500 }}>
                                  ({fixture.location === 'H' ? 'T' : 'U'})
                                </span>
                              </div>
                            ) : (
                              <div style={{
                                background: 'rgba(255,255,255,0.04)',
                                borderRadius: 5, padding: '7px 2px',
                                color: 'rgba(255,255,255,0.2)',
                                fontSize: 12, fontFamily: 'Montserrat, sans-serif',
                              }}>
                                –
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              {sortedTeams.length === 0 && (
                <p style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)', fontFamily: 'Montserrat, sans-serif' }}>
                  Geen teams gevonden.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Voetnoot */}
        <p style={{
          marginTop: 32, color: 'rgba(255,255,255,0.2)',
          fontSize: 12, fontFamily: 'Montserrat, sans-serif', textAlign: 'center',
        }}>
          T = Thuis · U = Uit · FDR data via de officiële FPL API
        </p>
      </div>
    </main>
  );
}

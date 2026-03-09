'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';

// ─── FDR kleurenschema (exact zoals FPL website) ──────────────────────────────

const FDR_CONFIG: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: '#375523', text: '#ffffff', label: 'Zeer makkelijk' },
  2: { bg: '#01FC7A', text: '#111111', label: 'Makkelijk'      },
  3: { bg: '#E7E7E7', text: '#111111', label: 'Neutraal'       },
  4: { bg: '#FF1751', text: '#ffffff', label: 'Moeilijk'       },
  5: { bg: '#80072D', text: '#ffffff', label: 'Zeer moeilijk'  },
};

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Achtergrond sticky kolom (opaque — matcht linker gradient kleur) ─────────
const STICKY_BG     = '#1a1460'; // row bg = rgba(255,255,255,0.06) over #1a1361
const STICKY_HDR_BG = '#1a1361';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WedstrijdplannerPage() {
  const [teams,       setTeams]       = useState<TeamFDR[]>([]);
  const [gameweeks,   setGameweeks]   = useState<number[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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

  // Sorteer op makkelijkste fixtures (laagste gemiddelde FDR)
  const sortedTeams = [...teams].sort((a, b) => a.avgDifficulty - b.avgDifficulty);

  const PAGE_BG = 'linear-gradient(135deg, #1a1361 0%, #1F0E84 30%, #2D1B69 60%, #0d3d2a 85%, #0a4a1a 100%)';

  return (
    <main style={{ minHeight: '100vh', background: PAGE_BG }}>

      {/* Scrollbar styling passend bij huisstijl */}
      <style>{`
        .fdr-scroll::-webkit-scrollbar          { height: 6px; }
        .fdr-scroll::-webkit-scrollbar-track    { background: rgba(255,255,255,0.05); }
        .fdr-scroll::-webkit-scrollbar-thumb    { background: #00FA61; border-radius: 3px; }
        .fdr-scroll::-webkit-scrollbar-thumb:hover { background: rgba(0,250,97,0.7); }
      `}</style>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '100px 24px 80px' }}>

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

        {/* Controls: alleen ververs knop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
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

            {/* Fade-overlay rechts: visuele scroll-hint */}
            <div style={{
              position: 'absolute',
              right: 0, top: 0, bottom: 0,
              width: 40,
              background: 'linear-gradient(to right, transparent, rgba(26,19,97,0.8))',
              pointerEvents: 'none',
              zIndex: 5,
            }} />

            {/* Horizontaal scrollbare container — volledige breedte */}
            <div
              className="fdr-scroll"
              style={{
                width: '100%',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch' as unknown as undefined,
                scrollbarWidth: 'thin',
                scrollbarColor: '#00FA61 rgba(255,255,255,0.1)',
              }}
            >
              <table style={{
                width: '100%',
                tableLayout: 'auto',
                borderCollapse: 'collapse',
                minWidth: 900,
              }}>

                <thead>
                  <tr>
                    {/* Sticky teamkolom header */}
                    <th style={{
                      position: 'sticky',
                      left: 0,
                      zIndex: 20,
                      background: STICKY_HDR_BG,
                      textAlign: 'left',
                      padding: '0 16px 10px',
                      color: 'rgba(255,255,255,0.35)',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      fontFamily: 'Montserrat, sans-serif',
                      whiteSpace: 'nowrap',
                      minWidth: 180,
                    }}>
                      Team
                    </th>
                    {gameweeks.map((gw) => (
                      <th key={gw} style={{
                        textAlign: 'center',
                        padding: '0 2px 10px',
                        color: 'rgba(255,255,255,0.35)',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        fontFamily: 'Montserrat, sans-serif',
                        whiteSpace: 'nowrap',
                        minWidth: 68,
                      }}>
                        GW{gw}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {sortedTeams.map((team) => (
                    <tr key={team.id}>
                      {/* Sticky teamkolom */}
                      <td style={{
                        position: 'sticky',
                        left: 0,
                        zIndex: 10,
                        background: STICKY_BG,
                        padding: '5px 16px',
                        verticalAlign: 'middle',
                        whiteSpace: 'nowrap',
                        minWidth: 180,
                        borderBottom: '3px solid transparent',
                      }}>
                        <span style={{
                          color: 'white',
                          fontSize: 13,
                          fontWeight: 600,
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
                              minWidth: 68,
                              borderBottom: '3px solid transparent',
                            }}
                          >
                            {fixture && cfg ? (
                              <div style={{
                                background: cfg.bg,
                                color: cfg.text,
                                borderRadius: 5,
                                padding: '7px 2px',
                                fontSize: 11,
                                fontWeight: 700,
                                fontFamily: 'Montserrat, sans-serif',
                                lineHeight: 1.2,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 1,
                              }}>
                                <span>{fixture.opponent}</span>
                                <span style={{ fontSize: 9, opacity: 0.8, fontWeight: 500 }}>
                                  ({fixture.location === 'H' ? 'T' : 'U'})
                                </span>
                              </div>
                            ) : (
                              /* Speelvrij — grijze achtergrond */
                              <div style={{
                                background: 'rgba(255,255,255,0.04)',
                                borderRadius: 5,
                                padding: '7px 2px',
                                color: 'rgba(255,255,255,0.2)',
                                fontSize: 12,
                                fontFamily: 'Montserrat, sans-serif',
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
          marginTop: 32,
          color: 'rgba(255,255,255,0.2)',
          fontSize: 12,
          fontFamily: 'Montserrat, sans-serif',
          textAlign: 'center',
        }}>
          T = Thuis · U = Uit · FDR data via de officiële FPL API
        </p>
      </div>
    </main>
  );
}

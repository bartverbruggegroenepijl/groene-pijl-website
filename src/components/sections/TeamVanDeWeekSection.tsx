'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Types ─────────────────────────────────────────────────────────────────

interface TeamPlayer {
  player_name: string | null
  player_club: string | null
  position: string | null
  points: number | null
  is_captain: boolean
  is_star_player: boolean
  player_image_url: string | null
}

interface TeamOfTheWeek {
  id: string
  week_number: number | null
  formation: string | null
  sectie_naam: string | null
  team_players: TeamPlayer[]
}

interface Props {
  team: TeamOfTheWeek | null
}

// ─── Speler Stats ──────────────────────────────────────────────────────────

interface PlayerStats {
  goals: number
  assists: number
  cleanSheet: boolean
  xG: string
  ownership: string
  minutes: number
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function shortName(name: string | null): string {
  if (!name) return '—'
  const parts = name.trim().split(' ')
  if (parts.length <= 1) return name
  return `${parts[0].charAt(0)}.${parts.slice(1).join(' ')}`
}

// ─── Tooltip ───────────────────────────────────────────────────────────────

function StatRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: 'rgba(255,255,255,0.42)', fontSize: 10.5 }}>{label}</span>
      <span style={{ color: highlight ? '#00FA61' : '#fff', fontWeight: highlight ? 800 : 700, fontSize: highlight ? 12 : 11 }}>
        {value}
      </span>
    </div>
  )
}

function PlayerTooltip({ player, stats }: { player: TeamPlayer; stats: PlayerStats | null }) {
  const showCleanSheet = player.position === 'GK' || player.position === 'DEF'

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 10px)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 192,
        background: 'rgba(7,4,28,0.94)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border: '1px solid rgba(0,250,97,0.28)',
        borderRadius: 12,
        padding: '11px 13px',
        zIndex: 200,
        pointerEvents: 'none',
        boxShadow: '0 8px 32px rgba(0,0,0,0.65), 0 0 18px rgba(0,250,97,0.06)',
        animation: 'gpTooltipIn 0.14s ease both',
        fontFamily: 'Montserrat, sans-serif',
      }}
    >
      {/* Naam */}
      <p style={{ color: '#fff', fontWeight: 700, fontSize: 12.5, margin: '0 0 3px', lineHeight: 1.3 }}>
        {player.player_name ?? '—'}
      </p>

      {/* Club */}
      {player.player_club && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 9 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00FA61', flexShrink: 0, display: 'inline-block' }} />
          <span style={{ color: 'rgba(255,255,255,0.48)', fontSize: 10.5, fontWeight: 500 }}>
            {player.player_club}
          </span>
        </div>
      )}

      {/* Stats */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {/* Punten */}
        {player.points !== null && (
          <StatRow label="Punten gameweek" value={String(player.points)} highlight />
        )}
        {/* Positie */}
        {player.position && (
          <StatRow label="Positie" value={player.position} />
        )}
        {/* Aanvoerder */}
        {player.is_captain && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.42)', fontSize: 10.5 }}>Aanvoerder</span>
            <span style={{ color: '#FFD700', fontWeight: 700, fontSize: 11 }}>✓ Ja</span>
          </div>
        )}
        {/* Uitblinker */}
        {player.is_star_player && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.42)', fontSize: 10.5 }}>Top speler</span>
            <span style={{ color: '#FFD700', fontWeight: 700, fontSize: 11 }}>★ Uitblinker</span>
          </div>
        )}

        {/* Scheidingslijn voor FPL stats */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 2, paddingTop: 5 }}>
          {/* Goals */}
          <StatRow label="⚽ Goals" value={stats ? String(stats.goals) : '–'} />
        </div>
        {/* Assists */}
        <StatRow label="🅰️ Assists" value={stats ? String(stats.assists) : '–'} />
        {/* Clean Sheet — alleen voor GK en DEF */}
        {showCleanSheet && (
          <StatRow
            label="🧤 Clean Sheet"
            value={stats ? (stats.cleanSheet ? 'Ja' : 'Nee') : '–'}
          />
        )}
        {/* Verwachte goals */}
        <StatRow label="🎯 Verwachte goals" value={stats ? stats.xG : '–'} />
        {/* Eigendom */}
        {stats?.ownership && (
          <StatRow label="👥 Eigendom" value={`${stats.ownership}%`} />
        )}
      </div>
    </div>
  )
}

// ─── PitchPlayer ───────────────────────────────────────────────────────────

function PitchPlayer({ player, stats }: { player: TeamPlayer; stats: PlayerStats | null }) {
  const [hovered, setHovered] = useState(false)
  const isCapt = player.is_captain
  const isStar = player.is_star_player
  const size = isCapt ? 62 : 50

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        paddingTop: isCapt ? 22 : 0,
        transition: 'transform 200ms ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        cursor: 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Tooltip */}
      {hovered && <PlayerTooltip player={player} stats={stats} />}

      {/* Gouden ster boven aanvoerder */}
      {isCapt && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#FFD700',
            fontSize: 18,
            lineHeight: 1,
            filter: 'drop-shadow(0 0 6px rgba(255,215,0,0.9))',
            userSelect: 'none',
          }}
        >
          ★
        </div>
      )}

      {/* Avatar cirkel */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          flexShrink: 0,
          border: isCapt
            ? '2.5px solid #FFD700'
            : isStar
            ? '2px solid rgba(255,215,0,0.5)'
            : '2px solid rgba(255,255,255,0.22)',
          boxShadow: isCapt
            ? undefined
            : hovered
            ? '0 0 14px rgba(0,250,97,0.5)'
            : undefined,
          overflow: 'hidden',
          background:
            'linear-gradient(135deg, rgba(0,250,97,0.15) 0%, rgba(31,14,132,0.55) 100%)',
          animation: isCapt ? 'gpCaptainRing 2.2s ease-in-out infinite' : undefined,
          position: 'relative',
        }}
      >
        {player.player_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={player.player_image_url}
            alt={player.player_name ?? ''}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: '50% 15%',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background:
                'linear-gradient(135deg, rgba(0,250,97,0.22) 0%, rgba(123,47,255,0.32) 100%)',
            }}
          >
            <span
              style={{
                color: '#00FA61',
                fontWeight: 800,
                fontSize: Math.round(size * 0.38),
                fontFamily: 'Montserrat, sans-serif',
                userSelect: 'none',
              }}
            >
              {player.player_name?.charAt(0) ?? '?'}
            </span>
          </div>
        )}
      </div>

      {/* Ster badge voor star player (niet aanvoerder) */}
      {isStar && !isCapt && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 17,
            height: 17,
            background: '#FFD700',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 9,
            color: '#000',
            fontWeight: 900,
            lineHeight: 1,
            boxShadow: '0 0 8px rgba(255,215,0,0.55)',
          }}
        >
          ★
        </div>
      )}

      {/* CAPTAIN badge */}
      {isCapt && (
        <div
          style={{
            background: 'linear-gradient(135deg, #B8860B, #FFD700)',
            color: '#000',
            fontSize: 7,
            fontWeight: 900,
            letterSpacing: '0.1em',
            padding: '2px 6px',
            borderRadius: 4,
            fontFamily: 'Montserrat, sans-serif',
            boxShadow: '0 2px 8px rgba(255,215,0,0.45)',
            marginTop: 2,
            userSelect: 'none',
          }}
        >
          CAPTAIN
        </div>
      )}

      {/* Naam */}
      <span
        style={{
          color: 'rgba(255,255,255,0.93)',
          fontSize: 9.5,
          fontWeight: isCapt ? 700 : 600,
          fontFamily: 'Montserrat, sans-serif',
          textAlign: 'center',
          lineHeight: 1.2,
          maxWidth: 64,
          textShadow: '0 1px 4px rgba(0,0,0,0.85)',
          display: 'block',
        }}
      >
        {shortName(player.player_name)}
      </span>

      {/* Punten badge */}
      {player.points !== null && player.points > 0 && (
        <span
          style={{
            background: '#00FA61',
            color: '#000',
            fontSize: 10,
            fontWeight: 800,
            fontFamily: 'Montserrat, sans-serif',
            padding: '1px 8px',
            borderRadius: 8,
            lineHeight: 1.5,
            display: 'block',
          }}
        >
          {player.points}
        </span>
      )}
    </div>
  )
}

// ─── Actief seizoen — verander dit bij seizoenswissel ──────────────────────

const ACTIEF_SEIZOEN = '2025-26'

// ─── Main Component ────────────────────────────────────────────────────────

export default function TeamVanDeWeekSection({ team }: Props) {
  // ── State ─────────────────────────────────────────────────────────────
  const [currentTeam, setCurrentTeam] = useState<TeamOfTheWeek | null>(team)
  const [availableWeeks, setAvailableWeeks] = useState<number[]>([])
  const [pitchOpacity, setPitchOpacity] = useState(1)
  const [statsMap, setStatsMap] = useState<Record<string, PlayerStats>>({})

  // ── Beschikbare gameweeks ophalen bij laden ──────────────────────────
  useEffect(() => {
    const supabase = createClient()
    ;(async () => {
      try {
        const { data } = await supabase
          .from('team_of_the_week')
          .select('week_number')
          .eq('published', true)
          .eq('season', ACTIEF_SEIZOEN)
          .order('week_number', { ascending: true })
        const weeks = (data ?? [])
          .map((d: { week_number: number | null }) => d.week_number)
          .filter((w): w is number => w !== null)
        setAvailableWeeks(weeks)
      } catch {}
    })()
  }, [])

  // ── Stats ophalen per speler (goals, assists, clean sheet, xG, eigendom) ─
  useEffect(() => {
    if (!currentTeam || currentTeam.team_players.length === 0) return
    setStatsMap({})
    let cancelled = false

    async function fetchStats() {
      try {
        const playersRes = await fetch('/api/fpl/players')
        if (!playersRes.ok || cancelled) return
        const { players } = (await playersRes.json()) as {
          players: Array<{ id: number; name: string; fullName: string; ownership: string; team: string }>
        }

        // Bouw twee lookup-maps:
        //  1. nameClubKey = "web_name|club_short" → exacte match (bijv. "anderson|nfo")
        //  2. nameKey     = "web_name" → fallback, first-match-wins (geen overschrijven)
        // Dit voorkomt dat twee spelers met dezelfde web_name (bijv. "Anderson")
        // elkaar overschrijven in de map — de verkeerde speler wordt dan gebruikt.
        const nameToId: Record<string, number> = {}
        const nameToOwnership: Record<string, string> = {}

        for (const p of players) {
          const nameKey     = p.name?.toLowerCase() ?? ''
          const nameClubKey = `${nameKey}|${p.team?.toLowerCase() ?? ''}`
          const fullKey     = p.fullName?.toLowerCase() ?? ''

          // Exacte sleutel: naam + club (altijd overschrijven — is uniek)
          if (nameKey) {
            nameToId[nameClubKey]  = p.id
            nameToOwnership[nameClubKey] = p.ownership ?? ''
          }

          // Naam-only sleutel: first-match-wins om naamconflicten te vermijden
          if (nameKey && !(nameKey in nameToId)) {
            nameToId[nameKey]       = p.id
            nameToOwnership[nameKey] = p.ownership ?? ''
          }
          if (fullKey && !(fullKey in nameToId)) {
            nameToId[fullKey]       = p.id
            nameToOwnership[fullKey] = p.ownership ?? ''
          }
        }

        const round = currentTeam?.week_number ?? null
        const players_snapshot = currentTeam?.team_players ?? []

        await Promise.all(
          players_snapshot.map(async (tp) => {
            const name = tp.player_name
            const club = tp.player_club
            if (!name) return

            // Probeer eerst exacte naam+club-sleutel, daarna naam-only fallback
            const nameClubKey = `${name.toLowerCase()}|${club?.toLowerCase() ?? ''}`
            const id = nameToId[nameClubKey] ?? nameToId[name.toLowerCase()]
            if (!id) return

            const ownership = nameToOwnership[nameClubKey] ?? nameToOwnership[name.toLowerCase()] ?? ''
            const roundQuery = round !== null ? `?round=${round}` : ''
            const summaryRes = await fetch(`/api/fpl/element-summary/${id}${roundQuery}`)
            if (!summaryRes.ok || cancelled) return

            const { last_match } = (await summaryRes.json()) as {
              last_match: {
                expected_goals: string
                goals_scored: number
                assists: number
                clean_sheets: number
                minutes: number
              } | null
            }

            if (!cancelled) {
              setStatsMap((prev) => ({
                ...prev,
                [name]: {
                  goals: last_match?.goals_scored ?? 0,
                  assists: last_match?.assists ?? 0,
                  cleanSheet: (last_match?.clean_sheets ?? 0) === 1,
                  xG: last_match?.expected_goals ?? '–',
                  ownership,
                  minutes: last_match?.minutes ?? 0,
                },
              }))
            }
          })
        )
      } catch {
        // Stats zijn optioneel — stilzwijgend mislukken
      }
    }

    fetchStats()
    return () => {
      cancelled = true
    }
  }, [currentTeam])

  // ── Navigeer naar een gameweek ────────────────────────────────────────
  async function navigateTo(weekNumber: number) {
    if (weekNumber === currentTeam?.week_number) return
    setPitchOpacity(0)
    await new Promise((resolve) => setTimeout(resolve, 220))
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('team_of_the_week')
        .select(
          'id, week_number, formation, sectie_naam, team_players(player_name, player_club, position, points, is_captain, is_star_player, player_image_url)'
        )
        .eq('published', true)
        .eq('season', ACTIEF_SEIZOEN)
        .eq('week_number', weekNumber)
        .limit(1)
        .single()
      if (data) {
        setCurrentTeam(data as unknown as TeamOfTheWeek)
      }
    } catch {
      // stilzwijgend mislukken
    }
    setPitchOpacity(1)
  }

  // ── Lege staat ──────────────────────────────────────────────────────────
  if (!currentTeam || currentTeam.team_players.length === 0) {
    return (
      <section
        id="team"
        style={{
          padding: '80px 16px',
          background: 'radial-gradient(ellipse at 50% 0%, #1a1a6c 0%, #0a0628 60%)',
          borderTop: '2px solid rgba(0,250,97,0.18)',
          fontFamily: 'Montserrat, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: 700,
            margin: '0 auto',
            textAlign: 'center',
            color: 'rgba(255,255,255,0.35)',
            fontSize: 15,
          }}
        >
          Nog geen team van de week beschikbaar.
        </div>
      </section>
    )
  }

  const gk = currentTeam.team_players.filter((p) => p.position === 'GK')
  const def = currentTeam.team_players.filter((p) => p.position === 'DEF')
  const mid = currentTeam.team_players.filter((p) => p.position === 'MID')
  const fwd = currentTeam.team_players.filter((p) => p.position === 'FWD')

  const totalPoints = currentTeam.team_players.reduce((sum, p) => {
    const pts = p.points ?? 0
    return sum + (p.is_captain ? pts * 2 : pts)
  }, 0)

  // Gameweek navigatie helpers
  const visibleWeeks = availableWeeks.slice(-5)
  const currentWeekIdx = availableWeeks.indexOf(currentTeam.week_number ?? -1)
  const canPrev = currentWeekIdx > 0
  const canNext = currentWeekIdx < availableWeeks.length - 1

  const rowGap = 'clamp(10px, 2.8vw, 36px)'

  return (
    <section
      id="team"
      style={{
        position: 'relative',
        paddingTop: 60,
        paddingBottom: 0,
        paddingLeft: 16,
        paddingRight: 16,
        background: 'linear-gradient(180deg, #050318 0%, #0a0628 30%, #0d0835 70%, #1a1361 100%)',
        borderTop: '2px solid rgba(0,250,97,0.18)',
        borderRadius: 16,
        overflow: 'hidden',
        fontFamily: 'Montserrat, sans-serif',
      }}
    >
      {/* ── CSS Keyframes ─────────────────────────────────────────────────── */}
      <style>{`
        @keyframes gpCaptainRing {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(255,215,0,0.18), 0 0 20px rgba(255,215,0,0.28);
          }
          50% {
            box-shadow: 0 0 0 7px rgba(255,215,0,0.36), 0 0 34px rgba(255,215,0,0.52);
          }
        }
        @keyframes gpTooltipIn {
          from { opacity: 0; transform: translateX(-50%) translateY(6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes floodlight {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
      `}</style>

      {/* ── Schijnwerpers ─────────────────────────────────────────────────── */}
      {/* Linker schijnwerper */}
      <div
        style={{
          position: 'absolute',
          top: -80,
          left: -60,
          width: 600,
          height: 600,
          background:
            'radial-gradient(ellipse at top left, rgba(255,255,220,0.18) 0%, rgba(255,255,180,0.06) 30%, transparent 65%)',
          transform: 'rotate(20deg)',
          pointerEvents: 'none',
          zIndex: 1,
          animation: 'floodlight 5s ease-in-out infinite',
        }}
      />
      {/* Rechter schijnwerper */}
      <div
        style={{
          position: 'absolute',
          top: -80,
          right: -60,
          width: 600,
          height: 600,
          background:
            'radial-gradient(ellipse at top right, rgba(255,255,220,0.18) 0%, rgba(255,255,180,0.06) 30%, transparent 65%)',
          transform: 'rotate(-20deg)',
          pointerEvents: 'none',
          zIndex: 1,
          animation: 'floodlight 5s ease-in-out infinite 2.5s',
        }}
      />
      {/* Stadion publiek suggestie */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: 0,
          right: 0,
          height: 80,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 60%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div
        style={{
          maxWidth: 760,
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
          opacity: pitchOpacity,
          transition: 'opacity 220ms ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 24,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <span
              style={{
                display: 'block',
                color: '#00FA61',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              GAMEWEEK {currentTeam.week_number ?? '—'}
            </span>
            <h2
              style={{
                color: '#fff',
                fontSize: 'clamp(26px, 3.8vw, 44px)',
                fontWeight: 800,
                margin: 0,
                lineHeight: 1.1,
                borderLeft: '4px solid #00FA61',
                paddingLeft: 12,
              }}
            >
              {currentTeam.sectie_naam || 'Team van de Week'}
            </h2>
          </div>

          {/* Badge rechtsboven */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 10,
              padding: '9px 14px',
              marginTop: 4,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: 'linear-gradient(135deg, #00FA61 0%, #1F0E84 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 800,
                color: '#fff',
                flexShrink: 0,
                letterSpacing: '-0.02em',
              }}
            >
              GP
            </div>
            <div>
              <div
                style={{
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 700,
                  lineHeight: 1.25,
                }}
              >
                De Groene Pijl Selectie
              </div>
              {currentTeam.formation && (
                <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 10 }}>
                  Formatie:{' '}
                  <span style={{ color: '#00FA61', fontWeight: 700 }}>
                    {currentTeam.formation}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Veld ───────────────────────────────────────────────────────── */}
        <div style={{ position: 'relative', borderRadius: 12, boxShadow: '0 12px 50px rgba(0,0,0,0.7)' }}>
          {/* Achtergrond (geknipte strepen + lijnen + vignette) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 12,
              overflow: 'hidden',
              zIndex: 0,
            }}
          >
            {/* Maaibanen */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'repeating-linear-gradient(180deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 38px, transparent 38px, transparent 76px), linear-gradient(180deg, #1a5c2a 0%, #1e6b30 50%, #1a5c2a 100%)',
              }}
            />

            {/* Veldlijnen */}
            <svg
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
              }}
              viewBox="0 0 400 540"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {/* Buitengrens */}
              <rect
                x="16"
                y="16"
                width="368"
                height="508"
                rx="3"
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1.5"
              />
              {/* Middenlijn */}
              <line
                x1="16"
                y1="270"
                x2="384"
                y2="270"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1.5"
              />
              {/* Middencirkel */}
              <circle
                cx="200"
                cy="270"
                r="54"
                fill="none"
                stroke="rgba(255,255,255,0.14)"
                strokeWidth="1.5"
              />
              {/* Middenstip */}
              <circle cx="200" cy="270" r="3" fill="rgba(255,255,255,0.24)" />
              {/* Strafschopgebied boven */}
              <rect
                x="106"
                y="16"
                width="188"
                height="98"
                fill="none"
                stroke="rgba(255,255,255,0.11)"
                strokeWidth="1.5"
              />
              {/* Doelgebied boven */}
              <rect
                x="150"
                y="16"
                width="100"
                height="36"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1.5"
              />
              {/* Strafschopstip boven */}
              <circle cx="200" cy="80" r="3" fill="rgba(255,255,255,0.19)" />
              {/* Strafschopgebied onder */}
              <rect
                x="106"
                y="426"
                width="188"
                height="98"
                fill="none"
                stroke="rgba(255,255,255,0.11)"
                strokeWidth="1.5"
              />
              {/* Doelgebied onder */}
              <rect
                x="150"
                y="488"
                width="100"
                height="36"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1.5"
              />
              {/* Strafschopstip onder */}
              <circle cx="200" cy="460" r="3" fill="rgba(255,255,255,0.19)" />
              {/* Hoekbogen */}
              <path
                d="M16,16 Q26,16 26,26"
                fill="none"
                stroke="rgba(255,255,255,0.10)"
                strokeWidth="1.5"
              />
              <path
                d="M384,16 Q374,16 374,26"
                fill="none"
                stroke="rgba(255,255,255,0.10)"
                strokeWidth="1.5"
              />
              <path
                d="M16,524 Q16,514 26,514"
                fill="none"
                stroke="rgba(255,255,255,0.10)"
                strokeWidth="1.5"
              />
              <path
                d="M384,524 Q384,514 374,514"
                fill="none"
                stroke="rgba(255,255,255,0.10)"
                strokeWidth="1.5"
              />
            </svg>

            {/* Vignette */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                boxShadow: 'inset 0 0 80px rgba(0,0,0,0.6)',
              }}
            />
            {/* Rand */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.07)',
              }}
            />
          </div>

          {/* Spelers (kan overflow — tooltips worden zichtbaar) */}
          <div
            style={{
              position: 'relative',
              zIndex: 10,
              padding: '44px 24px 40px',
              display: 'flex',
              flexDirection: 'column',
              gap: 32,
            }}
          >
            {fwd.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: rowGap,
                  overflow: 'visible',
                }}
              >
                {fwd.map((p, i) => (
                  <PitchPlayer key={i} player={p} stats={statsMap[p.player_name ?? ''] ?? null} />
                ))}
              </div>
            )}
            {mid.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: rowGap,
                  overflow: 'visible',
                }}
              >
                {mid.map((p, i) => (
                  <PitchPlayer key={i} player={p} stats={statsMap[p.player_name ?? ''] ?? null} />
                ))}
              </div>
            )}
            {def.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 'clamp(6px, 2.2vw, 28px)',
                  overflow: 'visible',
                }}
              >
                {def.map((p, i) => (
                  <PitchPlayer key={i} player={p} stats={statsMap[p.player_name ?? ''] ?? null} />
                ))}
              </div>
            )}
            {gk.length > 0 && (
              <div
                style={{ display: 'flex', justifyContent: 'center', overflow: 'visible' }}
              >
                {gk.map((p, i) => (
                  <PitchPlayer key={i} player={p} stats={statsMap[p.player_name ?? ''] ?? null} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Onderste balk ──────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 20px',
            background: 'rgba(4,2,20,0.80)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '0 0 16px 16px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            flexWrap: 'wrap',
            gap: 12,
            marginTop: -1,
          }}
        >
          <div>
            <p
              style={{
                color: 'rgba(255,255,255,0.32)',
                fontSize: 10.5,
                margin: '0 0 2px',
                fontWeight: 500,
              }}
            >
              Team van de Week Prestatie
            </p>
            <p
              style={{
                color: '#00FA61',
                fontSize: 26,
                fontWeight: 800,
                margin: 0,
                lineHeight: 1,
              }}
            >
              {totalPoints > 0 ? `${totalPoints} pts` : `GW ${currentTeam.week_number}`}
            </p>
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.09)',
              color: 'rgba(255,255,255,0.45)',
              fontSize: 11,
              fontWeight: 600,
              padding: '6px 12px',
              borderRadius: 8,
              fontFamily: 'Montserrat, sans-serif',
            }}
          >
            GW {currentTeam.week_number}
          </div>
        </div>

        {/* ── Gameweek navigatie ──────────────────────────────────────────── */}
        {availableWeeks.length > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              padding: '10px 16px 14px',
              marginTop: 12,
            }}
          >
            {/* Pijl links */}
            <button
              type="button"
              disabled={!canPrev}
              onClick={() => canPrev && navigateTo(availableWeeks[currentWeekIdx - 1])}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: canPrev ? 'pointer' : 'default',
                opacity: canPrev ? 0.6 : 0.2,
                padding: '6px 10px',
                fontSize: 18,
                lineHeight: 1,
                fontFamily: 'Montserrat, sans-serif',
                transition: 'opacity 150ms ease',
              }}
              onMouseEnter={(e) => { if (canPrev) e.currentTarget.style.opacity = '1' }}
              onMouseLeave={(e) => { if (canPrev) e.currentTarget.style.opacity = '0.6' }}
              aria-label="Vorige gameweek"
            >
              ←
            </button>

            {/* Gameweek labels */}
            {visibleWeeks.map((week) => {
              const isActive = week === currentTeam.week_number
              return (
                <button
                  key={week}
                  type="button"
                  onClick={() => navigateTo(week)}
                  style={{
                    position: 'relative',
                    background: 'none',
                    border: 'none',
                    color: isActive ? '#00FA61' : 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    padding: '6px 10px 12px',
                    fontSize: 11,
                    fontWeight: isActive ? 700 : 500,
                    fontFamily: 'Montserrat, sans-serif',
                    transition: 'color 150ms ease',
                    userSelect: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.9)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.4)'
                  }}
                >
                  GW{week}
                  {isActive && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 4,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        background: '#00FA61',
                        display: 'block',
                      }}
                    />
                  )}
                </button>
              )
            })}

            {/* Pijl rechts */}
            <button
              type="button"
              disabled={!canNext}
              onClick={() => canNext && navigateTo(availableWeeks[currentWeekIdx + 1])}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: canNext ? 'pointer' : 'default',
                opacity: canNext ? 0.6 : 0.2,
                padding: '6px 10px',
                fontSize: 18,
                lineHeight: 1,
                fontFamily: 'Montserrat, sans-serif',
                transition: 'opacity 150ms ease',
              }}
              onMouseEnter={(e) => { if (canNext) e.currentTarget.style.opacity = '1' }}
              onMouseLeave={(e) => { if (canNext) e.currentTarget.style.opacity = '0.6' }}
              aria-label="Volgende gameweek"
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* Fade naar volgende sectie */}
      <div
        style={{
          height: 56,
          marginTop: 40,
          background: 'linear-gradient(to bottom, transparent, #0D0D0D)',
          pointerEvents: 'none',
        }}
      />
    </section>
  )
}


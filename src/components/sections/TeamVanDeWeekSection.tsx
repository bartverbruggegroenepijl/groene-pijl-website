'use client'

import { useState, useEffect } from 'react'

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
  team_players: TeamPlayer[]
}

interface Props {
  team: TeamOfTheWeek | null
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function shortName(name: string | null): string {
  if (!name) return '—'
  const parts = name.trim().split(' ')
  if (parts.length <= 1) return name
  return `${parts[0].charAt(0)}.${parts.slice(1).join(' ')}`
}

// ─── Tooltip ───────────────────────────────────────────────────────────────

function PlayerTooltip({ player, xg }: { player: TeamPlayer; xg: string | null }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 10px)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 178,
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
      <p
        style={{
          color: '#fff',
          fontWeight: 700,
          fontSize: 12.5,
          margin: '0 0 3px',
          lineHeight: 1.3,
        }}
      >
        {player.player_name ?? '—'}
      </p>

      {/* Club */}
      {player.player_club && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            marginBottom: 9,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#00FA61',
              flexShrink: 0,
              display: 'inline-block',
            }}
          />
          <span
            style={{ color: 'rgba(255,255,255,0.48)', fontSize: 10.5, fontWeight: 500 }}
          >
            {player.player_club}
          </span>
        </div>
      )}

      {/* Stats */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.07)',
          paddingTop: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
        }}
      >
        {player.points !== null && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.42)', fontSize: 10.5 }}>Punten gameweek</span>
            <span style={{ color: '#00FA61', fontWeight: 800, fontSize: 12 }}>{player.points}</span>
          </div>
        )}
        {player.position && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.42)', fontSize: 10.5 }}>Positie</span>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 11 }}>{player.position}</span>
          </div>
        )}
        {player.is_captain && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.42)', fontSize: 10.5 }}>Aanvoerder</span>
            <span style={{ color: '#FFD700', fontWeight: 700, fontSize: 11 }}>✓ Ja</span>
          </div>
        )}
        {player.is_star_player && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.42)', fontSize: 10.5 }}>Top speler</span>
            <span style={{ color: '#FFD700', fontWeight: 700, fontSize: 11 }}>★ Uitblinker</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'rgba(255,255,255,0.42)', fontSize: 10.5 }}>🎯 Verwachte goals</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 11 }}>
            {xg !== null ? xg : '–'}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── PitchPlayer ───────────────────────────────────────────────────────────

function PitchPlayer({ player, xg }: { player: TeamPlayer; xg: string | null }) {
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
      {hovered && <PlayerTooltip player={player} xg={xg} />}

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

// ─── Main Component ────────────────────────────────────────────────────────

export default function TeamVanDeWeekSection({ team }: Props) {
  // ── xG state — { playerName: xgWaarde } ─────────────────────────────────
  const [xgMap, setXgMap] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!team || team.team_players.length === 0) return
    let cancelled = false

    async function fetchXg() {
      try {
        // Stap 1: haal alle FPL spelers op om web_name → id te koppelen
        const playersRes = await fetch('/api/fpl/players')
        if (!playersRes.ok || cancelled) return
        const { players } = (await playersRes.json()) as {
          players: Array<{ id: number; name: string; fullName: string }>
        }

        const nameToId: Record<string, number> = {}
        for (const p of players) {
          if (p.name) nameToId[p.name.toLowerCase()] = p.id
          if (p.fullName) nameToId[p.fullName.toLowerCase()] = p.id
        }

        // Stap 2: per speler de element-summary ophalen → xG uit laatste wedstrijd
        const players_snapshot = team?.team_players ?? []
        await Promise.all(
          players_snapshot.map(async (tp) => {
            const name = tp.player_name
            if (!name) return
            const id = nameToId[name.toLowerCase()]
            if (!id) return

            const summaryRes = await fetch(`/api/fpl/element-summary/${id}`)
            if (!summaryRes.ok || cancelled) return
            const { last_match } = (await summaryRes.json()) as {
              last_match: { expected_goals: string } | null
            }

            const xg = last_match?.expected_goals ?? null
            if (xg !== null && !cancelled) {
              setXgMap((prev) => ({ ...prev, [name]: xg }))
            }
          })
        )
      } catch {
        // xG is optioneel — stilzwijgend mislukken
      }
    }

    fetchXg()
    return () => {
      cancelled = true
    }
  }, [team])

  // ── Lege staat ──────────────────────────────────────────────────────────
  if (!team || team.team_players.length === 0) {
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

  const gk = team.team_players.filter((p) => p.position === 'GK')
  const def = team.team_players.filter((p) => p.position === 'DEF')
  const mid = team.team_players.filter((p) => p.position === 'MID')
  const fwd = team.team_players.filter((p) => p.position === 'FWD')

  const totalPoints = team.team_players.reduce((sum, p) => {
    const pts = p.points ?? 0
    return sum + (p.is_captain ? pts * 2 : pts)
  }, 0)

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
        background:
          'radial-gradient(ellipse at 50% -5%, #1c2a6e 0%, #0d0828 52%, #080520 100%)',
        borderTop: '2px solid rgba(0,250,97,0.18)',
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
        @keyframes gpFloodLeft {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 0.85; }
        }
        @keyframes gpFloodRight {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 0.85; }
        }
      `}</style>

      {/* ── Schijnwerpers ─────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '55%',
          height: '85%',
          background:
            'radial-gradient(ellipse at 4% 0%, rgba(210,225,255,0.14) 0%, transparent 52%)',
          pointerEvents: 'none',
          zIndex: 0,
          animation: 'gpFloodLeft 5s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '55%',
          height: '85%',
          background:
            'radial-gradient(ellipse at 96% 0%, rgba(210,225,255,0.14) 0%, transparent 52%)',
          pointerEvents: 'none',
          zIndex: 0,
          animation: 'gpFloodRight 5s ease-in-out infinite 2.5s',
        }}
      />

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div
        style={{ maxWidth: 760, margin: '0 auto', position: 'relative', zIndex: 1 }}
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
              GAMEWEEK {team.week_number ?? '—'}
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
              Team van de Week
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
              {team.formation && (
                <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 10 }}>
                  Formatie:{' '}
                  <span style={{ color: '#00FA61', fontWeight: 700 }}>
                    {team.formation}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Veld ───────────────────────────────────────────────────────── */}
        <div style={{ position: 'relative' }}>
          {/* Achtergrond (geknipte strepen + lijnen + vignette) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 16,
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
                  'repeating-linear-gradient(180deg, #1b5f2e 0px, #1b5f2e 42px, #1f6c34 42px, #1f6c34 84px)',
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
                boxShadow: 'inset 0 0 90px rgba(3,1,18,0.70)',
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
                  <PitchPlayer key={i} player={p} xg={xgMap[p.player_name ?? ''] ?? null} />
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
                  <PitchPlayer key={i} player={p} xg={xgMap[p.player_name ?? ''] ?? null} />
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
                  <PitchPlayer key={i} player={p} xg={xgMap[p.player_name ?? ''] ?? null} />
                ))}
              </div>
            )}
            {gk.length > 0 && (
              <div
                style={{ display: 'flex', justifyContent: 'center', overflow: 'visible' }}
              >
                {gk.map((p, i) => (
                  <PitchPlayer key={i} player={p} xg={xgMap[p.player_name ?? ''] ?? null} />
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
              {totalPoints > 0 ? `${totalPoints} pts` : `GW ${team.week_number}`}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
              GW {team.week_number}
            </div>
            <ShareButton />
          </div>
        </div>
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

// ─── Share Button (gescheiden om inline event-handlers te vermijden) ────────

function ShareButton() {
  return (
    <button
      type="button"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'rgba(0,250,97,0.08)',
        border: '1px solid rgba(0,250,97,0.26)',
        color: '#00FA61',
        fontSize: 11.5,
        fontWeight: 700,
        padding: '7px 14px',
        borderRadius: 8,
        cursor: 'pointer',
        fontFamily: 'Montserrat, sans-serif',
        transition: 'background 200ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(0,250,97,0.16)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(0,250,97,0.08)'
      }}
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
      </svg>
      Deel mijn Team vd Week
    </button>
  )
}

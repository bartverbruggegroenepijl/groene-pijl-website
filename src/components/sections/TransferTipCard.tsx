'use client'

import { useState } from 'react'

interface TransferTipCardProps {
  playerName: string | null
  playerClub: string | null
  position: string | null
  price: number | null
  motivation: string | null
  imageUrl: string | null
  goals: number
  assists: number
}

const POSITION_LABELS: Record<string, string> = {
  GK: 'GK', DEF: 'DEF', MID: 'MID', FWD: 'FWD',
  Goalkeeper: 'GK', Defender: 'DEF', Midfielder: 'MID', Forward: 'FWD',
}

export default function TransferTipCard({
  playerName,
  playerClub,
  position,
  price,
  motivation,
  imageUrl,
  goals,
  assists,
}: TransferTipCardProps) {
  const [hovered, setHovered] = useState(false)

  const posLabel = position
    ? (POSITION_LABELS[position] ?? position.slice(0, 3).toUpperCase())
    : null

  return (
    <div
      style={{
        width: '100%',
        borderRadius: '14px',
        /* Gold gradient border via outer wrapper + 1.5px padding */
        background: 'linear-gradient(135deg, #C8A84B 0%, #FFD700 50%, #C8A84B 100%)',
        padding: '1.5px',
        border: hovered ? '1.5px solid rgba(255,215,0,1)' : '1.5px solid transparent',
        boxShadow: 'none',
        transform: hovered ? 'translateY(-8px)' : 'translateY(0)',
        transition: 'all 0.3s ease',
        cursor: hovered ? 'pointer' : 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Inner card ──────────────────────────────────────────────── */}
      <div
        style={{
          borderRadius: '12.5px',
          height: 240,
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'Montserrat, sans-serif',
          background: [
            'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 8px)',
            'linear-gradient(160deg, #1a0a3d 0%, #1F0E84 40%, #0d0528 70%, #0a0628 100%)',
          ].join(', '),
        }}
      >
        {/* Full-bleed spelerfoto */}
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={playerName ?? ''}
            className="transfer-tip-photo"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center top',
              transform: 'scale(0.85)',
              transformOrigin: 'top center',
            }}
          />
        )}

        {/* Fallback initiaal als er geen foto is */}
        {!imageUrl && (
          <div
            style={{
              position: 'absolute',
              top: '18%',
              left: 0,
              right: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
            }}
          >
            <span
              style={{
                fontSize: 52,
                fontWeight: 800,
                color: 'rgba(0,250,97,0.35)',
                lineHeight: 1,
              }}
            >
              {playerName?.charAt(0).toUpperCase() ?? '?'}
            </span>
          </div>
        )}

        {/* Volledige gradient overlay — foto loopt vloeiend over in tekst */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.75) 20%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0.15) 60%, transparent 80%)',
            borderRadius: '12.5px',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />

        {/* ── Top balk: positie + prijs ──────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            padding: '8px 8px 0',
            zIndex: 3,
          }}
        >
          {posLabel && (
            <span
              style={{
                color: '#00FA61',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                background: 'rgba(0,0,0,0.72)',
                border: '1px solid rgba(0,250,97,0.35)',
                borderRadius: 4,
                padding: '2px 5px',
              }}
            >
              {posLabel}
            </span>
          )}
          {price !== null && (
            <span
              style={{
                color: '#FFD700',
                fontSize: 10,
                fontWeight: 700,
                background: 'rgba(0,0,0,0.72)',
                borderRadius: 4,
                padding: '2px 5px',
              }}
            >
              £{Number(price).toFixed(1)}m
            </span>
          )}
        </div>

        {/* ── Onderste info ─────────────────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '22px 8px 8px',
            zIndex: 3,
            textAlign: 'center',
          }}
        >
          {/* Naam */}
          <p
            style={{
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              margin: 0,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {playerName ?? '—'}
          </p>

          {/* Club */}
          <p
            style={{
              color: 'rgba(255,255,255,0.48)',
              fontSize: 10,
              margin: '2px 0 0',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {playerClub ?? ''}
          </p>

          {/* Stats: goals + assists */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 10,
              marginTop: 5,
            }}
          >
            <span style={{ color: '#00FA61', fontSize: 10, fontWeight: 700 }}>
              ⚽ {goals}
            </span>
            <span style={{ color: '#00FA61', fontSize: 10, fontWeight: 700 }}>
              🅰️ {assists}
            </span>
          </div>

          {/* Tiptekst */}
          {motivation && (
            <p
              style={{
                color: 'rgba(255,255,255,0.52)',
                fontSize: 9.5,
                fontStyle: 'italic',
                margin: '4px 0 0',
                lineHeight: 1.35,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                textOverflow: 'ellipsis',
              } as React.CSSProperties}
            >
              {motivation}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

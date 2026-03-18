'use client';

import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import type { PriceChangePlayer } from '@/lib/fpl/prices';
import { formatNetTransfers } from '@/lib/fpl/prices';

type Tab      = 'stijgers' | 'dalers';
type Position = 'Alle' | 'GK' | 'DEF' | 'MID' | 'FWD';

const POSITIONS: Position[] = ['Alle', 'GK', 'DEF', 'MID', 'FWD'];

const POSITION_STYLE: Record<string, { bg: string; text: string }> = {
  GK:  { bg: '#FFD700', text: '#000' },
  DEF: { bg: '#00C3FF', text: '#000' },
  MID: { bg: '#00FA61', text: '#000' },
  FWD: { bg: '#FF6B35', text: '#fff' },
};

interface Props {
  risers: PriceChangePlayer[];
  fallers: PriceChangePlayer[];
}

function PlayerCard({
  player,
  direction,
}: {
  player: PriceChangePlayer;
  direction: 'up' | 'down';
}) {
  const [imgError, setImgError] = useState(false);
  const posBadge    = POSITION_STYLE[player.position] ?? { bg: '#e5e7eb', text: '#000' };
  // Prijs verandert altijd met £0.1m
  const changeStr   = direction === 'up' ? '+£0.1m' : '-£0.1m';
  const changeBg    = direction === 'up' ? '#00FA61' : '#FF4444';
  const changeClr   = direction === 'up' ? '#000'    : '#fff';
  const netColor    = direction === 'up' ? '#00FA61' : '#FF8888';
  const net         = formatNetTransfers(player.netTransfers);
  const isConfirmed = player.status === 'confirmed';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        borderRadius: 14,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.10)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      {/* Ronde spelersfoto */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          overflow: 'hidden',
          flexShrink: 0,
          background: 'rgba(255,255,255,0.10)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={player.imageUrl}
            alt={player.name}
            width={48}
            height={48}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <span style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
            {player.name.charAt(0)}
          </span>
        )}
      </div>

      {/* Spelerinfo */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
          <span style={{
            fontSize: 15, fontWeight: 700, color: '#ffffff',
            fontFamily: 'Montserrat, sans-serif',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {player.name}
          </span>
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
            background: posBadge.bg, color: posBadge.text,
            textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0,
          }}>
            {player.position}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'Montserrat, sans-serif', marginBottom: 5 }}>
          {player.team}
        </div>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '3px 12px',
          fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: 'Montserrat, sans-serif',
        }}>
          <span>{player.ownershipPercent}% bezit</span>
          <span style={{ color: netColor, fontWeight: 600 }}>{net} netto</span>
          <span>↑ {player.transfersIn.toLocaleString('nl-NL')}</span>
          <span>↓ {player.transfersOut.toLocaleString('nl-NL')}</span>
        </div>
      </div>

      {/* Prijs + wijziging + status */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', fontFamily: 'Montserrat, sans-serif' }}>
          £{player.nowCost.toFixed(1)}m
        </span>
        <span style={{
          fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
          background: changeBg, color: changeClr, fontFamily: 'Montserrat, sans-serif',
        }}>
          {changeStr}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 600,
          color: isConfirmed ? '#00FA61' : 'rgba(255,255,255,0.4)',
          fontFamily: 'Montserrat, sans-serif',
        }}>
          {isConfirmed ? 'Bevestigd ✓' : 'Verwacht'}
        </span>
      </div>
    </div>
  );
}

export default function PrijswijzigingenClient({ risers, fallers }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('stijgers');
  const [activePos, setActivePos] = useState<Position>('Alle');

  const players   = activeTab === 'stijgers' ? risers : fallers;
  const direction = activeTab === 'stijgers' ? 'up' : 'down' as const;

  const filtered = useMemo(() => {
    if (activePos === 'Alle') return players;
    return players.filter((p) => p.position === activePos);
  }, [players, activePos]);

  return (
    <div>
      {/* Tab + filters rij */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
        justifyContent: 'space-between', gap: 12, marginBottom: 24,
      }}>
        {/* Stijgers / Dalers tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => { setActiveTab('stijgers'); setActivePos('Alle'); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, fontFamily: 'Montserrat, sans-serif',
              background: activeTab === 'stijgers' ? '#00FA61' : 'rgba(255,255,255,0.08)',
              color:      activeTab === 'stijgers' ? '#000'    : 'rgba(255,255,255,0.6)',
              transition: 'all 0.2s',
            }}
          >
            <TrendingUp size={14} />
            Stijgers ({risers.length})
          </button>
          <button
            onClick={() => { setActiveTab('dalers'); setActivePos('Alle'); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, fontFamily: 'Montserrat, sans-serif',
              background: activeTab === 'dalers' ? '#FF4444' : 'rgba(255,255,255,0.08)',
              color:      activeTab === 'dalers' ? '#fff'    : 'rgba(255,255,255,0.6)',
              transition: 'all 0.2s',
            }}
          >
            <TrendingDown size={14} />
            Dalers ({fallers.length})
          </button>
        </div>

        {/* Positie filter */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {POSITIONS.map((pos) => (
            <button
              key={pos}
              onClick={() => setActivePos(pos)}
              style={{
                padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 700, fontFamily: 'Montserrat, sans-serif',
                background: activePos === pos
                  ? (pos === 'Alle' ? '#ffffff' : (POSITION_STYLE[pos]?.bg ?? '#ffffff'))
                  : 'rgba(255,255,255,0.08)',
                color: activePos === pos
                  ? (pos === 'Alle' ? '#1F0E84' : (POSITION_STYLE[pos]?.text ?? '#000'))
                  : 'rgba(255,255,255,0.55)',
                transition: 'all 0.2s',
              }}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      {/* Spelerslijst */}
      {filtered.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 10,
        }}>
          {filtered.map((p) => (
            <PlayerCard key={p.id} player={p} direction={direction} />
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center', padding: '64px 0',
          color: 'rgba(255,255,255,0.3)', fontSize: 14,
          fontFamily: 'Montserrat, sans-serif',
        }}>
          {activePos !== 'Alle'
            ? `Geen ${activeTab === 'stijgers' ? 'stijgers' : 'dalers'} voor positie ${activePos}`
            : 'Geen verwachte prijswijzigingen vandaag'}
        </div>
      )}

      {/* LiveFPL link */}
      <div style={{ textAlign: 'center', marginTop: 36 }}>
        <a
          href="https://www.livefpl.net/price-changes"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 20px', borderRadius: 10,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600,
            textDecoration: 'none', fontFamily: 'Montserrat, sans-serif',
          }}
        >
          <ExternalLink size={13} />
          Bekijk alle prijswijzigingen op LiveFPL
        </a>
      </div>
    </div>
  );
}

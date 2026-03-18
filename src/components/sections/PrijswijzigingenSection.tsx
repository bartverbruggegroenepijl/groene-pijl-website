// PrijswijzigingenSection — homepage blok
// Server component: fetcht data zelf via fetchPriceChanges().
// Geen event handlers (server component mag die niet bevatten).

import Link from 'next/link';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { fetchPriceChanges, formatNetTransfers } from '@/lib/fpl/prices';
import type { PriceChangePlayer } from '@/lib/fpl/prices';

const MAX_SHOWN = 5;

const POSITION_STYLE: Record<string, { bg: string; text: string }> = {
  GK:  { bg: '#FFD700', text: '#000' },
  DEF: { bg: '#00C3FF', text: '#000' },
  MID: { bg: '#00FA61', text: '#000' },
  FWD: { bg: '#FF6B35', text: '#fff' },
};

function PlayerRow({
  player,
  direction,
}: {
  player: PriceChangePlayer;
  direction: 'up' | 'down';
}) {
  const posBadge   = POSITION_STYLE[player.position] ?? { bg: '#e5e7eb', text: '#000' };
  // Prijs verandert altijd met £0.1m — bij expected is costChangeEvent nog 0,
  // maar de verwachting is altijd ±£0.1m.
  const changeStr  = direction === 'up' ? '+£0.1m' : '-£0.1m';
  const changeBg   = direction === 'up' ? '#00FA61' : '#FF4444';
  const changeClr  = direction === 'up' ? '#000'    : '#fff';
  const netColor   = direction === 'up' ? '#00FA61' : '#FF8888';
  const net        = formatNetTransfers(player.netTransfers);
  const isConfirmed = player.status === 'confirmed';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 12,
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.10)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      {/* Ronde foto */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          overflow: 'hidden',
          flexShrink: 0,
          background: 'rgba(255,255,255,0.10)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={player.imageUrl}
          alt={player.name}
          width={44}
          height={44}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'top center',
          }}
        />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{
            fontSize: 14, fontWeight: 700, color: '#ffffff',
            fontFamily: 'Montserrat, sans-serif',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {player.name}
          </span>
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 4,
            background: posBadge.bg, color: posBadge.text,
            textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0,
          }}>
            {player.position}
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', fontFamily: 'Montserrat, sans-serif' }}>
          {player.team}
          &nbsp;·&nbsp;
          {player.ownershipPercent}% bezit
          &nbsp;·&nbsp;
          <span style={{ color: netColor, fontWeight: 600 }}>{net}</span>
        </div>
      </div>

      {/* Rechter kolom: prijs + wijziging + status */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', fontFamily: 'Montserrat, sans-serif' }}>
          £{player.nowCost.toFixed(1)}m
        </span>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
          background: changeBg, color: changeClr, fontFamily: 'Montserrat, sans-serif',
        }}>
          {changeStr}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 600,
          color: isConfirmed ? '#00FA61' : 'rgba(255,255,255,0.45)',
          fontFamily: 'Montserrat, sans-serif',
        }}>
          {isConfirmed ? 'Bevestigd ✓' : 'Verwacht'}
        </span>
      </div>
    </div>
  );
}

export default async function PrijswijzigingenSection() {
  const { risers, fallers } = await fetchPriceChanges();

  const shownRisers  = risers.slice(0, MAX_SHOWN);
  const shownFallers = fallers.slice(0, MAX_SHOWN);
  const hasData      = shownRisers.length > 0 || shownFallers.length > 0;

  return (
    <section
      className="py-20 px-4"
      style={{
        backgroundImage: "url('/gradient-bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderTop: '2px solid rgba(0,250,97,0.18)',
      }}
    >
      <div className="max-w-8xl mx-auto">

        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-2">
              FPL Data
            </span>
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight border-l-4 pl-4"
              style={{ color: '#ffffff', borderColor: '#00FA61' }}
            >
              Prijswijzigingen
            </h2>
          </div>
          <Link
            href="/prijswijzigingen"
            className="hidden sm:inline-flex items-center gap-1.5 text-primary hover:text-primary/80 text-sm font-semibold transition-colors"
          >
            Alle wijzigingen <ArrowRight size={14} />
          </Link>
        </div>

        {hasData ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Stijgers */}
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginBottom: 14, padding: '8px 14px', borderRadius: 10,
                background: 'rgba(0,250,97,0.12)', border: '1px solid rgba(0,250,97,0.25)',
                width: 'fit-content',
              }}>
                <TrendingUp size={16} color="#00FA61" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#00FA61', fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.04em' }}>
                  Verwachte stijgers ({risers.length})
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {shownRisers.map((p) => (
                  <PlayerRow key={p.id} player={p} direction="up" />
                ))}
              </div>
            </div>

            {/* Dalers */}
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginBottom: 14, padding: '8px 14px', borderRadius: 10,
                background: 'rgba(255,68,68,0.12)', border: '1px solid rgba(255,68,68,0.25)',
                width: 'fit-content',
              }}>
                <TrendingDown size={16} color="#FF6B6B" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#FF6B6B', fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.04em' }}>
                  Verwachte dalers ({fallers.length})
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {shownFallers.map((p) => (
                  <PlayerRow key={p.id} player={p} direction="down" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl border border-dashed py-16 text-center"
            style={{ borderColor: 'rgba(255,255,255,0.12)' }}
          >
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, fontFamily: 'Montserrat, sans-serif' }}>
              Geen verwachte prijswijzigingen vandaag
            </p>
          </div>
        )}

        {/* CTAs */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center',
          justifyContent: 'center', gap: 12, marginTop: 28,
        }}>
          <Link
            href="/prijswijzigingen"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(0,250,97,0.15)', border: '1px solid rgba(0,250,97,0.35)',
              color: '#00FA61', fontSize: 13, fontWeight: 700,
              padding: '10px 20px', borderRadius: 10,
              textDecoration: 'none', fontFamily: 'Montserrat, sans-serif',
            }}
          >
            Alle prijswijzigingen <ArrowRight size={14} />
          </Link>
          <a
            href="https://www.livefpl.net/price-changes"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600,
              padding: '10px 20px', borderRadius: 10,
              textDecoration: 'none', fontFamily: 'Montserrat, sans-serif',
            }}
          >
            Bekijk op LiveFPL ↗
          </a>
        </div>

        {/* Mobiele "alle" link */}
        <div className="text-center mt-5 sm:hidden">
          <Link href="/prijswijzigingen" className="inline-flex items-center gap-1.5 text-primary font-semibold text-sm">
            Alle prijswijzigingen <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}

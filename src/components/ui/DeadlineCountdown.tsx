'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Timer } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GameweekInfo {
  currentGW:    number | null;
  nextGW:       number | null;
  nextDeadline: string | null;
}

interface TimeLeft {
  days:    number;
  hours:   number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcTimeLeft(deadline: string): TimeLeft {
  const totalMs = new Date(deadline).getTime() - Date.now();
  if (totalMs <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
  return {
    days:    Math.floor(totalMs / 86_400_000),
    hours:   Math.floor((totalMs % 86_400_000) / 3_600_000),
    minutes: Math.floor((totalMs % 3_600_000)  / 60_000),
    seconds: Math.floor((totalMs % 60_000)     / 1_000),
    totalMs,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DeadlineCountdown() {
  const [info,     setInfo]     = useState<GameweekInfo | null>(null);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [fetched,  setFetched]  = useState(false);

  // Voorkomt meerdere gelijktijdige cache-busting fetches na een deadline
  const refetchingRef = useRef(false);
  // Voorkomt dat we de refetch elk seconde opnieuw starten
  const deadlinePassedRef = useRef(false);

  // Herlaad deadline data — bustCache=true bij URL-param om CDN-cache te omzeilen
  const loadInfo = useCallback(async (bustCache = false) => {
    if (bustCache && refetchingRef.current) return;
    if (bustCache) refetchingRef.current = true;

    try {
      const url = bustCache
        ? `/api/fpl/events?_t=${Date.now()}`
        : '/api/fpl/events';
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) return; // API niet bereikbaar → bewaar laatste bekende state
      const data: GameweekInfo = await r.json();
      setInfo(data);
    } catch {
      // API niet bereikbaar → bewaar laatste bekende state
    } finally {
      setFetched(true);
      if (bustCache) refetchingRef.current = false;
    }
  }, []);

  // Haal data op bij mount, daarna elke 5 minuten
  useEffect(() => {
    loadInfo();
    const iv = setInterval(() => loadInfo(), 5 * 60 * 1_000);
    return () => clearInterval(iv);
  }, [loadInfo]);

  // Reset de "deadline voorbij"-vlag zodra er een nieuwe deadline binnenkomt
  useEffect(() => {
    deadlinePassedRef.current = false;
  }, [info?.nextDeadline]);

  // Countdown tick — elke seconde
  useEffect(() => {
    if (!info?.nextDeadline) return;

    const tick = () => {
      const tl = calcTimeLeft(info.nextDeadline!);
      setTimeLeft(tl);

      // Deadline net voorbij → herlaad data eenmalig met cache-bust
      if (tl.totalMs <= 0 && !deadlinePassedRef.current) {
        deadlinePassedRef.current = true;
        loadInfo(true);
      }
    };

    tick();
    const iv = setInterval(tick, 1_000);
    return () => clearInterval(iv);
  }, [info, loadInfo]);

  // ── Render ──────────────────────────────────────────────────────────────────

  // Nog niet opgehaald — kort onzichtbaar tijdens initieel laden
  if (!fetched) return null;

  // Seizoen afgelopen: geen toekomstige deadlines meer
  if (!info?.nextDeadline) {
    return (
      <div
        className="flex items-center gap-1.5 select-none"
        style={{
          border:       '1.5px solid rgba(255,255,255,0.12)',
          borderRadius: '8px',
          padding:      '5px 10px',
          background:   'rgba(255,255,255,0.04)',
        }}
      >
        <Timer size={12} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
        <span
          className="text-[11px] font-medium"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          Seizoen afgelopen
        </span>
      </div>
    );
  }

  // Deadline net voorbij en aan het herladen — toon tijdelijk niets (max. enkele seconden)
  if (!timeLeft || timeLeft.totalMs <= 0) return null;

  // ── Urgentie kleuren ────────────────────────────────────────────────────────
  const urgent = timeLeft.totalMs < 3_600_000;   // < 1u  → rood
  const warn   = timeLeft.totalMs < 86_400_000;  // < 24u → oranje
  const color  = urgent ? '#ef4444' : warn ? '#f97316' : 'rgba(255,255,255,0.85)';

  const borderColor = urgent
    ? 'rgba(239,68,68,0.6)'
    : warn
    ? 'rgba(249,115,22,0.6)'
    : 'rgba(0,250,97,0.5)';
  const glowColor = urgent
    ? 'rgba(239,68,68,0.25)'
    : warn
    ? 'rgba(249,115,22,0.25)'
    : 'rgba(0,250,97,0.25)';

  // ── Countdown string ────────────────────────────────────────────────────────
  const parts: string[] = [];
  if (timeLeft.days > 0) parts.push(`${timeLeft.days}d`);
  parts.push(`${timeLeft.hours}u`);
  parts.push(`${timeLeft.minutes}m`);
  if (urgent) parts.push(`${timeLeft.seconds}s`);

  return (
    <div
      className="flex items-center gap-1.5 select-none"
      title={`GW${info.nextGW} deadline: ${new Date(info.nextDeadline).toLocaleString('nl-NL')}`}
      style={{
        border:       `1.5px solid ${borderColor}`,
        borderRadius: '8px',
        padding:      '5px 10px',
        background:   urgent
          ? 'rgba(239,68,68,0.08)'
          : warn
          ? 'rgba(249,115,22,0.08)'
          : 'rgba(0,250,97,0.08)',
        boxShadow: `0 0 8px ${glowColor}`,
      }}
    >
      <Timer size={12} style={{ color, flexShrink: 0 }} />

      {/* GW label */}
      <span className="text-[10px] font-medium text-white/45">
        GW{info.nextGW}
      </span>
      <span className="text-white/20 text-[10px]">·</span>

      {/* Countdown */}
      <span className="text-xs font-bold tabular-nums" style={{ color }}>
        {parts.join(' ')}
      </span>
    </div>
  );
}

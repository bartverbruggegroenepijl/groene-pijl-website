'use client';

import { useState, useEffect } from 'react';
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

  // Fetch next gameweek info once on mount
  useEffect(() => {
    fetch('/api/fpl/events')
      .then((r) => r.ok ? r.json() : null)
      .then((data: GameweekInfo | null) => { if (data) setInfo(data); })
      .catch(() => {});
  }, []);

  // Tick every second once we have a deadline
  useEffect(() => {
    if (!info?.nextDeadline) return;
    setTimeLeft(calcTimeLeft(info.nextDeadline));
    const iv = setInterval(
      () => setTimeLeft(calcTimeLeft(info.nextDeadline!)),
      1_000
    );
    return () => clearInterval(iv);
  }, [info]);

  // Nothing to show yet
  if (!info?.nextGW || !timeLeft || timeLeft.totalMs <= 0) return null;

  // Urgency colour
  const urgent = timeLeft.totalMs < 3_600_000;      // < 1 h  → red
  const warn   = timeLeft.totalMs < 86_400_000;     // < 24 h → orange
  const color  = urgent ? '#ef4444' : warn ? '#f97316' : 'rgba(255,255,255,0.85)';

  // Desktop string: include days when ≥ 1 day
  const desktopParts: string[] = [];
  if (timeLeft.days > 0)          desktopParts.push(`${timeLeft.days}d`);
  desktopParts.push(`${timeLeft.hours}u`);
  desktopParts.push(`${timeLeft.minutes}m`);
  if (urgent)                     desktopParts.push(`${timeLeft.seconds}s`);

  return (
    <div
      className="flex items-center gap-1.5 select-none"
      title={`GW${info.nextGW} deadline: ${new Date(info.nextDeadline!).toLocaleString('nl-NL')}`}
    >
      <Timer size={13} style={{ color, flexShrink: 0 }} />

      {/* GW label — desktop */}
      <span className="hidden sm:inline text-[11px] font-medium text-white/45">
        GW{info.nextGW}
      </span>
      <span className="hidden sm:inline text-white/20 text-[11px]">·</span>

      {/* Full countdown — desktop */}
      <span
        className="hidden sm:inline text-xs font-bold tabular-nums"
        style={{ color }}
      >
        {desktopParts.join(' ')}
      </span>

      {/* Compact — mobile (hours + minutes only) */}
      <span
        className="sm:hidden text-xs font-bold tabular-nums"
        style={{ color }}
      >
        {timeLeft.hours}u {timeLeft.minutes}m
      </span>
    </div>
  );
}

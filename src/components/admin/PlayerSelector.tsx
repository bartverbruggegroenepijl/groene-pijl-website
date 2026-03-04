'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import type { FplPlayer } from '@/types';

const POSITION_LABELS: Record<string, string> = {
  GK:  'keeper',
  DEF: 'verdediger',
  MID: 'middenvelder',
  FWD: 'aanvaller',
};

// ── Small circular FPL photo with fallback to initials ────────────────────────
function PlayerPhoto({ imageUrl, name, size = 28 }: { imageUrl: string | null; name: string; size?: number }) {
  const [errored, setErrored] = useState(false);

  if (!imageUrl || errored) {
    return (
      <div
        className="rounded-full bg-white/8 flex items-center justify-center flex-shrink-0 text-gray-400 font-bold"
        style={{ width: size, height: size, fontSize: size * 0.38 }}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt={name}
      width={size}
      height={size}
      onError={() => setErrored(true)}
      className="rounded-full object-cover flex-shrink-0"
      style={{ width: size, height: size, objectFit: 'cover', objectPosition: 'top center' }}
    />
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface PlayerSelectorProps {
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  players: FplPlayer[];
  selected: FplPlayer | null;
  onSelect: (player: FplPlayer | null) => void;
  disabled?: boolean;
  /** Override the position-based placeholder/empty text */
  label?: string;
}

export default function PlayerSelector({
  position,
  players,
  selected,
  onSelect,
  disabled,
  label,
}: PlayerSelectorProps) {
  const posLabel = label ?? POSITION_LABELS[position] ?? 'speler';
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = players
    .filter((p) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.fullName.toLowerCase().includes(q) ||
        p.team.toLowerCase().includes(q)
      );
    })
    .slice(0, 30);

  // ── Selected state ─────────────────────────────────────────
  if (selected) {
    return (
      <div className="flex items-center gap-2 flex-1 bg-[#111111] border border-white/15
                      rounded-lg px-3 py-2 min-w-0">
        {/* FPL foto thumbnail */}
        <PlayerPhoto imageUrl={selected.imageUrl} name={selected.name} size={28} />

        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{selected.name}</p>
          <p className="text-gray-500 text-xs">{selected.team}</p>
        </div>
        <span className="text-gray-600 text-xs flex-shrink-0">{selected.totalPoints}p</span>
        {!disabled && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-gray-600 hover:text-white transition-colors flex-shrink-0 ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  // ── Search / dropdown state ────────────────────────────────
  return (
    <div ref={containerRef} className="relative flex-1">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5
                           text-gray-600 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder={`Zoek ${posLabel}...`}
          disabled={disabled}
          className="w-full bg-[#111111] border border-white/10 text-white
                     placeholder-gray-600 rounded-lg pl-8 pr-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-[#00A651]
                     focus:border-transparent transition-all"
        />
      </div>

      {isOpen && (
        <ul className="absolute z-50 w-full mt-1 bg-[#1f1f1f] border border-white/15
                       rounded-lg shadow-2xl max-h-52 overflow-y-auto">
          {filtered.length === 0 ? (
            <li className="px-3 py-2.5 text-gray-600 text-sm">
              Geen {posLabel}s gevonden
            </li>
          ) : (
            filtered.map((p) => (
              <li
                key={p.id}
                onMouseDown={() => {
                  onSelect(p);
                  setSearch('');
                  setIsOpen(false);
                }}
                className="flex items-center gap-2.5 px-3 py-2 text-sm
                           hover:bg-white/8 cursor-pointer transition-colors"
              >
                {/* Kleine foto naast naam in de dropdown */}
                <PlayerPhoto imageUrl={p.imageUrl} name={p.name} size={24} />

                <div className="min-w-0 flex-1">
                  <span className="text-white font-medium">{p.name}</span>
                  <span className="text-gray-500 ml-2 text-xs">{p.team}</span>
                </div>
                <span className="text-gray-600 text-xs flex-shrink-0 ml-2">
                  {p.totalPoints}p
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

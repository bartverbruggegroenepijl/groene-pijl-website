'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Star, AlertCircle } from 'lucide-react';
import PlayerSelector from '@/components/admin/PlayerSelector';
import PlayerImageUpload from '@/components/admin/PlayerImageUpload';
import type { FplPlayer, TeamOfTheWeek, TeamPlayer } from '@/types';

// ─── Formaties ───────────────────────────────────────────────

const FORMATIONS: Record<string, { GK: number; DEF: number; MID: number; FWD: number }> = {
  '4-3-3': { GK: 1, DEF: 4, MID: 3, FWD: 3 },
  '4-4-2': { GK: 1, DEF: 4, MID: 4, FWD: 2 },
  '3-5-2': { GK: 1, DEF: 3, MID: 5, FWD: 2 },
  '5-3-2': { GK: 1, DEF: 5, MID: 3, FWD: 2 },
  '3-4-3': { GK: 1, DEF: 3, MID: 4, FWD: 3 },
};

const POSITIONS = ['GK', 'DEF', 'MID', 'FWD'] as const;
type Position = (typeof POSITIONS)[number];

const POSITION_LABELS: Record<Position, string> = {
  GK:  'Keeper',
  DEF: 'Verdedigers',
  MID: 'Middenvelders',
  FWD: 'Aanvallers',
};

const POSITION_COLORS: Record<Position, string> = {
  GK:  'bg-yellow-500/20 text-yellow-400',
  DEF: 'bg-blue-500/20 text-blue-400',
  MID: 'bg-[#00A651]/20 text-[#00A651]',
  FWD: 'bg-red-500/20 text-red-400',
};

// ─── Slot state ───────────────────────────────────────────────

interface SlotState {
  position: Position;
  index: number;
  player: FplPlayer | null;
  points: string;
  isCaptain: boolean;
  customImageUrl: string | null;
}

function buildSlots(formation: string, existing: SlotState[] = []): SlotState[] {
  const config = FORMATIONS[formation] ?? FORMATIONS['4-3-3'];
  const slots: SlotState[] = [];

  for (const pos of POSITIONS) {
    const count = config[pos];
    const existingForPos = existing.filter((s) => s.position === pos);
    for (let i = 0; i < count; i++) {
      slots.push(
        existingForPos[i]
          ? { ...existingForPos[i], index: i }
          : { position: pos, index: i, player: null, points: '', isCaptain: false, customImageUrl: null }
      );
    }
  }
  return slots;
}

// ─── Props ───────────────────────────────────────────────────

interface TeamBuilderProps {
  existingTeam?: TeamOfTheWeek;
  existingPlayers?: TeamPlayer[];
  action: (formData: FormData) => Promise<void>;
  mode: 'nieuw' | 'bewerken';
}

// ─── Component ───────────────────────────────────────────────

export default function TeamBuilder({
  existingTeam,
  existingPlayers,
  action,
  mode,
}: TeamBuilderProps) {
  const defaultFormation = existingTeam?.formation ?? '4-3-3';

  const [fplPlayers, setFplPlayers]   = useState<FplPlayer[]>([]);
  const [fplLoading, setFplLoading]   = useState(true);
  const [fplError, setFplError]       = useState('');
  const [weekNumber, setWeekNumber]   = useState(existingTeam?.week_number?.toString() ?? '');
  const [season, setSeason]           = useState(existingTeam?.season ?? '2025-26');
  const [formation, setFormation]     = useState(defaultFormation);
  const [published, setPublished]     = useState(existingTeam?.published ?? false);
  const [slots, setSlots]             = useState<SlotState[]>(() => buildSlots(defaultFormation));
  const [formError, setFormError]     = useState('');
  const [isPending, startTransition]  = useTransition();

  // ── Fetch FPL players ──────────────────────────────────────
  useEffect(() => {
    fetch('/api/fpl/players')
      .then((r) => r.json())
      .then((data: { players?: FplPlayer[]; error?: string }) => {
        if (data.error) throw new Error(data.error);
        const players = data.players ?? [];
        setFplPlayers(players);

        // Pre-populate slots when editing
        if (existingPlayers && existingPlayers.length > 0) {
          const byPos: Partial<Record<Position, TeamPlayer[]>> = {};
          existingPlayers.forEach((p) => {
            const pos = (p.position ?? 'GK') as Position;
            if (!byPos[pos]) byPos[pos] = [];
            byPos[pos]!.push(p);
          });

          setSlots((prev) =>
            prev.map((slot) => {
              const posPlayers = byPos[slot.position] ?? [];
              const dbP = posPlayers[slot.index];
              if (!dbP) return slot;

              // Try to find matching FPL player by web_name + position
              const fplMatch =
                players.find(
                  (fp) =>
                    fp.name === dbP.player_name &&
                    fp.position === slot.position
                ) ??
                players.find((fp) => fp.name === dbP.player_name) ??
                null;

              return {
                ...slot,
                player: fplMatch,
                points: dbP.points?.toString() ?? '',
                isCaptain: dbP.is_captain,
                customImageUrl: dbP.player_image_url ?? null,
              };
            })
          );
        }
      })
      .catch((err: Error) => setFplError(err.message))
      .finally(() => setFplLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Formation change ───────────────────────────────────────
  function handleFormationChange(newFormation: string) {
    setFormation(newFormation);
    setSlots((prev) => buildSlots(newFormation, prev));
  }

  // ── Slot helpers ───────────────────────────────────────────
  function updateSlot(pos: Position, index: number, updates: Partial<SlotState>) {
    setSlots((prev) =>
      prev.map((s) => (s.position === pos && s.index === index ? { ...s, ...updates } : s))
    );
  }

  function setCaptain(pos: Position, index: number) {
    setSlots((prev) =>
      prev.map((s) => ({
        ...s,
        isCaptain: s.position === pos && s.index === index,
      }))
    );
  }

  // ── Submit ─────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError('');

    if (!weekNumber.trim()) {
      setFormError('Gameweek nummer is verplicht.');
      return;
    }

    const playersData = slots
      .filter((s) => s.player !== null)
      .map((s) => ({
        player_name:      s.player!.name,
        player_club:      s.player!.team,
        position:         s.position,
        points:           parseInt(s.points, 10) || 0,
        is_captain:       s.isCaptain,
        player_image_url: s.customImageUrl ?? s.player!.imageUrl,
      }));

    const formData = new FormData(e.currentTarget);
    formData.set('players',   JSON.stringify(playersData));
    formData.set('published', published ? 'true' : 'false');

    startTransition(async () => {
      try {
        await action(formData);
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Er is een fout opgetreden.');
      }
    });
  }

  const filledCount  = slots.filter((s) => s.player !== null).length;
  const totalSlots   = slots.length;

  // ── Render ─────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/team-van-de-week"
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Terug
          </Link>
          <div>
            <h1
              className="text-white"
              style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem', letterSpacing: '0.05em' }}
            >
              {mode === 'nieuw' ? 'Nieuw Team vd Week' : 'Team Bewerken'}
            </h1>
            <p className="text-gray-500 text-sm">
              {filledCount}/{totalSlots} spelers geselecteerd
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-[#00A651] hover:bg-[#009147]
                     text-white font-semibold px-5 py-2.5 rounded-lg text-sm
                     transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isPending ? 'Opslaan...' : 'Opslaan'}
        </button>
      </div>

      {/* Foutmelding */}
      {formError && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30
                        rounded-lg px-4 py-3 mb-6 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {formError}
        </div>
      )}

      {/* Configuratie */}
      <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-5 mb-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
          Instellingen
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          {/* Gameweek */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Gameweek *
            </label>
            <input
              name="week_number"
              type="number"
              min="1"
              max="38"
              value={weekNumber}
              onChange={(e) => setWeekNumber(e.target.value)}
              placeholder="28"
              className="w-full bg-[#111111] border border-white/10 text-white
                         placeholder-gray-600 rounded-lg px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#00A651]
                         focus:border-transparent transition-all"
            />
          </div>

          {/* Seizoen */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Seizoen
            </label>
            <input
              name="season"
              type="text"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              placeholder="2025-26"
              className="w-full bg-[#111111] border border-white/10 text-white
                         placeholder-gray-600 rounded-lg px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#00A651]
                         focus:border-transparent transition-all"
            />
          </div>

          {/* Formatie */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Formatie
            </label>
            <select
              name="formation"
              value={formation}
              onChange={(e) => handleFormationChange(e.target.value)}
              className="w-full bg-[#111111] border border-white/10 text-white
                         rounded-lg px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#00A651]
                         focus:border-transparent transition-all cursor-pointer"
            >
              {Object.keys(FORMATIONS).map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Status
            </label>
            <input type="hidden" name="published" value={published ? 'true' : 'false'} />
            <button
              type="button"
              onClick={() => setPublished(!published)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg
                          border text-sm font-medium transition-all duration-200
                          ${published
                            ? 'bg-[#00A651]/15 border-[#00A651]/40 text-[#00A651]'
                            : 'bg-white/5 border-white/10 text-gray-400'
                          }`}
            >
              <span>{published ? 'Gepubliceerd' : 'Concept'}</span>
              <div className={`w-9 h-4.5 rounded-full transition-colors relative flex-shrink-0
                               ${published ? 'bg-[#00A651]' : 'bg-gray-700'}`}
                   style={{ width: '2rem', height: '1.1rem' }}
              >
                <div
                  className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow
                               transition-transform duration-200
                               ${published ? 'translate-x-3.5' : 'translate-x-0.5'}`}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* FPL Loading */}
      {fplLoading && (
        <div className="flex items-center gap-3 bg-[#1a1a1a] border border-white/8
                        rounded-xl p-6 mb-4">
          <Loader2 className="w-5 h-5 text-[#00A651] animate-spin flex-shrink-0" />
          <div>
            <p className="text-white text-sm font-medium">FPL spelersdata laden...</p>
            <p className="text-gray-500 text-xs mt-0.5">
              Data van de Premier League API ophalen
            </p>
          </div>
        </div>
      )}

      {/* FPL Error */}
      {fplError && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30
                        rounded-xl p-5 mb-4">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 text-sm font-medium">FPL API fout</p>
            <p className="text-gray-500 text-xs mt-0.5">{fplError}</p>
            <p className="text-gray-600 text-xs mt-1">
              Ververs de pagina om opnieuw te proberen.
            </p>
          </div>
        </div>
      )}

      {/* Speler slots per positie */}
      {!fplLoading && !fplError && (
        <div className="space-y-4">

          {/* Tip */}
          <div className="flex items-center gap-2 text-xs text-gray-600 px-1">
            <Star className="w-3.5 h-3.5 text-[#00A651]" />
            <span>Klik op de ster om de aanvoerder aan te duiden. Punten zijn optioneel.</span>
          </div>

          {POSITIONS.map((pos) => {
            const posSlots  = slots.filter((s) => s.position === pos);
            const posPlayers = fplPlayers.filter((p) => p.position === pos);

            return (
              <div
                key={pos}
                className="bg-[#1a1a1a] border border-white/8 rounded-xl p-5"
              >
                {/* Positie header */}
                <div className="flex items-center gap-2.5 mb-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded uppercase
                                   tracking-wider ${POSITION_COLORS[pos]}`}>
                    {pos}
                  </span>
                  <p className="text-white font-medium text-sm">
                    {POSITION_LABELS[pos]}
                  </p>
                  <span className="text-gray-600 text-xs">
                    ({posSlots.filter((s) => s.player).length}/{posSlots.length})
                  </span>
                </div>

                {/* Speler rijen */}
                <div className="space-y-2.5">
                  {posSlots.map((slot) => (
                    <div
                      key={`${slot.position}-${slot.index}`}
                      className="flex items-center gap-3"
                    >
                      {/* Nummer */}
                      <span className="text-gray-700 text-xs w-4 text-center flex-shrink-0">
                        {slot.index + 1}
                      </span>

                      {/* Player selector */}
                      <PlayerSelector
                        position={slot.position}
                        players={posPlayers}
                        selected={slot.player}
                        onSelect={(player) =>
                          updateSlot(slot.position, slot.index, {
                            player,
                            isCaptain: slot.isCaptain && player !== null,
                          })
                        }
                      />

                      {/* Punten */}
                      <div className="flex-shrink-0 w-16">
                        <input
                          type="number"
                          min="0"
                          max="99"
                          value={slot.points}
                          onChange={(e) =>
                            updateSlot(slot.position, slot.index, { points: e.target.value })
                          }
                          placeholder="Pts"
                          disabled={!slot.player}
                          className="w-full bg-[#111111] border border-white/10 text-white
                                     placeholder-gray-600 rounded-lg px-2 py-2 text-sm text-center
                                     focus:outline-none focus:ring-2 focus:ring-[#00A651]
                                     focus:border-transparent transition-all
                                     disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* Aanvoerder knop */}
                      <button
                        type="button"
                        onClick={() => setCaptain(slot.position, slot.index)}
                        disabled={!slot.player}
                        title={slot.isCaptain ? 'Aanvoerder' : 'Aanvoerder maken'}
                        className={`flex-shrink-0 p-2 rounded-lg transition-all
                                    disabled:opacity-25 disabled:cursor-not-allowed
                                    ${slot.isCaptain
                                      ? 'bg-[#00A651]/20 text-[#00A651]'
                                      : 'text-gray-600 hover:text-gray-300 hover:bg-white/5'
                                    }`}
                      >
                        <Star
                          className={`w-4 h-4 transition-all ${slot.isCaptain ? 'fill-current' : ''}`}
                        />
                      </button>

                      {/* Foto upload */}
                      <div className="relative">
                        <PlayerImageUpload
                          value={slot.customImageUrl}
                          onChange={(url) =>
                            updateSlot(slot.position, slot.index, { customImageUrl: url })
                          }
                          playerName={slot.player?.name ?? `${slot.position}-${slot.index + 1}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Voortgang samenvatting */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-4
                          flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-full bg-gray-800 rounded-full h-1.5 w-32">
                <div
                  className="bg-[#00A651] h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(filledCount / totalSlots) * 100}%` }}
                />
              </div>
              <span className="text-gray-400 text-sm">
                {filledCount}/{totalSlots} spelers geselecteerd
              </span>
            </div>
            {slots.some((s) => s.isCaptain) ? (
              <span className="flex items-center gap-1.5 text-[#00A651] text-xs">
                <Star className="w-3.5 h-3.5 fill-current" />
                Aanvoerder gekozen
              </span>
            ) : (
              <span className="text-gray-600 text-xs">Geen aanvoerder gekozen</span>
            )}
          </div>
        </div>
      )}
    </form>
  );
}

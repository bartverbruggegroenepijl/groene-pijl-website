'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, AlertCircle, Star } from 'lucide-react';
import PlayerSelector from '@/components/admin/PlayerSelector';
import PlayerImageUpload from '@/components/admin/PlayerImageUpload';
import type { FplPlayer, CaptainPick, CaptainPickPlayer } from '@/types';

// ─── Rank config ─────────────────────────────────────────────

const RANKS = [
  { rank: 1, label: 'Goud',   emoji: '🥇', color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30' },
  { rank: 2, label: 'Zilver', emoji: '🥈', color: 'text-gray-300',   bg: 'bg-gray-500/15 border-gray-500/30' },
  { rank: 3, label: 'Brons',  emoji: '🥉', color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30' },
];

// ─── Slot state ───────────────────────────────────────────────

interface SlotState {
  rank: number;
  player: FplPlayer | null;
  motivation: string;
  imageUrl: string | null;
}

function buildSlots(): SlotState[] {
  return RANKS.map(({ rank }) => ({
    rank,
    player: null,
    motivation: '',
    imageUrl: null,
  }));
}

// ─── Props ────────────────────────────────────────────────────

interface CaptainPickBuilderProps {
  action: (formData: FormData) => Promise<void>;
  mode: 'nieuw' | 'bewerken';
  existingPick?: CaptainPick;
  existingPlayers?: CaptainPickPlayer[];
}

// ─── Component ────────────────────────────────────────────────

export default function CaptainPickBuilder({ action, mode, existingPick, existingPlayers }: CaptainPickBuilderProps) {
  const [fplPlayers, setFplPlayers]   = useState<FplPlayer[]>([]);
  const [fplLoading, setFplLoading]   = useState(true);
  const [fplError, setFplError]       = useState('');
  const [gameweek, setGameweek]       = useState(existingPick?.gameweek?.toString() ?? '');
  const [season, setSeason]           = useState(existingPick?.season ?? '2024-25');
  const [published, setPublished]     = useState(existingPick?.published ?? false);
  const [slots, setSlots]             = useState<SlotState[]>(buildSlots);
  const [formError, setFormError]     = useState('');
  const [isPending, startTransition]  = useTransition();

  // Fetch FPL players
  useEffect(() => {
    fetch('/api/fpl/players')
      .then((r) => r.json())
      .then((data: { players?: FplPlayer[]; error?: string }) => {
        if (data.error) throw new Error(data.error);
        setFplPlayers(data.players ?? []);
      })
      .catch((err: Error) => setFplError(err.message))
      .finally(() => setFplLoading(false));
  }, []);

  // Pre-populate slots from existing data (runs after FPL players load)
  useEffect(() => {
    if (fplLoading || !existingPlayers || existingPlayers.length === 0) return;

    setSlots((prev) =>
      prev.map((slot) => {
        const p = existingPlayers.find((ep) => ep.rank === slot.rank);
        if (!p) return slot;

        const fplPlayer = p.fpl_player_id
          ? (fplPlayers.find((fp) => fp.id === p.fpl_player_id) ?? null)
          : null;

        const player: FplPlayer | null = fplPlayer ?? (p.player_name
          ? {
              id: p.fpl_player_id ?? 0,
              code: 0,
              name: p.player_name ?? '',
              fullName: p.player_name ?? '',
              team: p.player_club ?? '',
              teamId: 0,
              position: (p.position as FplPlayer['position']) ?? 'MID',
              totalPoints: 0,
              eventPoints: 0,
              price: 0,
              imageUrl: '',
            }
          : null);

        return {
          ...slot,
          player,
          motivation: p.motivation ?? '',
          imageUrl: p.image_url ?? null,
        };
      })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fplLoading, fplPlayers]);

  function updateSlot(rank: number, updates: Partial<SlotState>) {
    setSlots((prev) =>
      prev.map((s) => (s.rank === rank ? { ...s, ...updates } : s))
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError('');

    if (!gameweek.trim()) {
      setFormError('Gameweek nummer is verplicht.');
      return;
    }

    const unfilledRanks = slots.filter((s) => s.player === null);
    if (unfilledRanks.length > 0) {
      const labels = unfilledRanks
        .map((s) => RANKS.find((r) => r.rank === s.rank)?.label)
        .join(', ');
      setFormError(`Selecteer een speler voor: ${labels}.`);
      return;
    }

    const playersData = slots.map((s) => ({
      rank:          s.rank,
      player_name:   s.player!.name,
      player_club:   s.player!.team,
      position:      s.player!.position,
      motivation:    s.motivation,
      fpl_player_id: s.player!.id,
      image_url:     s.imageUrl ?? null,
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

  const filledCount = slots.filter((s) => s.player !== null).length;

  return (
    <form onSubmit={handleSubmit} style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/captain-keuze"
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
              {mode === 'nieuw' ? 'Nieuwe Captain Keuze' : 'Captain Keuze Bewerken'}
            </h1>
            <p className="text-gray-500 text-sm">
              {filledCount}/3 captains geselecteerd
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

      {/* Instellingen */}
      <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-5 mb-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
          Instellingen
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

          {/* Gameweek */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Gameweek *
            </label>
            <input
              name="gameweek"
              type="number"
              min="1"
              max="38"
              value={gameweek}
              onChange={(e) => setGameweek(e.target.value)}
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
              placeholder="2024-25"
              className="w-full bg-[#111111] border border-white/10 text-white
                         placeholder-gray-600 rounded-lg px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#00A651]
                         focus:border-transparent transition-all"
            />
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
              <div
                className={`relative rounded-full transition-colors flex-shrink-0
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
            <p className="text-gray-500 text-xs mt-0.5">Data van de Premier League API ophalen</p>
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
          </div>
        </div>
      )}

      {/* Captain slots */}
      {!fplLoading && !fplError && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-gray-600 px-1">
            <Star className="w-3.5 h-3.5 text-yellow-500" />
            <span>Selecteer precies 3 captains in volgorde van voorkeur.</span>
          </div>

          {RANKS.map(({ rank, label, emoji, bg }) => {
            const slot = slots.find((s) => s.rank === rank)!;

            return (
              <div key={rank} className={`bg-[#1a1a1a] border rounded-xl p-5 ${
                slot.player ? bg : 'border-white/8'
              }`}>
                {/* Rank header */}
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="text-2xl leading-none">{emoji}</span>
                  <div>
                    <p className="text-white font-semibold text-sm">{label}</p>
                    <p className="text-gray-600 text-xs">
                      {rank === 1 ? '1e keuze captain' : rank === 2 ? '2e keuze captain' : '3e keuze captain'}
                    </p>
                  </div>
                </div>

                {/* Speler rij */}
                <div className="flex items-center gap-3">
                  <PlayerSelector
                    position="FWD"
                    label="speler"
                    players={fplPlayers}
                    selected={slot.player}
                    onSelect={(player) => updateSlot(rank, { player })}
                  />

                  {/* Positie badge */}
                  {slot.player && (
                    <span className="flex-shrink-0 text-xs text-gray-400 font-mono bg-white/5
                                     border border-white/10 rounded-md px-2 py-1.5">
                      {slot.player.position}
                    </span>
                  )}

                  {/* Image upload */}
                  <div className="relative">
                    <PlayerImageUpload
                      value={slot.imageUrl}
                      onChange={(url) => updateSlot(rank, { imageUrl: url })}
                      playerName={slot.player?.name ?? `captain-${rank}`}
                    />
                  </div>
                </div>

                {/* Motivatie */}
                {slot.player && (
                  <div className="mt-3">
                    <textarea
                      value={slot.motivation}
                      onChange={(e) => updateSlot(rank, { motivation: e.target.value })}
                      placeholder={`Waarom ${slot.player.name} als captain? Voeg een motivatie toe...`}
                      rows={2}
                      className="w-full bg-[#111111] border border-white/10 text-white
                                 placeholder-gray-600 rounded-lg px-3 py-2 text-sm
                                 focus:outline-none focus:ring-2 focus:ring-[#00A651]
                                 focus:border-transparent transition-all resize-none"
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* Voortgang */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-4
                          flex items-center gap-3">
            <div className="flex-1 bg-gray-800 rounded-full h-1.5">
              <div
                className="bg-[#00A651] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(filledCount / 3) * 100}%` }}
              />
            </div>
            <span className="text-gray-400 text-sm flex-shrink-0">
              {filledCount}/3 geselecteerd
            </span>
          </div>
        </div>
      )}
    </form>
  );
}

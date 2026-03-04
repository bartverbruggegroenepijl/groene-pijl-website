'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, AlertCircle, TrendingUp } from 'lucide-react';
import PlayerSelector from '@/components/admin/PlayerSelector';
import PlayerImageUpload from '@/components/admin/PlayerImageUpload';
import type { FplPlayer, BuyTip, BuyTipPlayer } from '@/types';

// ─── Slot state ───────────────────────────────────────────────

interface SlotState {
  index: number;
  player: FplPlayer | null;
  motivation: string;
  imageUrl: string | null;
}

function buildSlots(): SlotState[] {
  return Array.from({ length: 5 }, (_, i) => ({
    index: i,
    player: null,
    motivation: '',
    imageUrl: null,
  }));
}

// ─── Props ────────────────────────────────────────────────────

interface BuyTipBuilderProps {
  action: (formData: FormData) => Promise<void>;
  mode: 'nieuw' | 'bewerken';
  existingTip?: BuyTip;
  existingPlayers?: BuyTipPlayer[];
}

// ─── Component ────────────────────────────────────────────────

export default function BuyTipBuilder({ action, mode, existingTip, existingPlayers }: BuyTipBuilderProps) {
  const [fplPlayers, setFplPlayers]   = useState<FplPlayer[]>([]);
  const [fplLoading, setFplLoading]   = useState(true);
  const [fplError, setFplError]       = useState('');
  const [gameweek, setGameweek]       = useState(existingTip?.gameweek?.toString() ?? '');
  const [season, setSeason]           = useState(existingTip?.season ?? '2025-26');
  const [published, setPublished]     = useState(existingTip?.published ?? false);
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
      prev.map((slot, i) => {
        const p = existingPlayers[i];
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
              position: (p.position as FplPlayer['position']) ?? 'FWD',
              totalPoints: 0,
              eventPoints: 0,
              price: p.price ?? 0,
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

  function updateSlot(index: number, updates: Partial<SlotState>) {
    setSlots((prev) =>
      prev.map((s) => (s.index === index ? { ...s, ...updates } : s))
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError('');

    if (!gameweek.trim()) {
      setFormError('Gameweek nummer is verplicht.');
      return;
    }

    const filledSlots = slots.filter((s) => s.player !== null);
    if (filledSlots.length === 0) {
      setFormError('Voeg minimaal 1 speler toe.');
      return;
    }

    const playersData = filledSlots.map((s) => ({
      player_name:   s.player!.name,
      player_club:   s.player!.team,
      position:      s.player!.position,
      price:         s.player!.price,
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
            href="/admin/kooptips"
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
              {mode === 'nieuw' ? 'Nieuwe Kooptips' : 'Kooptips Bewerken'}
            </h1>
            <p className="text-gray-500 text-sm">
              {filledCount}/5 spelers toegevoegd
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
              placeholder="2025-26"
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

      {/* Speler slots */}
      {!fplLoading && !fplError && (
        <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-5">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-7 h-7 rounded-lg bg-[#00A651]/15 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-3.5 h-3.5 text-[#00A651]" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">Aanbevolen spelers</p>
              <p className="text-gray-600 text-xs">Maximaal 5 spelers · Alle posities</p>
            </div>
          </div>

          <div className="space-y-5">
            {slots.map((slot) => (
              <div key={slot.index} className="space-y-2">

                {/* Speler rij */}
                <div className="flex items-center gap-3">
                  {/* Nummer */}
                  <span className="text-gray-700 text-xs w-4 text-center flex-shrink-0">
                    {slot.index + 1}
                  </span>

                  {/* Player selector – all positions */}
                  <PlayerSelector
                    position="FWD"
                    label="speler"
                    players={fplPlayers}
                    selected={slot.player}
                    onSelect={(player) =>
                      updateSlot(slot.index, {
                        player,
                        // Auto-fill FPL photo; preserve manual upload if already set
                        imageUrl: slot.imageUrl ?? (player?.imageUrl || null),
                      })
                    }
                  />

                  {/* Prijs badge */}
                  {slot.player && (
                    <span className="flex-shrink-0 text-xs text-gray-400 font-mono bg-white/5
                                     border border-white/10 rounded-md px-2 py-1.5 min-w-[3.5rem] text-center">
                      £{slot.player.price.toFixed(1)}m
                    </span>
                  )}

                  {/* Image upload */}
                  <div className="relative">
                    <PlayerImageUpload
                      value={slot.imageUrl}
                      onChange={(url) => updateSlot(slot.index, { imageUrl: url })}
                      playerName={slot.player?.name ?? `speler-${slot.index + 1}`}
                    />
                  </div>
                </div>

                {/* Motivatie */}
                {slot.player && (
                  <div className="ml-7">
                    <textarea
                      value={slot.motivation}
                      onChange={(e) => updateSlot(slot.index, { motivation: e.target.value })}
                      placeholder={`Waarom ${slot.player.name}? Voeg een korte motivatie toe...`}
                      rows={2}
                      className="w-full bg-[#111111] border border-white/10 text-white
                                 placeholder-gray-600 rounded-lg px-3 py-2 text-sm
                                 focus:outline-none focus:ring-2 focus:ring-[#00A651]
                                 focus:border-transparent transition-all resize-none"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Voortgang */}
          <div className="mt-5 pt-4 border-t border-white/5 flex items-center gap-3">
            <div className="flex-1 bg-gray-800 rounded-full h-1.5">
              <div
                className="bg-[#00A651] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(filledCount / 5) * 100}%` }}
              />
            </div>
            <span className="text-gray-500 text-xs flex-shrink-0">
              {filledCount}/5 spelers
            </span>
          </div>
        </div>
      )}
    </form>
  );
}

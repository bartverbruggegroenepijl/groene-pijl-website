'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, AlertCircle, User } from 'lucide-react';
import PlayerSelector from '@/components/admin/PlayerSelector';
import PlayerImageUpload from '@/components/admin/PlayerImageUpload';
import type { FplPlayer } from '@/types';

// ─── Input helpers ────────────────────────────────────────────

const inputClass =
  'w-full bg-[#111111] border border-white/10 text-white placeholder-gray-600 ' +
  'rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ' +
  'focus:ring-[#00A651] focus:border-transparent transition-all';

const labelClass = 'block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5';

// ─── Props ────────────────────────────────────────────────────

interface PlayerOfWeekFormProps {
  action: (formData: FormData) => Promise<void>;
}

// ─── Component ────────────────────────────────────────────────

export default function PlayerOfWeekForm({ action }: PlayerOfWeekFormProps) {
  const [fplPlayers, setFplPlayers]  = useState<FplPlayer[]>([]);
  const [fplLoading, setFplLoading]  = useState(true);
  const [fplError, setFplError]      = useState('');

  const [gameweek,    setGameweek]   = useState('');
  const [season,      setSeason]     = useState('2025-26');
  const [player,      setPlayer]     = useState<FplPlayer | null>(null);
  const [playerName,  setPlayerName] = useState('');
  const [playerClub,  setPlayerClub] = useState('');
  const [position,    setPosition]   = useState('');
  const [points,      setPoints]     = useState('');
  const [goals,       setGoals]      = useState('');
  const [assists,     setAssists]    = useState('');
  const [bonus,       setBonus]      = useState('');
  const [motivatie,   setMotivatie]  = useState('');
  const [imageUrl,    setImageUrl]   = useState<string | null>(null);
  const [published,   setPublished]  = useState(false);
  const [formError,   setFormError]  = useState('');
  const [isPending,   startTransition] = useTransition();

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

  // Auto-fill from FPL player selection
  useEffect(() => {
    if (player) {
      setPlayerName(player.name);
      setPlayerClub(player.team);
      setPosition(player.position);
      // Auto-fill FPL photo URL — user can still override with manual upload
      setImageUrl((prev) => prev ?? (player.imageUrl || null));
    }
  }, [player]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError('');

    const name = player?.name || playerName;
    if (!name.trim()) {
      setFormError('Spelernaam is verplicht.');
      return;
    }

    const formData = new FormData();
    formData.set('gameweek',    gameweek);
    formData.set('season',      season);
    formData.set('player_name', name);
    formData.set('player_club', player?.team || playerClub);
    formData.set('position',    player?.position || position);
    formData.set('points',      points);
    formData.set('goals',       goals);
    formData.set('assists',     assists);
    formData.set('bonus',       bonus);
    formData.set('motivatie',   motivatie);
    formData.set('image_url',   imageUrl ?? '');
    formData.set('published',   published ? 'true' : 'false');

    startTransition(async () => {
      try {
        await action(formData);
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Er is een fout opgetreden.');
      }
    });
  }

  const displayName = player?.name || playerName || 'Speler';

  return (
    <form onSubmit={handleSubmit} style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/speler-van-de-week"
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
              Nieuwe Speler van de Week
            </h1>
            <p className="text-gray-500 text-sm">Kies een speler en vul de stats in.</p>
          </div>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-[#00A651] hover:bg-[#009147] text-white
                     font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors
                     disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isPending ? 'Opslaan...' : 'Opslaan'}
        </button>
      </div>

      {/* ── Foutmelding ── */}
      {formError && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30
                        rounded-lg px-4 py-3 mb-6 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {formError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Linker kolom ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Speler zoeken */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-5">
            <label className={labelClass}>Speler zoeken via FPL</label>

            {fplLoading ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
                <Loader2 className="w-4 h-4 animate-spin" />Spelers laden...
              </div>
            ) : fplError ? (
              <p className="text-red-400 text-sm">{fplError}</p>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <PlayerSelector
                    position="FWD"
                    players={fplPlayers}
                    selected={player}
                    onSelect={setPlayer}
                    label="speler"
                  />
                </div>
                <PlayerImageUpload
                  value={imageUrl}
                  onChange={setImageUrl}
                  playerName={displayName}
                />
              </div>
            )}

            {/* Manual override als speler niet in FPL API staat */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Naam (override)</label>
                <input
                  type="text"
                  value={player?.name ?? playerName}
                  onChange={(e) => { setPlayer(null); setPlayerName(e.target.value); }}
                  placeholder="Spelernaam *"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Club (override)</label>
                <input
                  type="text"
                  value={player?.team ?? playerClub}
                  onChange={(e) => { setPlayer(null); setPlayerClub(e.target.value); }}
                  placeholder="Club"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Positie (override)</label>
                <select
                  value={player?.position ?? position}
                  onChange={(e) => { setPlayer(null); setPosition(e.target.value); }}
                  className={inputClass + ' cursor-pointer'}
                >
                  <option value="">— Positie —</option>
                  <option value="GK">GK</option>
                  <option value="DEF">DEF</option>
                  <option value="MID">MID</option>
                  <option value="FWD">FWD</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-5">
            <label className={labelClass}>Stats van de week</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Punten *', value: points, setter: setPoints, placeholder: '0' },
                { label: 'Goals',    value: goals,  setter: setGoals,  placeholder: '0' },
                { label: 'Assists',  value: assists, setter: setAssists, placeholder: '0' },
                { label: 'Bonus',    value: bonus,   setter: setBonus,   placeholder: '0' },
              ].map(({ label, value, setter, placeholder }) => (
                <div key={label}>
                  <label className="block text-xs text-gray-600 mb-1">{label}</label>
                  <input
                    type="number"
                    min="0"
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    placeholder={placeholder}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Motivatie */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-5">
            <label htmlFor="motivatie" className={labelClass}>Motivatie / analyse</label>
            <textarea
              id="motivatie"
              value={motivatie}
              onChange={(e) => setMotivatie(e.target.value)}
              rows={4}
              placeholder="Waarom is deze speler de speler van de week?"
              className={inputClass + ' resize-none'}
            />
          </div>
        </div>

        {/* ── Rechter kolom ────────────────────────────────── */}
        <div className="space-y-5">

          {/* Status */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-5">
            <p className={labelClass}>Status</p>
            <input type="hidden" name="published" value={published ? 'true' : 'false'} />
            <button
              type="button"
              onClick={() => setPublished(!published)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border
                          text-sm font-medium transition-all duration-200
                          ${published
                            ? 'bg-[#00A651]/15 border-[#00A651]/40 text-[#00A651]'
                            : 'bg-white/5 border-white/10 text-gray-400'
                          }`}
            >
              <span>{published ? 'Gepubliceerd' : 'Concept'}</span>
              <div className={`w-10 h-5 rounded-full transition-colors relative
                               ${published ? 'bg-[#00A651]' : 'bg-gray-700'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow
                                 transition-transform duration-200
                                 ${published ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </button>
          </div>

          {/* Gameweek + Seizoen */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-5 space-y-4">
            <div>
              <label className={labelClass}>Gameweek</label>
              <input
                type="number"
                min="1"
                max="38"
                value={gameweek}
                onChange={(e) => setGameweek(e.target.value)}
                placeholder="bijv. 28"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Seizoen</label>
              <input
                type="text"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                placeholder="2025-26"
                className={inputClass}
              />
            </div>
          </div>

          {/* Preview */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-5">
            <p className={labelClass}>Preview</p>
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-white/5 flex items-center justify-center">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-gray-600" />
                )}
              </div>
              <div className="text-center">
                <p className="text-white font-semibold">{displayName}</p>
                <p className="text-gray-500 text-xs">
                  {player?.team || playerClub || '—'}{(player?.position || position) ? ` · ${player?.position || position}` : ''}
                </p>
                {points && (
                  <span className="inline-block mt-2 bg-[#00A651] text-black text-xs font-bold px-3 py-1 rounded-full">
                    {points} pts
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

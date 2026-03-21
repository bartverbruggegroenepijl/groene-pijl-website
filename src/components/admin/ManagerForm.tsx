'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, AlertCircle, Instagram } from 'lucide-react';
import PlayerImageUpload from '@/components/admin/PlayerImageUpload';
import type { Manager } from '@/types';

interface ManagerFormProps {
  manager: Manager;
  action:  (formData: FormData) => Promise<void>;
}

export default function ManagerForm({ manager, action }: ManagerFormProps) {
  const [name,             setName]             = useState(manager.name              ?? '');
  const [role,             setRole]             = useState(manager.role              ?? 'Host & Manager');
  const [bio,              setBio]              = useState(manager.bio               ?? '');
  const [rankGeschiedenis, setRankGeschiedenis] = useState(manager.rank_geschiedenis ?? '');
  const [instagramUrl,     setInstagramUrl]     = useState(manager.instagram_url     ?? '');
  const [avatarUrl,    setAvatarUrl]    = useState(manager.avatar_url    ?? '');
  const [formError,    setFormError]    = useState('');
  const [isPending,    startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Naam is verplicht.');
      return;
    }

    const formData = new FormData(e.currentTarget);
    // Override controlled values
    formData.set('name',              name);
    formData.set('role',              role);
    formData.set('bio',               bio);
    formData.set('rank_geschiedenis', rankGeschiedenis);
    formData.set('instagram_url',     instagramUrl);
    formData.set('avatar_url',        avatarUrl);

    startTransition(async () => {
      try {
        await action(formData);
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Er is een fout opgetreden.');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/managers"
            className="flex items-center gap-2 text-gray-500 hover:text-white
                       transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Terug
          </Link>
          <div>
            <h1
              className="text-white"
              style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem', letterSpacing: '0.05em' }}
            >
              {manager.name} bewerken
            </h1>
            <p className="text-gray-500 text-sm">Managers · Profiel bijwerken</p>
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

      {/* ── Foutmelding ── */}
      {formError && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30
                        rounded-lg px-4 py-3 mb-6 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {formError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Linker kolom: foto ── */}
        <div className="lg:col-span-1">
          <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
              Profielfoto
            </p>

            {/* Grote preview */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-white/8
                              border-2 border-white/10 flex items-center justify-center">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={manager.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span
                    className="text-4xl font-bold text-gray-600"
                    style={{ fontFamily: 'Bebas Neue, sans-serif' }}
                  >
                    {name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Upload/remove */}
              <div className="flex items-center gap-2">
                <PlayerImageUpload
                  value={avatarUrl || null}
                  onChange={(url) => setAvatarUrl(url ?? '')}
                  playerName={name || 'manager'}
                />
                {avatarUrl && (
                  <span className="text-xs text-gray-500">Klik het camera-icoon</span>
                )}
                {!avatarUrl && (
                  <span className="text-xs text-gray-500">Foto uploaden</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Rechter kolom: velden ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Naam + Rol */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
              Gegevens
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Naam *
                </label>
                <input
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Bart"
                  className="w-full bg-[#111111] border border-white/10 text-white
                             placeholder-gray-600 rounded-lg px-4 py-2.5 text-sm
                             focus:outline-none focus:ring-2 focus:ring-[#00A651]
                             focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Rol
                </label>
                <input
                  name="role"
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Host & Manager"
                  className="w-full bg-[#111111] border border-white/10 text-white
                             placeholder-gray-600 rounded-lg px-4 py-2.5 text-sm
                             focus:outline-none focus:ring-2 focus:ring-[#00A651]
                             focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Rank geschiedenis */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">
              Beste FPL prestatie
            </p>
            <p className="text-xs text-gray-600 mb-4">
              Bijv. &ldquo;top 150k in 2024/2025&rdquo;
            </p>
            <textarea
              name="rank_geschiedenis"
              value={rankGeschiedenis}
              onChange={(e) => setRankGeschiedenis(e.target.value)}
              placeholder="Bijv. top 150k in 2024/2025"
              rows={3}
              className="w-full bg-[#111111] border border-white/10 text-white
                         placeholder-gray-600 rounded-lg px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#00A651]
                         focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Bio */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
              Bio
            </p>
            <textarea
              name="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Korte beschrijving over deze host..."
              rows={4}
              className="w-full bg-[#111111] border border-white/10 text-white
                         placeholder-gray-600 rounded-lg px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#00A651]
                         focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Social */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
              Social media
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Instagram URL
              </label>
              <div className="relative">
                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2
                                      w-4 h-4 text-gray-600 pointer-events-none" />
                <input
                  name="instagram_url"
                  type="url"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/gebruikersnaam"
                  className="w-full bg-[#111111] border border-white/10 text-white
                             placeholder-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-sm
                             focus:outline-none focus:ring-2 focus:ring-[#00A651]
                             focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

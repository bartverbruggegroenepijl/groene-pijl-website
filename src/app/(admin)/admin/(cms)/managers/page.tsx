import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Users, Pencil, Instagram, ExternalLink } from 'lucide-react';
import type { Manager } from '@/types';

export default async function ManagersPage() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('managers')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    return (
      <div className="text-red-400 text-sm p-4 bg-red-500/10 rounded-lg border border-red-500/20">
        Fout bij laden: {error.message}
      </div>
    );
  }

  const managers = (data ?? []) as Manager[];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-white"
            style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem', letterSpacing: '0.05em' }}
          >
            Managers & Hosts
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {managers.length} {managers.length === 1 ? 'host' : 'hosts'}
          </p>
        </div>
      </div>

      {/* ── Lege staat ── */}
      {managers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20
                        bg-[#1a1a1a] border border-white/8 rounded-xl text-center">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center
                          justify-center mb-4">
            <Users className="w-5 h-5 text-gray-600" />
          </div>
          <p className="text-gray-400 font-medium mb-1">Geen managers gevonden</p>
          <p className="text-gray-600 text-sm">
            Voer eerst het schema.sql uit in de Supabase SQL Editor.
          </p>
        </div>
      )}

      {/* ── Kaarten grid ── */}
      {managers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {managers.map((manager) => (
            <ManagerCard key={manager.id} manager={manager} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Manager kaart ────────────────────────────────────────────

function ManagerCard({ manager }: { manager: Manager }) {
  const initials = manager.name
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);

  return (
    <div className="bg-[#1a1a1a] border border-white/8 rounded-xl overflow-hidden
                    hover:border-white/15 transition-all group">

      {/* Foto sectie */}
      <div className="relative bg-gradient-to-b from-[#0B3D2E]/40 to-[#1a1a1a] pt-8 pb-4 px-5
                      flex flex-col items-center">

        {/* Avatar */}
        <div className="w-20 h-20 rounded-full overflow-hidden bg-[#0B3D2E]
                        border-2 border-[#00A651]/30 flex items-center justify-center
                        flex-shrink-0 mb-3">
          {manager.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={manager.avatar_url}
              alt={manager.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span
              className="text-2xl font-bold text-[#00A651]"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              {initials}
            </span>
          )}
        </div>

        {/* Naam & rol */}
        <p
          className="text-white text-lg leading-tight text-center"
          style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.05em' }}
        >
          {manager.name}
        </p>
        {manager.role && (
          <p className="text-[#00A651] text-xs font-medium mt-0.5 text-center">
            {manager.role}
          </p>
        )}

        {/* Bewerk knop (hover) */}
        <Link
          href={`/admin/managers/${manager.id}/bewerken`}
          className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/0 hover:bg-white/10
                     text-gray-600 hover:text-white transition-all
                     opacity-0 group-hover:opacity-100"
          title="Bewerken"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Content */}
      <div className="px-5 pb-5 space-y-3">

        {/* Bio */}
        {manager.bio ? (
          <p className="text-gray-500 text-xs leading-relaxed line-clamp-3">
            {manager.bio}
          </p>
        ) : (
          <p className="text-gray-700 text-xs italic">Nog geen bio toegevoegd.</p>
        )}

        {/* Links */}
        <div className="flex items-center justify-between pt-1">
          {manager.instagram_url ? (
            <a
              href={manager.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-gray-500 hover:text-pink-400
                         transition-colors text-xs"
            >
              <Instagram className="w-3.5 h-3.5" />
              Instagram
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <span className="text-gray-700 text-xs">— geen Instagram</span>
          )}

          <Link
            href={`/admin/managers/${manager.id}/bewerken`}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500
                       hover:text-white transition-colors"
          >
            <Pencil className="w-3 h-3" />
            Bewerken
          </Link>
        </div>
      </div>
    </div>
  );
}

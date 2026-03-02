import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, Star, Pencil } from 'lucide-react';
import DeleteCaptainPickButton from '@/components/admin/DeleteCaptainPickButton';
import PublishCaptainPickButton from '@/components/admin/PublishCaptainPickButton';
import type { CaptainPick } from '@/types';

export default async function CaptainKeuzePageAdmin() {
  const supabase = createClient();

  const { data: picks, error } = await supabase
    .from('captain_picks')
    .select('*')
    .order('gameweek', { ascending: false });

  if (error) {
    return (
      <div className="text-red-400 text-sm p-4 bg-red-500/10 rounded-lg border border-red-500/20">
        Fout bij laden: {error.message}
      </div>
    );
  }

  const rows = (picks ?? []) as CaptainPick[];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-white"
            style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem', letterSpacing: '0.05em' }}
          >
            Captain Keuze
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {rows.length} {rows.length === 1 ? 'keuze' : 'keuzes'} aangemaakt
          </p>
        </div>
        <Link
          href="/admin/captain-keuze/nieuw"
          className="flex items-center gap-2 bg-[#00A651] hover:bg-[#009147]
                     text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nieuwe captain keuze
        </Link>
      </div>

      {/* Lege staat */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20
                        bg-[#1a1a1a] border border-white/8 rounded-xl text-center">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Star className="w-5 h-5 text-gray-600" />
          </div>
          <p className="text-gray-400 font-medium mb-1">Nog geen captain keuzes</p>
          <p className="text-gray-600 text-sm mb-5">
            Voeg de eerste goud, zilver en brons captain toe.
          </p>
          <Link
            href="/admin/captain-keuze/nieuw"
            className="flex items-center gap-2 bg-[#00A651] hover:bg-[#009147]
                       text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nieuwe captain keuze
          </Link>
        </div>
      ) : (
        <div className="bg-[#1a1a1a] border border-white/8 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  Gameweek
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-widest hidden md:table-cell">
                  Seizoen
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  Status
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-widest hidden lg:table-cell">
                  Aangemaakt
                </th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((pick) => (
                <tr key={pick.id} className="hover:bg-white/3 transition-colors group">

                  {/* Gameweek */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-yellow-500/15 flex items-center
                                      justify-center flex-shrink-0">
                        <Star className="w-3.5 h-3.5 text-yellow-400" />
                      </div>
                      <p className="text-white text-sm font-semibold">
                        {pick.gameweek ? `GW ${pick.gameweek}` : '—'}
                      </p>
                    </div>
                  </td>

                  {/* Seizoen */}
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-gray-400 text-sm">{pick.season ?? '—'}</span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <PublishCaptainPickButton id={pick.id} published={pick.published} />
                  </td>

                  {/* Datum */}
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <span className="text-gray-500 text-sm">
                      {new Date(pick.created_at).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </td>

                  {/* Acties */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 justify-end opacity-0
                                    group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/admin/captain-keuze/${pick.id}/bewerken`}
                        title="Bewerken"
                        className="p-1.5 text-gray-600 hover:text-white hover:bg-white/8
                                   rounded-md transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <DeleteCaptainPickButton id={pick.id} gameweek={pick.gameweek} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

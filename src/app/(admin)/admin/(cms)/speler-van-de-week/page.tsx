import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, User } from 'lucide-react';
import DeletePlayerOfWeekButton from '@/components/admin/DeletePlayerOfWeekButton';
import PublishPlayerOfWeekButton from '@/components/admin/PublishPlayerOfWeekButton';
import type { PlayerOfWeek } from '@/types';

export default async function SpelerVanDeWeekPage() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('player_of_the_week')
    .select('*')
    .order('gameweek', { ascending: false });

  if (error) {
    return (
      <div className="text-red-400 text-sm p-4 bg-red-500/10 rounded-lg border border-red-500/20">
        Fout bij laden: {error.message}
      </div>
    );
  }

  const rows = (data ?? []) as PlayerOfWeek[];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-white"
            style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem', letterSpacing: '0.05em' }}
          >
            Speler van de Week
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {rows.length} {rows.length === 1 ? 'speler' : 'spelers'} aangemaakt
          </p>
        </div>
        <Link
          href="/admin/speler-van-de-week/nieuw"
          className="flex items-center gap-2 bg-[#00A651] hover:bg-[#009147]
                     text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nieuwe speler
        </Link>
      </div>

      {/* Lege staat */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20
                        bg-[#1a1a1a] border border-white/8 rounded-xl text-center">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <User className="w-5 h-5 text-gray-600" />
          </div>
          <p className="text-gray-400 font-medium mb-1">Nog geen spelers aangemaakt</p>
          <p className="text-gray-600 text-sm mb-5">
            Voeg de eerste Speler van de Week toe.
          </p>
          <Link
            href="/admin/speler-van-de-week/nieuw"
            className="flex items-center gap-2 bg-[#00A651] hover:bg-[#009147]
                       text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nieuwe speler
          </Link>
        </div>
      ) : (
        <div className="bg-[#1a1a1a] border border-white/8 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  Speler
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-widest hidden md:table-cell">
                  Gameweek
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-widest hidden lg:table-cell">
                  Stats
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-white/3 transition-colors group">

                  {/* Speler */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {row.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={row.image_url}
                          alt={row.player_name ?? ''}
                          className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#00A651]/15 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-[#00A651]" />
                        </div>
                      )}
                      <div>
                        <p className="text-white text-sm font-semibold">{row.player_name ?? '—'}</p>
                        <p className="text-gray-500 text-xs">
                          {row.player_club ?? '—'}{row.position ? ` · ${row.position}` : ''}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Gameweek */}
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-gray-400 text-sm">
                      {row.gameweek ? `GW ${row.gameweek}` : '—'}
                      {row.season ? ` · ${row.season}` : ''}
                    </span>
                  </td>

                  {/* Stats */}
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {row.points !== null && (
                        <span className="bg-[#00A651]/15 text-[#00A651] font-bold px-2 py-0.5 rounded">
                          {row.points}p
                        </span>
                      )}
                      {row.goals !== null && row.goals > 0 && <span>{row.goals}G</span>}
                      {row.assists !== null && row.assists > 0 && <span>{row.assists}A</span>}
                      {row.bonus !== null && row.bonus > 0 && <span>{row.bonus}B</span>}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <PublishPlayerOfWeekButton id={row.id} published={row.published} />
                  </td>

                  {/* Acties */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 justify-end opacity-0
                                    group-hover:opacity-100 transition-opacity">
                      <DeletePlayerOfWeekButton id={row.id} gameweek={row.gameweek} />
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

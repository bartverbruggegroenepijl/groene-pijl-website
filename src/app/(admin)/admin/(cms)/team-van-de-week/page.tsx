import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, Pencil, Trophy } from 'lucide-react';
import DeleteTeamButton from '@/components/admin/DeleteTeamButton';
import PublishToggleButton from '@/components/admin/PublishToggleButton';
import type { TeamOfTheWeek } from '@/types';

export default async function TeamVanDeWeekPage() {
  const supabase = createClient();

  const { data: teams, error } = await supabase
    .from('team_of_the_week')
    .select('*')
    .order('week_number', { ascending: false });

  if (error) {
    return (
      <div className="text-red-400 text-sm p-4 bg-red-500/10 rounded-lg border border-red-500/20">
        Fout bij laden: {error.message}
      </div>
    );
  }

  const rows = (teams ?? []) as TeamOfTheWeek[];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-white"
            style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem', letterSpacing: '0.05em' }}
          >
            Team van de Week
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {rows.length} {rows.length === 1 ? 'team' : 'teams'} aangemaakt
          </p>
        </div>
        <Link
          href="/admin/team-van-de-week/nieuw"
          className="flex items-center gap-2 bg-[#00A651] hover:bg-[#009147]
                     text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nieuw team
        </Link>
      </div>

      {/* Lege staat */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20
                        bg-[#1a1a1a] border border-white/8 rounded-xl text-center">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Trophy className="w-5 h-5 text-gray-600" />
          </div>
          <p className="text-gray-400 font-medium mb-1">Nog geen teams</p>
          <p className="text-gray-600 text-sm mb-5">
            Stel het eerste team van de week samen.
          </p>
          <Link
            href="/admin/team-van-de-week/nieuw"
            className="flex items-center gap-2 bg-[#00A651] hover:bg-[#009147]
                       text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nieuw team
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
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-widest hidden sm:table-cell">
                  Formatie
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
              {rows.map((team) => (
                <tr key={team.id} className="hover:bg-white/3 transition-colors group">

                  {/* Gameweek */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#00A651]/15 flex items-center
                                      justify-center flex-shrink-0">
                        <Trophy className="w-3.5 h-3.5 text-[#00A651]" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold">
                          {team.week_number ? `GW ${team.week_number}` : '—'}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Seizoen */}
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-gray-400 text-sm">{team.season ?? '—'}</span>
                  </td>

                  {/* Formatie */}
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="text-gray-300 text-sm font-mono">
                      {team.formation ?? '—'}
                    </span>
                  </td>

                  {/* Status — klikbaar toggle */}
                  <td className="px-5 py-4">
                    <PublishToggleButton id={team.id} published={team.published} />
                  </td>

                  {/* Datum */}
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <span className="text-gray-500 text-sm">
                      {new Date(team.created_at).toLocaleDateString('nl-NL', {
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
                        href={`/admin/team-van-de-week/${team.id}/bewerken`}
                        title="Bewerken"
                        className="p-1.5 text-gray-600 hover:text-white hover:bg-white/8
                                   rounded-md transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <DeleteTeamButton id={team.id} weekNumber={team.week_number} />
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

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, TrendingUp, Pencil } from 'lucide-react';
import DeleteBuyTipButton from '@/components/admin/DeleteBuyTipButton';
import PublishBuyTipButton from '@/components/admin/PublishBuyTipButton';
import type { BuyTip } from '@/types';

export default async function KooptipsPage() {
  const supabase = createClient();

  const { data: tips, error } = await supabase
    .from('buy_tips')
    .select('*')
    .order('gameweek', { ascending: false });

  if (error) {
    return (
      <div className="text-red-400 text-sm p-4 bg-red-500/10 rounded-lg border border-red-500/20">
        Fout bij laden: {error.message}
      </div>
    );
  }

  const rows = (tips ?? []) as BuyTip[];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-white"
            style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem', letterSpacing: '0.05em' }}
          >
            Transfertips
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {rows.length} {rows.length === 1 ? 'transfertip' : 'transfertips'} aangemaakt
          </p>
        </div>
        <Link
          href="/admin/kooptips/nieuw"
          className="flex items-center gap-2 bg-[#00A651] hover:bg-[#009147]
                     text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nieuwe transfertips
        </Link>
      </div>

      {/* Lege staat */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20
                        bg-[#1a1a1a] border border-white/8 rounded-xl text-center">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <TrendingUp className="w-5 h-5 text-gray-600" />
          </div>
          <p className="text-gray-400 font-medium mb-1">Nog geen transfertips</p>
          <p className="text-gray-600 text-sm mb-5">
            Voeg de eerste aanbevolen spelers toe.
          </p>
          <Link
            href="/admin/kooptips/nieuw"
            className="flex items-center gap-2 bg-[#00A651] hover:bg-[#009147]
                       text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nieuwe transfertips
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
              {rows.map((tip) => (
                <tr key={tip.id} className="hover:bg-white/3 transition-colors group">

                  {/* Gameweek */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#00A651]/15 flex items-center
                                      justify-center flex-shrink-0">
                        <TrendingUp className="w-3.5 h-3.5 text-[#00A651]" />
                      </div>
                      <p className="text-white text-sm font-semibold">
                        {tip.gameweek ? `GW ${tip.gameweek}` : '—'}
                      </p>
                    </div>
                  </td>

                  {/* Seizoen */}
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-gray-400 text-sm">{tip.season ?? '—'}</span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <PublishBuyTipButton id={tip.id} published={tip.published} />
                  </td>

                  {/* Datum */}
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <span className="text-gray-500 text-sm">
                      {new Date(tip.created_at).toLocaleDateString('nl-NL', {
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
                        href={`/admin/kooptips/${tip.id}/bewerken`}
                        title="Bewerken"
                        className="p-1.5 text-gray-600 hover:text-white hover:bg-white/8
                                   rounded-md transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <DeleteBuyTipButton id={tip.id} gameweek={tip.gameweek} />
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

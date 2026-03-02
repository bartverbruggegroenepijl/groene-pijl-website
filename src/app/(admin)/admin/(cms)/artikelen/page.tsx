import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, Pencil, FileText } from 'lucide-react';
import DeleteArticleButton from '@/components/admin/DeleteArticleButton';
import type { Article } from '@/types';

export default async function ArtikelenPage() {
  const supabase = createClient();

  const { data: articles, error } = await supabase
    .from('articles')
    .select('*, managers(id, name)')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="text-red-400 text-sm p-4 bg-red-500/10 rounded-lg border border-red-500/20">
        Fout bij laden: {error.message}
      </div>
    );
  }

  const rows = (articles ?? []) as Article[];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-white"
            style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem', letterSpacing: '0.05em' }}
          >
            Artikelen
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {rows.length} {rows.length === 1 ? 'artikel' : 'artikelen'} in totaal
          </p>
        </div>
        <Link
          href="/admin/artikelen/nieuw"
          className="flex items-center gap-2 bg-[#00A651] hover:bg-[#009147]
                     text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nieuw artikel
        </Link>
      </div>

      {/* Tabel of lege staat */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20
                        bg-[#1a1a1a] border border-white/8 rounded-xl text-center">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <FileText className="w-5 h-5 text-gray-600" />
          </div>
          <p className="text-gray-400 font-medium mb-1">Nog geen artikelen</p>
          <p className="text-gray-600 text-sm mb-5">Maak je eerste artikel aan om te beginnen.</p>
          <Link
            href="/admin/artikelen/nieuw"
            className="flex items-center gap-2 bg-[#00A651] hover:bg-[#009147]
                       text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nieuw artikel
          </Link>
        </div>
      ) : (
        <div className="bg-[#1a1a1a] border border-white/8 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  Titel
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-widest hidden md:table-cell">
                  Auteur
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  Status
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-widest hidden lg:table-cell">
                  Datum
                </th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((article) => (
                <tr
                  key={article.id}
                  className="hover:bg-white/3 transition-colors group"
                >
                  {/* Titel */}
                  <td className="px-5 py-4">
                    <p className="text-white text-sm font-medium leading-snug line-clamp-1">
                      {article.title}
                    </p>
                    <p className="text-gray-600 text-xs mt-0.5 font-mono">/artikelen/{article.slug}</p>
                  </td>

                  {/* Auteur */}
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-gray-400 text-sm">
                      {article.managers?.name ?? <span className="text-gray-600 italic">Onbekend</span>}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                        ${article.published
                          ? 'bg-[#00A651]/15 text-[#00A651]'
                          : 'bg-white/8 text-gray-400'
                        }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full
                        ${article.published ? 'bg-[#00A651]' : 'bg-gray-500'}`}
                      />
                      {article.published ? 'Gepubliceerd' : 'Concept'}
                    </span>
                  </td>

                  {/* Datum */}
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <span className="text-gray-500 text-sm">
                      {new Date(article.created_at).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </td>

                  {/* Acties */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/admin/artikelen/${article.id}/bewerken`}
                        title="Bewerken"
                        className="p-1.5 text-gray-600 hover:text-white hover:bg-white/8
                                   rounded-md transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <DeleteArticleButton id={article.id} title={article.title} />
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

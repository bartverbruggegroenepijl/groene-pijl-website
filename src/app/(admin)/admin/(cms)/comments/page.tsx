import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { MessageSquare } from 'lucide-react';

async function deleteComment(id: string) {
  'use server';
  const supabase = createClient();
  await supabase.from('comments').delete().eq('id', id);
  revalidatePath('/admin/comments');
}

export default async function CommentsPage() {
  const supabase = createClient();

  const { data: comments } = await supabase
    .from('comments')
    .select('id, username, body, created_at, articles(title, slug)')
    .order('created_at', { ascending: false });

  const rows = (comments ?? []) as unknown as {
    id: string;
    username: string;
    body: string;
    created_at: string;
    articles: { title: string; slug: string } | null;
  }[];

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('nl-NL', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-white"
            style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem', letterSpacing: '0.05em' }}
          >
            Comments
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {rows.length} {rows.length === 1 ? 'reactie' : 'reacties'} in totaal
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#1a1a1a] border border-white/8 rounded-xl text-center">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <MessageSquare className="w-5 h-5 text-gray-600" />
          </div>
          <p className="text-gray-400 font-medium">Nog geen reacties</p>
        </div>
      ) : (
        <div className="bg-[#1a1a1a] border border-white/8 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-widest">Artikel</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-widest">Gebruiker</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-widest">Reactie</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-widest hidden lg:table-cell">Datum</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((comment) => (
                <tr key={comment.id} className="hover:bg-white/3 transition-colors group">
                  <td className="px-5 py-4 max-w-[180px]">
                    <p className="text-white text-sm font-medium line-clamp-1">
                      {comment.articles?.title ?? <span className="text-gray-600 italic">Onbekend</span>}
                    </p>
                    {comment.articles?.slug && (
                      <p className="text-gray-600 text-xs mt-0.5 font-mono">/artikelen/{comment.articles.slug}</p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className="inline-block text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(0,250,97,0.1)', color: '#00FA61' }}
                    >
                      {comment.username}
                    </span>
                  </td>
                  <td className="px-5 py-4 max-w-xs">
                    <p className="text-gray-300 text-sm line-clamp-2">{comment.body}</p>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <span className="text-gray-500 text-xs">{formatDate(comment.created_at)}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <form action={deleteComment.bind(null, comment.id)}>
                      <button
                        type="submit"
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                        style={{ background: 'rgba(239,68,68,0.12)', color: '#F87171' }}
                      >
                        Verwijderen
                      </button>
                    </form>
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

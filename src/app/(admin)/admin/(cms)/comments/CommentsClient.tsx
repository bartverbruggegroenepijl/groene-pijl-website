'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageSquare } from 'lucide-react';

interface CommentRow {
  id: string;
  username: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  articles: { title: string; slug: string } | null;
}

interface Props {
  initialRows: CommentRow[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function CommentsClient({ initialRows }: Props) {
  const [rows, setRows] = useState<CommentRow[]>(initialRows);

  async function handleDelete(id: string) {
    if (!confirm('Weet je zeker dat je dit comment wilt verwijderen?')) return;

    const supabase = createClient();
    const { error } = await supabase.from('comments').delete().eq('id', id);

    if (!error) {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-[#1a1a1a] border border-white/8 rounded-xl text-center">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <MessageSquare className="w-5 h-5 text-gray-600" />
        </div>
        <p className="text-gray-400 font-medium">Nog geen reacties</p>
      </div>
    );
  }

  return (
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
            <tr
              key={comment.id}
              className="hover:bg-white/3 transition-colors group"
              style={comment.parent_id ? { background: 'rgba(0,250,97,0.02)' } : undefined}
            >
              <td className="px-5 py-4 max-w-[180px]">
                {comment.parent_id ? (
                  <span className="text-[#00FA61]/60 text-xs font-semibold">↳ Reply</span>
                ) : (
                  <>
                    <p className="text-white text-sm font-medium line-clamp-1">
                      {comment.articles?.title ?? <span className="text-gray-600 italic">Onbekend</span>}
                    </p>
                    {comment.articles?.slug && (
                      <p className="text-gray-600 text-xs mt-0.5 font-mono">/artikelen/{comment.articles.slug}</p>
                    )}
                  </>
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
                <p className="text-gray-300 text-sm line-clamp-2">{comment.content}</p>
              </td>
              <td className="px-5 py-4 hidden lg:table-cell">
                <span className="text-gray-500 text-xs">{formatDate(comment.created_at)}</span>
              </td>
              <td className="px-5 py-4 text-right">
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  style={{ background: 'rgba(239,68,68,0.12)', color: '#F87171' }}
                >
                  Verwijderen
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

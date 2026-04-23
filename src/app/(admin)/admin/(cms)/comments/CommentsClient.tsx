'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageSquare, ExternalLink } from 'lucide-react';

interface CommentRow {
  id: string;
  article_id: string;
  username: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  articles: { title: string; slug: string } | null;
}

interface ArticleGroup {
  article_id: string;
  title: string;
  slug: string | null;
  topLevel: CommentRow[];
  repliesByParent: Record<string, CommentRow[]>;
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

function groupByArticle(rows: CommentRow[]): ArticleGroup[] {
  const map = new Map<string, ArticleGroup>();

  // Ensure stable order: top-level first so repliesByParent can reference them
  const sorted = [...rows].sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  for (const row of sorted) {
    const key = row.article_id;
    if (!map.has(key)) {
      map.set(key, {
        article_id: key,
        title: row.articles?.title ?? 'Onbekend artikel',
        slug: row.articles?.slug ?? null,
        topLevel: [],
        repliesByParent: {},
      });
    }
    const group = map.get(key)!;
    if (!row.parent_id) {
      group.topLevel.push(row);
    } else {
      if (!group.repliesByParent[row.parent_id]) {
        group.repliesByParent[row.parent_id] = [];
      }
      group.repliesByParent[row.parent_id].push(row);
    }
  }

  // Sort groups by most recent comment descending
  return Array.from(map.values()).sort((a, b) => {
    const latestA = Math.max(...[...a.topLevel, ...Object.values(a.repliesByParent).flat()].map(c => new Date(c.created_at).getTime()));
    const latestB = Math.max(...[...b.topLevel, ...Object.values(b.repliesByParent).flat()].map(c => new Date(c.created_at).getTime()));
    return latestB - latestA;
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

  const groups = groupByArticle(rows);

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => {
        const groupCount = group.topLevel.length + Object.values(group.repliesByParent).flat().length;
        return (
          <div key={group.article_id} className="bg-[#1a1a1a] border border-white/8 rounded-xl overflow-hidden">
            {/* Artikel header */}
            <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm truncate">{group.title}</p>
                {group.slug && (
                  <a
                    href={`/artikelen/${group.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-gray-500 text-xs font-mono mt-0.5 hover:text-[#00FA61] transition-colors"
                  >
                    /artikelen/{group.slug}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <span
                className="flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(0,250,97,0.1)', color: '#00FA61' }}
              >
                {groupCount} {groupCount === 1 ? 'reactie' : 'reacties'}
              </span>
            </div>

            {/* Comments */}
            <div className="divide-y divide-white/5">
              {group.topLevel.map((comment) => (
                <div key={comment.id}>
                  <CommentRow comment={comment} onDelete={handleDelete} indent={false} />
                  {(group.repliesByParent[comment.id] ?? []).map((reply) => (
                    <CommentRow key={reply.id} comment={reply} onDelete={handleDelete} indent={true} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CommentRow({
  comment,
  onDelete,
  indent,
}: {
  comment: CommentRow;
  onDelete: (id: string) => void;
  indent: boolean;
}) {
  return (
    <div
      className="flex items-start gap-4 px-5 py-4 hover:bg-white/3 transition-colors"
      style={indent ? { paddingLeft: '2.5rem', borderLeft: '2px solid rgba(0,250,97,0.15)' } : undefined}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {indent && <span className="text-[#00FA61]/40 text-xs">↳</span>}
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(0,250,97,0.1)', color: '#00FA61' }}
          >
            {comment.username}
          </span>
          <span className="text-gray-600 text-xs">
            {new Date(comment.created_at).toLocaleDateString('nl-NL', {
              day: 'numeric', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </span>
        </div>
        <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">{comment.content}</p>
      </div>
      <button
        onClick={() => onDelete(comment.id)}
        className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors mt-0.5"
        style={{ background: 'rgba(239,68,68,0.12)', color: '#F87171' }}
      >
        Verwijderen
      </button>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  articleId: string;
}

interface Comment {
  id: string;
  username: string;
  body: string;
  created_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function ArticleComments({ articleId }: Props) {
  const [comments,  setComments]  = useState<Comment[]>([]);
  const [username,  setUsername]  = useState('');
  const [body,      setBody]      = useState('');
  const [error,     setError]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('gp_username');
    if (saved) setUsername(saved);
    loadComments();
  }, [articleId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadComments() {
    const supabase = createClient();
    const { data } = await supabase
      .from('comments')
      .select('id, username, body, created_at')
      .eq('article_id', articleId)
      .order('created_at', { ascending: true });
    setComments((data as Comment[]) ?? []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!username.trim()) return setError('Vul een gebruikersnaam in.');
    if (!body.trim())     return setError('Schrijf eerst een reactie.');

    setSubmitting(true);
    localStorage.setItem('gp_username', username.trim());

    const supabase = createClient();
    const { error: err } = await supabase
      .from('comments')
      .insert({ article_id: articleId, username: username.trim(), body: body.trim() });

    setSubmitting(false);
    if (err) {
      setError('Er ging iets mis, probeer het opnieuw.');
    } else {
      setBody('');
      await loadComments();
    }
  }

  return (
    <div
      style={{ fontFamily: 'Montserrat, sans-serif' }}
      className="mt-10 border-t border-white/8 pt-10"
    >
      <h2 className="text-xl font-bold text-white mb-6">
        Reacties {comments.length > 0 && <span className="text-white/30 font-normal text-base ml-1">({comments.length})</span>}
      </h2>

      {/* Comment lijst */}
      {comments.length === 0 ? (
        <p className="text-white/30 text-sm mb-8">Nog geen reacties. Wees de eerste!</p>
      ) : (
        <div className="flex flex-col gap-4 mb-8">
          {comments.map((c) => (
            <div
              key={c.id}
              className="rounded-xl p-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(0,250,97,0.12)', color: '#00FA61' }}
                >
                  {c.username}
                </span>
                <span className="text-white/25 text-xs">{formatDate(c.created_at)}</span>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* Formulier */}
      <div
        className="rounded-2xl p-6"
        style={{ background: 'rgba(26,19,97,0.6)', border: '1.5px solid rgba(0,250,97,0.2)' }}
      >
        <h3 className="text-sm font-bold text-white mb-4">Laat een reactie achter</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Gebruikersnaam"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={60}
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(0,250,97,0.25)',
              fontFamily: 'Montserrat, sans-serif',
            }}
          />
          <textarea
            placeholder="Schrijf je reactie..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            maxLength={1000}
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none resize-none"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(0,250,97,0.25)',
              fontFamily: 'Montserrat, sans-serif',
            }}
          />
          {error && <p className="text-red-400 text-xs font-semibold">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="self-start px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: '#00FA61', color: '#1a1361', fontFamily: 'Montserrat, sans-serif' }}
          >
            {submitting ? 'Plaatsen...' : 'Reactie plaatsen'}
          </button>
        </form>
      </div>
    </div>
  );
}

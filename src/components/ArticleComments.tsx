'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  articleId: string;
}

interface Comment {
  id: string;
  username: string;
  content: string;
  created_at: string;
  parent_id: string | null;
}

interface CommentWithReplies extends Comment {
  replies: Comment[];
}

// replyTo.rootId is always the top-level comment id, so all replies stay 1 level deep in DB
interface ReplyTarget {
  id: string;       // id of comment being replied to (for UI display)
  username: string;
  rootId: string;   // top-level comment id (used as parent_id when inserting)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function buildTree(flat: Comment[]): CommentWithReplies[] {
  const top = flat.filter((c) => !c.parent_id) as CommentWithReplies[];
  for (const c of top) {
    c.replies = flat.filter((r) => r.parent_id === c.id);
  }
  return top;
}

export default function ArticleComments({ articleId }: Props) {
  const [comments,         setComments]         = useState<CommentWithReplies[]>([]);
  const [username,         setUsername]         = useState('');
  const [body,             setBody]             = useState('');
  const [error,            setError]            = useState('');
  const [submitting,       setSubmitting]       = useState(false);
  const [replyTo,          setReplyTo]          = useState<ReplyTarget | null>(null);
  const [replyBody,        setReplyBody]        = useState('');
  const [replyError,       setReplyError]       = useState('');
  const [replySubmitting,  setReplySubmitting]  = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('gp_username');
    if (saved) setUsername(saved);
    loadComments();
  }, [articleId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadComments() {
    const supabase = createClient();
    const { data } = await supabase
      .from('comments')
      .select('id, username, content, created_at, parent_id')
      .eq('article_id', articleId)
      .order('created_at', { ascending: true });
    setComments(buildTree((data as Comment[]) ?? []));
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
      .insert({ article_id: articleId, username: username.trim(), content: body.trim(), parent_id: null });

    setSubmitting(false);
    if (err) {
      setError('Er ging iets mis, probeer het opnieuw.');
    } else {
      setBody('');
      await loadComments();
    }
  }

  async function handleReplySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!replyTo) return;
    setReplyError('');
    if (!username.trim())  return setReplyError('Vul een gebruikersnaam in.');
    if (!replyBody.trim()) return setReplyError('Schrijf eerst een reactie.');

    setReplySubmitting(true);
    localStorage.setItem('gp_username', username.trim());

    const supabase = createClient();
    const { error: err } = await supabase
      .from('comments')
      .insert({
        article_id: articleId,
        username: username.trim(),
        content: replyBody.trim(),
        parent_id: replyTo.rootId, // always top-level id → keeps DB flat
      });

    setReplySubmitting(false);
    if (err) {
      setReplyError('Er ging iets mis, probeer het opnieuw.');
    } else {
      setReplyBody('');
      setReplyTo(null);
      await loadComments();
    }
  }

  function openReply(target: ReplyTarget) {
    if (replyTo?.id === target.id) {
      setReplyTo(null);
    } else {
      setReplyTo(target);
      setReplyBody('');
      setReplyError('');
    }
  }

  const totalCount = comments.reduce((sum, c) => sum + 1 + c.replies.length, 0);

  return (
    <div
      style={{ fontFamily: 'Montserrat, sans-serif' }}
      className="mt-10 border-t border-white/8 pt-10"
    >
      <h2 className="text-xl font-bold text-white mb-6">
        Reacties {totalCount > 0 && <span className="text-white/30 font-normal text-base ml-1">({totalCount})</span>}
      </h2>

      {/* Comment lijst */}
      {comments.length === 0 ? (
        <p className="text-white/30 text-sm mb-8">Nog geen reacties. Wees de eerste!</p>
      ) : (
        <div className="flex flex-col gap-4 mb-8">
          {comments.map((c) => (
            <div key={c.id}>
              {/* Top-level comment */}
              <div
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
                <p className="text-white/70 text-sm leading-relaxed">{c.content}</p>
                <button
                  onClick={() => openReply({ id: c.id, username: c.username, rootId: c.id })}
                  className="mt-3 text-xs font-semibold transition-colors"
                  style={{ color: replyTo?.id === c.id ? 'rgba(255,255,255,0.3)' : 'rgba(0,250,97,0.6)' }}
                >
                  {replyTo?.id === c.id ? 'Annuleer' : 'Reageer'}
                </button>
              </div>

              {/* Reply formulier (top-level trigger) */}
              {replyTo?.id === c.id && (
                <ReplyForm
                  replyTo={replyTo}
                  username={username}
                  setUsername={setUsername}
                  replyBody={replyBody}
                  setReplyBody={setReplyBody}
                  replyError={replyError}
                  replySubmitting={replySubmitting}
                  onSubmit={handleReplySubmit}
                />
              )}

              {/* Replies */}
              {c.replies.length > 0 && (
                <div className="ml-6 mt-2 flex flex-col gap-2">
                  {c.replies.map((r) => (
                    <div key={r.id}>
                      <div
                        className="rounded-xl p-4"
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderLeft: '2px solid rgba(0,250,97,0.25)',
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(0,250,97,0.08)', color: '#00FA61' }}
                          >
                            {r.username}
                          </span>
                          <span className="text-white/25 text-xs">{formatDate(r.created_at)}</span>
                        </div>
                        <p className="text-white/60 text-sm leading-relaxed">{r.content}</p>
                        <button
                          onClick={() => openReply({ id: r.id, username: r.username, rootId: c.id })}
                          className="mt-3 text-xs font-semibold transition-colors"
                          style={{ color: replyTo?.id === r.id ? 'rgba(255,255,255,0.3)' : 'rgba(0,250,97,0.6)' }}
                        >
                          {replyTo?.id === r.id ? 'Annuleer' : 'Reageer'}
                        </button>
                      </div>

                      {/* Reply formulier (reply trigger) */}
                      {replyTo?.id === r.id && (
                        <ReplyForm
                          replyTo={replyTo}
                          username={username}
                          setUsername={setUsername}
                          replyBody={replyBody}
                          setReplyBody={setReplyBody}
                          replyError={replyError}
                          replySubmitting={replySubmitting}
                          onSubmit={handleReplySubmit}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Nieuw comment formulier */}
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

// ── Subcomponent: reply form ──────────────────────────────────────────────────
function ReplyForm({
  replyTo,
  username,
  setUsername,
  replyBody,
  setReplyBody,
  replyError,
  replySubmitting,
  onSubmit,
}: {
  replyTo: ReplyTarget;
  username: string;
  setUsername: (v: string) => void;
  replyBody: string;
  setReplyBody: (v: string) => void;
  replyError: string;
  replySubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div
      className="ml-6 mt-2 rounded-xl p-4"
      style={{ background: 'rgba(26,19,97,0.4)', border: '1.5px solid rgba(0,250,97,0.15)' }}
    >
      <p className="text-xs text-white/40 mb-3">
        Reageer op <span style={{ color: '#00FA61' }}>{replyTo.username}</span>
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="Gebruikersnaam"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={60}
          className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(0,250,97,0.2)', fontFamily: 'Montserrat, sans-serif' }}
        />
        <textarea
          placeholder="Schrijf je reactie..."
          value={replyBody}
          onChange={(e) => setReplyBody(e.target.value)}
          rows={3}
          maxLength={1000}
          className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none resize-none"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(0,250,97,0.2)', fontFamily: 'Montserrat, sans-serif' }}
        />
        {replyError && <p className="text-red-400 text-xs font-semibold">{replyError}</p>}
        <button
          type="submit"
          disabled={replySubmitting}
          className="self-start px-4 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: '#00FA61', color: '#1a1361', fontFamily: 'Montserrat, sans-serif' }}
        >
          {replySubmitting ? 'Plaatsen...' : 'Reactie plaatsen'}
        </button>
      </form>
    </div>
  );
}

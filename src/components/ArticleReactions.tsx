'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  articleId: string;
}

type ReactionType = 'thumbs_up' | 'fire';

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'thumbs_up', emoji: '👍', label: 'Leuk' },
  { type: 'fire',      emoji: '🔥', label: 'Hot' },
];

function getFingerprint(): string {
  let fp = localStorage.getItem('gp_fingerprint');
  if (!fp) {
    fp = crypto.randomUUID();
    localStorage.setItem('gp_fingerprint', fp);
  }
  return fp;
}

export default function ArticleReactions({ articleId }: Props) {
  const [counts, setCounts]   = useState<Record<ReactionType, number>>({ thumbs_up: 0, fire: 0 });
  const [mine, setMine]       = useState<Record<ReactionType, boolean>>({ thumbs_up: false, fire: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fp = getFingerprint();
    const supabase = createClient();

    supabase
      .from('reactions')
      .select('type, fingerprint')
      .eq('article_id', articleId)
      .then(({ data }) => {
        const rows = data ?? [];
        const newCounts: Record<ReactionType, number> = { thumbs_up: 0, fire: 0 };
        const newMine:   Record<ReactionType, boolean> = { thumbs_up: false, fire: false };
        for (const r of rows) {
          if (r.type in newCounts) newCounts[r.type as ReactionType]++;
          if (r.fingerprint === fp) newMine[r.type as ReactionType] = true;
        }
        setCounts(newCounts);
        setMine(newMine);
        setLoading(false);
      });
  }, [articleId]);

  async function toggle(type: ReactionType) {
    const fp = getFingerprint();
    const supabase = createClient();

    if (mine[type]) {
      await supabase
        .from('reactions')
        .delete()
        .eq('article_id', articleId)
        .eq('fingerprint', fp)
        .eq('type', type);
      setCounts((c) => ({ ...c, [type]: Math.max(0, c[type] - 1) }));
      setMine((m) => ({ ...m, [type]: false }));
    } else {
      await supabase
        .from('reactions')
        .insert({ article_id: articleId, fingerprint: fp, type });
      setCounts((c) => ({ ...c, [type]: c[type] + 1 }));
      setMine((m) => ({ ...m, [type]: true }));
    }
  }

  if (loading) return null;

  return (
    <div
      style={{ fontFamily: 'Montserrat, sans-serif' }}
      className="flex items-center gap-3 my-8"
    >
      <span className="text-white/40 text-sm font-semibold">Reactie:</span>
      {REACTIONS.map(({ type, emoji, label }) => (
        <button
          key={type}
          onClick={() => toggle(type)}
          style={{
            background: mine[type] ? 'rgba(0,250,97,0.15)' : 'rgba(255,255,255,0.06)',
            border: `1.5px solid ${mine[type] ? '#00FA61' : 'rgba(255,255,255,0.12)'}`,
            color: mine[type] ? '#00FA61' : 'rgba(255,255,255,0.6)',
            fontFamily: 'Montserrat, sans-serif',
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
        >
          <span className="text-base">{emoji}</span>
          <span>{counts[type]}</span>
          <span className="text-xs opacity-70">{label}</span>
        </button>
      ))}
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Instagram, ArrowRight } from 'lucide-react';

interface Props {
  params: { id: string };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function ManagerProfilePage({ params }: Props) {
  const supabase = createClient();

  const [{ data: manager }, { data: articles }] = await Promise.all([
    supabase
      .from('managers')
      .select('id, name, role, bio, rank_geschiedenis, avatar_url, instagram_url')
      .eq('id', params.id)
      .single(),
    supabase
      .from('articles')
      .select('id, title, slug, excerpt, cover_image, published_at, category')
      .eq('author_id', params.id)
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(6),
  ]);

  if (!manager) notFound();

  return (
    <main className="min-h-screen bg-background-dark text-white">
      {/* Hero */}
      <div className="relative pt-20 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,250,97,0.05) 0%, transparent 100%)' }} />
        <div className="max-w-4xl mx-auto relative z-10">
          <Link href="/#managers" className="inline-flex items-center gap-2 text-white/40 hover:text-primary text-sm font-medium transition-colors mb-10">
            <ArrowLeft size={14} />Terug naar managers
          </Link>

          <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center">
            {/* Avatar */}
            {manager.avatar_url ? (
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden ring-4 ring-primary/30 shrink-0">
                <Image src={manager.avatar_url} alt={manager.name} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-surface-2 ring-4 ring-primary/30 flex items-center justify-center shrink-0">
                <span className="text-5xl font-bold text-primary">{manager.name.charAt(0)}</span>
              </div>
            )}

            <div>
              <span className="text-xs font-semibold text-primary uppercase tracking-widest mb-1 block">Manager</span>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-1">{manager.name}</h1>
              {manager.role && <p className="text-primary text-sm font-medium mb-3">{manager.role}</p>}
              {manager.bio && <p className="text-white/60 text-base leading-relaxed max-w-xl">{manager.bio}</p>}

              {manager.instagram_url && (
                <a
                  href={manager.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 bg-surface-2 border border-white/10 text-white/70 hover:text-primary hover:border-primary/30 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                >
                  <Instagram size={14} /> Instagram volgen
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rank geschiedenis + Bio secties */}
      {(manager.rank_geschiedenis || manager.bio) && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 space-y-8">

          {/* Rank geschiedenis */}
          {manager.rank_geschiedenis && (
            <div>
              <h2 className="text-lg font-bold mb-2" style={{ color: '#00FA61' }}>
                Beste FPL prestatie
              </h2>
              <p className="text-white/70 text-base leading-relaxed whitespace-pre-line">
                {manager.rank_geschiedenis}
              </p>
            </div>
          )}

          {/* Bio */}
          {manager.bio && (
            <div>
              <h2 className="text-lg font-bold mb-2" style={{ color: '#00FA61' }}>
                Over
              </h2>
              <p className="text-white/70 text-base leading-relaxed whitespace-pre-line">
                {manager.bio}
              </p>
            </div>
          )}

        </div>
      )}

      {/* Articles */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <h2 className="text-2xl font-bold text-white mb-8">
          Artikelen van {manager.name}
        </h2>

        {articles && articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((a) => (
              <Link key={a.id} href={`/artikelen/${a.slug}`} className="card-lift bg-surface-2 border border-white/8 hover:border-primary/20 rounded-2xl overflow-hidden group transition-all duration-200 hover:shadow-lg hover:shadow-black/30 cursor-pointer">
                <div className="relative h-44 bg-surface-3">
                  {a.cover_image ? (
                    <Image src={a.cover_image} alt={a.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,250,97,0.08) 0%, rgba(123,47,255,0.12) 100%)' }}>
                      <span className="font-bold text-5xl text-primary/20">GP</span>
                    </div>
                  )}
                  {a.category && (
                    <span className="absolute top-3 left-3 bg-primary text-black text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">{a.category}</span>
                  )}
                </div>
                <div className="p-5">
                  {a.published_at && <p className="text-xs text-white/30 mb-2">{formatDate(a.published_at)}</p>}
                  <h3 className="font-bold text-lg text-white mb-2 leading-snug group-hover:text-primary transition-colors line-clamp-2">{a.title}</h3>
                  {a.excerpt && <p className="text-sm text-white/50 leading-relaxed line-clamp-2 mb-4">{a.excerpt}</p>}
                  <span className="inline-flex items-center gap-1 text-primary text-sm font-semibold">
                    Lees meer <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center border border-dashed border-white/10 rounded-2xl">
            <p className="text-white/30 text-sm">{manager.name} heeft nog geen artikelen gepubliceerd.</p>
          </div>
        )}
      </div>
    </main>
  );
}

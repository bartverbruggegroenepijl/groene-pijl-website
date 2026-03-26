'use client';

import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

const CATEGORIES = ['Alle', 'Transfers', 'Captain', 'Wildcard', 'Differentials', 'GW Preview', 'GW Review'];

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string | null;
  category: string | null;
  managers: { name: string } | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ArtikelenPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [activeCategory, setActiveCategory] = useState('Alle');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('articles')
      .select('id, title, slug, excerpt, cover_image, published_at, category, managers(name)')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .then(({ data }) => {
        setArticles((data as Article[] | null) ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = activeCategory === 'Alle'
    ? articles
    : articles.filter((a) => a.category === activeCategory);

  return (
    <main className="min-h-screen bg-background-dark text-white">
      {/* Hero */}
      <div className="relative py-24 px-4 overflow-hidden" style={{ background: 'linear-gradient(180deg, rgba(0,250,97,0.06) 0%, transparent 100%)' }}>
        <div className="max-w-8xl mx-auto">
          <span className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-3">Blog</span>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-4">
            ARTIKELEN &amp;{' '}
            <span className="text-gradient">ANALYSE</span>
          </h1>
          <p className="text-white/50 text-lg max-w-xl">
            Diepgaande FPL-analyses, transfer tips en gameweek previews van de managers van De Groene Pijl.
          </p>
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-10 -mt-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-primary text-black'
                  : 'bg-surface-2 border border-white/10 text-white/60 hover:text-white hover:border-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-surface-2 border border-white/8 rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((a) => (
              <Link
                key={a.id}
                href={`/artikelen/${a.slug}`}
                className="card-lift bg-surface-2 border border-white/8 hover:border-primary/20 rounded-2xl overflow-hidden group transition-all cursor-pointer block hover:shadow-xl hover:shadow-primary/10 hover:opacity-90"
              >
                <div className="relative h-48 bg-surface-3">
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
                  {/* Excerpt overlay — fade-in op hover, alleen desktop */}
                  {a.excerpt && (
                    <div
                      className="hidden md:block absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-[250ms] ease-in-out"
                      style={{ background: 'linear-gradient(to top, rgba(31,14,132,0.95) 0%, rgba(31,14,132,0.7) 70%, transparent 100%)' }}
                    >
                      <p
                        className="text-white italic line-clamp-3"
                        style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '14px' }}
                      >
                        {a.excerpt}
                      </p>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs text-white/30 mb-2">
                    {a.managers?.name && <span>{a.managers.name}</span>}
                    {a.published_at && <><span>·</span><span>{formatDate(a.published_at)}</span></>}
                  </div>
                  <h2 className="font-bold text-lg text-white mb-2 leading-snug group-hover:text-primary transition-colors line-clamp-2">{a.title}</h2>
                  {a.excerpt && <p className="text-sm text-white/50 leading-relaxed line-clamp-2 mb-4">{a.excerpt}</p>}
                  <span className="inline-flex items-center gap-1 text-primary text-sm font-semibold group-hover:underline">
                    Lees meer <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center border border-dashed border-white/10 rounded-2xl">
            <p className="text-white/30 text-sm">
              {activeCategory === 'Alle' ? 'Nog geen artikelen gepubliceerd.' : `Geen artikelen in categorie "${activeCategory}".`}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

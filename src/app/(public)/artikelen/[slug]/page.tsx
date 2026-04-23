import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkHtml from 'remark-html';

interface Props {
  params: { slug: string };
}

async function markdownToHtml(markdown: string): Promise<string> {
  // remarkGfm voegt GFM-ondersteuning toe (tabellen, strikethrough, task lists, etc.)
  // sanitize: false zodat embedded afbeeldingen en HTML in content behouden blijven
  const result = await remark()
    .use(remarkGfm)
    .use(remarkHtml, { sanitize: false })
    .process(markdown);
  return result.toString();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function ArtikelDetailPage({ params }: Props) {
  const supabase = createClient();

  const [{ data: article }, { data: related }] = await Promise.all([
    supabase
      .from('articles')
      .select('id, title, slug, excerpt, content, cover_image, published_at, category, managers(id, name, slug, avatar_url)')
      .eq('slug', params.slug)
      .eq('published', true)
      .single(),
    supabase
      .from('articles')
      .select('id, title, slug, excerpt, cover_image, published_at, category')
      .eq('published', true)
      .neq('slug', params.slug)
      .order('published_at', { ascending: false })
      .limit(3),
  ]);

  if (!article) notFound();

  const contentHtml = article.content ? await markdownToHtml(article.content) : '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const author = article.managers as any;

  return (
    <main
      className="min-h-screen text-white"
      style={{
        background: '#000000',
        minHeight: '100vh',
      }}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back */}
        <Link href="/artikelen" className="inline-flex items-center gap-2 text-white/40 hover:text-primary text-sm font-medium transition-colors mb-8">
          <ArrowLeft size={14} />Alle artikelen
        </Link>

        {/* Cover afbeelding */}
        {article.cover_image && (
          <div className="mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.cover_image}
              alt={article.title}
              style={{
                width: '100%',
                maxHeight: '400px',
                objectFit: 'cover',
                borderRadius: '12px',
                display: 'block',
              }}
            />
          </div>
        )}

        {/* Category */}
        {article.category && (
          <span className="inline-block bg-primary text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-4">
            {article.category}
          </span>
        )}

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
          {article.title}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 mb-8 pb-8 border-b border-white/8">
          {author && (
            <div className="flex items-center gap-2.5">
              {author.avatar_url ? (
                <div className="relative w-8 h-8 rounded-full overflow-hidden">
                  <Image src={author.avatar_url} alt={author.name} fill className="object-cover" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <User size={14} className="text-primary" />
                </div>
              )}
              <span className="text-sm font-semibold text-white">{author.name}</span>
            </div>
          )}
          {article.published_at && (
            <div className="flex items-center gap-1.5 text-white/70 text-sm">
              <Calendar size={13} />
              {formatDate(article.published_at)}
            </div>
          )}
        </div>

        {/* Content */}
        {contentHtml ? (
          <div
            className="article-content"
            style={{ fontSize: '18px', lineHeight: '1.75' }}
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        ) : article.excerpt ? (
          <p className="text-white/70 leading-relaxed text-lg">{article.excerpt}</p>
        ) : (
          <p className="text-white/40">Geen inhoud beschikbaar.</p>
        )}
      </div>

      {/* Related articles */}
      {related && related.length > 0 && (
        <div className="border-t border-white/8 bg-surface-1 py-16 px-4">
          <div className="max-w-8xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-8">Meer Artikelen</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {related.map((r) => (
                <Link key={r.id} href={`/artikelen/${r.slug}`} className="card-lift bg-surface-2 border border-white/8 hover:border-primary/20 rounded-xl overflow-hidden group transition-colors">
                  <div className="relative h-36 bg-surface-3">
                    {r.cover_image ? (
                      <Image src={r.cover_image} alt={r.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,250,97,0.08) 0%, rgba(123,47,255,0.12) 100%)' }}>
                        <span className="font-bold text-3xl text-primary/20">GP</span>
                      </div>
                    )}
                    {r.category && (
                      <span className="absolute top-2 left-2 bg-primary text-black text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">{r.category}</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-sm text-white group-hover:text-primary transition-colors line-clamp-2 leading-snug">{r.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

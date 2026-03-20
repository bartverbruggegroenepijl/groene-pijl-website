'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';
import type { Article, Manager } from '@/types';
import { ARTICLE_CATEGORIES } from '@/types';
import ArticleImageUpload from '@/components/admin/ArticleImageUpload';
import { createClient } from '@/lib/supabase/client';
import { uploadArticleImage } from '@/lib/supabase/storage';
import '@uiw/react-md-editor/markdown-editor.css';

// Dynamic import om SSR-issues te vermijden
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="w-full rounded-lg animate-pulse" style={{ height: 500, background: '#111111', border: '1px solid rgba(255,255,255,0.1)' }} />
    ),
  }
);

// ─── Slug helper ─────────────────────────────────────────────

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ─── Props ───────────────────────────────────────────────────

interface ArticleFormProps {
  managers: Pick<Manager, 'id' | 'name'>[];
  article?: Article;
  action: (formData: FormData) => Promise<void>;
  mode: 'nieuw' | 'bewerken';
}

// ─── Input / Textarea helpers ─────────────────────────────────

const inputClass =
  'w-full bg-[#111111] border border-white/10 text-white placeholder-gray-600 ' +
  'rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ' +
  'focus:ring-[#00A651] focus:border-transparent transition-all';

const labelClass = 'block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5';

// ─── Component ───────────────────────────────────────────────

export default function ArticleForm({ managers, article, action, mode }: ArticleFormProps) {
  const [isPending, startTransition] = useTransition();

  const [title, setTitle]         = useState(article?.title ?? '');
  const [slug, setSlug]           = useState(article?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerpt, setExcerpt]     = useState(article?.excerpt ?? '');
  const [content, setContent]     = useState(article?.content ?? '');
  const [coverImage, setCoverImage] = useState(article?.cover_image ?? '');
  const [authorId, setAuthorId]   = useState(article?.author_id ?? '');
  const [category, setCategory]   = useState(article?.category ?? '');
  const [published, setPublished] = useState(article?.published ?? false);
  const [error, setError]         = useState('');

  // ─── Inline afbeelding invoegen ───────────────────────────
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError]         = useState('');
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const imageInputRef      = useRef<HTMLInputElement>(null);

  async function handleInlineImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input zodat hetzelfde bestand opnieuw gekozen kan worden
    if (imageInputRef.current) imageInputRef.current.value = '';

    const TOEGESTAAN = ['image/jpeg', 'image/png', 'image/webp'];
    if (!TOEGESTAAN.includes(file.type)) {
      setImageError('Alleen JPG, PNG of WebP toegestaan.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Maximaal 5 MB per afbeelding.');
      return;
    }

    setImageError('');
    setImageUploading(true);
    try {
      const supabase = createClient();
      const url = await uploadArticleImage(supabase, file, title || 'inline');
      const markdownAfbeelding = `\n![afbeelding](${url})\n`;

      // Voeg in op de cursorpositie in de editor-textarea
      const textarea = editorContainerRef.current?.querySelector('textarea');
      if (textarea) {
        const start = textarea.selectionStart ?? content.length;
        const end   = textarea.selectionEnd   ?? content.length;
        const nieuweInhoud =
          content.substring(0, start) + markdownAfbeelding + content.substring(end);
        setContent(nieuweInhoud);
      } else {
        setContent((prev) => prev + markdownAfbeelding);
      }
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Upload mislukt.');
    } finally {
      setImageUploading(false);
    }
  }

  // Auto-generate slug from title unless user has manually edited it
  useEffect(() => {
    if (!slugTouched) {
      setSlug(toSlug(title));
    }
  }, [title, slugTouched]);

  function handleSlugChange(value: string) {
    setSlugTouched(true);
    setSlug(toSlug(value));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (!title.trim()) { setError('Titel is verplicht.'); return; }
    if (!slug.trim())  { setError('Slug is verplicht.'); return; }

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await action(formData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Er is een fout opgetreden.');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Paginaheader */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/artikelen"
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Terug
          </Link>
          <div>
            <h1
              className="text-white"
              style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem', letterSpacing: '0.05em' }}
            >
              {mode === 'nieuw' ? 'Nieuw Artikel' : 'Artikel Bewerken'}
            </h1>
            <p className="text-gray-500 text-sm">
              {mode === 'nieuw' ? 'Vul de velden in en sla op.' : `Bewerk "${article?.title}"`}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-[#00A651] hover:bg-[#009147] text-white
                     font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors
                     disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isPending ? 'Opslaan...' : 'Opslaan'}
        </button>
      </div>

      {/* Foutmelding */}
      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30
                        rounded-lg px-4 py-3 mb-6 text-red-400 text-sm">
          <span>⚠</span> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Hoofdkolom ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Titel */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-5">
            <label htmlFor="title" className={labelClass}>Titel *</label>
            <input
              id="title"
              name="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Bijv. Gameweek 28 analyse"
              className={inputClass}
            />
          </div>

          {/* Slug */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-5">
            <label htmlFor="slug" className={labelClass}>
              Slug *
              <span className="ml-2 text-gray-600 normal-case font-normal tracking-normal">
                (auto-gegenereerd vanuit titel)
              </span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-sm flex-shrink-0">/artikelen/</span>
              <input
                id="slug"
                name="slug"
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                required
                placeholder="gameweek-28-analyse"
                className={inputClass}
              />
            </div>
          </div>

          {/* Excerpt */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-5">
            <label htmlFor="excerpt" className={labelClass}>Excerpt</label>
            <textarea
              id="excerpt"
              name="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              placeholder="Korte samenvatting van het artikel..."
              className={inputClass + ' resize-none'}
            />
          </div>

          {/* Content — rich text editor */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-5">

            {/* Header: label + foto-invoeg-knop */}
            <div className="flex items-center justify-between mb-2">
              <span className={labelClass} style={{ marginBottom: 0 }}>Content</span>
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={imageUploading}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#00A651]
                           border border-white/10 hover:border-[#00A651]/40 bg-white/3
                           hover:bg-[#00A651]/5 px-3 py-1.5 rounded-lg transition-all
                           disabled:opacity-50 disabled:cursor-wait"
              >
                {imageUploading ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploaden...</>
                ) : (
                  <>📷 Foto invoegen</>
                )}
              </button>
              {/* Verborgen file input voor inline afbeeldingen */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleInlineImageUpload}
                className="hidden"
              />
            </div>

            {/* Upload fout */}
            {imageError && (
              <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30
                              rounded-lg px-3 py-2 mb-2 text-red-400 text-xs">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {imageError}
              </div>
            )}

            {/* Hidden input zodat FormData de markdown-waarde meekrijgt */}
            <input type="hidden" name="content" value={content} />

            <div data-color-mode="dark" ref={editorContainerRef}>
              <MDEditor
                value={content}
                onChange={(val) => setContent(val ?? '')}
                height={500}
                visibleDragbar={false}
                preview="edit"
                style={{
                  background: '#111111',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-600">
              Markdown ondersteund · H1–H3, **vet**, *cursief*, lijsten, links, blockquotes, code · gebruik &quot;📷 Foto invoegen&quot; voor afbeeldingen
            </p>
          </div>
        </div>

        {/* ── Zijkolom ───────────────────────────────────── */}
        <div className="space-y-5">

          {/* Publicatiestatus */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-5">
            <p className={labelClass}>Status</p>
            <input type="hidden" name="published" value={published ? 'true' : 'false'} />
            <button
              type="button"
              onClick={() => setPublished(!published)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border
                          text-sm font-medium transition-all duration-200
                          ${published
                            ? 'bg-[#00A651]/15 border-[#00A651]/40 text-[#00A651]'
                            : 'bg-white/5 border-white/10 text-gray-400'
                          }`}
            >
              <span>{published ? 'Gepubliceerd' : 'Concept'}</span>
              <div className={`w-10 h-5 rounded-full transition-colors relative
                               ${published ? 'bg-[#00A651]' : 'bg-gray-700'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow
                                 transition-transform duration-200
                                 ${published ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </button>
          </div>

          {/* Auteur */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-5">
            <label htmlFor="author_id" className={labelClass}>Auteur</label>
            <select
              id="author_id"
              name="author_id"
              value={authorId}
              onChange={(e) => setAuthorId(e.target.value)}
              className={inputClass + ' cursor-pointer'}
            >
              <option value="">— Kies een auteur —</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Categorie */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-5">
            <label htmlFor="category" className={labelClass}>Categorie</label>
            <select
              id="category"
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass + ' cursor-pointer'}
            >
              <option value="">— Geen categorie —</option>
              {ARTICLE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Cover afbeelding */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-5 space-y-4">
            <p className={labelClass}>Cover afbeelding</p>

            {/* Hidden input passes the value to the server action */}
            <input type="hidden" name="cover_image" value={coverImage} />

            {/* Upload component */}
            <ArticleImageUpload
              value={coverImage}
              onChange={(url) => setCoverImage(url)}
              title={title}
            />

            {/* Optioneel: URL invoer */}
            <div>
              <label htmlFor="cover_image_url" className="block text-xs text-gray-600 mb-1">
                Of gebruik een externe URL (optioneel)
              </label>
              <input
                id="cover_image_url"
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://..."
                className={inputClass}
              />
            </div>
          </div>

          {/* Meta info bij bewerken */}
          {article && (
            <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-5 space-y-2">
              <p className={labelClass}>Meta</p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>
                  Aangemaakt:{' '}
                  <span className="text-gray-400">
                    {new Date(article.created_at).toLocaleDateString('nl-NL')}
                  </span>
                </p>
                {article.published_at && (
                  <p>
                    Gepubliceerd:{' '}
                    <span className="text-gray-400">
                      {new Date(article.published_at).toLocaleDateString('nl-NL')}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}

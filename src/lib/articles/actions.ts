'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// ─── Create ──────────────────────────────────────────────────

export async function createArticle(formData: FormData) {
  const supabase = createClient();

  const published     = formData.get('published') === 'true';
  const dateStr       = (formData.get('published_at') as string) || '';
  const publishedAt   = dateStr ? new Date(dateStr).toISOString() : null;

  const { error } = await supabase.from('articles').insert({
    title:       formData.get('title') as string,
    slug:        formData.get('slug') as string,
    excerpt:     (formData.get('excerpt') as string) || null,
    content:     (formData.get('content') as string) || null,
    cover_image: (formData.get('cover_image') as string) || null,
    author_id:   (formData.get('author_id') as string) || null,
    category:    (formData.get('category') as string) || null,
    published,
    published_at: publishedAt,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/admin/artikelen');
  redirect('/admin/artikelen');
}

// ─── Update ──────────────────────────────────────────────────

export async function updateArticle(id: string, formData: FormData) {
  const supabase = createClient();

  const published     = formData.get('published') === 'true';
  const dateStr       = (formData.get('published_at') as string) || '';
  const publishedAt   = dateStr ? new Date(dateStr).toISOString() : null;

  const { error } = await supabase
    .from('articles')
    .update({
      title:       formData.get('title') as string,
      slug:        formData.get('slug') as string,
      excerpt:     (formData.get('excerpt') as string) || null,
      content:     (formData.get('content') as string) || null,
      cover_image: (formData.get('cover_image') as string) || null,
      author_id:   (formData.get('author_id') as string) || null,
      category:    (formData.get('category') as string) || null,
      published,
      published_at: publishedAt,
    })
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/admin/artikelen');
  revalidatePath(`/admin/artikelen/${id}/bewerken`);
  redirect('/admin/artikelen');
}

// ─── Delete ──────────────────────────────────────────────────

export async function deleteArticle(id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('articles')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/admin/artikelen');
}

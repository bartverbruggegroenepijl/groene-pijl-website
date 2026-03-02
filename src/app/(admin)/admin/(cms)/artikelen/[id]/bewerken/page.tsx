import { createClient } from '@/lib/supabase/server';
import { updateArticle } from '@/lib/articles/actions';
import ArticleForm from '@/components/admin/ArticleForm';
import { notFound } from 'next/navigation';
import type { Article } from '@/types';

interface BewerkenPageProps {
  params: { id: string };
}

export default async function BewerkenPage({ params }: BewerkenPageProps) {
  const supabase = createClient();

  const [{ data: article, error }, { data: managers }] = await Promise.all([
    supabase
      .from('articles')
      .select('*, managers(id, name)')
      .eq('id', params.id)
      .single(),
    supabase
      .from('managers')
      .select('id, name')
      .order('name'),
  ]);

  if (error || !article) {
    notFound();
  }

  // Bind the article id to the update action
  const updateArticleWithId = updateArticle.bind(null, params.id);

  return (
    <ArticleForm
      managers={managers ?? []}
      article={article as Article}
      action={updateArticleWithId}
      mode="bewerken"
    />
  );
}

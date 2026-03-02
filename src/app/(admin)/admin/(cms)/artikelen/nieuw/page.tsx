import { createClient } from '@/lib/supabase/server';
import { createArticle } from '@/lib/articles/actions';
import ArticleForm from '@/components/admin/ArticleForm';

export default async function NieuwArtikelPage() {
  const supabase = createClient();

  const { data: managers } = await supabase
    .from('managers')
    .select('id, name')
    .order('name');

  return (
    <ArticleForm
      managers={managers ?? []}
      action={createArticle}
      mode="nieuw"
    />
  );
}

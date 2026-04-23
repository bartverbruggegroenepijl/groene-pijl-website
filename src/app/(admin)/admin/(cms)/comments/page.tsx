import { createClient } from '@/lib/supabase/server';
import CommentsClient from './CommentsClient';

export default async function CommentsPage() {
  const supabase = createClient();

  const { data: comments } = await supabase
    .from('comments')
    .select('id, username, content, created_at, parent_id, articles(title, slug)')
    .order('created_at', { ascending: false });

  const rows = (comments ?? []) as unknown as {
    id: string;
    username: string;
    content: string;
    created_at: string;
    parent_id: string | null;
    articles: { title: string; slug: string } | null;
  }[];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-white"
            style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem', letterSpacing: '0.05em' }}
          >
            Comments
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {rows.length} {rows.length === 1 ? 'reactie' : 'reacties'} in totaal
          </p>
        </div>
      </div>

      <CommentsClient initialRows={rows} />
    </div>
  );
}

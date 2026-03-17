import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: managers } = await supabase
    .from('managers')
    .select('id, name, avatar_url')
    .order('name', { ascending: true });

  return (
    <>
      <Navbar />
      {children}
      <Footer managers={managers ?? []} />
    </>
  );
}

import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import PlayerNewsSidebar from '@/components/ui/PlayerNewsSidebar';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: managers } = await supabase
    .from('managers')
    .select('id, name, avatar_url')
    .order('created_at', { ascending: true });

  return (
    <>
      <Navbar managers={managers ?? []} />

      {/* Main content + sidebar */}
      <div className="flex min-h-screen">
        {/* Page content — takes remaining width */}
        <div className="flex-1 min-w-0">
          {children}
        </div>

        {/* Spelersnieuws sidebar — fixed 280px, desktop only */}
        <div className="hidden lg:block w-[280px] shrink-0">
          <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-hidden">
            <PlayerNewsSidebar />
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

import { createClient } from '@/lib/supabase/server';
import ClubsManager from '@/components/admin/ClubsManager';

export default async function ClubsPage() {
  const supabase = createClient();

  const { data: clubs } = await supabase
    .from('clubs')
    .select('id, name, short_name, shirt_image_url')
    .order('name');

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-white text-2xl font-bold" style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem', letterSpacing: '0.05em' }}>
          Premier League Clubs
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Upload shirt afbeeldingen per club voor het Team van de Week.
        </p>
      </div>
      <ClubsManager clubs={clubs ?? []} />
    </div>
  );
}

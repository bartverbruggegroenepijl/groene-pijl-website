import { createClient } from '@/lib/supabase/server';
import HeroImageUpload from '@/components/admin/HeroImageUpload';
import MobileHeroImageUpload from '@/components/admin/MobileHeroImageUpload';
import { Settings, Image as ImageIcon, Smartphone, Info } from 'lucide-react';

export default async function InstellingenPage() {
  const supabase = createClient();

  const { data: heroSetting } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'hero_image')
    .maybeSingle();

  const heroImageUrl = (heroSetting as { value: string } | null)?.value ?? null;

  const { data: mobileHeroSetting } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'mobile_hero_image')
    .maybeSingle();

  const mobileHeroImageUrl = (mobileHeroSetting as { value: string } | null)?.value ?? null;

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[#00A651]/15 flex items-center justify-center flex-shrink-0">
          <Settings className="w-5 h-5 text-[#00A651]" />
        </div>
        <div>
          <h1
            className="text-white"
            style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem', letterSpacing: '0.05em' }}
          >
            Instellingen
          </h1>
          <p className="text-gray-500 text-sm">Beheer de algemene instellingen van de website.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Hero afbeelding */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-[#00A651]/15 flex items-center justify-center flex-shrink-0">
                <ImageIcon className="w-4 h-4 text-[#00A651]" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Hero Afbeelding</p>
                <p className="text-gray-500 text-xs">
                  Grote afbeelding rechtsboven in de hero sectie op de homepage.
                </p>
              </div>
            </div>

            <HeroImageUpload currentUrl={heroImageUrl} />
          </div>

          {/* Mobiele Hero Afbeelding */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-[#00A651]/15 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-4 h-4 text-[#00A651]" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Mobiele Hero Afbeelding</p>
                <p className="text-gray-500 text-xs">
                  Foto die onder de hero wordt getoond op mobiel. Aanbevolen: 800×400px.
                </p>
              </div>
            </div>

            <MobileHeroImageUpload currentUrl={mobileHeroImageUrl} />
          </div>

        </div>

        {/* Info column */}
        <div className="space-y-5">
          <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-gray-500" />
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest">Info</p>
            </div>
            <ul className="space-y-2 text-xs text-gray-500 leading-relaxed">
              <li>• De hero afbeelding wordt getoond als grote foto rechtsboven op de homepage.</li>
              <li>• Als er geen hero afbeelding is ingesteld, wordt de podcast cover foto gebruikt.</li>
              <li>• Aanbevolen formaat desktop hero: 800×800px of groter.</li>
              <li>• De mobiele hero afbeelding verschijnt direct onder de hero tekst op telefoons.</li>
              <li>• Aanbevolen formaat mobiel: 800×400px of breder.</li>
              <li>• Maximale bestandsgrootte: 5 MB. Formaten: JPG, PNG, WebP.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}

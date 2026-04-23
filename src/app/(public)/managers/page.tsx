import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';
import Link from 'next/link';
import { Instagram } from 'lucide-react';

export default async function ManagersPage() {
  const supabase = createClient();

  const { data: managers } = await supabase
    .from('managers')
    .select('id, name, slug, role, bio, avatar_url, instagram_url')
    .order('name', { ascending: true });

  return (
    <main
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #1a1361 0%, #1F0E84 40%, #2D1B69 70%, #0d3d2a 100%)',
      }}
    >
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">

        {/* Header */}
        <div className="mb-12">
          <span
            style={{
              display: 'inline-block',
              fontSize: 11,
              fontWeight: 600,
              color: '#00FA61',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: 10,
              fontFamily: 'Montserrat, sans-serif',
            }}
          >
            Het Team
          </span>
          <h1
            style={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(32px, 5vw, 56px)',
              color: 'white',
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            De Managers
          </h1>
        </div>

        {/* Grid */}
        {(managers ?? []).length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(managers ?? []).map((m) => (
              <Link
                key={m.id}
                href={`/managers/${m.slug}`}
                className="group flex flex-col items-center text-center gap-4 rounded-2xl p-6 border border-white/8 hover:border-primary/40 transition-all duration-300 card-lift"
                style={{
                  textDecoration: 'none',
                  cursor: 'pointer',
                  background: 'rgba(255,255,255,0.04)',
                }}
              >
                {/* Avatar */}
                {m.avatar_url ? (
                  <div
                    className="relative rounded-full overflow-hidden ring-2 ring-white/10 group-hover:ring-primary/40 shrink-0 transition-all duration-300"
                    style={{ width: 96, height: 96 }}
                  >
                    <Image src={m.avatar_url} alt={m.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div
                    className="rounded-full flex items-center justify-center ring-2 ring-white/10 group-hover:ring-primary/40 shrink-0 transition-all duration-300"
                    style={{ width: 96, height: 96, background: 'rgba(255,255,255,0.08)' }}
                  >
                    <span style={{ fontSize: 36, fontWeight: 700, color: '#00FA61' }}>
                      {m.name.charAt(0)}
                    </span>
                  </div>
                )}

                {/* Name + role */}
                <div>
                  <h2
                    className="font-bold text-xl leading-tight group-hover:text-primary transition-colors duration-200"
                    style={{
                      color: 'rgba(255,255,255,0.7)',
                      fontFamily: 'Montserrat, sans-serif',
                    }}
                  >
                    {m.name}
                  </h2>
                  {m.role && (
                    <p
                      style={{
                        color: '#00FA61',
                        fontSize: 11,
                        fontWeight: 600,
                        marginTop: 3,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        fontFamily: 'Montserrat, sans-serif',
                      }}
                    >
                      {m.role}
                    </p>
                  )}
                </div>

                {/* Bio */}
                {m.bio && (
                  <p
                    className="text-xs leading-relaxed line-clamp-3"
                    style={{
                      color: 'rgba(255,255,255,0.4)',
                      fontFamily: 'Montserrat, sans-serif',
                    }}
                  >
                    {m.bio}
                  </p>
                )}

                {/* Instagram */}
                {m.instagram_url && (
                  <span
                    className="flex items-center gap-1.5 text-xs mt-auto"
                    style={{ color: 'rgba(200,33,195,0.6)' }}
                  >
                    <Instagram size={12} />Instagram
                  </span>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div
            className="py-20 text-center rounded-2xl"
            style={{ border: '1px dashed rgba(255,255,255,0.1)' }}
          >
            <p
              style={{
                color: 'rgba(255,255,255,0.3)',
                fontSize: 14,
                fontFamily: 'Montserrat, sans-serif',
              }}
            >
              Nog geen managers beschikbaar.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

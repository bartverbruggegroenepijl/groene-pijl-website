import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { FileText, Headphones, Trophy, ArrowRight } from 'lucide-react';

const sections = [
  {
    href: '/admin/artikelen',
    icon: FileText,
    label: 'Artikelen',
    description: 'Schrijf en beheer nieuwsartikelen en analyses.',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    iconColor: 'text-blue-400',
  },
  {
    href: '/admin/afleveringen',
    icon: Headphones,
    label: 'Afleveringen',
    description: 'Bekijk en sync podcast-afleveringen via de RSS feed.',
    color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    iconColor: 'text-purple-400',
  },
  {
    href: '/admin/team-van-de-week',
    icon: Trophy,
    label: 'Team van de Week',
    description: 'Stel het FPL team van de week samen en publiceer het.',
    color: 'bg-[#00A651]/10 text-[#00A651] border-[#00A651]/20',
    iconColor: 'text-[#00A651]',
  },
];

export default async function AdminDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div className="mb-10">
        <h1
          className="text-white mb-1"
          style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.8rem', letterSpacing: '0.05em' }}
        >
          Welkom terug 👋
        </h1>
        <p className="text-gray-400 text-base">
          Ingelogd als{' '}
          <span className="text-[#00A651] font-medium">{user?.email}</span>
        </p>
      </div>

      {/* Status balk */}
      <div className="flex items-center gap-2 bg-[#00A651]/10 border border-[#00A651]/25 rounded-xl px-5 py-3.5 mb-10">
        <span className="w-2 h-2 rounded-full bg-[#00A651] animate-pulse" />
        <p className="text-[#00A651] text-sm font-medium">
          De Groene Pijl CMS is actief en verbonden met Supabase.
        </p>
      </div>

      {/* Navigatie kaarten */}
      <div>
        <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-4">
          Beheer
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sections.map(({ href, icon: Icon, label, description, color, iconColor }) => (
            <Link
              key={href}
              href={href}
              className="group bg-[#1a1a1a] border border-white/8 rounded-xl p-6
                         hover:border-white/15 hover:bg-[#1f1f1f]
                         transition-all duration-200 flex flex-col gap-4"
            >
              <div className={`w-11 h-11 rounded-lg border flex items-center justify-center ${color}`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>

              <div className="flex-1">
                <h3 className="text-white font-semibold text-base mb-1">{label}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
              </div>

              <div className="flex items-center gap-1 text-gray-600 group-hover:text-gray-400 transition-colors text-sm">
                Beheren
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer info */}
      <div className="mt-12 pt-8 border-t border-white/8">
        <p className="text-gray-700 text-xs text-center">
          De Groene Pijl CMS · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

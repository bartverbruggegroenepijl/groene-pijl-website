'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from '@/lib/auth/actions';
import {
  LayoutDashboard,
  FileText,
  Headphones,
  Trophy,
  TrendingUp,
  Star,
  Users,
  LogOut,
  Shield,
  Medal,
} from 'lucide-react';

const navItems = [
  { href: '/admin',                    label: 'Dashboard',      icon: LayoutDashboard, exact: true },
  { href: '/admin/artikelen',          label: 'Artikelen',      icon: FileText,        exact: false },
  { href: '/admin/afleveringen',       label: 'Afleveringen',   icon: Headphones,      exact: false },
  { href: '/admin/team-van-de-week',   label: 'Team vd Week',   icon: Trophy,          exact: false },
  { href: '/admin/speler-van-de-week', label: 'Speler vd Week', icon: Medal,           exact: false },
  { href: '/admin/kooptips',           label: 'Kooptips',       icon: TrendingUp,      exact: false },
  { href: '/admin/captain-keuze',      label: 'Captain Keuze',  icon: Star,            exact: false },
  { href: '/admin/managers',           label: 'Managers',       icon: Users,           exact: false },
  { href: '/admin/clubs',              label: 'Clubs',          icon: Shield,          exact: false },
];

interface AdminSidebarProps {
  userEmail: string;
}

export default function AdminSidebar({ userEmail }: AdminSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-[#0d0d0d] border-r border-white/8 flex flex-col">

      {/* Logo */}
      <div className="px-6 py-7 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#00A651] flex items-center justify-center flex-shrink-0">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-5 h-5 text-white"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
          <div>
            <p
              className="text-white text-lg leading-none tracking-wide"
              style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.3rem' }}
            >
              De Groene Pijl
            </p>
            <p className="text-gray-500 text-xs mt-0.5">CMS Beheer</p>
          </div>
        </div>
      </div>

      {/* Navigatie */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-gray-600 text-[10px] font-semibold uppercase tracking-widest px-3 mb-3">
          Menu
        </p>
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-150 group
                ${
                  active
                    ? 'bg-[#00A651]/15 text-[#00A651]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 transition-colors ${
                  active ? 'text-[#00A651]' : 'text-gray-500 group-hover:text-gray-300'
                }`}
              />
              {label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00A651]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Gebruiker + uitloggen */}
      <div className="px-3 py-4 border-t border-white/8">
        <div className="px-3 py-2 mb-2">
          <p className="text-gray-600 text-[10px] font-semibold uppercase tracking-widest mb-1">
            Ingelogd als
          </p>
          <p className="text-gray-300 text-xs truncate">{userEmail}</p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                       text-gray-400 hover:text-red-400 hover:bg-red-500/8
                       transition-all duration-150 group"
          >
            <LogOut className="w-4 h-4 text-gray-500 group-hover:text-red-400 transition-colors" />
            Uitloggen
          </button>
        </form>
      </div>
    </aside>
  );
}

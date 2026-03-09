'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from '@/lib/auth/actions';
import Logo from '@/components/ui/Logo';
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
  Settings,
} from 'lucide-react';

const navItems = [
  { href: '/admin',                    label: 'Dashboard',      icon: LayoutDashboard, exact: true },
  { href: '/admin/artikelen',          label: 'Artikelen',      icon: FileText,        exact: false },
  { href: '/admin/afleveringen',       label: 'Afleveringen',   icon: Headphones,      exact: false },
  { href: '/admin/team-van-de-week',   label: 'Team vd Week',   icon: Trophy,          exact: false },
  { href: '/admin/speler-van-de-week', label: 'Speler vd Week', icon: Medal,           exact: false },
  { href: '/admin/kooptips',           label: 'Transfertips',   icon: TrendingUp,      exact: false },
  { href: '/admin/captain-keuze',      label: 'Captain Keuze',  icon: Star,            exact: false },
  { href: '/admin/managers',           label: 'Managers',       icon: Users,           exact: false },
  { href: '/admin/clubs',              label: 'Clubs',          icon: Shield,          exact: false },
  { href: '/admin/instellingen',       label: 'Instellingen',   icon: Settings,        exact: false },
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
      <div className="px-5 py-5 border-b border-white/8">
        <Logo size="sm" linked={true} />
        <p className="text-gray-500 text-xs mt-2 pl-1">CMS Beheer</p>
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

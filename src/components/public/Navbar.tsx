'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ChevronDown } from 'lucide-react';
import Logo from '@/components/ui/Logo';

interface Manager {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface NavbarProps {
  managers?: Manager[];
}

const navLinks = [
  { label: 'Afleveringen',         href: '/afleveringen'   },
  { label: 'Artikelen',            href: '/artikelen'      },
  { label: 'Transfers & Captains', href: '/#captain-pick'  },
  { label: 'Rankings',             href: '/rankings'       },
  { label: 'Spelersnieuws',        href: '/spelersnieuws'  },
];

export default function Navbar({ managers = [] }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [managersOpen, setManagersOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setManagersOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-md ${
        scrolled || menuOpen ? 'shadow-lg' : ''
      }`}
      style={{
        background: '#1F0E84',
        borderBottom: scrolled || menuOpen
          ? '1px solid rgba(0,250,97,0.25)'
          : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">

          {/* Logo */}
          <Logo size="md" />

          {/* Desktop nav — center */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-white/70 hover:text-primary rounded-lg hover:bg-primary/8 transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}

            {/* Managers dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setManagersOpen(!managersOpen)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white/70 hover:text-primary rounded-lg hover:bg-primary/8 transition-all duration-200"
              >
                Managers
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${managersOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {managersOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-navy-card border border-white/10 rounded-xl shadow-card-hover py-2 min-w-[200px] z-50">
                  {managers.length > 0 ? (
                    managers.map((m) => (
                      <Link
                        key={m.id}
                        href={`/managers/${m.id}`}
                        onClick={() => setManagersOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors"
                      >
                        {m.avatar_url ? (
                          <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0">
                            <Image src={m.avatar_url} alt={m.name} fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <span className="text-primary text-xs font-bold">{m.name.charAt(0)}</span>
                          </div>
                        )}
                        <span className="text-white text-sm font-medium">{m.name}</span>
                      </Link>
                    ))
                  ) : (
                    ['Bart', 'Jeffrey', 'Tom', 'Kieran'].map((name) => (
                      <div key={name} className="flex items-center gap-3 px-4 py-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-primary text-xs font-bold">{name.charAt(0)}</span>
                        </div>
                        <span className="text-white/60 text-sm">{name}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </nav>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href="https://fantasy.premierleague.com/leagues/auto-join/t5mggi"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-glow inline-flex items-center gap-2 bg-primary text-black font-semibold text-sm px-5 py-2.5 rounded-lg transition-all duration-300 hover:bg-primary/90"
            >
              Join Mini-League
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden text-white/80 hover:text-primary transition-colors p-1"
            aria-label="Menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile overlay menu */}
      {menuOpen && (
        <div className="lg:hidden" style={{ background: '#1F0E84', borderTop: '1px solid rgba(0,250,97,0.15)' }}>
          <nav className="flex flex-col px-4 py-4 gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 text-base font-medium text-white/80 hover:text-primary hover:bg-white/5 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-white/8 my-2" />
            <p className="px-4 text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#00FA61' }}>Managers</p>
            {managers.map((m) => (
              <Link
                key={m.id}
                href={`/managers/${m.id}`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-white/80 hover:text-primary hover:bg-white/5 rounded-lg transition-colors"
              >
                {m.avatar_url ? (
                  <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0">
                    <Image src={m.avatar_url} alt={m.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-primary text-xs font-bold">{m.name.charAt(0)}</span>
                  </div>
                )}
                {m.name}
              </Link>
            ))}
            <div className="border-t border-white/8 my-2" />
            <a
              href="https://fantasy.premierleague.com/leagues/auto-join/t5mggi"
              target="_blank"
              rel="noopener noreferrer"
              className="mx-4 mt-1 text-center bg-primary text-black font-semibold py-3 rounded-lg transition-colors"
            >
              Join Mini-League
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

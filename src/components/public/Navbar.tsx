'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ChevronDown } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import DeadlineCountdown from '@/components/ui/DeadlineCountdown';

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
  { label: 'Rankings',             href: '/rankings'       },
];

const transfersLinks = [
  { label: 'Transfers & Captains', href: '/#captain-pick',  desc: 'Captain picks & transfer tips'  },
  { label: 'Bouw Mijn Team',       href: '/teambouwer',     desc: 'Stel jouw FPL-elftal samen'     },
];

const teamstatusLinks = [
  { label: 'Spelerstatus',    href: '/spelerstatus',     desc: 'Blessures & beschikbaarheid' },
  { label: 'Wedstrijdplanner', href: '/wedstrijdplanner', desc: 'Fixture Difficulty Rating'   },
];

export default function Navbar({ managers = [] }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [managersOpen, setManagersOpen] = useState(false);
  const [teamstatusOpen, setTeaminformatieOpen] = useState(false);
  const [transfersOpen, setTransfersOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const teamstatusRef = useRef<HTMLDivElement>(null);
  const transfersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setManagersOpen(false);
      }
      if (teamstatusRef.current && !teamstatusRef.current.contains(e.target as Node)) {
        setTeaminformatieOpen(false);
      }
      if (transfersRef.current && !transfersRef.current.contains(e.target as Node)) {
        setTransfersOpen(false);
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
          <div className="navbar-logo">
            <Logo size="md" />
          </div>

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

            {/* Transfers & Captains dropdown */}
            <div className="relative" ref={transfersRef}>
              <button
                onClick={() => { setTransfersOpen(!transfersOpen); setManagersOpen(false); setTeaminformatieOpen(false); }}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white/70 hover:text-primary rounded-lg hover:bg-primary/8 transition-all duration-200"
              >
                Transfers &amp; Captains
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${transfersOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {transfersOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-navy-card border border-white/10 rounded-xl shadow-card-hover py-2 min-w-[220px] z-50">
                  {transfersLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setTransfersOpen(false)}
                      className="flex flex-col px-4 py-3 hover:bg-white/5 transition-colors"
                    >
                      <span className="text-white text-sm font-semibold">{item.label}</span>
                      <span className="text-white/40 text-xs mt-0.5">{item.desc}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Teaminformatie dropdown */}
            <div className="relative" ref={teamstatusRef}>
              <button
                onClick={() => { setTeaminformatieOpen(!teamstatusOpen); setManagersOpen(false); setTransfersOpen(false); }}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white/70 hover:text-primary rounded-lg hover:bg-primary/8 transition-all duration-200"
              >
                Teaminformatie
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${teamstatusOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {teamstatusOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-navy-card border border-white/10 rounded-xl shadow-card-hover py-2 min-w-[220px] z-50">
                  {teamstatusLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setTeaminformatieOpen(false)}
                      className="flex flex-col px-4 py-3 hover:bg-white/5 transition-colors"
                    >
                      <span className="text-white text-sm font-semibold">{item.label}</span>
                      <span className="text-white/40 text-xs mt-0.5">{item.desc}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Managers dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => { setManagersOpen(!managersOpen); setTeaminformatieOpen(false); setTransfersOpen(false); }}
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

          {/* Right side — deadline countdown */}
          <div className="hidden lg:flex items-center gap-3">
            <DeadlineCountdown />
          </div>

          {/* Mobile: compact countdown + hamburger */}
          <div className="lg:hidden flex items-center gap-3">
            <DeadlineCountdown />
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-white/80 hover:text-primary transition-colors p-1"
              aria-label="Menu"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
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

            {/* Transfers & Captains section */}
            <div className="border-t border-white/8 my-2" />
            <p className="px-4 text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#00FA61' }}>Transfers &amp; Captains</p>
            {transfersLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="flex flex-col px-4 py-2.5 text-white/80 hover:text-primary hover:bg-white/5 rounded-lg transition-colors"
              >
                <span className="font-semibold">{item.label}</span>
                <span className="text-xs text-white/40 mt-0.5">{item.desc}</span>
              </Link>
            ))}

            {/* Teaminformatie section */}
            <div className="border-t border-white/8 my-2" />
            <p className="px-4 text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#00FA61' }}>Teaminformatie</p>
            {teamstatusLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="flex flex-col px-4 py-2.5 text-white/80 hover:text-primary hover:bg-white/5 rounded-lg transition-colors"
              >
                <span className="font-semibold">{item.label}</span>
                <span className="text-xs text-white/40 mt-0.5">{item.desc}</span>
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

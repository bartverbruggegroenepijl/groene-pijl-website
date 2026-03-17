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
  { label: 'Statistieken',    href: '/statistieken',     desc: 'Premier League statistieken'  },
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

  // Vergrendel body scroll als mobiel menu open is
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

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

      {/* ── Mobiel menu — volledig scherm overlay ─────────────────── */}
      {menuOpen && (
        <>
          {/* !important fallback voor scroll op iOS/Android */}
          <style>{`.mgp-menu-overlay{overflow-y:scroll!important;-webkit-overflow-scrolling:touch!important;height:100dvh!important;}`}</style>
          <div
            className="lg:hidden mgp-menu-overlay"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100dvh',
              background: '#1F0E84',
              zIndex: 999,
              overflowX: 'hidden',
              overflowY: 'scroll',
              WebkitOverflowScrolling: 'touch',
              fontFamily: 'Montserrat, sans-serif',
            }}
          >
            {/* Menu header: logo + sluit knop */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid rgba(0,250,97,0.15)',
              }}
            >
              <Logo size="md" />
              <button
                onClick={() => setMenuOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.8)',
                  cursor: 'pointer',
                  padding: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                }}
                aria-label="Menu sluiten"
              >
                <X size={24} />
              </button>
            </div>

            {/* Nav content */}
            <nav>

              {/* Hoofd links */}
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'block',
                    padding: '10px 24px',
                    fontSize: 15,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.9)',
                    textDecoration: 'none',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    fontFamily: 'Montserrat, sans-serif',
                  }}
                >
                  {link.label}
                </Link>
              ))}

              {/* ── Transfers & Captains ── */}
              <div
                style={{
                  padding: '8px 24px 4px',
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#00FA61',
                }}
              >
                Transfers &amp; Captains
              </div>
              {transfersLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'block',
                    padding: '7px 24px 7px 36px',
                    textDecoration: 'none',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    fontFamily: 'Montserrat, sans-serif',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', display: 'block' }}>
                    {item.label}
                  </span>
                </Link>
              ))}

              {/* ── Teaminformatie ── */}
              <div
                style={{
                  padding: '8px 24px 4px',
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#00FA61',
                }}
              >
                Teaminformatie
              </div>
              {teamstatusLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'block',
                    padding: '7px 24px 7px 36px',
                    textDecoration: 'none',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    fontFamily: 'Montserrat, sans-serif',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', display: 'block' }}>
                    {item.label}
                  </span>
                </Link>
              ))}

              {/* ── Managers — alleen sectielink, geen individuele namen ── */}
              <div
                style={{
                  padding: '8px 24px 4px',
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#00FA61',
                }}
              >
                Managers
              </div>
              <Link
                href="/managers"
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'block',
                  padding: '7px 24px 7px 36px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.85)',
                  textDecoration: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  fontFamily: 'Montserrat, sans-serif',
                }}
              >
                Bekijk alle managers
              </Link>

              {/* ── Join Mini-League CTA ── */}
              <div style={{ padding: '16px 24px 32px' }}>
                <a
                  href="https://fantasy.premierleague.com/leagues/auto-join/t5mggi"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    background: '#00FA61',
                    color: '#000',
                    fontSize: 14,
                    fontWeight: 700,
                    padding: '14px 24px',
                    borderRadius: 12,
                    textDecoration: 'none',
                    fontFamily: 'Montserrat, sans-serif',
                  }}
                >
                  Join Mini-League
                </a>
              </div>
            </nav>
          </div>
        </>
      )}
    </header>
  );
}

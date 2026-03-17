'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import DeadlineCountdown from '@/components/ui/DeadlineCountdown';

const navLinks = [
  { label: 'Afleveringen',   href: '/afleveringen' },
  { label: 'Artikelen',      href: '/artikelen'    },
  { label: 'Bouw Mijn Team', href: '/teambouwer'   },
];

const dataLinks = [
  { label: 'Speler Statistieken',    href: '/statistieken',     desc: 'Premier League statistieken'  },
  { label: 'Groene Pijl Competitie', href: '/rankings',         desc: 'Onze mini-league rankings'    },
  { label: 'Spelerstatus',           href: '/spelerstatus',     desc: 'Blessures & beschikbaarheid'  },
  { label: 'Wedstrijdplanner',       href: '/wedstrijdplanner', desc: 'Fixture Difficulty Rating'    },
];

export default function Navbar() {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [dataOpen, setDataOpen]   = useState(false);
  const dataRef = useRef<HTMLDivElement>(null);

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Vergrendel body scroll als mobiel menu open is
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Sluit Data & Inzichten dropdown bij klik buiten
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dataRef.current && !dataRef.current.contains(e.target as Node)) {
        setDataOpen(false);
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

            {/* Afleveringen, Artikelen, Bouw Mijn Team */}
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-white/70 hover:text-primary rounded-lg hover:bg-primary/8 transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}

            {/* Transfers & Captains — standalone link */}
            <Link
              href="/#captain-pick"
              className="px-4 py-2 text-sm font-medium text-white/70 hover:text-primary rounded-lg hover:bg-primary/8 transition-all duration-200"
            >
              Transfers &amp; Captains
            </Link>

            {/* Data & Inzichten dropdown */}
            <div className="relative" ref={dataRef}>
              <button
                onClick={() => setDataOpen(!dataOpen)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white/70 hover:text-primary rounded-lg hover:bg-primary/8 transition-all duration-200"
              >
                Data &amp; Inzichten
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${dataOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {dataOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-navy-card border border-white/10 rounded-xl shadow-card-hover py-2 min-w-[220px] z-50">
                  {dataLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setDataOpen(false)}
                      className="flex flex-col px-4 py-3 hover:bg-white/5 transition-colors"
                    >
                      <span className="text-white text-sm font-semibold">{item.label}</span>
                      <span className="text-white/40 text-xs mt-0.5">{item.desc}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Managers — standalone link */}
            <Link
              href="/managers"
              className="px-4 py-2 text-sm font-medium text-white/70 hover:text-primary rounded-lg hover:bg-primary/8 transition-all duration-200"
            >
              Managers
            </Link>
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

              {/* Afleveringen, Artikelen, Bouw Mijn Team */}
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

              {/* Transfers & Captains — standalone link */}
              <Link
                href="/#captain-pick"
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
                Transfers &amp; Captains
              </Link>

              {/* ── Data & Inzichten sectie ── */}
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
                Data &amp; Inzichten
              </div>
              {dataLinks.map((item) => (
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

              {/* Managers — standalone link */}
              <Link
                href="/managers"
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
                Managers
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

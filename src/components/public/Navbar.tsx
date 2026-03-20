'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import DeadlineCountdown from '@/components/ui/DeadlineCountdown';

const navLinks = [
  { label: 'Afleveringen', href: '/afleveringen' },
  { label: 'Artikelen',    href: '/artikelen'    },
];

const teamLinks = [
  { label: 'Bouw Mijn Team',   href: '/teambouwer',       desc: 'Stel jouw ideale FPL-elftal samen'  },
  { label: 'Wedstrijdplanner', href: '/wedstrijdplanner', desc: 'Fixture Difficulty Rating per team'  },
];

const dataLinks = [
  { label: 'Speler Statistieken',    href: '/statistieken',                   desc: 'Premier League statistieken',  external: false },
  { label: 'Groene Pijl Competitie', href: '/rankings',                       desc: 'Onze mini-league rankings',    external: false },
  { label: 'Spelerstatus',           href: '/spelerstatus',                   desc: 'Blessures & beschikbaarheid',  external: false },
  { label: 'Prijswijzigingen',       href: 'https://www.livefpl.net/prices',  desc: 'Stijgers & dalers deze GW',    external: true  },
];

const managersLinks = [
  { label: 'Bart Verbrugge',   href: '/managers/a805b851-bd39-4641-bce1-08b3af28d425' },
  { label: 'Jeffrey Nederlof', href: '/managers/ea351304-7690-4563-a856-ab396d9296a9' },
  { label: 'Kieran Walsh',     href: '/managers/591fa7b6-e27f-4e59-ace5-4006f8e4d64a' },
  { label: 'Tom Verbrugge',    href: '/managers/1811c6f2-1e91-4535-873a-60e7d2ec2540' },
];

export default function Navbar() {
  const [scrolled, setScrolled]         = useState(false);
  const [menuOpen, setMenuOpen]         = useState(false);
  const [teamOpen, setTeamOpen]         = useState(false);
  const [dataOpen, setDataOpen]         = useState(false);
  const [managersOpen, setManagersOpen] = useState(false);
  const teamRef     = useRef<HTMLDivElement>(null);
  const dataRef     = useRef<HTMLDivElement>(null);
  const managersRef = useRef<HTMLDivElement>(null);

  // Timer refs voor hover-vertraging (150ms) op desktop
  const teamCloseTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataCloseTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const managersCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Desktop hover handlers ───────────────────────────────
  function handleTeamEnter() {
    if (teamCloseTimer.current) clearTimeout(teamCloseTimer.current);
    setTeamOpen(true); setDataOpen(false); setManagersOpen(false);
  }
  function handleTeamLeave() {
    teamCloseTimer.current = setTimeout(() => setTeamOpen(false), 150);
  }
  function handleDataEnter() {
    if (dataCloseTimer.current) clearTimeout(dataCloseTimer.current);
    setDataOpen(true); setTeamOpen(false); setManagersOpen(false);
  }
  function handleDataLeave() {
    dataCloseTimer.current = setTimeout(() => setDataOpen(false), 150);
  }
  function handleManagersEnter() {
    if (managersCloseTimer.current) clearTimeout(managersCloseTimer.current);
    setManagersOpen(true); setTeamOpen(false); setDataOpen(false);
  }
  function handleManagersLeave() {
    managersCloseTimer.current = setTimeout(() => setManagersOpen(false), 150);
  }

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

  // Sluit dropdowns bij klik buiten
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (teamRef.current && !teamRef.current.contains(e.target as Node)) {
        setTeamOpen(false);
      }
      if (dataRef.current && !dataRef.current.contains(e.target as Node)) {
        setDataOpen(false);
      }
      if (managersRef.current && !managersRef.current.contains(e.target as Node)) {
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
          <div className="navbar-logo">
            <Logo size="md" />
          </div>

          {/* Desktop nav — center */}
          <nav className="hidden lg:flex items-center gap-1">

            {/* Afleveringen, Artikelen */}
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-white/70 hover:text-primary rounded-lg hover:bg-primary/8 transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}

            {/* Bouw Mijn Team dropdown */}
            <div className="relative" ref={teamRef} onMouseEnter={handleTeamEnter} onMouseLeave={handleTeamLeave}>
              <button
                onClick={() => { setTeamOpen(!teamOpen); setDataOpen(false); setManagersOpen(false); }}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white/70 hover:text-primary rounded-lg hover:bg-primary/8 transition-all duration-200"
              >
                Bouw Mijn Team
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${teamOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {teamOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-navy-card border border-white/10 rounded-xl shadow-card-hover py-2 min-w-[200px] z-50">
                  {teamLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setTeamOpen(false)}
                      className="flex flex-col px-4 py-3 hover:bg-white/5 transition-colors"
                    >
                      <span className="text-white text-sm font-semibold">{item.label}</span>
                      <span className="text-white/40 text-xs mt-0.5">{item.desc}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Transfers & Captains — standalone link */}
            <Link
              href="/#captain-pick"
              className="px-4 py-2 text-sm font-medium text-white/70 hover:text-primary rounded-lg hover:bg-primary/8 transition-all duration-200"
            >
              Transfers &amp; Captains
            </Link>

            {/* Data & Inzichten dropdown */}
            <div className="relative" ref={dataRef} onMouseEnter={handleDataEnter} onMouseLeave={handleDataLeave}>
              <button
                onClick={() => { setDataOpen(!dataOpen); setManagersOpen(false); setTeamOpen(false); }}
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
                  {dataLinks.map((item) =>
                    item.external ? (
                      <a
                        key={item.href}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setDataOpen(false)}
                        className="flex flex-col px-4 py-3 hover:bg-white/5 transition-colors"
                        style={{ textDecoration: 'none' }}
                      >
                        <span className="text-white text-sm font-semibold">{item.label}</span>
                        <span className="text-white/40 text-xs mt-0.5">{item.desc}</span>
                      </a>
                    ) : (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setDataOpen(false)}
                        className="flex flex-col px-4 py-3 hover:bg-white/5 transition-colors"
                      >
                        <span className="text-white text-sm font-semibold">{item.label}</span>
                        <span className="text-white/40 text-xs mt-0.5">{item.desc}</span>
                      </Link>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Managers dropdown */}
            <div className="relative" ref={managersRef} onMouseEnter={handleManagersEnter} onMouseLeave={handleManagersLeave}>
              <button
                onClick={() => { setManagersOpen(!managersOpen); setDataOpen(false); setTeamOpen(false); }}
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
                  {managersLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setManagersOpen(false)}
                      className="flex px-4 py-3 hover:bg-white/5 transition-colors"
                    >
                      <span className="text-white text-sm font-semibold">{item.label}</span>
                    </Link>
                  ))}
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

              {/* Afleveringen, Artikelen */}
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

              {/* ── Bouw Mijn Team sectie ── */}
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
                Bouw Mijn Team
              </div>
              {teamLinks.map((item) => (
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
              {dataLinks.map((item) =>
                item.external ? (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
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
                  </a>
                ) : (
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
                )
              )}

              {/* ── Managers sectie ── */}
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
              {managersLinks.map((item) => (
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

'use client';

import { Instagram, Mic } from 'lucide-react';
import Logo from '@/components/ui/Logo';

export default function Footer() {
  return (
    <footer
      className="text-white/70"
      style={{
        background: '#150A6E',
        borderTop: '2px solid rgba(200,33,195,0.4)',
        boxShadow: '0 -4px 40px rgba(200,33,195,0.12)',
      }}
    >
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <Logo size="md" />
            </div>
            <p className="text-sm text-white/40 leading-relaxed">
              Dé Nederlandse Fantasy Premier League podcast. Elke week tips, analyses en discussies van vier managers.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-sm mb-4 uppercase tracking-wider" style={{ color: '#00FA61', letterSpacing: '0.1em' }}>Inhoud</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#afleveringen" className="hover:text-primary transition-colors">Afleveringen</a></li>
              <li><a href="#artikelen" className="hover:text-primary transition-colors">Artikelen</a></li>
              <li><a href="#captain-pick" className="hover:text-primary transition-colors">Captain Tips</a></li>
              <li><a href="#team" className="hover:text-primary transition-colors">Team vd Week</a></li>
              <li><a href="#kooptips" className="hover:text-primary transition-colors">Transfertips</a></li>
            </ul>
          </div>

          {/* Managers */}
          <div>
            <h4 className="font-semibold text-sm mb-4 uppercase tracking-wider" style={{ color: '#00FA61', letterSpacing: '0.1em' }}>Managers</h4>
            <ul className="space-y-2.5 text-sm">
              {['Bart', 'Jeffrey', 'Tom', 'Kieran'].map((name) => (
                <li key={name}>
                  <a href="#managers" className="hover:text-primary transition-colors">{name}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="font-semibold text-sm mb-4 uppercase tracking-wider" style={{ color: '#00FA61', letterSpacing: '0.1em' }}>Community</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="https://fantasy.premierleague.com/leagues/auto-join/t5mggi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 hover:border-primary/60 px-3 py-2 rounded-lg transition-all font-medium text-xs"
                  style={{ boxShadow: '0 0 12px rgba(0,250,97,0.08)' }}
                >
                  <span>⚽</span> Join Mini-League
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/groenepijlpodcast"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 transition-colors"
                  style={{ color: 'rgba(200,33,195,0.7)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#C821C3')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(200,33,195,0.7)')}
                >
                  <Instagram size={14} /> @groenepijlpodcast
                </a>
              </li>
              <li>
                <a
                  href="#afleveringen"
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <Mic size={14} /> Spotify Podcast
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            © {new Date().getFullYear()} De Groene Pijl — De Nederlandse FPL Podcast
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://www.instagram.com/groenepijlpodcast"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors"
              style={{ color: 'rgba(200,33,195,0.5)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#C821C3')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(200,33,195,0.5)')}
              aria-label="Instagram"
            >
              <Instagram size={16} />
            </a>
            <a
              href="#afleveringen"
              className="hover:text-primary transition-colors"
              style={{ color: 'rgba(0,250,97,0.4)' }}
              aria-label="Podcast"
            >
              <Mic size={16} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

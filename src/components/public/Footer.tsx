import { Instagram, Mic } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-surface-1 border-t border-white/8 text-white/70">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-black" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
              <span className="font-bold text-white text-lg tracking-tight">DE GROENE PIJL</span>
            </div>
            <p className="text-sm text-white/40 leading-relaxed">
              Dé Nederlandse Fantasy Premier League podcast. Elke week tips, analyses en discussies van vier managers.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-4 uppercase tracking-wider">Inhoud</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#afleveringen" className="hover:text-primary transition-colors">Afleveringen</a></li>
              <li><a href="#artikelen" className="hover:text-primary transition-colors">Artikelen</a></li>
              <li><a href="#captain-pick" className="hover:text-primary transition-colors">Captain Tips</a></li>
              <li><a href="#team" className="hover:text-primary transition-colors">Team vd Week</a></li>
              <li><a href="#kooptips" className="hover:text-primary transition-colors">Kooptips</a></li>
            </ul>
          </div>

          {/* Managers */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-4 uppercase tracking-wider">Managers</h4>
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
            <h4 className="font-semibold text-white text-sm mb-4 uppercase tracking-wider">Community</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="https://fantasy.premierleague.com/leagues/auto-join/t5mggi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 px-3 py-2 rounded-lg transition-colors font-medium text-xs"
                >
                  <span>⚽</span> Join Mini-League
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/groenepijlpodcast"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-primary transition-colors"
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

        <div className="border-t border-white/8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} De Groene Pijl — De Nederlandse FPL Podcast
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://www.instagram.com/groenepijlpodcast"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/30 hover:text-primary transition-colors"
              aria-label="Instagram"
            >
              <Instagram size={16} />
            </a>
            <a
              href="#afleveringen"
              className="text-white/30 hover:text-primary transition-colors"
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

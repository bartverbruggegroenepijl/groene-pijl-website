import { Instagram, Mic } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-primary-dark text-white/80 py-12 mt-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <span className="font-heading text-3xl text-primary block mb-2 tracking-wider">
              DE GROENE PIJL
            </span>
            <p className="font-body text-sm text-white/60 leading-relaxed">
              Dé Nederlandse Fantasy Premier League podcast. Elke week tips, analyses en discussies.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-heading text-xl text-white mb-3 tracking-wide">Navigatie</h3>
            <ul className="space-y-2 font-body text-sm">
              <li><a href="#afleveringen" className="hover:text-primary transition-colors">Afleveringen</a></li>
              <li><a href="#captain-pick" className="hover:text-primary transition-colors">Captain Pick</a></li>
              <li><a href="#kooptips" className="hover:text-primary transition-colors">Kooptips</a></li>
              <li><a href="#artikelen" className="hover:text-primary transition-colors">Artikelen</a></li>
              <li><a href="#team" className="hover:text-primary transition-colors">Team vd Week</a></li>
              <li><a href="#managers" className="hover:text-primary transition-colors">Managers</a></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-heading text-xl text-white mb-3 tracking-wide">Volg Ons</h3>
            <div className="flex flex-col gap-3 font-body text-sm">
              <a
                href="https://open.spotify.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-primary transition-colors"
              >
                <Mic size={16} />
                Spotify Podcast
              </a>
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-primary transition-colors"
              >
                <Instagram size={16} />
                Instagram
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 text-center font-body text-xs text-white/40">
          © {new Date().getFullYear()} De Groene Pijl. Alle rechten voorbehouden.
        </div>
      </div>
    </footer>
  );
}

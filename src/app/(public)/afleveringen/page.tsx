import { fetchEpisodes, type RssEpisode } from '@/lib/episodes/feed';
import Image from 'next/image';
import { Clock, Calendar, ExternalLink, Mic } from 'lucide-react';

// Force Node.js runtime – rss-parser requires it
export const runtime = 'nodejs';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function EpisodeCard({ episode }: { episode: RssEpisode }) {
  return (
    <article className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col">
      {/* Cover image */}
      <div className="relative h-48 bg-gray-100 shrink-0">
        {episode.imageUrl ? (
          <Image
            src={episode.imageUrl}
            alt={episode.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #00FA61 0%, #7B2FFF 100%)' }}
          >
            <Mic size={48} className="text-black/20" />
          </div>
        )}
        {/* Play overlay */}
        {episode.spotifyUrl && (
          <a
            href={episode.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-colors group/play"
          >
            <div className="w-14 h-14 rounded-full bg-primary opacity-0 group-hover/play:opacity-100 flex items-center justify-center transition-all duration-200 scale-90 group-hover/play:scale-100">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-black ml-0.5" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </a>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
          {episode.pubDate && (
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {formatDate(episode.pubDate)}
            </span>
          )}
          {episode.durationFormatted && episode.durationFormatted !== '—' && (
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {episode.durationFormatted}
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="font-bold text-gray-900 text-base leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2 flex-1">
          {episode.title}
        </h2>

        {/* Description */}
        {episode.description && (
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 mb-4">
            {episode.description}
          </p>
        )}

        {/* CTA */}
        {episode.spotifyUrl && (
          <a
            href={episode.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto inline-flex items-center gap-2 bg-primary text-black font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors self-start"
          >
            <ExternalLink size={14} />
            Luister op Spotify
          </a>
        )}
      </div>
    </article>
  );
}

export default async function AfleveringenPage() {
  let episodes: RssEpisode[] = [];
  let fetchError = false;

  try {
    episodes = await fetchEpisodes();
  } catch {
    fetchError = true;
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-navy pt-24 pb-16 px-4">
        <div className="max-w-8xl mx-auto">
          <span className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-3">
            Podcast
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
            Alle Afleveringen
          </h1>
          <p className="text-white/60 text-lg max-w-xl">
            Elke gameweek een nieuwe aflevering vol FPL-tips, analyses en discussies van de vier managers.
          </p>
          <p className="text-white/30 text-sm mt-3">
            {episodes.length > 0 ? `${episodes.length} afleveringen beschikbaar` : ''}
          </p>
        </div>
      </div>

      {/* Episodes grid */}
      <section className="max-w-8xl mx-auto px-4 py-16">
        {fetchError ? (
          <div className="text-center py-20">
            <p className="text-gray-400">Kon de afleveringen niet laden. Probeer het later opnieuw.</p>
          </div>
        ) : episodes.length === 0 ? (
          <div className="text-center py-20">
            <Mic size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-400 font-medium">Nog geen afleveringen beschikbaar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {episodes.map((ep, i) => (
              <EpisodeCard key={ep.guid || i} episode={ep} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

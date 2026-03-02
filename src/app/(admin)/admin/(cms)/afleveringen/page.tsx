import { createClient }      from '@/lib/supabase/server';
import { fetchEpisodes }     from '@/lib/episodes/feed';
import { saveEpisode }       from '@/lib/episodes/actions';
import SyncEpisodesButton   from '@/components/admin/SyncEpisodesButton';
import SaveEpisodeButton    from '@/components/admin/SaveEpisodeButton';
import { Headphones, ExternalLink, Rss } from 'lucide-react';
import type { RssEpisode }  from '@/lib/episodes/feed';

// ─── Helpers ─────────────────────────────────────────────────

function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('nl-NL', {
    day:   'numeric',
    month: 'long',
    year:  'numeric',
  });
}

// ─── Episode row ─────────────────────────────────────────────

function EpisodeRow({
  episode,
  isSaved,
  saveAction,
}: {
  episode:    RssEpisode;
  isSaved:    boolean;
  saveAction: () => Promise<void>;
}) {
  return (
    <div className="flex items-start gap-4 px-5 py-4 border-b border-white/5
                    last:border-0 hover:bg-white/3 transition-colors group">

      {/* Thumbnail */}
      <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-white/8">
        {episode.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={episode.imageUrl}
            alt={episode.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Headphones className="w-5 h-5 text-gray-600" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium leading-snug line-clamp-1">
          {episode.title}
        </p>

        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          <span>{formatDate(episode.pubDate)}</span>
          {episode.durationFormatted !== '—' && (
            <>
              <span className="w-1 h-1 rounded-full bg-gray-700" />
              <span>{episode.durationFormatted}</span>
            </>
          )}
          {episode.spotifyUrl && (
            <>
              <span className="w-1 h-1 rounded-full bg-gray-700" />
              <a
                href={episode.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-gray-500 hover:text-[#00A651]
                           transition-colors opacity-0 group-hover:opacity-100"
              >
                <ExternalLink className="w-3 h-3" />
                Open
              </a>
            </>
          )}
        </div>

        {episode.description && (
          <p className="text-gray-600 text-xs mt-1.5 line-clamp-2 leading-relaxed">
            {episode.description}
          </p>
        )}
      </div>

      {/* Save action */}
      <div className="flex-shrink-0 pt-0.5">
        <SaveEpisodeButton isSaved={isSaved} action={saveAction} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default async function AfleveringenPage() {
  const supabase = createClient();

  // Fetch RSS episodes + saved IDs in parallel
  let episodes: RssEpisode[] = [];
  let feedError = '';

  const [fetchResult, { data: savedRows }] = await Promise.all([
    fetchEpisodes().then((eps) => ({ eps, err: '' })).catch((e: Error) => ({
      eps: [] as RssEpisode[],
      err: e.message,
    })),
    supabase.from('episodes').select('spotify_id'),
  ]);

  episodes  = fetchResult.eps;
  feedError = fetchResult.err;

  const savedIds = new Set((savedRows ?? []).map((r) => r.spotify_id as string));
  const savedCount = episodes.filter((ep) => savedIds.has(ep.guid)).length;

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1
            className="text-white"
            style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem', letterSpacing: '0.05em' }}
          >
            Afleveringen
          </h1>

          {!feedError && (
            <p className="text-gray-500 text-sm mt-0.5">
              {episodes.length} afleveringen in RSS feed
              {episodes.length > 0 && (
                <span className="ml-2">
                  ·{' '}
                  <span className={savedCount === episodes.length ? 'text-[#00A651]' : ''}>
                    {savedCount} opgeslagen
                  </span>
                </span>
              )}
            </p>
          )}
        </div>

        {!feedError && <SyncEpisodesButton />}
      </div>

      {/* ── RSS feed fout ── */}
      {feedError && (
        <div className="flex items-start gap-4 bg-red-500/10 border border-red-500/25
                        rounded-xl p-5 mb-6">
          <Rss className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium text-sm">RSS feed niet bereikbaar</p>
            <p className="text-gray-500 text-xs mt-1">{feedError}</p>
            <p className="text-gray-600 text-xs mt-0.5">
              Ververs de pagina om opnieuw te proberen.
            </p>
          </div>
        </div>
      )}

      {/* ── Lege staat ── */}
      {!feedError && episodes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20
                        bg-[#1a1a1a] border border-white/8 rounded-xl text-center">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center
                          justify-center mb-4">
            <Headphones className="w-5 h-5 text-gray-600" />
          </div>
          <p className="text-gray-400 font-medium mb-1">Geen afleveringen gevonden</p>
          <p className="text-gray-600 text-sm">Controleer de RSS feed URL in .env.local</p>
        </div>
      )}

      {/* ── Alles gesynchroniseerd banner ── */}
      {!feedError && episodes.length > 0 && savedCount === episodes.length && (
        <div className="flex items-center gap-3 bg-[#00A651]/10 border border-[#00A651]/25
                        rounded-xl px-5 py-3.5 mb-5">
          <div className="w-2 h-2 rounded-full bg-[#00A651] flex-shrink-0" />
          <p className="text-[#00A651] text-sm font-medium">
            Alle {episodes.length} afleveringen zijn gesynchroniseerd met de database.
          </p>
        </div>
      )}

      {/* ── Episodelijst ── */}
      {!feedError && episodes.length > 0 && (
        <div className="bg-[#1a1a1a] border border-white/8 rounded-xl overflow-hidden">

          {/* Lijst header */}
          <div className="px-5 py-3.5 border-b border-white/8 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              RSS Feed — nieuwste eerst
            </p>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00A651]" />
              Groen = opgeslagen in database
            </div>
          </div>

          {/* Rijen */}
          {episodes.map((ep) => {
            const isSaved    = savedIds.has(ep.guid);
            const boundSave  = saveEpisode.bind(null, ep);

            return (
              <EpisodeRow
                key={ep.guid}
                episode={ep}
                isSaved={isSaved}
                saveAction={boundSave}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

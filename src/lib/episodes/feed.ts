import Parser from 'rss-parser';
import { unstable_cache } from 'next/cache';

const RSS_URL =
  process.env.RSS_FEED_URL ??
  'https://anchor.fm/s/104f071ac/podcast/rss';

// ─── Public type ─────────────────────────────────────────────

export interface RssEpisode {
  guid:              string;
  title:             string;
  description:       string;
  pubDate:           string;   // ISO 8601
  duration:          number;   // seconds
  durationFormatted: string;   // "1:02:34"
  spotifyUrl:        string;
  imageUrl:          string;
}

// ─── Duration helpers ────────────────────────────────────────

function parseDuration(raw: string | undefined): number {
  if (!raw) return 0;
  const parts = raw.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parseInt(raw, 10) || 0;
}

function formatDuration(sec: number): string {
  if (!sec) return '—';
  const h  = Math.floor(sec / 3600);
  const m  = Math.floor((sec % 3600) / 60);
  const s  = sec % 60;
  const mm = m.toString().padStart(2, '0');
  const ss = s.toString().padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

// ─── Fetch (uncached inner function) ─────────────────────────

async function _fetchEpisodes(): Promise<RssEpisode[]> {
  const parser = new Parser();
  const feed   = await parser.parseURL(RSS_URL);

  // Channel-level fallback image
  const channelImage =
    (feed as unknown as { itunes?: { image?: string } }).itunes?.image ??
    feed.image?.url ??
    '';

  return (feed.items ?? []).map((item) => {
    const seconds = parseDuration(item.itunes?.duration);

    // Episode-level image → channel fallback
    const imageUrl =
      item.itunes?.image ??
      channelImage;

    return {
      guid:              item.guid ?? item.link ?? '',
      title:             item.title ?? 'Onbekende aflevering',
      description:       item.contentSnippet ?? item.content ?? '',
      pubDate:           item.isoDate ?? item.pubDate ?? '',
      duration:          seconds,
      durationFormatted: formatDuration(seconds),
      spotifyUrl:        item.link ?? '',
      imageUrl,
    };
  });
}

// ─── Cached export (1 hour) ───────────────────────────────────

export const fetchEpisodes = unstable_cache(
  _fetchEpisodes,
  ['rss-episodes'],
  { revalidate: 3600 }
);

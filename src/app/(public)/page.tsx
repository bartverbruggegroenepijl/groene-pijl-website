import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';
import Link from 'next/link';
import {
  Mic,
  Clock,
  ExternalLink,
  ChevronRight,
  Instagram,
  ArrowRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Episode {
  id: string;
  title: string;
  description: string | null;
  duration: number | null;
  published_at: string | null;
  spotify_url: string | null;
  image_url: string | null;
}

interface CaptainPickPlayer {
  rank: number;
  player_name: string | null;
  player_club: string | null;
  position: string | null;
  motivation: string | null;
  image_url: string | null;
}

interface CaptainPick {
  id: string;
  gameweek: number | null;
  season: string | null;
  captain_pick_players: CaptainPickPlayer[];
}

interface BuyTipPlayer {
  player_name: string | null;
  player_club: string | null;
  position: string | null;
  price: number | null;
  motivation: string | null;
  image_url: string | null;
}

interface BuyTip {
  id: string;
  gameweek: number | null;
  buy_tip_players: BuyTipPlayer[];
}

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string | null;
  managers: { name: string } | null;
}

interface TeamPlayer {
  player_name: string | null;
  player_club: string | null;
  position: string | null;
  points: number | null;
  is_captain: boolean;
  player_image_url: string | null;
}

interface TeamOfTheWeek {
  id: string;
  week_number: number | null;
  formation: string | null;
  team_players: TeamPlayer[];
}

interface Manager {
  id: string;
  name: string;
  role: string | null;
  bio: string | null;
  avatar_url: string | null;
  instagram_url: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}u ${m}m`;
  return `${m} min`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function positionLabel(pos: string | null): string {
  const map: Record<string, string> = {
    GK: 'Keeper',
    DEF: 'Verdediger',
    MID: 'Middenvelder',
    FWD: 'Aanvaller',
  };
  return pos ? (map[pos] ?? pos) : '';
}

const rankConfig = [
  {
    rank: 1,
    label: '1e Keuze',
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-400',
    text: 'text-yellow-400',
    badge: '🥇',
  },
  {
    rank: 2,
    label: '2e Keuze',
    bg: 'bg-gray-400/10',
    border: 'border-gray-400',
    text: 'text-gray-300',
    badge: '🥈',
  },
  {
    rank: 3,
    label: '3e Keuze',
    bg: 'bg-orange-700/10',
    border: 'border-orange-600',
    text: 'text-orange-500',
    badge: '🥉',
  },
];

// ─── Player Avatar ────────────────────────────────────────────────────────────

function PlayerAvatar({
  imageUrl,
  name,
  size = 64,
}: {
  imageUrl: string | null;
  name: string | null;
  size?: number;
}) {
  if (imageUrl) {
    return (
      <div
        className="relative rounded-full overflow-hidden bg-primary-dark shrink-0"
        style={{ width: size, height: size }}
      >
        <Image
          src={imageUrl}
          alt={name ?? 'Speler'}
          fill
          className="object-cover"
        />
      </div>
    );
  }
  return (
    <div
      className="rounded-full bg-primary-dark flex items-center justify-center shrink-0 text-primary font-heading text-xl"
      style={{ width: size, height: size }}
    >
      {name?.charAt(0) ?? '?'}
    </div>
  );
}

// ─── Football Pitch Player Card ───────────────────────────────────────────────

function PitchPlayer({ player }: { player: TeamPlayer }) {
  return (
    <div className="flex flex-col items-center gap-1 w-16 sm:w-20">
      <div className="relative">
        <PlayerAvatar imageUrl={player.player_image_url} name={player.player_name} size={52} />
        {player.is_captain && (
          <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none">
            C
          </span>
        )}
      </div>
      <span className="font-body text-[11px] sm:text-xs text-white text-center leading-tight truncate w-full text-center font-semibold">
        {player.player_name ?? '—'}
      </span>
      <span className="font-body text-[10px] text-white/50 text-center leading-tight truncate w-full text-center">
        {player.player_club ?? ''}
      </span>
      {player.points !== null && (
        <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
          {player.points} pts
        </span>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const supabase = createClient();

  // Fetch all data in parallel
  const [
    episodesResult,
    captainResult,
    kooptipsResult,
    articlesResult,
    teamResult,
    managersResult,
  ] = await Promise.all([
    supabase
      .from('episodes')
      .select('id, title, description, duration, published_at, spotify_url, image_url')
      .order('published_at', { ascending: false })
      .limit(1),

    supabase
      .from('captain_picks')
      .select('id, gameweek, season, captain_pick_players(rank, player_name, player_club, position, motivation, image_url)')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(1),

    supabase
      .from('buy_tips')
      .select('id, gameweek, buy_tip_players(player_name, player_club, position, price, motivation, image_url)')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(1),

    supabase
      .from('articles')
      .select('id, title, slug, excerpt, cover_image, published_at, managers(name)')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(3),

    supabase
      .from('team_of_the_week')
      .select('id, week_number, formation, team_players(player_name, player_club, position, points, is_captain, player_image_url)')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(1),

    supabase
      .from('managers')
      .select('id, name, role, bio, avatar_url, instagram_url')
      .order('created_at', { ascending: true }),
  ]);

  const latestEpisode = (episodesResult.data?.[0] as Episode | undefined) ?? null;
  const captainPick = (captainResult.data?.[0] as CaptainPick | undefined) ?? null;
  const kooptips = (kooptipsResult.data?.[0] as BuyTip | undefined) ?? null;
  const articles = (articlesResult.data as Article[] | null) ?? [];
  const team = (teamResult.data?.[0] as TeamOfTheWeek | undefined) ?? null;
  const managers = (managersResult.data as Manager[] | null) ?? [];

  // Sort captain picks by rank
  const captainPlayers = (captainPick?.captain_pick_players ?? []).sort(
    (a, b) => a.rank - b.rank
  );

  // Group team players by position
  const gk = team?.team_players.filter((p) => p.position === 'GK') ?? [];
  const def = team?.team_players.filter((p) => p.position === 'DEF') ?? [];
  const mid = team?.team_players.filter((p) => p.position === 'MID') ?? [];
  const fwd = team?.team_players.filter((p) => p.position === 'FWD') ?? [];

  return (
    <main className="bg-background-dark text-white">
      {/* ── 1. HERO ─────────────────────────────────────────────────── */}
      <section className="min-h-[90vh] flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-dark/30 via-background-dark to-background-dark pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-sm font-body px-4 py-2 rounded-full mb-6">
            <Mic size={14} />
            De Nederlandse FPL Podcast
          </div>

          <h1 className="font-heading text-7xl sm:text-8xl lg:text-[10rem] text-white leading-none tracking-wide mb-4">
            DE{' '}
            <span className="text-primary">GROENE</span>{' '}
            PIJL
          </h1>

          <p className="font-body text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-8 leading-relaxed">
            Elke gameweek tips, captain picks, kooptips en analyses van vier FPL-verslaafde managers.
            Luister nu en verbeter je FPL-team!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {latestEpisode?.spotify_url ? (
              <a
                href={latestEpisode.spotify_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-body font-semibold px-8 py-3 rounded-lg transition-colors"
              >
                <Mic size={18} />
                Luister Nu
              </a>
            ) : (
              <a
                href="#afleveringen"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-body font-semibold px-8 py-3 rounded-lg transition-colors"
              >
                <Mic size={18} />
                Afleveringen
              </a>
            )}
            <a
              href="#artikelen"
              className="inline-flex items-center gap-2 border border-white/20 hover:border-primary text-white hover:text-primary font-body font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Lees Artikelen
              <ArrowRight size={16} />
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/30 text-xs font-body animate-bounce">
          <span>Scroll</span>
          <ChevronRight className="rotate-90" size={16} />
        </div>
      </section>

      {/* ── 2. LAATSTE AFLEVERING ──────────────────────────────────── */}
      <section id="afleveringen" className="py-20 px-4 bg-primary-dark/20">
        <div className="max-w-7xl mx-auto">
          <SectionHeader label="Podcast" title="Laatste Aflevering" />

          {latestEpisode ? (
            <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl overflow-hidden max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-0">
                {/* Thumbnail */}
                <div className="sm:w-56 sm:shrink-0 bg-primary-dark relative">
                  {latestEpisode.image_url ? (
                    <div className="relative w-full h-48 sm:h-full min-h-[180px]">
                      <Image
                        src={latestEpisode.image_url}
                        alt={latestEpisode.title ?? 'Aflevering'}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 sm:h-full min-h-[180px] flex items-center justify-center">
                      <Mic size={48} className="text-primary/40" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 p-6 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-primary/20 text-primary text-xs font-body font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
                        Nieuwste aflevering
                      </span>
                      {latestEpisode.published_at && (
                        <span className="text-white/40 text-xs font-body">
                          {formatDate(latestEpisode.published_at)}
                        </span>
                      )}
                    </div>
                    <h3 className="font-heading text-2xl sm:text-3xl text-white mb-2 leading-tight">
                      {latestEpisode.title}
                    </h3>
                    {latestEpisode.description && (
                      <p className="font-body text-sm text-white/60 leading-relaxed line-clamp-3">
                        {latestEpisode.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    {latestEpisode.duration && (
                      <span className="flex items-center gap-1.5 text-white/50 text-sm font-body">
                        <Clock size={14} />
                        {formatDuration(latestEpisode.duration)}
                      </span>
                    )}
                    {latestEpisode.spotify_url && (
                      <a
                        href={latestEpisode.spotify_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-body font-semibold px-5 py-2.5 rounded-lg transition-colors"
                      >
                        <ExternalLink size={14} />
                        Luister op Spotify
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState message="Nog geen afleveringen beschikbaar." />
          )}
        </div>
      </section>

      {/* ── 3. CAPTAIN PICK VAN DE WEEK ────────────────────────────── */}
      <section id="captain-pick" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            label={captainPick ? `GW ${captainPick.gameweek}` : 'Captain Pick'}
            title="Captain Pick van de Week"
          />

          {captainPlayers.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {captainPlayers.slice(0, 3).map((player) => {
                const config = rankConfig.find((r) => r.rank === player.rank) ?? rankConfig[2];
                return (
                  <div
                    key={player.rank}
                    className={`${config.bg} border ${config.border} rounded-2xl p-6 flex flex-col gap-4`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{config.badge}</span>
                      <span className={`font-heading text-xl ${config.text} tracking-wide`}>
                        {config.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <PlayerAvatar imageUrl={player.image_url} name={player.player_name} size={64} />
                      <div>
                        <p className="font-heading text-2xl text-white leading-tight">
                          {player.player_name ?? '—'}
                        </p>
                        <p className="font-body text-sm text-white/60">
                          {player.player_club}
                          {player.position && ` · ${positionLabel(player.position)}`}
                        </p>
                      </div>
                    </div>

                    {player.motivation && (
                      <p className="font-body text-sm text-white/70 leading-relaxed border-t border-white/10 pt-3 italic">
                        &quot;{player.motivation}&quot;
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState message="Nog geen captain pick beschikbaar voor deze gameweek." />
          )}
        </div>
      </section>

      {/* ── 4. KOOPTIPS VAN DE WEEK ────────────────────────────────── */}
      <section id="kooptips" className="py-20 px-4 bg-primary-dark/20">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            label={kooptips ? `GW ${kooptips.gameweek}` : 'Kooptips'}
            title="Kooptips van de Week"
          />

          {kooptips && kooptips.buy_tip_players.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {kooptips.buy_tip_players.map((player, i) => (
                <div
                  key={i}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center text-center gap-3 hover:border-primary/40 transition-colors"
                >
                  <PlayerAvatar imageUrl={player.image_url} name={player.player_name} size={72} />
                  <div>
                    <p className="font-heading text-xl text-white leading-tight">
                      {player.player_name ?? '—'}
                    </p>
                    <p className="font-body text-xs text-white/50 mt-0.5">
                      {player.player_club}
                      {player.position && ` · ${player.position}`}
                    </p>
                  </div>
                  {player.price !== null && (
                    <span className="bg-primary text-white font-body text-sm font-bold px-3 py-1 rounded-full">
                      £{Number(player.price).toFixed(1)}m
                    </span>
                  )}
                  {player.motivation && (
                    <p className="font-body text-xs text-white/60 leading-relaxed italic line-clamp-3">
                      {player.motivation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="Nog geen kooptips beschikbaar voor deze gameweek." />
          )}
        </div>
      </section>

      {/* ── 5. ARTIKELEN & ANALYSE ─────────────────────────────────── */}
      <section id="artikelen" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <SectionHeader label="Blog" title="Artikelen & Analyse" />
            <a
              href="/artikelen"
              className="hidden sm:flex items-center gap-1.5 text-primary hover:text-primary/80 font-body text-sm font-semibold transition-colors"
            >
              Alle artikelen <ArrowRight size={14} />
            </a>
          </div>

          {articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <article
                  key={article.id}
                  className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-primary/30 transition-colors group"
                >
                  {/* Cover */}
                  <div className="relative h-48 bg-primary-dark/50">
                    {article.cover_image ? (
                      <Image
                        src={article.cover_image}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="font-heading text-6xl text-primary/20">GP</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2 text-xs text-white/40 font-body">
                      {article.managers?.name && (
                        <span>{article.managers.name}</span>
                      )}
                      {article.published_at && (
                        <>
                          <span>·</span>
                          <span>{formatDate(article.published_at)}</span>
                        </>
                      )}
                    </div>
                    <h3 className="font-heading text-xl text-white mb-2 leading-tight group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="font-body text-sm text-white/60 leading-relaxed line-clamp-2 mb-4">
                        {article.excerpt}
                      </p>
                    )}
                    <Link
                      href={`/artikelen/${article.slug}`}
                      className="inline-flex items-center gap-1 text-primary text-sm font-body font-semibold hover:underline"
                    >
                      Lees meer <ArrowRight size={12} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState message="Nog geen artikelen gepubliceerd." />
          )}

          {articles.length > 0 && (
            <div className="text-center mt-8 sm:hidden">
              <a
                href="/artikelen"
                className="inline-flex items-center gap-1.5 text-primary font-body text-sm font-semibold"
              >
                Alle artikelen <ArrowRight size={14} />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ── 6. TEAM VAN DE WEEK ────────────────────────────────────── */}
      <section id="team" className="py-20 px-4 bg-primary-dark/20">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            label={team ? `GW ${team.week_number}` : 'Team'}
            title="Team van de Week"
          />

          {team && team.team_players.length > 0 ? (
            <div className="mt-8 max-w-3xl mx-auto">
              {/* Football Pitch */}
              <div
                className="relative rounded-2xl overflow-hidden py-8 px-4"
                style={{
                  background:
                    'linear-gradient(180deg, #0B5E2D 0%, #0D6B33 20%, #0B5E2D 40%, #0D6B33 60%, #0B5E2D 80%, #0D6B33 100%)',
                }}
              >
                {/* Pitch markings */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Center circle */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border border-white/15" />
                  {/* Center line */}
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-white/15" />
                  {/* Penalty boxes */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-40 h-16 border border-white/15 rounded-sm" />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-40 h-16 border border-white/15 rounded-sm" />
                </div>

                {/* Players: FWD → MID → DEF → GK (top to bottom) */}
                <div className="relative z-10 flex flex-col gap-8">
                  {/* Forwards */}
                  {fwd.length > 0 && (
                    <div className="flex justify-center gap-4 sm:gap-8">
                      {fwd.map((p, i) => (
                        <PitchPlayer key={i} player={p} />
                      ))}
                    </div>
                  )}

                  {/* Midfielders */}
                  {mid.length > 0 && (
                    <div className="flex justify-center gap-4 sm:gap-8">
                      {mid.map((p, i) => (
                        <PitchPlayer key={i} player={p} />
                      ))}
                    </div>
                  )}

                  {/* Defenders */}
                  {def.length > 0 && (
                    <div className="flex justify-center gap-2 sm:gap-6">
                      {def.map((p, i) => (
                        <PitchPlayer key={i} player={p} />
                      ))}
                    </div>
                  )}

                  {/* Goalkeeper */}
                  {gk.length > 0 && (
                    <div className="flex justify-center">
                      {gk.map((p, i) => (
                        <PitchPlayer key={i} player={p} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Formation badge */}
              {team.formation && (
                <p className="text-center mt-3 font-body text-sm text-white/40">
                  Formatie: <span className="text-primary font-semibold">{team.formation}</span>
                </p>
              )}
            </div>
          ) : (
            <EmptyState message="Nog geen team van de week beschikbaar." />
          )}
        </div>
      </section>

      {/* ── 7. DE MANAGERS ─────────────────────────────────────────── */}
      <section id="managers" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <SectionHeader label="Het Team" title="De Managers" />

          {managers.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {managers.map((manager) => (
                <div
                  key={manager.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center gap-3 hover:border-primary/30 transition-colors"
                >
                  {/* Avatar */}
                  {manager.avatar_url ? (
                    <div className="relative w-24 h-24 rounded-full overflow-hidden ring-2 ring-primary/40">
                      <Image
                        src={manager.avatar_url}
                        alt={manager.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-primary-dark ring-2 ring-primary/40 flex items-center justify-center">
                      <span className="font-heading text-4xl text-primary">
                        {manager.name.charAt(0)}
                      </span>
                    </div>
                  )}

                  <div>
                    <h3 className="font-heading text-2xl text-white">{manager.name}</h3>
                    {manager.role && (
                      <p className="font-body text-sm text-primary">{manager.role}</p>
                    )}
                  </div>

                  {manager.bio && (
                    <p className="font-body text-sm text-white/60 leading-relaxed line-clamp-3">
                      {manager.bio}
                    </p>
                  )}

                  {manager.instagram_url && (
                    <a
                      href={manager.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-white/50 hover:text-primary transition-colors text-sm font-body mt-auto"
                    >
                      <Instagram size={14} />
                      Instagram
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="Managers worden binnenkort toegevoegd." />
          )}
        </div>
      </section>
    </main>
  );
}

// ─── Shared UI Components ─────────────────────────────────────────────────────

function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <div>
      <span className="font-body text-xs font-semibold tracking-widest text-primary uppercase mb-1 block">
        {label}
      </span>
      <h2 className="font-heading text-4xl sm:text-5xl text-white tracking-wide leading-tight">
        {title}
      </h2>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="mt-8 py-12 text-center border border-dashed border-white/10 rounded-2xl">
      <p className="font-body text-white/40 text-sm">{message}</p>
    </div>
  );
}

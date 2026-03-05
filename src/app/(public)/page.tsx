import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';
import Link from 'next/link';
import {
  Mic,
  Clock,
  ExternalLink,
  ChevronDown,
  Instagram,
  ArrowRight,
  Play,
} from 'lucide-react';
import StandingsTable from '@/components/public/StandingsTable';
import { fetchLeagueStandings } from '@/lib/fpl/league';
import type { LeagueApiResponse } from '@/lib/fpl/league';
import { fetchGameweekInfo } from '@/lib/fpl/events';

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
  category: string | null;
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

interface PlayerOfWeek {
  id: string;
  gameweek: number | null;
  player_name: string | null;
  player_club: string | null;
  position: string | null;
  points: number | null;
  goals: number | null;
  assists: number | null;
  bonus: number | null;
  motivatie: string | null;
  image_url: string | null;
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
  return h > 0 ? `${h}u ${m}m` : `${m} min`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const CAPTAIN_RANKS = [
  { rank: 1, emoji: '🥇', label: '1e Keuze', borderColor: 'border-yellow-400', textColor: 'text-yellow-500', bgColor: 'bg-yellow-50' },
  { rank: 2, emoji: '🥈', label: '2e Keuze', borderColor: 'border-gray-300',   textColor: 'text-gray-500',   bgColor: 'bg-gray-50'   },
  { rank: 3, emoji: '🥉', label: '3e Keuze', borderColor: 'border-orange-400', textColor: 'text-orange-500', bgColor: 'bg-orange-50' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-2">
      {children}
    </span>
  );
}

function SectionTitleDark({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight border-l-4 border-primary pl-4"
        style={{ borderColor: '#00FA61' }}>
      {children}
    </h2>
  );
}

function SectionTitleLight({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
      {children}
    </h2>
  );
}

function EmptyPlaceholderDark({ message }: { message: string }) {
  return (
    <div className="mt-8 rounded-2xl border border-dashed border-white/10 py-16 text-center">
      <p className="text-white/30 text-sm">{message}</p>
    </div>
  );
}

function EmptyPlaceholderLight({ message }: { message: string }) {
  return (
    <div className="mt-8 rounded-2xl border border-dashed border-gray-200 py-16 text-center">
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  );
}

function PlayerBadgeDark({ imageUrl, name, size = 56, objectPosition = 'center' }: { imageUrl: string | null; name: string | null; size?: number; objectPosition?: string }) {
  if (imageUrl) {
    return (
      <div className="rounded-full overflow-hidden shrink-0" style={{ width: size, height: size }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={name ?? ''}
          width={size}
          height={size}
          className="w-full h-full object-cover"
          style={{ objectPosition }}
        />
      </div>
    );
  }
  return (
    <div
      className="rounded-full bg-white/10 flex items-center justify-center shrink-0 text-primary font-bold"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name?.charAt(0) ?? '?'}
    </div>
  );
}

function PlayerBadgeLight({ imageUrl, name, size = 56, objectPosition = 'center' }: { imageUrl: string | null; name: string | null; size?: number; objectPosition?: string }) {
  if (imageUrl) {
    return (
      <div className="rounded-full overflow-hidden shrink-0" style={{ width: size, height: size }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={name ?? ''}
          width={size}
          height={size}
          className="w-full h-full object-cover"
          style={{ objectPosition }}
        />
      </div>
    );
  }
  return (
    <div
      className="rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-primary font-bold"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name?.charAt(0) ?? '?'}
    </div>
  );
}

function PitchPlayer({ player }: { player: TeamPlayer }) {
  return (
    <div className="flex flex-col items-center gap-1 w-14 sm:w-16">
      <div className="relative">
        <PlayerBadgeDark imageUrl={player.player_image_url ?? null} name={player.player_name} size={48} />
        {player.is_captain && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-black text-[9px] font-black rounded-full flex items-center justify-center leading-none">
            C
          </span>
        )}
      </div>
      <span className="text-[10px] sm:text-xs text-white font-semibold text-center leading-tight truncate w-full">
        {player.player_name ?? '—'}
      </span>
      {player.points !== null && player.points > 0 && (
        <span className="text-[9px] bg-primary text-black font-bold px-1.5 py-0.5 rounded">
          {player.points}
        </span>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const supabase = createClient();

  // ── Supabase queries: each wrapped individually so one failure doesn't crash the page ──

  const fallback = { data: null, error: null };

  const episodesRes = await (async () => {
    try {
      return await supabase
        .from('episodes')
        .select('id, title, description, duration, published_at, spotify_url, image_url')
        .order('published_at', { ascending: false })
        .limit(1);
    } catch { return fallback; }
  })();

  const captainRes = await (async () => {
    try {
      return await supabase
        .from('captain_picks')
        .select('id, gameweek, captain_pick_players(rank, player_name, player_club, position, motivation, image_url)')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(1);
    } catch { return fallback; }
  })();

  const kooptipsRes = await (async () => {
    try {
      return await supabase
        .from('buy_tips')
        .select('id, gameweek, buy_tip_players(player_name, player_club, position, price, motivation, image_url)')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(1);
    } catch { return fallback; }
  })();

  const articlesRes = await (async () => {
    try {
      return await supabase
        .from('articles')
        .select('id, title, slug, excerpt, cover_image, published_at, category, managers(name)')
        .eq('published', true)
        .order('published_at', { ascending: false })
        .limit(3);
    } catch { return fallback; }
  })();

  const teamRes = await (async () => {
    try {
      return await supabase
        .from('team_of_the_week')
        .select('id, week_number, formation, team_players(player_name, player_club, position, points, is_captain, player_image_url)')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(1);
    } catch { return fallback; }
  })();

  const managersRes = await (async () => {
    try {
      return await supabase
        .from('managers')
        .select('id, name, role, bio, avatar_url, instagram_url')
        .order('created_at', { ascending: true });
    } catch { return fallback; }
  })();

  const playerOfWeekRes = await (async () => {
    try {
      return await supabase
        .from('player_of_the_week')
        .select('id, gameweek, player_name, player_club, position, points, goals, assists, bonus, motivatie, image_url')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(1);
    } catch { return fallback; }
  })();

  // site_settings may not exist in all environments — silent fallback
  const heroImageRes = await (async () => {
    try {
      return await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'hero_image')
        .maybeSingle();
    } catch { return fallback; }
  })();

  // ── Safely extract data with fallbacks ───────────────────────────────────────

  const episode      = (episodesRes.data?.[0] as Episode | undefined) ?? null;
  const captain      = (captainRes.data?.[0] as CaptainPick | undefined) ?? null;
  const kooptips     = (kooptipsRes.data?.[0] as BuyTip | undefined) ?? null;
  const articles     = (articlesRes.data as Article[] | null) ?? [];
  const team         = (teamRes.data?.[0] as TeamOfTheWeek | undefined) ?? null;
  const playerOfWeek = (playerOfWeekRes.data?.[0] as PlayerOfWeek | undefined) ?? null;

  // hero image: heroImageRes.data can be null (no row) or { value: string }
  const heroImageData = heroImageRes.data as { value?: string } | null;
  const heroImageUrl  = heroImageData?.value ?? null;

  // Deduplicate managers by name
  const allManagers = (managersRes.data as Manager[] | null) ?? [];
  const managers = allManagers.filter(
    (m, idx, arr) => arr.findIndex((x) => x.name === m.name) === idx,
  );

  const captainPlayers = [...(captain?.captain_pick_players ?? [])].sort((a, b) => a.rank - b.rank);
  const gk  = team?.team_players?.filter((p) => p.position === 'GK')  ?? [];
  const def = team?.team_players?.filter((p) => p.position === 'DEF') ?? [];
  const mid = team?.team_players?.filter((p) => p.position === 'MID') ?? [];
  const fwd = team?.team_players?.filter((p) => p.position === 'FWD') ?? [];

  // ── FPL mini-league: call FPL API directly (no self-referential HTTP) ────────
  // Self-referential fetches (server → own /api/... route) fail on Vercel during SSR.
  const leagueData: LeagueApiResponse | null = await fetchLeagueStandings();
  const gwInfo = await fetchGameweekInfo();

  return (
    <main className="text-white overflow-x-hidden" style={{ background: '#0D0B2A' }}>

      {/* ── 1. HERO ──────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">

        {/* Achtergrond: paars #1F0E84 → donkerpaars → donkerblauw */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #1F0E84 0%, #2D1B69 50%, #0d1f3c 100%)',
          }}
        />

        {/* Decoratieve logo-driehoek — groot, subtiel op achtergrond */}
        <div
          className="absolute pointer-events-none"
          style={{ right: '-2%', top: '50%', transform: 'translateY(-50%)', width: '55%', aspectRatio: '40/56', opacity: 0.12, zIndex: 0 }}
        >
          <svg viewBox="0 0 40 56" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
            <polygon
              points="20,2 38,26 2,26"
              fill="none"
              stroke="#00FA61"
              strokeWidth="0.8"
              strokeLinejoin="round"
            />
            <polygon
              points="3,32 37,32 20,54"
              fill="none"
              stroke="#00FA61"
              strokeWidth="0.8"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Hero spelersafbeelding — absolute, volledige hoogte, rechterkant, geen border of card */}
        <div
          className="absolute right-0 bottom-0 h-full pointer-events-none"
          style={{ width: '55%' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImageUrl ?? '/hero-players.jpg'}
            alt="FPL spelers"
            className="h-full w-full object-contain"
            style={{ objectPosition: 'bottom right' }}
          />
        </div>

        {/* Gradient overlay — links ondoorzichtig, rechts transparant */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, #1F0E84 25%, rgba(31,14,132,0.85) 40%, rgba(31,14,132,0.3) 60%, transparent 75%)',
            zIndex: 1,
          }}
        />

        {/* Diagonal white SVG divider */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ zIndex: 2 }}>
          <svg
            viewBox="0 0 1440 90"
            preserveAspectRatio="none"
            style={{ display: 'block', width: '100%', height: '90px' }}
            fill="white"
          >
            <polygon points="0,90 1440,0 1440,90" />
          </svg>
        </div>

        <div className="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-24 pb-16" style={{ zIndex: 3 }}>
          <div className="max-w-xl">

            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-xs font-semibold px-4 py-2 rounded-full mb-6 uppercase tracking-widest backdrop-blur-sm">
              De enige Nederlandse FPL Podcast
            </div>

            <h1
              className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.0] mb-4"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <span className="text-white">DE PLEK VOOR NEDERLANDSE</span>
              <span className="block text-white">FPL MANAGERS</span>
            </h1>

            <p
              className="text-xl sm:text-2xl font-semibold mb-5"
              style={{
                fontFamily: 'Montserrat, sans-serif',
                color: '#00FA61',
                textShadow: '0 0 24px rgba(0,250,97,0.7)',
              }}
            >
              Fantasy Premier League podcast
            </p>

            <p className="text-base text-white/70 leading-relaxed mb-8 max-w-md">
              Wekelijkse analyse, captainkeuzes en discussies om
              jouw FPL-team aan een groene pijl te helpen.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={episode?.spotify_url ?? '/afleveringen'}
                target={episode?.spotify_url ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 font-semibold px-7 py-3.5 rounded-full text-sm transition-all duration-300 text-black"
                style={{
                  background: '#00FA61',
                  boxShadow: '0 0 24px rgba(0,250,97,0.5), 0 4px 16px rgba(0,0,0,0.3)',
                }}
              >
                <Mic size={16} />
                Luister nieuwste aflevering
              </a>
              <a
                href="#captain-pick"
                className="inline-flex items-center justify-center gap-2 border border-white/30 text-white hover:border-primary hover:text-primary font-semibold px-7 py-3.5 rounded-full transition-all duration-300 text-sm backdrop-blur-sm"
              >
                Bekijk captain advies
              </a>
            </div>

            {/* Stats row */}
            <div className="flex gap-8 mt-10 pt-8 border-t border-white/10">
              <div>
                <p className="text-2xl font-bold" style={{ color: '#00FA61' }}>GW{gwInfo.currentGW ?? ''}</p>
                <p className="text-xs text-white/40 mt-0.5">Elke week content</p>
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: '#00FA61' }}>4</p>
                <p className="text-xs text-white/40 mt-0.5">Managers</p>
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: '#00FA61' }}>🎙️</p>
                <p className="text-xs text-white/40 mt-0.5">Spotify Podcast</p>
              </div>
            </div>

            {/* Scroll hint */}
            <div className="flex items-center gap-2 mt-8 text-white/25 text-xs">
              <ChevronDown size={14} className="animate-bounce" />
              <span>Scroll</span>
            </div>

          </div>
        </div>
      </section>

      {/* ── 2. LAATSTE AFLEVERING (white) ───────────────────────────── */}
      <section id="afleveringen" className="py-20 px-4 bg-white">
        <div className="max-w-8xl mx-auto">
          <SectionLabel>Podcast</SectionLabel>
          <SectionTitleLight>Laatste Aflevering</SectionTitleLight>

          {episode ? (
            <div className="mt-10 grid grid-cols-1 lg:grid-cols-5 gap-0 bg-white shadow-xl border border-gray-100 rounded-2xl overflow-hidden card-lift">
              <div className="lg:col-span-2 relative min-h-[220px] bg-gray-100">
                {episode.image_url ? (
                  <Image src={episode.image_url} alt={episode.title} fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00FA61 0%, #7B2FFF 100%)' }}>
                    <Mic size={56} className="text-black/30" />
                  </div>
                )}
                {episode.spotify_url && (
                  <a href={episode.spotify_url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-black/30 transition-colors group">
                    <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{ boxShadow: '0 0 24px rgba(0,250,97,0.4)' }}>
                      <Play size={24} className="text-black ml-1" fill="black" />
                    </div>
                  </a>
                )}
              </div>
              <div className="lg:col-span-3 p-6 sm:p-8 flex flex-col justify-between gap-5">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-3 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                      Nieuwste
                    </span>
                    {episode.published_at && <span className="text-gray-400 text-xs">{formatDate(episode.published_at)}</span>}
                    {episode.duration && (
                      <span className="flex items-center gap-1 text-gray-400 text-xs">
                        <Clock size={11} />{formatDuration(episode.duration)}
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 leading-tight">{episode.title}</h3>
                  {episode.description && (
                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">{episode.description}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {episode.spotify_url && (
                    <a href={episode.spotify_url} target="_blank" rel="noopener noreferrer" className="btn-glow inline-flex items-center gap-2 bg-primary text-black font-semibold text-sm px-5 py-2.5 rounded-xl transition-all duration-300 hover:bg-primary/90">
                      <ExternalLink size={14} />Luister op Spotify
                    </a>
                  )}
                  <a href="#afleveringen" className="inline-flex items-center gap-2 border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-400 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
                    Alle afleveringen <ArrowRight size={12} />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <EmptyPlaceholderLight message="Nog geen afleveringen beschikbaar." />
          )}
        </div>
      </section>

      {/* ── 3. CAPTAIN PICK VAN DE WEEK (dark navy) ─────────────────── */}
      <section id="captain-pick" className="py-20 px-4 bg-navy" style={{ borderTop: '2px solid rgba(0,250,97,0.18)' }}>
        <div className="max-w-8xl mx-auto">
          <SectionLabel>{captain ? `Gameweek ${captain.gameweek}` : 'Captain Pick'}</SectionLabel>
          <SectionTitleDark>Captain Pick van de Week</SectionTitleDark>

          {captainPlayers.length > 0 ? (
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
              {captainPlayers.slice(0, 3).map((p) => {
                const cfg = CAPTAIN_RANKS.find((r) => r.rank === p.rank) ?? CAPTAIN_RANKS[2];
                return (
                  <div key={p.rank} className={`card-lift bg-white border-2 ${cfg.borderColor} rounded-2xl p-6 flex flex-col gap-4`}>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{cfg.emoji}</span>
                      <span className={`text-sm font-semibold ${cfg.textColor} uppercase tracking-wide`}>{cfg.label}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <PlayerBadgeLight imageUrl={p.image_url} name={p.player_name} size={120} objectPosition="top" />
                      <div>
                        <p className="text-xl font-bold text-gray-900 leading-tight">{p.player_name ?? '—'}</p>
                        <p className="text-sm text-gray-400 mt-0.5">{p.player_club}{p.position && ` · ${p.position}`}</p>
                      </div>
                    </div>
                    {p.motivation && (
                      <p className="text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-4 italic">&quot;{p.motivation}&quot;</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyPlaceholderDark message="Nog geen captain pick beschikbaar voor deze gameweek." />
          )}
        </div>
      </section>

      {/* ── 4. KOOPTIPS VAN DE WEEK (white) ─────────────────────────── */}
      <section id="kooptips" className="py-20 px-4 bg-white">
        <div className="max-w-8xl mx-auto">
          <SectionLabel>{kooptips ? `Gameweek ${kooptips.gameweek}` : 'Kooptips'}</SectionLabel>
          <SectionTitleLight>Kooptips van de Week</SectionTitleLight>

          {kooptips && kooptips.buy_tip_players.length > 0 ? (
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {kooptips.buy_tip_players.map((p, i) => (
                <div key={i} className="card-lift bg-white border border-gray-100 hover:border-primary/30 rounded-2xl p-4 flex flex-col items-center text-center gap-3 transition-colors shadow-sm hover:shadow-md">
                  <PlayerBadgeLight imageUrl={p.image_url} name={p.player_name} size={120} objectPosition="top" />
                  <div>
                    <p className="font-bold text-gray-900 text-sm leading-tight">{p.player_name ?? '—'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{p.player_club}{p.position && ` · ${p.position}`}</p>
                  </div>
                  {p.price !== null && (
                    <span className="text-xs font-bold bg-primary text-black px-3 py-1 rounded-full">£{Number(p.price).toFixed(1)}m</span>
                  )}
                  {p.motivation && (
                    <p className="text-xs text-gray-500 italic leading-relaxed line-clamp-3">{p.motivation}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyPlaceholderLight message="Nog geen kooptips beschikbaar voor deze gameweek." />
          )}
        </div>
      </section>

      {/* ── 5. TEAM VAN DE WEEK (dark navy) ─────────────────────────── */}
      <section id="team" className="py-20 px-4 bg-navy" style={{ borderTop: '2px solid rgba(0,250,97,0.18)' }}>
        <div className="max-w-8xl mx-auto">
          <SectionLabel>{team ? `Gameweek ${team.week_number}` : 'Team'}</SectionLabel>
          <SectionTitleDark>Team van de Week</SectionTitleDark>

          {team && team.team_players.length > 0 ? (
            <div className="mt-10 max-w-2xl mx-auto">
              <div className="relative rounded-2xl overflow-hidden py-10 px-4 border border-white/5" style={{ background: 'linear-gradient(180deg, #0A4D23 0%, #0C5C2A 25%, #0A4D23 50%, #0C5C2A 75%, #0A4D23 100%)' }}>
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border border-white/10" />
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 w-36 h-14 border border-white/10 rounded-sm" />
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-36 h-14 border border-white/10 rounded-sm" />
                </div>
                <div className="relative z-10 flex flex-col gap-7">
                  {fwd.length > 0 && (
                    <div className="flex justify-center gap-3 sm:gap-8">{fwd.map((p, i) => <PitchPlayer key={i} player={p} />)}</div>
                  )}
                  {mid.length > 0 && (
                    <div className="flex justify-center gap-3 sm:gap-8">{mid.map((p, i) => <PitchPlayer key={i} player={p} />)}</div>
                  )}
                  {def.length > 0 && (
                    <div className="flex justify-center gap-2 sm:gap-5">{def.map((p, i) => <PitchPlayer key={i} player={p} />)}</div>
                  )}
                  {gk.length > 0 && (
                    <div className="flex justify-center">{gk.map((p, i) => <PitchPlayer key={i} player={p} />)}</div>
                  )}
                </div>
              </div>
              {team.formation && (
                <p className="text-center mt-3 text-sm text-white/30">
                  Formatie: <span className="text-primary font-semibold">{team.formation}</span>
                </p>
              )}
            </div>
          ) : (
            <EmptyPlaceholderDark message="Nog geen team van de week beschikbaar." />
          )}
        </div>
      </section>

      {/* ── 5b. SPELER VAN DE WEEK (white) ──────────────────────────── */}
      <section id="speler-van-de-week" className="py-20 px-4 bg-white">
        <div className="max-w-8xl mx-auto">
          <SectionLabel>{playerOfWeek ? `Gameweek ${playerOfWeek.gameweek}` : 'Uitblinker'}</SectionLabel>
          <SectionTitleLight>Speler van de Week</SectionTitleLight>

          {playerOfWeek ? (
            <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center max-w-4xl mx-auto">
              {/* Player photo */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-56 h-56 sm:w-72 sm:h-72 rounded-2xl overflow-hidden bg-gray-100 shadow-xl">
                    {playerOfWeek.image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={playerOfWeek.image_url}
                        alt={playerOfWeek.player_name ?? ''}
                        className="w-full h-full object-cover"
                        style={{ objectPosition: 'top center' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,250,97,0.15) 0%, rgba(123,47,255,0.15) 100%)' }}>
                        <span className="text-7xl font-bold text-primary/30">
                          {playerOfWeek.player_name?.charAt(0) ?? '?'}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Position badge */}
                  {playerOfWeek.position && (
                    <span className="absolute -top-3 -right-3 bg-primary text-black text-xs font-bold px-3 py-1.5 rounded-full shadow">
                      {playerOfWeek.position}
                    </span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div>
                <div className="mb-4">
                  <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                    {playerOfWeek.player_name ?? '—'}
                  </h3>
                  {playerOfWeek.player_club && (
                    <p className="text-gray-400 text-lg mt-1">{playerOfWeek.player_club}</p>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {[
                    { label: 'Punten',   value: playerOfWeek.points,  highlight: true },
                    { label: 'Goals',    value: playerOfWeek.goals,   highlight: false },
                    { label: 'Assists',  value: playerOfWeek.assists, highlight: false },
                    { label: 'Bonus',    value: playerOfWeek.bonus,   highlight: false },
                  ].map(({ label, value, highlight }) => (
                    <div
                      key={label}
                      className={`rounded-xl p-3 text-center ${
                        highlight
                          ? 'bg-primary text-black'
                          : 'bg-gray-50 border border-gray-100 text-gray-700'
                      }`}
                    >
                      <p className={`text-2xl font-bold ${highlight ? 'text-black' : 'text-gray-900'}`}>
                        {value ?? 0}
                      </p>
                      <p className={`text-xs font-semibold mt-0.5 ${highlight ? 'text-black/70' : 'text-gray-400'} uppercase tracking-wide`}>
                        {label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Motivatie */}
                {playerOfWeek.motivatie && (
                  <blockquote className="border-l-4 border-primary pl-4 italic text-gray-500 text-sm leading-relaxed">
                    &quot;{playerOfWeek.motivatie}&quot;
                  </blockquote>
                )}
              </div>
            </div>
          ) : (
            <EmptyPlaceholderLight message="Nog geen Speler van de Week beschikbaar." />
          )}
        </div>
      </section>

      {/* ── 6. ARTIKELEN & ANALYSE (white) ──────────────────────────── */}
      <section id="artikelen" className="py-20 px-4 bg-white">
        <div className="max-w-8xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <SectionLabel>Blog</SectionLabel>
              <SectionTitleLight>Artikelen &amp; Analyse</SectionTitleLight>
            </div>
            <Link href="/artikelen" className="hidden sm:inline-flex items-center gap-1.5 text-primary hover:text-primary/80 text-sm font-semibold transition-colors">
              Alle artikelen <ArrowRight size={14} />
            </Link>
          </div>

          {articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((a) => (
                <article key={a.id} className="card-lift bg-white border border-gray-100 hover:border-primary/20 rounded-2xl overflow-hidden group transition-colors shadow-sm hover:shadow-lg">
                  <div className="relative h-44 bg-gray-100">
                    {a.cover_image ? (
                      <Image src={a.cover_image} alt={a.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,250,97,0.12) 0%, rgba(123,47,255,0.16) 100%)' }}>
                        <span className="font-bold text-5xl text-primary/30">GP</span>
                      </div>
                    )}
                    {a.category && (
                      <span className="absolute top-3 left-3 bg-primary text-black text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">{a.category}</span>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                      {a.managers?.name && <span>{a.managers.name}</span>}
                      {a.published_at && <><span>·</span><span>{formatDate(a.published_at)}</span></>}
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 mb-2 leading-snug group-hover:text-primary transition-colors line-clamp-2">{a.title}</h3>
                    {a.excerpt && <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">{a.excerpt}</p>}
                    <Link href={`/artikelen/${a.slug}`} className="inline-flex items-center gap-1 text-primary text-sm font-semibold hover:underline">
                      Lees meer <ArrowRight size={12} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyPlaceholderLight message="Nog geen artikelen gepubliceerd." />
          )}

          {articles.length > 0 && (
            <div className="text-center mt-8 sm:hidden">
              <Link href="/artikelen" className="inline-flex items-center gap-1.5 text-primary font-semibold text-sm">
                Alle artikelen <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── 7. DE MANAGERS (dark navy) ───────────────────────────────── */}
      <section id="managers" className="py-20 px-4 bg-navy" style={{ borderTop: '2px solid rgba(0,250,97,0.18)' }}>
        <div className="max-w-8xl mx-auto">
          <SectionLabel>Het Team</SectionLabel>
          <SectionTitleDark>De Managers</SectionTitleDark>

          {managers.length > 0 ? (
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {managers.map((m) => (
                <Link key={m.id} href={`/managers/${m.id}`} className="card-lift bg-navy-card border border-white/8 hover:border-primary/50 hover:shadow-[0_0_28px_rgba(0,250,97,0.12)] rounded-2xl p-6 flex flex-col items-center text-center gap-3 transition-all duration-300 group">
                  {m.avatar_url ? (
                    <div className="relative w-20 h-20 rounded-full overflow-hidden ring-2 ring-white/10 group-hover:ring-primary/40 transition-all duration-300">
                      <Image src={m.avatar_url} alt={m.name} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-white/5 ring-2 ring-white/10 group-hover:ring-primary/40 flex items-center justify-center transition-all duration-300">
                      <span className="text-3xl font-bold text-primary">{m.name.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-xl text-white group-hover:text-primary transition-colors">{m.name}</h3>
                    {m.role && <p className="text-xs text-primary mt-0.5">{m.role}</p>}
                  </div>
                  {m.bio && <p className="text-xs text-white/50 leading-relaxed line-clamp-3">{m.bio}</p>}
                  {m.instagram_url && (
                    <span className="flex items-center gap-1.5 text-white/30 group-hover:text-primary text-xs transition-colors mt-auto">
                      <Instagram size={13} />Instagram
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <EmptyPlaceholderDark message="Managers worden binnenkort toegevoegd." />
          )}
        </div>
      </section>

      {/* ── 8. RANKINGS PREVIEW (dark navy) ──────────────────────────── */}
      {leagueData && (
        <section
          id="rankings"
          className="py-20 px-4"
          style={{ background: '#1F0E84', borderTop: '2px solid rgba(200,33,195,0.18)' }}
        >
          <div className="max-w-8xl mx-auto">
            {/* Header */}
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-2">
                  Mini-League
                </span>
                <h2
                  className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight border-l-4 pl-4"
                  style={{ borderColor: '#00FA61' }}
                >
                  MINI-LEAGUE STAND
                </h2>
                <p className="text-white/40 text-sm mt-1 pl-4">
                  {leagueData.league?.name ?? 'De Groene Pijl competitie'}
                </p>
              </div>
              <Link
                href="/rankings"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
                style={{ color: '#00FA61' }}
              >
                Volledige stand <ArrowRight size={14} />
              </Link>
            </div>

            {/* Top 10 preview */}
            <div className="max-w-3xl">
              <StandingsTable
                initialData={leagueData}
                limit={10}
                compact
              />
            </div>

            {/* Mobile "all" link */}
            <div className="text-center mt-6 sm:hidden">
              <Link
                href="/rankings"
                className="inline-flex items-center gap-1.5 text-sm font-semibold"
                style={{ color: '#00FA61' }}
              >
                Bekijk volledige stand <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── MINI-LEAGUE CTA (gradient) ───────────────────────────────── */}
      <section className="py-20 px-4 bg-navy">
        <div className="max-w-8xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #00FA61 0%, #7B2FFF 100%)' }} />
            <div className="relative z-10 text-center py-16 px-6">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black mb-4">
                JOIN ONZE MINI-LEAGUE
              </h2>
              <p className="text-black/70 text-lg mb-8 max-w-xl mx-auto">
                Speel mee met de managers van De Groene Pijl en meet je met andere luisteraars!
              </p>
              <a
                href="https://fantasy.premierleague.com/leagues/auto-join/t5mggi"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-black text-primary font-bold px-8 py-4 rounded-xl text-sm hover:bg-black/90 transition-colors"
              >
                Join Mini-League <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}

import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';
import Link from 'next/link';
import {
  Mic,
  Clock,
  ExternalLink,
  Instagram,
  ArrowRight,
  Play,
} from 'lucide-react';
import StandingsTable from '@/components/public/StandingsTable';
import { fetchLeagueStandings } from '@/lib/fpl/league';
import type { LeagueApiResponse } from '@/lib/fpl/league';
import { fetchGameweekInfo, FPL_HEADERS } from '@/lib/fpl/events';
import { fetchNextFixturesMap } from '@/lib/fpl/fixtures';
import type { NextFixture } from '@/lib/fpl/fixtures';
import { fetchEpisodes } from '@/lib/episodes/feed';
import HeroSection from '@/components/sections/HeroSection';
import TeamVanDeWeekSection from '@/components/sections/TeamVanDeWeekSection';
import TransferTipCard from '@/components/sections/TransferTipCard';
import TransferTipsSlider from '@/components/sections/TransferTipsSlider';
import ErrorHashRedirect from '@/components/ErrorHashRedirect';

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
  fpl_player_id: number | null;
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
  fpl_player_id: number | null;
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
  is_star_player: boolean;
  player_image_url: string | null;
}

interface TeamOfTheWeek {
  id: string;
  week_number: number | null;
  formation: string | null;
  sectie_naam: string | null;
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
  rank_geschiedenis: string | null;
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
  { rank: 1, emoji: '🥇', label: '1e Keuze', textColor: 'text-yellow-500',
    cardBg: 'rgba(255,255,255,0.60)', cardBorder: '3px solid #FFD700', cardShadow: '0 4px 20px rgba(255,215,0,0.3)' },
  { rank: 2, emoji: '🥈', label: '2e Keuze', textColor: 'text-gray-500',
    cardBg: 'rgba(255,255,255,0.60)', cardBorder: '3px solid #C0C0C0', cardShadow: '0 4px 20px rgba(192,192,192,0.3)' },
  { rank: 3, emoji: '🥉', label: '3e Keuze', textColor: 'text-orange-500',
    cardBg: 'rgba(255,255,255,0.60)', cardBorder: '3px solid #CD7F32', cardShadow: '0 4px 20px rgba(205,127,50,0.3)' },
];

// FDR kleurschema (1=makkelijk → 5=heel moeilijk)
function getFdrStyle(difficulty: number): React.CSSProperties {
  const styles: Record<number, React.CSSProperties> = {
    1: { background: '#375523', color: '#ffffff' },
    2: { background: '#01FC7A', color: '#111111' },
    3: { background: '#E7E7E7', color: '#111111' },
    4: { background: '#FF1751', color: '#ffffff' },
    5: { background: '#80072D', color: '#ffffff' },
  };
  return styles[difficulty] ?? styles[3];
}

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
    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight border-l-4 pl-4"
        style={{ color: '#ffffff', borderColor: '#00FA61' }}>
      {children}
    </h2>
  );
}

function SectionTitleLight({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight" style={{ color: '#1F0E84' }}>
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


// ─── FPL stats helpers ────────────────────────────────────────────────────────

function lookupFplStats(
  fplId: number | null,
  name: string | null,
  club: string | null,
  byId: Record<number, { goals: number; assists: number }>,
  byNameTeam: Record<string, { goals: number; assists: number }>,
): { goals: number; assists: number } {
  // 1. ID-gebaseerd (meest betrouwbaar, voorkomt naam-conflicten)
  if (fplId != null && byId[fplId]) return byId[fplId];
  // 2. Naam + team afkorting (bijv. "wilson|ful" vs "wilson|new")
  if (name && club) {
    const key = `${name.toLowerCase()}|${club.toLowerCase()}`;
    if (byNameTeam[key]) return byNameTeam[key];
  }
  // 3. Naam alleen (laatste redmiddel)
  if (name) {
    const lower = name.toLowerCase();
    if (byNameTeam[lower]) return byNameTeam[lower];
    const lastName = lower.split(' ').pop() ?? lower;
    return byNameTeam[lastName] ?? { goals: 0, assists: 0 };
  }
  return { goals: 0, assists: 0 };
}

function lookupCaptainStats(
  fplId: number | null,
  name: string | null,
  club: string | null,
  byId: Record<number, { xgPer90: string; xaPer90: string }>,
  byNameTeam: Record<string, { xgPer90: string; xaPer90: string }>,
): { xgPer90: string; xaPer90: string } {
  // 1. ID-gebaseerd (meest betrouwbaar, voorkomt naam-conflicten)
  if (fplId != null && byId[fplId]) return byId[fplId];
  // 2. Naam + team afkorting
  if (name && club) {
    const key = `${name.toLowerCase()}|${club.toLowerCase()}`;
    if (byNameTeam[key]) return byNameTeam[key];
  }
  // 3. Naam alleen (laatste redmiddel)
  if (name) {
    const lower = name.toLowerCase();
    if (byNameTeam[lower]) return byNameTeam[lower];
    const lastName = lower.split(' ').pop() ?? lower;
    return byNameTeam[lastName] ?? { xgPer90: '–', xaPer90: '–' };
  }
  return { xgPer90: '–', xaPer90: '–' };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const supabase = createClient();

  // ── Supabase queries: each wrapped individually so one failure doesn't crash the page ──

  const fallback = { data: null, error: null };

  // Mobiele hero afbeelding uit site_settings
  const mobileHeroRes = await (async () => {
    try {
      return await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'mobile_hero_image')
        .maybeSingle();
    } catch { return { data: null, error: null }; }
  })();
  const mobileHeroUrl = (mobileHeroRes.data as { value: string } | null)?.value ?? null;

  // Afleveringen: direct van RSS feed (altijd actueel, geen handmatige sync nodig)
  const episodesRes = await (async () => {
    try {
      const rssEps = await fetchEpisodes();
      if (!rssEps.length) return fallback;
      const ep = rssEps[0];
      return {
        data: [{
          id:           ep.guid,
          title:        ep.title,
          description:  ep.description  || null,
          duration:     ep.duration     || null,
          published_at: ep.pubDate      || null,
          spotify_url:  ep.spotifyUrl   || null,
          image_url:    ep.imageUrl     || null,
        }],
        error: null,
      };
    } catch { return fallback; }
  })();

  const captainRes = await (async () => {
    try {
      return await supabase
        .from('captain_picks')
        .select('id, gameweek, captain_pick_players(rank, player_name, player_club, position, motivation, image_url, fpl_player_id)')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(1);
    } catch { return fallback; }
  })();

  const kooptipsRes = await (async () => {
    try {
      return await supabase
        .from('buy_tips')
        .select('id, gameweek, buy_tip_players(player_name, player_club, position, price, motivation, image_url, fpl_player_id)')
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
        .select('id, week_number, formation, sectie_naam, team_players(player_name, player_club, position, points, is_captain, is_star_player, player_image_url)')
        .eq('published', true)
        .eq('season', '2025-26')
        .order('created_at', { ascending: false })
        .limit(1);
    } catch { return fallback; }
  })();

  const managersRes = await (async () => {
    try {
      return await supabase
        .from('managers')
        .select('id, name, role, rank_geschiedenis, avatar_url, instagram_url')
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

  // ── Safely extract data with fallbacks ───────────────────────────────────────

  const episode      = (episodesRes.data?.[0] as Episode | undefined) ?? null;
  const captain      = (captainRes.data?.[0] as CaptainPick | undefined) ?? null;
  const kooptips     = (kooptipsRes.data?.[0] as BuyTip | undefined) ?? null;
  const articles     = (articlesRes.data as Article[] | null) ?? [];
  const team         = (teamRes.data?.[0] as TeamOfTheWeek | undefined) ?? null;
  const playerOfWeek = (playerOfWeekRes.data?.[0] as PlayerOfWeek | undefined) ?? null;

  // Deduplicate managers by name
  const allManagers = (managersRes.data as Manager[] | null) ?? [];
  const managers = allManagers.filter(
    (m, idx, arr) => arr.findIndex((x) => x.name === m.name) === idx,
  );

  const captainPlayers = [...(captain?.captain_pick_players ?? [])].sort((a, b) => a.rank - b.rank);

  // ── FPL mini-league: call FPL API directly (no self-referential HTTP) ────────
  // Self-referential fetches (server → own /api/... route) fail on Vercel during SSR.
  const leagueData: LeagueApiResponse | null = await fetchLeagueStandings();
  const gwInfo = await fetchGameweekInfo();
  const currentGameweek = gwInfo.currentGW;

  // ── FPL fixtures: eerstvolgende wedstrijd per team voor captain FDR badge ────
  const nextFixturesMap = await fetchNextFixturesMap();

  // ── FPL spelersdata voor transfertips (goals + assists) + captain picks (xG/xA per 90) ──
  // revalidate: 300 = zelfde als fetchGameweekInfo() → Next.js dedupliceert de fetch
  // FPL_HEADERS vereist: FPL blokkeert requests zonder browser-achtige User-Agent
  // Primair: op FPL player ID (betrouwbaarst, voorkomt naam-conflicten zoals Wilson/FUL vs Wilson/NEW)
  // Fallback: op naam + team afkorting, daarna naam alleen
  const fplTransferStatsById:       Record<number, { goals: number; assists: number }>      = {};
  const fplCaptainStatsById:        Record<number, { xgPer90: string; xaPer90: string }>    = {};
  const fplTransferStatsByNameTeam: Record<string, { goals: number; assists: number }>      = {};
  const fplCaptainStatsByNameTeam:  Record<string, { xgPer90: string; xaPer90: string }>   = {};
  try {
    const fplBootstrapRes = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
      next: { revalidate: 300 },
      headers: FPL_HEADERS,
    });
    if (fplBootstrapRes.ok) {
      const fplJson = await fplBootstrapRes.json();
      // Bouw team id → short name map (bijv. 6 → 'che', 7 → 'cry')
      const teamShortMap: Record<number, string> = {};
      for (const t of (fplJson.teams ?? [])) {
        teamShortMap[t.id] = String(t.short_name ?? '').toLowerCase();
      }
      for (const el of (fplJson.elements ?? [])) {
        const teamShort = teamShortMap[el.team] ?? '';
        const webName   = String(el.web_name ?? '').toLowerCase();
        const fullName  = `${el.first_name ?? ''} ${el.second_name ?? ''}`.trim().toLowerCase();
        const transferStats = { goals: el.goals_scored ?? 0, assists: el.assists ?? 0 };
        // Primair: FPL player ID
        fplTransferStatsById[el.id] = transferStats;
        // Fallback: naam + team afkorting (bijv. "wilson|ful" vs "wilson|new")
        if (webName  && teamShort) fplTransferStatsByNameTeam[`${webName}|${teamShort}`]  = transferStats;
        if (fullName && teamShort) fplTransferStatsByNameTeam[`${fullName}|${teamShort}`] = transferStats;
        // Laatste redmiddel: naam alleen
        if (webName) fplTransferStatsByNameTeam[webName] = transferStats;
        // xG per 90 + xA per 90 voor captain picks
        const mins: number = el.minutes ?? 0;
        const xg = parseFloat(el.expected_goals ?? '0');
        const xa = parseFloat(el.expected_assists ?? '0');
        const captainStats = mins > 0
          ? { xgPer90: ((xg / mins) * 90).toFixed(2), xaPer90: ((xa / mins) * 90).toFixed(2) }
          : { xgPer90: '–', xaPer90: '–' };
        // Primair: FPL player ID
        fplCaptainStatsById[el.id] = captainStats;
        // Fallback: naam + team afkorting
        if (webName  && teamShort) fplCaptainStatsByNameTeam[`${webName}|${teamShort}`]  = captainStats;
        if (fullName && teamShort) fplCaptainStatsByNameTeam[`${fullName}|${teamShort}`] = captainStats;
        // Laatste redmiddel: naam alleen
        if (webName) fplCaptainStatsByNameTeam[webName] = captainStats;
      }
    } else {
      console.warn(`[FPL] bootstrap-static returned ${fplBootstrapRes.status} — stats vallen terug op lege waarden`);
    }
  } catch (err) {
    console.error('[FPL] bootstrap-static fetch mislukt:', err);
  }

  return (
    <main className="text-white overflow-x-hidden" style={{ background: '#0D0B2A' }}>

      {/* Redirect naar /account/setup als Supabase een #error= hash meestuurt */}
      <ErrorHashRedirect />

      {/* ── 1. HERO ──────────────────────────────────────────────────── */}
      <HeroSection
        currentGameweek={currentGameweek ?? undefined}
        latestEpisodeUrl={episode?.spotify_url ?? undefined}
      />

      {/* ── MOBIELE HERO FOTO — alleen zichtbaar op mobiel (< 768px) ── */}
      {mobileHeroUrl && (
        <div className="block md:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mobileHeroUrl}
            alt="Hero afbeelding"
            style={{
              width: '100%',
              maxHeight: 300,
              objectFit: 'cover',
              objectPosition: 'top center',
              display: 'block',
            }}
          />
        </div>
      )}

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
                  <Link href="/afleveringen" className="inline-flex items-center gap-2 border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-400 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
                    Alle afleveringen <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <EmptyPlaceholderLight message="Nog geen afleveringen beschikbaar." />
          )}
        </div>
      </section>

      {/* ── 3. CAPTAIN PICK VAN DE WEEK (gradient) ─────────────────── */}
      <section id="captain-pick" className="py-20 px-4" style={{ position: 'relative', backgroundImage: "url('/gradient-bg.png')", backgroundSize: 'cover', backgroundPosition: 'center', borderTop: '2px solid rgba(0,250,97,0.18)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 50%, rgba(0,250,97,0.12) 0%, rgba(200,33,195,0.1) 40%, transparent 65%)', pointerEvents: 'none' }} />
        <div className="max-w-8xl mx-auto" style={{ position: 'relative', zIndex: 1 }}>
          <SectionLabel>{captain ? `Gameweek ${captain.gameweek}` : 'Captain Pick'}</SectionLabel>
          <SectionTitleDark>Captain Pick van de Week</SectionTitleDark>

          {captainPlayers.length > 0 ? (
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
              {captainPlayers.slice(0, 3).map((p) => {
                const cfg = CAPTAIN_RANKS.find((r) => r.rank === p.rank) ?? CAPTAIN_RANKS[2];
                return (
                  <div key={p.rank} className="card-lift rounded-2xl p-6 flex flex-col gap-4" style={{ background: cfg.cardBg, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: cfg.cardBorder, boxShadow: cfg.cardShadow }}>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{cfg.emoji}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#1F0E84', letterSpacing: '0.5px', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>{cfg.label}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <PlayerBadgeLight imageUrl={p.image_url} name={p.player_name} size={120} objectPosition="top" />
                      <div>
                        <p className="text-xl leading-tight" style={{ color: '#1F0E84', fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>{p.player_name ?? '—'}</p>
                        <p className="text-sm mt-0.5" style={{ color: '#666666' }}>{p.player_club}{p.position && ` · ${p.position}`}</p>
                        {(() => {
                          const fix: NextFixture | undefined = nextFixturesMap.get(p.player_club?.toLowerCase() ?? '');
                          if (!fix) return null;
                          const fdrStyle = getFdrStyle(fix.difficulty);
                          const fdrBg    = fdrStyle.background as string;
                          const fdrTxt   = fdrStyle.color as string;
                          return (
                            <div className="mt-2">
                              <div style={{
                                display: 'inline-flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                backgroundColor: fdrBg,
                                minWidth: '48px',
                              }}>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: fdrTxt, lineHeight: 1.2 }}>
                                  {fix.opponent}
                                </span>
                                <span style={{ fontSize: '10px', fontWeight: 500, color: fdrTxt, opacity: 0.85 }}>
                                  ({fix.location === 'H' ? 'H' : 'U'})
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    {/* Seizoen goals/assists links + xG/xA per 90 rechts */}
                    {(() => {
                      const cs = lookupCaptainStats(p.fpl_player_id, p.player_name, p.player_club, fplCaptainStatsById, fplCaptainStatsByNameTeam);
                      const ss = lookupFplStats(p.fpl_player_id, p.player_name, p.player_club, fplTransferStatsById, fplTransferStatsByNameTeam);
                      return (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 600, color: '#1F0E84', padding: '4px 0' }}>
                          {/* Seizoen totalen — links */}
                          <div style={{ display: 'flex', gap: 10 }}>
                            <span>⚽ {ss.goals}</span>
                            <span>🅰️ {ss.assists}</span>
                          </div>
                          {/* xG/xA per 90 — rechts */}
                          <div style={{ display: 'flex', gap: 10 }}>
                            <span>⚽ xG/90: <strong style={{ color: '#1F0E84' }}>{cs.xgPer90}</strong></span>
                            <span>🅰️ xA/90: <strong style={{ color: '#1F0E84' }}>{cs.xaPer90}</strong></span>
                          </div>
                        </div>
                      );
                    })()}
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

      {/* ── 4. KOOPTIPS VAN DE WEEK (wit blok) ──────────────────────── */}
      <section
        id="kooptips"
        className="py-20 px-4"
        style={{ background: '#ffffff', color: '#1F0E84' }}
      >
        <div className="max-w-8xl mx-auto">
          <span style={{ display: 'inline-block', color: '#00FA61', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 8, fontFamily: 'Montserrat, sans-serif' }}>
            {kooptips ? `Gameweek ${kooptips.gameweek}` : 'Transfertips'}
          </span>
          <h2 style={{ color: '#1F0E84', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, lineHeight: 1.1, fontFamily: 'Montserrat, sans-serif', margin: 0 }}>
            Transfertips van de Week
          </h2>

          {kooptips && kooptips.buy_tip_players.length > 0 ? (
            <TransferTipsSlider count={kooptips.buy_tip_players.length}>
              {kooptips.buy_tip_players.map((p, i) => {
                const stats = lookupFplStats(p.fpl_player_id, p.player_name, p.player_club, fplTransferStatsById, fplTransferStatsByNameTeam);
                const captainStats = lookupCaptainStats(p.fpl_player_id, p.player_name, p.player_club, fplCaptainStatsById, fplCaptainStatsByNameTeam);
                return (
                  <TransferTipCard
                    key={i}
                    playerName={p.player_name}
                    playerClub={p.player_club}
                    position={p.position}
                    price={p.price}
                    motivation={p.motivation}
                    imageUrl={p.image_url}
                    goals={stats.goals}
                    assists={stats.assists}
                    xgPer90={captainStats.xgPer90}
                    xaPer90={captainStats.xaPer90}
                  />
                );
              })}
            </TransferTipsSlider>
          ) : (
            <EmptyPlaceholderDark message="Nog geen transfertips beschikbaar voor deze gameweek." />
          )}
        </div>
      </section>

      {/* ── 5. TEAM VAN DE WEEK (gradient) ─────────────────────────── */}
      <TeamVanDeWeekSection team={team} />

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

      {/* ── 6. ARTIKELEN & ANALYSE (gradient) ───────────────────────── */}
      <section id="artikelen" className="py-20 px-4" style={{ backgroundImage: "url('/gradient-bg.png')", backgroundSize: 'cover', backgroundPosition: 'center', borderTop: '2px solid rgba(0,250,97,0.18)' }}>
        <div className="max-w-8xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <SectionLabel>Blog</SectionLabel>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight" style={{ color: '#ffffff' }}>Artikelen &amp; Analyse</h2>
            </div>
            <Link href="/artikelen" className="hidden sm:inline-flex items-center gap-1.5 text-primary hover:text-primary/80 text-sm font-semibold transition-colors">
              Alle artikelen <ArrowRight size={14} />
            </Link>
          </div>

          {articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((a) => (
                <Link
                  key={a.id}
                  href={`/artikelen/${a.slug}`}
                  className="card-lift rounded-2xl overflow-hidden group transition-all block hover:opacity-90 hover:shadow-xl hover:shadow-primary/10"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', cursor: 'pointer' }}
                >
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
                    <div className="flex items-center gap-2 text-xs mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {a.managers?.name && <span>{a.managers.name}</span>}
                      {a.published_at && <><span>·</span><span>{formatDate(a.published_at)}</span></>}
                    </div>
                    <h3 className="font-bold text-lg mb-2 leading-snug group-hover:text-primary transition-colors line-clamp-2" style={{ color: '#ffffff' }}>{a.title}</h3>
                    {a.excerpt && <p className="text-sm leading-relaxed line-clamp-2 mb-4" style={{ color: 'rgba(255,255,255,0.65)' }}>{a.excerpt}</p>}
                    <span className="inline-flex items-center gap-1 text-primary text-sm font-semibold group-hover:underline">
                      Lees meer <ArrowRight size={12} />
                    </span>
                  </div>
                </Link>
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

      {/* ── 7. DE MANAGERS (white) ───────────────────────────────── */}
      <section id="managers" className="py-20 px-4 bg-white">
        <div className="max-w-8xl mx-auto">
          <SectionLabel>Het Team</SectionLabel>
          <SectionTitleLight>De Managers</SectionTitleLight>

          {managers.length > 0 ? (
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {managers.map((m) => (
                <Link key={m.id} href={`/managers/${m.id}`} className="card-lift bg-white border border-gray-100 hover:border-primary/30 hover:shadow-lg rounded-2xl p-6 flex flex-col items-center text-center gap-3 transition-all duration-300 group">
                  {m.avatar_url ? (
                    <div className="relative w-20 h-20 rounded-full overflow-hidden ring-2 ring-gray-200 group-hover:ring-primary/40 transition-all duration-300">
                      <Image src={m.avatar_url} alt={m.name} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-100 ring-2 ring-gray-200 group-hover:ring-primary/40 flex items-center justify-center transition-all duration-300">
                      <span className="text-3xl font-bold text-primary">{m.name.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-xl text-gray-900 group-hover:text-primary transition-colors">{m.name}</h3>
                    {m.role && <p className="text-xs text-primary mt-0.5">{m.role}</p>}
                  </div>
                  {m.rank_geschiedenis && <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{m.rank_geschiedenis}</p>}
                  {m.instagram_url && (
                    <span className="flex items-center gap-1.5 text-gray-400 group-hover:text-primary text-xs transition-colors mt-auto">
                      <Instagram size={13} />Instagram
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <EmptyPlaceholderLight message="Managers worden binnenkort toegevoegd." />
          )}
        </div>
      </section>


      {/* ── 8. RANKINGS PREVIEW (dark navy) ──────────────────────────── */}
      {leagueData && (
        <section
          id="rankings"
          className="py-20 px-4"
          style={{ background: 'linear-gradient(135deg, #2D1B69 0%, #1F0E84 40%, #1a1361 70%, rgba(0,250,97,0.2) 100%)', borderTop: '2px solid rgba(200,33,195,0.18)' }}
        >
          <div className="max-w-8xl mx-auto">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-8">
              <span className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-2">
                Mini-League
              </span>
              <h2
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight border-l-4 pl-4"
                style={{ borderColor: '#00FA61' }}
              >
                MINI-LEAGUE STAND
              </h2>
              <p className="text-white/40 text-sm mt-1">
                {leagueData.league?.name ?? 'De Groene Pijl competitie'}
              </p>
              <Link
                href="/rankings"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold transition-colors mt-4"
                style={{ color: '#00FA61' }}
              >
                Volledige stand <ArrowRight size={14} />
              </Link>
            </div>

            {/* Top 10 preview */}
            <div className="max-w-3xl mx-auto">
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
      <section className="py-20 px-4" style={{ backgroundImage: "url('/gradient-bg.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
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

// ─── Podcast ────────────────────────────────────────────────

export interface Episode {
  id: string;
  title: string;
  description: string;
  pubDate: string;
  audioUrl: string;
  duration: string;
  imageUrl?: string;
  slug: string;
}

export interface PodcastFeed {
  title: string;
  description: string;
  imageUrl: string;
  episodes: Episode[];
}

// ─── Auth ────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

// ─── Database ────────────────────────────────────────────────

export interface Manager {
  id: string;
  name: string;
  role: string | null;
  bio: string | null;
  avatar_url: string | null;
  instagram_url: string | null;
  created_at: string;
}

export type ArticleCategory =
  | 'Transfers'
  | 'Captain'
  | 'Wildcard'
  | 'Differentials'
  | 'GW Preview'
  | 'GW Review';

export const ARTICLE_CATEGORIES: ArticleCategory[] = [
  'Transfers',
  'Captain',
  'Wildcard',
  'Differentials',
  'GW Preview',
  'GW Review',
];

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image: string | null;
  category: ArticleCategory | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author_id: string | null;
  // joined
  managers?: Pick<Manager, 'id' | 'name'> | null;
}

// ─── Clubs ────────────────────────────────────────────────────

export interface Club {
  id: string;
  name: string;
  short_name: string | null;
  shirt_image_url: string | null;
  created_at: string;
}

// ─── FPL API ─────────────────────────────────────────────────

export interface FplPlayer {
  id: number;
  code: number;
  name: string;
  fullName: string;
  team: string;
  teamId: number;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  totalPoints: number;
  eventPoints: number;
  price: number;
  /** FPL photo URL — null when the player has no photo in the FPL API */
  imageUrl: string | null;
}

// ─── Team van de Week ─────────────────────────────────────────

export interface TeamOfTheWeek {
  id: string;
  week_number: number | null;
  season: string | null;
  formation: string | null;
  published: boolean;
  created_at: string;
}

export interface TeamPlayer {
  id: string;
  team_id: string;
  player_name: string | null;
  player_club: string | null;
  position: 'GK' | 'DEF' | 'MID' | 'FWD' | null;
  points: number | null;
  is_captain: boolean;
  is_star_player: boolean;
  player_image_url: string | null;
}

// ─── Kooptips ─────────────────────────────────────────────────

export interface BuyTip {
  id: string;
  gameweek: number | null;
  season: string | null;
  published: boolean;
  created_at: string;
}

export interface BuyTipPlayer {
  id: string;
  buy_tip_id: string;
  player_name: string | null;
  player_club: string | null;
  position: string | null;
  price: number | null;
  motivation: string | null;
  fpl_player_id: number | null;
  image_url: string | null;
}

// ─── Speler van de Week ────────────────────────────────────────

export interface PlayerOfWeek {
  id: string;
  gameweek: number | null;
  season: string | null;
  player_name: string | null;
  player_club: string | null;
  position: 'GK' | 'DEF' | 'MID' | 'FWD' | null;
  points: number | null;
  goals: number | null;
  assists: number | null;
  bonus: number | null;
  motivatie: string | null;
  image_url: string | null;
  published: boolean;
  created_at: string;
}

// ─── Captain Keuze ────────────────────────────────────────────

export interface CaptainPick {
  id: string;
  gameweek: number | null;
  season: string | null;
  published: boolean;
  created_at: string;
}

export interface CaptainPickPlayer {
  id: string;
  captain_pick_id: string;
  rank: number;
  player_name: string | null;
  player_club: string | null;
  position: string | null;
  motivation: string | null;
  fpl_player_id: number | null;
  image_url: string | null;
}

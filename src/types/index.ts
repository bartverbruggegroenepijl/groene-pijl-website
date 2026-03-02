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

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author_id: string | null;
  // joined
  managers?: Pick<Manager, 'id' | 'name'> | null;
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
  imageUrl: string;
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
  player_image_url: string | null;
}

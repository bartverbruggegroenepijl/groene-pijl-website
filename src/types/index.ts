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

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

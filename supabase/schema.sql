-- ============================================================
-- De Groene Pijl – Database Schema
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE: managers
-- (defined first because articles references it)
-- ============================================================

CREATE TABLE IF NOT EXISTS managers (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text        NOT NULL,
  role              text,
  bio               text,
  rank_geschiedenis text,
  avatar_url        text,
  instagram_url     text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Migration: add rank_geschiedenis column if it doesn't exist yet
ALTER TABLE managers ADD COLUMN IF NOT EXISTS rank_geschiedenis text;

-- ============================================================
-- TABLE: articles
-- ============================================================

CREATE TABLE IF NOT EXISTS articles (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text        NOT NULL,
  slug         text        UNIQUE NOT NULL,
  excerpt      text,
  content      text,
  cover_image  text,
  published    boolean     NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  author_id    uuid        REFERENCES managers (id) ON DELETE SET NULL
);

-- Automatically update updated_at on row change
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS articles_updated_at ON articles;
CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: episodes
-- ============================================================

CREATE TABLE IF NOT EXISTS episodes (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  spotify_id   text        UNIQUE,
  title        text,
  description  text,
  duration     integer,
  published_at timestamptz,
  spotify_url  text,
  image_url    text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: team_of_the_week
-- ============================================================

CREATE TABLE IF NOT EXISTS team_of_the_week (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number integer,
  season      text,
  formation   text,
  published   boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: team_players
-- ============================================================

CREATE TABLE IF NOT EXISTS team_players (
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id          uuid    NOT NULL REFERENCES team_of_the_week (id) ON DELETE CASCADE,
  player_name      text,
  player_club      text,
  position         text    CHECK (position IN ('GK', 'DEF', 'MID', 'FWD')),
  points           integer,
  is_captain       boolean NOT NULL DEFAULT false,
  player_image_url text
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE managers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_of_the_week  ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_players      ENABLE ROW LEVEL SECURITY;

-- ── managers ────────────────────────────────────────────────

DROP POLICY IF EXISTS "Public read managers" ON managers;
CREATE POLICY "Public read managers"
  ON managers FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated write managers" ON managers;
CREATE POLICY "Authenticated write managers"
  ON managers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── articles ────────────────────────────────────────────────

DROP POLICY IF EXISTS "Public read articles" ON articles;
CREATE POLICY "Public read articles"
  ON articles FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated write articles" ON articles;
CREATE POLICY "Authenticated write articles"
  ON articles FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── episodes ────────────────────────────────────────────────

DROP POLICY IF EXISTS "Public read episodes" ON episodes;
CREATE POLICY "Public read episodes"
  ON episodes FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated write episodes" ON episodes;
CREATE POLICY "Authenticated write episodes"
  ON episodes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── team_of_the_week ────────────────────────────────────────

DROP POLICY IF EXISTS "Public read team_of_the_week" ON team_of_the_week;
CREATE POLICY "Public read team_of_the_week"
  ON team_of_the_week FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated write team_of_the_week" ON team_of_the_week;
CREATE POLICY "Authenticated write team_of_the_week"
  ON team_of_the_week FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── team_players ────────────────────────────────────────────

DROP POLICY IF EXISTS "Public read team_players" ON team_players;
CREATE POLICY "Public read team_players"
  ON team_players FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated write team_players" ON team_players;
CREATE POLICY "Authenticated write team_players"
  ON team_players FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- TABLE: buy_tips
-- ============================================================

CREATE TABLE IF NOT EXISTS buy_tips (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gameweek   integer,
  season     text,
  published  boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: buy_tip_players
-- ============================================================

CREATE TABLE IF NOT EXISTS buy_tip_players (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  buy_tip_id    uuid    NOT NULL REFERENCES buy_tips (id) ON DELETE CASCADE,
  player_name   text,
  player_club   text,
  position      text,
  price         numeric,
  motivation    text,
  fpl_player_id integer,
  image_url     text
);

-- ============================================================
-- TABLE: captain_picks
-- ============================================================

CREATE TABLE IF NOT EXISTS captain_picks (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gameweek   integer,
  season     text,
  published  boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: captain_pick_players
-- ============================================================

CREATE TABLE IF NOT EXISTS captain_pick_players (
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  captain_pick_id  uuid    NOT NULL REFERENCES captain_picks (id) ON DELETE CASCADE,
  rank             integer NOT NULL,
  player_name      text,
  player_club      text,
  position         text,
  motivation       text,
  fpl_player_id    integer,
  image_url        text
);

-- ============================================================
-- RLS – buy_tips & buy_tip_players
-- ============================================================

ALTER TABLE buy_tips        ENABLE ROW LEVEL SECURITY;
ALTER TABLE buy_tip_players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read buy_tips" ON buy_tips;
CREATE POLICY "Public read buy_tips"
  ON buy_tips FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated write buy_tips" ON buy_tips;
CREATE POLICY "Authenticated write buy_tips"
  ON buy_tips FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public read buy_tip_players" ON buy_tip_players;
CREATE POLICY "Public read buy_tip_players"
  ON buy_tip_players FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated write buy_tip_players" ON buy_tip_players;
CREATE POLICY "Authenticated write buy_tip_players"
  ON buy_tip_players FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- RLS – captain_picks & captain_pick_players
-- ============================================================

ALTER TABLE captain_picks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE captain_pick_players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read captain_picks" ON captain_picks;
CREATE POLICY "Public read captain_picks"
  ON captain_picks FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated write captain_picks" ON captain_picks;
CREATE POLICY "Authenticated write captain_picks"
  ON captain_picks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public read captain_pick_players" ON captain_pick_players;
CREATE POLICY "Public read captain_pick_players"
  ON captain_pick_players FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated write captain_pick_players" ON captain_pick_players;
CREATE POLICY "Authenticated write captain_pick_players"
  ON captain_pick_players FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- STORAGE – player-images bucket
-- Run these statements in the Supabase SQL editor.
-- The bucket must be created as "public" via the dashboard
-- or via the INSERT below.
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
  VALUES ('player-images', 'player-images', true)
  ON CONFLICT (id) DO NOTHING;

-- Public read
DROP POLICY IF EXISTS "Public read player-images" ON storage.objects;
CREATE POLICY "Public read player-images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'player-images');

-- Authenticated upload
DROP POLICY IF EXISTS "Authenticated upload player-images" ON storage.objects;
CREATE POLICY "Authenticated upload player-images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'player-images');

-- Authenticated update
DROP POLICY IF EXISTS "Authenticated update player-images" ON storage.objects;
CREATE POLICY "Authenticated update player-images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'player-images');

-- Authenticated delete
DROP POLICY IF EXISTS "Authenticated delete player-images" ON storage.objects;
CREATE POLICY "Authenticated delete player-images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'player-images');

-- ============================================================
-- SEED DATA – Managers / Hosts
-- ============================================================

INSERT INTO managers (name, role) VALUES
  ('Bart',    'Host & Manager'),
  ('Jeffrey', 'Host & Manager'),
  ('Tom',     'Host & Manager'),
  ('Kieran',  'Host & Manager')
ON CONFLICT DO NOTHING;

-- ============================================================
-- TABLE: clubs (Premier League clubs with shirt images)
-- ============================================================

CREATE TABLE IF NOT EXISTS clubs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text        NOT NULL,
  short_name      text,
  shirt_image_url text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read clubs" ON clubs;
CREATE POLICY "Public read clubs"
  ON clubs FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated write clubs" ON clubs;
CREATE POLICY "Authenticated write clubs"
  ON clubs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- SEED DATA – Premier League 2024-25 Clubs
-- ============================================================

INSERT INTO clubs (name, short_name) VALUES
  ('Arsenal',          'ARS'),
  ('Aston Villa',      'AVL'),
  ('Bournemouth',      'BOU'),
  ('Brentford',        'BRE'),
  ('Brighton',         'BHA'),
  ('Chelsea',          'CHE'),
  ('Crystal Palace',   'CRY'),
  ('Everton',          'EVE'),
  ('Fulham',           'FUL'),
  ('Ipswich',          'IPS'),
  ('Leicester',        'LEI'),
  ('Liverpool',        'LIV'),
  ('Man City',         'MCI'),
  ('Man United',       'MUN'),
  ('Newcastle',        'NEW'),
  ('Nottm Forest',     'NFO'),
  ('Southampton',      'SOU'),
  ('Spurs',            'TOT'),
  ('West Ham',         'WHU'),
  ('Wolves',           'WOL')
ON CONFLICT DO NOTHING;

-- ============================================================
-- STORAGE – club-shirts bucket
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
  VALUES ('club-shirts', 'club-shirts', true)
  ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read club-shirts" ON storage.objects;
CREATE POLICY "Public read club-shirts"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'club-shirts');

DROP POLICY IF EXISTS "Authenticated upload club-shirts" ON storage.objects;
CREATE POLICY "Authenticated upload club-shirts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'club-shirts');

DROP POLICY IF EXISTS "Authenticated update club-shirts" ON storage.objects;
CREATE POLICY "Authenticated update club-shirts"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'club-shirts');

DROP POLICY IF EXISTS "Authenticated delete club-shirts" ON storage.objects;
CREATE POLICY "Authenticated delete club-shirts"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'club-shirts');

-- ============================================================
-- ALTER articles – add category column
-- ============================================================

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS category text
  CHECK (category IN ('Transfers', 'Captain', 'Wildcard', 'Differentials', 'GW Preview', 'GW Review'));

-- ============================================================
-- ALTER team_players – add club reference (optional FK)
-- ============================================================

ALTER TABLE team_players
  ADD COLUMN IF NOT EXISTS player_club_id uuid REFERENCES clubs (id) ON DELETE SET NULL;

-- ============================================================
-- ALTER team_players – add star player flag
-- ============================================================

ALTER TABLE team_players
  ADD COLUMN IF NOT EXISTS is_star_player boolean NOT NULL DEFAULT false;

-- ============================================================
-- TABLE: player_of_the_week
-- ============================================================

CREATE TABLE IF NOT EXISTS player_of_the_week (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gameweek    integer,
  season      text,
  player_name text,
  player_club text,
  position    text        CHECK (position IN ('GK', 'DEF', 'MID', 'FWD')),
  points      integer,
  goals       integer,
  assists     integer,
  bonus       integer,
  motivatie   text,
  image_url   text,
  published   boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE player_of_the_week ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read player_of_the_week" ON player_of_the_week;
CREATE POLICY "Public read player_of_the_week"
  ON player_of_the_week FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated write player_of_the_week" ON player_of_the_week;
CREATE POLICY "Authenticated write player_of_the_week"
  ON player_of_the_week FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- TABLE: site_settings (key/value store for site configuration)
-- ============================================================

CREATE TABLE IF NOT EXISTS site_settings (
  key        text        PRIMARY KEY,
  value      text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read site_settings" ON site_settings;
CREATE POLICY "Public read site_settings"
  ON site_settings FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated write site_settings" ON site_settings;
CREATE POLICY "Authenticated write site_settings"
  ON site_settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- STORAGE: site-assets bucket
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
  VALUES ('site-assets', 'site-assets', true)
  ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read site-assets" ON storage.objects;
CREATE POLICY "Public read site-assets"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'site-assets');

DROP POLICY IF EXISTS "Authenticated upload site-assets" ON storage.objects;
CREATE POLICY "Authenticated upload site-assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'site-assets');

DROP POLICY IF EXISTS "Authenticated update site-assets" ON storage.objects;
CREATE POLICY "Authenticated update site-assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'site-assets');

DROP POLICY IF EXISTS "Authenticated delete site-assets" ON storage.objects;
CREATE POLICY "Authenticated delete site-assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'site-assets');

-- STORAGE – article-images bucket
INSERT INTO storage.buckets (id, name, public)
  VALUES ('article-images', 'article-images', true)
  ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Public read article-images" ON storage.objects;
CREATE POLICY "Public read article-images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'article-images');

DROP POLICY IF EXISTS "Auth upload article-images" ON storage.objects;
CREATE POLICY "Auth upload article-images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'article-images');

DROP POLICY IF EXISTS "Auth update article-images" ON storage.objects;
CREATE POLICY "Auth update article-images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'article-images');

DROP POLICY IF EXISTS "Auth delete article-images" ON storage.objects;
CREATE POLICY "Auth delete article-images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'article-images');

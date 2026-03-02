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
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  role        text,
  bio         text,
  avatar_url  text,
  instagram_url text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

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
-- SEED DATA – Managers / Hosts
-- ============================================================

INSERT INTO managers (name, role) VALUES
  ('Bart',    'Host & Manager'),
  ('Jeffrey', 'Host & Manager'),
  ('Tom',     'Host & Manager'),
  ('Kieran',  'Host & Manager')
ON CONFLICT DO NOTHING;

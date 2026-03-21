-- Vermont Patriots Math Football — Reference Schema
-- Actual schema is defined in src/lib/db/schema.ts (Drizzle ORM)
-- Push to database with: npx drizzle-kit push

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT 'blake',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  grade INTEGER NOT NULL,
  domain TEXT NOT NULL,
  concept TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  problems_correct INTEGER DEFAULT 0,
  problems_attempted INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, grade, concept)
);

CREATE TABLE mini_game_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  score INTEGER NOT NULL,
  grade INTEGER NOT NULL,
  concept TEXT NOT NULL,
  played_at TIMESTAMPTZ DEFAULT now()
);

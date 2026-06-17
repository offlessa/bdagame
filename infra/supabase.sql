-- ============================================================
-- Batalha da Aldeia — Schema Supabase
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ranking / estatísticas
CREATE TABLE ranking (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  win_rate FLOAT GENERATED ALWAYS AS (
    CASE WHEN (wins + losses) = 0 THEN 0 ELSE wins::FLOAT / (wins + losses) END
  ) STORED
);

-- Histórico de batalhas
CREATE TABLE battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID REFERENCES users(id),
  player2_id UUID REFERENCES users(id),
  winner_id UUID REFERENCES users(id),
  log JSONB,
  played_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: atualiza ranking ao registrar batalha
CREATE OR REPLACE FUNCTION record_battle_result(winner_id UUID, loser_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO ranking (user_id, username, wins, losses)
  SELECT id, username, 1, 0 FROM users WHERE id = winner_id
  ON CONFLICT (user_id) DO UPDATE SET wins = ranking.wins + 1, username = EXCLUDED.username;

  INSERT INTO ranking (user_id, username, wins, losses)
  SELECT id, username, 0, 1 FROM users WHERE id = loser_id
  ON CONFLICT (user_id) DO UPDATE SET losses = ranking.losses + 1, username = EXCLUDED.username;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ranking_public_read" ON ranking FOR SELECT USING (true);
CREATE POLICY "battles_public_read" ON battles FOR SELECT USING (true);

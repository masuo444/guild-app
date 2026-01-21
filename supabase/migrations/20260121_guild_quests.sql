-- ============================================
-- GUILD QUESTS FEATURE
-- ============================================

-- ============================================
-- GUILD QUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS guild_quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,                    -- クエスト説明画像
  points_reward INTEGER DEFAULT 10,  -- クリア時のポイント
  quest_type TEXT DEFAULT 'photo' CHECK (quest_type IN ('photo', 'checkin', 'action')),
  is_repeatable BOOLEAN DEFAULT true, -- 繰り返し可能か
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- QUEST SUBMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS quest_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quest_id UUID NOT NULL REFERENCES guild_quests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  image_url TEXT,                    -- 投稿画像URL
  comment TEXT,                      -- コメント
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_guild_quests_is_active ON guild_quests(is_active);
CREATE INDEX IF NOT EXISTS idx_quest_submissions_quest_id ON quest_submissions(quest_id);
CREATE INDEX IF NOT EXISTS idx_quest_submissions_user_id ON quest_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_quest_submissions_status ON quest_submissions(status);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE guild_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_submissions ENABLE ROW LEVEL SECURITY;

-- GUILD QUESTS policies
CREATE POLICY "Quests are viewable by active members"
  ON guild_quests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.subscription_status IN ('active', 'free')
    )
  );

CREATE POLICY "Admins can manage quests"
  ON guild_quests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- QUEST SUBMISSIONS policies
-- ユーザーは自分の投稿を閲覧可能
CREATE POLICY "Users can view their own submissions"
  ON quest_submissions FOR SELECT
  USING (auth.uid() = user_id);

-- 管理者は全ての投稿を閲覧可能
CREATE POLICY "Admins can view all submissions"
  ON quest_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- アクティブメンバーは投稿を作成可能
CREATE POLICY "Active members can create submissions"
  ON quest_submissions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.subscription_status IN ('active', 'free')
    )
  );

-- 管理者は投稿を更新可能（承認/却下）
CREATE POLICY "Admins can update submissions"
  ON quest_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- INITIAL QUEST DATA
-- ============================================
INSERT INTO guild_quests (title, description, points_reward, quest_type, is_repeatable)
VALUES (
  '枡で乾杯！',
  '枡を持って乾杯している写真を投稿してください。MASU Hubや自宅、どこでもOK！',
  10,
  'photo',
  true
);

-- ============================================
-- STORAGE BUCKET (run manually in Supabase dashboard)
-- ============================================
-- バケット名: quest-submissions
-- パス形式: {user_id}/{quest_id}/{filename}
-- Public: false (authenticated users only)

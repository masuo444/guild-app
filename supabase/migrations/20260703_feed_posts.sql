-- ============================================
-- まっすーフィード: feed_posts テーブル
--
-- まっすー（管理者）がアプリ内に投稿する日々のフィード。
-- is_premium = TRUE の投稿は本文/画像を有料会員のみが閲覧できる
-- （ゲートはサーバー側で行う。RLS では全員が行を読めるが、
--  無料ユーザー向けにはサーバーで本文を伏せて返す）。
-- ============================================

CREATE TABLE IF NOT EXISTS feed_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  body text NOT NULL,
  image_url text,
  is_premium boolean NOT NULL DEFAULT false,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_posts_published_at ON feed_posts(published_at DESC);

ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;

-- SELECT: ログイン済みユーザーは全投稿の「行」を読める。
-- 有料本文の伏せ字はサーバー側（/app/feed）で処理する。
DROP POLICY IF EXISTS "Feed posts are viewable by authenticated" ON feed_posts;
CREATE POLICY "Feed posts are viewable by authenticated" ON feed_posts
  FOR SELECT TO authenticated
  USING (true);

-- INSERT / UPDATE / DELETE: 管理者のみ。
-- （実際の投稿は service-role の /api/feed/create 経由でも行うが、
--  念のためRLSでも admin に限定しておく）
DROP POLICY IF EXISTS "Admins can insert feed posts" ON feed_posts;
CREATE POLICY "Admins can insert feed posts" ON feed_posts
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update feed posts" ON feed_posts;
CREATE POLICY "Admins can update feed posts" ON feed_posts
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can delete feed posts" ON feed_posts;
CREATE POLICY "Admins can delete feed posts" ON feed_posts
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

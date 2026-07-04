-- =============================================
-- 枡販売 紹介コード方式（方式B）
-- Supabase SQL Editor で実行してください
-- =============================================

-- 会員ごとの紹介コード
CREATE TABLE IF NOT EXISTS member_sales_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 紹介経由の売上・還元ポイント記録（order_id で二重付与防止）
CREATE TABLE IF NOT EXISTS sales_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL UNIQUE,
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_jpy INTEGER NOT NULL,
  points INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_credits_member_id ON sales_credits(member_id);

-- デフォルト設定（既存キーがあれば変更しない）
INSERT INTO app_settings (key, value)
VALUES
  ('sales_commission_percent', '10'),
  ('sales_points_per_yen', '1')
ON CONFLICT (key) DO NOTHING;

-- RLS有効化
ALTER TABLE member_sales_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_credits ENABLE ROW LEVEL SECURITY;

-- member_sales_codes: 本人 or admin のみ閲覧。書き込みは service role 経由のみ（クライアントからのINSERT/UPDATEは不可）。
CREATE POLICY "member_sales_codes_select_own" ON member_sales_codes
  FOR SELECT USING (
    member_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- sales_credits: 本人 or admin のみ閲覧。書き込みは service role 経由のみ。
CREATE POLICY "sales_credits_select_own" ON sales_credits
  FOR SELECT USING (
    member_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

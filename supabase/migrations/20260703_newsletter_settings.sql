-- ============================================
-- 週刊メルマガ & ログインボーナス2倍キャンペーン用
-- ============================================

-- 1. ユーザーの言語をプロフィールに保存（メルマガのJA/EN出し分け用）
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language text CHECK (language IN ('ja', 'en'));

-- 2. アプリ設定（キー・バリュー）。ログインボーナス倍率などを保持
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- 読み取りはログインユーザー全員可（キャンペーン表示等に使える）。
-- 書き込みは service-role の管理APIのみ（authenticated向けの書込ポリシーは作らない）。
DROP POLICY IF EXISTS "app_settings readable by authenticated" ON app_settings;
CREATE POLICY "app_settings readable by authenticated" ON app_settings
  FOR SELECT TO authenticated USING (true);

-- 初期値（ログインボーナス倍率=1、キャンペーン期限=なし）
INSERT INTO app_settings (key, value) VALUES
  ('login_bonus_multiplier', '1'),
  ('login_bonus_campaign_until', '')
ON CONFLICT (key) DO NOTHING;

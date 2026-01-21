-- カスタムロール（カラータグ）テーブル
CREATE TABLE IF NOT EXISTS custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL CHECK (color IN ('orange', 'blue', 'green', 'purple', 'pink', 'red', 'yellow', 'cyan')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- メンバーロール割り当てテーブル（多対多）
CREATE TABLE IF NOT EXISTS member_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES custom_roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member_id, role_id)
);

-- masu_hubs テーブルに新しいカラムを追加
ALTER TABLE masu_hubs ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE masu_hubs ADD COLUMN IF NOT EXISTS google_maps_url TEXT;
ALTER TABLE masu_hubs ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE masu_hubs ADD COLUMN IF NOT EXISTS phone TEXT;

-- RLS ポリシー
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_roles ENABLE ROW LEVEL SECURITY;

-- custom_roles: 誰でも閲覧可能、管理者のみ編集可能
CREATE POLICY "Anyone can view custom_roles" ON custom_roles
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert custom_roles" ON custom_roles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update custom_roles" ON custom_roles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete custom_roles" ON custom_roles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- member_roles: 誰でも閲覧可能、管理者のみ編集可能
CREATE POLICY "Anyone can view member_roles" ON member_roles
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert member_roles" ON member_roles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete member_roles" ON member_roles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- インデックス
CREATE INDEX IF NOT EXISTS idx_member_roles_member_id ON member_roles(member_id);
CREATE INDEX IF NOT EXISTS idx_member_roles_role_id ON member_roles(role_id);

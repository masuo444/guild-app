-- =============================================
-- ポイント交換所テーブル
-- Supabase SQL Editor で実行してください
-- =============================================

-- profiles に card_theme カラム追加
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS card_theme TEXT DEFAULT NULL;

-- exchange_items テーブル
CREATE TABLE IF NOT EXISTS exchange_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  description_en TEXT,
  image_url TEXT,
  points_cost INTEGER NOT NULL,
  stock INTEGER DEFAULT -1,
  coupon_code TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- exchange_orders テーブル
CREATE TABLE IF NOT EXISTS exchange_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES exchange_items(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  coupon_code TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_exchange_orders_user_id ON exchange_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_exchange_orders_status ON exchange_orders(status);
CREATE INDEX IF NOT EXISTS idx_exchange_items_is_active ON exchange_items(is_active);

-- RLS有効化
ALTER TABLE exchange_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_orders ENABLE ROW LEVEL SECURITY;

-- exchange_items: 全メンバーが閲覧可能
CREATE POLICY "exchange_items_select_all" ON exchange_items
  FOR SELECT USING (true);

-- exchange_items: adminのみ作成・更新・削除
CREATE POLICY "exchange_items_admin_insert" ON exchange_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "exchange_items_admin_update" ON exchange_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "exchange_items_admin_delete" ON exchange_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- exchange_orders: メンバーは自分の注文のみ閲覧・作成
CREATE POLICY "exchange_orders_select_own" ON exchange_orders
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "exchange_orders_insert_own" ON exchange_orders
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- exchange_orders: adminのみ更新
CREATE POLICY "exchange_orders_admin_update" ON exchange_orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

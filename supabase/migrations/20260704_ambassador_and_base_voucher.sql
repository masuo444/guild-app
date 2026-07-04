-- =============================================
-- アンバサダー称号 ＋ 笛吹BASE無期限宿泊券
-- Supabase SQL Editor で実行してください
-- =============================================

-- アンバサダー称号（紹介コード経由で初めて枡を売った会員に自動付与。国内・海外共通）
-- ※ code側(/api/sales/credit)でも遅延作成するため、ここでの事前作成は
--   管理画面から早めに見えるようにするための保険。
INSERT INTO custom_roles (name, color, description)
SELECT 'アンバサダー', 'yellow', '紹介コードで枡の販売に貢献してくれたメンバーの称号'
WHERE NOT EXISTS (SELECT 1 FROM custom_roles WHERE name = 'アンバサダー');

-- 笛吹BASE 宿泊無期限チケット（在庫無制限・有効期限なし。来日時にいつでも使える特別枠）
INSERT INTO exchange_items (name, name_en, description, description_en, points_cost, stock, is_active)
SELECT
  '笛吹BASE 宿泊無期限チケット',
  'Fuefuki BASE Unlimited Stay Voucher',
  'まっすーの拠点「笛吹BASE」に無期限で泊まれる特別チケット。有効期限はありません。来日されたタイミングでいつでもご利用いただけます。',
  'A special voucher for an unlimited-validity stay at MaSU''s Fuefuki BASE. No expiration — redeemable whenever you visit Japan.',
  3000,
  -1,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM exchange_items WHERE name = '笛吹BASE 宿泊無期限チケット'
);

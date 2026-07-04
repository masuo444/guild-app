-- =============================================
-- アンバサダー称号の段階制（ブロンズ/シルバー/ゴールド）
-- 旧・単一階層の「アンバサダー」ロールを廃止し、3段階に置き換える。
-- （本番でこのロールは1件も会員に付与されていないことを確認済み。安全に置換可能）
-- Supabase SQL Editor で実行してください
-- =============================================

-- 旧ロールの割り当てを削除（念のため。現状0件のはず）
DELETE FROM member_roles
WHERE role_id IN (SELECT id FROM custom_roles WHERE name = 'アンバサダー');

-- 旧ロール定義を削除
DELETE FROM custom_roles WHERE name = 'アンバサダー';

-- 3段階のロールを事前作成（コード側でも自動作成されるため必須ではないが、
-- 管理画面から早めに見えるようにするための保険）
INSERT INTO custom_roles (name, color, description)
SELECT 'ブロンズアンバサダー', 'orange', '紹介コードで初めて枡の販売に貢献してくれたメンバーの称号'
WHERE NOT EXISTS (SELECT 1 FROM custom_roles WHERE name = 'ブロンズアンバサダー');

INSERT INTO custom_roles (name, color, description)
SELECT 'シルバーアンバサダー', 'cyan', '紹介コード経由の枡販売が累計5件を超えたメンバーの称号'
WHERE NOT EXISTS (SELECT 1 FROM custom_roles WHERE name = 'シルバーアンバサダー');

INSERT INTO custom_roles (name, color, description)
SELECT 'ゴールドアンバサダー', 'yellow', '紹介コード経由の枡販売が累計15件を超えたメンバーの称号'
WHERE NOT EXISTS (SELECT 1 FROM custom_roles WHERE name = 'ゴールドアンバサダー');

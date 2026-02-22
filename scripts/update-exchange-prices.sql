-- 桜カードテーマ: 500pt → 300pt
UPDATE exchange_items
SET points_cost = 300
WHERE coupon_code = 'theme:sakura';

-- FOMUS枡: 3000pt → 1000pt
UPDATE exchange_items
SET points_cost = 1000
WHERE name LIKE '%枡%' AND points_cost = 3000;

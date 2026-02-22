-- 新テーマ2種（欧州・中東）を exchange_items に追加
-- 各100pt、在庫無制限、theme: プレフィックス付き

INSERT INTO exchange_items (name, name_en, description, description_en, points_cost, stock, coupon_code, is_active)
VALUES
  ('欧州ロイヤルテーマ', 'Royal Theme', 'ロイヤルブルーと金のヨーロッパ風カードテーマ', 'European-style card theme with royal blue and gold', 100, NULL, 'theme:royal', true),
  ('アラビアンテーマ', 'Arabian Theme', 'ターコイズと金の中東風カードテーマ', 'Middle Eastern-style card theme with turquoise and gold', 100, NULL, 'theme:arabian', true);

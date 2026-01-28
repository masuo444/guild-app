-- 再利用可能な招待機能
-- reusable: 再利用可能かどうか（永久招待リンク用）
-- use_count: 使用回数（reusable=true の場合にカウント）

ALTER TABLE invites ADD COLUMN IF NOT EXISTS reusable BOOLEAN DEFAULT FALSE;
ALTER TABLE invites ADD COLUMN IF NOT EXISTS use_count INTEGER DEFAULT 0;

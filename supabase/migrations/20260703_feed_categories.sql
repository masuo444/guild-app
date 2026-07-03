-- ============================================
-- フィードに「枠組み（カテゴリー）」を追加
--
-- 記事を「笛吹市活動記録」などの枠組みでまとめられるようにする。
-- 枠組みは自由な文字列で、複数持てる（新しい枠組みは投稿時に作れる）。
-- 既存の投稿（6月の日次記事）はすべて「笛吹市活動記録」に設定する。
-- ============================================

ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS category text;

-- 既存投稿を「笛吹市活動記録」にバックフィル
UPDATE feed_posts SET category = '笛吹市活動記録' WHERE category IS NULL;

CREATE INDEX IF NOT EXISTS idx_feed_posts_category ON feed_posts(category);

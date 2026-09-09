-- 笛吹市活動記録の英語版（タイトル・本文）を保存する列
alter table feed_posts
  add column if not exists title_en text,
  add column if not exists body_en text,
  add column if not exists translated_at timestamptz;

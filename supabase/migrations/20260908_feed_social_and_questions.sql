-- 記事へのリアクション・コメント、まっすーへの質問箱
-- Supabase SQL Editor で実行してください（適用前でもアプリは動きますが、該当機能は非表示になります）

-- リアクション（1人1記事1回）
create table if not exists feed_reactions (
  post_id uuid not null references feed_posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table feed_reactions enable row level security;
create policy "reactions: members can read" on feed_reactions for select to authenticated using (true);
create policy "reactions: own insert" on feed_reactions for insert to authenticated with check (auth.uid() = user_id);
create policy "reactions: own delete" on feed_reactions for delete to authenticated using (auth.uid() = user_id);

-- コメント
create table if not exists feed_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references feed_posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists idx_feed_comments_post on feed_comments(post_id, created_at);
alter table feed_comments enable row level security;
create policy "comments: members can read" on feed_comments for select to authenticated using (true);
create policy "comments: own insert" on feed_comments for insert to authenticated with check (auth.uid() = user_id);
create policy "comments: own delete" on feed_comments for delete to authenticated using (auth.uid() = user_id);
-- 管理者は service role で削除するのでポリシー不要

-- まっすーへの質問（有料会員限定）
create table if not exists member_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  status text not null default 'open' check (status in ('open', 'answered')),
  answer_post_id uuid references feed_posts(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_member_questions_status on member_questions(status, created_at);
alter table member_questions enable row level security;
create policy "questions: own read" on member_questions for select to authenticated using (auth.uid() = user_id);
create policy "questions: own insert" on member_questions for insert to authenticated with check (auth.uid() = user_id);

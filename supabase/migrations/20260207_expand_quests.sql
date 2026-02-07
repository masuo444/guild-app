-- ============================================
-- EXPAND QUESTS: Add new columns and quest data
-- ============================================

-- Add missing columns to guild_quests if not present
ALTER TABLE guild_quests ADD COLUMN IF NOT EXISTS title_en TEXT;
ALTER TABLE guild_quests ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE guild_quests ADD COLUMN IF NOT EXISTS is_auto BOOLEAN DEFAULT false;

-- ============================================
-- Phase 1: Onboarding Quests
-- ============================================

INSERT INTO guild_quests (title, title_en, description, description_en, points_reward, quest_type, is_repeatable, is_auto, is_active)
VALUES
  (
    'プロフィールを完成させよう',
    'Complete your profile',
    '名前・拠点・アバターを設定してプロフィールを完成させましょう。設定が完了すると自動的に達成されます。',
    'Set your name, location, and avatar to complete your profile. This quest is automatically completed once all fields are filled.',
    20,
    'action',
    false,
    true,
    true
  ),
  (
    'マップに自分を表示しよう',
    'Show yourself on the map',
    'マップ機能で自分の位置を表示しましょう。位置情報を登録してマップ表示をONにすると自動的に達成されます。',
    'Show your location on the map. This quest is automatically completed when you enable map display with your location set.',
    10,
    'action',
    false,
    true,
    true
  );

-- ============================================
-- Phase 2: UGC Content Quests
-- ============================================

INSERT INTO guild_quests (title, title_en, description, description_en, points_reward, quest_type, is_repeatable, is_auto, is_active)
VALUES
  (
    '枡のある日常',
    'MASU in daily life',
    '日常のなかで枡を使っている写真を投稿してください。食事、お茶、インテリアなど、どんなシーンでもOK！',
    'Share a photo of MASU in your daily life. Any scene works — meals, tea time, home decor, and more!',
    15,
    'photo',
    true,
    false,
    true
  ),
  (
    '世界のMASU',
    'MASU around the world',
    '旅先や海外で枡と一緒に撮った写真を投稿してください。世界中のMASUの輪を広げましょう！',
    'Share a photo of MASU from your travels around the world. Let''s expand the global MASU community!',
    30,
    'photo',
    true,
    false,
    true
  ),
  (
    'SILVAで遊ぼう',
    'Play SILVA',
    'SILVAカードゲームをプレイしている写真を投稿してください。友達や家族と楽しんでいる様子を共有しましょう！',
    'Share a photo of you playing the SILVA card game. Show us how you enjoy it with friends and family!',
    20,
    'photo',
    true,
    false,
    true
  );

-- ============================================
-- Phase 3: Community Connection Quests
-- ============================================

INSERT INTO guild_quests (title, title_en, description, description_en, points_reward, quest_type, is_repeatable, is_auto, is_active)
VALUES
  (
    'MASU Hubを訪問しよう',
    'Visit a MASU Hub',
    'MASU Hubを訪問して、チェックインしてください。Hubでの写真を添えて投稿しましょう！',
    'Visit a MASU Hub and check in. Share a photo from your visit!',
    50,
    'checkin',
    true,
    false,
    true
  ),
  (
    'ギルドメンバーと乾杯！',
    'Cheers with a guild member!',
    'ギルドメンバーと一緒に乾杯している写真を投稿してください。リアルなつながりを広げましょう！',
    'Share a photo of you toasting with a guild member. Let''s strengthen our real-world connections!',
    30,
    'photo',
    true,
    false,
    true
  );

-- ============================================
-- Phase 4: Brand & Culture Quests
-- ============================================

INSERT INTO guild_quests (title, title_en, description, description_en, points_reward, quest_type, is_repeatable, is_auto, is_active)
VALUES
  (
    'KUKUの世界を体験しよう',
    'Explore KUKU',
    'KUKUのサイトを訪問して、感想を投稿してください。物語の世界に触れてみましょう！',
    'Visit the KUKU website and share your thoughts. Explore the world of the story!',
    20,
    'action',
    false,
    false,
    true
  ),
  (
    'FOMUS PARUREを身につけよう',
    'Wear FOMUS PARURE',
    'FOMUS PARUREのジュエリーを身につけている写真を投稿してください。あなたのスタイルを見せてください！',
    'Share a photo of you wearing FOMUS PARURE jewelry. Show us your style!',
    25,
    'photo',
    true,
    false,
    true
  );

-- ============================================
-- Update existing quests with English translations
-- ============================================

UPDATE guild_quests
SET title_en = 'Cheers with MASU!',
    description_en = 'Share a photo of you toasting with MASU. Anywhere works — MASU Hub, home, or wherever!'
WHERE title = '枡で乾杯！' AND title_en IS NULL;

UPDATE guild_quests
SET title_en = 'Invite a friend to the Guild',
    description_en = 'Invite a friend to join the Guild. You''ll earn points automatically when they join!'
WHERE title = '友達をGuildに招待しよう' AND title_en IS NULL;

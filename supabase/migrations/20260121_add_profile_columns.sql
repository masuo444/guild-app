-- ============================================
-- FOMUS GUILD - Add Profile Columns Migration
-- Add instagram_id, avatar_url, show_location_on_map to profiles table
-- ============================================

-- instagram_id カラムを追加
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram_id TEXT;

-- avatar_url カラムを追加
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- show_location_on_map カラムを追加（デフォルトはtrue）
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_location_on_map BOOLEAN DEFAULT TRUE;

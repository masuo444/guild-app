-- ============================================
-- FOMUS GUILD - Membership Types Migration
-- ============================================

-- invites テーブルに membership_type カラムを追加
ALTER TABLE invites ADD COLUMN IF NOT EXISTS membership_type TEXT DEFAULT 'standard';

-- profiles テーブルに membership_type カラムを追加
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS membership_type TEXT DEFAULT 'standard';

-- subscription_status に 'free' を追加するために CHECK 制約を更新
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_status_check
  CHECK (subscription_status IN ('inactive', 'active', 'past_due', 'canceled', 'free'));

-- ============================================
-- RLS ポリシーの更新
-- subscription_status = 'free' も 'active' と同様に扱う
-- ============================================

-- PROFILES policies 更新
DROP POLICY IF EXISTS "Profiles are viewable by active members" ON profiles;
CREATE POLICY "Profiles are viewable by active members"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND (p.subscription_status = 'active' OR p.subscription_status = 'free')
    )
  );

-- MASU HUBS policies 更新
DROP POLICY IF EXISTS "Hubs are viewable by active members" ON masu_hubs;
CREATE POLICY "Hubs are viewable by active members"
  ON masu_hubs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.subscription_status = 'active' OR profiles.subscription_status = 'free')
    )
  );

-- GUILD OFFERS policies 更新
DROP POLICY IF EXISTS "Offers are viewable by active members" ON guild_offers;
CREATE POLICY "Offers are viewable by active members"
  ON guild_offers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.subscription_status = 'active' OR profiles.subscription_status = 'free')
    )
  );

-- ============================================
-- handle_new_user() 関数の更新
-- 無料タイプの場合、自動でアクティブ化
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_invite_code TEXT;
  v_membership_type TEXT;
BEGIN
  -- メタデータから招待コードを取得
  v_invite_code := NEW.raw_user_meta_data->>'invite_code';

  -- 招待コードから membership_type を取得（デフォルトは 'standard'）
  IF v_invite_code IS NOT NULL THEN
    SELECT membership_type INTO v_membership_type
    FROM public.invites
    WHERE code = v_invite_code
    AND used = FALSE;
  END IF;

  -- デフォルト値を設定
  IF v_membership_type IS NULL THEN
    v_membership_type := 'standard';
  END IF;

  -- 無料タイプ（model, ambassador, staff, partner）の場合
  IF v_membership_type IN ('model', 'ambassador', 'staff', 'partner') THEN
    INSERT INTO public.profiles (
      id,
      display_name,
      membership_type,
      membership_status,
      subscription_status,
      membership_id
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
      v_membership_type,
      'active',
      'free',
      'FG-' || UPPER(SUBSTRING(REPLACE(uuid_generate_v4()::text, '-', '') FROM 1 FOR 8))
    );
  ELSE
    -- 通常会員（有料）の場合
    INSERT INTO public.profiles (
      id,
      display_name,
      membership_type
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
      v_membership_type
    );
  END IF;

  -- Mark invite as used if invite_code exists in metadata
  IF v_invite_code IS NOT NULL THEN
    UPDATE public.invites
    SET used = TRUE, used_by = NEW.id
    WHERE code = v_invite_code
    AND used = FALSE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

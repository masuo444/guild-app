-- handle_new_user() 関数を更新
-- reusable な招待コードにも対応（used=TRUE でも membership_type を取得できるように）
-- show_location_on_map をデフォルトで true にする

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_invite_code TEXT;
  v_membership_type TEXT;
BEGIN
  -- メタデータから招待コードを取得
  v_invite_code := NEW.raw_user_meta_data->>'invite_code';

  -- 招待コードから membership_type を取得（reusable対応: used条件を緩和）
  IF v_invite_code IS NOT NULL THEN
    SELECT membership_type INTO v_membership_type
    FROM public.invites
    WHERE code = v_invite_code
    AND (used = FALSE OR reusable = TRUE);
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
      membership_id,
      show_location_on_map
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
      v_membership_type,
      'active',
      'free',
      'FG-' || UPPER(SUBSTRING(REPLACE(uuid_generate_v4()::text, '-', '') FROM 1 FOR 8)),
      TRUE
    );
  ELSE
    -- 通常会員（有料）の場合
    INSERT INTO public.profiles (
      id,
      display_name,
      membership_type,
      show_location_on_map
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
      v_membership_type,
      TRUE
    );
  END IF;

  -- Mark invite as used if invite_code exists in metadata
  IF v_invite_code IS NOT NULL THEN
    -- reusable の場合は use_count のみインクリメント
    UPDATE public.invites
    SET
      used = CASE WHEN reusable THEN used ELSE TRUE END,
      used_by = CASE WHEN reusable THEN used_by ELSE NEW.id END,
      use_count = COALESCE(use_count, 0) + 1
    WHERE code = v_invite_code;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

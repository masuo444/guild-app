-- ============================================================
-- Security Hardening Script for FOMUS GUILD
-- Run this via Supabase SQL Editor
-- ============================================================

-- 1. Atomic exchange order RPC function
--    Performs balance check + point deduction + order creation + stock update
--    in a single transaction to prevent race conditions.
CREATE OR REPLACE FUNCTION exchange_order(
  p_user_id UUID,
  p_item_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item RECORD;
  v_balance BIGINT;
  v_is_theme BOOLEAN;
  v_order_status TEXT;
  v_theme_name TEXT;
BEGIN
  -- Lock the item row to prevent concurrent stock modifications
  SELECT * INTO v_item
  FROM exchange_items
  WHERE id = p_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Item not found', 'status', 404);
  END IF;

  IF NOT v_item.is_active THEN
    RETURN jsonb_build_object('error', 'Item is not available', 'status', 400);
  END IF;

  IF v_item.stock = 0 THEN
    RETURN jsonb_build_object('error', 'Out of stock', 'status', 400);
  END IF;

  -- Calculate current MASUポイント balance (sum of all activity_logs)
  SELECT COALESCE(SUM(points), 0) INTO v_balance
  FROM activity_logs
  WHERE user_id = p_user_id;

  IF v_balance < v_item.points_cost THEN
    RETURN jsonb_build_object('error', 'Insufficient points', 'status', 400);
  END IF;

  -- Determine if this is a theme item
  v_is_theme := v_item.coupon_code IS NOT NULL AND v_item.coupon_code LIKE 'theme:%';
  v_order_status := CASE WHEN v_is_theme THEN 'approved' ELSE 'pending' END;

  -- Create the order
  INSERT INTO exchange_orders (user_id, item_id, points_spent, status)
  VALUES (p_user_id, p_item_id, v_item.points_cost, v_order_status);

  -- Deduct points
  INSERT INTO activity_logs (user_id, type, points, note)
  VALUES (p_user_id, 'Point Exchange', -v_item.points_cost, v_item.name);

  -- Decrement stock atomically (skip if stock = -1 meaning unlimited)
  IF v_item.stock > 0 THEN
    UPDATE exchange_items
    SET stock = stock - 1
    WHERE id = p_item_id AND stock > 0;
  END IF;

  -- Apply theme immediately if it's a theme item
  IF v_is_theme THEN
    v_theme_name := REPLACE(v_item.coupon_code, 'theme:', '');
    UPDATE profiles
    SET card_theme = v_theme_name
    WHERE id = p_user_id;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 2. Unique constraint on activity_logs to prevent duplicate login bonuses
--    (user_id, type, note) must be unique for Login Bonus entries.
--    Using a partial unique index so it only applies to Login Bonus rows.
CREATE UNIQUE INDEX IF NOT EXISTS idx_activity_logs_login_bonus_unique
  ON activity_logs (user_id, type, note)
  WHERE type = 'Login Bonus';

-- 3. Fix RLS on invites table - restrict SELECT to authenticated users only
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Drop existing permissive SELECT policy if any
DO $$
BEGIN
  -- Try to drop common policy names; ignore if they don't exist
  BEGIN
    DROP POLICY IF EXISTS "Allow public read" ON invites;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    DROP POLICY IF EXISTS "Public can read invites" ON invites;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    DROP POLICY IF EXISTS "Enable read access for all users" ON invites;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    DROP POLICY IF EXISTS "invites_select_policy" ON invites;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- Create restrictive SELECT policy: only authenticated users
CREATE POLICY "invites_select_authenticated"
  ON invites FOR SELECT
  TO authenticated
  USING (true);

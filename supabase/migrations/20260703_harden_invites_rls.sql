-- ============================================
-- Harden invites RLS
--
-- Problem: the previous UPDATE policy allowed ANY authenticated user to
-- modify ANY invite row (mark used/unused, change membership_type, reset
-- use_count, re-point invited_by). A member could grant themselves unlimited
-- invites or upgrade an invite to a free premium tier.
--
-- All legitimate invite mutations (marking used, incrementing use_count)
-- happen in server routes using the service-role key, which BYPASSES RLS.
-- The browser never UPDATEs invites, so we can safely restrict UPDATE to
-- admins only.
-- ============================================

-- 1. UPDATE: admins only (service-role server routes bypass RLS regardless)
DROP POLICY IF EXISTS "Invites can be updated when used" ON invites;
DROP POLICY IF EXISTS "Admins can update invites" ON invites;
CREATE POLICY "Admins can update invites" ON invites
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 2. INSERT (members): tighten so a member can only create invites attributed
--    to themselves. Prevents forging invites under another member's id (which
--    would misdirect invite-bonus points and use_count accounting).
--    Admins keep the separate "Admins can create invites" policy (any type).
DROP POLICY IF EXISTS "Members can create standard invites" ON invites;
CREATE POLICY "Members can create standard invites"
  ON invites FOR INSERT
  TO authenticated
  WITH CHECK (
    membership_type = 'standard'
    AND invited_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.subscription_status IN ('active', 'free')
    )
  );

-- 3. DELETE: admins only (no browser flow deletes invites).
DROP POLICY IF EXISTS "Admins can delete invites" ON invites;
CREATE POLICY "Admins can delete invites" ON invites
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- NOTE on SELECT: invites remain readable by authenticated users because the
-- member map shows pending-invite locations to all members. Public (logged-out)
-- invite-code validation no longer relies on anon SELECT — it goes through the
-- service-role endpoint /api/auth/validate-invite instead.

-- ============================================
-- Allow all active members to create standard invites
-- Admins can still create any type (including free membership types)
-- ============================================

-- Drop the old admin-only policy
DROP POLICY IF EXISTS "Admins can create invites" ON invites;

-- Admins can create invites with any membership_type
CREATE POLICY "Admins can create invites"
  ON invites FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Active members can create standard (paid) invites only
CREATE POLICY "Members can create standard invites"
  ON invites FOR INSERT
  WITH CHECK (
    membership_type = 'standard'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.subscription_status IN ('active', 'free')
    )
  );

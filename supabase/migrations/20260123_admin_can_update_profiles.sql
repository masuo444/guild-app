-- ============================================
-- Allow admins to update any profile
-- ============================================

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create new policy that allows users to update their own profile OR admins to update any profile
CREATE POLICY "Users can update own profile, admins can update any"
  ON profiles FOR UPDATE
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

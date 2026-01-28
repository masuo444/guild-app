-- ============================================
-- Allow admins to view all activity logs
-- ============================================

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view their own logs" ON activity_logs;

-- Create new policy that allows users to view their own logs OR admins to view all logs
CREATE POLICY "Users can view own logs, admins can view all"
  ON activity_logs FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Fix 1: invites UPDATE policy allowed unauthenticated updates
DROP POLICY IF EXISTS "Invites can be updated when used" ON invites;
CREATE POLICY "Invites can be updated when used" ON invites
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Fix 2: invites SELECT exposed all invite codes to unauthenticated users
DROP POLICY IF EXISTS "Invites are viewable by everyone" ON invites;
CREATE POLICY "Invites are viewable by authenticated" ON invites
  FOR SELECT TO authenticated USING (true);

-- Fix 3: exchange_items SELECT exposed coupon_code to unauthenticated users
DROP POLICY IF EXISTS "exchange_items_select_all" ON exchange_items;
CREATE POLICY "exchange_items_select_auth" ON exchange_items
  FOR SELECT TO authenticated USING (true);

-- Fix 4: custom_roles and member_roles SELECT exposed member data to unauthenticated users
DROP POLICY IF EXISTS "Anyone can view custom_roles" ON custom_roles;
CREATE POLICY "Members can view custom_roles" ON custom_roles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view member_roles" ON member_roles;
CREATE POLICY "Members can view member_roles" ON member_roles
  FOR SELECT TO authenticated USING (true);

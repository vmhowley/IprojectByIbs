-- Allow Admins to perform all actions on contacts
DROP POLICY IF EXISTS "Admins can manage all contacts" ON contacts;

CREATE POLICY "Admins can manage all contacts" ON contacts
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

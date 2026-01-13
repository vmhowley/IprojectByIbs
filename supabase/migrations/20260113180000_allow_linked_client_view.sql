-- Allow users to View the Client they are linked to
CREATE POLICY "View linked client" ON clients
FOR SELECT TO authenticated
USING (
  id = get_auth_user_client_id()
);

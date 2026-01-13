-- Update get_auth_user_client_id to prefer direct client_id on user_profiles
CREATE OR REPLACE FUNCTION get_auth_user_client_id()
RETURNS UUID AS $$
DECLARE
  v_client_id UUID;
BEGIN
  -- 1. Try to get direct client_id from user_profiles
  SELECT client_id INTO v_client_id
  FROM user_profiles
  WHERE id = auth.uid();
  
  IF v_client_id IS NOT NULL THEN
    RETURN v_client_id;
  END IF;

  -- 2. Fallback: Try to get from linked contact (legacy/compatibility)
  SELECT c.client_id INTO v_client_id
  FROM user_profiles up
  JOIN contacts c ON c.id = up.contact_id
  WHERE up.id = auth.uid();

  RETURN v_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

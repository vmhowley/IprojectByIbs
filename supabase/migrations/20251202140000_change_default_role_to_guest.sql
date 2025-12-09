/*
  # Change Default User Role to Guest

  1. Changes
    - Update `handle_new_user` function to set default role to 'guest' instead of 'user'
    
  2. Security
    - New users will have limited access by default until an admin promotes them
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    'guest' -- Changed from 'user' to 'guest'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

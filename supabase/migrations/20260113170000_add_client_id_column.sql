-- Ensure client_id column exists in user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_client_id ON user_profiles(client_id); (

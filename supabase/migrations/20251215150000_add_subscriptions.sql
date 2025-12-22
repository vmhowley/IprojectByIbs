-- 1. Add subscription columns to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- 2. Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) NOT NULL,
  status text CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'trialing', 'unpaid')),
  stripe_subscription_id text,
  stripe_price_id text,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for subscriptions
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- (Admin/System might need to insert/update updates via webhook - usually done with service role, 
-- but for simulation we might allow users to 'self-upgrade' in dev mode if needed, 
-- or keep it strict and fallback to manual DB updates/Edge Functions)
-- Let's keep strict RLS for now.

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customer_id ON user_profiles(stripe_customer_id);

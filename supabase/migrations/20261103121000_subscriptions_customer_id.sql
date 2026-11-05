-- The stripe-webhook function inserts stripe_customer_id into subscriptions,
-- but the table never had that column, so every insert failed.
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS stripe_customer_id text;

export interface Subscription {
  id: string;
  user_id: string;
  status: 'active' | 'trialing' | 'canceled' | 'incomplete' | 'past_due';
  price_id?: string;
  quantity?: number;
  cancel_at_period_end?: boolean;
  current_period_start?: string;
  current_period_end: string;
  created_at?: string;
  updated_at?: string;
}

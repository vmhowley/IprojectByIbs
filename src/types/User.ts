export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user' | 'guest' | 'support_agent';
  subscription_tier?: 'free' | 'pro';
  client_id?: string | null;
  created_at: string;
  updated_at: string;
}



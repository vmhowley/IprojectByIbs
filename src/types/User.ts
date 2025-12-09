export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user' | 'guest';
  created_at: string;
  updated_at: string;
}



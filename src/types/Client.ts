export interface Client {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  created_by?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  client_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  position?: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

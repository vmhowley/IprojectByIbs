export interface Project {
  id: string;
  name: string;
  description: string | null;
  assignee?: string;
  status: 'active' | 'on_hold' | 'completed' | 'archived';
  start_date?: string;
  end_date?: string;
  priority: 'low' | 'medium' | 'high';
  team?: string;
  file_attachment?: string;
  created_by?: string | null;
  client_id?: string | null;
  contact_id?: string | null;
  clients?: {
    name: string;
  } | null;
  assignee_profile?: {
    name: string;
  } | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}


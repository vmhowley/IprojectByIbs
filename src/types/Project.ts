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
  use_case_id?: string | null;
  attachments?: {
    name: string;
    url: string;
    size: number;
    type: string;
  }[];
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  stats?: {
    total_tasks: number;
    completed_tasks: number;
  };
}

export interface ProjectDocument {
  id: string;
  project_id: string | null;
  name: string;
  description: string | null;
  url: string;
  file_type: string;
  file_size: number;
  created_by: string;
  created_at: string;
}

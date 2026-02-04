export interface Attachment {
  name: string;
  url: string;
  size: number;
  type: string;
}


export interface Subtask {
  id: string;
  ticket_id: string;
  title: string;
  is_completed: boolean;
  created_at: string;
}

export interface Ticket {
  id: string;
  ticket_number?: number;
  project_id: string;
  description: string | null;
  status: 'pending_analysis' | 'pending_approval' | 'approved' | 'ongoing' | 'completed' | 'done' ;
  urgency: 'low' | 'medium' | 'high' | 'critical' | 'minor' | 'moderate';
  category: string | null;
  department: string | null;
  assigned_to: string | null;
  assigned_to_profile?: {
    name: string;
  } | null;
  projects?: {
    name: string;
    assignee?: string;
  } | null;
  clients?: {
    name: string;
  } | null;
  date_added: string;
  deadline: string | null;
  tags: string[];
  comment_count: number;
  client_id?: string | null;
  contact_id?: string | null;
  subject?: string | null;
  request_type?: string | null;
  attachments?: Attachment[];
  subtasks?: Subtask[];
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  files?: File[];
  qa_status?: 'pending' | 'in_progress' | 'verified' | 'failed';
  qa_notes?: string | null;
}


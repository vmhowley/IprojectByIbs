export interface Attachment {
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface Ticket {
  id: string;
  project_id: string;
  description: string | null;
  status: 'pending_analysis' | 'pending_approval' | 'approved' | 'ongoing' | 'completed' | 'done' ;
  urgency: 'low' | 'medium' | 'high' | 'critical' | 'minor' | 'moderate';
  category: string | null;
  department: string | null;
  assigned_to: string | null;
  date_added: string;
  deadline: string | null;
  tags: string[];
  comment_count: number;
  client?: string | null;
  contact?: string | null;
  subject?: string | null;
  request_type?: string | null;
  attachments?: Attachment[];
  created_at: string;
  updated_at: string;
  files?: File[];

}

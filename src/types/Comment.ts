export interface Comment {
  id: string;
  ticket_id: string;
  user_id?: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  created_at: string;
  updated_at: string;
}


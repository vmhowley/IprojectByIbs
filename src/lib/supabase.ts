import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Task = {
  id: string;
  project_id: string;
  task_number: string;
  title: string;
  description: string | null;
  status: "pending_analysis" | "pending_approval" | "approved" | "ongoing" | "completed" ;
  urgency: 'high' | 'medium' | 'low';
  category: string | null;  
  department: string | null;
  assigned_to: string | null;
  date_added: string;
  deadline: string | null;
  tags: string[];
  comment_count: number;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

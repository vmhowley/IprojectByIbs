export interface Meeting {
  id: string;
  title: string;
  date: string;
  transcription?: string;
  summary?: string;
  action_items?: string[]; 
  audio_url?: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateMeetingDTO {
  title: string;
  date: string;
  summary?: string;
  action_items?: string[];
  audio_url?: string;
  transcription?: string;
}

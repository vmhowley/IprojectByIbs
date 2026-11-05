export interface Channel {
  id: string;
  name: string;
  /** Older channels only: the team is organization_id now. */
  domain?: string | null;
  organization_id?: string | null;
  created_by: string;
  created_at: string;
}

export interface ChannelMessage {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    name: string;
    avatar?: string;
  }
}

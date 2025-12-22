export interface Channel {
  id: string;
  name: string;
  domain: string;
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


import { supabase } from '../lib/supabase';
import type { ChatMessage } from '../types/ChatMessage';

export const chatService = {
  // Fetch message history for a room
  // Fetch message history for a room
  async getMessages(roomId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages (Supabase):', error);
      return [];
    }
    
    // Map DB columns to ChatMessage type if necessary
    // Assuming DB has: id, room_id, content, user_id, user_name, created_at
    return data.map((msg: any) => ({
      id: msg.id,
      content: msg.content,
      user: {
        name: msg.user_name || 'Unknown',
      },
      createdAt: msg.created_at,
      userId: msg.user_id 
    }));
  },

  // Send a new message
  async sendMessage(roomId: string, userId: string, userName: string, content: string): Promise<void> {
    const payload = {
      room_id: roomId,
      user_id: userId,
      user_name: userName,
      content: content,
    };
    
    const { error } = await supabase
      .from('messages')
      .insert(payload)
      ; 
      
    if (error) {
      console.error('Error sending message (Supabase):', error);
      throw error;
    }
  }
};

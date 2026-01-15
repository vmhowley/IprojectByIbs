
import { supabase } from '../lib/supabase';

export interface SupportMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface SupportChat {
    id: string;
    user_id: string;
    status: 'open' | 'closed' | 'archived';
    created_at: string;
    updated_at: string;
}

export const supportService = {
  // Get or Create an open chat for the current user
  async getOrCreateOpenChat(userId: string): Promise<SupportChat | null> {
    // 1. Try to find an existing open chat
    const { data: existingChats, error: searchError } = await supabase
      .from('support_chats')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'open')
      .limit(1);

    if (searchError) {
      console.error('Error searching for open support chat:', searchError);
      throw searchError;
    }

    if (existingChats && existingChats.length > 0) {
      return existingChats[0];
    }

    // 2. If no open chat, create one
    const { data: newChat, error: createError } = await supabase
        .from('support_chats')
        .insert({ user_id: userId, status: 'open' })
        .select()
        .single();
    
    if (createError) {
        console.error('Error creating support chat:', createError);
        throw createError;
    }

    return newChat;
  },

  // Fetch messages for a specific chat
  async getMessages(chatId: string): Promise<SupportMessage[]> {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching support messages:', error);
      return [];
    }

    return data as SupportMessage[];
  },

  // Send a message
  async sendMessage(chatId: string, senderId: string, content: string): Promise<void> {
    const { error } = await supabase
      .from('support_messages')
      .insert({
        chat_id: chatId,
        sender_id: senderId,
        content: content
      });

    if (error) {
      console.error('Error sending support message:', error);
      throw error;
    }
  },

  // Admin: Get all open chats
  async getAllOpenChats(): Promise<(SupportChat & { user_email?: string })[]> {
    const { data, error } = await supabase
      .from('support_chats')
      .select('*, user_profiles(email)')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all open chats:', error);
      return [];
    }

    // Transform to flatten user email if possible, though PostgREST returns it as an object
    return data.map((chat: any) => ({
      ...chat,
      user_email: chat.user_profiles?.email
    }));
  },

  // Admin: Resolve/Close a chat
  async resolveChat(chatId: string): Promise<void> {
    const { error } = await supabase
      .from('support_chats')
      .update({ status: 'closed' })
      .eq('id', chatId);

    if (error) {
      console.error('Error closing support chat:', error);
      throw error;
    }
  }
};

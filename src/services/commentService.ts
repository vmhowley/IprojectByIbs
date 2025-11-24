import { supabase, handleSupabaseResponse } from './api';
import { Comment } from '../types';

export const commentService = {
  async getByTicket(ticketId: string): Promise<Comment[]> {
    return handleSupabaseResponse(
      supabase
        .from('comments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })
    );
  },

  async create(comment: { ticket_id: string; user_name: string; content: string; user_avatar?: string }): Promise<Comment> {
    return handleSupabaseResponse(
      supabase
        .from('comments')
        .insert([comment])
        .select()
        .single()
    );
  },

  async update(id: string, content: string): Promise<Comment> {
    return handleSupabaseResponse(
      supabase
        .from('comments')
        .update({ content })
        .eq('id', id)
        .select()
        .single()
    );
  },

  async delete(id: string): Promise<void> {
    await handleSupabaseResponse(
      supabase
        .from('comments')
        .delete()
        .eq('id', id)
    );
  }
};

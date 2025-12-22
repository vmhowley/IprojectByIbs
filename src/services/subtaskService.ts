
import { Subtask } from '../types';
import { handleSupabaseResponse, supabase } from './api';

export const subtaskService = {
  async getByTicketId(ticketId: string): Promise<Subtask[]> {
    return handleSupabaseResponse(
      supabase
        .from('ticket_subtasks')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })
    );
  },

  async create(subtask: Omit<Subtask, 'id' | 'created_at' | 'is_completed'>): Promise<Subtask> {
    return handleSupabaseResponse(
      supabase
        .from('ticket_subtasks')
        .insert([{ ...subtask, is_completed: false }])
        .select()
        .single()
    );
  },

  async updateStatus(id: string, is_completed: boolean): Promise<Subtask> {
    return handleSupabaseResponse(
      supabase
        .from('ticket_subtasks')
        .update({ is_completed })
        .eq('id', id)
        .select()
        .single()
    );
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
        .from('ticket_subtasks')
        .delete()
        .eq('id', id);

    if (error) throw error;
  }
};

import { TicketProgram } from '../types';
import { handleSupabaseResponse, supabase } from './api';

export const programService = {
  async getByTicketId(ticketId: string): Promise<TicketProgram[]> {
    return handleSupabaseResponse(
      supabase
        .from('ticket_programs')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })
    );
  },

  async create(program: Omit<TicketProgram, 'id' | 'created_at' | 'updated_at'>): Promise<TicketProgram> {
    return handleSupabaseResponse(
      supabase
        .from('ticket_programs')
        .insert([program])
        .select()
        .single()
    );
  },

  async update(id: string, updates: Partial<TicketProgram>): Promise<TicketProgram> {
    return handleSupabaseResponse(
      supabase
        .from('ticket_programs')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    );
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
        .from('ticket_programs')
        .delete()
        .eq('id', id);

    if (error) throw error;
  }
};

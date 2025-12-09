import { Ticket } from '../types';
import { handleSupabaseResponse, supabase } from './api';

export const ticketService = {
  async getByProject(projectId: string): Promise<Ticket[]> {
    return handleSupabaseResponse(
      supabase
        .from('tickets')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
    );
  },

  async getById(id: string): Promise<Ticket> {
    return handleSupabaseResponse(
      supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .maybeSingle()
    );
  },

  async create(ticket: Partial<Ticket>): Promise<Ticket> {
    // Get current user ID from session
    const { data: { user } } = await supabase.auth.getUser();
    
    return handleSupabaseResponse(
      supabase
        .from('tickets')
        .insert([{ ...ticket, created_by: user?.id }])
        .select()
        .single()
    );
  },


  async update(id: string, updates: Partial<Ticket>): Promise<Ticket> {
    return handleSupabaseResponse(
      supabase
        .from('tickets')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    );
  },

  async updateStatus(id: string, status: Ticket['status']): Promise<Ticket> {
    return this.update(id, { status });
  },

  async delete(id: string): Promise<void> {
    await handleSupabaseResponse(
      supabase
        .from('tickets')
        .delete()
        .eq('id', id)
    );
  }
};

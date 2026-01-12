
import { supabase } from '../lib/supabase';

export interface TicketRequestType {
  id: string;
  value: string;
  label: string;
  description?: string;
  is_active: boolean;
}

export const requestTypeService = {
  async getAll() {
    const { data, error } = await supabase
      .from('ticket_request_types')
      .select('*')
      .eq('is_active', true)
      .order('label');
    
    if (error) throw error;
    return data as TicketRequestType[];
  },

  async create(label: string) {
    // Auto-generate value slug from label
    const value = label.toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove non-word chars
      .replace(/\s+/g, '-')     // Replace spaces with -
      .replace(/--+/g, '-');    // Replace multiple - with single -

    const { data, error } = await supabase
      .from('ticket_request_types')
      .insert({ label, value })
      .select()
      .single();

    if (error) throw error;
    return data as TicketRequestType;
  },

  async delete(id: string) {
    // Soft delete by setting is_active = false
    // or hard delete if not used? Let's do soft delete safe approach first, 
    // but the requirement implies "add or delete". 
    // If I hard delete, old tickets might point to invalid types if I stored the 'value'.
    // Tickets store 'request_type' as string? Let's check Schema.
    // Ticket.ts says `request_type?: string | null;`
    // If it's just a string, hard deleting the type from this table won't break referential integrity technically, 
    // but semantically it might be weird.
    // Let's create a hard delete for now as it's cleaner for "Removing from list".
    
    const { error } = await supabase
      .from('ticket_request_types')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

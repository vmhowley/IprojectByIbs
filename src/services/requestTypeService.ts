
import { supabase } from '../lib/supabase';

export interface TicketRequestType {
  id: string;
  value: string;
  label: string;
  description?: string;
  is_active: boolean;
  /** null: one of the defaults every team uses, which only support staff edit. */
  organization_id?: string | null;
}

/**
 * The types a team picks from: the defaults and its own. A client also reads the
 * types of the company whose portal it uses, to show their labels.
 */
export function pickableTypes(types: TicketRequestType[], organizationId: string | null | undefined) {
  return types.filter((t) => !t.organization_id || t.organization_id === organizationId);
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

  /** Every type this person can read, retired ones included, to name the type of any ticket. */
  async getLabels() {
    const { data, error } = await supabase
      .from('ticket_request_types')
      .select('*')
      .order('label');

    if (error) throw error;
    return data as TicketRequestType[];
  },

  async create(label: string) {
    // Auto-generate value slug from label
    const slug = label.toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove non-word chars
      .replace(/\s+/g, '-')     // Replace spaces with -
      .replace(/--+/g, '-');    // Replace multiple - with single -

    // Values are unique across every team: when another team already uses the
    // slug, the type gets a numbered one. The label is what people see.
    for (let attempt = 1; attempt <= 5; attempt++) {
      const value = attempt === 1 ? slug : `${slug}-${attempt}`;
      const { data, error } = await supabase
        .from('ticket_request_types')
        .insert({ label, value })
        .select()
        .single();

      if (!error) return data as TicketRequestType;
      if (error.code !== '23505') throw error;
    }
    throw new Error('Ya existe un tipo con ese nombre.');
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
    // tickets.request_type does reference the value, so a type that tickets use
    // cannot be deleted (23503): it is retired instead, and those tickets keep it.

    const { error } = await supabase
      .from('ticket_request_types')
      .delete()
      .eq('id', id);

    if (error?.code === '23503') {
      const { error: retireError } = await supabase
        .from('ticket_request_types')
        .update({ is_active: false })
        .eq('id', id);
      if (retireError) throw retireError;
      return;
    }
    if (error) throw error;
  }
};

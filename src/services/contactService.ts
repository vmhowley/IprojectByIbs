import { Contact } from '../types/Client';
import { handleSupabaseResponse, supabase } from './api';

export const contactService = {
  async getByClientId(clientId: string): Promise<Contact[]> {
    return handleSupabaseResponse(
      supabase
        .from('contacts')
        .select('*')
        .eq('client_id', clientId)
        .order('is_primary', { ascending: false })
        .order('name', { ascending: true })
    );
  },

  async getById(id: string): Promise<Contact> {
    return handleSupabaseResponse(
      supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single()
    );
  },

  async create(contact: Partial<Contact>): Promise<Contact> {
    return handleSupabaseResponse(
      supabase
        .from('contacts')
        .insert([contact])
        .select()
        .single()
    );
  },

  async update(id: string, updates: Partial<Contact>): Promise<Contact> {
    return handleSupabaseResponse(
      supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    );
  }
};

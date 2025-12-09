import { Client } from '../types/Client';
import { handleSupabaseResponse, supabase } from './api';

export const clientService = {
  async getAll(): Promise<Client[]> {
    return handleSupabaseResponse(
      supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true })
    );
  },

  async getById(id: string): Promise<Client> {
    return handleSupabaseResponse(
      supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()
    );
  },

  async create(client: Partial<Client>): Promise<Client> {
    const { data: { user } } = await supabase.auth.getUser();
    
    return handleSupabaseResponse(
      supabase
        .from('clients')
        .insert([{ ...client, created_by: user?.id }])
        .select()
        .single()
    );
  },

  async update(id: string, updates: Partial<Client>): Promise<Client> {
    return handleSupabaseResponse(
      supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    );
  },

  async search(query: string): Promise<Client[]> {
    return handleSupabaseResponse(
      supabase
        .from('clients')
        .select('*')
        .ilike('name', `%${query}%`)
        .order('name', { ascending: true })
        .limit(10)
    );
  },

  async getContacts(clientId: string): Promise<any[]> {
    return handleSupabaseResponse(
      supabase
        .from('contacts')
        .select('*')
        .eq('client_id', clientId)
        .order('name', { ascending: true })
    );
  },

  async createContact(contact: any): Promise<any> {
    return handleSupabaseResponse(
      supabase
        .from('contacts')
        .insert([contact])
        .select()
        .single()
    );
  }
};

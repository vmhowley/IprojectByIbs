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

    if (!user) throw new Error('User not authenticated');
    
    return handleSupabaseResponse(
      supabase
        .from('clients')
        .insert([{ ...client, user_id: user.id }])
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
  },

  async linkUser(email: string, clientId: string): Promise<void> {
    // 1. Find user by email
    const { data: users, error: searchError } = await supabase
      .from('user_profiles')
      .select('id, role')
      .eq('email', email)
      .limit(1);

    if (searchError) throw searchError;
    if (!users || users.length === 0) {
      throw new Error('No se encontró ningún usuario registrado con este correo.');
    }

    const user = users[0];

    // 2. Update user profile to link to client and set role to guest
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        client_id: clientId
      })
      .eq('id', user.id);

    if (updateError) throw new Error(updateError.message);
  },

  async unlinkUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        client_id: null
        // We keep the role as is, or could reset to 'user' if preferred, but safer to leave as guest
      })
      .eq('id', userId);

    if (error) throw error;
  },

  async getLinkedUsers(clientId: string): Promise<any[]> {
    return handleSupabaseResponse(
      supabase
        .from('user_profiles')
        .select('*')
        .eq('client_id', clientId)
        .order('name', { ascending: true })
    );
  }
};

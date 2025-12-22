import { supabase } from '../lib/supabase';
import { Channel } from '../types/Channel';

export const channelService = {
  async getAll() {
    // RLS filters by domain automatically
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data as Channel[];
  },

  async create(name: string) {
    // Domain is enforced by database trigger/default or RLS check
    // Ideally we pass domain, but RLS prevents inserting wrong domain. 
    // Wait, my migration relied on `domain = get_my_email_domain()` check. 
    // So I need to fetch the user's domain first or let the DB handle it if I had a trigger.
    // My migration didn't add a trigger to Auto-Fill domain. It only has a CHECK policy.
    // So the Frontend MUST send the domain.
    
    // 1. Get current user domain
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) throw new Error('User not authenticated');
    
    const domain = user.email.split('@')[1].toLowerCase();

    const { data, error } = await supabase
      .from('channels')
      .insert({ name, domain })
      .select()
      .single();

    if (error) throw error;
    return data as Channel;
  }
};

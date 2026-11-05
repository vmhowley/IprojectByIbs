import { supabase } from '../lib/supabase';
import { Channel } from '../types/Channel';

export const channelService = {
  async getAll() {
    // RLS returns the channels of the caller's organization.
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data as Channel[];
  },

  async create(name: string) {
    // The database puts the channel in the caller's organization.
    const { data, error } = await supabase
      .from('channels')
      .insert({ name })
      .select()
      .single();

    if (error) throw error;
    return data as Channel;
  }
};

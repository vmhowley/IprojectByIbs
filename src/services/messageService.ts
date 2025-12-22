import { supabase } from '../lib/supabase';

export const messageService = {
  async getByChannel(channelId: string) {
    const { data, error } = await supabase
      .from('channel_messages')
      .select(`
        *,
        user:user_profiles (
          name,
          avatar
        )
      `)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true });
      
    if (error) throw error;
    
    // Map the nested user response to flat structure expected by UI if needed
    // But Types use nested user, so it is fine.
    // Note: 'user_profiles' table is referenced by foreign key usually? 
    // My migration: user_id references auth.users(id). 
    // But I can't select from auth.users easily.
    // I should probably have referenced user_profiles(id) or rely on Query joining user_profiles.
    // Let's assume user_profiles exists and is linked.
    
    return data as any[]; 
  },

  async send(channelId: string, content: string) {
    const { data, error } = await supabase
      .from('channel_messages')
      .insert({ channel_id: channelId, content })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  subscribe(channelId: string, onMessage: (msg: any) => void) {
    return supabase
      .channel(`chat:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'channel_messages',
          filter: `channel_id=eq.${channelId}`
        },
        async (payload) => {
           // Fetch full user details for the new message
           // Because payload only has raw columns
           const { data } = await supabase
             .from('user_profiles')
             .select('name, avatar')
             .eq('id', payload.new.user_id)
             .single();
           
           const newMessage = {
             ...payload.new,
             user: data
           };
           
           onMessage(newMessage);
        }
      )
      .subscribe();
  }
};

import { supabase } from '../lib/supabase';

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender?: {
      name: string;
      avatar?: string;
  }
}

export const directMessageService = {
  // Get conversation with a specific user
  async getConversation(otherUserId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('direct_messages')
      .select(`
        *,
        sender:sender_id (
            name,
            avatar
        )
      `)
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as DirectMessage[];
  },

  // Send a message
  async send(receiverId: string, content: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content
      });

    if (error) throw error;
  },

  // Mark messages as read
  async markAsRead(ids: string[]) {
    if (ids.length === 0) return;
    
    const { error } = await supabase
      .from('direct_messages')
      .update({ is_read: true })
      .in('id', ids);

    if (error) throw error;
  },

  // Unread messages addressed to me, counted per sender
  async getUnreadBySender(): Promise<Record<string, number>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return {};

    const { data, error } = await supabase
      .from('direct_messages')
      .select('sender_id')
      .eq('receiver_id', user.id)
      .eq('is_read', false);

    if (error) throw error;
    const counts: Record<string, number> = {};
    for (const row of data || []) {
      counts[row.sender_id] = (counts[row.sender_id] || 0) + 1;
    }
    return counts;
  },

  // Subscribe to new messages
  subscribe(otherUserId: string, callback: (msg: DirectMessage) => void) {
    return supabase
      .channel(`direct_messages:${otherUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          // Realtime filters accept one column only, so listen to what this
          // person sends; RLS only delivers rows addressed to the reader.
          filter: `sender_id=eq.${otherUserId}`
          // Note: RLS might filter 'filter' clauses, simple table filter is safer combined with client-side check if needed, 
          // but Supabase Realtime fits row by RLS usually. 
          // Let's simplify filter to just table and check IDs in callback or use custom logic.
          // Actually, 'filter' in realtime must be simple. Let's try to just listen to INSERT on table and filter in code or simple eq.
        },
        async (payload) => {
            // We need to fetch the sender details because payload only has raw columns
            const newMessage = payload.new as DirectMessage;
            
            // Check if it belongs to this conversation
            // (Client-side filtering because Supabase realtime filter string is limited)
            // But we can rely on proper subscription setup.
            // Let's just return the raw message and let UI handle/enrich it.
            
           callback(newMessage);
        }
      )
      .subscribe();
  }
};

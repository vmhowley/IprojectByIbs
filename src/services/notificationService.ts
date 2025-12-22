import { supabase } from '../lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  type: 'info' | 'assignment' | 'comment' | 'system' | 'mention';
  title: string;
  content: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export const notificationService = {
  // Get my notifications
  async getAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50); // Limit to last 50 for now

    if (error) throw error;
    return data as Notification[];
  },

  // Get unread count
  async getUnreadCount() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
        
      if (error) console.error('Error fetching unread count', error);
      return count || 0;
  },

  // Mark as read
  async markAsRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) throw error;
  },

  // Mark all as read
  async markAllAsRead() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) throw error;
  },

  // Create a notification (Utility for other services)
  async create(userId: string, title: string, content: string, type: Notification['type'] = 'info', link?: string) {
      const { error } = await supabase
        .from('notifications')
        .insert({
            user_id: userId,
            title,
            content,
            type,
            link
        });
        
      if (error) console.error('Error creating notification:', error);
  },

  // Subscribe to real-time notifications
  subscribe(userId: string, callback: (notification: Notification) => void) {
      const channel = supabase.channel('my-notifications')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`
            },
            (payload) => {
                callback(payload.new as Notification);
            }
        )
        .subscribe();
        
      return channel;
  }
};

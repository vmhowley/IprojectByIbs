import { supabase } from './api';

export interface ActivityLog {
  id: string;
  project_id: string;
  user_id: string;
  action: string;
  details: any;
  created_at: string;
  user?: {
    name: string;
    email: string;
    avatar?: string; // If available in user_profiles
  }
}

export const activityService = {
  async logActivity(projectId: string, action: string, details: any = null) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('project_activity_logs')
      .insert([{
        project_id: projectId,
        user_id: user.id,
        action,
        details
      }]);

    if (error) {
      console.error('Failed to log activity:', error);
      // We don't throw here to avoid blocking the main action if logging fails
    }
  },

  async getProjectLogs(projectId: string): Promise<ActivityLog[]> {
    const { data: logs, error } = await supabase
      .from('project_activity_logs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!logs || logs.length === 0) return [];

    // Manually fetch user profiles to avoid join issues
    const userIds = [...new Set(logs.map(log => log.user_id).filter(Boolean))];
    
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, name, email, avatar')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return logs.map(log => ({
        ...log,
        user: profileMap.get(log.user_id) || { name: 'Usuario Desconocido', email: '' }
      })) as ActivityLog[];
    }

    return logs as ActivityLog[];
  },

  async logView(projectId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if user is a contact (linked to a client)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('client_id')
      .eq('id', user.id)
      .single();

    if (!profile?.client_id) return; // Only log views for contacts

    // Check for a recent view log to avoid spamming the database
    // Only log if last view was more than 1 hour ago
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { data: recentLogs } = await supabase
      .from('project_activity_logs')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .eq('action', 'viewed')
      .gt('created_at', oneHourAgo);

    if (recentLogs && recentLogs.length > 0) return;

    await this.logActivity(projectId, 'viewed');
  }
};

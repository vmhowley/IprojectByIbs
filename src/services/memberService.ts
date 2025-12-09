import { supabase } from './api';

export interface ProjectMember {
  id: string; // member record id
  project_id: string;
  user_id: string;
  role: 'viewer' | 'editor' | 'admin';
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export const memberService = {
  async getMembers(projectId: string): Promise<ProjectMember[]> {
    const { data, error } = await supabase
      .from('project_members')
      .select('*')
      .eq('project_id', projectId);

    if (error) throw error;
    if (!data || data.length === 0) return [];

    const userIds = data.map((m: any) => m.user_id);

    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, name, email, avatar')
      .in('id', userIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
    
    return data.map((item: any) => ({
      ...item,
      user: profileMap.get(item.user_id)
    }));
  },

  async addMember(projectId: string, email: string, role: 'viewer' | 'editor' | 'admin' = 'viewer'): Promise<void> {
    // 1. Find user by email
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !user) {
      throw new Error('User not found');
    }

    // 2. Add to project_members
    const { error } = await supabase
      .from('project_members')
      .insert([{
        project_id: projectId,
        user_id: user.id,
        role
      }]);

    if (error) throw error;
  },

  async removeMember(memberId: string): Promise<void> {
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
  }
};

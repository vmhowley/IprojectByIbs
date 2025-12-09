import { Project } from '../types';
import { activityService } from './activityService';
import { handleSupabaseResponse, supabase } from './api';

export const projectService = {
  async getAll(): Promise<Project[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    // 1. Get all projects (assuming RLS is open/broken)
    const { data: projectsData, error } = await supabase
        .from('projects')
        .select('*, clients(name)')
        .order('created_at', { ascending: false });

    if (error) throw error;
    if (!user) return []; // Should not happen if protected route

    // 2. Get my memberships
    const { data: memberships } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);

    const memberProjectIds = memberships?.map(m => m.project_id) || [];

    // 3. Get my profile for role check
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    // 4. Admin sees all, otherwise filter
    let filteredProjects = projectsData as Project[];
    if (profile?.role !== 'admin') {
      filteredProjects = filteredProjects.filter(p => 
          p.created_by === user.id || memberProjectIds.includes(p.id)
      );
    }

    // 5. Fetch assignee profiles manually to avoid join issues
    const assigneeIds = [...new Set(filteredProjects.map(p => p.assignee).filter(Boolean))] as string[];
    
    if (assigneeIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, name')
        .in('id', assigneeIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      filteredProjects = filteredProjects.map(p => ({
        ...p,
        assignee_profile: p.assignee ? profileMap.get(p.assignee) : null
      }));
    }

    return filteredProjects;
  },

  async getById(id: string): Promise<Project> {
    return handleSupabaseResponse(
      supabase
        .from('projects')
        .select('*, clients(name)')
        .eq('id', id)
        .maybeSingle()
    );
  },

  async create(project: Partial<Project>): Promise<Project> {
    // Get current user ID from session
    const { data: { user } } = await supabase.auth.getUser();
    
    const newProject = await handleSupabaseResponse<Project>(
      supabase
        .from('projects')
        .insert([{ ...project, created_by: user?.id }])
        .select()
        .single()
    );

    if (newProject) {
        await activityService.logActivity(newProject.id, 'created', { name: newProject.name });
    }
    return newProject;
  },


  async update(id: string, updates: Partial<Project>): Promise<Project> {
    const updatedProject = await handleSupabaseResponse<Project>(
      supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    );

    if (updatedProject) {
       await activityService.logActivity(id, 'updated', updates);
    }
    return updatedProject;
  },

  async delete(id: string): Promise<void> {
    await handleSupabaseResponse(
      supabase
        .from('projects')
        .delete()
        .eq('id', id)
    );
  }
};

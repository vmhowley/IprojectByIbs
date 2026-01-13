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
        .is('deleted_at', null)
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

    // 4. Client-side filtering as failsafe (in case RLS is permissive)
    let filteredProjects = (projectsData || []) as Project[];
    
    // Public domains blacklist
    const publicDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 
      'icloud.com', 'protonmail.com', 'zoho.com', 'yandex.com', 'mail.com', 'gmx.com'
    ];
    
    const getDomain = (email: string) => email?.split('@')[1]?.toLowerCase();

    if (profile?.role !== 'admin' && user?.email) {
      const userDomain = getDomain(user.email);
      const isPublic = publicDomains.includes(userDomain || '');

      // Fetch creators to check their domains
      const creatorIds = [...new Set(filteredProjects.map(p => p.created_by).filter(Boolean))] as string[];
      let creatorMap = new Map<string, { email: string }>();
      
      if (creatorIds.length > 0) {
        const { data: creators } = await supabase
          .from('user_profiles')
          .select('id, email')
          .in('id', creatorIds);
        creatorMap = new Map(creators?.map(c => [c.id, c]) || []);
      }

      filteredProjects = filteredProjects.filter(p => {
        // 1. Own project or Assigned or Member
        if (p.created_by === user.id || memberProjectIds.includes(p.id) || p.assignee === user.id) return true;

        // 2. Client Access
        // (If we had client_id in profile, we check it here. Assuming RLS handles strict client access mostly, 
        // but we can trust RLS for client-isolation if the domain logic below is the main leak)

        // 3. Domain Logic
        if (!isPublic && userDomain) {
           const creator = creatorMap.get(p.created_by || '');
           if (creator && getDomain(creator.email) === userDomain) {
             return true;
           }
        }
        
        return false;
      });
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
        .is('deleted_at', null)
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
       // If client_id changed, update all tickets for this project
       if (updates.client_id !== undefined) {
         await supabase
           .from('tickets')
           .update({ client_id: updates.client_id })
           .eq('project_id', id);
       }
       
       await activityService.logActivity(id, 'updated', updates);
    }
    return updatedProject;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
        .from('projects')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
    
    // Log activity for soft delete
    await activityService.logActivity(id, 'deleted (archived)', {});
  }
};

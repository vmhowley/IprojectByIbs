import { Project } from '../types';
import { activityService } from './activityService';
import { handleSupabaseResponse, supabase } from './api';

export const projectService = {
  async getAll(): Promise<Project[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    // 1. Get all projects I can see
    const { data: projectsData, error } = await supabase
        .from('projects')
        .select('*, clients(name)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    if (error) throw error;
    if (!user) return []; // Should not happen if protected route

    // 2. Row-level security decides what each person sees: their organization's
    // projects, the ones shared with them and those of the client whose portal
    // they use. Filtering again here by email domain hid projects of teams on
    // public domains, so the list is what the database returns.
    let filteredProjects = (projectsData || []) as Project[];

    // 3. Fetch assignee profiles manually to avoid join issues
    const assigneeIds = [...new Set(filteredProjects.map(p => p.assignee).filter(Boolean))] as string[];
    
    // FETCH PROFILES
    let profileMap = new Map();
    if (assigneeIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, name')
        .in('id', assigneeIds);

      profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    }

    // 4. Fetch stats (Tickets count)
    const projectIds = filteredProjects.map(p => p.id);
    let statsMap = new Map<string, { total: number; completed: number }>();
    
    if (projectIds.length > 0) {
        const { data: tickets } = await supabase
            .from('tickets')
            .select('project_id, status')
            .in('project_id', projectIds);

        tickets?.forEach(t => {
            const current = statsMap.get(t.project_id) || { total: 0, completed: 0 };
            current.total += 1;
            if (t.status === 'completed' || t.status === 'done') {
                current.completed += 1;
            }
            statsMap.set(t.project_id, current);
        });
    }

    filteredProjects = filteredProjects.map(p => {
        const stats = statsMap.get(p.id) || { total: 0, completed: 0 };
        return {
            ...p,
            assignee_profile: p.assignee ? profileMap.get(p.assignee) : null,
            stats: {
                total_tasks: stats.total,
                completed_tasks: stats.completed
            }
        };
    });

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

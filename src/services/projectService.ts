import { supabase, handleSupabaseResponse } from './api';
import { Project } from '../types';

export const projectService = {
  async getAll(): Promise<Project[]> {
    return handleSupabaseResponse(
      supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
    );
  },

  async getById(id: string): Promise<Project> {
    return handleSupabaseResponse(
      supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .maybeSingle()
    );
  },

  async create(project: { name: string; description?: string }): Promise<Project> {
    return handleSupabaseResponse(
      supabase
        .from('projects')
        .insert([project])
        .select()
        .single()
    );
  },

  async update(id: string, updates: Partial<Project>): Promise<Project> {
    return handleSupabaseResponse(
      supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    );
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

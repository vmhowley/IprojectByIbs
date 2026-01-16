import { ProjectDocument } from '../types/Project';
import { handleSupabaseResponse, supabase } from './api';

export const documentationService = {
  async getAll(): Promise<ProjectDocument[]> {
    return handleSupabaseResponse(
      supabase
        .from('project_documents')
        .select('*, projects(name)')
        .order('created_at', { ascending: false })
    );
  },

  async getByProject(projectId: string): Promise<ProjectDocument[]> {
    return handleSupabaseResponse(
      supabase
        .from('project_documents')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
    );
  },

  async create(doc: Partial<ProjectDocument>): Promise<ProjectDocument> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    return handleSupabaseResponse(
      supabase
        .from('project_documents')
        .insert([{ ...doc, created_by: user.id }])
        .select()
        .single()
    );
  },

  async update(id: string, updates: Partial<ProjectDocument>): Promise<ProjectDocument> {
    return handleSupabaseResponse(
      supabase
        .from('project_documents')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    );
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('project_documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async uploadFile(file: File, projectId?: string): Promise<{ url: string; path: string }> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = projectId 
      ? `documentation/${projectId}/${fileName}`
      : `documentation/general/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('ticket-attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('ticket-attachments')
      .getPublicUrl(filePath);

    return {
      url: data.publicUrl,
      path: filePath
    };
  }
};

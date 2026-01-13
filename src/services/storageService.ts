import { supabase } from './api';

export const storageService = {
  async uploadFile(file: File, projectId: string, ticketId?: string): Promise<{ url: string; path: string }> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = ticketId 
      ? `${projectId}/${ticketId}/${fileName}`
      : `projects/${projectId}/${fileName}`;

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
  },

  async deleteFile(filePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from('ticket-attachments')
      .remove([filePath]);

    if (error) {
      throw error;
    }
  }
};

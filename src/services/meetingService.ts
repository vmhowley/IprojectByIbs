import { supabase } from '../lib/supabase';
import { CreateMeetingDTO, Meeting } from '../types/meeting';

export const meetingService = {
  async getAll() {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return data as Meeting[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Meeting;
  },

  async create(meeting: CreateMeetingDTO) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('meetings')
      .insert([{ ...meeting, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    return data as Meeting;
  },

  async update(id: string, updates: Partial<Meeting>) {
    const { data, error } = await supabase
      .from('meetings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Meeting;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('meetings')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async uploadRecording(file: File) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('meeting-recordings')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('meeting-recordings')
      .getPublicUrl(fileName); // Note: bucket is private, so we might need signed URL or change bucket to public. 
      // The migration said public=false. So we actually need createSignedUrl.
    
    // For playback in the app for the owner, signed URL is better.
    // But to save "audio_url" in DB, usually we save the path or a long-expiry signed URL.
    // Or we save the path and generate signed URL on demand.
    // Let's return the path (fileName) and let the component fetch the signed URL.
    // UPDATE: The DB column is `audio_url`. Let's store the path for now or generate a signed URL with long expiry?
    // Path is safer. `fileName` IS the path in the bucket.
    
    return fileName;
  },

  async getAudioUrl(path: string) {
    const { data, error } = await supabase.storage
      .from('meeting-recordings')
      .createSignedUrl(path, 60 * 60); // 1 hour expiry

    if (error) throw error;
    return data.signedUrl;
  }
};

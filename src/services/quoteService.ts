import { ProjectQuote } from '../types/Project';
import { handleSupabaseResponse, supabase } from './api';

// Quotes live in a private bucket: each file is read through a signed link that
// expires, never through a public URL. Rows and files are reachable only by the
// admins who work on the project (20261105121000_project_quotes.sql).
const BUCKET = 'quotes';
const SIGNED_LINK_SECONDS = 60;
// Where project files and documentation were uploaded before quotes had their own place.
const PUBLIC_FILES = '/object/public/ticket-attachments/';

function extensionOf(name: string): string {
  const match = /\.([a-z0-9]{1,8})$/i.exec(name);
  return match ? `.${match[1].toLowerCase()}` : '';
}

/** The storage path of a file in ticket-attachments, from its public link. */
export function publicFilePath(url: string): string | null {
  const at = url.indexOf(PUBLIC_FILES);
  if (at === -1) return null;
  return decodeURIComponent(url.slice(at + PUBLIC_FILES.length).split('?')[0]);
}

export const quoteService = {
  /** Every quote the current admin can reach, newest first. */
  async getAll(): Promise<ProjectQuote[]> {
    return handleSupabaseResponse(
      supabase.from('project_quotes').select('*').order('created_at', { ascending: false })
    );
  },

  async getByProject(projectId: string): Promise<ProjectQuote[]> {
    return handleSupabaseResponse(
      supabase
        .from('project_quotes')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
    );
  },

  /** Files a quote under the project: first the file, then its row. */
  async upload(projectId: string, file: Blob, name: string, type?: string | null): Promise<ProjectQuote> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const path = `${projectId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extensionOf(name)}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: type || undefined, upsert: false });
    if (uploadError) throw uploadError;

    try {
      return await handleSupabaseResponse<ProjectQuote>(
        supabase
          .from('project_quotes')
          .insert([{
            project_id: projectId,
            name,
            file_path: path,
            file_type: type || null,
            file_size: file.size,
            created_by: user.id,
          }])
          .select()
          .single()
      );
    } catch (error) {
      // A file without its row would be unreachable: take it back out.
      await supabase.storage.from(BUCKET).remove([path]);
      throw error;
    }
  },

  /** Downloads the file under its own name through a link that lasts a minute. */
  async download(quote: ProjectQuote): Promise<void> {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(quote.file_path, SIGNED_LINK_SECONDS, { download: quote.name });
    if (error) throw error;
    window.location.assign(data.signedUrl);
  },

  /** Removes the row, then the file. */
  async remove(quote: ProjectQuote): Promise<void> {
    const { error } = await supabase.from('project_quotes').delete().eq('id', quote.id);
    if (error) throw error;
    await supabase.storage.from(BUCKET).remove([quote.file_path]);
  },

  /**
   * Copies a file uploaded to the project's files or documentation into the
   * project's quotes. The caller then drops its own reference to the file and
   * calls removePublicFile, so the old public link stops working.
   */
  async moveFromPublicFile(
    projectId: string,
    file: { name: string; url: string; type?: string | null }
  ): Promise<ProjectQuote> {
    const path = publicFilePath(file.url);
    if (!path) throw new Error('No se encontró el archivo original.');

    const { data: blob, error } = await supabase.storage.from('ticket-attachments').download(path);
    if (error || !blob) throw error || new Error('No se pudo leer el archivo original.');

    // Documents carry a title rather than a file name; the download needs the extension.
    const name = extensionOf(file.name) ? file.name : `${file.name}${extensionOf(path)}`;
    return this.upload(projectId, blob, name, file.type || blob.type);
  },

  /** Deletes the public copy left behind by moveFromPublicFile. */
  async removePublicFile(url: string): Promise<void> {
    const path = publicFilePath(url);
    if (!path) return;
    const { data, error } = await supabase.storage.from('ticket-attachments').remove([path]);
    if (error) throw error;
    // Storage answers without an error when a policy keeps the file: check that it went.
    if (!data || data.length === 0) throw new Error('La copia pública no se pudo borrar.');
  },
};

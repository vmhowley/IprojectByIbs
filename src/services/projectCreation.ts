import { Project } from '../types';
import { projectService } from './projectService';

/**
 * Creates a project and uploads the files chosen in the form. A file that
 * fails to upload is skipped; the project is still created.
 */
export async function createProjectWithFiles(projectData: Partial<Project>, files: File[]): Promise<Project> {
  // 1. Create Project
  const data = await projectService.create(projectData);

  // 2. Upload Files
  if (files.length === 0) return data;
  const { storageService } = await import('./storageService');
  const attachments = [];

  for (const file of files) {
    try {
      const { url } = await storageService.uploadFile(file, data.id);
      attachments.push({
        name: file.name,
        url,
        size: file.size,
        type: file.type
      });
    } catch (err) {
      console.error('Failed to upload file:', file.name, err);
    }
  }

  // 3. Update Project with Attachments
  if (attachments.length > 0) {
    return projectService.update(data.id, { attachments });
  }
  return data;
}

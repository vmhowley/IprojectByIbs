import toast from 'react-hot-toast';
import { quoteService } from '../../services/quoteService';
import { ProjectQuote } from '../../types/Project';
import { errorMessage } from '../../utils/errors';
import { confirmDialog } from '../ui/ConfirmDialog';

/**
 * Moves a quote filed with a project's files or documentation into the project's
 * quote: a private copy first, then the old entry goes (dropEntry), then the
 * public copy, so its old link stops working. Resolves the new quote once the
 * copy exists, or null when the person cancels or the copy fails.
 */
export async function moveToQuote(
  projectId: string,
  file: { name: string; url: string; type?: string | null },
  dropEntry: () => Promise<void>
): Promise<ProjectQuote | null> {
  const ok = await confirmDialog({
    title: 'Mover a la cotización',
    message: `«${file.name}» pasará a la cotización del proyecto, que solo ven los administradores. La copia actual se borra y su enlace deja de funcionar.`,
    confirmText: 'Mover a la cotización',
    tone: 'primary',
  });
  if (!ok) return null;

  const toastId = toast.loading('Moviendo a la cotización…');
  let quote: ProjectQuote;
  try {
    quote = await quoteService.moveFromPublicFile(projectId, file);
  } catch (error) {
    console.error('Error copying file to quote:', error);
    toast.error('No se pudo mover: ' + errorMessage(error, 'error desconocido'), { id: toastId });
    return null;
  }

  try {
    await dropEntry();
  } catch (error) {
    console.error('Error removing the old entry:', error);
    toast.error('Se copió a la cotización, pero no se pudo quitar de aquí. Quítalo a mano.', { id: toastId });
    return quote;
  }

  try {
    await quoteService.removePublicFile(file.url);
    toast.success('Movido a la cotización', { id: toastId });
  } catch (error) {
    console.error('Error deleting the public copy:', error);
    toast.error('Se movió a la cotización, pero la copia anterior no se pudo borrar.', { id: toastId });
  }
  return quote;
}

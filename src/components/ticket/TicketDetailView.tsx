import console from 'console';
import { CheckSquare, Download, FileText, MessageSquare, Paperclip, Plus, Tag, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { commentService } from '../../services/commentService';
import { documentService } from '../../services/documentService';
import { programService } from '../../services/programService';
import { projectService } from '../../services/projectService';
import { storageService } from '../../services/storageService';
import { subtaskService } from '../../services/subtaskService';
import { ticketService } from '../../services/ticketService';
import { getUsers } from '../../services/usersService';
import { Comment, Project, Subtask, Ticket, TicketProgram, UserProfile } from '../../types';
import { confirmAction } from '../../utils/confirmationToast';
import { ModernSelect } from '../ui/ModernSelect';
import { StatusBadge } from '../ui/StatusBadge';

interface TicketDetailViewProps {
  ticketId: string;
  onClose?: () => void;
  onDelete?: (id: string) => void;
  onUpdate?: (ticket: Ticket) => void;
}

export function TicketDetailView({ ticketId, onClose, onDelete, onUpdate }: TicketDetailViewProps) {
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [programs, setPrograms] = useState<TicketProgram[]>([]);
  const [newProgram, setNewProgram] = useState({
    object_name: '',
    object_type: '',
    attribute: '',
    description: ''
  });
  const [addingProgram, setAddingProgram] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subtasks state
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [addingSubtask, setAddingSubtask] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleUpdateTicket = async (updates: Partial<Ticket>) => {
    if (!ticket) return;
    try {
      const updated = await ticketService.update(ticket.id, updates);
      setTicket(updated);
      if (onUpdate) onUpdate(updated);
      toast.success('Ticket actualizado');
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast.error('Error al actualizar el ticket');
    }
  };

  useEffect(() => {
    if (ticketId) {
      loadTicket();
      loadComments();
      loadPrograms();
      loadSubtasks();
      subscribeToComments();
    }
  }, [ticketId]);

  useEffect(() => {
    if (ticket) {
      loadProject();
    }
  }, [ticket]);

  const loadProject = async () => {
    if (!ticket?.project_id) return;
    try {
      const data = await projectService.getById(ticket.project_id);
      setProject(data);
    } catch (error) {
      console.error("Error loading project", error);
    }
  };

  const loadTicket = async () => {
    try {
      const data = await ticketService.getById(ticketId);
      setTicket(data);
    } catch (error) {
      console.error('Error loading ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const data = await commentService.getByTicket(ticketId);
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const loadPrograms = async () => {
    try {
      const data = await programService.getByTicketId(ticketId);
      setPrograms(data);
    } catch (error) {
      console.error('Error loading programs:', error);
    }
  };

  const loadSubtasks = async () => {
    try {
      const data = await subtaskService.getByTicketId(ticketId);
      setSubtasks(data);
    } catch (error) {
      console.error('Error loading subtasks:', error);
    }
  };

  const subscribeToComments = () => {
    const subscription = supabase
      .channel(`ticket_comments_${ticketId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `ticket_id=eq.${ticketId}`
      }, () => {
        loadComments();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleStatusChange = async (newStatus: Ticket['status']) => {
    if (!ticket) return;

    try {
      const updated = await ticketService.updateStatus(ticket.id, newStatus);
      setTicket(updated);
      if (onUpdate) onUpdate(updated);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleQaStatusChange = async (newQaStatus: string) => {
    if (!ticket) return;
    try {
      const updated = await ticketService.update(ticket.id, { qa_status: newQaStatus as any });
      setTicket(updated);
      if (onUpdate) onUpdate(updated);
    } catch (error) {
      console.error('Error updating QA status:', error);
    }
  };

  const handleQaNotesChange = async (newNotes: string) => {
    if (!ticket) return;
    try {
      const updated = await ticketService.update(ticket.id, { qa_notes: newNotes });
      setTicket(updated);
      if (onUpdate) onUpdate(updated);
    } catch (error) {
      console.error('Error updating QA notes:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !ticketId) return;

    setSubmittingComment(true);
    try {
      await commentService.create({
        ticket_id: ticketId,
        user_name: user?.name || user?.email || 'Usuario',
        content: newComment
      });
      setNewComment('');
      loadComments();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!ticket) return;

    confirmAction({
      message: '¿Estás seguro de que deseas eliminar este ticket?',
      onConfirm: async () => {
        try {
          await ticketService.delete(ticket.id);
          if (onDelete) onDelete(ticket.id);
        } catch (error) {
          console.error('Error deleting ticket:', error);
          toast.error('Error al eliminar el ticket, por favor intente nuevamente');
        }
      }
    });
  };

  const handleAddProgram = async () => {
    if (!ticketId || !newProgram.object_name || !newProgram.object_type) return;

    setAddingProgram(true);
    try {
      await programService.create({
        ticket_id: ticketId,
        ...newProgram
      });
      setNewProgram({
        object_name: '',
        object_type: '',
        attribute: '',
        description: ''
      });
      loadPrograms();
      if (ticket && onUpdate) onUpdate(ticket);
    } catch (error) {
      console.error('Error adding program:', error);
    } finally {
      setAddingProgram(false);
    }
  };

  const handleDeleteProgram = async (id: string) => {
    confirmAction({
      message: '¿Estás seguro de que deseas eliminar este programa?',
      onConfirm: async () => {
        // Optimistic update
        setPrograms(prev => prev.filter(p => p.id !== id));

        try {
          await programService.delete(id);
          if (ticket && onUpdate) onUpdate(ticket);
        } catch (error) {
          console.error('Error deleting program:', error);
          toast.error('Error al eliminar el programa');
          loadPrograms(); // Re-fetch to sync
        }
      }
    });
  };

  const handleAddSubtask = async () => {
    if (!ticketId || !newSubtask.trim()) return;

    setAddingSubtask(true);
    try {
      await subtaskService.create({
        ticket_id: ticketId,
        title: newSubtask.trim()
      });
      setNewSubtask('');
      loadSubtasks();
    } catch (error) {
      console.error('Error adding subtask:', error);
    } finally {
      setAddingSubtask(false);
    }
  };

  const handleToggleSubtask = async (subtask: Subtask) => {
    try {
      await subtaskService.updateStatus(subtask.id, !subtask.is_completed);
      loadSubtasks(); // Refresh to ensure sync, or optimist update
    } catch (error) {
      console.error('Error updating subtask:', error);
    }
  };

  const handleDeleteSubtask = async (id: string) => {
    confirmAction({
      message: '¿Estás seguro de que deseas eliminar esta subtarea?',
      onConfirm: async () => {
        // Optimistic update
        setSubtasks(prev => prev.filter(t => t.id !== id));

        try {
          await subtaskService.delete(id);
        } catch (error) {
          console.error('Error deleting subtask:', error);
          toast.error('Error al eliminar la subtarea');
          loadSubtasks(); // Re-fetch
        }
      }
    });
  };

  const handleDownloadAttachment = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
      // Fallback to opening in new tab if fetch fails
      window.open(url, '_blank');
    }
  };

  const handleDeleteAttachment = async (attachmentIndex: number) => {
    if (!ticket) return;

    confirmAction({
      message: '¿Estás seguro de que deseas eliminar este archivo adjunto?',
      onConfirm: async () => {
        try {
          if (!ticket.attachments) return;
          const attachment = ticket.attachments[attachmentIndex];

          const urlObj = new URL(attachment.url);
          const pathParts = urlObj.pathname.split('/ticket-attachments/');
          if (pathParts.length > 1) {
            const filePath = decodeURIComponent(pathParts[1]);
            await storageService.deleteFile(filePath);
          }

          const newAttachments = (ticket.attachments || []).filter((_, index) => index !== attachmentIndex);
          const updatedTicket = await ticketService.update(ticket.id, { attachments: newAttachments });
          setTicket(updatedTicket);
          if (onUpdate) onUpdate(updatedTicket);

        } catch (error) {
          console.error('Error deleting attachment:', error);
          toast.error("Error al eliminar el archivo adjunto");
        }
      }
    });
  };


  const handleGeneratePass = async () => {
    if (!ticket) return;
    try {
      await documentService.generateProductionPass(ticket, subtasks, programs, project);
    } catch (error) {
      console.error("Error generating pass:", error);
      console.error("Error generating pass:", error);
      toast.error("Error al generar el pase a producción");
    }
  };


  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !ticket) return;

    const file = e.target.files[0];
    setUploading(true);
    try {
      const { url } = await storageService.uploadFile(file, ticket.project_id, ticket.id);

      const newAttachment = {
        name: file.name,
        url: url,
        size: file.size,
        type: file.type
      };

      const currentAttachments = ticket.attachments || [];
      const newAttachments = [...currentAttachments, newAttachment];

      const updatedTicket = await ticketService.update(ticket.id, { attachments: newAttachments });
      setTicket(updatedTicket);
      if (onUpdate) onUpdate(updatedTicket);
    } catch (error) {
      console.error('Error uploading file:', error);
      console.error('Error uploading file:', error);
      toast.error('Error al subir el archivo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-gray-600">Ticket not found</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 relative">
      <div className="flex-none px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-gray-400 dark:text-slate-500">#{ticket.id.slice(0, 8)}</span>
            <StatusBadge status={ticket.status} />
          </div>
          <div className="flex items-center gap-1">
            {!user?.client_id && (
              <>
                {(ticket.status === 'completed' || ticket.status === 'done' || ticket.status === 'approved') && (
                  <button
                    onClick={handleGeneratePass}
                    className="p-2 text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-colors"
                    title="Generar Pase a Producción"
                  >
                    <FileText size={16} />
                  </button>
                )}
                <button
                  onClick={handleDeleteTicket}
                  className="p-2 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                  title="Eliminar Ticket"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
            <button onClick={onClose} className="p-2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 mr-4">
          <input
            type="text"
            value={ticket.subject || ''}
            onChange={(e) => setTicket({ ...ticket, subject: e.target.value })}
            onBlur={() => handleUpdateTicket({ subject: ticket.subject })}
            className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-snug w-full border-none focus:ring-0 p-0 bg-transparent placeholder-gray-400 dark:placeholder-slate-600 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
            placeholder="Sin Asunto"
            disabled={!!user?.client_id}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

        {/* Client Approval Workflow */}
        {user?.role === 'guest' && ticket.status === 'pending_approval' && (
          <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/30 rounded-xl p-6 shadow-sm mb-6 animate-in slide-in-from-top-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                <CheckSquare size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Aprobación de Entregable</h3>
                <p className="text-gray-600 dark:text-slate-400 text-sm mb-4">
                  El equipo ha marcado este ticket como listo para revisión.
                  Por favor revisa el trabajo y confirma si cumple con tus requerimientos.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleStatusChange('approved')}
                    className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm hover:shadow active:scale-95 transform transition-transform"
                  >
                    Aprobar Trabajo
                  </button>
                  <button
                    onClick={() => {
                      // Set status back to ongoing and focus comment
                      handleStatusChange('ongoing');
                      // Ideally focus comment box here
                      document.querySelector('textarea[placeholder="Escribe un comentario..."]')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-4 py-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-medium border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors hover:border-gray-300 dark:hover:border-slate-600"
                  >
                    Solicitar Cambios
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <ModernSelect
                label="Estado"
                options={[
                  { value: 'pending_analysis', label: 'Análisis Pendiente' },
                  { value: 'pending_approval', label: 'Aprobación Pendiente' },
                  { value: 'approved', label: 'Aprobado' },
                  { value: 'ongoing', label: 'En Desarrollo' },
                  { value: 'completed', label: 'Completado' },
                  { value: 'cancelled', label: 'Cancelado' }
                ]}
                value={ticket.status}
                onChange={(val) => handleStatusChange(val as any)}
                renderValue={(val) => <StatusBadge status={val as any} />}
                disabled={!!user?.client_id}
              />
            </div>
            <div>
              <ModernSelect
                label="Prioridad"
                options={[
                  { value: 'low', label: 'Baja', color: 'bg-gray-500' },
                  { value: 'medium', label: 'Media', color: 'bg-blue-500' },
                  { value: 'high', label: 'Alta', color: 'bg-orange-500' },
                  { value: 'urgent', label: 'Urgente', color: 'bg-red-500' }
                ]}
                value={ticket.urgency}
                onChange={(val) => handleUpdateTicket({ urgency: val as any })}
                renderValue={(val) => {
                  const colors: Record<string, string> = {
                    low: 'bg-gray-100 text-gray-700',
                    medium: 'bg-blue-100 text-blue-700',
                    high: 'bg-orange-100 text-orange-700',
                    urgent: 'bg-red-100 text-red-700'
                  };
                  const labels: Record<string, string> = {
                    low: 'Baja', medium: 'Media', high: 'Alta', urgent: 'Urgente'
                  };
                  return (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[val] || 'bg-gray-100'}`}>
                      {labels[val] || val}
                    </span>
                  );
                }}
                disabled={!!user?.client_id}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <ModernSelect
                label="Asignado a"
                options={[
                  { value: '', label: 'Sin asignar' },
                  ...users.map(u => ({
                    value: u.id,
                    label: u.name,
                    icon: (
                      <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                    )
                  }))
                ]}
                value={ticket.assigned_to || ''}
                onChange={(val) => handleUpdateTicket({ assigned_to: val || null })}
                renderValue={(val, option) => (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700">
                      {option?.label ? option.label.charAt(0).toUpperCase() : '?'}
                    </div>
                    <span className="text-sm">{option?.label || 'Sin asignar'}</span>
                  </div>
                )}
                disabled={!!user?.client_id}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Fecha límite</label>
              <div className="relative">
                <input
                  type="date"
                  value={ticket.deadline ? new Date(ticket.deadline).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleUpdateTicket({ deadline: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  className="w-full text-sm font-medium text-gray-900 dark:text-white bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2 transition-all hover:bg-gray-50 dark:hover:bg-slate-900 disabled:opacity-60 disabled:bg-gray-50 dark:disabled:bg-slate-950 disabled:cursor-not-allowed"
                  style={{ colorScheme: 'dark' }}
                  disabled={!!user?.client_id}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Etiquetas</label>
              <div className="relative">
                <Tag size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={ticket.tags ? ticket.tags.join(', ') : ''}
                  onChange={(e) => {
                    const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean); // Keep logic but typing might be annoying
                    // Better interaction: just let them type string and parse on blur
                    setTicket({ ...ticket, tags: e.target.value.split(',').map(s => s.trim()) });
                  }}
                  onBlur={() => handleUpdateTicket({ tags: ticket.tags?.filter(Boolean) })}
                  className="w-full pl-9 pr-3 py-2 text-sm font-medium text-gray-900 dark:text-white bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:bg-gray-50 dark:hover:bg-slate-900 disabled:opacity-60 disabled:bg-gray-50 dark:disabled:bg-slate-950 disabled:cursor-not-allowed"
                  placeholder="Ej: bug, frontend (separado por comas)"
                  disabled={!!user?.client_id}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50/50 dark:bg-slate-800/20 rounded-xl border border-gray-200 dark:border-slate-800 p-4 transition-all focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-md text-indigo-600 dark:text-indigo-400">
              <FileText size={16} />
            </div>
            Descripción
          </h3>
          <textarea
            value={ticket.description || ''}
            onChange={(e) => setTicket({ ...ticket, description: e.target.value })}
            onBlur={() => handleUpdateTicket({ description: ticket.description })}
            className="w-full bg-transparent border-none p-0 text-sm text-gray-700 dark:text-slate-300 leading-relaxed min-h-[120px] focus:ring-0 placeholder-gray-400 dark:placeholder-slate-600 resize-y disabled:opacity-75 disabled:cursor-not-allowed"
            placeholder="Añade una descripción detallada..."
            disabled={!!user?.client_id}
          />
        </div>



        {/* Subtasks Section */}
        <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CheckSquare size={16} className="text-gray-500 dark:text-slate-400" />
              Subtareas
            </h3>
            <span className="text-xs font-medium text-gray-500 dark:text-slate-400 bg-gray-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {subtasks.filter(t => t.is_completed).length}/{subtasks.length}
            </span>
          </div>

          <div className="p-4 space-y-2">
            {subtasks.map(task => (
              <div key={task.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 dark:hover:bg-slate-800/50 rounded-lg group transition-colors -mx-2">
                <input
                  type="checkbox"
                  checked={task.is_completed}
                  onChange={() => handleToggleSubtask(task)}
                  className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-gray-300 dark:border-slate-700 focus:ring-indigo-500 cursor-pointer"
                  disabled={!!user?.client_id}
                />
                <span className={`flex-1 text-sm ${task.is_completed ? 'text-gray-400 dark:text-slate-500 line-through' : 'text-gray-700 dark:text-slate-300'}`}>
                  {task.title}
                </span>
                {!user?.client_id && (
                  <button
                    onClick={() => handleDeleteSubtask(task.id)}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Eliminar subtarea"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            {subtasks.length === 0 && (
              <div className="text-center py-6 text-gray-400 text-sm">
                No hay subtareas pendientes
              </div>
            )}

            {user?.role !== 'guest' && (
              <div className="flex gap-2 pt-2 mt-2 border-t border-gray-100 dark:border-slate-800">
                <input
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                  placeholder="Agregar nueva subtarea..."
                  className="flex-1 text-sm border-none bg-gray-50 dark:bg-slate-950 rounded-md py-2 px-3 focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-600"
                  disabled={addingSubtask}
                />
                <button
                  onClick={handleAddSubtask}
                  disabled={addingSubtask || !newSubtask.trim()}
                  className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:text-indigo-700 dark:hover:text-indigo-300 px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {addingSubtask ? '...' : <Plus size={16} />}
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Tag size={14} className="text-gray-400 dark:text-slate-500" />
              Programas ({programs.length})
            </h3>
          </div>

          {programs.length > 0 ? (
            <div className="space-y-2">
              {programs.map(p => (
                <div key={p.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-md p-3 text-sm hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors flex justify-between items-start group">
                  <div>
                    <div className="font-mono text-indigo-600 dark:text-indigo-400 font-medium text-xs mb-1">{p.object_name}</div>
                    <div className="text-gray-600 dark:text-slate-400">{p.description}</div>
                  </div>
                  {!user?.client_id && (
                    <button
                      onClick={() => handleDeleteProgram(p.id)}
                      className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Eliminar programa"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 dark:text-slate-600 italic">No hay programas asociados.</p>
          )}

          {!user?.client_id && (
            <div className="mt-3">
              {!addingProgram ? (
                <button
                  onClick={() => setAddingProgram(true)}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Plus size={12} /> Agregar Programa
                </button>
              ) : (
                <div className=" grid grid-cols-2 w-full gap-2 bg-gray-50 dark:bg-slate-950 p-3 rounded-md border border-gray-200 dark:border-slate-800 space-y-2">
                  <input
                    className="w-full ps-3 border h-8 text-xs bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded"
                    placeholder="Objeto"
                    value={newProgram.object_name}
                    onChange={e => setNewProgram({ ...newProgram, object_name: e.target.value })}
                  />
                  <input
                    className="w-full ps-3 border h-8 text-xs bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded"
                    placeholder="Tipo"
                    value={newProgram.object_type}
                    onChange={e => setNewProgram({ ...newProgram, object_type: e.target.value })}
                  />
                  <input
                    className="w-full ps-3 col-span-2 border h-8 text-xs bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded"
                    placeholder="Descripción"
                    value={newProgram.description}
                    onChange={e => setNewProgram({ ...newProgram, description: e.target.value })}
                  />
                  <div className="flex col-span-2 gap-2 justify-end  ">
                    <button onClick={() => setAddingProgram(false)} className="text-xs text-gray-500 dark:text-slate-500">Cancelar</button>
                    <button onClick={handleAddProgram} className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Guardar</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Paperclip size={14} className="text-gray-400 dark:text-slate-500" />
              Archivos
            </h3>
            {!user?.client_id && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 disabled:opacity-50 disabled:cursor-wait"
              >
                {uploading ? (
                  <span className="animate-pulse">Subiendo...</span>
                ) : (
                  <><Plus size={12} /> Subir</>
                )}
              </button>
            )}
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
          </div>

          {ticket.attachments && ticket.attachments.length > 0 ? (
            <div className="space-y-2">
              {ticket.attachments.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg group hover:border-indigo-300 transition-colors">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Paperclip size={14} className="text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                      <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleDownloadAttachment(file.url, file.name)} className="p-1.5 text-gray-400 hover:text-indigo-600"><Download size={14} /></button>
                    {!user?.client_id && (
                      <button onClick={() => handleDeleteAttachment(idx)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 border-2 border-dashed border-gray-100 rounded-lg">
              <p className="text-xs text-gray-400">No hay archivos adjuntos</p>
            </div>
          )}
        </div>

        <div className="pb-4">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={16} className="text-gray-500" />
            <h3 className="text-sm font-bold text-gray-900">Comentarios</h3>
          </div>

          <div className="space-y-6 mb-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-4 group">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
                  {comment.user_name[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-900">{comment.user_name}</span>
                    <span className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleDateString()} {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl text-sm text-gray-700 leading-relaxed border border-gray-100 group-hover:border-indigo-100 transition-colors">
                    {comment.content}
                  </div>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm italic bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                No hay actividad reciente
              </div>
            )}
          </div>

          <div className="flex gap-3 items-start bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold flex-shrink-0">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="flex-1 space-y-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                placeholder="Escribe un comentario..."
                className="w-full bg-transparent border-0 border-b border-gray-200 p-0 pb-2 text-sm focus:ring-0 focus:border-indigo-500 placeholder-gray-400 resize-none min-h-[40px]"
              />
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-400 hidden md:inline">Presiona Enter para enviar</span>
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || submittingComment}
                  className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                >
                  {submittingComment ? 'Enviando...' : 'Comentar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
}

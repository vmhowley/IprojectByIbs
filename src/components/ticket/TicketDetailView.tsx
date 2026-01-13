import { Calendar, CheckSquare, Download, Edit, FileText, MessageSquare, Paperclip, Plus, Tag, Trash2, X } from 'lucide-react';
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
import { getUserById, getUsers } from '../../services/usersService';
import { Comment, Project, Subtask, Ticket, TicketProgram, UserProfile } from '../../types';
import { confirmAction } from '../../utils/confirmationToast';
import { Select } from '../ui/Select';
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
  const [assignedUser, setAssignedUser] = useState<string | null>(null);
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
      loadUser();
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

  const loadUser = async () => {
    if (!ticket?.assigned_to) {
      setAssignedUser('Sin asignar');
      setLoading(false);
      return;
    }

    try {
      const data = await getUserById(ticket.assigned_to);
      if (data) {
        setAssignedUser(data.name);
      } else {
        setAssignedUser('Desconocido');
      }
    } catch (error) {
      console.error('Error loading assigned user:', error);
      setAssignedUser('Error');
    } finally {
      setLoading(false);
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
    // Debouncing could be good here, but for simplicity we update on blur or a explicit save button if needed. 
    // For now, let's assume we update state locally and handle save on blur?
    // Or just direct update to keep it simple with atomic updates
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

  const statusOptions = [
    { value: 'pending_analysis', label: 'pendiente de análisis' },
    { value: 'pending_approval', label: 'pendiente de aprobación' },
    { value: 'approved', label: 'aprobado' },
    { value: 'ongoing', label: 'en desarrollo' },
    { value: 'completed', label: 'completado' }
  ];

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="flex-none px-6 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-gray-400">#{ticket.id.slice(0, 8)}</span>
            <StatusBadge status={ticket.status} />
          </div>
          <div className="flex items-center gap-1">
            {user?.role !== 'guest' && (
              <>
                {(ticket.status === 'completed' || ticket.status === 'done' || ticket.status === 'approved') && (
                  <button
                    onClick={handleGeneratePass}
                    className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-full transition-colors"
                    title="Generar Pase a Producción"
                  >
                    <FileText size={16} />
                  </button>
                )}
                <button
                  onClick={handleDeleteTicket}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="Eliminar Ticket"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
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
            className="text-lg font-bold text-gray-900 leading-snug w-full border-none focus:ring-0 p-0 bg-transparent placeholder-gray-400"
            placeholder="Sin Asunto"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Estado</label>
              <Select
                options={statusOptions}
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value as Ticket['status'])}
                disabled={user?.role === 'guest'}
                className="bg-gray-50 border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Prioridad</label>
              <div className="py-2">
                <Select
                  options={[
                    { value: 'low', label: 'Baja' },
                    { value: 'medium', label: 'Media' },
                    { value: 'high', label: 'Alta' },
                    { value: 'urgent', label: 'Urgente' }
                  ]}
                  value={ticket.urgency}
                  onChange={(e) => handleUpdateTicket({ urgency: e.target.value as any })}
                  className="text-xs h-8 py-0 pl-2 pr-6 border-gray-200 w-full"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Asignado a</label>
              <div className="py-1.5">
                <Select
                  options={[
                    { value: '', label: 'Sin asignar' },
                    ...users.map(u => ({ value: u.id, label: u.name }))
                  ]}
                  value={ticket.assigned_to || ''}
                  onChange={(e) => handleUpdateTicket({ assigned_to: e.target.value || null })}
                  className="text-sm h-8 py-0 pl-2 pr-6 border-gray-200 w-full"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Creado</label>
              <div className="flex items-center gap-2 py-1.5 text-sm text-gray-600">
                <Calendar size={14} className="text-gray-400" />
                <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Edit size={14} className="text-gray-400" />
            Descripción
          </h3>
          <textarea
            value={ticket.description || ''}
            onChange={(e) => setTicket({ ...ticket, description: e.target.value })}
            onBlur={() => handleUpdateTicket({ description: ticket.description })}
            className="w-full bg-gray-50 rounded-lg p-4 border border-gray-100 text-sm text-gray-700 leading-relaxed min-h-[100px] focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            placeholder="No hay descripción disponible para este ticket."
          />
        </div>



        {/* Subtasks Section */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
            <CheckSquare size={14} className="text-gray-400" />
            Subtareas
          </h3>

          <div className="space-y-2 mb-3">
            {subtasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg group transition-colors">
                <input
                  type="checkbox"
                  checked={task.is_completed}
                  onChange={() => handleToggleSubtask(task)}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                  disabled={user?.role === 'guest'}
                />
                <span className={`flex-1 text-sm ${task.is_completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  {task.title}
                </span>
                {user?.role !== 'guest' && (
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
              <p className="text-xs text-gray-400 italic px-2">No hay subtareas.</p>
            )}
          </div>

          {user?.role !== 'guest' && (
            <div className="flex gap-2">
              <input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                placeholder="Nueva subtarea..."
                className="flex-1 text-sm border border-gray-400 rounded-md py-1.5 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={addingSubtask}
              />
              <button
                onClick={handleAddSubtask}
                disabled={addingSubtask || !newSubtask.trim()}
                className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
              >
                {addingSubtask ? '...' : <Plus size={16} />}
              </button>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Tag size={14} className="text-gray-400" />
              Programas ({programs.length})
            </h3>
          </div>

          {programs.length > 0 ? (
            <div className="space-y-2">
              {programs.map(p => (
                <div key={p.id} className="bg-white border border-gray-200 rounded-md p-3 text-sm hover:border-indigo-300 transition-colors flex justify-between items-start group">
                  <div>
                    <div className="font-mono text-indigo-600 font-medium text-xs mb-1">{p.object_name}</div>
                    <div className="text-gray-600">{p.description}</div>
                  </div>
                  {user?.role !== 'guest' && (
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
            <p className="text-xs text-gray-400 italic">No hay programas asociados.</p>
          )}

          {user?.role !== 'guest' && (
            <div className="mt-3">
              {!addingProgram ? (
                <button
                  onClick={() => setAddingProgram(true)}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Plus size={12} /> Agregar Programa
                </button>
              ) : (
                <div className=" grid grid-cols-2 w-full gap-2 bg-gray-50 p-3 rounded-md border border-gray-200 space-y-2">
                  <input
                    className="w-full ps-3 border h-8 text-xs border-gray-300 rounded"
                    placeholder="Objeto"
                    value={newProgram.object_name}
                    onChange={e => setNewProgram({ ...newProgram, object_name: e.target.value })}
                  />
                  <input
                    className="w-full ps-3 border h-8 text-xs border-gray-300 rounded"
                    placeholder="Tipo"
                    value={newProgram.object_type}
                    onChange={e => setNewProgram({ ...newProgram, object_type: e.target.value })}
                  />
                  <input
                    className="w-full ps-3 col-span-2 border h-8 text-xs border-gray-300 rounded"
                    placeholder="Descripción"
                    value={newProgram.description}
                    onChange={e => setNewProgram({ ...newProgram, description: e.target.value })}
                  />
                  <div className="flex col-span-2 gap-2 justify-end  ">
                    <button onClick={() => setAddingProgram(false)} className="text-xs text-gray-500">Cancelar</button>
                    <button onClick={handleAddProgram} className="text-xs font-medium text-indigo-600">Guardar</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Paperclip size={14} className="text-gray-400" />
              Archivos
            </h3>
            {user?.role !== 'guest' && (
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
                    {user?.role !== 'guest' && (
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
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare size={14} className="text-gray-400" />
            Comentarios
          </h3>

          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1">
                  {comment.user_name[0].toUpperCase()}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold text-gray-900">{comment.user_name}</span>
                    <span className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg rounded-tl-none leading-relaxed">
                    {comment.content}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 sticky bottom-0 bg-white pt-2">
            <div className="relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe un comentario..."
                className="w-full text-sm border-gray-200 rounded-lg pl-3 pr-10 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none min-h-[50px]"
                rows={2}
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || submittingComment}
                className="absolute right-2 bottom-2 text-indigo-600 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed p-1.5"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

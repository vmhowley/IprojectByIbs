import { Calendar, Download, Edit, MessageSquare, Paperclip, Plus, Tag, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { commentService } from '../../services/commentService';
import { programService } from '../../services/programService';
import { storageService } from '../../services/storageService';
import { ticketService } from '../../services/ticketService';
import { getUserById } from '../../services/usersService';
import { Comment, Ticket, TicketProgram } from '../../types';
import { Select } from '../ui/Select';
import { StatusBadge } from '../ui/StatusBadge';
import { UrgencyBadge } from '../ui/UrgencyBadge';

interface TicketDetailViewProps {
  ticketId: string;
  onClose?: () => void;
  onDelete?: (id: string) => void;
  onUpdate?: (ticket: Ticket) => void;
}

export function TicketDetailView({ ticketId, onClose, onDelete, onUpdate }: TicketDetailViewProps) {
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [assignedUser, setAssignedUser] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (ticketId) {
      loadTicket();
      loadComments();
      loadPrograms();
      subscribeToComments();
    }
  }, [ticketId]);

  useEffect(() => {
    if (ticket) {
      loadUser();
    }
  }, [ticket]);

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
    if (!ticket || !confirm('¿Estás seguro de que deseas eliminar este ticket?')) return;

    try {
      await ticketService.delete(ticket.id);
      if (onDelete) onDelete(ticket.id);
    } catch (error) {
      console.error('Error deleting ticket:', error);
    }
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
    if (!confirm('¿Estás seguro de que deseas eliminar este programa?')) return;
    try {
      await programService.delete(id);
      loadPrograms();
      if (ticket && onUpdate) onUpdate(ticket);
    } catch (error) {
      console.error('Error deleting program:', error);
    }
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
    if (!ticket || !confirm('¿Estás seguro de que deseas eliminar este archivo adjunto?')) return;

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
      alert('Error al eliminar el archivo adjunto');
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
      alert('Error al subir el archivo');
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
        <h1 className="text-lg font-bold text-gray-900 leading-snug">
          {ticket.subject || 'Sin Asunto'}
        </h1>
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
                <UrgencyBadge urgency={ticket.urgency} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Asignado a</label>
              <div className="flex items-center gap-2 py-1.5">
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                  {assignedUser ? assignedUser.charAt(0).toUpperCase() : '?'}
                </div>
                <span className="text-sm font-medium text-gray-700 truncate">{assignedUser || 'Sin asignar'}</span>
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
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words overflow-hidden">
            {ticket.description || 'No hay descripción disponible para este ticket.'}
          </div>
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
                <div className="bg-gray-50 p-3 rounded-md border border-gray-200 space-y-2">
                  <input
                    className="w-full text-xs border-gray-300 rounded"
                    placeholder="Nombre Objeto"
                    value={newProgram.object_name}
                    onChange={e => setNewProgram({ ...newProgram, object_name: e.target.value })}
                  />
                  <input
                    className="w-full text-xs border-gray-300 rounded"
                    placeholder="Tipo"
                    value={newProgram.object_type}
                    onChange={e => setNewProgram({ ...newProgram, object_type: e.target.value })}
                  />
                  <div className="flex justify-end gap-2">
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

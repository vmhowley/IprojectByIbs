import { useEffect, useState, useRef } from 'react';
import { ChevronRight, Calendar, User, Tag, AlertCircle, Trash2, Edit, Paperclip, Download, Plus, MessageSquare, Clock, X } from 'lucide-react';
import { Ticket, Comment, TicketProgram } from '../../types';
import { ticketService } from '../../services/ticketService';
import { commentService } from '../../services/commentService';
import { programService } from '../../services/programService';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { StatusBadge } from '../ui/StatusBadge';
import { UrgencyBadge } from '../ui/UrgencyBadge';
import { supabase } from '../../lib/supabase';
import { storageService } from '../../services/storageService';

interface TicketDetailViewProps {
  ticketId: string;
  onClose?: () => void;
  onDelete?: () => void;
  onUpdate?: (ticket: Ticket) => void;
}

export function TicketDetailView({ ticketId, onClose, onDelete, onUpdate }: TicketDetailViewProps) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
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
        user_name: 'Guest User',
        content: newComment
      });
      setNewComment('');
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
      if (onDelete) onDelete();
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
      // Programs are related to ticket but don't change ticket fields directly unless we track count or last update
      // However, user might want to see update timestamp change if we updated that on ticket
      // For now, let's assume we might want to refresh ticket if needed, but programs are separate table.
      // If we want to trigger update on main list (e.g. if we showed program count), we would need to fetch ticket again or just call onUpdate with current ticket
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
      const attachment = ticket.attachments[attachmentIndex];
      
      // 1. Delete from storage
      // Extract path from URL or use the stored path if available. 
      // Assuming the URL structure or that we need to store the path.
      // For now, let's try to extract it or use the path if we had it.
      // Looking at storageService, it returns { url, path }. Ticket attachment type has { name, url, size, type }.
      // We might need to guess the path or update the type to store it.
      // However, storageService.deleteFile expects a path.
      // Let's assume we can derive it or we should have stored it.
      // If we don't have the path, we can't easily delete from storage without parsing the URL.
      // Let's try to parse the URL to get the path relative to the bucket.
      // URL format: .../storage/v1/object/public/ticket-attachments/projectId/ticketId/filename
      
      const urlObj = new URL(attachment.url);
      const pathParts = urlObj.pathname.split('/ticket-attachments/');
      if (pathParts.length > 1) {
        const filePath = decodeURIComponent(pathParts[1]);
        await storageService.deleteFile(filePath);
      }

      // 2. Update ticket
      const newAttachments = ticket.attachments.filter((_, index) => index !== attachmentIndex);
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
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto">
      <div className="p-6">
        {onClose && (
          <div className="flex justify-end mb-4">
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {ticket.subject || 'No Subject'}
                    </h1>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                      {ticket.id}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      Created {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                    <UrgencyBadge urgency={ticket.urgency} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Edit size={16} />
                  </Button>
                  <Button variant="danger" size="sm" onClick={handleDeleteTicket}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Descripción</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {ticket.description || 'No description provided.'}
                </p>
              </div>

              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Programas Modificados/Creados</h3>
                
                {programs.length > 0 && (
                  <div className="overflow-x-auto mb-4">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Objeto</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Atributo</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {programs.map((program) => (
                          <tr key={program.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{program.object_name}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{program.object_type}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{program.attribute}</td>
                            <td className="px-3 py-2 text-sm text-gray-500">{program.description}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                              <button onClick={() => handleDeleteProgram(program.id)} className="text-red-400 hover:text-red-600 transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Agregar Objetos</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="Nombre del Objeto"
                      className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={newProgram.object_name}
                      onChange={(e) => setNewProgram({ ...newProgram, object_name: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Tipo (e.g., Tabla, Clase)"
                      className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={newProgram.object_type}
                      onChange={(e) => setNewProgram({ ...newProgram, object_type: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Atributo"
                      className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={newProgram.attribute}
                      onChange={(e) => setNewProgram({ ...newProgram, attribute: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Descripción"
                      className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={newProgram.description}
                      onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      size="sm" 
                      onClick={handleAddProgram}
                      disabled={!newProgram.object_name || !newProgram.object_type || addingProgram}
                      className="flex items-center gap-2"
                    >
                      <Plus size={16} />
                      {addingProgram ? 'agregando...' : 'Agregar Programa'}
                    </Button>
                  </div>
                </div>
              </div>

              {ticket.attachments && ticket.attachments.length > 0 && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Paperclip className="w-4 h-4" />
                      Archivos ({ticket.attachments.length})
                    </h3>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Plus size={14} className="mr-1" />
                      {uploading ? 'Subiendo...' : 'Agregar'}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {ticket.attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors group"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <a 
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-gray-900 truncate hover:text-blue-600 hover:underline block"
                            >
                              {attachment.name}
                            </a>
                            <p className="text-xs text-gray-500">
                              {(attachment.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleDownloadAttachment(attachment.url, attachment.name)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAttachment(index)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!ticket.attachments || ticket.attachments.length === 0) && (
                 <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Paperclip className="w-4 h-4" />
                      Archivos (0)
                    </h3>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Plus size={14} className="mr-1" />
                      {uploading ? 'Uploading...' : 'Add'}
                    </Button>
                  </div>
                 </div>
              )}
              
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  Comentarios ({comments.length})
                </h3>

                <div className="space-y-6 mb-6">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4 group">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0">
                        {comment.user_name[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-2xl rounded-tl-none px-4 py-3 border border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-900">
                              {comment.user_name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <Textarea
                    placeholder="Agregar un comentario..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || submittingComment}
                    className="flex items-center gap-2"
                  >
                    <MessageSquare size={16} />
                    {submittingComment ? 'agregando...' : 'Agregar Comentario'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Detalles</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-2">
                    Estado
                  </label>
                  <Select
                    options={statusOptions}
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(e.target.value as Ticket['status'])}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 flex items-center gap-2 mb-2">
                    <User size={14} />
                    Asignado a
                  </label>
                  <p className="text-sm text-gray-900">
                    {ticket.assigned_to || 'Sin asignar'}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 flex items-center gap-2 mb-2">
                    <Calendar size={14} />
                    Creado
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </p>
                </div>

                {ticket.deadline && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 flex items-center gap-2 mb-2">
                      <AlertCircle size={14} />
                      Fecha límite
                    </label>
                    <p className="text-sm text-gray-900">
                      {new Date(ticket.deadline).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {ticket.tags && ticket.tags.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 flex items-center gap-2 mb-2">
                      <Tag size={14} />
                      Etiquetas
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {ticket.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

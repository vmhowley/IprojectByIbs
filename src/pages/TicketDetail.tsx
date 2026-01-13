import { AlertCircle, Calendar, ChevronRight, Clock, Download, Edit, Paperclip, Plus, Tag, Trash2, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Textarea } from '../components/ui/Textarea';
import NProgress from '../lib/nprogress';
import { supabase } from '../lib/supabase';
import { commentService } from '../services/commentService';
import { programService } from '../services/programService';
import { ticketService } from '../services/ticketService';
import { getUsers } from '../services/usersService';
import { Comment, Ticket, TicketProgram, UserProfile } from '../types';

import { confirmAction } from '../utils/confirmationToast';


export function TicketDetail() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
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
  const [users, setUsers] = useState<UserProfile[]>([]);

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
      subscribeToComments();
    }
  }, [ticketId]);



  const loadTicket = async () => {
    try {
      NProgress.start();
      const data = await ticketService.getById(ticketId!);
      setTicket(data);
    } catch (error) {
      console.error('Error loading ticket:', error);
    } finally {
      setLoading(false);
      NProgress.done();
    }
  };


  const loadComments = async () => {
    try {
      const data = await commentService.getByTicket(ticketId!);
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const loadPrograms = async () => {
    try {
      const data = await programService.getByTicketId(ticketId!);
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
    if (!ticket) return;

    confirmAction({
      message: '¿Estás seguro de que deseas eliminar este ticket?',
      onConfirm: async () => {
        try {
          await ticketService.delete(ticket.id);
          navigate(`/project/${ticket.project_id}`);
        } catch (error) {
          console.error('Error deleting ticket:', error);
          toast.error('Error al eliminar el ticket');
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
        } catch (error) {
          console.error('Error deleting program:', error);
          toast.error('Error al eliminar el programa');
          loadPrograms();
        }
      }
    });
  };

  if (loading) {
    return null;
  }


  if (!ticket) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ticket no encontrado</h2>
          <p className="text-gray-500 mb-6">
            Es posible que el ticket haya sido eliminado o no tengas permisos para verlo.
          </p>
          <button onClick={() => navigate(-1)} className="text-blue-600 hover:text-blue-800 font-medium">
            Volver
          </button>
        </div>
      </div>
    );
  }



  const statusOptions = [
    { value: 'todo', label: 'Por hacer' },
    { value: 'in_progress', label: 'En Progreso' },
    { value: 'done', label: 'Hecho' }
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link to="/" className="hover:text-gray-900">Proyectos</Link>
          <ChevronRight size={16} />
          <Link to={`/project/${ticket.project_id}`} className="hover:text-gray-900">
            Proyecto
          </Link>
          <ChevronRight size={16} />
          <span className="text-gray-900 font-medium">{ticket.ticket_number}</span>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <Card>
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={ticket.subject || ''}
                        onChange={(e) => setTicket({ ...ticket, subject: e.target.value })}
                        onBlur={() => handleUpdateTicket({ subject: ticket.subject })}
                        className="text-2xl font-bold text-gray-900 w-full border-none focus:ring-0 p-0"
                        placeholder="Sin Asunto"
                      />
                    </div>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                      {ticket.ticket_number}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      Creado {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                    <Select
                      options={[
                        { value: 'low', label: 'Baja' },
                        { value: 'medium', label: 'Media' },
                        { value: 'high', label: 'Alta' },
                        { value: 'urgent', label: 'Urgente' }
                      ]}
                      value={ticket.urgency}
                      onChange={(e) => handleUpdateTicket({ urgency: e.target.value as any })}
                      className="text-xs h-6 py-0 pl-2 pr-6 border-gray-200"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button variant="ghost" size="sm">
                    <Edit size={16} />
                  </button>
                  <button variant="danger" size="sm" onClick={handleDeleteTicket}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Descripción</h3>
                <Textarea
                  value={ticket.description || ''}
                  onChange={(e) => setTicket({ ...ticket, description: e.target.value })}
                  onBlur={() => handleUpdateTicket({ description: ticket.description })}
                  className="w-full text-sm text-gray-600 min-h-[100px]"
                  placeholder="Agregar una descripción..."
                />
              </div>

              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Programas Modificados/Creados</h3>

                {programs.length > 0 && (
                  <div className="overflow-x-auto mb-4">
                    <table className="min-w-full divide-y divide-gray-200">
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
                          <tr key={program.id}>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{program.object_name}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{program.object_type}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{program.attribute}</td>
                            <td className="px-3 py-2 text-sm text-gray-500">{program.description}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                              <button onClick={() => handleDeleteProgram(program.id)} className="text-red-600 hover:text-red-900">
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
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Agregar Programa</h4>
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
                      placeholder="Tipo (ej. Tabla, Clase)"
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
                    <button
                      size="sm"
                      onClick={handleAddProgram}
                      disabled={!newProgram.object_name || !newProgram.object_type || addingProgram}
                      className="flex items-center gap-2"
                    >
                      <Plus size={16} />
                      {addingProgram ? 'Agregando...' : 'Agregar Programa'}
                    </button>
                  </div>
                </div>
              </div>

              {ticket.attachments && ticket.attachments.length > 0 && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Attachments ({ticket.attachments.length})
                  </h3>
                  <div className="space-y-2">
                    {ticket.attachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors group"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600">
                              {attachment.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(attachment.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <Download className="w-4 h-4 text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
                      </a>
                    ))}
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
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || submittingComment}
                  >
                    {submittingComment ? 'Agregando...' : 'Agregar Comentario'}
                  </button>
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
                  <Select
                    options={[
                      { value: '', label: 'Sin asignar' },
                      ...users.map(u => ({ value: u.id, label: u.name }))
                    ]}
                    value={ticket.assigned_to || ''}
                    onChange={(e) => handleUpdateTicket({ assigned_to: e.target.value || null })}
                  />
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

                <div>
                  <label className="text-xs font-medium text-gray-600 flex items-center gap-2 mb-2">
                    <AlertCircle size={14} />
                    Fecha límite
                  </label>
                  <input
                    type="date"
                    value={ticket.deadline ? new Date(ticket.deadline).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleUpdateTicket({ deadline: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 w-full"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 flex items-center gap-2 mb-2">
                    <Tag size={14} />
                    Etiquetas (separadas por coma)
                  </label>
                  <input
                    type="text"
                    value={ticket.tags ? ticket.tags.join(', ') : ''}
                    onChange={(e) => {
                      const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                      setTicket({ ...ticket, tags });
                    }}
                    onBlur={() => handleUpdateTicket({ tags: ticket.tags })}
                    className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 w-full"
                    placeholder="Ej: bug, frontend, urgente"
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

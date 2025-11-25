import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Star, Search, MoreHorizontal, LayoutGrid, MessageSquare } from 'lucide-react';
import { Ticket, Project, Attachment, Comment } from '../types';
import { ticketService } from '../services/ticketService';
import { projectService } from '../services/projectService';
import { storageService } from '../services/storageService';
import { StatusBadge } from '../components/ui/StatusBadge';
import { UrgencyBadge } from '../components/ui/UrgencyBadge';
import { RequestTypeBadge } from '../components/ui/RequestTypeBadge';
import { NewTicketModal, TicketFormData } from '../components/ticket/NewTicketModal';
import { supabase } from '../lib/supabase';
import {  Paperclip, Download } from 'lucide-react';
import {commentService} from '../services/commentService'
export function ProjectDetail() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState<Comment[]>()
  useEffect(() => {
    if (projectId) {
      loadData();
    }
    
  }, [projectId]);

  const loadData = async () => {
    try {
 
      const projectData = await projectService.getById(projectId!);
      setProject(projectData);

      const ticketsData = await ticketService.getByProject(projectData.id);
      setTickets(ticketsData);

      const subscription = supabase
        .channel(`project_tickets_${projectId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `project_id=eq.${projectId}`
        }, () => {
          ticketService.getByProject(projectId!).then(setTickets);
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleSubmit =  () => {
    commentService.create({
      ticket_id: selectedTicket?.id,
      user_name:'Santos',
      content: comment
    })
    navigate(0)
    
  }
  const handleSelection =async (ticket:Ticket) => {
    try {
        setSelectedTicket(ticket)
            const commentarios = await commentService.getByTicket(ticket?.id) 
            console.log("🚀 ~ loadComments ~ commentarios:", commentarios)
      setComments(commentarios);
    } catch (error) {
      console.error('Error loading Comments:', error);
    } finally {
      setLoading(false);
    }
  };

  

  const handleCreateTicket = async (ticketData: TicketFormData) => {
    try {
      const newTicket:Ticket = await ticketService.create({
        project_id: projectId!,
        description: ticketData.description || '',
        status: ticketData.status,
        urgency: ticketData.urgency,
        client: ticketData.client,
        contact: ticketData.contact,
        subject: ticketData.subject,
        request_type: ticketData.request_type,
      });

      if (ticketData.files && ticketData.files.length > 0) {
        const attachments: Attachment[] = [];

        for (const file of ticketData.files) {
          const { url } = await storageService.uploadFile(file, projectId!, newTicket.id);
          attachments.push({
            name: file.name,
            url,
            size: file.size,
            type: file.type
          });
        }

        await ticketService.update(newTicket.id, { attachments });
      }

      await loadData();
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-600">Project not found</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <LayoutGrid size={16} className="text-purple-600" />
              <span className="text-sm font-medium">{project.name}</span>
            </div>
            <Star size={16} className="text-yellow-500 fill-yellow-500" />
          </div>

          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
              Share
            </button>
            <button className="p-1.5 text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
              <MoreHorizontal size={18} />
            </button>
            <button
              onClick={() => setIsNewTicketModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors"
            >
              <Plus size={16} />
              New feature
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 px-6">
          <button className="px-4 py-2 text-sm font-medium text-gray-900 border-b-2 border-purple-600">
            Table
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-2">
            Tasks

          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="mb-4">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Find feature"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="grid grid-cols-[auto_1fr_120px_140px_140px_100px] gap-4 px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600">
                <div>Asunto</div>
                <div></div>
                <div>Tipo</div>
                <div>Progreso</div>
                <div>Prioridad</div>
                <div>Asignado a</div>
              </div>

              <div className="divide-y divide-gray-100">
                {tickets.map((ticket) => {
                  const isCompleted = ticket.status === 'completed' || ticket.status === 'done';
                  return (
                    <div
                      key={ticket.id}
                      onClick={() => handleSelection(ticket)}
                      className={`grid grid-cols-[auto_1fr_120px_140px_140px_100px] gap-4 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedTicket?.id === ticket.id ? 'bg-purple-50' : ''
                      }`}
                    >
                      <div className="flex items-center">
                        {isCompleted ? (
                          <div className="w-5 h-5 rounded bg-purple-600 flex items-center justify-center">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded border-2 border-gray-300"></div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900">{ticket.subject}</span>
                        {ticket.comment_count > 0 && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <MessageSquare size={14} />
                            <span className="text-xs">{ticket.comment_count}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center">
                        {ticket.request_type && (
                          <RequestTypeBadge type={ticket.request_type} />
                        )}
                      </div>

                      <div className="flex items-center">
                        <StatusBadge status={ticket.status} />
                      </div>

                      <div className="flex items-center">
                        <UrgencyBadge urgency={ticket.urgency} />
                      </div>

                      <div className="flex items-center gap-1">
                        {ticket.assigned_to ? (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-medium">
                            {ticket.assigned_to[0].toUpperCase()}
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-200"></div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {selectedTicket && (
          <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-semibold text-gray-900">Properties</h3>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-2">Progreso</label>
                  <StatusBadge status={selectedTicket.status} />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-2">Tipo</label>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-5 h-5 bg-gray-900 rounded capitalize flex items-center justify-center text-white text-xs">
                      {selectedTicket.request_type?.substring(0,1)}
                    </div>
                    <span>{selectedTicket.request_type || 'API Documentation'}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-2">Asignado a</label>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-white text-xs font-medium">
                      {selectedTicket.assigned_to?.substring(0,1)}
                    </div>
                    <span>{selectedTicket.assigned_to || '-'}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-2">Prioridad</label>
                  <UrgencyBadge urgency={selectedTicket.urgency} />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-2">Departamento</label>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-5 h-5 bg-gray-900 rounded"></div>
                    <span>{selectedTicket.department || '-'}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-2">Fecha Creacion</label>
                  <div className="flex items-center gap-2 text-sm">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-600">
                      <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M2 6h12M5 2v2M11 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span>{new Date(selectedTicket.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-2">Fecha de finalizacion</label>
                  <div className="flex items-center gap-2 text-sm">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-600">
                      <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M2 6h12M5 2v2M11 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span>{selectedTicket.deadline ? new Date(selectedTicket.deadline).toLocaleDateString('es-ES', { month: 'long', day: 'numeric', year: 'numeric' }) : '----'}</span>
                  </div>
                </div>

                {selectedTicket.tags && selectedTicket.tags.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-2">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedTicket.tags.map((tag, index) => {
                        const colors = [
                          'bg-blue-100 text-blue-700',
                          'bg-red-100 text-red-700',
                          'bg-green-100 text-green-700'
                        ];
                        return (
                          <span
                            key={index}
                            className={`px-2 py-1 text-xs font-medium rounded ${colors[index % colors.length]}`}
                          >
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <div className="space-y-2">
                  {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Attachments ({selectedTicket.attachments.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedTicket.attachments.map((attachment, index) => (
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

                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-3">Discucion</label>
                  <div className="space-y-3">
                    {comments?.map((comment, index)=> (
                      
                    <div key={index} className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex-shrink-0"></div>
                      <div>
                        <div className="text-xs font-medium text-gray-900">{comment.user_name}</div>
                        <p className="text-xs text-gray-600 mt-1">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                    ))}
              
                  </div>
                </div>

                <div>
                  <form onSubmit={handleSubmit}>
                  <textarea
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write a comment"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={3}
                  />
                  <button type='submit'>Enviar</button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isNewTicketModalOpen && (
        <NewTicketModal
          projectId={project.id}
          projectName={project.name}
          onClose={() => setIsNewTicketModalOpen(false)}
          onSubmit={handleCreateTicket}
        />
      )}
    </div>
  );
}


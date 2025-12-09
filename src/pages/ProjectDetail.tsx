import { Activity, Edit, LayoutGrid, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EditProjectModal } from '../components/project/EditProjectModal';
import { ProjectTimeline } from '../components/project/ProjectTimeline';
import { ShareProjectModal } from '../components/project/ShareProjectModal';
import { NewTicketModal } from '../components/ticket/NewTicketModal';
import { TicketDetailView } from '../components/ticket/TicketDetailView';
import { RequestTypeBadge } from '../components/ui/RequestTypeBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { UrgencyBadge } from '../components/ui/UrgencyBadge';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { commentService } from '../services/commentService';
import { projectService } from '../services/projectService';
import { storageService } from '../services/storageService';
import { ticketService } from '../services/ticketService';
import { getUsers } from '../services/usersService';
import { Attachment, Comment, Project, Ticket, UserProfile } from '../types';

export function ProjectDetail() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [viewMode, setViewMode] = useState<'properties' | 'full_detail'>('properties');
  const [activeTab, setActiveTab] = useState<'tickets' | 'timeline'>('tickets');
  const [loading, setLoading] = useState(true);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState<Comment[]>()
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (projectId) {
      loadData();
      loadUsers();
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

  const loadUsers = async () => {
    try {
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedTicket) return;

    commentService.create({
      ticket_id: selectedTicket?.id,
      user_name: 'Santos',
      content: comment
    }).then(() => {
      setComment('');
      // Reload comments
      commentService.getByTicket(selectedTicket.id).then(setComments);
    })
  }

  const handleSelection = async (ticket: Ticket) => {
    try {
      setSelectedTicket(ticket)
      setViewMode('properties');
      const commentarios = await commentService.getByTicket(ticket?.id)
      setComments(commentarios);
    } catch (error) {
      console.error('Error loading Comments:', error);
    }
  };

  const handleProjectUpdated = (updatedProject: Project) => {
    setProject(updatedProject);
    // Timeline updates automatically due to re-render
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Proyecto no encontrado</h2>
        <button
          onClick={() => navigate('/')}
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Volver al panel
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="text-gray-500 hover:text-gray-700 font-medium"
              >
                Proyectos
              </button>
              <span className="text-gray-300">/</span>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {project.description || 'Sin descripción'}
                </p>
              </div>
              <StatusBadge status={project.status} />
            </div>
            <div className="flex items-center gap-3">
              {(user?.id === project.created_by || user?.role === 'admin') && (
                <button
                  onClick={() => setIsEditProjectModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
              )}

              <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Compartir
              </button>
              {user?.role !== 'guest' && (
                <button onClick={() => setIsNewTicketModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
                  <Plus className="w-4 h-4" />
                  Nuevo Ticket
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-6 mt-6 border-b border-gray-100">
            <button
              onClick={() => setActiveTab('tickets')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'tickets'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4" />
                Tickets ({tickets.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'timeline'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Actividad
              </div>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          {activeTab === 'tickets' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => handleSelection(ticket)}
                    className={`bg-white p-4 rounded-xl border cursor-pointer hover:shadow-md transition-shadow ${selectedTicket?.id === ticket.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-200'
                      }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-xs font-medium text-gray-500">#{ticket.id.slice(0, 8)}</span>
                      <UrgencyBadge urgency={ticket.urgency} />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{ticket.subject}</h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                      {ticket.description}
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <StatusBadge status={ticket.status} />
                      <RequestTypeBadge type={ticket.request_type || 'feature_request'} />
                    </div>
                    {ticket.assigned_to && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs text-gray-600 font-medium">
                          {users.find(u => u.id === ticket.assigned_to)?.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs text-gray-500">
                          {users.find(u => u.id === ticket.assigned_to)?.name}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                {user?.role !== 'guest' && (
                  <div
                    onClick={() => setIsNewTicketModalOpen(true)}
                    className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-500 hover:text-indigo-500 cursor-pointer transition-colors min-h-[200px]"
                  >
                    <Plus className="w-8 h-8 mb-2" />
                    <span className="font-medium">Crear nuevo ticket</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Timeline View */
            <div className="max-w-3xl mx-auto">
              <ProjectTimeline projectId={project.id} />
            </div>
          )}
        </main>
      </div>

      {/* Right Sidebar - Using TicketDetailView with correct props */}
      {selectedTicket && activeTab === 'tickets' && (
        <div className="w-96 border-l border-gray-200 bg-white overflow-hidden flex flex-col shadow-xl z-10">
          <TicketDetailView
            ticketId={selectedTicket.id} // Correct prop
            onClose={() => setSelectedTicket(null)}
            onUpdate={(updated) => {
              setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
              if (selectedTicket?.id === updated.id) setSelectedTicket(updated);
              // Also refresh comments if needed, but TicketDetailView handles its own comments
            }}
            onDelete={(deletedId) => {
              setTickets(prev => prev.filter(t => t.id !== deletedId));
              setSelectedTicket(null);
            }}
          />
        </div>
      )}

      {/* Modals */}
      {isNewTicketModalOpen && (
        <NewTicketModal
          projectId={project.id}
          projectName={project.name}
          clientId={project.client_id}
          contactId={project.contact_id}
          onClose={() => setIsNewTicketModalOpen(false)}
          onSubmit={async (data) => {
            try {
              // 1. Separate files from other data
              const { files, ...ticketData } = data;

              // 2. Create the ticket (without files field)
              // Sanitize UUID fields: convert empty strings to null or undefined
              const sanitizedData = {
                ...ticketData,
                client_id: ticketData.client_id || null,
                contact_id: ticketData.contact_id || null,
                assigned_to: ticketData.assigned_to || null,
                project_id: project.id
              };

              const newTicket = await ticketService.create(sanitizedData);

              // 3. Handle file uploads if any
              if (files && files.length > 0) {
                const attachments: Attachment[] = [];

                for (const file of files) {
                  const { url } = await storageService.uploadFile(file, project.id, newTicket.id);
                  attachments.push({
                    name: file.name,
                    url,
                    size: file.size,
                    type: file.type
                  });
                }

                // 4. Update ticket with attachments
                await ticketService.update(newTicket.id, { attachments });
              }

              setIsNewTicketModalOpen(false);
              const ticketsData = await ticketService.getByProject(project.id);
              setTickets(ticketsData);
            } catch (error) {
              console.error('Error creating ticket:', error);
            }
          }}
        />
      )}

      {isShareModalOpen && (
        <ShareProjectModal
          projectId={project.id}
          projectName={project.name}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}

      {project && (
        <EditProjectModal
          isOpen={isEditProjectModalOpen}
          onClose={() => setIsEditProjectModalOpen(false)}
          project={project}
          onProjectUpdated={handleProjectUpdated}
        />
      )}
    </div>
  );
}

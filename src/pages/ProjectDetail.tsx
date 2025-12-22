import { Activity, Edit, LayoutGrid, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { EditProjectModal } from '../components/project/EditProjectModal';
import { ProjectTimeline } from '../components/project/ProjectTimeline';
import { ShareProjectModal } from '../components/project/ShareProjectModal';
import { NewTicketModal } from '../components/ticket/NewTicketModal';
import { TicketBoardCard } from '../components/ticket/TicketBoardCard';
import { TicketDetailView } from '../components/ticket/TicketDetailView';
import { RequestTypeBadge } from '../components/ui/RequestTypeBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { UrgencyBadge } from '../components/ui/UrgencyBadge';
import { ViewSwitcher, ViewType } from '../components/ui/ViewSwitcher';
import { BoardView } from '../components/views/BoardView';
import { TableView } from '../components/views/TableView';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { projectService } from '../services/projectService';
import { storageService } from '../services/storageService';
import { ticketService } from '../services/ticketService';
import { getUsers } from '../services/usersService';
import { Attachment, Project, Ticket, UserProfile } from '../types';
import { confirmAction } from '../utils/confirmationToast';

export function ProjectDetail() {

  const { user } = useAuth();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  // Removed unused viewMode state
  const [activeTab, setActiveTab] = useState<'tickets' | 'timeline'>('tickets');
  const [loading, setLoading] = useState(true);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  // Removed unused comment state
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



  const handleSelection = async (ticket: Ticket) => {
    try {
      setSelectedTicket(ticket)
      setSelectedTicket(ticket)
      // Comments fetch removed as it was unused in this component state
    } catch (error) {
      console.error('Error loading Comments:', error);
    }
  };

  const handleProjectUpdated = (updatedProject: Project) => {
    setProject(updatedProject);
    // Timeline updates automatically due to re-render
  }

  const handleDeleteProject = async () => {
    if (!project) return;

    confirmAction({
      message: '¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        try {
          await projectService.delete(project.id);
          // Force sidebar refresh
          window.dispatchEvent(new Event('project-deleted'));
          navigate('/');
        } catch (error) {
          console.error('Error deleting project:', error);
          toast.error('Error al eliminar el proyecto');
        }
      },
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    });
  };

  // State for view mode
  const [viewMode, setViewMode] = useState<ViewType>('list'); // Default to list/grid

  // ... (existing effects)

  const renderTickets = () => {
    if (viewMode === 'board') {
      const columns = [
        {
          id: 'pending',
          title: 'Pendiente',
          items: tickets.filter(t => ['pending_analysis', 'pending_approval'].includes(t.status)),
        },
        {
          id: 'approved',
          title: 'Aprobado',
          items: tickets.filter(t => t.status === 'approved'),
        },
        {
          id: 'ongoing',
          title: 'En Desarrollo',
          items: tickets.filter(t => t.status === 'ongoing'),
        },
        {
          id: 'completed',
          title: 'Completado',
          items: tickets.filter(t => t.status === 'completed'),
        },
      ];

      return (
        <BoardView
          columns={columns}
          renderItem={(ticket) => (
            <TicketBoardCard
              key={ticket.id}
              ticket={ticket}
              user={users.find(u => u.id === ticket.assigned_to)}
              onClick={() => handleSelection(ticket)}
              isSelected={selectedTicket?.id === ticket.id}
            />
          )}
        />
      );
    }

    if (viewMode === 'table') {
      return (
        <TableView
          data={tickets}
          onRowClick={(ticket) => handleSelection(ticket)}
          columns={[
            { header: 'ID', accessorKey: 'id', cell: (t) => <span className="font-mono text-xs text-gray-500">#{t.id.slice(0, 8)}</span> },
            { header: 'Asunto', accessorKey: 'subject', className: 'font-medium text-gray-900' },
            { header: 'Estado', cell: (t) => <StatusBadge status={t.status} /> },
            { header: 'Prioridad', cell: (t) => <UrgencyBadge urgency={t.urgency} /> },
            { header: 'Asignado', cell: (t) => users.find(u => u.id === t.assigned_to)?.name || '-' },
            { header: 'Creado', cell: (t) => new Date(t.created_at).toLocaleDateString() }
          ]}
        />
      );
    }

    // Default Grid/List View
    return (
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
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // ... (rest of render logic, headers)

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{project?.name}</h1>
                  <StatusBadge status={project?.status || 'active'} />
                </div>
                {project?.description && (
                  <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Compartir proyecto"
              >
                <Plus className="w-5 h-5" />
              </button>

              {user?.role !== 'guest' && (
                <>
                  <button
                    onClick={() => setIsEditProjectModalOpen(true)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar proyecto"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleDeleteProject}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar proyecto"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between mt-6 border-b border-gray-100">
            <div className="flex items-center gap-6">
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

            {activeTab === 'tickets' && (
              <div className="mb-2 mr-2">
                <ViewSwitcher currentView={viewMode} onViewChange={setViewMode} />
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          {activeTab === 'tickets' ? (
            renderTickets()
          ) : (
            /* Timeline View */
            <div className="max-w-3xl mx-auto">
              <ProjectTimeline projectId={project?.id} />
            </div>
          )}
        </main>
      </div>

      {/* Right Sidebar - Using TicketDetailView with correct props */}
      {
        selectedTicket && activeTab === 'tickets' && (
          <div className="w-96 border-l border-gray-200 bg-white overflow-hidden flex flex-col shadow-xl z-10">
            <TicketDetailView
              ticketId={selectedTicket.id}
              onClose={() => setSelectedTicket(null)}
              onUpdate={(updated) => {
                setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
                if (selectedTicket?.id === updated.id) setSelectedTicket(updated);

              }}
              onDelete={(deletedId) => {
                setTickets(prev => prev.filter(t => t.id !== deletedId));
                setSelectedTicket(null);
              }}
            />
          </div>
        )
      }


      {/* Modals */}
      {
        isNewTicketModalOpen && (
          <NewTicketModal
            projectId={project!.id}
            projectName={project!.name}
            clientId={project!.client_id}
            contactId={project!.contact_id}
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
                  project_id: project!.id
                };

                const newTicket = await ticketService.create(sanitizedData);

                // 3. Handle file uploads if any
                if (files && files.length > 0) {
                  const attachments: Attachment[] = [];

                  for (const file of files) {
                    const { url } = await storageService.uploadFile(file, project!.id, newTicket.id);
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
                const ticketsData = await ticketService.getByProject(project!.id);
                setTickets(ticketsData);
              } catch (error) {
                console.error('Error creating ticket:', error);
              }
            }}
          />
        )
      }

      {
        isShareModalOpen && (
          <ShareProjectModal
            projectId={project.id}
            projectName={project.name}
            onClose={() => setIsShareModalOpen(false)}
          />
        )
      }

      {
        project && (
          <EditProjectModal
            isOpen={isEditProjectModalOpen}
            onClose={() => setIsEditProjectModalOpen(false)}
            project={project}
            onProjectUpdated={handleProjectUpdated}
          />
        )
      }
    </div>
  );
}

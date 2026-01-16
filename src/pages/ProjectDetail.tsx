import { Activity, Book, Edit, ExternalLink, FileIcon, FileText, Filter, LayoutGrid, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { UploadDocModal } from '../components/documentation/UploadDocModal';
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
import NProgress from '../lib/nprogress';
import { supabase } from '../lib/supabase';
import { documentationService } from '../services/documentationService';
import { projectService } from '../services/projectService';
import { storageService } from '../services/storageService';
import { ticketService } from '../services/ticketService';
import { getUsers } from '../services/usersService';
import { Attachment, Project, Ticket, UserProfile } from '../types';
import { ProjectDocument } from '../types/Project';

import { confirmAction } from '../utils/confirmationToast';


export function ProjectDetail() {

  const { user } = useAuth();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  // Removed unused viewMode state
  const [activeTab, setActiveTab] = useState<'tickets' | 'timeline' | 'files' | 'docs'>('tickets');
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [isUploadDocModalOpen, setIsUploadDocModalOpen] = useState(false);
  // Removed unused comment state
  const [users, setUsers] = useState<UserProfile[]>([]);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    status: 'all',
    urgency: 'all',
    assignee: 'all'
  });




  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ((ticket.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.description || '').toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = activeFilters.status === 'all' || ticket.status === activeFilters.status;
    const matchesUrgency = activeFilters.urgency === 'all' || ticket.urgency === activeFilters.urgency;
    const matchesAssignee = activeFilters.assignee === 'all' || ticket.assigned_to === activeFilters.assignee;

    return matchesSearch && matchesStatus && matchesUrgency && matchesAssignee;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setActiveFilters({
      status: 'all',
      urgency: 'all',
      assignee: 'all'
    });
  };

  useEffect(() => {
    if (projectId) {
      loadData();
      loadUsers();
    }
  }, [projectId]);

  const loadData = async () => {
    try {
      NProgress.start();
      const projectData = await projectService.getById(projectId!);
      setProject(projectData);

      const ticketsData = await ticketService.getByProject(projectData.id);
      setTickets(ticketsData);

      const docsData = await documentationService.getByProject(projectId!);
      setDocuments(docsData);

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
      NProgress.done();
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length || !project) return;

    const file = e.target.files[0];
    // Reset input value so same file can be selected again if needed
    e.target.value = '';

    const toastId = toast.loading('Subiendo archivo...');

    try {
      const { url } = await storageService.uploadFile(file, project.id);

      const newAttachment: Attachment = {
        name: file.name,
        url,
        size: file.size,
        type: file.type
      };

      // 1. Optimistic Update
      const optimisticAttachments = [...(project.attachments || []), newAttachment];
      const optimisticProject = { ...project, attachments: optimisticAttachments };
      setProject(optimisticProject);

      // 2. Persist to DB
      const updatedProject = await projectService.update(project.id, {
        attachments: optimisticAttachments
      });

      // 3. Verify Persistence
      if (!updatedProject.attachments || updatedProject.attachments.length !== optimisticAttachments.length) {
        console.warn('Backend returned project without new attachments. Possible schema mismatch.');
        // We might want to keep the optimistic state or revert. 
        // For now, let's trust the backend response but log warning.
        // If DB column is missing, updatedProject won't have it, so we might lose it on reload.
        // Let's force set it from local state if missing to keep UI consistent until reload, 
        // but warn user.
        if (!updatedProject.attachments) {
          toast.error('Advertencia: No se pudo verificar el guardado. Compruebe la migración de la base de datos.', { id: toastId, duration: 5000 });
          // Revert or keep? Keeping helpful for "viewing" but misleading for storage.
          // Let's keep valid URL so at least they can see it this session.
          setProject({ ...updatedProject, attachments: optimisticAttachments });
          return;
        }
      }

      setProject(updatedProject);
      toast.success('Archivo subido correctamente', { id: toastId });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      // Revert optimistic update (implicit by not calling setProject with success)
      // But we already set it! We need to revert.
      // Fetch fresh project
      const freshProject = await projectService.getById(project.id);
      setProject(freshProject);

      toast.error('Error al subir el archivo: ' + (error.message || 'Error desconocido'), { id: toastId });
    }
  };

  const handleDeleteFile = async (attachment: Attachment) => {
    if (!project) return;

    if (!confirm(`¿Estás seguro de eliminar el archivo "${attachment.name}"?`)) return;

    try {
      // Extract path from URL or use a stored path property if added later. 
      // For now, let's just attempt to remove from DB array, deletion from Storage 
      // requires the path which we might need to derive or store.
      // Current storageService returns path, but we storing only URL in Attachment type usually?
      // Check Attachment type... it has name, url, size, type. 
      // To delete from storage we need the path.
      // Re-deriving path from URL depends on structure.
      // For this MVP, let's just remove reference from DB.

      const updatedAttachments = (project.attachments || []).filter(a => a.url !== attachment.url);

      const updatedProject = await projectService.update(project.id, {
        attachments: updatedAttachments
      });

      setProject(updatedProject);
      toast.success('Archivo eliminado');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Error al eliminar el archivo');
    }
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
          items: filteredTickets.filter(t => ['pending_analysis', 'pending_approval'].includes(t.status)),
        },
        {
          id: 'approved',
          title: 'Aprobado',
          items: filteredTickets.filter(t => t.status === 'approved'),
        },
        {
          id: 'ongoing',
          title: 'En Desarrollo',
          items: filteredTickets.filter(t => t.status === 'ongoing'),
        },
        {
          id: 'completed',
          title: 'Completado',
          items: filteredTickets.filter(t => t.status === 'completed'),
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
          data={filteredTickets}
          onRowClick={(ticket) => handleSelection(ticket)}
          columns={[
            { header: 'ID', accessorKey: 'id', cell: (t) => <span className="font-mono text-xs text-gray-500 dark:text-slate-500">#{t.id.slice(0, 8)}</span> },
            { header: 'Asunto', accessorKey: 'subject', className: 'font-medium text-gray-900 dark:text-white' },
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
        {filteredTickets.map((ticket) => (
          <div
            key={ticket.id}
            onClick={() => handleSelection(ticket)}
            className={`bg-white dark:bg-slate-900 p-4 rounded-xl border cursor-pointer hover:shadow-md transition-shadow ${selectedTicket?.id === ticket.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-200 dark:border-slate-800'
              }`}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 dark:text-slate-500">#{ticket.id.slice(0, 8)}</span>
              <UrgencyBadge urgency={ticket.urgency} />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">{ticket.subject}</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4 line-clamp-2">
              {ticket.description}
            </p>
            <div className="flex items-center justify-between mt-auto">
              <StatusBadge status={ticket.status} />
              <RequestTypeBadge type={ticket.request_type || 'feature_request'} />
            </div>
            {ticket.assigned_to && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-xs text-gray-600 dark:text-slate-400 font-medium">
                  {(() => {
                    const user = users.find(u => u.id === ticket.assigned_to);
                    if (!user) return '?';
                    // If name starts with a letter, use it. Otherwise try email or hardcoded fallback.
                    const initial = user.name.charAt(0).toUpperCase();
                    return /[A-Z]/.test(initial) ? initial : (user.email ? user.email.charAt(0).toUpperCase() : '#');
                  })()}
                </div>
                <span className="text-xs text-gray-500 dark:text-slate-500">
                  {users.find(u => u.id === ticket.assigned_to)?.name}
                </span>
              </div>
            )}
          </div>
        ))}
        {!user?.client_id && (
          <div
            onClick={() => setIsNewTicketModalOpen(true)}
            className="border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 dark:text-slate-600 hover:border-indigo-500 hover:text-indigo-500 cursor-pointer transition-colors min-h-[200px]"
          >
            <Plus className="w-8 h-8 mb-2" />
            <span className="font-medium">Crear nuevo ticket</span>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return null;
  }


  // ... (rest of render logic, headers)

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 py-4">
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
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project?.name}</h1>
                  {project?.use_case_id && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                      {project.use_case_id}
                    </span>
                  )}
                  <StatusBadge status={project?.status || 'active'} />
                </div>
                {project?.description && (
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{project.description}</p>
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

              {!user?.client_id && (
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
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'
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
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Actividad
                </div>
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'files'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <FileIcon className="w-4 h-4" />
                  Archivos ({project?.attachments?.length || 0})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('docs')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'docs'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Book className="w-4 h-4" />
                  Documentación ({documents.length})
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
            <div className="space-y-4">
              {/* Search and Filters Toolbar */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                      value={activeFilters.status}
                      onChange={(e) => setActiveFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 py-2 pl-2 pr-8 text-gray-900 dark:text-white"
                    >
                      <option value="all">Todos los estados</option>
                      <option value="pending_analysis">Análisis Pendiente</option>
                      <option value="pending_approval">Aprobación Pendiente</option>
                      <option value="approved">Aprobado</option>
                      <option value="ongoing">En Desarrollo</option>
                      <option value="completed">Completado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>

                  <select
                    value={activeFilters.urgency}
                    onChange={(e) => setActiveFilters(prev => ({ ...prev, urgency: e.target.value }))}
                    className="text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 py-2 pl-2 pr-8 text-gray-900 dark:text-white"
                  >
                    <option value="all">Todas las prioridades</option>
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>

                  <select
                    value={activeFilters.assignee}
                    onChange={(e) => setActiveFilters(prev => ({ ...prev, assignee: e.target.value }))}
                    className="text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 py-2 pl-2 pr-8 text-gray-900 dark:text-white"
                  >
                    <option value="all">Todos los asignados</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>

                  {(searchQuery || activeFilters.status !== 'all' || activeFilters.urgency !== 'all' || activeFilters.assignee !== 'all') && (
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Limpiar
                    </button>
                  )}
                </div>
              </div>

              {renderTickets()}
            </div>
          ) : activeTab === 'timeline' ? (
            /* Timeline View */
            <div className="max-w-3xl mx-auto">
              <ProjectTimeline projectId={project?.id || ''} />
            </div>
          ) : activeTab === 'docs' ? (
            /* Documentation View */
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Documentación del Proyecto</h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Manuales, guías y documentos técnicos vinculados.</p>
                </div>
                <button
                  onClick={() => setIsUploadDocModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                >
                  <Plus size={18} />
                  Subir Documento
                </button>
              </div>

              {documents.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl p-12 text-center">
                  <Book className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-700 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">No hay documentación vinculada</h3>
                  <p className="text-gray-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
                    Sube manuales o especificaciones técnicas para este proyecto.
                  </p>
                  <button
                    onClick={() => setIsUploadDocModalOpen(true)}
                    className="mt-6 text-indigo-600 font-medium hover:text-indigo-700"
                  >
                    Vincular el primer documento →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md transition-all group">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                          <FileText size={20} />
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => window.open(doc.url, '_blank')}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                          >
                            <ExternalLink size={16} />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('¿Eliminar este documento?')) {
                                await documentationService.delete(doc.id);
                                setDocuments(prev => prev.filter(d => d.id !== doc.id));
                                toast.success('Documento eliminado');
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-1">{doc.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 mb-4">{doc.description}</p>
                      <div className="flex items-center justify-between text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500">
                        <span>{(doc.file_size / 1024 / 1024).toFixed(2)} MB</span>
                        <span className="text-indigo-600 dark:text-indigo-400">{doc.file_type.split('/')[1] || 'FILE'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Files View */
            <div className="max-w-4xl mx-auto">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-gray-50 dark:bg-slate-900/50">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Archivos adjuntos</h3>
                  <div className="relative">
                    <input
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleFileUpload}
                    />
                    <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">
                      <Plus size={16} />
                      Subir archivo
                    </button>
                  </div>
                </div>

                {!project?.attachments || project.attachments.length === 0 ? (
                  <div className="p-12 text-center text-gray-500 dark:text-slate-500">
                    <FileIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-700 mb-3" />
                    <p>No hay archivos adjuntos en este proyecto.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {project.attachments.map((file, index) => (
                      <li key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 flex items-center justify-between group transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <FileIcon size={20} />
                          </div>
                          <div>
                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline">
                              {file.name}
                            </a>
                            <p className="text-xs text-gray-500 dark:text-slate-500">
                              {(file.size / 1024).toFixed(1)} KB • {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteFile(file)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          title="Eliminar archivo"
                        >
                          <Trash2 size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Right Sidebar - Using TicketDetailView with correct props */}
      {
        selectedTicket && activeTab === 'tickets' && (
          <>
            {/* Backdrop for mobile */}
            <div
              className="fixed inset-0 bg-black/20 z-20 lg:hidden"
              onClick={() => setSelectedTicket(null)}
            />
            {/* Panel */}
            <div className="fixed inset-y-0 right-0 w-[90%] md:w-[600px] lg:w-[800px] border-l border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl z-30 transform transition-transform duration-300 ease-in-out flex flex-col">
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
          </>
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
              if (!project) return;
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
        isShareModalOpen && project && (
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

      {isUploadDocModalOpen && (
        <UploadDocModal
          isOpen={isUploadDocModalOpen}
          onClose={() => setIsUploadDocModalOpen(false)}
          onSuccess={() => {
            if (projectId) {
              documentationService.getByProject(projectId).then(setDocuments);
            }
          }}
          initialProjectId={projectId}
        />
      )}
    </div>
  );
}

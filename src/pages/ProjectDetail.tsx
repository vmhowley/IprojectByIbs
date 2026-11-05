import { ArrowLeft, BookOpen, ExternalLink, FileIcon, FileText, History, Paperclip, Pencil, Plus, Search, Trash2, Users, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PermissionGuard } from '../components/auth/PermissionGuard';
import { UploadDocModal } from '../components/documentation/UploadDocModal';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { DocNumber } from '../components/layout/PageHeader';
import { EditProjectModal } from '../components/project/EditProjectModal';
import { ProjectTimeline } from '../components/project/ProjectTimeline';
import { ShareProjectModal } from '../components/project/ShareProjectModal';
import { NewTicketModal } from '../components/ticket/NewTicketModal';
import { TicketBoardCard } from '../components/ticket/TicketBoardCard';
import { TicketDetailView } from '../components/ticket/TicketDetailView';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { confirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Money } from '../components/ui/Money';
import { RequestTypeBadge } from '../components/ui/RequestTypeBadge';
import { Skeleton } from '../components/ui/Skeleton';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Tabs, tabPanelProps } from '../components/ui/Tabs';
import { UrgencyBadge } from '../components/ui/UrgencyBadge';
import { ViewSwitcher, ViewType } from '../components/ui/ViewSwitcher';
import { TableView } from '../components/views/TableView';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { cn } from '../lib/utils';
import NProgress from '../lib/nprogress';
import { supabase } from '../lib/supabase';
import { activityService } from '../services/activityService';
import { contactService } from '../services/contactService';
import { documentationService } from '../services/documentationService';
import { projectService } from '../services/projectService';
import { storageService } from '../services/storageService';
import { ticketService } from '../services/ticketService';
import { getUsers } from '../services/usersService';
import { Attachment, Project, Ticket, UserProfile } from '../types';
import { Contact } from '../types/Client';
import { ProjectDocument } from '../types/Project';
import { fileKind, formatDate, formatFileSize, isFinished, isOverdue, relativeDay } from '../utils/format';
import { formatSequence, normalizeText, ticketSequence, ticketTitle } from '../utils/tickets';
import { errorMessage } from '../utils/errors';

type TabId = 'tickets' | 'timeline' | 'files' | 'docs';

const STATUS_FILTER_OPTIONS = [
  { value: 'open', label: 'Abiertos' },
  { value: 'all', label: 'Todos los estados' },
  { value: 'pending_analysis', label: 'Pendiente de análisis' },
  { value: 'pending_approval', label: 'Pendiente de aprobación' },
  { value: 'approved', label: 'Aprobado' },
  { value: 'ongoing', label: 'En desarrollo' },
  { value: 'completed', label: 'Completado' },
];

const URGENCY_FILTER_OPTIONS = [
  { value: 'all', label: 'Toda prioridad' },
  { value: 'critical', label: 'Crítica' },
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Media' },
  { value: 'low', label: 'Baja' },
];

/** The project sheet: who it is for, what it costs, and every ticket of the scope. */
export function ProjectDetail() {

  const { user } = useAuth();
  const { isAdmin } = usePermissions();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [isUploadDocModalOpen, setIsUploadDocModalOpen] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    status: 'open',
    urgency: 'all',
    assignee: 'all'
  });

  const activeTab = (searchParams.get('tab') as TabId) || 'tickets';
  const viewMode = (searchParams.get('view') as ViewType) || 'list';
  const selectedTicketId = searchParams.get('ticket');
  const readOnly = !!user?.client_id;
  const canSeeMoney = isAdmin();

  const setParams = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    setSearchParams(next, { replace: true });
  };

  const numbers = useMemo(() => {
    const seq = ticketSequence(tickets);
    return new Map([...seq.entries()].map(([id, s]) => [id, formatSequence(s)]));
  }, [tickets]);

  const usersById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const filteredTickets = useMemo(() => {
    const term = normalizeText(searchQuery.trim());
    return tickets.filter(ticket => {
      const matchesSearch = !term || normalizeText(`${ticket.subject || ''} ${ticket.description || ''} ${numbers.get(ticket.id) || ''}`).includes(term);
      const matchesStatus = activeFilters.status === 'all'
        || (activeFilters.status === 'open' ? !isFinished(ticket.status) : ticket.status === activeFilters.status);
      const matchesUrgency = activeFilters.urgency === 'all' || ticket.urgency === activeFilters.urgency;
      const matchesAssignee = activeFilters.assignee === 'all' || ticket.assigned_to === activeFilters.assignee;

      return matchesSearch && matchesStatus && matchesUrgency && matchesAssignee;
    });
  }, [tickets, searchQuery, activeFilters, numbers]);

  const hasFilters = !!searchQuery || activeFilters.status !== 'open' || activeFilters.urgency !== 'all' || activeFilters.assignee !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setActiveFilters({
      status: 'open',
      urgency: 'all',
      assignee: 'all'
    });
  };

  useEffect(() => {
    if (!projectId) return;

    loadData();
    loadUsers();

    // Subscribed here (not in loadData) so the cleanup runs when the project changes
    const channel = supabase
      .channel(`project_tickets_${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tickets',
        filter: `project_id=eq.${projectId}`
      }, () => {
        ticketService.getByProject(projectId).then(setTickets);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  // The client's person for this project, shown next to the client.
  useEffect(() => {
    const contactId = project?.contact_id;
    if (!contactId) {
      setContact(null);
      return;
    }
    contactService.getById(contactId).then(setContact).catch(() => setContact(null));
  }, [project?.contact_id]);

  // The drawer closes with Escape and takes focus when it opens.
  useEffect(() => {
    if (!selectedTicketId) return;
    requestAnimationFrame(() => drawerRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.querySelector('[role="dialog"][aria-modal="true"]')) {
        setParams({ ticket: null });
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [selectedTicketId]);

  const loadData = async () => {
    try {
      NProgress.start();
      const projectData = await projectService.getById(projectId!);
      setProject(projectData);

      // Log view if user is a contact
      activityService.logView(projectData.id).catch(console.error);

      const [ticketsData, docsData] = await Promise.all([
        ticketService.getByProject(projectData.id),
        documentationService.getByProject(projectId!),
      ]);
      setTickets(ticketsData);
      setDocuments(docsData);
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

  const handleSelection = (ticketId: string) => setParams({ ticket: ticketId });

  const handleProjectUpdated = (updatedProject: Project) => {
    setProject(updatedProject);
    // Timeline updates automatically due to re-render
  }

  const handleStatusChange = async (ticketId: string, status: Ticket['status']) => {
    const previous = tickets;
    // Move the slip at once; put it back if the server says no.
    setTickets((list) => list.map((t) => (t.id === ticketId ? { ...t, status } : t)));
    try {
      await ticketService.updateStatus(ticketId, status);
    } catch (error) {
      console.error('Error updating status:', error);
      setTickets(previous);
      toast.error('No se pudo mover el ticket.');
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;

    const ok = await confirmDialog({
      title: 'Eliminar proyecto',
      message: `Se eliminará «${project.name}» con sus ${tickets.length} tickets. Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar proyecto',
    });
    if (!ok) return;
    try {
      await projectService.delete(project.id);
      toast.success('Proyecto eliminado');
      navigate('/projects');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Error al eliminar el proyecto');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length || !project) return;

    const file = e.target.files[0];
    // Reset input value so same file can be selected again if needed
    e.target.value = '';

    const toastId = toast.loading('Subiendo archivo…');
    setUploadingFile(true);

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
      toast.success('Archivo subido', { id: toastId });
    } catch (error) {
      console.error('Error uploading file:', error);
      // Revert optimistic update (implicit by not calling setProject with success)
      // But we already set it! We need to revert.
      // Fetch fresh project
      const freshProject = await projectService.getById(project.id);
      setProject(freshProject);

      toast.error('Error al subir el archivo: ' + errorMessage(error, 'Error desconocido'), { id: toastId });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteFile = async (attachment: Attachment) => {
    if (!project) return;

    const ok = await confirmDialog({
      title: 'Quitar archivo',
      message: `¿Quitar «${attachment.name}» del proyecto?`,
      confirmText: 'Quitar archivo',
    });
    if (!ok) return;

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
      toast.success('Archivo quitado');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Error al eliminar el archivo');
    }
  };

  const handleDeleteDoc = async (doc: ProjectDocument) => {
    const ok = await confirmDialog({
      title: 'Eliminar documento',
      message: `¿Eliminar «${doc.name}» de la documentación?`,
      confirmText: 'Eliminar documento',
    });
    if (!ok) return;
    try {
      await documentationService.delete(doc.id);
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
      toast.success('Documento eliminado');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('No se pudo eliminar el documento.');
    }
  };

  const renderTickets = () => {
    if (filteredTickets.length === 0) {
      return (
        <EmptyState
          icon={FileText}
          title={hasFilters ? 'Ningún ticket coincide' : 'Este proyecto no tiene tickets abiertos'}
          action={
            hasFilters ? (
              <Button variant="secondary" onClick={clearFilters}>Quitar filtros</Button>
            ) : !readOnly ? (
              <Button onClick={() => setIsNewTicketModalOpen(true)}>
                <Plus size={16} aria-hidden="true" />
                Nuevo ticket
              </Button>
            ) : null
          }
        >
          {hasFilters
            ? 'Cambia la búsqueda o muestra todos los estados.'
            : 'Cada pedido del cliente es un ticket: se analiza, el cliente lo aprueba, se desarrolla y se entrega.'}
        </EmptyState>
      );
    }

    if (viewMode === 'board') {
      return (
        <KanbanBoard
          tickets={filteredTickets}
          users={users}
          numbers={numbers}
          selectedId={selectedTicketId}
          readOnly={readOnly}
          onTicketClick={handleSelection}
          onStatusChange={handleStatusChange}
        />
      );
    }

    if (viewMode === 'grid') {
      return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredTickets.map((ticket) => (
            <TicketBoardCard
              key={ticket.id}
              ticket={ticket}
              user={ticket.assigned_to ? usersById.get(ticket.assigned_to) : undefined}
              number={numbers.get(ticket.id)}
              onClick={() => handleSelection(ticket.id)}
              isSelected={selectedTicketId === ticket.id}
            />
          ))}
        </div>
      );
    }

    return (
      <TableView
        caption="Tickets del proyecto"
        data={filteredTickets}
        onRowClick={(ticket) => handleSelection(ticket.id)}
        rowClassName={(ticket) => (ticket.id === selectedTicketId ? 'bg-focus/[0.08]' : undefined)}
        defaultSort={{ index: 0, dir: 'desc' }}
        columns={[
          {
            header: 'N.º',
            className: 'w-px whitespace-nowrap',
            sortValue: (t) => Number(numbers.get(t.id)?.split('/')[0] || 0),
            cell: (t) => <span className="font-mono text-xs font-semibold text-ink-3">{numbers.get(t.id)}</span>,
          },
          {
            header: 'Asunto',
            sortValue: (t) => ticketTitle(t).toLowerCase(),
            cell: (t) => (
              <div className="min-w-[14rem]">
                <button
                  type="button"
                  onClick={() => handleSelection(t.id)}
                  className="text-left font-medium text-ink hover:underline"
                >
                  {ticketTitle(t)}
                </button>
                {t.request_type && <div className="mt-0.5"><RequestTypeBadge type={t.request_type} className="h-auto border-0 bg-transparent px-0 text-xs text-ink-3" /></div>}
              </div>
            ),
          },
          {
            header: 'Estado',
            className: 'w-px whitespace-nowrap',
            sortValue: (t) => ['pending_analysis', 'pending_approval', 'approved', 'ongoing', 'completed', 'done'].indexOf(t.status),
            cell: (t) => <StatusBadge status={t.status} size="sm" />,
          },
          {
            header: 'Prioridad',
            hideBelow: 'md',
            className: 'w-px whitespace-nowrap',
            sortValue: (t) => ({ critical: 0, high: 0, moderate: 1, medium: 1, minor: 2, low: 2 } as Record<string, number>)[t.urgency] ?? 1,
            cell: (t) => <UrgencyBadge urgency={t.urgency} />,
          },
          {
            header: 'Asignado',
            hideBelow: 'lg',
            sortValue: (t) => usersById.get(t.assigned_to || '')?.name?.toLowerCase(),
            cell: (t) => {
              const person = t.assigned_to ? usersById.get(t.assigned_to) : undefined;
              return person ? (
                <span className="flex items-center gap-2 text-[13px] text-ink-2">
                  <Avatar name={person.name} src={person.avatar} size="xs" />
                  <span className="line-clamp-1">{person.name}</span>
                </span>
              ) : <span className="text-[13px] text-ink-3">—</span>;
            },
          },
          {
            header: 'Fecha límite',
            hideBelow: 'sm',
            className: 'w-px whitespace-nowrap',
            sortValue: (t) => t.deadline || '',
            cell: (t) => (
              <span className={cn('text-[13px] tabular-nums', isOverdue(t.deadline, t.status) ? 'font-semibold text-st-red' : 'text-ink-2')}>
                {t.deadline ? formatDate(t.deadline) : '—'}
              </span>
            ),
          },
        ]}
      />
    );
  };

  if (loading) {
    return (
      <div className="space-y-4 px-6 py-6" role="status" aria-label="Cargando proyecto">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-md px-6 py-16">
        <EmptyState icon={FileText} title="No encontramos este proyecto" action={<Button variant="secondary" onClick={() => navigate('/projects')}>Ver proyectos</Button>}>
          Puede que se haya eliminado o que no tengas acceso.
        </EmptyState>
      </div>
    );
  }

  const total = tickets.length;
  const done = tickets.filter((t) => t.status === 'completed' || t.status === 'done').length;
  const openCount = tickets.filter((t) => !isFinished(t.status)).length;
  const late = isOverdue(project.end_date, project.status);
  const assignee = project.assignee ? usersById.get(project.assignee) : undefined;

  const tabs = [
    { id: 'tickets' as const, label: 'Tickets', icon: FileText, count: total },
    { id: 'timeline' as const, label: 'Bitácora', icon: History },
    { id: 'files' as const, label: 'Archivos', icon: Paperclip, count: project.attachments?.length || 0 },
    { id: 'docs' as const, label: 'Documentación', icon: BookOpen, count: documents.length },
  ];

  return (
    <div className="min-h-full">
      {/* Head of the sheet */}
      <header className="border-b border-rule bg-desk px-4 pt-4 sm:px-6 sm:pt-5">
        <Link to="/projects" className="mb-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2 hover:text-ink">
          <ArrowLeft size={14} aria-hidden="true" />
          Proyectos
        </Link>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.01em] text-ink">{project.name}</h1>
              <StatusBadge status={project.status || 'active'} />
            </div>
            <p className="mt-1 text-sm text-ink-2">
              {project.client_id && project.clients?.name ? (
                <Link to={`/clients?client=${project.client_id}`} className="font-medium text-ink hover:underline">
                  {project.clients.name}
                </Link>
              ) : (
                'Sin cliente'
              )}
              {contact && (
                <>
                  <span className="text-ink-3"> · </span>
                  {contact.email ? (
                    <a href={`mailto:${contact.email}`} title={contact.position || 'Contacto del cliente'} className="hover:text-ink hover:underline">
                      {contact.name}
                    </a>
                  ) : (
                    <span title={contact.position || 'Contacto del cliente'}>{contact.name}</span>
                  )}
                </>
              )}
              {project.use_case_id && <span className="font-mono text-ink-3"> · {project.use_case_id}</span>}
            </p>
            {project.description && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-2">{project.description}</p>}
          </div>

          <div className="flex shrink-0 flex-wrap items-start gap-2">
            {!readOnly && (
              <>
                <Button variant="secondary" onClick={() => setIsShareModalOpen(true)}>
                  <Users size={16} aria-hidden="true" />
                  Miembros
                </Button>
                <Button variant="secondary" onClick={() => setIsEditProjectModalOpen(true)}>
                  <Pencil size={15} aria-hidden="true" />
                  Editar
                </Button>
                {/* Only the creator or an admin may delete; the database applies the same rule. */}
                <PermissionGuard action="delete" resource={project}>
                  <Button variant="danger" size="icon" onClick={handleDeleteProject} aria-label="Eliminar proyecto" title="Eliminar proyecto">
                    <Trash2 size={16} />
                  </Button>
                </PermissionGuard>
                <Button onClick={() => setIsNewTicketModalOpen(true)}>
                  <Plus size={16} aria-hidden="true" />
                  Nuevo ticket
                </Button>
              </>
            )}
            {canSeeMoney && (
              <DocNumber
                label="Precio"
                value={<Money amount={project.cost} currency={project.currency} empty="Sin precio" />}
                className="ml-1"
              />
            )}
          </div>
        </div>

        {/* Data of the sheet */}
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-rule py-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
          <div>
            <dt className="caption">Responsable</dt>
            <dd className="mt-1 flex items-center gap-1.5 text-ink">
              {assignee || project.assignee_profile ? (
                <>
                  <Avatar name={assignee?.name || project.assignee_profile?.name} src={assignee?.avatar} size="xs" />
                  <span className="truncate">{assignee?.name || project.assignee_profile?.name}</span>
                </>
              ) : <span className="text-ink-3">Sin asignar</span>}
            </dd>
          </div>
          <div>
            <dt className="caption">Inicio</dt>
            <dd className="mt-1 tabular-nums text-ink">{formatDate(project.start_date) || <span className="text-ink-3">—</span>}</dd>
          </div>
          <div>
            <dt className="caption">Entrega</dt>
            <dd className={cn('mt-1 tabular-nums', late ? 'font-semibold text-st-red' : 'text-ink')}>
              {project.end_date ? <>{formatDate(project.end_date)} <span className="text-xs font-normal text-ink-3">({relativeDay(project.end_date)})</span></> : <span className="text-ink-3">—</span>}
            </dd>
          </div>
          <div>
            <dt className="caption">Prioridad</dt>
            <dd className="mt-1 text-ink">{{ high: 'Alta', medium: 'Media', low: 'Baja' }[project.priority] || '—'}</dd>
          </div>
          <div>
            <dt className="caption">Abiertos</dt>
            <dd className="mt-1 tabular-nums text-ink">{openCount} de {total}</dd>
          </div>
          <div>
            <dt className="caption">Avance</dt>
            <dd className="mt-1.5 flex items-center gap-2">
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-well" aria-hidden="true">
                <span className="block h-full bg-st-green" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
              </span>
              <span className="text-xs tabular-nums text-ink-2">{total ? Math.round((done / total) * 100) : 0}%</span>
            </dd>
          </div>
        </dl>

        <Tabs
          idBase="project"
          label="Secciones del proyecto"
          tabs={tabs}
          active={activeTab}
          onChange={(id) => setParams({ tab: id === 'tickets' ? null : id })}
          className="border-b-0"
        />
      </header>

      {/* Content Area */}
      <div className="px-4 py-5 sm:px-6" {...tabPanelProps('project', activeTab)}>
        {activeTab === 'tickets' ? (
          <div className="space-y-4">
            {/* Search and Filters Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
                <input
                  type="search"
                  aria-label="Buscar tickets"
                  placeholder="Buscar por asunto o número"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="field h-9 pl-8"
                />
              </div>
              <label className="sr-only" htmlFor="filter-status">Estado</label>
              <select id="filter-status" value={activeFilters.status} onChange={(e) => setActiveFilters(prev => ({ ...prev, status: e.target.value }))} className="field h-9 w-auto py-1.5 text-[13px]">
                {STATUS_FILTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <label className="sr-only" htmlFor="filter-urgency">Prioridad</label>
              <select id="filter-urgency" value={activeFilters.urgency} onChange={(e) => setActiveFilters(prev => ({ ...prev, urgency: e.target.value }))} className="field h-9 w-auto py-1.5 text-[13px]">
                {URGENCY_FILTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <label className="sr-only" htmlFor="filter-assignee">Asignado</label>
              <select id="filter-assignee" value={activeFilters.assignee} onChange={(e) => setActiveFilters(prev => ({ ...prev, assignee: e.target.value }))} className="field h-9 w-auto max-w-[12rem] py-1.5 text-[13px]">
                <option value="all">Cualquier persona</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X size={14} aria-hidden="true" />
                  Quitar filtros
                </Button>
              )}
              <span className="text-xs text-ink-3 tabular-nums">{filteredTickets.length} de {total}</span>
              <ViewSwitcher className="ml-auto" currentView={viewMode} onViewChange={(view) => setParams({ view: view === 'list' ? null : view })} />
            </div>

            {renderTickets()}
          </div>
        ) : activeTab === 'timeline' ? (
          <div className="sheet max-w-3xl p-5">
            <ProjectTimeline projectId={project.id} />
          </div>
        ) : activeTab === 'docs' ? (
          <div className="max-w-4xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-ink-2">Manuales, especificaciones y guías de este proyecto.</p>
              {!readOnly && (
                <Button variant="secondary" onClick={() => setIsUploadDocModalOpen(true)}>
                  <Plus size={16} aria-hidden="true" />
                  Subir documento
                </Button>
              )}
            </div>

            {documents.length === 0 ? (
              <EmptyState icon={BookOpen} title="Sin documentación">
                Sube aquí el manual, la especificación técnica o la guía de pase de este proyecto.
              </EmptyState>
            ) : (
              <ul className="sheet divide-y divide-rule">
                {documents.map((doc) => (
                  <li key={doc.id} className="flex items-start gap-3 px-4 py-3">
                    <FileText size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-3" />
                    <div className="min-w-0 flex-1">
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="font-medium text-ink hover:underline">
                        {doc.name}
                      </a>
                      {doc.description && <p className="mt-0.5 line-clamp-2 text-[13px] text-ink-2">{doc.description}</p>}
                      <p className="mt-1 text-xs text-ink-3">
                        <span className="font-mono">{fileKind(doc.url, doc.file_type)}</span> · {formatFileSize(doc.file_size)} · {formatDate(doc.created_at)}
                      </p>
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Abrir ${doc.name}`}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-ink-3 hover:bg-ink/[0.06] hover:text-ink"
                    >
                      <ExternalLink size={15} />
                    </a>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleDeleteDoc(doc)}
                        aria-label={`Eliminar ${doc.name}`}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-ink-3 hover:bg-st-red/10 hover:text-st-red"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          /* Files View */
          <div className="max-w-4xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-ink-2">Cotizaciones, requerimientos y otros archivos del proyecto.</p>
              {!readOnly && (
                <>
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                  <Button variant="secondary" onClick={() => fileInputRef.current?.click()} isLoading={uploadingFile}>
                    {!uploadingFile && <Plus size={16} aria-hidden="true" />}
                    Subir archivo
                  </Button>
                </>
              )}
            </div>

            {!project.attachments || project.attachments.length === 0 ? (
              <EmptyState icon={FileIcon} title="Sin archivos">
                Adjunta aquí la cotización firmada, el levantamiento o cualquier archivo que el equipo necesite.
              </EmptyState>
            ) : (
              <ul className="sheet divide-y divide-rule">
                {project.attachments.map((file, index) => (
                  <li key={`${file.url}-${index}`} className="flex items-center gap-3 px-4 py-3">
                    <Paperclip size={16} aria-hidden="true" className="shrink-0 text-ink-3" />
                    <div className="min-w-0 flex-1">
                      <a href={file.url} target="_blank" rel="noopener noreferrer" className="block truncate text-sm font-medium text-ink hover:underline">
                        {file.name}
                      </a>
                      <p className="text-xs text-ink-3">
                        {formatFileSize(file.size)} · <span className="font-mono">{fileKind(file.name, file.type)}</span>
                      </p>
                    </div>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleDeleteFile(file)}
                        aria-label={`Quitar ${file.name}`}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-ink-3 hover:bg-st-red/10 hover:text-st-red"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Ticket drawer */}
      {selectedTicketId && activeTab === 'tickets' && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-30 bg-[oklch(0.18_0.02_260/0.3)] animate-fade xl:hidden"
            onClick={() => setParams({ ticket: null })}
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            tabIndex={-1}
            role="complementary"
            aria-label="Ticket seleccionado"
            className="fixed inset-y-0 right-0 z-40 flex w-full flex-col border-l border-rule bg-paper shadow-lift outline-none animate-sheet-in sm:w-[640px] xl:w-[720px]"
          >
            <TicketDetailView
              key={selectedTicketId}
              ticketId={selectedTicketId}
              onClose={() => setParams({ ticket: null })}
              onUpdate={(updated) => {
                setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
              }}
              onDelete={(deletedId) => {
                setTickets(prev => prev.filter(t => t.id !== deletedId));
                setParams({ ticket: null });
              }}
            />
          </div>
        </>
      )}


      {/* Modals */}
      {
        isNewTicketModalOpen && (
          <NewTicketModal
            projectId={project.id}
            projectName={project.name}
            clientId={project.client_id}
            contactId={project.contact_id}
            onClose={() => setIsNewTicketModalOpen(false)}
            onSubmit={async (data) => {
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

              toast.success('Ticket creado');
              const ticketsData = await ticketService.getByProject(project.id);
              setTickets(ticketsData);
              setParams({ ticket: newTicket.id });
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

      <EditProjectModal
        isOpen={isEditProjectModalOpen}
        onClose={() => setIsEditProjectModalOpen(false)}
        project={project}
        onProjectUpdated={handleProjectUpdated}
      />

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

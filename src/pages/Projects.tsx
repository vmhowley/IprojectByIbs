import { ChevronDown, ChevronRight, FolderKanban, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { NewProjectModal } from '../components/project/NewProjectModal';
import { ProjectBoardCard } from '../components/project/ProjectBoardCard';
import { ProjectCard } from '../components/project/ProjectCard';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { confirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Money } from '../components/ui/Money';
import { Skeleton } from '../components/ui/Skeleton';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ViewSwitcher, ViewType } from '../components/ui/ViewSwitcher';
import { BoardView } from '../components/views/BoardView';
import { TableView } from '../components/views/TableView';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { useSubscription } from '../hooks/useSubscription';
import { cn } from '../lib/utils';
import NProgress from '../lib/nprogress';
import { createProjectWithFiles } from '../services/projectCreation';
import { projectService } from '../services/projectService';
import { Project } from '../types';
import { isClientSide } from '../utils/access';
import { formatDate, formatMoney, isOverdue, sortCurrencies, sumByCurrency } from '../utils/format';
import { normalizeText } from '../utils/tickets';

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'on_hold', label: 'En espera' },
  { value: 'completed', label: 'Completados' },
  { value: 'archived', label: 'Archivados' },
];

/** The project register: every project with its client, status, dates and price. */
export function Projects() {
  const { user } = useAuth();
  const { isAdmin } = usePermissions();
  const { limits } = useSubscription();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectDefaultClient, setNewProjectDefaultClient] = useState<string | undefined>();
  const [collapsedClients, setCollapsedClients] = useState<Set<string>>(new Set());

  const viewMode = (searchParams.get('view') as ViewType) || 'list';
  const statusFilter = searchParams.get('status') || 'all';
  const clientFilter = searchParams.get('client') || '';
  const canSeeMoney = isAdmin();
  const isGuest = user?.role === 'guest';

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      NProgress.start();
      setIsLoading(true);
      const data = await projectService.getAll();
      setProjects(data);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
      NProgress.done();
    }
  };

  const handleCreateProject = async (projectData: Partial<Project>, files: File[]) => {
    const created = await createProjectWithFiles(projectData, files);
    setShowNewProjectModal(false);
    navigate(`/project/${created.id}`);
  };

  const handleNewProjectClick = async (clientId?: string) => {
    if (projects.length >= limits.maxProjects) {
      const upgrade = await confirmDialog({
        title: 'Llegaste al límite del plan Gratis',
        message: `El plan Gratis incluye ${limits.maxProjects} proyectos. Con Pro los proyectos son ilimitados.`,
        confirmText: 'Ver planes',
        cancelText: 'Ahora no',
        tone: 'primary',
      });
      if (upgrade) navigate('/pricing');
      return;
    }
    setNewProjectDefaultClient(clientId);
    setShowNewProjectModal(true);
  };

  const clients = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach((p) => p.client_id && map.set(p.client_id, p.clients?.name || 'Cliente'));
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [projects]);

  const counts = useMemo(() => {
    const base = clientFilter ? projects.filter((p) => p.client_id === clientFilter) : projects;
    const result: Record<string, number> = { all: base.length };
    base.forEach((p) => (result[p.status] = (result[p.status] || 0) + 1));
    return result;
  }, [projects, clientFilter]);

  const filteredProjects = useMemo(() => {
    const term = normalizeText(searchQuery.trim());
    return projects.filter((project) => {
      if (statusFilter !== 'all' && project.status !== statusFilter) return false;
      if (clientFilter && project.client_id !== clientFilter) return false;
      if (!term) return true;
      return normalizeText(`${project.name} ${project.description || ''} ${project.clients?.name || ''} ${project.use_case_id || ''}`).includes(term);
    });
  }, [projects, searchQuery, statusFilter, clientFilter]);

  // A project seen through a client's portal carries the vendor's price, not this team's.
  const ownPrice = (p: Project) => (isClientSide(user, p.client_id) ? null : p.cost);
  const totals = sumByCurrency(filteredProjects, (p) => ({ amount: ownPrice(p), currency: p.currency }));
  const clientCount = new Set(filteredProjects.map((p) => p.client_id).filter(Boolean)).size;

  const toggleClient = (clientId: string) => {
    setCollapsedClients(prev => {
      const next = new Set(prev);
      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
      }
      return next;
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56" />)}
        </div>
      ) : (
        <TableView data={[]} columns={[{ header: 'Proyecto' }, { header: 'Estado' }, { header: 'Avance' }, { header: 'Entrega' }]} isLoading />
      );
    }

    if (filteredProjects.length === 0) {
      return (
        <EmptyState
          icon={FolderKanban}
          title={searchQuery || statusFilter !== 'all' || clientFilter ? 'Ningún proyecto coincide' : 'Aún no hay proyectos'}
          action={
            searchQuery || statusFilter !== 'all' || clientFilter ? (
              <Button variant="secondary" onClick={() => { setSearchQuery(''); setSearchParams({}, { replace: true }); }}>
                Quitar filtros
              </Button>
            ) : !isGuest ? (
              <Button onClick={() => handleNewProjectClick()}>
                <Plus size={16} aria-hidden="true" />
                Crear proyecto
              </Button>
            ) : null
          }
        >
          {searchQuery || statusFilter !== 'all' || clientFilter
            ? 'Prueba con otro nombre o quita los filtros de estado y cliente.'
            : 'Un proyecto agrupa los tickets de un cliente y lleva su precio.'}
        </EmptyState>
      );
    }

    if (viewMode === 'board') {
      const columns = [
        { id: 'active', title: 'Activos', inkClass: 'text-st-violet', items: filteredProjects.filter(p => p.status === 'active') },
        { id: 'on_hold', title: 'En espera', inkClass: 'text-st-ochre', items: filteredProjects.filter(p => p.status === 'on_hold') },
        { id: 'completed', title: 'Completados', inkClass: 'text-st-green', items: filteredProjects.filter(p => p.status === 'completed') },
        { id: 'archived', title: 'Archivados', inkClass: 'text-st-graphite', items: filteredProjects.filter(p => !p.status || p.status === 'archived') },
      ];

      return (
        <BoardView
          columns={columns}
          emptyMessage="Sin proyectos"
          renderItem={(project) => <ProjectBoardCard project={project} showPrice={canSeeMoney && !isClientSide(user, project.client_id)} />}
        />
      );
    }

    if (viewMode === 'grid') {
      // Group Projects by Client
      const groupedProjects = filteredProjects.reduce((groups, project) => {
        const clientId = project.client_id || 'unassigned';
        let clientName = project.clients?.name || 'Sin cliente';
        if (user?.client_id && clientId === user.client_id) {
          clientName = `${clientName} (tu empresa)`;
        }
        if (!groups[clientId]) {
          groups[clientId] = { id: clientId, name: clientName, projects: [] };
        }
        groups[clientId].projects.push(project);
        return groups;
      }, {} as Record<string, { id: string, name: string, projects: Project[] }>);

      const sortedClientIds = Object.keys(groupedProjects).sort((a, b) =>
        a === 'unassigned' ? 1 : b === 'unassigned' ? -1 : groupedProjects[a].name.localeCompare(groupedProjects[b].name)
      );

      return (
        <div className="space-y-6">
          {sortedClientIds.map(clientId => {
            const group = groupedProjects[clientId];
            const isExpanded = !collapsedClients.has(clientId);
            const groupTotals = sumByCurrency(group.projects, (p) => ({ amount: ownPrice(p), currency: p.currency }));
            return (
              <section key={clientId} aria-label={group.name}>
                <div className="mb-3 flex items-center justify-between gap-3 border-b border-rule pb-2">
                  <button
                    type="button"
                    onClick={() => toggleClient(clientId)}
                    aria-expanded={isExpanded}
                    className="flex min-w-0 items-center gap-2 text-left"
                  >
                    {isExpanded ? <ChevronDown size={16} className="text-ink-3" /> : <ChevronRight size={16} className="text-ink-3" />}
                    <h2 className="truncate text-base font-semibold text-ink">{group.name}</h2>
                    <span className="text-sm tabular-nums text-ink-3">{group.projects.length}</span>
                  </button>
                  <div className="flex shrink-0 items-center gap-3">
                    {canSeeMoney && Object.keys(groupTotals).length > 0 && (
                      <span className="hidden font-mono text-[13px] font-semibold tabular-nums text-ink sm:inline">
                        {sortCurrencies(Object.keys(groupTotals)).map((c) => formatMoney(groupTotals[c], c)).join(' · ')}
                      </span>
                    )}
                    {!isGuest && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleNewProjectClick(clientId === 'unassigned' ? undefined : clientId)}
                        aria-label={`Nuevo proyecto para ${group.name}`}
                      >
                        <Plus size={14} aria-hidden="true" />
                        <span className="hidden sm:inline">Proyecto</span>
                      </Button>
                    )}
                  </div>
                </div>
                {isExpanded && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {group.projects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        taskCount={project.stats?.total_tasks || 0}
                        completedTaskCount={project.stats?.completed_tasks || 0}
                        showPrice={canSeeMoney && !isClientSide(user, project.client_id)}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      );
    }

    // Default: the register
    const currencies = sortCurrencies(Object.keys(totals));
    return (
      <TableView
        caption="Registro de proyectos"
        data={filteredProjects}
        rowHref={(project) => `/project/${project.id}`}
        defaultSort={{ index: 1, dir: 'asc' }}
        columns={[
          {
            header: 'Proyecto',
            sortValue: (p) => p.name.toLowerCase(),
            className: 'sm:min-w-[16rem]',
            cell: (p) => (
              // wrap-anywhere: names pasted with non-breaking spaces would otherwise hold the table open on phones.
              <div className="min-w-0 wrap-anywhere">
                <Link to={`/project/${p.id}`} className="font-medium text-ink hover:underline">
                  {p.name}
                </Link>
                <p className="line-clamp-1 text-xs text-ink-3">
                  {p.clients?.name || 'Sin cliente'}
                  {p.use_case_id && <span className="font-mono"> · {p.use_case_id}</span>}
                </p>
                {/* On phones the Estado column folds in here, so the price stays in view. */}
                <div className="mt-1 sm:hidden">
                  <StatusBadge status={p.status || 'active'} size="sm" />
                </div>
              </div>
            ),
          },
          {
            header: 'Estado',
            hideBelow: 'sm',
            sortValue: (p) => ['active', 'on_hold', 'completed', 'archived'].indexOf(p.status),
            cell: (p) => <StatusBadge status={p.status || 'active'} size="sm" />,
          },
          {
            header: 'Avance',
            hideBelow: 'md',
            sortValue: (p) => (p.stats?.total_tasks ? (p.stats.completed_tasks / p.stats.total_tasks) : -1),
            cell: (p) => {
              const total = p.stats?.total_tasks || 0;
              const done = p.stats?.completed_tasks || 0;
              return (
                <div className="flex w-28 items-center gap-2">
                  <span className="h-1 flex-1 overflow-hidden rounded-full bg-well" aria-hidden="true">
                    <span className="block h-full bg-st-green" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
                  </span>
                  <span className="text-xs tabular-nums text-ink-2">{done}/{total}</span>
                </div>
              );
            },
          },
          {
            header: 'Responsable',
            hideBelow: 'lg',
            sortValue: (p) => p.assignee_profile?.name?.toLowerCase(),
            cell: (p) =>
              p.assignee_profile ? (
                <span className="flex items-center gap-2 text-[13px] text-ink-2">
                  <Avatar name={p.assignee_profile.name} size="xs" />
                  <span className="line-clamp-1 max-w-[9rem]">{p.assignee_profile.name}</span>
                </span>
              ) : (
                <span className="text-[13px] text-ink-3">—</span>
              ),
          },
          {
            header: 'Inicio',
            hideBelow: 'xl',
            sortValue: (p) => p.start_date || '',
            cell: (p) => <span className="text-[13px] tabular-nums text-ink-2">{formatDate(p.start_date) || '—'}</span>,
          },
          {
            header: 'Entrega',
            hideBelow: 'sm',
            sortValue: (p) => p.end_date || '',
            cell: (p) => (
              <span className={cn('text-[13px] tabular-nums', isOverdue(p.end_date, p.status) ? 'font-semibold text-st-red' : 'text-ink-2')}>
                {formatDate(p.end_date) || '—'}
              </span>
            ),
          },
          ...(canSeeMoney
            ? [{
              header: 'Precio',
              align: 'right' as const,
              sortValue: (p: Project) => ownPrice(p) ?? null,
              cell: (p: Project) => <Money amount={ownPrice(p)} currency={p.currency} className="text-[13px]" empty="—" />,
            }]
            : []),
        ]}
        footer={
          canSeeMoney && currencies.length > 0 ? (
            <tr className="rule-total">
              <th scope="row" className="px-4 py-2.5 text-left text-sm font-semibold text-ink">
                Total · {filteredProjects.length} proyectos
              </th>
              {/* One empty cell per middle column, hidden at the same breakpoints. */}
              <td className="max-sm:hidden" />
              <td className="max-md:hidden" />
              <td className="max-lg:hidden" />
              <td className="max-xl:hidden" />
              <td className="max-sm:hidden" />
              <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-sm font-semibold tabular-nums text-ink">
                {currencies.map((c) => (
                  <span key={c} className="block">{formatMoney(totals[c], c)}</span>
                ))}
              </td>
            </tr>
          ) : undefined
        }
      />
    );
  };

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="Proyectos"
        subtitle={
          isLoading
            ? 'Cargando proyectos…'
            : `${filteredProjects.length} ${filteredProjects.length === 1 ? 'proyecto' : 'proyectos'} de ${clientCount} ${clientCount === 1 ? 'cliente' : 'clientes'}.`
        }
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: 'Buscar por nombre, cliente o caso',
        }}
        actions={!isGuest ? [{ label: 'Nuevo proyecto', icon: Plus, onClick: () => handleNewProjectClick() }] : []}
      >
        <ViewSwitcher currentView={viewMode} onViewChange={(view) => setParam('view', view === 'list' ? null : view)} />
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2 border-b border-rule bg-desk px-4 py-2.5 sm:px-6">
        <div role="group" aria-label="Estado" className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map(({ value, label }) => {
            const active = statusFilter === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => setParam('status', value === 'all' ? null : value)}
                className={cn(
                  'inline-flex h-7 items-center gap-1.5 rounded-control px-2.5 text-[13px] font-medium transition-colors',
                  active ? 'bg-brand/10 text-brand-strong' : 'text-ink-2 hover:bg-ink/[0.06] hover:text-ink'
                )}
              >
                {label}
                <span className={cn('text-xs tabular-nums', active ? 'text-brand-strong/75' : 'text-ink-3')}>{counts[value] || 0}</span>
              </button>
            );
          })}
        </div>
        {clients.length > 0 && (
          <div className="relative ml-auto">
            <label htmlFor="project-client-filter" className="sr-only">Cliente</label>
            <select
              id="project-client-filter"
              value={clientFilter}
              onChange={(e) => setParam('client', e.target.value || null)}
              className="field h-8 w-auto max-w-[16rem] appearance-none py-1 pr-8 text-[13px]"
            >
              <option value="">Todos los clientes</option>
              {clients.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
            <ChevronDown size={14} aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
          </div>
        )}
      </div>

      <div className="flex-1 px-4 py-5 sm:px-6">{renderContent()}</div>

      {showNewProjectModal && (
        <NewProjectModal
          onClose={() => setShowNewProjectModal(false)}
          onSubmit={handleCreateProject}
          defaultClientId={newProjectDefaultClient}
        />
      )}
    </div>
  );
}

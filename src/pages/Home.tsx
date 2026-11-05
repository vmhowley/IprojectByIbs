import { ArrowDown, ArrowUp, ChevronRight, FileText, FolderPlus, Inbox, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { TicketsByClientChart } from '../components/dashboard/TicketsByClientChart';
import { TicketsByStatusChart } from '../components/dashboard/TicketsByStatusChart';
import { PageHeader } from '../components/layout/PageHeader';
import { NewProjectModal } from '../components/project/NewProjectModal';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton, SkeletonRows } from '../components/ui/Skeleton';
import { StatusBadge } from '../components/ui/StatusBadge';
import { UrgencyBadge } from '../components/ui/UrgencyBadge';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { useSubscription } from '../hooks/useSubscription';
import { cn } from '../lib/utils';
import NProgress from '../lib/nprogress';
import { createProjectWithFiles } from '../services/projectCreation';
import { projectService } from '../services/projectService';
import { ticketService } from '../services/ticketService';
import { getUsers } from '../services/usersService';
import { Project, Ticket } from '../types';
import { exportDashboardToPDF } from '../utils/DashboardExport';
import {
  daysFromToday,
  formatDate,
  formatMoney,
  isFinished,
  isOverdue,
  relativeDay,
  sortCurrencies,
  sumByCurrency,
  timeAgo,
} from '../utils/format';
import { formatSequence, ticketSequence, ticketTitle } from '../utils/tickets';

const URGENCY_RANK: Record<string, number> = { critical: 0, high: 0, moderate: 1, medium: 1, minor: 2, low: 2 };
const longDay = new Intl.DateTimeFormat('es-DO', { weekday: 'long', day: 'numeric', month: 'long' });

type LedgerScope = 'open' | 'completed' | 'all';
type LedgerSort = { key: 'client' | string; dir: 'asc' | 'desc' };

/** Order of the day: what is late first, then what is due soon, then the rest by urgency. */
function compareWork(a: Ticket, b: Ticket) {
  const da = daysFromToday(a.deadline);
  const db = daysFromToday(b.deadline);
  if (da !== null && db !== null && da !== db) return da - db;
  if (da !== null && db === null) return -1;
  if (da === null && db !== null) return 1;
  const ua = URGENCY_RANK[a.urgency] ?? 1;
  const ub = URGENCY_RANK[b.urgency] ?? 1;
  if (ua !== ub) return ua - ub;
  return b.created_at.localeCompare(a.created_at);
}

/** The ledger's Proyectos column in words, set under the client's name on phones so the amount stays in view. */
function projectCount(count: number, unpriced: number) {
  return `${count} ${count === 1 ? 'proyecto' : 'proyectos'}${unpriced > 0 ? ` · ${unpriced} sin precio` : ''}`;
}

export function Home() {
  const { user } = useAuth();
  const { isAdmin } = usePermissions();
  const { limits } = useSubscription();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [people, setPeople] = useState<Record<string, { name: string; avatar?: string }>>({});
  const [loading, setLoading] = useState(true);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [trayScope, setTrayScope] = useState<'mine' | 'team' | null>(null);
  const [ledgerScope, setLedgerScope] = useState<LedgerScope>('open');
  const [ledgerSort, setLedgerSort] = useState<LedgerSort>({ key: 'USD', dir: 'desc' });

  const canSeeMoney = isAdmin();
  const isGuest = user?.role === 'guest';

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      NProgress.start();
      setLoading(true);
      const [projectsData, ticketsData, users] = await Promise.all([
        projectService.getAll(),
        ticketService.getAll().catch((err) => {
          console.warn('Failed to load tickets', err);
          return [] as Ticket[];
        }),
        getUsers().catch(() => []),
      ]);
      // Only tickets of projects this person can see.
      const visible = new Set(projectsData.map((p) => p.id));
      setProjects(projectsData);
      setTickets(ticketsData.filter((t) => visible.has(t.project_id)));
      setPeople(Object.fromEntries((users || []).map((u) => [u.id, { name: u.name, avatar: u.avatar }])));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('No se pudo cargar el inicio. Recarga la página.');
    } finally {
      setLoading(false);
      NProgress.done();
    }
  };

  const handleCreateProject = async (projectData: Partial<Project>, files: File[]) => {
    const data = await createProjectWithFiles(projectData, files);
    navigate(`/project/${data.id}`);
  };

  const sequence = useMemo(() => ticketSequence(tickets), [tickets]);
  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const open = useMemo(() => tickets.filter((t) => !isFinished(t.status)), [tickets]);
  const mine = useMemo(() => open.filter((t) => t.assigned_to === user?.id), [open, user?.id]);
  const overdue = useMemo(() => open.filter((t) => isOverdue(t.deadline, t.status)), [open]);
  const awaitingApproval = useMemo(() => tickets.filter((t) => t.status === 'pending_approval'), [tickets]);
  const dueThisWeek = open.filter((t) => {
    const d = daysFromToday(t.deadline);
    return d !== null && d >= 0 && d <= 7;
  });
  const activeProjects = projects.filter((p) => p.status === 'active');

  const scope = trayScope ?? (mine.length > 0 ? 'mine' : 'team');
  const tray = (scope === 'mine' ? mine : open).slice().sort(compareWork);

  // Status and client counts for the charts and the PDF.
  const statusStats = tickets.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});
  const ticketsByClient = Object.values(
    tickets.reduce<Record<string, { name: string; count: number; to?: string }>>((acc, t) => {
      const clientId = t.client_id || projectById.get(t.project_id)?.client_id;
      if (!clientId) return acc;
      const name = t.clients?.name || projectById.get(t.project_id)?.clients?.name || 'Cliente';
      acc[clientId] = acc[clientId] || { name, count: 0, to: `/clients?client=${clientId}` };
      acc[clientId].count += 1;
      return acc;
    }, {})
  );

  // The quotation book: what each client represents, one column per currency.
  const ledger = useMemo(() => {
    const inScope = projects.filter((p) =>
      ledgerScope === 'open' ? p.status === 'active' || p.status === 'on_hold'
        : ledgerScope === 'completed' ? p.status === 'completed'
          : p.status !== 'archived'
    );
    const groups = new Map<string, { id: string | null; name: string; projects: Project[] }>();
    for (const project of inScope) {
      const key = project.client_id || 'none';
      const group = groups.get(key) || { id: project.client_id || null, name: project.clients?.name || 'Sin cliente', projects: [] };
      group.projects.push(project);
      groups.set(key, group);
    }
    const rows = [...groups.values()].map((group) => ({
      ...group,
      totals: sumByCurrency(group.projects, (p) => ({ amount: p.cost, currency: p.currency })),
      unpriced: group.projects.filter((p) => p.cost === null || p.cost === undefined).length,
    }));
    const currencies = sortCurrencies([...new Set(rows.flatMap((r) => Object.keys(r.totals)))]);
    if (currencies.length === 0) currencies.push('USD');
    const sorted = rows.sort((a, b) => {
      const dir = ledgerSort.dir === 'asc' ? 1 : -1;
      if (ledgerSort.key === 'client') return a.name.localeCompare(b.name) * dir;
      const diff = (a.totals[ledgerSort.key] || 0) - (b.totals[ledgerSort.key] || 0);
      return diff !== 0 ? diff * dir : a.name.localeCompare(b.name);
    });
    const grand = sumByCurrency(inScope, (p) => ({ amount: p.cost, currency: p.currency }));
    return { rows: sorted, currencies, grand, count: inScope.length, unpriced: inScope.filter((p) => p.cost == null).length };
  }, [projects, ledgerScope, ledgerSort]);

  const approvalsByClient = Object.values(
    awaitingApproval.reduce<Record<string, { id: string | null; name: string; count: number; oldest: string }>>((acc, t) => {
      const clientId = t.client_id || projectById.get(t.project_id)?.client_id || 'none';
      const name = t.clients?.name || projectById.get(t.project_id)?.clients?.name || 'Sin cliente';
      const entry = acc[clientId] || { id: clientId === 'none' ? null : clientId, name, count: 0, oldest: t.updated_at };
      entry.count += 1;
      if (t.updated_at < entry.oldest) entry.oldest = t.updated_at;
      acc[clientId] = entry;
      return acc;
    }, {})
  ).sort((a, b) => b.count - a.count);

  const handleExport = async () => {
    const loadingToast = toast.loading('Generando PDF…');
    try {
      const earningsByCurrency = sumByCurrency(projects, (p) => ({ amount: p.cost, currency: p.currency }));
      const earningsByClient = ledger.rows
        .filter((r) => Object.keys(r.totals).length > 0)
        .map((r) => ({
          name: r.name,
          display: sortCurrencies(Object.keys(r.totals)).map((c) => formatMoney(r.totals[c], c)).join(' / '),
        }));
      await exportDashboardToPDF({
        projectsCount: projects.length,
        activeProjectsCount: activeProjects.length,
        ticketsCount: tickets.length,
        completedTicketsCount: (statusStats.completed || 0) + (statusStats.done || 0),
        statusStats,
        clientStats: ticketsByClient.map((c) => ({ name: c.name, count: c.count })),
        earningsByCurrency,
        earningsByClient,
        clientNames: {} // Optional if already resolved in strings
      }, `reporte-ibpulse-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF generado', { id: loadingToast });
    } catch (err) {
      console.error(err);
      toast.error('No se pudo generar el PDF.', { id: loadingToast });
    }
  };

  const today = longDay.format(new Date());
  const firstName = user?.name?.split(' ')[0];
  // The day in one line of the letterhead: open, late, due this week and waiting for the client.
  const summary = loading ? (
    'Cargando tu día…'
  ) : open.length === 0 ? (
    `${firstName ? `${firstName}, no` : 'No'} hay tickets abiertos.`
  ) : (
    <>
      {firstName ? `${firstName}, hay` : 'Hay'} {open.length} {open.length === 1 ? 'ticket abierto' : 'tickets abiertos'}:{' '}
      <span className={overdue.length > 0 ? 'font-semibold text-st-red' : undefined}>
        {overdue.length} {overdue.length === 1 ? 'vencido' : 'vencidos'}
      </span>
      , {dueThisWeek.length} {dueThisWeek.length === 1 ? 'vence' : 'vencen'} esta semana y {awaitingApproval.length}{' '}
      {awaitingApproval.length === 1 ? 'espera' : 'esperan'} al cliente.
    </>
  );

  const toggleSort = (key: string) =>
    setLedgerSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'client' ? 'asc' : 'desc' }));

  return (
    <div className="min-h-full">
      <PageHeader
        title={`Hoy, ${today}`}
        subtitle={summary}
        actions={[
          ...(isAdmin() || user?.role === 'support_agent'
            ? [{ label: 'Exportar PDF', icon: FileText, onClick: handleExport, variant: 'outline' as const }]
            : []),
          ...(!isGuest ? [{ label: 'Nuevo proyecto', icon: Plus, onClick: () => setIsNewProjectModalOpen(true) }] : []),
        ]}
      />

      <div className="space-y-5 px-4 py-5 sm:px-6">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 space-y-5">
            {/* Quotation book */}
            {canSeeMoney && (
              <section className="sheet" aria-labelledby="ledger-title">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-4 py-2.5">
                  <div>
                    <h2 id="ledger-title" className="text-sm font-semibold text-ink">
                      Libro de cotizaciones
                    </h2>
                    <p className="text-xs text-ink-3">Precio de los proyectos por cliente. Cada moneda se suma por separado.</p>
                  </div>
                  <div role="group" aria-label="Proyectos" className="segmented">
                    {([
                      ['open', 'Abiertos'],
                      ['completed', 'Completados'],
                      ['all', 'Todos'],
                    ] as const).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={ledgerScope === value}
                        onClick={() => setLedgerScope(value)}
                        className={cn(
                          'rounded-inner px-2.5 py-1 text-xs font-medium transition-colors',
                          ledgerScope === value ? 'bg-raised text-ink shadow-control' : 'text-ink-2 hover:text-ink'
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                {loading ? (
                  <SkeletonRows rows={5} columns={4} />
                ) : ledger.rows.length === 0 ? (
                  <p className="px-4 py-5 text-sm text-ink-3">No hay proyectos en este grupo.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm sm:min-w-[34rem]">
                      <thead>
                        <tr className="border-b border-rule bg-well">
                          <SortHeader label="Cliente" sortKey="client" sort={ledgerSort} onSort={toggleSort} />
                          <th scope="col" className="caption hidden px-4 py-2 text-right font-semibold sm:table-cell">Proyectos</th>
                          {ledger.currencies.map((code) => (
                            <SortHeader key={code} label={code} sortKey={code} sort={ledgerSort} onSort={toggleSort} align="right" />
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rule">
                        {ledger.rows.map((row) => (
                          <tr key={row.id || 'none'} className="hover:bg-ink/[0.02]">
                            <th scope="row" className="px-4 py-2 text-left font-medium text-ink">
                              {row.id ? (
                                <Link to={`/clients?client=${row.id}`} className="hover:underline">
                                  {row.name}
                                </Link>
                              ) : (
                                <span className="text-ink-2">{row.name}</span>
                              )}
                              <span className="block text-[11px] font-normal text-ink-3 sm:hidden">{projectCount(row.projects.length, row.unpriced)}</span>
                            </th>
                            <td className="hidden px-4 py-2 text-right tabular-nums text-ink-2 sm:table-cell">
                              {row.projects.length}
                              {row.unpriced > 0 && (
                                <span className="block text-[11px] text-ink-3">{row.unpriced} sin precio</span>
                              )}
                            </td>
                            {ledger.currencies.map((code) => (
                              <td key={code} className="whitespace-nowrap px-4 py-2 text-right font-mono tabular-nums text-ink">
                                {row.totals[code] !== undefined ? formatMoney(row.totals[code], code) : <span className="text-ink-3">—</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="rule-total">
                          <th scope="row" className="px-4 py-2.5 text-left font-semibold text-ink">
                            Total
                            <span className="block text-[11px] font-normal text-ink-3 sm:hidden">{projectCount(ledger.count, ledger.unpriced)}</span>
                          </th>
                          <td className="hidden px-4 py-2.5 text-right font-semibold tabular-nums text-ink sm:table-cell">
                            {ledger.count}
                            {ledger.unpriced > 0 && (
                              <span className="block text-[11px] font-normal text-ink-3">{ledger.unpriced} sin precio</span>
                            )}
                          </td>
                          {ledger.currencies.map((code) => (
                            <td key={code} className="whitespace-nowrap px-4 py-2.5 text-right font-mono font-semibold tabular-nums text-ink">
                              {formatMoney(ledger.grand[code] || 0, code)}
                            </td>
                          ))}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </section>
            )}

            {/* Today's tray */}
            <section className="sheet" aria-labelledby="tray-title">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-4 py-2.5">
                <h2 id="tray-title" className="text-sm font-semibold text-ink">
                  Bandeja de trabajo
                </h2>
                <div role="group" aria-label="Mostrar" className="segmented">
                  {(['mine', 'team'] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={scope === value}
                      onClick={() => setTrayScope(value)}
                      className={cn(
                        'rounded-inner px-2.5 py-1 text-xs font-medium transition-colors',
                        scope === value ? 'bg-raised text-ink shadow-control' : 'text-ink-2 hover:text-ink'
                      )}
                    >
                      {value === 'mine' ? `Para mí (${mine.length})` : `Equipo (${open.length})`}
                    </button>
                  ))}
                </div>
              </div>
              {loading ? (
                <SkeletonRows rows={6} columns={4} />
              ) : tray.length === 0 ? (
                <div className="p-4">
                  <EmptyState icon={Inbox} title={scope === 'mine' ? 'No tienes tickets abiertos' : 'No hay tickets abiertos'} compact>
                    {scope === 'mine'
                      ? 'Cuando te asignen un ticket aparecerá aquí, ordenado por fecha límite.'
                      : 'Los tickets se crean dentro de cada proyecto.'}
                  </EmptyState>
                </div>
              ) : (
                <>
                  <ul className="divide-y divide-rule">
                    {tray.slice(0, 12).map((ticket) => {
                      const project = projectById.get(ticket.project_id);
                      const days = daysFromToday(ticket.deadline);
                      const late = isOverdue(ticket.deadline, ticket.status);
                      const assignee = ticket.assigned_to ? people[ticket.assigned_to] : undefined;
                      return (
                        <li key={ticket.id}>
                          <Link
                            to={`/ticket/${ticket.id}`}
                            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-2.5 hover:bg-ink/[0.03] md:grid-cols-[10.5rem_minmax(0,1fr)_4.5rem_6.5rem_1.75rem]"
                          >
                            <span className="order-2 md:order-none">
                              <StatusBadge status={ticket.status} size="sm" />
                            </span>
                            <span className="order-1 min-w-0 md:order-none">
                              <span className="block truncate text-sm font-medium text-ink">{ticketTitle(ticket)}</span>
                              <span className="block truncate text-xs text-ink-3">
                                {project?.clients?.name ? `${project.clients.name} · ` : ''}
                                {project?.name || ticket.projects?.name}
                                <span className="font-mono"> · {formatSequence(sequence.get(ticket.id))}</span>
                              </span>
                            </span>
                            <span className="hidden md:block">
                              <UrgencyBadge urgency={ticket.urgency} compact />
                            </span>
                            <span
                              className={cn(
                                'order-3 text-xs tabular-nums md:order-none md:text-right',
                                late ? 'font-semibold text-st-red' : days !== null && days <= 2 ? 'font-semibold text-ink' : 'text-ink-3'
                              )}
                            >
                              {ticket.deadline ? (late ? `venció ${relativeDay(ticket.deadline)}` : relativeDay(ticket.deadline)) : 'sin fecha'}
                            </span>
                            <span className="hidden justify-end md:flex">
                              {assignee ? <Avatar name={assignee.name} src={assignee.avatar} size="xs" /> : null}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  <Link
                    to={scope === 'mine' ? '/tasks?view=mine' : '/tasks'}
                    className="flex items-center justify-between border-t border-rule bg-well px-4 py-2 text-[13px] font-medium text-ink-2 hover:text-ink"
                  >
                    {tray.length > 12 ? `Ver los ${tray.length} en Tareas` : 'Abrir Tareas'}
                    <ChevronRight size={15} aria-hidden="true" />
                  </Link>
                </>
              )}
            </section>

            {!loading && projects.length === 0 && !isGuest && (
              <EmptyState
                icon={FolderPlus}
                title="Aún no hay proyectos"
                action={
                  <Button onClick={() => setIsNewProjectModalOpen(true)}>
                    <Plus size={16} aria-hidden="true" />
                    Crear el primer proyecto
                  </Button>
                }
              >
                Un proyecto agrupa los tickets de un cliente y lleva su precio. Empieza por el trabajo que tienes en curso.
              </EmptyState>
            )}
          </div>

          {/* Side column */}
          <div className="min-w-0 space-y-5">
            <section className="sheet" aria-labelledby="approvals-title">
              <h2 id="approvals-title" className="flex items-baseline justify-between gap-3 border-b border-rule px-4 py-2.5 text-sm font-semibold text-ink">
                Esperando aprobación del cliente
                {!loading && <span className="font-normal tabular-nums text-ink-3">{awaitingApproval.length}</span>}
              </h2>
              {loading ? (
                <div className="space-y-3 p-4">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : approvalsByClient.length === 0 ? (
                <p className="px-4 py-4 text-sm text-ink-3">Ningún ticket espera aprobación.</p>
              ) : (
                <ul className="divide-y divide-rule">
                  {approvalsByClient.slice(0, 8).map((entry) => (
                    <li key={entry.id || 'none'}>
                      <Link
                        to={`/tasks?view=approval${entry.id ? `&client=${entry.id}` : ''}`}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-ink/[0.03]"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">{entry.name}</span>
                          <span className="block text-xs text-ink-3">la más antigua, {timeAgo(entry.oldest)}</span>
                        </span>
                        <span className="text-sm font-semibold tabular-nums text-st-ochre">{entry.count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="sheet" aria-labelledby="active-title">
              <h2 id="active-title" className="flex items-baseline justify-between gap-3 border-b border-rule px-4 py-2.5 text-sm font-semibold text-ink">
                Proyectos activos
                {!loading && (
                  <span className="font-normal tabular-nums text-ink-3">
                    {activeProjects.length} de {projects.length}
                  </span>
                )}
              </h2>
              {loading ? (
                <div className="space-y-3 p-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : activeProjects.length === 0 ? (
                <p className="px-4 py-4 text-sm text-ink-3">No hay proyectos activos.</p>
              ) : (
                <ul className="divide-y divide-rule">
                  {activeProjects
                    .slice()
                    .sort((a, b) => (a.end_date || '9999').localeCompare(b.end_date || '9999'))
                    .slice(0, 8)
                    .map((project) => {
                      const total = project.stats?.total_tasks || 0;
                      const done = project.stats?.completed_tasks || 0;
                      const late = isOverdue(project.end_date, project.status);
                      return (
                        <li key={project.id}>
                          <Link to={`/project/${project.id}`} className="block px-4 py-2.5 hover:bg-ink/[0.03]">
                            <span className="flex items-baseline justify-between gap-3">
                              <span className="truncate text-sm font-medium text-ink">{project.name}</span>
                              <span className="shrink-0 text-xs tabular-nums text-ink-3">
                                {done}/{total}
                              </span>
                            </span>
                            <span className="mt-1 flex items-center gap-2">
                              <span className="h-1 flex-1 overflow-hidden rounded-full bg-well" aria-hidden="true">
                                <span className="block h-full bg-st-green" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
                              </span>
                              <span className={cn('shrink-0 text-[11px]', late ? 'font-semibold text-st-red' : 'text-ink-3')}>
                                {project.end_date ? `entrega ${formatDate(project.end_date, 'day')}` : project.clients?.name || 'sin fecha'}
                              </span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                </ul>
              )}
            </section>

            {limits.hasAdvancedAnalytics ? (
              <>
                <TicketsByStatusChart stats={statusStats} />
                <TicketsByClientChart stats={ticketsByClient} />
              </>
            ) : (
              !isGuest && (
                <p className="rounded-control border border-dashed border-rule-strong/50 px-4 py-3 text-[13px] leading-relaxed text-ink-2">
                  Los gráficos de tickets por estado y por cliente están en el plan Pro.{' '}
                  <Link to="/pricing" className="font-semibold text-ink underline decoration-rule-strong">
                    Ver planes
                  </Link>
                </p>
              )
            )}
          </div>
        </div>
      </div>

      {isNewProjectModalOpen && (
        <NewProjectModal onClose={() => setIsNewProjectModalOpen(false)} onSubmit={handleCreateProject} />
      )}
    </div>
  );
}

function SortHeader({
  label,
  sortKey,
  sort,
  onSort,
  align = 'left',
}: {
  label: string;
  sortKey: string;
  sort: LedgerSort;
  onSort: (key: string) => void;
  align?: 'left' | 'right';
}) {
  const active = sort.key === sortKey;
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn('px-4 py-2', align === 'right' ? 'text-right' : 'text-left')}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn('caption inline-flex items-center gap-1 hover:text-ink', active && 'text-ink')}
      >
        {label}
        {active && (sort.dir === 'asc' ? <ArrowUp size={11} aria-hidden="true" /> : <ArrowDown size={11} aria-hidden="true" />)}
      </button>
    </th>
  );
}

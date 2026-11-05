import { ChevronDown, ChevronRight, ListChecks, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { NewTaskModal, QuickTaskData } from '../components/task/NewTaskModal';
import { PropertiesPanel } from '../components/task/PropertiesPanel';
import { TaskItem, TaskList } from '../components/task/TaskList';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonRows } from '../components/ui/Skeleton';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import { projectService } from '../services/projectService';
import { ticketService } from '../services/ticketService';
import { getUsers } from '../services/usersService';
import { Project, Ticket } from '../types';
import { dateInputToDeadline, daysFromToday, isFinished, isOverdue } from '../utils/format';
import { formatSequence, normalizeText, ticketSequence, ticketTitle } from '../utils/tickets';
import { isClientSide } from '../utils/access';

type View = 'open' | 'mine' | 'approval' | 'overdue' | 'all';

const VIEWS: { id: View; label: string }[] = [
    { id: 'open', label: 'Abiertos' },
    { id: 'mine', label: 'Para mí' },
    { id: 'approval', label: 'Esperan aprobación' },
    { id: 'overdue', label: 'Vencidos' },
    { id: 'all', label: 'Todos' },
];

const URGENCY_RANK: Record<string, number> = { critical: 0, high: 0, moderate: 1, medium: 1, minor: 2, low: 2 };

/** Every ticket of the team, by client and project, with filters for the day's work. */
export function TasksPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [showNewTask, setShowNewTask] = useState(false);
    const isWide = typeof window !== 'undefined' && window.matchMedia('(min-width: 1280px)').matches;

    const view = (searchParams.get('view') as View) || 'open';
    const clientFilter = searchParams.get('client') || '';
    const grouped = searchParams.get('group') !== 'none';
    const isGuest = user?.role === 'guest';

    const setParam = (key: string, value: string | null) => {
        const next = new URLSearchParams(searchParams);
        if (value) next.set(key, value);
        else next.delete(key);
        setSearchParams(next, { replace: true });
    };

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        try {
            const [tickets, projectList, users] = await Promise.all([
                ticketService.getAll(),
                projectService.getAll(),
                getUsers().catch(() => []),
            ]);
            // Only tickets of projects this person can see.
            const visible = new Map(projectList.map((p) => [p.id, p]));
            const visibleTickets = tickets.filter((t) => visible.has(t.project_id));
            const sequence = ticketSequence(visibleTickets);
            const people = new Map((users || []).map((u) => [u.id, u]));

            setProjects(projectList);
            setTasks(visibleTickets.map((t: Ticket) => {
                const project = visible.get(t.project_id);
                const person = t.assigned_to ? people.get(t.assigned_to) : undefined;
                return {
                    id: t.id,
                    number: formatSequence(sequence.get(t.id)),
                    title: ticketTitle(t),
                    description: t.description,
                    status: t.status,
                    urgency: t.urgency,
                    request_type: t.request_type || null,
                    assigned_to: t.assigned_to,
                    assignedToName: person?.name,
                    assignedToAvatar: person?.avatar,
                    deadline: t.deadline,
                    date_added: t.date_added,
                    created_at: t.created_at,
                    updated_at: t.updated_at,
                    comment_count: t.comment_count || 0,
                    tags: t.tags || [],
                    projectId: t.project_id,
                    projectName: project?.name || t.projects?.name || 'Proyecto',
                    clientId: t.client_id || project?.client_id || null,
                    clientName: t.clients?.name || project?.clients?.name || 'Sin cliente',
                };
            }));
        } catch (error) {
            console.error('Error loading tasks:', error);
            toast.error('No se pudieron cargar las tareas.');
        } finally {
            setLoading(false);
        }
    };

    const matchesView = (task: TaskItem, v: View) => {
        switch (v) {
            case 'open': return !isFinished(task.status);
            case 'mine': return !isFinished(task.status) && task.assigned_to === user?.id;
            case 'approval': return task.status === 'pending_approval';
            case 'overdue': return isOverdue(task.deadline, task.status);
            default: return true;
        }
    };

    const base = useMemo(() => {
        const term = normalizeText(query.trim());
        return tasks.filter((task) => {
            if (clientFilter && task.clientId !== clientFilter) return false;
            if (!term) return true;
            return normalizeText(`${task.title} ${task.projectName} ${task.clientName} ${task.number} ${task.assignedToName || ''}`).includes(term);
        });
    }, [tasks, query, clientFilter]);

    const counts = useMemo(() => {
        const result = {} as Record<View, number>;
        VIEWS.forEach(({ id }) => (result[id] = base.filter((t) => matchesView(t, id)).length));
        return result;
    }, [base, user?.id]);

    const visibleTasks = useMemo(() => {
        return base
            .filter((t) => matchesView(t, view))
            .sort((a, b) => {
                // Late and due-soon first, then by urgency, then newest.
                const da = daysFromToday(a.deadline);
                const db = daysFromToday(b.deadline);
                if (da !== null && db !== null && da !== db) return da - db;
                if (da !== null && db === null) return -1;
                if (da === null && db !== null) return 1;
                const ua = URGENCY_RANK[a.urgency] ?? 1;
                const ub = URGENCY_RANK[b.urgency] ?? 1;
                return ua - ub || b.created_at.localeCompare(a.created_at);
            });
    }, [base, view, user?.id]);

    const clients = useMemo(() => {
        const map = new Map<string, string>();
        tasks.forEach((t) => t.clientId && map.set(t.clientId, t.clientName));
        return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
    }, [tasks]);

    const groups = useMemo(() => {
        const byClient = new Map<string, { name: string; projects: Map<string, { name: string; tasks: TaskItem[] }> }>();
        for (const task of visibleTasks) {
            const clientKey = task.clientId || 'none';
            const client = byClient.get(clientKey) || { name: task.clientName, projects: new Map() };
            const project = client.projects.get(task.projectId) || { name: task.projectName, tasks: [] };
            project.tasks.push(task);
            client.projects.set(task.projectId, project);
            byClient.set(clientKey, client);
        }
        return [...byClient.entries()].sort((a, b) =>
            a[0] === 'none' ? 1 : b[0] === 'none' ? -1 : a[1].name.localeCompare(b[1].name)
        );
    }, [visibleTasks]);

    const toggle = (key: string) => {
        setCollapsed(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    // On wide screens a click selects and shows the properties; elsewhere it opens the ticket.
    const handleTaskSelect = (taskId: string) => {
        if (isWide) setSelectedId((current) => (current === taskId ? null : taskId));
        else navigate(`/ticket/${taskId}`);
    };
    const handleTaskOpen = (taskId: string) => navigate(`/ticket/${taskId}`);

    const handleCreate = async (data: QuickTaskData) => {
        const project = projects.find((p) => p.id === data.project_id);
        const created = await ticketService.create({
            project_id: data.project_id,
            subject: data.subject,
            request_type: data.request_type,
            urgency: data.urgency,
            assigned_to: data.assigned_to || null,
            deadline: dateInputToDeadline(data.deadline),
            description: data.description || null,
            status: 'pending_analysis',
            client_id: project?.client_id || null,
            contact_id: project?.contact_id || null,
        });
        toast.success('Ticket creado');
        navigate(`/ticket/${created.id}`);
    };

    const selectedTask = tasks.find((t) => t.id === selectedId) || null;

    return (
        <div className="flex min-h-full flex-col">
            <PageHeader
                title="Tareas"
                subtitle="Todos los tickets del equipo, ordenados por fecha límite y prioridad."
                search={{ value: query, onChange: setQuery, placeholder: 'Buscar asunto, proyecto o persona' }}
                actions={!isGuest ? [{ label: 'Nuevo ticket', icon: Plus, onClick: () => setShowNewTask(true) }] : []}
            />

            <div className="flex flex-wrap items-center gap-2 border-b border-rule bg-desk px-4 py-2.5 sm:px-6">
                <div role="group" aria-label="Mostrar" className="flex flex-wrap gap-1">
                    {VIEWS.map(({ id, label }) => {
                        const active = view === id;
                        return (
                            <button
                                key={id}
                                type="button"
                                aria-pressed={active}
                                onClick={() => setParam('view', id === 'open' ? null : id)}
                                className={cn(
                                    'inline-flex h-7 items-center gap-1.5 rounded-control px-2.5 text-[13px] font-medium transition-colors',
                                    active ? 'bg-brand/10 text-brand-strong' : 'text-ink-2 hover:bg-ink/[0.06] hover:text-ink'
                                )}
                            >
                                {label}
                                <span className={cn('text-xs tabular-nums', active ? 'text-brand-strong/75' : id === 'overdue' && counts.overdue > 0 ? 'font-semibold text-st-red' : 'text-ink-3')}>
                                    {counts[id] ?? 0}
                                </span>
                            </button>
                        );
                    })}
                </div>
                <div className="ml-auto flex items-center gap-2">
                    {clients.length > 0 && (
                        <div className="relative">
                            <label htmlFor="tasks-client" className="sr-only">Cliente</label>
                            <select
                                id="tasks-client"
                                value={clientFilter}
                                onChange={(e) => setParam('client', e.target.value || null)}
                                className="field h-8 w-auto max-w-[15rem] appearance-none py-1 pr-8 text-[13px]"
                            >
                                <option value="">Todos los clientes</option>
                                {clients.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                            </select>
                            <ChevronDown size={14} aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
                        </div>
                    )}
                    <label className="flex cursor-pointer select-none items-center gap-2 text-[13px] text-ink-2">
                        <input
                            type="checkbox"
                            checked={grouped}
                            onChange={(e) => setParam('group', e.target.checked ? null : 'none')}
                            className="h-4 w-4 accent-[var(--ink)]"
                        />
                        Agrupar por cliente
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 flex-1 gap-5 px-4 py-5 sm:px-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
                <div className="min-w-0 space-y-4">
                    {loading ? (
                        <div className="sheet"><SkeletonRows rows={10} columns={5} /></div>
                    ) : visibleTasks.length === 0 ? (
                        <EmptyState icon={ListChecks} title={query || clientFilter ? 'Ningún ticket coincide' : view === 'mine' ? 'No tienes tickets abiertos' : 'Nada en esta vista'}>
                            {query || clientFilter
                                ? 'Cambia la búsqueda o el cliente.'
                                : view === 'overdue'
                                    ? 'Ningún ticket abierto pasó su fecha límite.'
                                    : 'Los tickets se crean dentro de cada proyecto o con «Nuevo ticket».'}
                        </EmptyState>
                    ) : grouped ? (
                        groups.map(([clientKey, client]) => {
                            const clientOpen = !collapsed.has(clientKey);
                            const clientCount = [...client.projects.values()].reduce((acc, p) => acc + p.tasks.length, 0);
                            return (
                                <section key={clientKey} className="sheet overflow-hidden" aria-label={client.name}>
                                    <button
                                        type="button"
                                        onClick={() => toggle(clientKey)}
                                        aria-expanded={clientOpen}
                                        className="flex w-full items-center gap-2 border-b border-rule px-4 py-2.5 text-left hover:bg-ink/[0.02]"
                                    >
                                        {clientOpen ? <ChevronDown size={16} className="text-ink-3" /> : <ChevronRight size={16} className="text-ink-3" />}
                                        <h2 className="text-[15px] font-semibold text-ink">{client.name}</h2>
                                        <span className="ml-auto text-xs tabular-nums text-ink-3">
                                            {clientCount} {clientCount === 1 ? 'ticket' : 'tickets'}
                                        </span>
                                    </button>

                                    {clientOpen && [...client.projects.entries()]
                                        .sort((a, b) => a[1].name.localeCompare(b[1].name))
                                        .map(([projectId, project]) => {
                                            const key = `${clientKey}:${projectId}`;
                                            const projectOpen = !collapsed.has(key);
                                            return (
                                                <div key={projectId} className="border-b border-rule last:border-b-0">
                                                    <div className="flex items-center gap-2 bg-well/70 px-4 py-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggle(key)}
                                                            aria-expanded={projectOpen}
                                                            className="flex min-w-0 items-center gap-1.5 text-left text-[13px] font-semibold text-ink-2 hover:text-ink"
                                                        >
                                                            {projectOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                            <span className="truncate">{project.name}</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => navigate(`/project/${projectId}`)}
                                                            className="ml-auto shrink-0 text-xs text-ink-3 hover:text-ink hover:underline"
                                                        >
                                                            Ver proyecto
                                                        </button>
                                                    </div>
                                                    {projectOpen && (
                                                        <TaskList
                                                            tasks={project.tasks}
                                                            selectedTaskId={selectedId}
                                                            onTaskSelect={handleTaskSelect}
                                                            onTaskOpen={handleTaskOpen}
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}
                                </section>
                            );
                        })
                    ) : (
                        <div className="sheet overflow-hidden">
                            <TaskList
                                tasks={visibleTasks}
                                selectedTaskId={selectedId}
                                onTaskSelect={handleTaskSelect}
                                onTaskOpen={handleTaskOpen}
                                showContext
                            />
                        </div>
                    )}
                </div>

                <div className="hidden xl:block">
                    <div className="sticky top-5">
                        <PropertiesPanel task={selectedTask} onClose={() => setSelectedId(null)} />
                    </div>
                </div>
            </div>

            {showNewTask && (
                <NewTaskModal
                    projects={projects.filter((p) => !isClientSide(user, p.client_id))}
                    onClose={() => setShowNewTask(false)}
                    onSubmit={handleCreate}
                />
            )}
        </div>
    );
}

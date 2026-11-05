import { CalendarRange, ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { RoadmapTimeline } from '../components/roadmap/RoadmapTimeline';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { StatusBadge } from '../components/ui/StatusBadge';
import NProgress from '../lib/nprogress';
import { projectService } from '../services/projectService';
import { Project } from '../types';
import { formatDate, parseDate } from '../utils/format';
import { normalizeText } from '../utils/tickets';

/** When each project starts and is due, month by month. */
export function Roadmaps() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | Project['status']>('open');

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            NProgress.start();
            setLoading(true);
            const data = await projectService.getAll();
            // Filter out projects that were soft-deleted (though getAll should handle it)
            setProjects(data.filter(p => !p.deleted_at));
        } catch (error) {
            console.error('Error loading roadmap projects:', error);
        } finally {
            setLoading(false);
            NProgress.done();
        }
    };

    const filteredProjects = useMemo(() => {
        const term = normalizeText(searchQuery.trim());
        return projects.filter(project => {
            const matchesSearch = !term || normalizeText(`${project.name} ${project.description || ''} ${project.clients?.name || ''}`).includes(term);
            const matchesStatus = statusFilter === 'all'
                || (statusFilter === 'open' ? project.status === 'active' || project.status === 'on_hold' : project.status === statusFilter);

            // Roadmap usually shows projects even if they don't have dates,
            // but for the timeline they need them. We show all but label those without dates.
            return matchesSearch && matchesStatus;
        });
    }, [projects, searchQuery, statusFilter]);

    // Sub-segment for timeline vs list
    const projectsWithDates = filteredProjects
        .filter(p => p.start_date && p.end_date)
        .sort((a, b) => (parseDate(a.start_date)?.getTime() || 0) - (parseDate(b.start_date)?.getTime() || 0));
    const projectsWithoutDates = filteredProjects.filter(p => !p.start_date || !p.end_date);

    return (
        <div className="flex min-h-full flex-col">
            <PageHeader
                title="Cronograma"
                subtitle={
                    loading
                        ? 'Cargando proyectos…'
                        : `${projectsWithDates.length} ${projectsWithDates.length === 1 ? 'proyecto' : 'proyectos'} con inicio y entrega. Cada barra va del inicio a la entrega.`
                }
                search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Buscar proyecto o cliente' }}
            >
                <div className="relative">
                    <label htmlFor="roadmap-status" className="sr-only">Estado</label>
                    <select
                        id="roadmap-status"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                        className="field h-9 w-auto appearance-none py-1 pr-8"
                    >
                        <option value="open">Activos y en espera</option>
                        <option value="active">Solo activos</option>
                        <option value="on_hold">Solo en espera</option>
                        <option value="completed">Completados</option>
                        <option value="all">Todos los estados</option>
                    </select>
                    <ChevronDown size={14} aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
                </div>
            </PageHeader>

            <div className="space-y-5 px-4 py-5 sm:px-6">
                {loading ? (
                    <div className="sheet space-y-3 p-4" role="status" aria-label="Cargando">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-8" />
                        ))}
                    </div>
                ) : projects.length === 0 ? (
                    <EmptyState icon={CalendarRange} title="Todavía no hay proyectos">
                        Cuando un proyecto tenga fecha de inicio y de entrega aparecerá aquí.
                    </EmptyState>
                ) : (
                    <>
                        {/* Main Timeline View */}
                        <RoadmapTimeline projects={projectsWithDates} />

                        {/* Projects without dates section */}
                        {projectsWithoutDates.length > 0 && (
                            <section className="sheet overflow-hidden" aria-labelledby="roadmap-undated">
                                <div className="border-b border-rule px-4 py-3">
                                    <h2 id="roadmap-undated" className="text-[15px] font-semibold text-ink">
                                        Sin fechas completas <span className="font-normal tabular-nums text-ink-3">{projectsWithoutDates.length}</span>
                                    </h2>
                                    <p className="mt-0.5 text-[13px] text-ink-3">
                                        Les falta el inicio o la entrega, así que no salen en el cronograma. Ponlas desde «Editar» en el proyecto.
                                    </p>
                                </div>
                                <ul className="divide-y divide-rule">
                                    {projectsWithoutDates.map(project => (
                                        <li key={project.id} className="flex items-center gap-x-4 px-4 py-2.5">
                                            <div className="min-w-0 flex-1">
                                                <Link to={`/project/${project.id}`} className="block truncate text-[13px] font-medium text-ink hover:underline">
                                                    {project.name}
                                                </Link>
                                                <p className="truncate text-xs text-ink-3">{project.clients?.name || 'Sin cliente'}</p>
                                                {/* On a phone both dates go on one line under the name. */}
                                                <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs tabular-nums text-ink-2 sm:hidden">
                                                    {project.start_date ? <span>Inicio {formatDate(project.start_date)}</span> : <span className="text-st-ochre">Falta el inicio</span>}
                                                    {project.end_date ? <span>Entrega {formatDate(project.end_date)}</span> : <span className="text-st-ochre">Falta la entrega</span>}
                                                </p>
                                            </div>
                                            <span className="hidden w-40 text-xs tabular-nums text-ink-2 sm:block">
                                                {project.start_date ? `Inicio ${formatDate(project.start_date)}` : <span className="text-st-ochre">Falta el inicio</span>}
                                            </span>
                                            <span className="hidden w-40 text-xs tabular-nums text-ink-2 sm:block">
                                                {project.end_date ? `Entrega ${formatDate(project.end_date)}` : <span className="text-st-ochre">Falta la entrega</span>}
                                            </span>
                                            <StatusBadge status={project.status} size="sm" />
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

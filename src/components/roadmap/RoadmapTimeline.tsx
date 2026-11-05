import { addMonths, differenceInDays, eachMonthOfInterval, endOfMonth, format, isWithinInterval, startOfDay, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Project } from '../../types';
import { formatDate, isOverdue, parseDate } from '../../utils/format';

interface RoadmapTimelineProps {
    projects: Project[];
}

// Bars use the same inks as the status stamps.
const BAR: Record<string, string> = {
    active: 'border-st-violet/70 bg-st-violet/15',
    on_hold: 'border-st-ochre/70 bg-st-ochre/15',
    completed: 'border-st-green/70 bg-st-green/15',
    archived: 'border-st-graphite/60 bg-st-graphite/10',
};

const LEGEND = [
    { label: 'Activo', className: 'border-st-violet/70 bg-st-violet/15' },
    { label: 'En espera', className: 'border-st-ochre/70 bg-st-ochre/15' },
    { label: 'Completado', className: 'border-st-green/70 bg-st-green/15' },
    { label: 'Entrega vencida', className: 'border-st-red bg-st-red/10' },
];

const monthLabel = (date: Date, withYear = false) =>
    format(date, withYear ? 'MMM yyyy' : 'MMM', { locale: es }).replace('.', '');

/** Gantt of the projects: one row each, a bar from start to delivery, six months at a time. */
export function RoadmapTimeline({ projects }: RoadmapTimelineProps) {
    const [viewDate, setViewDate] = useState(startOfMonth(new Date()));
    const monthsToShow = 6;

    const timelineInterval = useMemo(() => {
        const start = viewDate;
        const end = endOfMonth(addMonths(viewDate, monthsToShow - 1));
        return { start, end };
    }, [viewDate]);

    const months = useMemo(() => {
        return eachMonthOfInterval(timelineInterval);
    }, [timelineInterval]);

    const totalDays = useMemo(() => {
        return differenceInDays(timelineInterval.end, timelineInterval.start) + 1;
    }, [timelineInterval]);

    const today = startOfDay(new Date());
    const todayLeft = isWithinInterval(today, timelineInterval)
        ? `${((differenceInDays(today, timelineInterval.start) + 0.5) / totalDays) * 100}%`
        : null;

    const getProjectPosition = (project: Project) => {
        // Dates are calendar days; parseDate reads them as local days, not UTC.
        const start = parseDate(project.start_date);
        const end = parseDate(project.end_date);
        if (!start || !end) return null;

        const pStart = startOfDay(start);
        const pEnd = startOfDay(end);

        // Check if project is within the current visible interval
        const isVisible =
            isWithinInterval(pStart, timelineInterval) ||
            isWithinInterval(pEnd, timelineInterval) ||
            (pStart < timelineInterval.start && pEnd > timelineInterval.end);

        if (!isVisible) return null;

        // Calculate start offset in percentage
        const startOffset = Math.max(0, differenceInDays(pStart, timelineInterval.start));
        const left = (startOffset / totalDays) * 100;

        // Calculate width in percentage
        const visibleStart = pStart < timelineInterval.start ? timelineInterval.start : pStart;
        const visibleEnd = pEnd > timelineInterval.end ? timelineInterval.end : pEnd;
        const duration = differenceInDays(visibleEnd, visibleStart) + 1;
        const width = (duration / totalDays) * 100;

        return {
            left: `${left}%`,
            width: `${width}%`,
            widthValue: width,
            continuesBefore: pStart < timelineInterval.start,
            continuesAfter: pEnd > timelineInterval.end,
        };
    };

    // A project wholly before or after these months has no bar; its row says which way it went.
    const getEdge = (project: Project) => {
        const start = parseDate(project.start_date);
        const end = parseDate(project.end_date);
        if (!start || !end) return null;
        if (startOfDay(end) < timelineInterval.start) return 'before' as const;
        if (startOfDay(start) > timelineInterval.end) return 'after' as const;
        return null;
    };

    const handlePrev = () => setViewDate(prev => addMonths(prev, -1));
    const handleNext = () => setViewDate(prev => addMonths(prev, 1));
    const isCurrent = viewDate.getTime() === startOfMonth(new Date()).getTime();

    return (
        <div className="sheet flex flex-col overflow-hidden">
            {/* Header / Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-4 py-2.5">
                <p className="text-sm font-semibold capitalize text-ink" aria-live="polite">
                    {monthLabel(months[0], true)} – {monthLabel(months[months.length - 1], true)}
                </p>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={handlePrev}
                        aria-label="Mes anterior"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-control text-ink-2 hover:bg-ink/[0.06] hover:text-ink"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewDate(startOfMonth(new Date()))}
                        disabled={isCurrent}
                        className="h-8 rounded-control px-2.5 text-[13px] font-medium text-ink-2 hover:bg-ink/[0.06] hover:text-ink disabled:opacity-50"
                    >
                        Este mes
                    </button>
                    <button
                        type="button"
                        onClick={handleNext}
                        aria-label="Mes siguiente"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-control text-ink-2 hover:bg-ink/[0.06] hover:text-ink"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Timeline Grid */}
            <div className="relative overflow-x-auto">
                <div className="relative min-w-[960px]">
                    {/* Month Labels */}
                    <div className="flex h-9 border-b border-rule bg-well">
                        <div className="caption sticky left-0 z-10 flex w-44 shrink-0 items-center border-r border-rule bg-well px-4 sm:w-64">Proyecto</div>
                        {months.map((month, i) => (
                            <div key={i} className="caption flex flex-1 items-center justify-center border-r border-rule px-2 last:border-r-0">
                                {monthLabel(month, month.getMonth() === 0 || i === 0)}
                            </div>
                        ))}
                    </div>

                    {/* Project Rows */}
                    {projects.length === 0 ? (
                        <p className="px-4 py-12 text-center text-sm text-ink-3">
                            Ningún proyecto tiene inicio y entrega en estas fechas.
                        </p>
                    ) : (
                        <ul className="divide-y divide-rule">
                            {projects.map(project => {
                                const position = getProjectPosition(project);
                                const edge = position ? null : getEdge(project);
                                const late = isOverdue(project.end_date, project.status);
                                const range = `${formatDate(project.start_date)} – ${formatDate(project.end_date)}`;
                                return (
                                    <li key={project.id} className="flex h-12 hover:bg-ink/[0.02]">
                                        <div className="sticky left-0 z-10 flex w-44 shrink-0 items-center border-r border-rule bg-paper px-4 sm:w-64">
                                            <div className="min-w-0">
                                                <Link to={`/project/${project.id}`} className="block truncate text-[13px] font-medium text-ink hover:underline">
                                                    {project.name}
                                                </Link>
                                                <p className="truncate text-xs text-ink-3">
                                                    {project.clients?.name || 'Sin cliente'}
                                                </p>
                                            </div>
                                            <span className="sr-only">
                                                {`, ${range}${late ? ', entrega vencida' : ''}`}
                                            </span>
                                        </div>

                                        <div className="relative flex-1" aria-hidden="true">
                                            {/* Vertical Lines for months */}
                                            <div className="absolute inset-0 flex">
                                                {months.map((_, i) => (
                                                    <div key={i} className="flex-1 border-r border-rule/60 last:border-r-0" />
                                                ))}
                                            </div>

                                            {edge && (
                                                <span
                                                    className={cn(
                                                        'absolute top-1/2 z-[1] flex -translate-y-1/2 items-center gap-0.5 whitespace-nowrap rounded-inner bg-paper px-1 text-[11px]',
                                                        edge === 'before' ? 'left-1.5' : 'right-1.5',
                                                        late ? 'font-semibold text-st-red' : 'text-ink-3'
                                                    )}
                                                >
                                                    {edge === 'before' ? (
                                                        <>
                                                            <ChevronLeft size={12} aria-hidden="true" />
                                                            entrega {formatDate(project.end_date, 'day')}
                                                            {late && ' · vencida'}
                                                        </>
                                                    ) : (
                                                        <>
                                                            inicia {formatDate(project.start_date, 'day')}
                                                            <ChevronRight size={12} aria-hidden="true" />
                                                        </>
                                                    )}
                                                </span>
                                            )}

                                            {/* Project Bar */}
                                            {position && (
                                                <div
                                                    className={cn(
                                                        'absolute top-1/2 flex h-6 -translate-y-1/2 items-center overflow-hidden border px-2',
                                                        position.continuesBefore ? 'rounded-l-none border-l-0' : 'rounded-l-inner',
                                                        position.continuesAfter ? 'rounded-r-none border-r-0' : 'rounded-r-inner',
                                                        late ? 'border-st-red bg-st-red/10' : BAR[project.status] || BAR.active
                                                    )}
                                                    style={{ left: position.left, width: position.width, minWidth: '6px' }}
                                                    title={`${project.name}: ${range}`}
                                                >
                                                    {position.widthValue > 14 && (
                                                        <span className="truncate whitespace-nowrap text-[11px] font-semibold text-ink">
                                                            {project.name}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {/* Today */}
                    {todayLeft && projects.length > 0 && (
                        <div className="pointer-events-none absolute bottom-0 left-44 right-0 top-9 sm:left-64" aria-hidden="true">
                            <div className="absolute bottom-0 top-0 w-px bg-brand" style={{ left: todayLeft }}>
                                {/* The flag sits on the header's lower rule, clear of the month names. */}
                                <span className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-inner bg-brand px-1 text-2xs font-semibold leading-4 text-on-brand">
                                    Hoy
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-rule bg-well px-4 py-2.5">
                {LEGEND.map((item) => (
                    <span key={item.label} className="flex items-center gap-2 text-xs text-ink-2">
                        <span className={cn('h-3 w-5 rounded-stamp border', item.className)} aria-hidden="true" />
                        {item.label}
                    </span>
                ))}
            </div>
        </div>
    );
}

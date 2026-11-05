import { History } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ActivityLog, activityService } from '../../services/activityService';
import { formatDate, timeAgo } from '../../utils/format';
import { Avatar } from '../ui/Avatar';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';
import { statusLabel } from '../ui/StatusBadge';

interface ProjectTimelineProps {
    projectId: string;
}

const ACTION_LABEL: Record<string, string> = {
    created: 'creó el proyecto',
    updated: 'actualizó el proyecto',
    member_added: 'añadió un miembro',
    member_removed: 'quitó un miembro',
    ticket_created: 'abrió un ticket',
    ticket_updated: 'actualizó un ticket',
    ticket_deleted: 'eliminó un ticket',
    comment_added: 'comentó',
    viewed: 'revisó el proyecto (cliente)',
};

/** The project's log book: who did what, newest first. */
export function ProjectTimeline({ projectId }: ProjectTimelineProps) {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLogs();
    }, [projectId]);

    const loadLogs = async () => {
        try {
            setLoading(true);
            const data = await activityService.getProjectLogs(projectId);
            setLogs(data);
        } catch (error) {
            console.error('Error loading timeline:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderDetails = (details: Record<string, unknown> | null | undefined) => {
        if (!details) return null;

        // Custom rendering for common logs
        if (details.subject) {
            return (
                <p className="mt-1 text-[13px] text-ink-2">
                    «{String(details.subject)}»
                    {!!details.status && <span className="text-ink-3"> · {statusLabel(String(details.status))}</span>}
                </p>
            );
        }

        if (details.user_name && !details.subject) {
            return null;
        }

        const entries = Object.entries(details).filter(([, value]) => value !== null && value !== '' && typeof value !== 'object');
        if (entries.length === 0) return null;
        return (
            <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 text-[13px]">
                {entries.map(([key, value]) => (
                    <div key={key} className="contents">
                        <dt className="text-ink-3">{key.replace(/_/g, ' ')}</dt>
                        <dd className="text-ink-2">{key === 'status' ? statusLabel(String(value)) : String(value)}</dd>
                    </div>
                ))}
            </dl>
        );
    }

    if (loading) {
        return (
            <div className="space-y-4" role="status" aria-label="Cargando bitácora">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex gap-3">
                        <Skeleton className="h-7 w-7 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-3.5 w-1/2" />
                            <Skeleton className="h-3 w-1/3" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <EmptyState icon={History} title="La bitácora está vacía">
                Aquí quedan registrados los cambios del proyecto, los tickets nuevos y las visitas del cliente.
            </EmptyState>
        );
    }

    return (
        <ol className="relative space-y-1 before:absolute before:bottom-3 before:left-[13px] before:top-3 before:w-px before:bg-rule">
            {logs.map((log) => (
                <li key={log.id} className="relative flex gap-3 py-2">
                    <Avatar name={log.user?.name || '?'} src={log.user?.avatar} size="sm" className="relative z-10 ring-2 ring-paper" />
                    <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                            <p className="text-sm text-ink">
                                <span className="font-semibold">{log.user?.name || 'Alguien'}</span>{' '}
                                <span className="text-ink-2">{ACTION_LABEL[log.action] || log.action}</span>
                            </p>
                            <time className="text-xs text-ink-3" dateTime={log.created_at} title={formatDate(log.created_at, 'datetime')}>
                                {timeAgo(log.created_at)}
                            </time>
                        </div>
                        {renderDetails(log.details)}
                    </div>
                </li>
            ))}
        </ol>
    );
}

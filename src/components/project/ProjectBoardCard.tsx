import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Project } from '../../types';
import { formatDate, isOverdue } from '../../utils/format';
import { Avatar } from '../ui/Avatar';
import { Money } from '../ui/Money';

interface ProjectBoardCardProps {
    project: Project;
    showPrice?: boolean;
}

/** A project slip inside a status tray: name, client, delivery date, owner. */
export function ProjectBoardCard({ project, showPrice = false }: ProjectBoardCardProps) {
    const late = isOverdue(project.end_date, project.status);
    const total = project.stats?.total_tasks || 0;
    const done = project.stats?.completed_tasks || 0;
    return (
        <Link
            to={`/project/${project.id}`}
            className="sheet group block p-3 transition-[box-shadow,border-color] hover:border-rule-strong/60 hover:shadow-lift"
        >
            <h3 className="text-sm font-semibold leading-snug text-ink group-hover:underline group-hover:decoration-rule-strong">
                {project.name}
            </h3>
            <p className="mt-0.5 truncate text-xs text-ink-2">
                {project.clients?.name || 'Sin cliente'}
                {project.use_case_id && <span className="font-mono text-ink-3"> · {project.use_case_id}</span>}
            </p>

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-rule pt-2 text-[11px]">
                <span className="flex items-center gap-1.5">
                    {project.assignee_profile ? (
                        <Avatar name={project.assignee_profile.name} size="xs" />
                    ) : (
                        <span className="text-ink-3">Sin responsable</span>
                    )}
                    <span className="tabular-nums text-ink-3">{done}/{total}</span>
                </span>
                <span className={cn('tabular-nums', late ? 'font-semibold text-st-red' : 'text-ink-3')}>
                    {project.end_date ? `entrega ${formatDate(project.end_date, 'day')}` : 'sin fecha'}
                </span>
            </div>
            {showPrice && project.cost != null && (
                <p className="mt-1.5 text-right text-xs font-semibold text-ink">
                    <Money amount={project.cost} currency={project.currency} />
                </p>
            )}
        </Link>
    );
}

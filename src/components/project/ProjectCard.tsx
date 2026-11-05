import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import { Project } from '../../types';
import { formatDate, isOverdue } from '../../utils/format';
import { Avatar } from '../ui/Avatar';
import { Money } from '../ui/Money';
import { StatusBadge } from '../ui/StatusBadge';

interface ProjectCardProps {
  project: Project;
  taskCount?: number;
  completedTaskCount?: number;
  /** Show the price line (admins only). */
  showPrice?: boolean;
}

const PRIORITY_LABEL: Record<string, string> = { high: 'Prioridad alta', medium: 'Prioridad media', low: 'Prioridad baja' };

/** A project's index card: status stamp, name, client, progress, dates and price. */
export function ProjectCard({ project, taskCount = 0, completedTaskCount = 0, showPrice = false }: ProjectCardProps) {
  const { user } = useAuth();

  // Check if this project belongs to the client the user is linked to
  const isLinkedProject = user?.client_id && project.client_id === user.client_id;

  // Calculate progress percentage
  const progressPercent = taskCount > 0 ? Math.round((completedTaskCount / taskCount) * 100) : 0;
  const late = isOverdue(project.end_date, project.status);

  return (
    <Link
      to={`/project/${project.id}`}
      className="sheet group flex h-full flex-col p-4 transition-[box-shadow,border-color] hover:border-rule-strong/60 hover:shadow-lift"
    >
      <div className="flex items-start justify-between gap-2">
        <StatusBadge status={project.status || 'active'} size="sm" />
        {isLinkedProject && <span className="text-[11px] font-semibold text-ink-3">Tu empresa</span>}
      </div>

      <h3 className="mt-3 line-clamp-2 text-[15px] font-semibold leading-snug text-ink group-hover:underline group-hover:decoration-rule-strong">
        {project.name}
      </h3>
      <p className="mt-0.5 truncate text-[13px] text-ink-2">
        {!isLinkedProject && project.clients?.name ? project.clients.name : 'Sin cliente'}
        {project.priority === 'high' && <span className="text-st-red"> · {PRIORITY_LABEL.high}</span>}
      </p>

      {project.description ? (
        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink-3">{project.description}</p>
      ) : null}

      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between text-xs text-ink-3">
          <span>
            <span className="font-semibold tabular-nums text-ink">{completedTaskCount}</span>/{taskCount} tickets
          </span>
          <span className="tabular-nums">{progressPercent}%</span>
        </div>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-well" aria-hidden="true">
          <div className="h-full bg-st-green" style={{ width: `${progressPercent}%` }} />
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-rule pt-3 text-xs">
          <dt className="text-ink-3">Inicio</dt>
          <dd className="text-right tabular-nums text-ink-2">{formatDate(project.start_date || project.created_at)}</dd>
          <dt className="text-ink-3">Entrega</dt>
          <dd className={cn('text-right tabular-nums', late ? 'font-semibold text-st-red' : 'text-ink-2')}>
            {project.end_date ? formatDate(project.end_date) : '—'}
          </dd>
          {showPrice && (
            <>
              <dt className="text-ink-3">Precio</dt>
              <dd className="text-right font-semibold text-ink">
                <Money amount={project.cost} currency={project.currency} />
              </dd>
            </>
          )}
        </dl>

        {project.assignee_profile && (
          <div className="mt-3 flex items-center gap-2 text-xs text-ink-2" title={`Responsable: ${project.assignee_profile.name}`}>
            <Avatar name={project.assignee_profile.name} size="xs" />
            <span className="truncate">{project.assignee_profile.name}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

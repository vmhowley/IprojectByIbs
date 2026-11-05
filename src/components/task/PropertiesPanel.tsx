import { ExternalLink, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { formatDate, isOverdue, relativeDay } from '../../utils/format';
import { Avatar } from '../ui/Avatar';
import { Card } from '../ui/Card';
import { requestTypeLabel } from '../ui/RequestTypeBadge';
import { StatusBadge } from '../ui/StatusBadge';
import { UrgencyBadge } from '../ui/UrgencyBadge';
import { TaskItem } from './TaskList';

interface PropertiesPanelProps {
  task: TaskItem | null;
  onClose: () => void;
}

/** The selected ticket at a glance, beside the list, with a way into the full order. */
export function PropertiesPanel({ task, onClose }: PropertiesPanelProps) {
  if (!task) {
    return (
      <Card padding="lg" className="flex min-h-[16rem] items-center justify-center text-center">
        <p className="max-w-[14rem] text-sm text-ink-3">
          Selecciona un ticket para ver sus datos aquí. Enter o doble clic lo abre completo.
        </p>
      </Card>
    );
  }

  const late = isOverdue(task.deadline, task.status);

  return (
    <Card ruled padding="none" role="complementary" aria-label="Propiedades del ticket" className="flex flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-rule px-4 py-3">
        <div className="min-w-0">
          <p className="font-mono text-xs font-semibold text-ink-3">{task.number}</p>
          <h2 className="mt-0.5 text-[15px] font-semibold leading-snug text-ink">{task.title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar propiedades"
          className="-mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-ink-3 hover:bg-ink/[0.06] hover:text-ink"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-4 px-4 py-4">
        <StatusBadge status={task.status} size="lg" />

        <dl className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-2.5 text-sm">
          <dt className="caption pt-0.5">Proyecto</dt>
          <dd>
            <Link to={`/project/${task.projectId}`} className="text-ink hover:underline">{task.projectName}</Link>
          </dd>
          <dt className="caption pt-0.5">Cliente</dt>
          <dd className="text-ink-2">{task.clientName}</dd>
          <dt className="caption pt-0.5">Asignado a</dt>
          <dd className="flex items-center gap-2 text-ink-2">
            {task.assigned_to ? <><Avatar name={task.assignedToName} src={task.assignedToAvatar} size="xs" />{task.assignedToName}</> : <span className="text-ink-3">Sin asignar</span>}
          </dd>
          <dt className="caption pt-0.5">Prioridad</dt>
          <dd><UrgencyBadge urgency={task.urgency} /></dd>
          <dt className="caption pt-0.5">Tipo</dt>
          <dd className="text-ink-2">{task.request_type ? requestTypeLabel(task.request_type) : '—'}</dd>
          <dt className="caption pt-0.5">Abierto</dt>
          <dd className="tabular-nums text-ink-2">{formatDate(task.date_added || task.created_at, 'long')}</dd>
          <dt className="caption pt-0.5">Fecha límite</dt>
          <dd className={cn('tabular-nums', late ? 'font-semibold text-st-red' : 'text-ink-2')}>
            {task.deadline ? `${formatDate(task.deadline)} (${relativeDay(task.deadline)})` : '—'}
          </dd>
        </dl>

        {task.tags && task.tags.filter(Boolean).length > 0 && (
          <div>
            <p className="caption">Etiquetas</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {task.tags.filter(Boolean).map((tag) => (
                <span key={tag} className="rounded-inner border border-rule bg-well px-1.5 py-0.5 text-xs text-ink-2">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {task.description && (
          <div>
            <p className="caption">Descripción</p>
            <p className="mt-1.5 line-clamp-6 whitespace-pre-line text-[13px] leading-relaxed text-ink-2">{task.description}</p>
          </div>
        )}
      </div>

      <div className="mt-auto border-t border-rule bg-well px-4 py-3">
        <Link
          to={`/ticket/${task.id}`}
          className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-control border border-brand bg-brand px-3.5 text-sm font-semibold text-on-brand hover:bg-brand-strong"
        >
          <ExternalLink size={15} aria-hidden="true" />
          Abrir ticket
        </Link>
      </div>
    </Card>
  );
}

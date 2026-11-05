import { MessageSquare } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatDate, isOverdue, relativeDay } from '../../utils/format';
import { Avatar } from '../ui/Avatar';
import { requestTypeLabel } from '../ui/RequestTypeBadge';
import { StatusBadge } from '../ui/StatusBadge';
import { UrgencyBadge } from '../ui/UrgencyBadge';
import { TASK_GRID, TaskItem } from './TaskList';

interface TaskRowProps {
  task: TaskItem;
  isSelected: boolean;
  onClick: () => void;
  onOpen: () => void;
  showContext?: boolean;
}

/** One line of the register. Click selects it; Enter or a double click opens the ticket. */
export function TaskRow({ task, isSelected, onClick, onOpen, showContext = false }: TaskRowProps) {
  const late = isOverdue(task.deadline, task.status);

  return (
    <div
      role="option"
      tabIndex={0}
      aria-selected={isSelected}
      onClick={onClick}
      onDoubleClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onOpen();
        } else if (e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        TASK_GRID,
        'cursor-pointer px-4 py-2.5 outline-none transition-colors focus-visible:bg-ink/[0.05] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus',
        isSelected ? 'bg-focus/[0.08]' : 'hover:bg-ink/[0.03]'
      )}
    >
      <span className="hidden font-mono text-xs font-semibold text-ink-3 @xl:block">{task.number}</span>

      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-ink">{task.title}</span>
          {task.comment_count > 0 && (
            <span className="flex shrink-0 items-center gap-0.5 text-xs text-ink-3" aria-label={`${task.comment_count} comentarios`}>
              <MessageSquare size={12} aria-hidden="true" />
              {task.comment_count}
            </span>
          )}
        </span>
        {showContext && (
          <span className="block truncate text-xs text-ink-3">
            {task.clientName} · {task.projectName}
          </span>
        )}
      </span>

      <span className="hidden truncate text-[13px] text-ink-2 @6xl:block">
        {task.request_type ? requestTypeLabel(task.request_type) : '—'}
      </span>

      <span className="flex justify-end @xl:justify-start">
        <StatusBadge status={task.status} size="sm" />
      </span>

      <span className="hidden @4xl:block">
        <UrgencyBadge urgency={task.urgency} compact />
      </span>

      <span className="hidden min-w-0 @4xl:block">
        {task.assigned_to ? (
          <span className="flex items-center gap-2" title={task.assignedToName || 'Asignado'}>
            <Avatar name={task.assignedToName} src={task.assignedToAvatar} size="xs" />
            <span className="truncate text-[13px] text-ink-2">{task.assignedToName || '—'}</span>
          </span>
        ) : (
          <span className="text-[13px] text-ink-3">Sin asignar</span>
        )}
      </span>

      <span
        className={cn('hidden text-[13px] tabular-nums @xl:block', late ? 'font-semibold text-st-red' : 'text-ink-2')}
        title={task.deadline ? formatDate(task.deadline, 'long') : undefined}
      >
        {task.deadline ? (late ? `venció ${relativeDay(task.deadline)}` : relativeDay(task.deadline)) : <span className="text-ink-3">—</span>}
      </span>
    </div>
  );
}

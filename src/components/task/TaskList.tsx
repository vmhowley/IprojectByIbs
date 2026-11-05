import { TaskRow } from './TaskRow';

/** A ticket as the task list shows it: flattened with its project and client. */
export interface TaskItem {
  id: string;
  number: string;
  title: string;
  description: string | null;
  status: string;
  urgency: string;
  request_type: string | null;
  assigned_to: string | null;
  assignedToName?: string;
  assignedToAvatar?: string;
  deadline: string | null;
  date_added: string;
  created_at: string;
  updated_at: string;
  comment_count: number;
  tags: string[];
  projectId: string;
  projectName: string;
  clientId: string | null;
  clientName: string;
}

interface TaskListProps {
  tasks: TaskItem[];
  selectedTaskId: string | null;
  onTaskSelect: (taskId: string) => void;
  onTaskOpen?: (taskId: string) => void;
  /** Show project and client under each subject (flat list). */
  showContext?: boolean;
}

// Columns follow the list's own width (container queries): beside the properties panel
// the list is much narrower than the window, and the subject must keep its room.
export const TASK_GRID = 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 @xl:grid-cols-[3.5rem_minmax(0,1fr)_10.5rem_6.5rem] @4xl:grid-cols-[3.5rem_minmax(0,1fr)_10.5rem_4rem_10rem_6.5rem] @6xl:grid-cols-[3.5rem_minmax(0,1fr)_9rem_10.5rem_4rem_10rem_6.5rem]';

/** The task register: one ruled line per ticket. */
export function TaskList({ tasks, selectedTaskId, onTaskSelect, onTaskOpen, showContext = false }: TaskListProps) {
  return (
    <div role="listbox" aria-label="Tareas" className="@container overflow-hidden">
      <div aria-hidden="true" className={`${TASK_GRID} border-b border-rule bg-well px-4 py-1.5`}>
        <span className="caption hidden @xl:block">N.º</span>
        <span className="caption">Asunto</span>
        <span className="caption hidden @6xl:block">Tipo</span>
        <span className="caption text-right @xl:text-left">Estado</span>
        <span className="caption hidden @4xl:block">Prioridad</span>
        <span className="caption hidden @4xl:block">Asignado a</span>
        <span className="caption hidden @xl:block">Fecha límite</span>
      </div>
      <div className="divide-y divide-rule">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            isSelected={selectedTaskId === task.id}
            showContext={showContext}
            onClick={() => onTaskSelect(task.id)}
            onOpen={() => (onTaskOpen ? onTaskOpen(task.id) : onTaskSelect(task.id))}
          />
        ))}
      </div>
    </div>
  );
}

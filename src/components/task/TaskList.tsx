import { Task } from '../../lib/supabase';
import { TaskRow } from './TaskRow';

interface TaskListProps {
  tasks: Task[];
  selectedTaskId: string | null;
  onTaskSelect: (taskId: string) => void;
}

export function TaskList({ tasks, selectedTaskId, onTaskSelect }: TaskListProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-[auto_1fr_120px_140px_140px_100px] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
          Feature
        </div>
        <div></div>
        <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
          Type
        </div>
        <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
          Progress
        </div>
        <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
          Urgency
        </div>
        <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
          Assigned to
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            isSelected={selectedTaskId === task.id}
            onClick={() => onTaskSelect(task.id)}
          />
        ))}
      </div>
    </div>
  );
}

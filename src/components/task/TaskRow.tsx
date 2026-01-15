import { MessageSquare } from 'lucide-react';
import { Task } from '../../lib/supabase';
import { RequestTypeBadge } from '../ui/RequestTypeBadge';
import { StatusBadge } from '../ui/StatusBadge';
import { UrgencyBadge } from '../ui/UrgencyBadge';

interface TaskRowProps {
  task: Task;
  isSelected: boolean;
  onClick: () => void;
}

export function TaskRow({ task, isSelected, onClick }: TaskRowProps) {
  const getStatusIcon = (status: Task['status']) => {
    if (status === 'completed') return '✓';
    return '';
  };

  return (
    <div
      onClick={onClick}
      className={`group grid grid-cols-[auto_1fr_120px_140px_140px_100px] gap-4 items-center px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 hover:bg-blue-50' : ''
        }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-5 h-5 rounded flex items-center justify-center flex-0 ${task.status === 'completed'
          ? 'bg-blue-600 text-white'
          : 'border-2 border-gray-300'
          }`}>
          {getStatusIcon(task.status) && (
            <span className="text-xs font-bold">{getStatusIcon(task.status)}</span>
          )}
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm text-gray-600 font-medium whitespace-nowrap">
            {task.id.slice(0, 8)}
          </span>
          <span className="text-sm text-gray-900 truncate">{task.title}</span>
          {task.comment_count > 0 && (
            <div className="flex items-center gap-1 text-gray-500">
              <MessageSquare size={14} />
              <span className="text-xs">{task.comment_count}</span>
            </div>
          )}
        </div>
      </div>

      <div></div>

      <div className="flex justify-start">
        {task.request_type && (
          <RequestTypeBadge type={task.request_type} />
        )}
      </div>

      <div className="flex justify-start">
        <StatusBadge status={task.status} />
      </div>

      <div className="flex justify-start">
        <UrgencyBadge urgency={task.urgency} />
      </div>

      <div className="flex justify-start">
        {task.assigned_to && (
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-semibold">
              {task.assigned_to.charAt(0)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

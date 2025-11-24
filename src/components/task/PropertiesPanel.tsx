import { Calendar, Tag, User, Folder, Building2, Clock } from 'lucide-react';
import { Task } from '../../lib/supabase';
import { StatusBadge } from '../ui/StatusBadge';
import { UrgencyBadge } from '../ui/UrgencyBadge';

interface PropertiesPanelProps {
  task: Task | null;
  onClose: () => void;
}

export function PropertiesPanel({ task, onClose }: PropertiesPanelProps) {
  if (!task) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-6 flex items-center justify-center text-gray-500">
        <p className="text-sm">Select a task to view details</p>
      </div>
    );
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-900">Properties</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-gray-400" />
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Progress
            </span>
          </div>
          <StatusBadge status={task.status} />
        </div>

        {task.category && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Folder size={14} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Category
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded text-sm font-medium text-gray-700 w-fit">
              <span>{task.category}</span>
            </div>
          </div>
        )}

        {task.assigned_to && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <User size={14} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Task owner
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 rounded text-sm font-medium text-orange-700 w-fit">
              <span>{task.assigned_to}</span>
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Tag size={14} className="text-gray-400" />
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Urgency
            </span>
          </div>
          <UrgencyBadge urgency={task.urgency} />
        </div>

        {task.department && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Building2 size={14} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Department
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded text-sm font-medium text-gray-700 w-fit">
              <span>{task.department}</span>
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={14} className="text-gray-400" />
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Date added
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded text-sm text-gray-700 w-fit">
            <Calendar size={14} className="text-gray-400" />
            <span>{formatDate(task.date_added)}</span>
          </div>
        </div>

        {task.deadline && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={14} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Deadline
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded text-sm text-gray-700 w-fit">
              <Calendar size={14} className="text-gray-400" />
              <span>{formatDate(task.deadline)}</span>
            </div>
          </div>
        )}

        {task.tags && task.tags.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tag size={14} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Tags
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    tag === 'Features'
                      ? 'bg-cyan-100 text-cyan-700'
                      : tag === 'Bugs'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

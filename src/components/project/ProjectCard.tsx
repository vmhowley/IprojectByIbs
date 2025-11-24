import { Link } from 'react-router-dom';
import { Star, ChevronRight, Calendar, CheckCircle2 } from 'lucide-react';
import { Project } from '../../lib/supabase';

interface ProjectCardProps {
  project: Project;
  taskCount?: number;
  completedTaskCount?: number;
}

export function ProjectCard({ project, taskCount = 0, completedTaskCount = 0 }: ProjectCardProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Link
      to={`/project/${project.id}`}
      className="group bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-500 hover:shadow-lg transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-3 h-3 bg-blue-600 rounded-sm flex-shrink-0"></div>
          <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {project.name}
          </h2>
          <Star size={16} className="text-yellow-500 fill-yellow-500 flex-shrink-0" />
        </div>
        <ChevronRight
          size={20}
          className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0"
        />
      </div>

      {project.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar size={14} />
            <span>{formatDate(project.created_at)}</span>
          </div>
          {taskCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <CheckCircle2 size={14} />
              <span>
                {completedTaskCount}/{taskCount} tasks
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

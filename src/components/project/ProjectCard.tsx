import { Building2, Calendar, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Project } from '../../types';

interface ProjectCardProps {
  project: Project;
  taskCount?: number;
  completedTaskCount?: number;
}

export function ProjectCard({ project, taskCount = 0, completedTaskCount = 0 }: ProjectCardProps) {
  const { user } = useAuth();

  // Check if this project belongs to the client the user is linked to
  const isLinkedProject = user?.client_id && project.client_id === user.client_id;

  // Calculate progress percentage
  const progressPercent = taskCount > 0 ? Math.round((completedTaskCount / taskCount) * 100) : 0;

  const formatDate = (date: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20';
      case 'on_hold': return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-100 dark:border-amber-500/20';
      case 'completed': return 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-100 dark:border-blue-500/20';
      case 'archived': return 'bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-400 border-slate-100 dark:border-slate-700';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 ring-rose-500/20';
      case 'medium': return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 ring-amber-500/20';
      case 'low': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 ring-blue-500/20';
      default: return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/20 ring-slate-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'on_hold': return 'En Espera';
      case 'completed': return 'Completado';
      case 'archived': return 'Archivado';
      default: return status;
    }
  };



  return (
    <Link
      to={`/project/${project.id}`}
      className="group flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 relative overflow-hidden h-full border border-gray-100 dark:border-slate-800"
    >
      {/* Decorative top gradient line */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      <div className="p-5 flex-1 flex flex-col">

        {/* Header Row: Status + Priority + Linked */}
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(project.status || 'active')}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${project.status === 'active' ? 'bg-current' : 'bg-gray-400'}`} />
              {getStatusLabel(project.status || 'active')}
            </span>

            {project.priority && (
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ring-1 ring-inset ${getPriorityColor(project.priority)}`}>
                {project.priority}
              </span>
            )}
          </div>

          {isLinkedProject && (
            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/20">
              <Building2 size={10} />
              VINCULADO
            </span>
          )}
        </div>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
          {project.name}
        </h3>

        {project.description ? (
          <p className="text-gray-500 dark:text-slate-400 text-sm line-clamp-2 mb-5">
            {project.description}
          </p>
        ) : (
          <p className="text-gray-400 dark:text-slate-600 text-sm italic mb-5">Sin descripción...</p>
        )}

        {/* Stats Row */}
        <div className="mt-auto grid grid-cols-2 gap-4 py-4 border-t border-gray-50 dark:border-slate-800">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Progreso</span>
            <div className="flex items-end gap-1.5 mt-0.5">
              <span className="text-lg font-bold text-gray-900 dark:text-white">{progressPercent}%</span>
              <div className="mb-1.5 h-1.5 w-16 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Inicio</span>
            <div className="flex items-center gap-1.5 mt-1 text-sm font-medium text-gray-700 dark:text-slate-300">
              <Calendar size={14} className="text-indigo-500" />
              {formatDate(project.start_date || project.created_at)}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 flex items-center justify-between text-xs text-gray-400 mt-1">
          {!isLinkedProject && project.clients && (
            <div className="flex items-center gap-2">
              <Users size={12} />
              <span className="truncate max-w-40">{project.clients.name}</span>
            </div>
          )}
          {!project.clients && <div></div>} {/* Spacer if no client */}

          {project.assignee_profile && (
            <div className="flex items-center gap-1.5 ml-auto" title={`Asignado a: ${project.assignee_profile.name}`}>
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[9px] font-bold">
                {project.assignee_profile.name.charAt(0).toUpperCase()}
              </div>
              <span className="max-w-[100px] truncate">{project.assignee_profile.name}</span>
            </div>
          )}
        </div>

      </div>
    </Link>
  );
}

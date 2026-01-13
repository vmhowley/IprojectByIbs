import { AlertCircle, Building2, Calendar, CheckCircle2, Clock, User, Users } from 'lucide-react';
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

  const formatDate = (date: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
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
      className="group bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-500 hover:shadow-lg transition-all relative overflow-hidden"
    >
      {/* Visual Indicator for Linked Projects */}
      {isLinkedProject && (
        <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-bl-lg z-10 flex items-center gap-1 shadow-sm">
          <Building2 size={10} />
          <span>Vinculado</span>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-3 h-3 rounded-sm flex-shrink-0 ${isLinkedProject ? 'bg-indigo-600' : 'bg-blue-600'}`}></div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors pr-6">
              {project.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(project.status || 'active')}`}>
                {getStatusLabel(project.status || 'active')}
              </span>
              {project.priority && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${getPriorityColor(project.priority)}`}>
                  <AlertCircle size={10} />
                  {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Removed star/chevron to make space for badge if needed, or keeping them but ensuring title doesn't overlap */}
        <div className="flex items-center gap-2 mt-1">
          {/* Keep minimalist for now */}
        </div>
      </div>

      {project.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex flex-col gap-2 w-full">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5" title="Fecha de inicio">
                <Calendar size={14} />
                <span>{formatDate(project.start_date || project.created_at)}</span>
              </div>
              {project.end_date && (
                <div className="flex items-center gap-1.5" title="Fecha de fin">
                  <Clock size={14} />
                  <span>{formatDate(project.end_date)}</span>
                </div>
              )}
            </div>
            {taskCount > 0 && (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} />
                <span>
                  {completedTaskCount}/{taskCount}
                </span>
              </div>
            )}
          </div>

          {(project.assignee || project.team || project.clients) && (
            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
              {project.clients && (
                <div className="flex items-center gap-1.5">
                  <Users size={14} />
                  {/* If it is a Linked Project, we show a special text or the company name with 'Vinculado' context 
                       User asked: "Let them know it is a linked project, not their own one" 
                   */}
                  <span className={`font-medium ${isLinkedProject ? 'text-blue-600' : 'text-gray-700'}`}>
                    {isLinkedProject ? 'Proyecto de Empresa' : project.clients.name}
                  </span>
                </div>
              )}
              {project.assignee_profile ? (
                <div className="flex items-center gap-1.5">
                  <User size={14} />
                  <span>{project.assignee_profile.name}</span>
                </div>
              ) : project.assignee ? (
                <div className="flex items-center gap-1.5">
                  <User size={14} />
                  <span>Asignado</span>
                </div>
              ) : null}
              {project.team && (
                <div className="flex items-center gap-1.5">
                  <Users size={14} />
                  <span>{project.team}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

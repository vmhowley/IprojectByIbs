import { AlertCircle, ChevronRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Project } from '../../types';

interface ProjectBoardCardProps {
    project: Project;
}

export function ProjectBoardCard({ project }: ProjectBoardCardProps) {
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
            case 'high': return 'text-red-500';
            case 'medium': return 'text-yellow-500';
            case 'low': return 'text-blue-500';
            default: return 'text-gray-400';
        }
    };

    return (
        <Link
            to={`/project/${project.id}`}
            className="block bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group mb-3"
        >
            <div className="flex items-start justify-between mb-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wide ${getStatusColor(project.status || 'active')}`}>
                    {project.status || 'active'}
                </span>
                {project.use_case_id && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-purple-100 text-purple-800 border border-purple-200">
                        {project.use_case_id}
                    </span>
                )}
                {project.priority && (
                    <AlertCircle size={14} className={getPriorityColor(project.priority)} />
                )}
            </div>

            <h3 className="text-sm font-semibold text-gray-900 mb-1 leading-snug group-hover:text-blue-600 transition-colors">
                {project.name}
            </h3>

            {project.description && (
                <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                    {project.description}
                </p>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-2">
                <div className="flex items-center gap-2">
                    {project.assignee_profile ? (
                        <div className="w-5 h-5 bg-blue-50 rounded-full flex items-center justify-center text-[10px] font-bold text-blue-600" title={project.assignee_profile.name}>
                            {project.assignee_profile.name.charAt(0).toUpperCase()}
                        </div>
                    ) : (
                        <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-[10px] text-gray-400">
                            ?
                        </div>
                    )}
                    {project.end_date && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Clock size={12} />
                            {new Date(project.end_date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                        </div>
                    )}
                </div>

                <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
            </div>
        </Link>
    );
}

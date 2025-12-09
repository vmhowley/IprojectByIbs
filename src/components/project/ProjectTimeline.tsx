import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { History, User as UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ActivityLog, activityService } from '../../services/activityService';
import { Card } from '../ui/Card';

interface ProjectTimelineProps {
    projectId: string;
}

export function ProjectTimeline({ projectId }: ProjectTimelineProps) {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLogs();
    }, [projectId]);

    const loadLogs = async () => {
        try {
            setLoading(true);
            const data = await activityService.getProjectLogs(projectId);
            setLogs(data);
        } catch (error) {
            console.error('Error loading timeline:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionLabel = (action: string) => {
        switch (action) {
            case 'created': return 'Proyecto creado';
            case 'updated': return 'Proyecto actualizado';
            case 'member_added': return 'Miembro añadido';
            case 'member_removed': return 'Miembro eliminado';
            default: return action;
        }
    };

    const renderDetails = (details: any) => {
        if (!details) return null;
        return (
            <div className="mt-1 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                {Object.entries(details).map(([key, value]) => (
                    <div key={key}>
                        <span className="font-semibold capitalize">{key}:</span> {String(value)}
                    </div>
                ))}
            </div>
        )
    }

    if (loading) {
        return <div className="p-4 text-center text-gray-500">Cargando historial...</div>;
    }

    if (logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                <History className="w-12 h-12 mb-2 opacity-50" />
                <p>No hay actividad registrada aún.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {logs.map((log, index) => (
                <div key={log.id} className="relative flex gap-4">
                    {/* Vertical Line */}
                    {index !== logs.length - 1 && (
                        <div className="absolute left-[19px] top-10 bottom-[-24px] w-0.5 bg-gray-200" />
                    )}

                    {/* Icon */}
                    <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border-2 border-white shadow-sm">
                        {log.user?.avatar ? (
                            <img src={log.user.avatar} alt={log.user.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <span className="font-bold text-xs">{log.user?.name?.charAt(0).toUpperCase() || <UserIcon className="w-5 h-5" />}</span>
                        )}
                    </div>

                    {/* Content */}
                    <Card className="flex-1 p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-1">
                            <div>
                                <span className="font-semibold text-gray-900">{log.user?.name || 'Usuario desconocido'}</span>
                                <span className="text-gray-500 mx-1">•</span>
                                <span className="text-gray-700 font-medium">{getActionLabel(log.action)}</span>
                            </div>
                            <time className="text-xs text-gray-400 whitespace-nowrap" dateTime={log.created_at}>
                                {format(new Date(log.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                            </time>
                        </div>

                        {renderDetails(log.details)}
                    </Card>
                </div>
            ))}
        </div>
    );
}

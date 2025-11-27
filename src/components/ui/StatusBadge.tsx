import { Circle, CheckCircle2, Clock, Eye, PlayCircle } from 'lucide-react';

type Status = "pending_analysis" | "pending_approval" | "approved" | "ongoing" | "completed" | "done"

interface StatusBadgeProps {
  status: Status | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config: Record<string, { icon: any; text: string; className: string; iconClassName: string }> = {
    pending_approval: {
      icon: Circle,
      text: 'Pendiente de Aprobación',
      className: 'text-gray-600 bg-gray-50',
      iconClassName: 'text-gray-600'
    },
    approved: {
      icon: CheckCircle2,
      text: 'Aprobado',
      className: 'text-green-600 bg-green-50',
      iconClassName: 'text-green-600'
    },
    done: {
      icon: CheckCircle2,
      text: 'Finalizado',
      className: 'text-green-600 bg-green-50',
      iconClassName: 'text-green-600'
    },
    ongoing: {
      icon: Circle,
      text: 'En Desarrollo',
      className: 'text-blue-600 bg-blue-50',
      iconClassName: 'text-blue-600'
    },
    completed: {
      icon: CheckCircle2,
      text: 'Completado',
      className: 'text-green-600 bg-green-50',
      iconClassName: 'text-green-600'
    },
    in_review: {
      icon: Eye,
      text: 'En Revisión',
      className: 'text-sky-600 bg-sky-50',
      iconClassName: 'text-sky-600'
    },
    pending_analysis: {
      icon: Clock,
      text: 'Pendiente de Análisis',
      className: 'text-gray-600 bg-gray-50',
      iconClassName: 'text-gray-600'
    }
  };

  const statusConfig = config[status] || config['pending'];
  const { icon: Icon, text, className, iconClassName } = statusConfig;

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-sm font-medium ${className}`}>
      <Icon size={14} className={iconClassName} />
      <span>{text}</span>
    </div>
  );
}

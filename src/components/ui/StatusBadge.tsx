import { CheckCircle2, Circle, Clock, Eye, PlayCircle } from 'lucide-react';

type Status = "pending_analysis" | "pending_approval" | "approved" | "ongoing" | "completed" | "done"

interface StatusBadgeProps {
  status: Status | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config: Record<string, { icon: any; text: string; className: string; iconClassName: string }> = {
    pending_approval: {
      icon: Circle,
      text: 'Pendiente de Aprobación',
      className: 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/50',
      iconClassName: 'text-gray-600 dark:text-slate-400'
    },
    approved: {
      icon: CheckCircle2,
      text: 'Aprobado',
      className: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10',
      iconClassName: 'text-green-600 dark:text-green-400'
    },
    done: {
      icon: CheckCircle2,
      text: 'Finalizado',
      className: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10',
      iconClassName: 'text-green-600 dark:text-green-400'
    },
    ongoing: {
      icon: Circle,
      text: 'En Desarrollo',
      className: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10',
      iconClassName: 'text-blue-600 dark:text-blue-400'
    },
    completed: {
      icon: CheckCircle2,
      text: 'Completado',
      className: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10',
      iconClassName: 'text-green-600 dark:text-green-400'
    },
    in_review: {
      icon: Eye,
      text: 'En Revisión',
      className: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10',
      iconClassName: 'text-sky-600 dark:text-sky-400'
    },
    pending_analysis: {
      icon: Clock,
      text: 'Pendiente de Análisis',
      className: 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/50',
      iconClassName: 'text-gray-600 dark:text-slate-400'
    },
    active: {
      icon: PlayCircle,
      text: 'Activo',
      className: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10',
      iconClassName: 'text-indigo-600 dark:text-indigo-400'
    },
    on_hold: {
      icon: Clock,
      text: 'En Espera',
      className: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10',
      iconClassName: 'text-orange-600 dark:text-orange-400'
    },
    pending: {
      icon: Circle,
      text: 'Pendiente',
      className: 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/50',
      iconClassName: 'text-gray-600 dark:text-slate-400'
    },
    default: {
      icon: Circle,
      text: status, // Show the raw status text for debugging if unknown
      className: 'text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/50',
      iconClassName: 'text-gray-600 dark:text-slate-400'
    }
  };

  const statusConfig = config[status] || config['default'];
  const { icon: Icon, text, className, iconClassName } = statusConfig;

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-sm font-medium ${className}`}>
      <Icon size={14} className={iconClassName} />
      <span>{text}</span>
    </div>
  );
}

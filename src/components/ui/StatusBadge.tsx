import { Circle, CheckCircle2, Clock, Eye, PlayCircle } from 'lucide-react';

type Status = 'todo' | 'in_progress' | 'done' | 'ongoing' | 'completed' | 'in_review' | 'pending';

interface StatusBadgeProps {
  status: Status | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config: Record<string, { icon: any; text: string; className: string; iconClassName: string }> = {
    todo: {
      icon: Circle,
      text: 'To Do',
      className: 'text-gray-600 bg-gray-50',
      iconClassName: 'text-gray-600'
    },
    in_progress: {
      icon: PlayCircle,
      text: 'In Progress',
      className: 'text-blue-600 bg-blue-50',
      iconClassName: 'text-blue-600'
    },
    done: {
      icon: CheckCircle2,
      text: 'Done',
      className: 'text-green-600 bg-green-50',
      iconClassName: 'text-green-600'
    },
    ongoing: {
      icon: Circle,
      text: 'Ongoing',
      className: 'text-blue-600 bg-blue-50',
      iconClassName: 'text-blue-600'
    },
    completed: {
      icon: CheckCircle2,
      text: 'Completed',
      className: 'text-green-600 bg-green-50',
      iconClassName: 'text-green-600'
    },
    in_review: {
      icon: Eye,
      text: 'In review',
      className: 'text-sky-600 bg-sky-50',
      iconClassName: 'text-sky-600'
    },
    pending: {
      icon: Clock,
      text: 'Pending',
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

type Urgency = 'critical' | 'high' | 'moderate' | 'medium' | 'minor' | 'low';

interface UrgencyBadgeProps {
  urgency: Urgency;
}

export function UrgencyBadge({ urgency }: UrgencyBadgeProps) {
  const config: Record<Urgency, { text: string; bars: number; className: string }> = {
    critical: {
      text: 'Crítico',
      bars: 3,
      className: 'text-red-600 dark:text-red-400'
    },
    high: {
      text: 'Alto',
      bars: 3,
      className: 'text-red-600 dark:text-red-400'
    },
    moderate: {
      text: 'Moderado',
      bars: 2,
      className: 'text-orange-600 dark:text-orange-400'
    },
    medium: {
      text: 'Medio',
      bars: 2,
      className: 'text-orange-600 dark:text-orange-400'
    },
    minor: {
      text: 'Menor',
      bars: 1,
      className: 'text-yellow-600 dark:text-yellow-400'
    },
    low: {
      text: 'Bajo',
      bars: 1,
      className: 'text-gray-600 dark:text-slate-400'
    }
  };

  const { text, bars, className } = config[urgency] || config.moderate;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-end gap-0.5">
        {[1, 2, 3].map((bar) => (
          <div
            key={bar}
            className={`w-1 ${bar === 1 ? 'h-2' : bar === 2 ? 'h-3' : 'h-4'} ${bar <= bars ? className : 'text-gray-200 dark:text-slate-800'
              } bg-current rounded-sm`}
          />
        ))}
      </div>
      <span className={`text-sm font-medium ${className}`}>{text}</span>
    </div>
  );
}

type Urgency = 'critical' | 'high' | 'moderate' | 'medium' | 'minor' | 'low';

interface UrgencyBadgeProps {
  urgency: Urgency;
}

export function UrgencyBadge({ urgency }: UrgencyBadgeProps) {
  const config: Record<Urgency, { text: string; bars: number; className: string }> = {
    critical: {
      text: 'Critical',
      bars: 3,
      className: 'text-red-600'
    },
    high: {
      text: 'High',
      bars: 3,
      className: 'text-red-600'
    },
    moderate: {
      text: 'Moderate',
      bars: 2,
      className: 'text-orange-600'
    },
    medium: {
      text: 'Medium',
      bars: 2,
      className: 'text-orange-600'
    },
    minor: {
      text: 'Minor',
      bars: 1,
      className: 'text-yellow-600'
    },
    low: {
      text: 'Low',
      bars: 1,
      className: 'text-gray-600'
    }
  };

  const { text, bars, className } = config[urgency] || config.moderate;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-end gap-0.5">
        {[1, 2, 3].map((bar) => (
          <div
            key={bar}
            className={`w-1 ${bar === 1 ? 'h-2' : bar === 2 ? 'h-3' : 'h-4'} ${
              bar <= bars ? className : 'text-gray-300'
            } bg-current rounded-sm`}
          />
        ))}
      </div>
      <span className={`text-sm font-medium ${className}`}>{text}</span>
    </div>
  );
}

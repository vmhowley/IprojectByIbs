import { cn } from '../../lib/utils';

type Urgency = 'critical' | 'high' | 'moderate' | 'medium' | 'minor' | 'low';

interface UrgencyBadgeProps {
  urgency: Urgency | string;
  /** Hide the word and keep only the meter, for dense rows. */
  compact?: boolean;
  className?: string;
}

const CONFIG: Record<Urgency, { text: string; level: 1 | 2 | 3; ink: string }> = {
  critical: { text: 'Crítica', level: 3, ink: 'text-st-red' },
  high: { text: 'Alta', level: 3, ink: 'text-st-red' },
  moderate: { text: 'Moderada', level: 2, ink: 'text-st-ochre' },
  medium: { text: 'Media', level: 2, ink: 'text-st-ochre' },
  minor: { text: 'Menor', level: 1, ink: 'text-st-graphite' },
  low: { text: 'Baja', level: 1, ink: 'text-st-graphite' },
};

export function urgencyLabel(urgency: string | null | undefined): string {
  return CONFIG[(urgency as Urgency) || 'moderate']?.text ?? urgency ?? '';
}

/** Priority as three ticks, like the boxes of a printed priority field. */
export function UrgencyBadge({ urgency, compact = false, className }: UrgencyBadgeProps) {
  const { text, level, ink } = CONFIG[urgency as Urgency] || CONFIG.moderate;
  return (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      title={`Prioridad ${text.toLowerCase()}`}
      aria-label={compact ? `Prioridad ${text.toLowerCase()}` : undefined}
    >
      <span className={cn('flex items-end gap-[2px]', ink)} aria-hidden="true">
        {[1, 2, 3].map((tick) => (
          <span
            key={tick}
            className={cn('w-[3px] rounded-full', tick === 1 ? 'h-1.5' : tick === 2 ? 'h-2.5' : 'h-3.5', tick <= level ? 'bg-current' : 'bg-rule')}
          />
        ))}
      </span>
      {!compact && <span className={cn('text-[13px] font-medium', level === 3 ? ink : 'text-ink-2')}>{text}</span>}
    </span>
  );
}

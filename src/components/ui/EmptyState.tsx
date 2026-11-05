import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: ReactNode;
  /** What this space is for and how it fills up. */
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

/** A blank form that says what goes here and how to fill it. */
export function EmptyState({ icon: Icon, title, children, action, className, compact = false }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-2 rounded-control border border-dashed border-rule-strong/50 bg-well/60',
        compact ? 'px-4 py-4' : 'px-6 py-8 sm:items-center sm:text-center',
        className
      )}
    >
      {Icon && <Icon size={compact ? 18 : 22} aria-hidden="true" className="text-ink-3" strokeWidth={1.75} />}
      <p className={cn('font-semibold text-ink', compact ? 'text-sm' : 'text-[15px]')}>{title}</p>
      {children && <div className={cn('max-w-prose text-ink-2', compact ? 'text-[13px]' : 'text-sm')}>{children}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

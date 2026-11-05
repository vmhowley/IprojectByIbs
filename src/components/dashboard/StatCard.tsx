import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface StatCardProps {
  title: string;
  value: ReactNode;
  subtitle?: ReactNode;
  /** Where the number comes from: clicking opens that list. */
  to?: string;
  /** Red figure for things that are late. */
  alert?: boolean;
  className?: string;
  /** Overrides the figure's size, e.g. for amounts that take two lines. */
  valueClassName?: string;
}

/**
 * One box of the summary strip at the head of a form: a caption, a figure and
 * what it counts. Boxes sit side by side inside one sheet, separated by rules.
 */
export function StatCard({ title, value, subtitle, to, alert = false, className, valueClassName }: StatCardProps) {
  const body = (
    <>
      <p className="caption">{title}</p>
      <p className={cn('mt-1 text-2xl font-semibold leading-none tabular-nums', alert ? 'text-st-red' : 'text-ink', valueClassName)}>{value}</p>
      {subtitle && <p className="mt-1.5 truncate text-xs text-ink-3">{subtitle}</p>}
    </>
  );
  const base = cn('block min-w-0 px-4 py-3', className);
  if (to) {
    return (
      <Link to={to} className={cn(base, 'transition-colors hover:bg-ink/[0.03]')}>
        {body}
      </Link>
    );
  }
  return <div className={base}>{body}</div>;
}

/**
 * The strip that holds StatCards: one sheet, ruled into equal boxes. The sheet is a size
 * container: the boxes stack until it is 36rem wide, so a long amount always keeps its line,
 * and a StatCard's valueClassName can size its figure to the strip with @-variants.
 */
export function StatStrip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('sheet @container', className)}>
      <div className="grid grid-cols-1 divide-y divide-rule @xl:grid-flow-col @xl:auto-cols-fr @xl:divide-x @xl:divide-y-0">{children}</div>
    </div>
  );
}

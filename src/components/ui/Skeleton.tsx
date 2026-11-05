import { cn } from '../../lib/utils';

/** Grey placeholder in the shape of the content that is loading. */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn('block animate-pulse rounded-inner bg-ink/[0.07]', className)} />;
}

/** Placeholder rows for a ledger table. */
export function SkeletonRows({ rows = 6, columns = 4, className }: { rows?: number; columns?: number; className?: string }) {
  return (
    <div role="status" aria-label="Cargando" className={cn('divide-y divide-rule', className)}>
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex items-center gap-4 px-4 py-3">
          {Array.from({ length: columns }).map((__, col) => (
            <Skeleton key={col} className={cn('h-3.5', col === 0 ? 'w-2/5' : 'w-1/6', col === columns - 1 && 'ml-auto')} />
          ))}
        </div>
      ))}
    </div>
  );
}

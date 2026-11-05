import { cn } from '../../lib/utils';
import { statusLabel } from '../ui/StatusBadge';

interface TicketsByStatusChartProps {
  stats: Partial<Record<string, number>>;
  className?: string;
}

// Same inks as the stamps, in the order work moves through.
const ORDER: { status: string; bar: string }[] = [
  { status: 'pending_analysis', bar: 'bg-st-graphite' },
  { status: 'pending_approval', bar: 'bg-st-ochre' },
  { status: 'approved', bar: 'bg-st-blue' },
  { status: 'ongoing', bar: 'bg-st-violet' },
  { status: 'completed', bar: 'bg-st-green' },
  { status: 'done', bar: 'bg-st-green/70' },
];

/** Where the tickets are: one bar split by status, and the counts below it. */
export function TicketsByStatusChart({ stats, className }: TicketsByStatusChartProps) {
  const rows = ORDER.map((row) => ({ ...row, count: stats[row.status] || 0 }));
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <section className={cn('sheet', className)}>
      <h3 className="border-b border-rule px-4 py-2.5 text-sm font-semibold text-ink">Tickets por estado</h3>
      {total === 0 ? (
        <p className="px-4 py-5 text-sm text-ink-3">Aún no hay tickets. Aparecerán aquí al crear el primero en un proyecto.</p>
      ) : (
        <div className="px-4 py-3">
          <div className="flex h-2.5 gap-px overflow-hidden rounded-full bg-rule" role="img" aria-label={rows.map((r) => `${statusLabel(r.status)}: ${r.count}`).join(', ')}>
            {rows.map((row) =>
              row.count > 0 ? (
                <div key={row.status} className={row.bar} style={{ width: `${(row.count / total) * 100}%` }} />
              ) : null
            )}
          </div>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {rows.map((row) => (
                <tr key={row.status} className={cn(row.count === 0 && 'text-ink-3')}>
                  <td className="py-1">
                    <span className="flex items-center gap-2">
                      <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', row.bar)} aria-hidden="true" />
                      <span className={row.count ? 'text-ink-2' : ''}>{statusLabel(row.status)}</span>
                    </span>
                  </td>
                  <td className="py-1 text-right font-semibold tabular-nums text-ink">{row.count}</td>
                  <td className="w-12 py-1 text-right text-xs tabular-nums text-ink-3">{Math.round((row.count / total) * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

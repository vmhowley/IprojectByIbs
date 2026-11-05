import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface ClientStats {
  name: string;
  count: number;
  /** Optional: where a click on the client goes. */
  to?: string;
}

interface TicketsByClientChartProps {
  stats: ClientStats[];
  title?: string;
  limit?: number;
  className?: string;
}

/** Who asks for the most work: one bar per client, longest first. */
export function TicketsByClientChart({ stats, title = 'Tickets por cliente', limit = 8, className }: TicketsByClientChartProps) {
  const sorted = [...stats].sort((a, b) => b.count - a.count);
  const top = sorted.slice(0, limit);
  const max = top[0]?.count || 0;

  return (
    <section className={cn('sheet', className)}>
      <h3 className="border-b border-rule px-4 py-2.5 text-sm font-semibold text-ink">{title}</h3>
      {top.length === 0 ? (
        <p className="px-4 py-5 text-sm text-ink-3">Ningún ticket tiene cliente todavía. El cliente se toma del proyecto al crear el ticket.</p>
      ) : (
        <ul className="space-y-2 px-4 py-3">
          {top.map((client) => (
            <li key={client.name} className="grid grid-cols-[minmax(0,9rem)_1fr_2.5rem] items-center gap-3 text-sm">
              {client.to ? (
                <Link to={client.to} className="truncate text-ink-2 hover:text-ink hover:underline" title={client.name}>
                  {client.name}
                </Link>
              ) : (
                <span className="truncate text-ink-2" title={client.name}>{client.name}</span>
              )}
              <span className="h-2 overflow-hidden rounded-full bg-well" aria-hidden="true">
                <span className="block h-full rounded-full bg-data" style={{ width: `${max ? (client.count / max) * 100 : 0}%` }} />
              </span>
              <span className="text-right font-semibold tabular-nums text-ink">{client.count}</span>
            </li>
          ))}
        </ul>
      )}
      {sorted.length > limit && (
        <p className="border-t border-rule px-4 py-2 text-xs text-ink-3">
          Mostrando {limit} de {sorted.length} clientes.
        </p>
      )}
    </section>
  );
}

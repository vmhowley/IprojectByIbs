import { cn } from '../../lib/utils';
import { formatDate } from '../../utils/format';
import { VacationBalance, formatDays } from '../../utils/leave';
import { StatCard, StatStrip } from '../dashboard/StatCard';

interface VacationStripProps {
  balance: VacationBalance;
  /** Someone who left earns no more anniversaries. */
  left?: boolean;
  className?: string;
}

const dayCount = new Intl.NumberFormat('es-DO', { maximumFractionDigits: 2 });

function Days({ value }: { value: number }) {
  return (
    <>
      {dayCount.format(value)}
      <span className="ml-1 text-sm font-normal text-ink-3">{Math.abs(value) === 1 ? 'día' : 'días'}</span>
    </>
  );
}

/** The vacation balance as a summary strip: available, earned, taken and the next anniversary. */
export function VacationStrip({ balance, left = false, className }: VacationStripProps) {
  return (
    <StatStrip className={cn('rounded-none border-x-0 shadow-none', className)}>
      <StatCard
        title="Disponibles"
        value={<Days value={balance.available} />}
        alert={balance.available < 0}
        subtitle={
          balance.available < 0
            ? 'Tomó días por adelantado'
            : balance.scheduled
              ? `Ya descuenta ${formatDays(balance.scheduled)} programados`
              : 'Ganadas menos tomadas'
        }
      />
      <StatCard
        title="Ganadas"
        value={<Days value={balance.earned + balance.openingDays} />}
        subtitle={
          balance.openingDays
            ? `${formatDays(balance.openingDays)} de saldo al ${formatDate(balance.openingDate, 'day')}`
            : `Desde el ingreso, ${formatDate(balance.openingDate, 'day')}`
        }
      />
      <StatCard title="Tomadas" value={<Days value={balance.taken} />} subtitle="Días laborables" />
      {!left && (
        <StatCard
          title="Próximo aniversario"
          value={<span className="text-xl">{formatDate(balance.nextAnniversary, 'day')}</span>}
          subtitle={`${balance.yearsOfService + 1} ${balance.yearsOfService === 0 ? 'año' : 'años'} · suma ${formatDays(balance.nextAnniversaryDays)}`}
        />
      )}
    </StatStrip>
  );
}

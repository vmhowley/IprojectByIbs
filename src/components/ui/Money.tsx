import { cn } from '../../lib/utils';
import { formatMoney, sortCurrencies } from '../../utils/format';

interface MoneyProps {
  amount: number | null | undefined;
  currency?: string | null;
  className?: string;
  /** Text when there is no price yet. */
  empty?: string;
}

/** An amount with its currency, set in Red Hat Mono like a typed entry, so columns line up. */
export function Money({ amount, currency, className, empty = 'Sin precio' }: MoneyProps) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    // The placeholder is a word, so it stays in Archivo even inside a mono box.
    return <span className={cn('font-sans text-ink-3', className)}>{empty}</span>;
  }
  return <span className={cn('whitespace-nowrap font-mono tabular-nums', className)}>{formatMoney(Number(amount), currency)}</span>;
}

interface MoneyTotalsProps {
  totals: Record<string, number>;
  className?: string;
  lineClassName?: string;
  empty?: string;
}

/** One line per currency, never added together: "US$1,200.00" over "RD$58,000.00". */
export function MoneyTotals({ totals, className, lineClassName, empty = '—' }: MoneyTotalsProps) {
  const codes = sortCurrencies(Object.keys(totals));
  if (codes.length === 0) return <span className={cn('text-ink-3', className)}>{empty}</span>;
  return (
    <span className={cn('inline-flex flex-col', className)}>
      {codes.map((code) => (
        <span key={code} className={cn('whitespace-nowrap font-mono tabular-nums', lineClassName)}>
          {formatMoney(totals[code], code)}
        </span>
      ))}
    </span>
  );
}

import { cn } from '../../lib/utils';
import { formatDate, formatMoney } from '../../utils/format';
import { ExitSettlement, LeaveRules, formatDays } from '../../utils/leave';
import { Money } from '../ui/Money';

interface ExitSettlementTableProps {
  settlement: ExitSettlement;
  rules: LeaveRules;
  currency: string;
}

const divisor = new Intl.NumberFormat('es-DO', { maximumFractionDigits: 2 });

/** Vacation owed at an exit, line by line, closed under the double rule. */
export function ExitSettlementTable({ settlement, rules, currency }: ExitSettlementTableProps) {
  const { balance, proportional, owedDays, dailySalary, amount } = settlement;
  const since =
    balance.yearsOfService > 0 ? `desde el aniversario del ${formatDate(balance.lastAnniversary, 'long')}` : 'desde el ingreso';

  return (
    <table className="w-full text-sm">
      <tbody className="divide-y divide-rule">
        <tr>
          <th scope="row" className="px-3 py-2 text-left font-normal text-ink">
            Ganadas y no tomadas
            <span className="block text-xs text-ink-3">
              {balance.available < 0
                ? 'Tomó días por adelantado'
                : balance.openingDays
                  ? `Con un saldo inicial de ${formatDays(balance.openingDays)}`
                  : `${balance.yearsOfService} ${balance.yearsOfService === 1 ? 'año cumplido' : 'años cumplidos'}`}
            </span>
          </th>
          <td className={cn('px-3 py-2 text-right tabular-nums', balance.available < 0 ? 'font-semibold text-st-red' : 'text-ink')}>
            {formatDays(balance.available)}
          </td>
        </tr>
        <tr>
          <th scope="row" className="px-3 py-2 text-left font-normal text-ink">
            Proporcional del año en curso
            <span className="block text-xs text-ink-3">
              {balance.monthsInYear} {balance.monthsInYear === 1 ? 'mes' : 'meses'} {since}
              {proportional === 0 && ` · suma desde ${rules.proportional_from_months} meses`}
            </span>
          </th>
          <td className="px-3 py-2 text-right tabular-nums text-ink">
            {proportional ? formatDays(proportional) : <span className="text-ink-3">—</span>}
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr className="rule-total">
          <th scope="row" className="px-3 py-2 text-left font-semibold text-ink">
            Total pendiente
          </th>
          <td className={cn('px-3 py-2 text-right font-semibold tabular-nums', owedDays < 0 ? 'text-st-red' : 'text-ink')}>
            {formatDays(owedDays)}
          </td>
        </tr>
        {dailySalary != null && amount != null && (
          <tr className="border-t border-rule">
            <th scope="row" className="px-3 py-2 text-left font-normal text-ink">
              Monto estimado
              <span className="block text-xs text-ink-3">
                {owedDays > 0 ? formatDays(owedDays) : '0 días'} × {formatMoney(dailySalary, currency)} de salario diario (mensual ÷{' '}
                {divisor.format(rules.daily_salary_divisor)})
              </span>
            </th>
            <td className="px-3 py-2 text-right">
              <Money amount={amount} currency={currency} className="font-semibold text-ink" />
            </td>
          </tr>
        )}
      </tfoot>
    </table>
  );
}

/** What the vacation estimate leaves out. */
export function ExitCaveat() {
  return (
    <p className="text-xs leading-relaxed text-ink-3">
      Es solo el cálculo de vacaciones. No incluye preaviso, cesantía, salario de Navidad ni descuentos: confírmalo con tu
      contador o con la calculadora del Ministerio de Trabajo.
    </p>
  );
}

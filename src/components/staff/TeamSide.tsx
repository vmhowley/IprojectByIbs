import { addDays } from 'date-fns';
import { Employee, EmployeeAbsence } from '../../types';
import { formatDate } from '../../utils/format';
import { LeaveRules, dayKey, formatDays, formatHours, today, vacationBalance } from '../../utils/leave';
import { Avatar } from '../ui/Avatar';
import { Skeleton } from '../ui/Skeleton';
import { absenceRange, absenceTitle } from './labels';

interface TeamSideProps {
  employees: Employee[];
  absences: EmployeeAbsence[];
  rules: LeaveRules;
  holidays: ReadonlySet<string>;
  loading: boolean;
  onOpenAbsence: (absence: EmployeeAbsence) => void;
  onOpenEmployee: (employee: Employee) => void;
}

const UPCOMING_DAYS = 30;
const ANNIVERSARY_DAYS = 60;

/** Beside the calendar: who is out today, who leaves soon and whose anniversary adds days. */
export function TeamSide({ employees, absences, rules, holidays, loading, onOpenAbsence, onOpenEmployee }: TeamSideProps) {
  const now = today();
  const todayKey = dayKey(now);
  const horizon = dayKey(addDays(now, UPCOMING_DAYS));
  const names = new Map(employees.map((e) => [e.id, e]));
  const active = (a: EmployeeAbsence) => !names.get(a.employee_id)?.exit_date;

  const outToday = absences.filter((a) => active(a) && a.start_date <= todayKey && a.end_date >= todayKey);
  const upcoming = absences
    .filter((a) => active(a) && a.start_date > todayKey && a.start_date <= horizon)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  const anniversaries = employees
    .filter((e) => !e.exit_date)
    .map((e) => ({ employee: e, balance: vacationBalance(e, [], rules, holidays) }))
    .filter(({ balance }) => balance.nextAnniversary <= addDays(now, ANNIVERSARY_DAYS))
    .sort((a, b) => a.balance.nextAnniversary.getTime() - b.balance.nextAnniversary.getTime());

  const row = (a: EmployeeAbsence, detail: string) => {
    const employee = names.get(a.employee_id);
    return (
      <li key={a.id}>
        <button
          type="button"
          onClick={() => onOpenAbsence(a)}
          className="flex w-full items-start gap-2.5 px-4 py-2.5 text-left hover:bg-ink/[0.03]"
        >
          <Avatar name={employee?.full_name} size="xs" className="mt-0.5" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-ink">{employee?.full_name || 'Empleado'}</span>
            <span className="block truncate text-xs text-ink-3">
              {absenceTitle(a)} · {detail}
            </span>
          </span>
        </button>
      </li>
    );
  };

  const skeleton = (
    <div className="space-y-3 p-4">
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  );

  return (
    <aside className="space-y-5" aria-label="Seguimiento">
      <section className="sheet">
        <h2 className="border-b border-rule px-4 py-2.5 text-sm font-semibold text-ink">
          Fuera hoy <span className="font-normal tabular-nums text-ink-3">{loading ? '' : outToday.length}</span>
        </h2>
        {loading ? (
          skeleton
        ) : outToday.length === 0 ? (
          <p className="px-4 py-4 text-sm text-ink-3">Todo el equipo trabaja hoy.</p>
        ) : (
          <ul className="divide-y divide-rule">
            {outToday.map((a) =>
              row(
                a,
                a.hours != null
                  ? formatHours(Number(a.hours))
                  : a.end_date === todayKey
                    ? 'vuelve mañana'
                    : `hasta el ${formatDate(a.end_date, 'day')}`
              )
            )}
          </ul>
        )}
      </section>

      <section className="sheet">
        <h2 className="border-b border-rule px-4 py-2.5 text-sm font-semibold text-ink">Próximos {UPCOMING_DAYS} días</h2>
        {loading ? (
          skeleton
        ) : upcoming.length === 0 ? (
          <p className="px-4 py-4 text-sm text-ink-3">No hay ausencias programadas.</p>
        ) : (
          <ul className="divide-y divide-rule">{upcoming.slice(0, 10).map((a) => row(a, absenceRange(a)))}</ul>
        )}
        {upcoming.length > 10 && (
          <p className="border-t border-rule px-4 py-2 text-xs text-ink-3">Y {upcoming.length - 10} más en el calendario.</p>
        )}
      </section>

      <section className="sheet">
        <h2 className="border-b border-rule px-4 py-2.5 text-sm font-semibold text-ink">Aniversarios</h2>
        {loading ? (
          skeleton
        ) : anniversaries.length === 0 ? (
          <p className="px-4 py-4 text-sm text-ink-3">Nadie cumple años de servicio en los próximos {ANNIVERSARY_DAYS} días.</p>
        ) : (
          <ul className="divide-y divide-rule">
            {anniversaries.map(({ employee, balance }) => (
              <li key={employee.id}>
                <button
                  type="button"
                  onClick={() => onOpenEmployee(employee)}
                  className="flex w-full items-start gap-2.5 px-4 py-2.5 text-left hover:bg-ink/[0.03]"
                >
                  <Avatar name={employee.full_name} size="xs" className="mt-0.5" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{employee.full_name}</span>
                    <span className="block truncate text-xs text-ink-3">
                      {balance.yearsOfService + 1} {balance.yearsOfService === 0 ? 'año' : 'años'} el{' '}
                      {formatDate(balance.nextAnniversary, 'day')} · suma {formatDays(balance.nextAnniversaryDays)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}

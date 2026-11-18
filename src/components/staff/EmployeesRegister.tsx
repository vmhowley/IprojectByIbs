import { IdCard, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '../../lib/utils';
import { Employee, EmployeeAbsence } from '../../types';
import { formatDate } from '../../utils/format';
import {
  LeaveRules,
  dayKey,
  exitSettlement,
  formatDays,
  formatTenure,
  toDay,
  vacationBalance,
} from '../../utils/leave';
import { normalizeText } from '../../utils/tickets';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { StatusBadge } from '../ui/StatusBadge';
import { TableView } from '../views/TableView';
import { absenceTitle, plural } from './labels';

type Scope = 'active' | 'left' | 'all';

interface EmployeesRegisterProps {
  employees: Employee[];
  absences: EmployeeAbsence[];
  rules: LeaveRules;
  holidays: ReadonlySet<string>;
  loading: boolean;
  onOpen: (employee: Employee) => void;
  onNew: () => void;
}

interface Row {
  id: string;
  employee: Employee;
  /** Available days, or the days owed at the exit for someone who left. */
  days: number;
  perYear: number;
  outToday: string | null;
}

/** The register: one line per person, with what they have available. */
export function EmployeesRegister({ employees, absences, rules, holidays, loading, onOpen, onNew }: EmployeesRegisterProps) {
  const [scope, setScope] = useState<Scope>('active');
  const [query, setQuery] = useState('');

  const rows = useMemo<Row[]>(() => {
    const todayKey = dayKey(new Date());
    const byEmployee = new Map<string, EmployeeAbsence[]>();
    for (const a of absences) byEmployee.set(a.employee_id, [...(byEmployee.get(a.employee_id) || []), a]);
    return employees.map((employee) => {
      const own = byEmployee.get(employee.id) || [];
      const balance = vacationBalance(employee, own, rules, holidays);
      const current = own.find((a) => a.start_date <= todayKey && a.end_date >= todayKey);
      return {
        id: employee.id,
        employee,
        days: employee.exit_date
          ? exitSettlement(employee, own, rules, holidays, toDay(employee.exit_date), null).owedDays
          : balance.available,
        perYear: balance.nextAnniversaryDays,
        outToday: !employee.exit_date && current ? absenceTitle(current) : null,
      };
    });
  }, [employees, absences, rules, holidays]);

  const counts = {
    active: rows.filter((r) => !r.employee.exit_date).length,
    left: rows.filter((r) => r.employee.exit_date).length,
    all: rows.length,
  };

  const visible = rows.filter((r) => {
    if (scope === 'active' && r.employee.exit_date) return false;
    if (scope === 'left' && !r.employee.exit_date) return false;
    const term = normalizeText(query.trim());
    if (!term) return true;
    const e = r.employee;
    return normalizeText([e.full_name, e.position, e.department, e.email, e.national_id].filter(Boolean).join(' ')).includes(term);
  });
  const total = visible.reduce((sum, r) => sum + r.days, 0);

  if (!loading && employees.length === 0) {
    return (
      <EmptyState
        icon={IdCard}
        title="Todavía no hay nadie en el registro"
        action={
          <Button onClick={onNew}>
            <Plus size={16} aria-hidden="true" />
            Nuevo empleado
          </Button>
        }
      >
        Agrega a cada persona con su fecha de ingreso y el saldo de vacaciones se calcula solo. Si tiene cuenta en ibPulse,
        vincúlala para que vea su calendario y sus días.
      </EmptyState>
    );
  }

  return (
    <section className="sheet overflow-hidden" aria-labelledby="register-title">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="register-title" className="text-sm font-semibold text-ink">
            Registro de personal
          </h2>
          <div role="group" aria-label="Mostrar" className="segmented">
            {(
              [
                ['active', 'Activos'],
                ['left', 'De baja'],
                ['all', 'Todos'],
              ] as [Scope, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={scope === id}
                onClick={() => setScope(id)}
                className={cn(
                  'inline-flex h-7 items-center gap-1.5 rounded-inner px-2.5 text-xs font-medium transition-colors',
                  scope === id ? 'bg-raised text-ink shadow-control' : 'text-ink-2 hover:text-ink'
                )}
              >
                {label}
                <span className="tabular-nums text-ink-3">{counts[id]}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            type="search"
            aria-label="Buscar empleado"
            placeholder="Buscar por nombre, puesto, cédula…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="field h-8 pl-8 text-[13px]"
          />
        </div>
      </div>

      <TableView
        caption="Registro de personal"
        className="rounded-none border-0 shadow-none"
        data={visible}
        isLoading={loading}
        onRowClick={(row) => onOpen(row.employee)}
        emptyMessage={
          query
            ? 'Nadie coincide con la búsqueda.'
            : scope === 'left'
              ? 'Nadie ha salido de la empresa.'
              : 'No hay empleados activos.'
        }
        defaultSort={{ index: 0, dir: 'asc' }}
        columns={[
          {
            header: 'Empleado',
            sortValue: (r) => normalizeText(r.employee.full_name),
            cell: (r) => (
              <div className="min-w-0 wrap-anywhere">
                <button
                  type="button"
                  onClick={() => onOpen(r.employee)}
                  className="text-left font-medium text-ink hover:underline"
                >
                  {r.employee.full_name}
                </button>
                <p className="line-clamp-1 text-xs text-ink-3">
                  {[r.employee.position, r.employee.department].filter(Boolean).join(' · ') || 'Sin puesto registrado'}
                </p>
                {/* On phones the state folds in here, so the days stay in view. */}
                {(r.employee.exit_date || r.outToday) && (
                  <p className="mt-1 text-xs text-ink-2 sm:hidden">
                    {r.employee.exit_date ? `Salió el ${formatDate(r.employee.exit_date, 'day')}` : `Hoy: ${r.outToday}`}
                  </p>
                )}
              </div>
            ),
          },
          {
            header: 'Ingreso',
            hideBelow: 'md',
            sortValue: (r) => r.employee.hire_date,
            cell: (r) => (
              <span className="whitespace-nowrap text-[13px] tabular-nums text-ink-2">
                {formatDate(r.employee.hire_date)}
                <span className="block text-xs text-ink-3">
                  {r.employee.exit_date
                    ? `Salió el ${formatDate(r.employee.exit_date, 'day')}`
                    : formatTenure(r.employee.hire_date)}
                </span>
              </span>
            ),
          },
          {
            header: 'Por año',
            hideBelow: 'lg',
            sortValue: (r) => r.perYear,
            cell: (r) => <span className="text-[13px] tabular-nums text-ink-2">{formatDays(r.perYear)}</span>,
          },
          {
            header: 'Hoy',
            hideBelow: 'sm',
            sortValue: (r) => (r.employee.exit_date ? 2 : r.outToday ? 1 : 0),
            cell: (r) =>
              r.employee.exit_date ? (
                <StatusBadge status="left" size="sm" />
              ) : r.outToday ? (
                <span className="text-[13px] text-ink-2">{r.outToday}</span>
              ) : (
                <span className="text-[13px] text-ink-3">Trabajando</span>
              ),
          },
          {
            header: scope === 'left' ? 'Pendiente al salir' : 'Disponibles',
            align: 'right',
            sortValue: (r) => r.days,
            cell: (r) => (
              <span className={cn('whitespace-nowrap text-sm tabular-nums', r.days < 0 ? 'font-semibold text-st-red' : 'text-ink')}>
                {formatDays(r.days)}
              </span>
            ),
          },
        ]}
        footer={
          // Available days and days owed at an exit are different things: no total over both.
          visible.length > 1 && scope !== 'all' ? (
            <tr className="rule-total">
              <th scope="row" className="px-4 py-2.5 text-left text-sm font-semibold text-ink">
                Total · {plural(visible.length, 'persona', 'personas')}
              </th>
              {/* One empty cell per middle column, hidden at the same breakpoints. */}
              <td className="max-md:hidden" />
              <td className="max-lg:hidden" />
              <td className="max-sm:hidden" />
              <td className="whitespace-nowrap px-4 py-2.5 text-right text-sm font-semibold tabular-nums text-ink">
                {formatDays(Math.round(total * 100) / 100)}
              </td>
            </tr>
          ) : undefined
        }
      />
    </section>
  );
}

import { ArrowLeft, LogOut, Pencil, Plus, Trash2 } from 'lucide-react';
import { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Employee, EmployeeAbsence } from '../../types';
import { formatDate } from '../../utils/format';
import {
  LeaveRules,
  absenceTotals,
  exitSettlement,
  formatDays,
  formatHours,
  formatTenure,
  toDay,
  today,
  vacationBalance,
} from '../../utils/leave';
import { Button } from '../ui/Button';
import { Money } from '../ui/Money';
import { StatusBadge } from '../ui/StatusBadge';
import { AbsenceHistory } from './AbsenceHistory';
import { ExitCaveat, ExitSettlementTable } from './ExitSettlementTable';
import { EXIT, KIND, KIND_ORDER } from './labels';
import { VacationStrip } from './VacationStrip';

interface EmployeeDetailProps {
  employee: Employee;
  /** The employee's own absences. */
  absences: EmployeeAbsence[];
  rules: LeaveRules;
  holidays: ReadonlySet<string>;
  /** Name of the linked account, if it is one the admin can see. */
  accountName: string | null;
  onBack: () => void;
  onEdit: () => void;
  onExit: () => void;
  onDelete: () => void;
  onNewAbsence: () => void;
  onOpenAbsence: (absence: EmployeeAbsence) => void;
}

function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <dt className="caption">{label}</dt>
      <dd className="mt-0.5 text-ink-2">{children}</dd>
    </div>
  );
}

const none = <span className="text-ink-3">—</span>;

/** One person of the register: their data, vacation balance, exit and every absence. */
export function EmployeeDetail({
  employee,
  absences,
  rules,
  holidays,
  accountName,
  onBack,
  onEdit,
  onExit,
  onDelete,
  onNewAbsence,
  onOpenAbsence,
}: EmployeeDetailProps) {
  const balance = vacationBalance(employee, absences, rules, holidays);
  const settlement = employee.exit_date
    ? exitSettlement(employee, absences, rules, holidays, toDay(employee.exit_date), employee.monthly_salary)
    : null;
  const year = today().getFullYear();
  const totals = absenceTotals(absences, rules, holidays, new Date(year, 0, 1), new Date(year, 11, 31));
  const yearParts = [
    ...KIND_ORDER.filter((kind) => totals[kind] > 0).map(
      (kind) => `${formatDays(totals[kind])} de ${KIND[kind].label.toLowerCase()}`
    ),
    ...(totals.permitHours ? [`${formatHours(totals.permitHours)} de permisos`] : []),
  ];

  return (
    <div className="space-y-5">
      <article className="sheet" aria-labelledby="employee-name">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-rule px-5 py-4">
          <div className="min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="mb-1.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2 hover:text-ink"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              Todos los empleados
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="employee-name" className="text-xl font-semibold leading-tight text-ink">
                {employee.full_name}
              </h2>
              <StatusBadge status={employee.exit_date ? 'left' : 'active'} />
            </div>
            <p className="mt-1 text-[13px] text-ink-3">
              {[employee.position, employee.department].filter(Boolean).join(' · ') || 'Sin puesto registrado'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onEdit}>
              <Pencil size={14} aria-hidden="true" />
              Editar
            </Button>
            <Button variant="secondary" size="sm" onClick={onExit}>
              <LogOut size={14} aria-hidden="true" />
              {employee.exit_date ? 'Editar salida' : 'Registrar salida'}
            </Button>
            <Button variant="danger" size="sm" onClick={onDelete}>
              <Trash2 size={14} aria-hidden="true" />
              Eliminar
            </Button>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 px-5 py-4 text-sm sm:grid-cols-2 2xl:grid-cols-3">
          <Field label="Ingreso">
            <span className="tabular-nums">{formatDate(employee.hire_date, 'long')}</span>
            <span className="block text-xs text-ink-3">
              {employee.exit_date
                ? `Trabajó ${formatTenure(employee.hire_date, toDay(employee.exit_date)).toLowerCase()}`
                : formatTenure(employee.hire_date)}
            </span>
          </Field>
          <Field label="Salario mensual">
            <Money amount={employee.monthly_salary} currency={employee.currency} className="text-ink" empty="Sin registrar" />
          </Field>
          <Field label="Cédula">
            {employee.national_id ? <span className="tabular-nums">{employee.national_id}</span> : none}
          </Field>
          <Field label="Correo">
            {employee.email ? (
              <a href={`mailto:${employee.email}`} className="block truncate text-ink hover:underline">
                {employee.email}
              </a>
            ) : (
              none
            )}
          </Field>
          <Field label="Cuenta en ibPulse">
            {employee.user_id ? (
              <>
                {accountName || 'Vinculada'}
                <span className="block text-xs text-ink-3">Ve su saldo en «Mis vacaciones»</span>
              </>
            ) : (
              <span className="text-ink-3">Sin cuenta</span>
            )}
          </Field>
        </dl>

        {employee.notes && (
          <div className="border-t border-rule px-5 py-4">
            <p className="caption">Notas</p>
            <p className="mt-1 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-ink-2">{employee.notes}</p>
          </div>
        )}
      </article>

      <section className="sheet overflow-hidden" aria-labelledby="employee-vacation">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
          <h3 id="employee-vacation" className="text-[15px] font-semibold text-ink">
            Vacaciones{' '}
            <span className="text-[13px] font-normal text-ink-3">
              al {formatDate(balance.asOf, 'long')}
            </span>
          </h3>
          {!employee.exit_date && (
            <Button variant="secondary" size="sm" onClick={onNewAbsence}>
              <Plus size={14} aria-hidden="true" />
              Registrar ausencia
            </Button>
          )}
        </div>
        <VacationStrip balance={balance} left={!!employee.exit_date} className="border-b-0" />
      </section>

      {employee.exit_date && employee.exit_type && settlement && (
        <section className="sheet overflow-hidden" aria-labelledby="employee-exit">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-5 py-3">
            <h3 id="employee-exit" className="text-[15px] font-semibold text-ink">
              Salida{' '}
              <span className="text-[13px] font-normal text-ink-3">
                {EXIT[employee.exit_type].label} · {formatDate(employee.exit_date, 'long')}
              </span>
            </h3>
          </div>
          {employee.exit_reason && (
            <p className="whitespace-pre-line border-b border-rule px-5 py-3 text-sm leading-relaxed text-ink-2">
              {employee.exit_reason}
            </p>
          )}
          <div className="px-2 pt-1">
            <ExitSettlementTable settlement={settlement} rules={rules} currency={employee.currency} />
          </div>
          <div className="border-t border-rule px-5 py-3">
            <ExitCaveat />
          </div>
        </section>
      )}

      <section className="sheet overflow-hidden" aria-labelledby="employee-history">
        <div className="px-5 py-3">
          <h3 id="employee-history" className="text-[15px] font-semibold text-ink">
            Historial <span className="font-normal tabular-nums text-ink-3">{absences.length}</span>
          </h3>
          <p className="mt-0.5 text-[13px] text-ink-2">
            {yearParts.length ? `En ${year}: ${yearParts.join(' · ')}.` : `Sin ausencias en ${year}.`}
            {totals.unpaid > 0 && ` ${formatDays(totals.unpaid)} sin disfrute de salario.`}
          </p>
        </div>
        <AbsenceHistory
          absences={absences}
          rules={rules}
          holidays={holidays}
          caption={`Ausencias de ${employee.full_name}`}
          onOpen={onOpenAbsence}
          emptyMessage="Todavía no tiene vacaciones, licencias, ausencias ni permisos registrados."
          className="rounded-none border-x-0 border-b-0 shadow-none"
        />
      </section>
    </div>
  );
}

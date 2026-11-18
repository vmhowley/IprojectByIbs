import { TreePalm } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { OwnLeaveRecord, staffService } from '../../services/staffService';
import { HrHoliday, HrSettings } from '../../types';
import { dbErrorMessage } from '../../utils/errors';
import { formatDate } from '../../utils/format';
import {
  DEFAULT_LEAVE_RULES,
  LeaveRules,
  absenceTotals,
  dayKey,
  formatDays,
  formatHours,
  today,
  vacationBalance,
} from '../../utils/leave';
import { PageHeader } from '../layout/PageHeader';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';
import { AbsenceHistory } from './AbsenceHistory';
import { KIND, KIND_ORDER, absenceRange, absenceTitle } from './labels';
import { LeaveCalendar } from './LeaveCalendar';
import { VacationStrip } from './VacationStrip';

/** Mis vacaciones: the signed-in employee's own balance, calendar and history. */
export function MyLeave() {
  const [record, setRecord] = useState<OwnLeaveRecord | null>(null);
  const [settings, setSettings] = useState<HrSettings | null>(null);
  const [holidays, setHolidays] = useState<HrHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  useEffect(() => {
    Promise.all([staffService.myRecord(), staffService.getSettings(), staffService.getHolidays()])
      .then(([r, s, h]) => {
        setRecord(r);
        setSettings(s);
        setHolidays(h);
      })
      .catch((err) => setError(dbErrorMessage(err, 'No se pudo cargar tu registro.')))
      .finally(() => setLoading(false));
  }, []);

  const rules = useMemo<LeaveRules>(
    () => (settings ? { ...settings, daily_salary_divisor: Number(settings.daily_salary_divisor) } : DEFAULT_LEAVE_RULES),
    [settings]
  );
  const holidaySet = useMemo(() => new Set(holidays.map((h) => h.date)), [holidays]);
  const holidayMap = useMemo(() => new Map(holidays.map((h) => [h.date, h.name])), [holidays]);

  const body = () => {
    if (loading) {
      return (
        <div className="sheet space-y-3 p-5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      );
    }
    if (error) {
      return (
        <EmptyState icon={TreePalm} title="No se pudo abrir tu registro">
          {error}
        </EmptyState>
      );
    }
    if (!record) {
      return (
        <EmptyState icon={TreePalm} title="Aún no estás en el registro de personal">
          Cuando un administrador de tu equipo te agregue y vincule tu cuenta, aquí verás tus días de vacaciones, tus
          licencias, ausencias y permisos.
        </EmptyState>
      );
    }

    const { employee, absences } = record;
    const balance = vacationBalance(employee, absences, rules, holidaySet);
    const todayKey = dayKey(today());
    const upcoming = absences
      .filter((a) => a.end_date >= todayKey)
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
    const year = today().getFullYear();
    const totals = absenceTotals(absences, rules, holidaySet, new Date(year, 0, 1), new Date(year, 11, 31));

    return (
      <div className="space-y-5">
        <section className="sheet overflow-hidden" aria-labelledby="my-vacation">
          <div className="px-5 py-3">
            <h2 id="my-vacation" className="text-[15px] font-semibold text-ink">
              Vacaciones <span className="text-[13px] font-normal text-ink-3">al {formatDate(balance.asOf, 'long')}</span>
            </h2>
            <p className="mt-0.5 text-[13px] text-ink-2">
              Ganas {formatDays(rules.vacation_days)} laborables por año de servicio y {formatDays(rules.vacation_days_senior)}{' '}
              desde el año {rules.senior_after_years}. Ingresaste el {formatDate(employee.hire_date, 'long')}.
            </p>
          </div>
          <VacationStrip balance={balance} left={!!employee.exit_date} className="border-b-0" />
        </section>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <LeaveCalendar
            month={month}
            onMonthChange={setMonth}
            entries={absences.map((absence) => ({ absence, name: employee.full_name }))}
            holidays={holidayMap}
            rules={rules}
            showNames={false}
          />

          <aside className="space-y-5" aria-label="Resumen">
            <section className="sheet">
              <h2 className="border-b border-rule px-4 py-2.5 text-sm font-semibold text-ink">Próximas</h2>
              {upcoming.length === 0 ? (
                <p className="px-4 py-4 text-sm text-ink-3">No tienes ausencias programadas.</p>
              ) : (
                <ul className="divide-y divide-rule">
                  {upcoming.map((a) => {
                    const Icon = KIND[a.kind].icon;
                    return (
                      <li key={a.id} className="flex items-start gap-2.5 px-4 py-2.5">
                        <Icon size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-3" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-ink">{absenceTitle(a)}</span>
                          <span className="block text-xs text-ink-3">
                            {absenceRange(a)}
                            {a.hours != null && ` · ${formatHours(Number(a.hours))}`}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="sheet">
              <h2 className="border-b border-rule px-4 py-2.5 text-sm font-semibold text-ink">En {year}</h2>
              <dl className="divide-y divide-rule text-sm">
                {KIND_ORDER.map((kind) => (
                  <div key={kind} className="flex items-center justify-between gap-3 px-4 py-2">
                    <dt className="text-ink-2">{KIND[kind].plural}</dt>
                    <dd className="tabular-nums text-ink">
                      {kind === 'permiso' && totals.permitHours
                        ? `${formatDays(totals.permiso)} + ${formatHours(totals.permitHours)}`
                        : formatDays(totals[kind])}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          </aside>
        </div>

        <section className="sheet overflow-hidden" aria-labelledby="my-history">
          <h2 id="my-history" className="px-5 py-3 text-[15px] font-semibold text-ink">
            Historial <span className="font-normal tabular-nums text-ink-3">{absences.length}</span>
          </h2>
          <AbsenceHistory
            absences={absences}
            rules={rules}
            holidays={holidaySet}
            caption="Mis ausencias"
            emptyMessage="Todavía no tienes vacaciones, licencias, ausencias ni permisos registrados."
            className="rounded-none border-x-0 border-b-0 shadow-none"
          />
        </section>
      </div>
    );
  };

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="Mis vacaciones"
        subtitle="Tus días de vacaciones, licencias, ausencias y permisos, como los registra tu empresa."
      />
      <div className="flex-1 px-4 py-5 sm:px-6">{body()}</div>
    </div>
  );
}

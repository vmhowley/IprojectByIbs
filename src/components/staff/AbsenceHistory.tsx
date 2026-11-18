import { EmployeeAbsence } from '../../types';
import { LeaveRules, absenceWorkDays, formatHours, toDay } from '../../utils/leave';
import { TableView } from '../views/TableView';
import { KIND, absenceRange, absenceTitle } from './labels';

interface AbsenceHistoryProps {
  absences: EmployeeAbsence[];
  rules: LeaveRules;
  holidays: ReadonlySet<string>;
  caption: string;
  /** Opens a record; without it rows are read-only. */
  onOpen?: (absence: EmployeeAbsence) => void;
  emptyMessage: string;
  className?: string;
}

/** Every absence of one person, newest first. */
export function AbsenceHistory({ absences, rules, holidays, caption, onOpen, emptyMessage, className }: AbsenceHistoryProps) {
  return (
    <TableView
      caption={caption}
      className={className}
      data={absences}
      onRowClick={onOpen}
      emptyMessage={emptyMessage}
      defaultSort={{ index: 1, dir: 'desc' }}
      columns={[
        {
          header: 'Tipo',
          sortValue: (a) => a.kind,
          cell: (a) => {
            const Icon = KIND[a.kind].icon;
            return (
              <div className="flex min-w-0 items-start gap-2">
                <Icon size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-3" />
                <div className="min-w-0">
                  {onOpen ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpen(a);
                      }}
                      className="text-left font-medium text-ink hover:underline"
                    >
                      {absenceTitle(a)}
                    </button>
                  ) : (
                    <p className="font-medium text-ink">{absenceTitle(a)}</p>
                  )}
                  {(!a.paid || a.note) && (
                    <p className="line-clamp-1 text-xs text-ink-3">
                      {!a.paid && 'Sin disfrute de salario'}
                      {!a.paid && a.note && ' · '}
                      {a.note}
                    </p>
                  )}
                </div>
              </div>
            );
          },
        },
        {
          header: 'Fechas',
          sortValue: (a) => a.start_date,
          cell: (a) => (
            <span className="whitespace-nowrap text-[13px] tabular-nums text-ink-2">
              {absenceRange(a)} {toDay(a.end_date).getFullYear()}
            </span>
          ),
        },
        {
          header: 'Días',
          align: 'right',
          sortValue: (a) => (a.hours != null ? Number(a.hours) / 24 : absenceWorkDays(a, rules, holidays)),
          cell: (a) => {
            if (a.hours != null) return <span className="text-[13px] tabular-nums text-ink">{formatHours(Number(a.hours))}</span>;
            const days = absenceWorkDays(a, rules, holidays);
            return <span className="text-[13px] tabular-nums text-ink">{days} {days === 1 ? 'día' : 'días'}</span>;
          },
        },
      ]}
    />
  );
}

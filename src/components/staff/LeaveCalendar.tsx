import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CSSProperties, useMemo } from 'react';
import { cn } from '../../lib/utils';
import { EmployeeAbsence } from '../../types';
import { hueFor } from '../../utils/format';
import { LeaveRules, absenceWorkDays, dayKey, formatHours } from '../../utils/leave';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { KIND, WEEKDAYS, absenceRange, absenceTitle, shortName } from './labels';

export interface CalendarEntry {
  absence: EmployeeAbsence;
  /** The employee's full name: it picks the entry's color and, in the team view, its text. */
  name: string;
}

interface LeaveCalendarProps {
  /** First day of the month on show. */
  month: Date;
  onMonthChange: (month: Date) => void;
  entries: CalendarEntry[];
  /** Holiday names by "YYYY-MM-DD". */
  holidays: ReadonlyMap<string, string>;
  rules: LeaveRules;
  loading?: boolean;
  /** Team view: entries say who is out. Own view: they say why. */
  showNames?: boolean;
  /** Opens an entry; without it entries are not buttons. */
  onEntryClick?: (absence: EmployeeAbsence) => void;
  /** Starts a new absence on a day; without it day numbers are not buttons. */
  onDayClick?: (day: Date) => void;
}

const monthTitle = new Intl.DateTimeFormat('es-DO', { month: 'long', year: 'numeric' });
const longDay = new Intl.DateTimeFormat('es-DO', { weekday: 'long', day: 'numeric', month: 'long' });

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * The month as a desk calendar: who is out each day, with holidays and days
 * off shaded. Below 768px it becomes the list of the month's absences.
 */
export function LeaveCalendar({
  month,
  onMonthChange,
  entries,
  holidays,
  rules,
  loading = false,
  showNames = true,
  onEntryClick,
  onDayClick,
}: LeaveCalendarProps) {
  // Six weeks starting on the Monday on or before the 1st.
  const days = useMemo(() => {
    const offset = (month.getDay() + 6) % 7;
    return Array.from(
      { length: 42 },
      (_, i) => new Date(month.getFullYear(), month.getMonth(), 1 - offset + i)
    );
  }, [month]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    const first = dayKey(days[0]);
    const last = dayKey(days[days.length - 1]);
    for (const entry of entries) {
      const { start_date, end_date } = entry.absence;
      if (end_date < first || start_date > last) continue;
      for (const day of days) {
        const key = dayKey(day);
        if (key >= start_date && key <= end_date) map.set(key, [...(map.get(key) || []), entry]);
      }
    }
    return map;
  }, [days, entries]);

  const monthStart = dayKey(month);
  const monthEnd = dayKey(new Date(month.getFullYear(), month.getMonth() + 1, 0));
  const monthEntries = entries
    .filter((entry) => entry.absence.end_date >= monthStart && entry.absence.start_date <= monthEnd)
    .sort((a, b) => a.absence.start_date.localeCompare(b.absence.start_date));
  const monthHolidays = [...holidays.entries()]
    .filter(([key]) => key >= monthStart && key <= monthEnd)
    .sort(([a], [b]) => a.localeCompare(b));

  const todayKey = dayKey(new Date());
  const title = capitalize(monthTitle.format(month));
  const shift = (delta: number) => onMonthChange(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  return (
    <section className="sheet min-w-0 overflow-hidden" aria-label={title}>
      <div className="flex items-center justify-between gap-3 border-b border-rule px-4 py-3">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onMonthChange(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
          >
            Hoy
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Mes anterior" onClick={() => shift(-1)}>
            <ChevronLeft size={18} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Mes siguiente" onClick={() => shift(1)}>
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      {/* Month grid, from 768px */}
      <div className="max-md:hidden">
        <div className="grid grid-cols-7 border-b border-rule bg-well">
          {WEEKDAYS.map((d) => (
            <div key={d.day} className="caption px-2 py-1.5">
              {d.short}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const key = dayKey(day);
            const inMonth = day.getMonth() === month.getMonth();
            const holiday = holidays.get(key);
            const off = !rules.work_days.includes(day.getDay()) || !!holiday;
            const isToday = key === todayKey;
            const dayEntries = byDay.get(key) || [];
            const number = (
              <span
                className={cn(
                  'inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs tabular-nums',
                  isToday ? 'bg-brand font-bold text-on-brand' : inMonth ? 'font-medium text-ink-2' : 'text-ink-3/70'
                )}
              >
                {day.getDate()}
              </span>
            );
            return (
              <div
                key={key}
                className={cn(
                  'min-h-[7.5rem] border-b border-r border-rule p-1.5 [&:nth-child(7n)]:border-r-0',
                  off && 'bg-well/70',
                  !inMonth && 'bg-desk/60'
                )}
              >
                <div className="mb-1 flex items-start justify-between gap-1 px-0.5">
                  {onDayClick ? (
                    <button
                      type="button"
                      onClick={() => onDayClick(day)}
                      aria-label={`Registrar ausencia el ${longDay.format(day)}`}
                      className="rounded-full hover:bg-ink/[0.06]"
                    >
                      {number}
                    </button>
                  ) : (
                    <span aria-label={isToday ? `Hoy, ${day.getDate()}` : undefined}>{number}</span>
                  )}
                  {holiday && (
                    <span className="mt-1 line-clamp-2 text-right text-[11px] font-medium leading-tight text-ink-3" title={holiday}>
                      {holiday}
                    </span>
                  )}
                </div>
                {loading ? (
                  index % 5 === 0 && <Skeleton className="h-4 w-4/5" />
                ) : (
                  <ul className="space-y-0.5">
                    {dayEntries.slice(0, 3).map((entry) => (
                      <li key={entry.absence.id}>
                        <EntryChip entry={entry} showName={showNames} onClick={onEntryClick} />
                      </li>
                    ))}
                    {dayEntries.length > 3 && (
                      <li className="px-1 text-[11px] font-medium text-ink-3">+{dayEntries.length - 3} más</li>
                    )}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* The month as a list, below 768px */}
      <div className="md:hidden">
        {loading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ) : monthEntries.length === 0 && monthHolidays.length === 0 ? (
          <p className="px-4 py-5 text-sm text-ink-3">Nadie tiene ausencias registradas este mes.</p>
        ) : (
          <ul className="divide-y divide-rule">
            {[
              ...monthHolidays.map(([key, name]) => ({ key, holiday: name, entry: null })),
              ...monthEntries.map((entry) => ({ key: entry.absence.start_date, holiday: null, entry })),
            ]
              .sort((a, b) => a.key.localeCompare(b.key))
              .map((item) =>
                item.entry ? (
                  <li key={item.entry.absence.id}>
                    <EntryRow entry={item.entry} showName={showNames} rules={rules} holidays={holidays} onClick={onEntryClick} />
                  </li>
                ) : (
                  <li key={`h-${item.key}`} className="flex items-center gap-2.5 bg-well/60 px-4 py-2.5 text-sm">
                    <span className="text-ink-2">
                      Feriado · {item.holiday}
                    </span>
                    <span className="ml-auto shrink-0 text-[13px] tabular-nums text-ink-3">
                      {absenceRange({ start_date: item.key, end_date: item.key })}
                    </span>
                  </li>
                )
              )}
          </ul>
        )}
      </div>
    </section>
  );
}

function entryLabel(entry: CalendarEntry, showName: boolean) {
  const what = absenceTitle(entry.absence);
  const hours = entry.absence.hours != null ? ` · ${formatHours(Number(entry.absence.hours))}` : '';
  return `${showName ? `${entry.name} · ` : ''}${what} · ${absenceRange(entry.absence)}${hours}`;
}

function EntryChip({
  entry,
  showName,
  onClick,
}: {
  entry: CalendarEntry;
  showName: boolean;
  onClick?: (absence: EmployeeAbsence) => void;
}) {
  const Icon = KIND[entry.absence.kind].icon;
  const label = entryLabel(entry, showName);
  const body = (
    <>
      <Icon size={11} aria-hidden="true" className="shrink-0" />
      <span className="truncate">{showName ? shortName(entry.name) : absenceTitle(entry.absence)}</span>
      {entry.absence.hours != null && (
        <span className="shrink-0 tabular-nums">{formatHours(Number(entry.absence.hours))}</span>
      )}
    </>
  );
  const className =
    'avatar-tint flex w-full items-center gap-1 rounded-inner px-1 py-0.5 text-left text-[11.5px] font-medium leading-tight';
  const style = { '--av-h': hueFor(entry.name) } as CSSProperties;
  if (!onClick) {
    return (
      <span title={label} style={style} className={className}>
        <span className="sr-only">{label}</span>
        <span aria-hidden="true" className="contents">{body}</span>
      </span>
    );
  }
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={() => onClick(entry.absence)}
      style={style}
      className={cn(className, 'transition-[filter] hover:brightness-95')}
    >
      {body}
    </button>
  );
}

function EntryRow({
  entry,
  showName,
  rules,
  holidays,
  onClick,
}: {
  entry: CalendarEntry;
  showName: boolean;
  rules: LeaveRules;
  holidays: ReadonlyMap<string, string>;
  onClick?: (absence: EmployeeAbsence) => void;
}) {
  const Icon = KIND[entry.absence.kind].icon;
  const days = absenceWorkDays(entry.absence, rules, new Set(holidays.keys()));
  const amount =
    entry.absence.hours != null ? formatHours(Number(entry.absence.hours)) : `${days} ${days === 1 ? 'día' : 'días'}`;
  const content = (
    <>
      {showName ? (
        <Avatar name={entry.name} size="xs" className="mt-0.5" />
      ) : (
        <Icon size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-3" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-ink">
          {showName ? entry.name : absenceTitle(entry.absence)}
        </span>
        <span className="block truncate text-xs text-ink-3">
          {showName && `${absenceTitle(entry.absence)} · `}
          {absenceRange(entry.absence)}
        </span>
      </span>
      <span className="shrink-0 pt-0.5 text-[13px] tabular-nums text-ink-2">{amount}</span>
    </>
  );
  if (!onClick) return <div className="flex items-start gap-2.5 px-4 py-2.5">{content}</div>;
  return (
    <button
      type="button"
      onClick={() => onClick(entry.absence)}
      className="flex w-full items-start gap-2.5 px-4 py-2.5 text-left hover:bg-ink/[0.03]"
    >
      {content}
    </button>
  );
}

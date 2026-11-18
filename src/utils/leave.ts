import { addDays, addYears, differenceInMonths, differenceInYears } from 'date-fns';
import { AbsenceKind, EmployeeAbsence, HrSettings } from '../types';

// Vacation and leave arithmetic of the staff register (Personal), so every view
// shows the same numbers. The defaults follow the Dominican Labor Code: 14
// working days of vacation a year from the first year of service and 18 from
// the fifth (art. 177); a part of a year earns 6 days at 5 months up to 12 days
// at 11 months (art. 180). Each organization can change the numbers.
// Days are calendar days ("YYYY-MM-DD") read as local dates. A day of service
// counts whole: a year that starts on 2 March is complete at the end of 1 March.

export type LeaveRules = Omit<HrSettings, 'organization_id'>;

export const DEFAULT_LEAVE_RULES: LeaveRules = {
  vacation_days: 14,
  vacation_days_senior: 18,
  senior_after_years: 5,
  proportional_from_months: 5,
  work_days: [1, 2, 3, 4, 5],
  daily_salary_divisor: 23.83,
};

/** The art. 180 scale is set for 14 days a year; other yearly numbers scale it. */
const SCALE_BASE_DAYS = 14;

/** A stored day ("YYYY-MM-DD") as a local date. */
export function toDay(value: string | Date): Date {
  if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** "YYYY-MM-DD" of a local date. */
export function dayKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function today(): Date {
  return toDay(new Date());
}

export function isWorkDay(date: Date, rules: Pick<LeaveRules, 'work_days'>, holidays: ReadonlySet<string>): boolean {
  return rules.work_days.includes(date.getDay()) && !holidays.has(dayKey(date));
}

/** Working days from start to end, both included. */
export function countWorkDays(
  start: string | Date,
  end: string | Date,
  rules: Pick<LeaveRules, 'work_days'>,
  holidays: ReadonlySet<string>
): number {
  const last = toDay(end);
  let count = 0;
  for (let day = toDay(start); day <= last; day = addDays(day, 1)) {
    if (isWorkDay(day, rules, holidays)) count += 1;
  }
  return count;
}

/** Working days an absence takes; a permit of some hours takes none. */
export function absenceWorkDays(
  absence: Pick<EmployeeAbsence, 'start_date' | 'end_date' | 'hours'>,
  rules: Pick<LeaveRules, 'work_days'>,
  holidays: ReadonlySet<string>
): number {
  return absence.hours != null ? 0 : countWorkDays(absence.start_date, absence.end_date, rules, holidays);
}

/** Full years of service at the end of `day`. */
export function serviceYears(hireDate: string | Date, day: Date): number {
  return Math.max(0, differenceInYears(addDays(day, 1), toDay(hireDate)));
}

/** Vacation days earned by the anniversary that completes year `year` of service. */
export function daysForServiceYear(year: number, rules: LeaveRules): number {
  return year >= rules.senior_after_years ? rules.vacation_days_senior : rules.vacation_days;
}

/** Vacation earned by `months` full months of year `year` of service (art. 180 scale). */
export function proportionalDays(months: number, year: number, rules: LeaveRules): number {
  if (months < rules.proportional_from_months || months > 11) return 0;
  return round2(((months + 1) * daysForServiceYear(year, rules)) / SCALE_BASE_DAYS);
}

export interface VacationSubject {
  hire_date: string;
  exit_date: string | null;
  vacation_opening_days: number;
  vacation_opening_date: string | null;
}

export interface VacationBalance {
  /** The day the balance is taken at: the exit date for someone who left before it. */
  asOf: Date;
  yearsOfService: number;
  /** Full months of the year of service in progress. */
  monthsInYear: number;
  /** Where the year of service in progress started: the last anniversary, or the hire date. */
  lastAnniversary: Date;
  nextAnniversary: Date;
  /** Days the next anniversary earns. */
  nextAnniversaryDays: number;
  openingDays: number;
  /** The day the balance starts: the opening date, or the hire date. */
  openingDate: Date;
  earned: number;
  /** Working days of vacation up to asOf. */
  taken: number;
  /** Working days of vacation after asOf and before any exit. */
  scheduled: number;
  /** openingDays + earned - taken - scheduled. Negative when days were advanced. */
  available: number;
}

export function vacationBalance(
  subject: VacationSubject,
  absences: EmployeeAbsence[],
  rules: LeaveRules,
  holidays: ReadonlySet<string>,
  asOf: Date = today()
): VacationBalance {
  const hire = toDay(subject.hire_date);
  const exit = subject.exit_date ? toDay(subject.exit_date) : null;
  const end = exit && exit < asOf ? exit : asOf;
  const openingDate = subject.vacation_opening_date ? toDay(subject.vacation_opening_date) : hire;
  const openingDays = Number(subject.vacation_opening_days) || 0;

  // Years completed before the opening day are inside the opening balance.
  const yearsAtOpening = serviceYears(hire, addDays(openingDate, -1));
  const years = end < hire ? 0 : serviceYears(hire, end);
  let earned = 0;
  for (let year = yearsAtOpening + 1; year <= years; year += 1) earned += daysForServiceYear(year, rules);

  let taken = 0;
  let scheduled = 0;
  for (const absence of absences) {
    if (absence.kind !== 'vacaciones') continue;
    const last = toDay(absence.end_date);
    for (let day = maxDate(toDay(absence.start_date), openingDate); day <= last; day = addDays(day, 1)) {
      if (!isWorkDay(day, rules, holidays)) continue;
      if (day <= end) taken += 1;
      else if (!exit || day <= exit) scheduled += 1;
    }
  }

  const lastAnniversary = addYears(hire, years);
  return {
    asOf: end,
    yearsOfService: years,
    monthsInYear: end < hire ? 0 : Math.max(0, differenceInMonths(addDays(end, 1), lastAnniversary)),
    lastAnniversary,
    nextAnniversary: addYears(hire, years + 1),
    nextAnniversaryDays: daysForServiceYear(years + 1, rules),
    openingDays,
    openingDate,
    earned,
    taken,
    scheduled,
    available: round2(openingDays + earned - taken - scheduled),
  };
}

export interface ExitSettlement {
  /** The balance at the end of the exit date. */
  balance: VacationBalance;
  /** Vacation earned by the year of service in progress. */
  proportional: number;
  /** What is available plus the proportional part. */
  owedDays: number;
  /** The monthly salary over the rules' divisor; null without a salary. */
  dailySalary: number | null;
  /** The days owed at the daily salary, never below zero; null without a salary. */
  amount: number | null;
}

/** Vacation owed at an exit on `exitDate`. Vacations planned after it do not count. */
export function exitSettlement(
  subject: VacationSubject,
  absences: EmployeeAbsence[],
  rules: LeaveRules,
  holidays: ReadonlySet<string>,
  exitDate: Date,
  monthlySalary: number | null
): ExitSettlement {
  const balance = vacationBalance({ ...subject, exit_date: dayKey(exitDate) }, absences, rules, holidays, exitDate);
  const proportional = proportionalDays(balance.monthsInYear, balance.yearsOfService + 1, rules);
  const owedDays = round2(balance.available + proportional);
  const dailySalary =
    monthlySalary != null && Number(monthlySalary) > 0 ? Number(monthlySalary) / rules.daily_salary_divisor : null;
  return {
    balance,
    proportional,
    owedDays,
    dailySalary: dailySalary != null ? round2(dailySalary) : null,
    amount: dailySalary != null ? round2(Math.max(0, owedDays) * dailySalary) : null,
  };
}

export type AbsenceTotals = Record<AbsenceKind, number> & {
  /** Hours of permits taken by the hour. */
  permitHours: number;
  /** Working days of absences without pay. */
  unpaid: number;
};

/** Working days per kind between two days, both included. Permits of some hours add hours. */
export function absenceTotals(
  absences: EmployeeAbsence[],
  rules: Pick<LeaveRules, 'work_days'>,
  holidays: ReadonlySet<string>,
  from: Date,
  to: Date
): AbsenceTotals {
  const totals: AbsenceTotals = { vacaciones: 0, licencia: 0, ausencia: 0, permiso: 0, permitHours: 0, unpaid: 0 };
  for (const absence of absences) {
    const start = toDay(absence.start_date);
    const end = toDay(absence.end_date);
    if (end < from || start > to) continue;
    if (absence.hours != null) {
      totals.permitHours += Number(absence.hours);
      continue;
    }
    const days = countWorkDays(maxDate(start, from), end < to ? end : to, rules, holidays);
    totals[absence.kind] += days;
    if (!absence.paid) totals.unpaid += days;
  }
  totals.permitHours = round2(totals.permitHours);
  return totals;
}

const dayCount = new Intl.NumberFormat('es-DO', { maximumFractionDigits: 2 });

/** "14 días", "1 día", "10.29 días". */
export function formatDays(days: number): string {
  return `${dayCount.format(days)} ${Math.abs(days) === 1 ? 'día' : 'días'}`;
}

/** "2 h", "1.5 h". */
export function formatHours(hours: number): string {
  return `${dayCount.format(hours)} h`;
}

/** "6 años y 7 meses", "8 meses", "menos de un mes". */
export function formatTenure(hireDate: string, day: Date = today()): string {
  const hire = toDay(hireDate);
  if (day < hire) return 'Aún no ingresa';
  const years = serviceYears(hire, day);
  const months = differenceInMonths(addDays(day, 1), addYears(hire, years));
  const parts: string[] = [];
  if (years) parts.push(`${years} ${years === 1 ? 'año' : 'años'}`);
  if (months) parts.push(`${months} ${months === 1 ? 'mes' : 'meses'}`);
  return parts.length ? parts.join(' y ') : 'Menos de un mes';
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function maxDate(a: Date, b: Date): Date {
  return a > b ? a : b;
}

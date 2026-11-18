// The staff register (Personal): employees, their absences and the leave rules
// of the organization. Only admins read employees and absences; an employee
// linked to an account reads their own through my_leave_record().

export type AbsenceKind = 'vacaciones' | 'licencia' | 'ausencia' | 'permiso';

export type LicenseType = 'medica' | 'maternidad' | 'paternidad' | 'matrimonio' | 'duelo' | 'estudios' | 'otra';

export type AbsenceType = 'justificada' | 'injustificada';

export type ExitType = 'despido' | 'desahucio' | 'dimision' | 'renuncia' | 'mutuo_acuerdo' | 'fin_contrato' | 'otro';

export interface Employee {
  id: string;
  organization_id: string;
  /** The employee's own account, if any: it lets them read their record. */
  user_id: string | null;
  full_name: string;
  national_id: string | null;
  position: string | null;
  department: string | null;
  email: string | null;
  /** Calendar day, "YYYY-MM-DD". */
  hire_date: string;
  monthly_salary: number | null;
  currency: string;
  /** Vacation days still owed at the start of vacation_opening_date. */
  vacation_opening_days: number;
  /** Without it the balance starts at zero on the hire date. */
  vacation_opening_date: string | null;
  exit_date: string | null;
  exit_type: ExitType | null;
  exit_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type EmployeeInput = Omit<Employee, 'id' | 'organization_id' | 'created_at' | 'updated_at'>;

/** What an employee reads about themselves: no salary, ID number, email or notes. */
export type OwnEmployeeRecord = Pick<
  Employee,
  'id' | 'full_name' | 'position' | 'department' | 'hire_date' | 'exit_date' | 'vacation_opening_days' | 'vacation_opening_date'
>;

export interface EmployeeAbsence {
  id: string;
  employee_id: string;
  kind: AbsenceKind;
  /** The kind of leave (licencia) or absence (ausencia); null for vacations and permits. */
  leave_type: LicenseType | AbsenceType | null;
  start_date: string;
  end_date: string;
  /** A permit of some hours inside one day. */
  hours: number | null;
  paid: boolean;
  /** Admins only: an employee's own record leaves it out. */
  note?: string | null;
  created_at?: string;
}

export type AbsenceInput = Omit<EmployeeAbsence, 'id' | 'created_at'>;

export interface HrSettings {
  organization_id: string;
  vacation_days: number;
  vacation_days_senior: number;
  senior_after_years: number;
  proportional_from_months: number;
  /** 0 is Sunday, 6 is Saturday. */
  work_days: number[];
  daily_salary_divisor: number;
}

export interface HrHoliday {
  id: string;
  date: string;
  name: string;
}

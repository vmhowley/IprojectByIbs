import {
  AbsenceInput,
  Employee,
  EmployeeAbsence,
  EmployeeInput,
  HrHoliday,
  HrSettings,
  OwnEmployeeRecord,
} from '../types';
import { supabase } from './api';

// The staff register of the signed-in account's organization. Admins read and
// write everything; every member reads the leave rules and the holidays, and
// an employee linked to an account reads their own record with myRecord().

export interface OwnLeaveRecord {
  employee: OwnEmployeeRecord;
  absences: EmployeeAbsence[];
}

const ABSENCE_COLUMNS = 'id, employee_id, kind, leave_type, start_date, end_date, hours, paid, note, created_at';
const SETTINGS_COLUMNS =
  'organization_id, vacation_days, vacation_days_senior, senior_after_years, proportional_from_months, work_days, daily_salary_divisor';

export const staffService = {
  /** Null while the organization keeps the default rules. */
  async getSettings(): Promise<HrSettings | null> {
    const { data, error } = await supabase.from('hr_settings').select(SETTINGS_COLUMNS).maybeSingle();
    if (error) throw error;
    return data as HrSettings | null;
  },

  async saveSettings(settings: HrSettings): Promise<HrSettings> {
    const { data, error } = await supabase
      .from('hr_settings')
      .upsert(settings, { onConflict: 'organization_id' })
      .select(SETTINGS_COLUMNS)
      .single();
    if (error) throw error;
    return data as HrSettings;
  },

  async getHolidays(): Promise<HrHoliday[]> {
    const { data, error } = await supabase.from('hr_holidays').select('id, date, name').order('date');
    if (error) throw error;
    return (data || []) as HrHoliday[];
  },

  async addHoliday(date: string, name: string): Promise<HrHoliday> {
    const { data, error } = await supabase
      .from('hr_holidays')
      .insert({ date, name: name.trim() })
      .select('id, date, name')
      .single();
    if (error) throw error;
    return data as HrHoliday;
  },

  async removeHoliday(id: string): Promise<void> {
    const { error } = await supabase.from('hr_holidays').delete().eq('id', id);
    if (error) throw error;
  },

  async getEmployees(): Promise<Employee[]> {
    const { data, error } = await supabase.from('employees').select('*').order('full_name');
    if (error) throw error;
    return (data || []) as Employee[];
  },

  async createEmployee(input: EmployeeInput): Promise<Employee> {
    const { data, error } = await supabase.from('employees').insert(input).select('*').single();
    if (error) throw error;
    return data as Employee;
  },

  async updateEmployee(id: string, changes: Partial<EmployeeInput>): Promise<Employee> {
    const { data, error } = await supabase.from('employees').update(changes).eq('id', id).select('*').single();
    if (error) throw error;
    return data as Employee;
  },

  /** Deletes the employee and every absence recorded for them. */
  async deleteEmployee(id: string): Promise<void> {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) throw error;
  },

  async getAbsences(): Promise<EmployeeAbsence[]> {
    const { data, error } = await supabase.from('employee_absences').select(ABSENCE_COLUMNS).order('start_date');
    if (error) throw error;
    return (data || []) as EmployeeAbsence[];
  },

  async createAbsence(input: AbsenceInput): Promise<EmployeeAbsence> {
    const { data, error } = await supabase.from('employee_absences').insert(input).select(ABSENCE_COLUMNS).single();
    if (error) throw error;
    return data as EmployeeAbsence;
  },

  async updateAbsence(id: string, changes: Partial<AbsenceInput>): Promise<EmployeeAbsence> {
    const { data, error } = await supabase
      .from('employee_absences')
      .update(changes)
      .eq('id', id)
      .select(ABSENCE_COLUMNS)
      .single();
    if (error) throw error;
    return data as EmployeeAbsence;
  },

  async deleteAbsence(id: string): Promise<void> {
    const { error } = await supabase.from('employee_absences').delete().eq('id', id);
    if (error) throw error;
  },

  /** The signed-in account's own record; null when it is not linked to an employee. */
  async myRecord(): Promise<OwnLeaveRecord | null> {
    const { data, error } = await supabase.rpc('my_leave_record');
    if (error) throw error;
    return (data as OwnLeaveRecord | null) ?? null;
  },
};

-- ==============================================================================
-- STAFF LEAVE
-- Each organization keeps a register of its employees, with or without an
-- ibPulse account, and of their vacations, leaves, absences, permits and exits.
-- * Vacation rules default to the Dominican Labor Code: 14 working days a year
--   from the first year of service and 18 from the fifth (art. 177), and a
--   proportional part from five months of service (art. 180). Each
--   organization can change these numbers, its working days and its holidays.
-- * Only the organization's admins see and edit the register, salaries
--   included.
-- * An employee linked to an account reads their own record and absences
--   through my_leave_record(), without salary, ID number, email or notes.
-- * The app computes balances from these rows; the database stores none.
-- Requires 20261105123000_organizations.sql. Rollback:
-- supabase/rollback/20261117120000_staff_leave_rollback.sql
-- ==============================================================================

DO $$
BEGIN
  IF to_regclass('public.organizations') IS NULL
     OR to_regprocedure('public.my_org_id()') IS NULL
     OR to_regprocedure('public.is_tenant_admin()') IS NULL
     OR to_regprocedure('public.is_colleague(uuid)') IS NULL THEN
    RAISE EXCEPTION 'Apply 20261105123000_organizations.sql first';
  END IF;

  -- CREATE TABLE IF NOT EXISTS would keep a table of the same name built for
  -- something else.
  IF (to_regclass('public.employees') IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'vacation_opening_days'))
     OR (to_regclass('public.employee_absences') IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'employee_absences' AND column_name = 'leave_type')) THEN
    RAISE EXCEPTION 'public.employees or public.employee_absences already exists with another structure';
  END IF;
END $$;


-- ------------------------------------------------------------------------------
-- 1. SCHEMA
-- ------------------------------------------------------------------------------

-- One row per organization. Without it the app uses these same defaults.
CREATE TABLE IF NOT EXISTS public.hr_settings (
  organization_id uuid PRIMARY KEY DEFAULT public.my_org_id()
    REFERENCES public.organizations(id) ON DELETE CASCADE,
  -- Working days of vacation per year of service.
  vacation_days smallint NOT NULL DEFAULT 14 CHECK (vacation_days BETWEEN 1 AND 60),
  vacation_days_senior smallint NOT NULL DEFAULT 18 CHECK (vacation_days_senior BETWEEN 1 AND 60),
  senior_after_years smallint NOT NULL DEFAULT 5 CHECK (senior_after_years BETWEEN 1 AND 50),
  -- A part of a year earns vacation from this many months, on the art. 180
  -- scale: 6 days at 5 months up to 12 days at 11 months.
  proportional_from_months smallint NOT NULL DEFAULT 5 CHECK (proportional_from_months BETWEEN 1 AND 11),
  -- Days of the week that count as working days: 0 is Sunday, 6 is Saturday.
  work_days smallint[] NOT NULL DEFAULT '{1,2,3,4,5}'
    CHECK (cardinality(work_days) BETWEEN 1 AND 7 AND work_days <@ '{0,1,2,3,4,5,6}'::smallint[]),
  -- The monthly salary divided by this is the daily salary of an exit estimate.
  daily_salary_divisor numeric(5,2) NOT NULL DEFAULT 23.83 CHECK (daily_salary_divisor BETWEEN 1 AND 31),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Days off for the whole organization. Admins enter them; none are preloaded.
CREATE TABLE IF NOT EXISTS public.hr_holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL DEFAULT public.my_org_id()
    REFERENCES public.organizations(id) ON DELETE CASCADE,
  date date NOT NULL,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hr_holidays_one_per_day UNIQUE (organization_id, date)
);

CREATE TABLE IF NOT EXISTS public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL DEFAULT public.my_org_id()
    REFERENCES public.organizations(id) ON DELETE CASCADE,
  -- The employee's own account, if any: it lets them read their record.
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL CHECK (char_length(btrim(full_name)) BETWEEN 1 AND 160),
  national_id text CHECK (char_length(national_id) <= 40),
  position text CHECK (char_length(position) <= 120),
  department text CHECK (char_length(department) <= 120),
  email text CHECK (email = lower(btrim(email)) AND email LIKE '_%@_%'),
  hire_date date NOT NULL,
  monthly_salary numeric(14,2) CHECK (monthly_salary >= 0),
  currency text NOT NULL DEFAULT 'DOP' CHECK (currency ~ '^[A-Z]{3}$'),
  -- Vacation days still owed when the register started, as of that date.
  -- Without a date the balance starts at zero on the hire date.
  vacation_opening_days numeric(6,2) NOT NULL DEFAULT 0 CHECK (vacation_opening_days BETWEEN -365 AND 365),
  vacation_opening_date date,
  exit_date date,
  exit_type text CHECK (exit_type IN (
    'despido', 'desahucio', 'dimision', 'renuncia', 'mutuo_acuerdo', 'fin_contrato', 'otro'
  )),
  exit_reason text CHECK (char_length(exit_reason) <= 2000),
  notes text CHECK (char_length(notes) <= 4000),
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT employees_one_per_account UNIQUE (organization_id, user_id),
  -- Lets an absence require an employee of its own organization.
  CONSTRAINT employees_id_organization UNIQUE (id, organization_id),
  CONSTRAINT employees_exit_complete CHECK ((exit_date IS NULL) = (exit_type IS NULL)),
  CONSTRAINT employees_exit_after_hire CHECK (exit_date >= hire_date),
  CONSTRAINT employees_opening_after_hire CHECK (vacation_opening_date >= hire_date)
);
CREATE INDEX IF NOT EXISTS idx_employees_organization_id ON public.employees (organization_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees (user_id) WHERE user_id IS NOT NULL;

-- Vacations, leaves (licencias), absences and permits, in whole days; a permit
-- can instead take some hours of one day.
CREATE TABLE IF NOT EXISTS public.employee_absences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL DEFAULT public.my_org_id(),
  employee_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('vacaciones', 'licencia', 'ausencia', 'permiso')),
  leave_type text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  hours numeric(4,2) CHECK (hours > 0 AND hours <= 24),
  paid boolean NOT NULL DEFAULT true,
  note text CHECK (char_length(note) <= 2000),
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT employee_absences_employee_fkey FOREIGN KEY (employee_id, organization_id)
    REFERENCES public.employees (id, organization_id) ON DELETE CASCADE,
  CONSTRAINT employee_absences_dates CHECK (end_date >= start_date),
  CONSTRAINT employee_absences_hours_one_day CHECK (hours IS NULL OR (kind = 'permiso' AND start_date = end_date)),
  CONSTRAINT employee_absences_leave_type CHECK (
    (kind = 'licencia' AND leave_type IS NOT NULL
      AND leave_type IN ('medica', 'maternidad', 'paternidad', 'matrimonio', 'duelo', 'estudios', 'otra'))
    OR (kind = 'ausencia' AND leave_type IS NOT NULL AND leave_type IN ('justificada', 'injustificada'))
    OR (kind IN ('vacaciones', 'permiso') AND leave_type IS NULL)
  )
);
CREATE INDEX IF NOT EXISTS idx_employee_absences_employee ON public.employee_absences (employee_id, start_date);
CREATE INDEX IF NOT EXISTS idx_employee_absences_organization ON public.employee_absences (organization_id, start_date);


-- ------------------------------------------------------------------------------
-- 2. GUARDS
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.hr_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS hr_settings_updated_at ON public.hr_settings;
CREATE TRIGGER hr_settings_updated_at
BEFORE UPDATE ON public.hr_settings
FOR EACH ROW EXECUTE FUNCTION public.hr_set_updated_at();

DROP TRIGGER IF EXISTS employees_updated_at ON public.employees;
CREATE TRIGGER employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.hr_set_updated_at();

-- An absence falls inside the employment, and it overlaps no other absence of
-- the same employee, so no day is counted twice. Only permits of some hours
-- can share a day. It runs as the admin who writes, who sees every employee
-- and absence of the organization.
CREATE OR REPLACE FUNCTION public.guard_employee_absence()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_hire date;
  v_exit date;
BEGIN
  SELECT hire_date, exit_date INTO v_hire, v_exit
  FROM public.employees
  WHERE id = NEW.employee_id;

  IF NEW.start_date < v_hire OR NEW.end_date > v_exit THEN
    RAISE EXCEPTION 'The absence falls outside the employment dates' USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.employee_absences a
    WHERE a.employee_id = NEW.employee_id
      AND a.id <> NEW.id
      AND a.start_date <= NEW.end_date
      AND a.end_date >= NEW.start_date
      AND (a.hours IS NULL OR NEW.hours IS NULL)
  ) THEN
    RAISE EXCEPTION 'The absence overlaps another absence of the same employee' USING ERRCODE = '23P01';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS guard_employee_absence ON public.employee_absences;
CREATE TRIGGER guard_employee_absence
BEFORE INSERT OR UPDATE ON public.employee_absences
FOR EACH ROW EXECUTE FUNCTION public.guard_employee_absence();


-- ------------------------------------------------------------------------------
-- 3. THE EMPLOYEE'S OWN RECORD
-- ------------------------------------------------------------------------------

-- NULL when the signed-in account is not linked to an employee of its
-- organization.
CREATE OR REPLACE FUNCTION public.my_leave_record()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'employee', jsonb_build_object(
      'id', e.id,
      'full_name', e.full_name,
      'position', e.position,
      'department', e.department,
      'hire_date', e.hire_date,
      'exit_date', e.exit_date,
      'vacation_opening_days', e.vacation_opening_days,
      'vacation_opening_date', e.vacation_opening_date
    ),
    'absences', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', a.id,
        'employee_id', a.employee_id,
        'kind', a.kind,
        'leave_type', a.leave_type,
        'start_date', a.start_date,
        'end_date', a.end_date,
        'hours', a.hours,
        'paid', a.paid
      ) ORDER BY a.start_date)
      FROM public.employee_absences a
      WHERE a.employee_id = e.id
    ), '[]'::jsonb)
  )
  FROM public.employees e
  WHERE e.user_id = auth.uid()
    AND e.organization_id = public.my_org_id();
$$;
REVOKE EXECUTE ON FUNCTION public.my_leave_record() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_leave_record() TO authenticated;


-- ------------------------------------------------------------------------------
-- 4. ACCESS
-- ------------------------------------------------------------------------------

ALTER TABLE public.hr_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_absences ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.hr_settings, public.hr_holidays, public.employees, public.employee_absences
  FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.hr_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_holidays, public.employees, public.employee_absences
  TO authenticated;

-- A re-run recreates the policies of these tables.
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('hr_settings', 'hr_holidays', 'employees', 'employee_absences')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- Every member reads the rules and the holidays: they shape their own calendar.
CREATE POLICY "Members read the leave rules" ON public.hr_settings
FOR SELECT TO authenticated
USING (organization_id = (SELECT public.my_org_id()));

CREATE POLICY "Admins set the leave rules" ON public.hr_settings
FOR INSERT TO authenticated
WITH CHECK (organization_id = (SELECT public.my_org_id()) AND (SELECT public.is_tenant_admin()));

CREATE POLICY "Admins change the leave rules" ON public.hr_settings
FOR UPDATE TO authenticated
USING (organization_id = (SELECT public.my_org_id()) AND (SELECT public.is_tenant_admin()))
WITH CHECK (organization_id = (SELECT public.my_org_id()) AND (SELECT public.is_tenant_admin()));

CREATE POLICY "Members read the holidays" ON public.hr_holidays
FOR SELECT TO authenticated
USING (organization_id = (SELECT public.my_org_id()));

CREATE POLICY "Admins manage the holidays" ON public.hr_holidays
FOR ALL TO authenticated
USING (organization_id = (SELECT public.my_org_id()) AND (SELECT public.is_tenant_admin()))
WITH CHECK (organization_id = (SELECT public.my_org_id()) AND (SELECT public.is_tenant_admin()));

-- An employee can be linked only to an account of the same organization.
CREATE POLICY "Admins manage employees" ON public.employees
FOR ALL TO authenticated
USING (organization_id = (SELECT public.my_org_id()) AND (SELECT public.is_tenant_admin()))
WITH CHECK (
  organization_id = (SELECT public.my_org_id())
  AND (SELECT public.is_tenant_admin())
  AND (user_id IS NULL OR public.is_colleague(user_id))
);

CREATE POLICY "Admins manage absences" ON public.employee_absences
FOR ALL TO authenticated
USING (organization_id = (SELECT public.my_org_id()) AND (SELECT public.is_tenant_admin()))
WITH CHECK (organization_id = (SELECT public.my_org_id()) AND (SELECT public.is_tenant_admin()));

NOTIFY pgrst, 'reload schema';

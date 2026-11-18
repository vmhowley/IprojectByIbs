-- ==============================================================================
-- ROLLBACK OF 20261117120000_staff_leave.sql
-- Closes the staff register to the app and keeps its data: the tables stay,
-- without policies or grants, so only the database owner reads them.
-- Running 20261117120000_staff_leave.sql again opens them as before.
-- To delete the data as well, after a backup:
--   DROP TABLE public.employee_absences, public.employees, public.hr_holidays, public.hr_settings;
-- ==============================================================================

DROP FUNCTION IF EXISTS public.my_leave_record();

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

  IF to_regclass('public.employee_absences') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS guard_employee_absence ON public.employee_absences;
    REVOKE ALL ON public.employee_absences FROM anon, authenticated;
  END IF;
  IF to_regclass('public.employees') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS employees_updated_at ON public.employees;
    REVOKE ALL ON public.employees FROM anon, authenticated;
  END IF;
  IF to_regclass('public.hr_settings') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS hr_settings_updated_at ON public.hr_settings;
    REVOKE ALL ON public.hr_settings FROM anon, authenticated;
  END IF;
  IF to_regclass('public.hr_holidays') IS NOT NULL THEN
    REVOKE ALL ON public.hr_holidays FROM anon, authenticated;
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.guard_employee_absence();
DROP FUNCTION IF EXISTS public.hr_set_updated_at();

NOTIFY pgrst, 'reload schema';

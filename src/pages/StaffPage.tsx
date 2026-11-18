import { CalendarDays, CalendarPlus, IdCard, SlidersHorizontal, UserPlus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { AbsenceModal } from '../components/staff/AbsenceModal';
import { EmployeeDetail } from '../components/staff/EmployeeDetail';
import { EmployeeModal } from '../components/staff/EmployeeModal';
import { EmployeesRegister } from '../components/staff/EmployeesRegister';
import { ExitModal } from '../components/staff/ExitModal';
import { KIND, KIND_ORDER, plural } from '../components/staff/labels';
import { CalendarEntry, LeaveCalendar } from '../components/staff/LeaveCalendar';
import { MyLeave } from '../components/staff/MyLeave';
import { RulesPanel } from '../components/staff/RulesPanel';
import { TeamSide } from '../components/staff/TeamSide';
import { confirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Select } from '../components/ui/Select';
import { Tabs, tabPanelProps } from '../components/ui/Tabs';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import { organizationService } from '../services/organizationService';
import { staffService } from '../services/staffService';
import { AbsenceKind, Employee, EmployeeAbsence, HrHoliday, HrSettings, UserProfile } from '../types';
import { dbErrorMessage } from '../utils/errors';
import { DEFAULT_LEAVE_RULES, LeaveRules, dayKey } from '../utils/leave';

type Tab = 'calendario' | 'empleados' | 'reglas';
const TABS: Tab[] = ['calendario', 'empleados', 'reglas'];

/** Personal: admins keep the staff register; everyone else sees their own vacations. */
export function StaffPage() {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === 'admin' ? <StaffRegister /> : <MyLeave />;
}

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  return list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];
}

function StaffRegister() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab: Tab = TABS.includes(params.get('tab') as Tab) ? (params.get('tab') as Tab) : 'calendario';
  const selectedId = params.get('empleado');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [absences, setAbsences] = useState<EmployeeAbsence[]>([]);
  const [settings, setSettings] = useState<HrSettings | null>(null);
  const [holidays, setHolidays] = useState<HrHoliday[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [kinds, setKinds] = useState<Record<AbsenceKind, boolean>>({
    vacaciones: true,
    licencia: true,
    ausencia: true,
    permiso: true,
  });
  const [who, setWho] = useState('');

  const [absenceModal, setAbsenceModal] = useState<{
    absence?: EmployeeAbsence;
    defaults?: { employeeId?: string; date?: string };
  } | null>(null);
  const [employeeModal, setEmployeeModal] = useState<{ employee?: Employee } | null>(null);
  const [exitFor, setExitFor] = useState<Employee | null>(null);

  useEffect(() => {
    Promise.all([
      staffService.getEmployees(),
      staffService.getAbsences(),
      staffService.getSettings(),
      staffService.getHolidays(),
    ])
      .then(([e, a, s, h]) => {
        setEmployees(e);
        setAbsences(a);
        setSettings(s);
        setHolidays(h);
      })
      .catch((err) => setLoadError(dbErrorMessage(err, 'No se pudo cargar el registro de personal.')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user?.organization_id) return;
    organizationService
      .getMembers(user.organization_id)
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [user?.organization_id]);

  const rules = useMemo<LeaveRules>(
    () =>
      settings
        ? {
            vacation_days: settings.vacation_days,
            vacation_days_senior: settings.vacation_days_senior,
            senior_after_years: settings.senior_after_years,
            proportional_from_months: settings.proportional_from_months,
            work_days: settings.work_days,
            daily_salary_divisor: Number(settings.daily_salary_divisor),
          }
        : DEFAULT_LEAVE_RULES,
    [settings]
  );
  const holidaySet = useMemo(() => new Set(holidays.map((h) => h.date)), [holidays]);
  const holidayMap = useMemo(() => new Map(holidays.map((h) => [h.date, h.name])), [holidays]);
  const names = useMemo(() => new Map(employees.map((e) => [e.id, e.full_name])), [employees]);
  const entries = useMemo<CalendarEntry[]>(
    () =>
      absences
        .filter((a) => kinds[a.kind] && (!who || a.employee_id === who))
        .map((a) => ({ absence: a, name: names.get(a.employee_id) || 'Empleado' })),
    [absences, kinds, who, names]
  );

  const selected = selectedId ? employees.find((e) => e.id === selectedId) || null : null;
  const activeCount = employees.filter((e) => !e.exit_date).length;

  const showTab = (next: Tab) => setParams(next === 'calendario' ? {} : { tab: next });
  const openEmployee = (employee: Employee) => setParams({ tab: 'empleados', empleado: employee.id });
  const closeEmployee = () => setParams({ tab: 'empleados' });

  const deleteEmployee = async (employee: Employee) => {
    const count = absences.filter((a) => a.employee_id === employee.id).length;
    const ok = await confirmDialog({
      title: 'Eliminar del registro',
      message: (
        <>
          Se borra a <strong className="text-ink">{employee.full_name}</strong>
          {count ? ` y ${plural(count, 'ausencia registrada', 'ausencias registradas')}` : ''}. No se puede deshacer. Si salió
          de la empresa, mejor usa «Registrar salida» para conservar su historial.
        </>
      ),
      confirmText: 'Eliminar',
    });
    if (!ok) return;
    try {
      await staffService.deleteEmployee(employee.id);
      setEmployees((list) => list.filter((e) => e.id !== employee.id));
      setAbsences((list) => list.filter((a) => a.employee_id !== employee.id));
      closeEmployee();
      toast.success(`${employee.full_name} ya no está en el registro`);
    } catch (err) {
      toast.error(dbErrorMessage(err, 'No se pudo eliminar. Inténtalo de nuevo.'));
    }
  };

  const newAbsence = (defaults?: { employeeId?: string; date?: string }) => setAbsenceModal({ defaults });

  const actions =
    tab === 'reglas' || loadError
      ? []
      : employees.length === 0
        ? [{ label: 'Nuevo empleado', icon: UserPlus, onClick: () => setEmployeeModal({}) }]
        : [
            { label: 'Nuevo empleado', icon: UserPlus, onClick: () => setEmployeeModal({}), variant: 'secondary' as const },
            {
              label: 'Registrar ausencia',
              icon: CalendarPlus,
              onClick: () => newAbsence(selected && !selected.exit_date ? { employeeId: selected.id } : who ? { employeeId: who } : undefined),
            },
          ];

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="Personal"
        subtitle="Vacaciones, licencias, ausencias, permisos y salidas del equipo, con los días calculados según el Código de Trabajo."
        actions={actions}
        tabs={
          <Tabs
            label="Secciones de personal"
            idBase="staff"
            active={tab}
            onChange={showTab}
            tabs={[
              { id: 'calendario', label: 'Calendario', icon: CalendarDays },
              { id: 'empleados', label: 'Empleados', icon: IdCard, count: loading ? undefined : activeCount },
              { id: 'reglas', label: 'Reglas y feriados', icon: SlidersHorizontal },
            ]}
          />
        }
      />

      <div className="flex-1 px-4 py-5 sm:px-6">
        {loadError ? (
          <EmptyState icon={IdCard} title="No se pudo abrir el registro de personal">
            {loadError}
          </EmptyState>
        ) : (
          <>
            {tab === 'calendario' && (
              <div {...tabPanelProps('staff', 'calendario')} className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Mostrar">
                    {KIND_ORDER.map((kind) => {
                      const Icon = KIND[kind].icon;
                      return (
                        <button
                          key={kind}
                          type="button"
                          aria-pressed={kinds[kind]}
                          onClick={() => setKinds((k) => ({ ...k, [kind]: !k[kind] }))}
                          className={cn(
                            'inline-flex h-8 items-center gap-1.5 rounded-control border px-2.5 text-[13px] font-medium transition-colors',
                            kinds[kind] ? 'border-ink/70 bg-paper text-ink' : 'border-rule text-ink-3 hover:text-ink-2'
                          )}
                        >
                          <Icon size={14} aria-hidden="true" />
                          {KIND[kind].plural}
                        </button>
                      );
                    })}
                    <Select
                      aria-label="Persona"
                      value={who}
                      onChange={(e) => setWho(e.target.value)}
                      wrapperClassName="w-auto sm:ml-auto"
                      className="h-8 py-0 text-[13px]"
                    >
                      <option value="">Todo el equipo</option>
                      {employees.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.full_name}
                          {e.exit_date ? ' (de baja)' : ''}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <LeaveCalendar
                    month={month}
                    onMonthChange={setMonth}
                    entries={entries}
                    holidays={holidayMap}
                    rules={rules}
                    loading={loading}
                    onEntryClick={(absence) => setAbsenceModal({ absence })}
                    onDayClick={
                      activeCount > 0 ? (day) => newAbsence({ date: dayKey(day), employeeId: who || undefined }) : undefined
                    }
                  />
                </div>
                <TeamSide
                  employees={employees}
                  absences={absences}
                  rules={rules}
                  holidays={holidaySet}
                  loading={loading}
                  onOpenAbsence={(absence) => setAbsenceModal({ absence })}
                  onOpenEmployee={openEmployee}
                />
              </div>
            )}

            {tab === 'empleados' && (
              <div {...tabPanelProps('staff', 'empleados')}>
                {selectedId && !loading && !selected ? (
                  <EmptyState icon={IdCard} title="No encontramos a esa persona">
                    Puede que se haya eliminado del registro.
                  </EmptyState>
                ) : selected ? (
                  <EmployeeDetail
                    employee={selected}
                    absences={absences.filter((a) => a.employee_id === selected.id)}
                    rules={rules}
                    holidays={holidaySet}
                    accountName={members.find((m) => m.id === selected.user_id)?.name || null}
                    onBack={closeEmployee}
                    onEdit={() => setEmployeeModal({ employee: selected })}
                    onExit={() => setExitFor(selected)}
                    onDelete={() => deleteEmployee(selected)}
                    onNewAbsence={() => newAbsence({ employeeId: selected.id })}
                    onOpenAbsence={(absence) => setAbsenceModal({ absence })}
                  />
                ) : (
                  <EmployeesRegister
                    employees={employees}
                    absences={absences}
                    rules={rules}
                    holidays={holidaySet}
                    loading={loading}
                    onOpen={openEmployee}
                    onNew={() => setEmployeeModal({})}
                  />
                )}
              </div>
            )}

            {tab === 'reglas' && (
              <div {...tabPanelProps('staff', 'reglas')}>
                {user?.organization_id ? (
                  <RulesPanel
                    organizationId={user.organization_id}
                    rules={rules}
                    holidays={holidays}
                    onRulesSaved={setSettings}
                    onHolidaysChange={setHolidays}
                  />
                ) : (
                  <EmptyState icon={SlidersHorizontal} title="Tu cuenta aún no tiene equipo">
                    Confirma tu correo y vuelve a entrar para ajustar las reglas.
                  </EmptyState>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <AbsenceModal
        isOpen={!!absenceModal}
        onClose={() => setAbsenceModal(null)}
        employees={employees}
        absences={absences}
        rules={rules}
        holidays={holidaySet}
        absence={absenceModal?.absence}
        defaults={absenceModal?.defaults}
        onSaved={(saved) => {
          setAbsences((list) => upsert(list, saved));
          setAbsenceModal(null);
        }}
        onDeleted={(id) => {
          setAbsences((list) => list.filter((a) => a.id !== id));
          setAbsenceModal(null);
        }}
      />

      <EmployeeModal
        isOpen={!!employeeModal}
        onClose={() => setEmployeeModal(null)}
        employee={employeeModal?.employee}
        employees={employees}
        onSaved={(saved) => {
          const isNew = !employeeModal?.employee;
          setEmployees((list) => upsert(list, saved).sort((a, b) => a.full_name.localeCompare(b.full_name, 'es')));
          setEmployeeModal(null);
          if (isNew) openEmployee(saved);
        }}
      />

      {exitFor && (
        <ExitModal
          isOpen
          onClose={() => setExitFor(null)}
          employee={exitFor}
          absences={absences.filter((a) => a.employee_id === exitFor.id)}
          rules={rules}
          holidays={holidaySet}
          onSaved={(saved) => {
            setEmployees((list) => upsert(list, saved));
            setExitFor(null);
          }}
        />
      )}
    </div>
  );
}

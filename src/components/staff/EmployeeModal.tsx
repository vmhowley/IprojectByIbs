import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { organizationService } from '../../services/organizationService';
import { staffService } from '../../services/staffService';
import { Employee, EmployeeInput, UserProfile } from '../../types';
import { dbErrorMessage } from '../../utils/errors';
import { CURRENCY_OPTIONS } from '../project/NewProjectModal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The employee to edit; a new one without it. */
  employee?: Employee | null;
  /** Every employee of the register: an account links to one of them at most. */
  employees: Employee[];
  onSaved: (employee: Employee) => void;
}

interface Draft {
  full_name: string;
  national_id: string;
  position: string;
  department: string;
  email: string;
  hire_date: string;
  monthly_salary: string;
  currency: string;
  user_id: string;
  opening_days: string;
  opening_date: string;
  notes: string;
}

function initialDraft(employee: Employee | null | undefined): Draft {
  return {
    full_name: employee?.full_name || '',
    national_id: employee?.national_id || '',
    position: employee?.position || '',
    department: employee?.department || '',
    email: employee?.email || '',
    hire_date: employee?.hire_date || '',
    monthly_salary: employee?.monthly_salary != null ? String(employee.monthly_salary) : '',
    currency: employee?.currency || 'DOP',
    user_id: employee?.user_id || '',
    opening_days: employee?.vacation_opening_date ? String(employee.vacation_opening_days) : '',
    opening_date: employee?.vacation_opening_date || '',
    notes: employee?.notes || '',
  };
}

const orNull = (value: string) => value.trim() || null;

/** Adds or edits a person of the register. Exits have their own form. */
export function EmployeeModal({ isOpen, onClose, employee, employees, onSaved }: EmployeeModalProps) {
  const { user } = useAuth();
  const [draft, setDraft] = useState<Draft>(() => initialDraft(employee));
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setDraft(initialDraft(employee));
    setError('');
    if (user?.organization_id) {
      organizationService
        .getMembers(user.organization_id)
        .then(setMembers)
        .catch(() => setMembers([]));
    }
    // Reset only when the dialog opens or switches record.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, employee?.id]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  // Accounts already linked to someone else are not offered.
  const taken = new Set(employees.filter((e) => e.user_id && e.id !== employee?.id).map((e) => e.user_id));
  const accounts = members.filter((m) => m.role !== 'guest' && !taken.has(m.id));

  // Typing the email of a team member's account links it, if nothing is linked yet.
  const suggestAccount = () => {
    if (draft.user_id) return;
    const email = draft.email.trim().toLowerCase();
    const match = accounts.find((m) => m.email.toLowerCase() === email);
    if (match) set('user_id', match.id);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.full_name.trim()) return setError('Escribe el nombre.');
    if (!draft.hire_date) return setError('Pon la fecha de ingreso.');
    const salary = draft.monthly_salary.trim() === '' ? null : Number(draft.monthly_salary);
    if (salary !== null && !(salary >= 0)) return setError('El salario debe ser un número positivo.');
    const openingDays = draft.opening_days.trim() === '' ? 0 : Number(draft.opening_days);
    if (Number.isNaN(openingDays)) return setError('Los días pendientes deben ser un número.');
    if (draft.opening_days.trim() !== '' && !draft.opening_date) return setError('Pon el día de ese saldo de vacaciones.');
    if (draft.opening_date && draft.opening_date < draft.hire_date) {
      return setError('El día del saldo no puede ser antes del ingreso.');
    }

    const input: Omit<EmployeeInput, 'exit_date' | 'exit_type' | 'exit_reason'> = {
      full_name: draft.full_name.trim(),
      national_id: orNull(draft.national_id),
      position: orNull(draft.position),
      department: orNull(draft.department),
      email: orNull(draft.email)?.toLowerCase() ?? null,
      hire_date: draft.hire_date,
      monthly_salary: salary,
      currency: draft.currency,
      user_id: draft.user_id || null,
      vacation_opening_days: draft.opening_date ? openingDays : 0,
      vacation_opening_date: draft.opening_date || null,
      notes: orNull(draft.notes),
    };

    setSaving(true);
    setError('');
    try {
      const saved = employee
        ? await staffService.updateEmployee(employee.id, input)
        : await staffService.createEmployee({ ...input, exit_date: null, exit_type: null, exit_reason: null });
      toast.success(employee ? 'Datos guardados' : `${saved.full_name} está en el registro`);
      onSaved(saved);
    } catch (err) {
      setError(dbErrorMessage(err, 'No se pudo guardar. Inténtalo de nuevo.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      dismissible={!saving}
      size="lg"
      title={employee ? 'Editar empleado' : 'Nuevo empleado'}
      description="Sus datos de ingreso y salario. Solo los administradores ven este registro."
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="employee-form" isLoading={saving}>
            {employee ? 'Guardar cambios' : 'Agregar al registro'}
          </Button>
        </>
      }
    >
      <form id="employee-form" onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Nombre completo"
            required
            value={draft.full_name}
            onChange={(e) => set('full_name', e.target.value)}
            maxLength={160}
            autoFocus
            disabled={saving}
            wrapperClassName="sm:col-span-2"
          />
          <Input
            label="Cédula"
            value={draft.national_id}
            onChange={(e) => set('national_id', e.target.value)}
            placeholder="000-0000000-0"
            maxLength={40}
            disabled={saving}
          />
          <Input
            label="Fecha de ingreso"
            type="date"
            required
            value={draft.hire_date}
            onChange={(e) => set('hire_date', e.target.value)}
            disabled={saving}
          />
          <Input
            label="Puesto"
            value={draft.position}
            onChange={(e) => set('position', e.target.value)}
            maxLength={120}
            disabled={saving}
          />
          <Input
            label="Departamento"
            value={draft.department}
            onChange={(e) => set('department', e.target.value)}
            maxLength={120}
            disabled={saving}
          />
          <Input
            label="Correo"
            type="email"
            value={draft.email}
            onChange={(e) => set('email', e.target.value)}
            onBlur={suggestAccount}
            disabled={saving}
          />
          <Select
            label="Cuenta en ibPulse"
            value={draft.user_id}
            onChange={(e) => set('user_id', e.target.value)}
            disabled={saving}
            hint="Con su cuenta vinculada ve su calendario y su saldo en «Mis vacaciones», sin salario ni notas."
          >
            <option value="">Sin cuenta</option>
            {accounts.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} · {m.email}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-4 border-t border-rule pt-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
          <Input
            label="Salario mensual"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={draft.monthly_salary}
            onChange={(e) => set('monthly_salary', e.target.value)}
            hint="Para estimar lo que se le debe de vacaciones al salir."
            disabled={saving}
          />
          <Select
            label="Moneda"
            value={draft.currency}
            onChange={(e) => set('currency', e.target.value)}
            options={CURRENCY_OPTIONS}
            disabled={saving}
          />
        </div>

        <section aria-labelledby="opening-balance" className="space-y-3 border-t border-rule pt-4">
          <div>
            <h3 id="opening-balance" className="text-sm font-semibold text-ink">Saldo inicial de vacaciones</h3>
            <p className="mt-0.5 text-[13px] text-ink-2">
              Si ya llevaban el control antes, pon los días que tenía sin tomar ese día. Desde ahí se suman sus aniversarios y
              se restan las vacaciones que registres. Sin saldo, se cuenta todo desde el ingreso.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Días pendientes"
              type="number"
              inputMode="decimal"
              step="0.5"
              min={-365}
              max={365}
              value={draft.opening_days}
              onChange={(e) => set('opening_days', e.target.value)}
              disabled={saving}
            />
            <Input
              label="Al día"
              type="date"
              min={draft.hire_date || undefined}
              value={draft.opening_date}
              onChange={(e) => set('opening_date', e.target.value)}
              disabled={saving}
            />
          </div>
        </section>

        <Textarea
          label="Notas"
          value={draft.notes}
          onChange={(e) => set('notes', e.target.value)}
          maxLength={4000}
          disabled={saving}
        />

        {error && (
          <p role="alert" className="rounded-control border border-st-red/40 bg-st-red/[0.06] px-3 py-2 text-sm text-st-red">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}

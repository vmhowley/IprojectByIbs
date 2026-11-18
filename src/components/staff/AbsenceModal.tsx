import { Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { staffService } from '../../services/staffService';
import { AbsenceKind, AbsenceType, Employee, EmployeeAbsence, LicenseType } from '../../types';
import { dbErrorMessage } from '../../utils/errors';
import { formatDate } from '../../utils/format';
import { LeaveRules, countWorkDays, formatDays, formatHours, vacationBalance } from '../../utils/leave';
import { Button } from '../ui/Button';
import { confirmDialog } from '../ui/ConfirmDialog';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { ABSENCE_TYPE, KIND, KIND_ORDER, LICENSE, LICENSE_ORDER, absenceRange, absenceTitle } from './labels';

interface AbsenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  /** Every absence of the organization: to warn about overlaps and show the balance. */
  absences: EmployeeAbsence[];
  rules: LeaveRules;
  holidays: ReadonlySet<string>;
  /** The absence to edit; a new one without it. */
  absence?: EmployeeAbsence | null;
  /** Starting values of a new absence. */
  defaults?: { employeeId?: string; date?: string };
  onSaved: (absence: EmployeeAbsence) => void;
  onDeleted: (id: string) => void;
}

interface Draft {
  employeeId: string;
  kind: AbsenceKind;
  leaveType: string;
  start: string;
  end: string;
  byHours: boolean;
  hours: string;
  paid: boolean;
  note: string;
}

function initialDraft(absence: EmployeeAbsence | null | undefined, defaults: AbsenceModalProps['defaults']): Draft {
  if (absence) {
    return {
      employeeId: absence.employee_id,
      kind: absence.kind,
      leaveType: absence.leave_type || '',
      start: absence.start_date,
      end: absence.end_date,
      byHours: absence.hours != null,
      hours: absence.hours != null ? String(absence.hours) : '',
      paid: absence.paid,
      note: absence.note || '',
    };
  }
  const date = defaults?.date || '';
  return {
    employeeId: defaults?.employeeId || '',
    kind: 'vacaciones',
    leaveType: '',
    start: date,
    end: date,
    byHours: false,
    hours: '',
    paid: true,
    note: '',
  };
}

/** Records or corrects a vacation, leave, absence or permit, with the working days it takes. */
export function AbsenceModal({
  isOpen,
  onClose,
  employees,
  absences,
  rules,
  holidays,
  absence,
  defaults,
  onSaved,
  onDeleted,
}: AbsenceModalProps) {
  const [draft, setDraft] = useState<Draft>(() => initialDraft(absence, defaults));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDraft(initialDraft(absence, defaults));
      setError('');
    }
    // Reset only when the dialog opens or switches record.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, absence?.id]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const setKind = (kind: AbsenceKind) =>
    setDraft((d) => ({
      ...d,
      kind,
      leaveType: kind === 'licencia' ? 'medica' : kind === 'ausencia' ? 'justificada' : '',
      byHours: kind === 'permiso' ? d.byHours : false,
      end: kind === 'permiso' && d.byHours ? d.start : d.end,
      paid: true,
    }));

  const employee = employees.find((e) => e.id === draft.employeeId) || null;
  // Someone who left still shows when their own absence is open.
  const choices = employees.filter((e) => !e.exit_date || e.id === draft.employeeId);

  const others = useMemo(
    () => absences.filter((a) => a.employee_id === draft.employeeId && a.id !== absence?.id),
    [absences, draft.employeeId, absence?.id]
  );

  const end = draft.byHours ? draft.start : draft.end;
  const datesValid = !!draft.start && !!end && end >= draft.start;
  const workDays = datesValid && !draft.byHours ? countWorkDays(draft.start, end, rules, holidays) : 0;
  const hours = Number(draft.hours);

  const problem = (() => {
    if (!employee || !datesValid) return '';
    if (draft.start < employee.hire_date) return `Ingresó el ${formatDate(employee.hire_date, 'long')}: la ausencia no puede empezar antes.`;
    if (employee.exit_date && end > employee.exit_date) return 'La ausencia termina después de su salida.';
    const clash = others.find(
      (a) => a.start_date <= end && a.end_date >= draft.start && (a.hours == null || !draft.byHours)
    );
    if (clash) return `Se cruza con ${KIND[clash.kind].article} ${absenceTitle(clash).toLowerCase()} del ${absenceRange(clash)}.`;
    return '';
  })();

  const balance =
    employee && draft.kind === 'vacaciones' && datesValid
      ? {
          before: vacationBalance(employee, others, rules, holidays).available,
          after: vacationBalance(
            employee,
            [...others, { id: 'draft', employee_id: employee.id, kind: 'vacaciones', leave_type: null, start_date: draft.start, end_date: end, hours: null, paid: true }],
            rules,
            holidays
          ).available,
        }
      : null;

  const license = draft.kind === 'licencia' ? LICENSE[draft.leaveType as LicenseType] : undefined;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!employee) return setError('Elige a la persona.');
    if (!datesValid) return setError(draft.start && end ? 'La fecha final va después de la inicial.' : 'Pon las fechas.');
    if (draft.byHours && !(hours > 0 && hours <= 24)) return setError('Las horas van de 0.5 a 24.');
    if (problem) return setError(problem);
    setSaving(true);
    setError('');
    const input = {
      employee_id: employee.id,
      kind: draft.kind,
      leave_type: (draft.kind === 'licencia' || draft.kind === 'ausencia' ? draft.leaveType : null) as
        | LicenseType
        | AbsenceType
        | null,
      start_date: draft.start,
      end_date: end,
      hours: draft.kind === 'permiso' && draft.byHours ? hours : null,
      paid: draft.kind === 'vacaciones' ? true : draft.paid,
      note: draft.note.trim() || null,
    };
    try {
      const saved = absence ? await staffService.updateAbsence(absence.id, input) : await staffService.createAbsence(input);
      toast.success(absence ? 'Cambios guardados' : `${absenceTitle(saved)} ${KIND[saved.kind].saved}`);
      onSaved(saved);
    } catch (err) {
      setError(dbErrorMessage(err, 'No se pudo guardar. Inténtalo de nuevo.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!absence) return;
    const ok = await confirmDialog({
      title: 'Borrar este registro',
      message: `${absenceTitle(absence)} del ${absenceRange(absence)}${employee ? `, de ${employee.full_name}` : ''}.${
        absence.kind === 'vacaciones' ? ' Sus días vuelven al saldo de vacaciones.' : ''
      }`,
      confirmText: 'Borrar',
    });
    if (!ok) return;
    setSaving(true);
    try {
      await staffService.deleteAbsence(absence.id);
      toast.success('Registro borrado');
      onDeleted(absence.id);
    } catch (err) {
      setError(dbErrorMessage(err, 'No se pudo borrar. Inténtalo de nuevo.'));
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
      title={absence ? 'Editar ausencia' : 'Registrar ausencia'}
      description="Vacaciones, licencias, ausencias y permisos. Se cuentan los días laborables según las reglas del equipo."
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          {absence ? (
            <Button type="button" variant="danger" size="sm" onClick={handleDelete} disabled={saving}>
              <Trash2 size={14} aria-hidden="true" />
              Borrar
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" form="absence-form" isLoading={saving}>
              {absence ? 'Guardar cambios' : 'Registrar'}
            </Button>
          </div>
        </div>
      }
    >
      <form id="absence-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Select
          label="Persona"
          required
          value={draft.employeeId}
          onChange={(e) => set('employeeId', e.target.value)}
          disabled={!!absence || saving}
        >
          <option value="">Elige a alguien del equipo</option>
          {choices.map((e) => (
            <option key={e.id} value={e.id}>
              {e.full_name}
              {e.position ? ` · ${e.position}` : ''}
            </option>
          ))}
        </Select>

        <fieldset>
          <legend className="caption mb-1.5">Tipo</legend>
          <div role="group" aria-label="Tipo" className="segmented flex w-full flex-wrap sm:w-auto sm:flex-nowrap">
            {KIND_ORDER.map((kind) => {
              const Icon = KIND[kind].icon;
              const active = draft.kind === kind;
              return (
                <button
                  key={kind}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setKind(kind)}
                  disabled={saving}
                  className={cn(
                    'inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-inner px-3 text-[13px] font-medium transition-colors',
                    active ? 'bg-raised text-ink shadow-control' : 'text-ink-2 hover:text-ink'
                  )}
                >
                  <Icon size={14} aria-hidden="true" />
                  {KIND[kind].label}
                </button>
              );
            })}
          </div>
        </fieldset>

        {draft.kind === 'licencia' && (
          <Select
            label="Licencia por"
            value={draft.leaveType}
            onChange={(e) => set('leaveType', e.target.value)}
            disabled={saving}
            options={LICENSE_ORDER.map((type) => ({ value: type, label: LICENSE[type].label }))}
            hint={
              license?.days
                ? `El Código de Trabajo (art. 54) da ${formatDays(license.days)} ${license.law}.`
                : 'Pon la duración que indique el certificado o el acuerdo.'
            }
          />
        )}

        {draft.kind === 'ausencia' && (
          <Select
            label="La ausencia es"
            value={draft.leaveType}
            onChange={(e) => {
              const leaveType = e.target.value;
              setDraft((d) => ({ ...d, leaveType, paid: leaveType !== 'injustificada' }));
            }}
            disabled={saving}
            options={(Object.keys(ABSENCE_TYPE) as AbsenceType[]).map((type) => ({ value: type, label: ABSENCE_TYPE[type] }))}
          />
        )}

        {draft.kind === 'permiso' && (
          <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink">
            <input
              type="checkbox"
              checked={draft.byHours}
              onChange={(e) => setDraft((d) => ({ ...d, byHours: e.target.checked, end: d.start }))}
              disabled={saving}
              className="mt-0.5 h-4 w-4 accent-[var(--ink)]"
            />
            <span>
              Por horas
              <span className="block text-xs text-ink-3">Unas horas de un solo día, por ejemplo una cita médica.</span>
            </span>
          </label>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={draft.byHours ? 'Día' : 'Desde'}
            type="date"
            required
            value={draft.start}
            onChange={(e) => {
              const start = e.target.value;
              setDraft((d) => ({ ...d, start, end: d.byHours || !d.end || d.end < start ? start : d.end }));
            }}
            disabled={saving}
          />
          {draft.byHours ? (
            <Input
              label="Horas"
              type="number"
              inputMode="decimal"
              min={0.5}
              max={24}
              step={0.5}
              required
              value={draft.hours}
              onChange={(e) => set('hours', e.target.value)}
              disabled={saving}
            />
          ) : (
            <Input
              label="Hasta"
              type="date"
              required
              min={draft.start || undefined}
              value={draft.end}
              onChange={(e) => set('end', e.target.value)}
              disabled={saving}
            />
          )}
        </div>

        {/* What the dates add up to */}
        {datesValid && (
          <div className="rounded-control border border-rule bg-well/60 px-3 py-2.5 text-sm" aria-live="polite">
            <p className="text-ink">
              {draft.byHours ? (
                <>
                  <span className="font-semibold">{hours > 0 ? formatHours(hours) : 'Horas por poner'}</span> el{' '}
                  {absenceRange({ start_date: draft.start, end_date: draft.start })}
                </>
              ) : (
                <>
                  <span className="font-semibold tabular-nums">{workDays}</span>{' '}
                  {workDays === 1 ? 'día laborable' : 'días laborables'} · {absenceRange({ start_date: draft.start, end_date: end })}
                  {workDays === 0 && <span className="text-ink-3"> (son días libres o feriados)</span>}
                </>
              )}
            </p>
            {balance && (
              <p className={cn('mt-0.5 text-[13px]', balance.after < 0 ? 'font-semibold text-st-red' : 'text-ink-2')}>
                Le quedan <span className="tabular-nums">{formatDays(balance.after)}</span> de vacaciones
                {balance.after < 0
                  ? `: toma ${formatDays(-balance.after)} más de los que tiene ganados.`
                  : ` (tenía ${formatDays(balance.before)}).`}
              </p>
            )}
            {license?.days && workDays > license.days && (
              <p className="mt-0.5 text-[13px] text-ink-2">Pasa de los {license.days} días de la ley: confirma que fue acordado.</p>
            )}
          </div>
        )}

        {draft.kind !== 'vacaciones' && (
          <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink">
            <input
              type="checkbox"
              checked={draft.paid}
              onChange={(e) => set('paid', e.target.checked)}
              disabled={saving}
              className="mt-0.5 h-4 w-4 accent-[var(--ink)]"
            />
            <span>
              Con disfrute de salario
              <span className="block text-xs text-ink-3">Desmárcalo si esos días no se pagan.</span>
            </span>
          </label>
        )}

        <Textarea
          label="Nota"
          value={draft.note}
          onChange={(e) => set('note', e.target.value)}
          maxLength={2000}
          placeholder="Certificado entregado, quién lo aprobó…"
          hint="Solo la ven los administradores."
          disabled={saving}
        />

        {(error || problem) && (
          <p role="alert" className="rounded-control border border-st-red/40 bg-st-red/[0.06] px-3 py-2 text-sm text-st-red">
            {error || problem}
          </p>
        )}
      </form>
    </Modal>
  );
}

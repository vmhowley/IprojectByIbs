import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { staffService } from '../../services/staffService';
import { Employee, EmployeeAbsence, ExitType } from '../../types';
import { dbErrorMessage } from '../../utils/errors';
import { LeaveRules, dayKey, exitSettlement, toDay } from '../../utils/leave';
import { Button } from '../ui/Button';
import { confirmDialog } from '../ui/ConfirmDialog';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { ExitCaveat, ExitSettlementTable } from './ExitSettlementTable';
import { EXIT, EXIT_ORDER, absenceRange, absenceTitle } from './labels';

interface ExitModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  /** The employee's own absences. */
  absences: EmployeeAbsence[];
  rules: LeaveRules;
  holidays: ReadonlySet<string>;
  onSaved: (employee: Employee) => void;
}

/** Records the day and the way someone leaves, with the vacation still owed to them. */
export function ExitModal({ isOpen, onClose, employee, absences, rules, holidays, onSaved }: ExitModalProps) {
  const [date, setDate] = useState('');
  const [type, setType] = useState<ExitType | ''>('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setDate(employee.exit_date || dayKey(new Date()));
    setType(employee.exit_type || '');
    setReason(employee.exit_reason || '');
    setError('');
  }, [isOpen, employee]);

  const validDate = !!date && date >= employee.hire_date;
  const settlement = validDate
    ? exitSettlement(employee, absences, rules, holidays, toDay(date), employee.monthly_salary)
    : null;
  // Absences recorded after the exit would be left outside the employment.
  const after = validDate ? absences.filter((a) => a.end_date > date) : [];

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!date) return setError('Pon la fecha de salida.');
    if (!validDate) return setError('La salida no puede ser antes del ingreso.');
    if (!type) return setError('Elige cómo termina la relación laboral.');
    if (after.length > 0) return setError('Primero borra o corrige las ausencias que pasan de la fecha de salida.');
    setSaving(true);
    setError('');
    try {
      const saved = await staffService.updateEmployee(employee.id, {
        exit_date: date,
        exit_type: type,
        exit_reason: reason.trim() || null,
      });
      toast.success(employee.exit_date ? 'Salida actualizada' : `Salida de ${employee.full_name} registrada`);
      onSaved(saved);
    } catch (err) {
      setError(dbErrorMessage(err, 'No se pudo guardar. Inténtalo de nuevo.'));
    } finally {
      setSaving(false);
    }
  };

  const handleUndo = async () => {
    const ok = await confirmDialog({
      title: 'Quitar la salida',
      message: `${employee.full_name} vuelve a estar activo y su saldo de vacaciones sigue sumando.`,
      confirmText: 'Quitar salida',
      tone: 'primary',
    });
    if (!ok) return;
    setSaving(true);
    try {
      const saved = await staffService.updateEmployee(employee.id, { exit_date: null, exit_type: null, exit_reason: null });
      toast.success('Salida quitada');
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
      title={employee.exit_date ? 'Editar salida' : 'Registrar salida'}
      description={`${employee.full_name} deja la empresa. Se calcula lo que se le debe de vacaciones a esa fecha.`}
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          {employee.exit_date ? (
            <Button type="button" variant="ghost" size="sm" onClick={handleUndo} disabled={saving}>
              Quitar salida
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" form="exit-form" isLoading={saving}>
              {employee.exit_date ? 'Guardar cambios' : 'Registrar salida'}
            </Button>
          </div>
        </div>
      }
    >
      <form id="exit-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Último día de trabajo"
            type="date"
            required
            min={employee.hire_date}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={saving}
          />
          <Select
            label="Tipo de salida"
            required
            value={type}
            onChange={(e) => setType(e.target.value as ExitType)}
            disabled={saving}
            hint={type ? EXIT[type].note : undefined}
          >
            <option value="">Elige una</option>
            {EXIT_ORDER.map((t) => (
              <option key={t} value={t}>
                {EXIT[t].label}
              </option>
            ))}
          </Select>
        </div>

        <Textarea
          label="Motivo"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={2000}
          placeholder="Qué pasó, quién lo comunicó, acuerdos…"
          disabled={saving}
        />

        {after.length > 0 && (
          <div role="alert" className="rounded-control border border-st-red/40 bg-st-red/[0.06] px-3 py-2 text-sm text-st-red">
            <p className="font-medium">Hay ausencias después de esa fecha:</p>
            <ul className="mt-1 list-disc pl-5">
              {after.map((a) => (
                <li key={a.id}>
                  {absenceTitle(a)} · {absenceRange(a)}
                </li>
              ))}
            </ul>
            <p className="mt-1">Bórralas desde su historial o elige otra fecha.</p>
          </div>
        )}

        {settlement && (
          <section aria-labelledby="exit-owed" className="rounded-control border border-rule">
            <h3 id="exit-owed" className="border-b border-rule bg-well px-3 py-2 text-sm font-semibold text-ink">
              Vacaciones pendientes al salir
            </h3>
            <ExitSettlementTable settlement={settlement} rules={rules} currency={employee.currency} />
            {settlement.dailySalary == null && (
              <p className="border-t border-rule px-3 py-2 text-xs text-ink-3">
                Sin salario registrado no se estima el monto. Agrégalo con «Editar».
              </p>
            )}
          </section>
        )}

        {settlement && <ExitCaveat />}

        {error && (
          <p role="alert" className="rounded-control border border-st-red/40 bg-st-red/[0.06] px-3 py-2 text-sm text-st-red">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}

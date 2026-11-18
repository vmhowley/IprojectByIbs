import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { staffService } from '../../services/staffService';
import { HrHoliday, HrSettings } from '../../types';
import { dbErrorMessage } from '../../utils/errors';
import { DEFAULT_LEAVE_RULES, LeaveRules, toDay } from '../../utils/leave';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { WEEKDAYS } from './labels';

interface RulesPanelProps {
  organizationId: string;
  rules: LeaveRules;
  holidays: HrHoliday[];
  onRulesSaved: (settings: HrSettings) => void;
  onHolidaysChange: (holidays: HrHoliday[]) => void;
}

type RulesDraft = Record<Exclude<keyof LeaveRules, 'work_days'>, string> & { work_days: number[] };

const toDraft = (rules: LeaveRules): RulesDraft => ({
  vacation_days: String(rules.vacation_days),
  vacation_days_senior: String(rules.vacation_days_senior),
  senior_after_years: String(rules.senior_after_years),
  proportional_from_months: String(rules.proportional_from_months),
  work_days: [...rules.work_days],
  daily_salary_divisor: String(rules.daily_salary_divisor),
});

const holidayDay = new Intl.DateTimeFormat('es-DO', { weekday: 'short', day: 'numeric', month: 'short' });

/** The organization's vacation rules and its holidays. */
export function RulesPanel({ organizationId, rules, holidays, onRulesSaved, onHolidaysChange }: RulesPanelProps) {
  const [draft, setDraft] = useState<RulesDraft>(() => toDraft(rules));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // A fresh copy of the same rules must not wipe what is being typed.
  const rulesKey = JSON.stringify(rules);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setDraft(toDraft(rules)), [rulesKey]);

  const set = (key: Exclude<keyof RulesDraft, 'work_days'>, value: string) => setDraft((d) => ({ ...d, [key]: value }));
  const toggleDay = (day: number) =>
    setDraft((d) => ({
      ...d,
      work_days: d.work_days.includes(day) ? d.work_days.filter((x) => x !== day) : [...d.work_days, day].sort((a, b) => a - b),
    }));

  const changed = JSON.stringify(draft) !== JSON.stringify(toDraft(rules));
  const isLegal = JSON.stringify(draft) === JSON.stringify(toDraft(DEFAULT_LEAVE_RULES));

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    const n = (value: string) => Number(value);
    const whole = (value: string, min: number, max: number) => Number.isInteger(n(value)) && n(value) >= min && n(value) <= max;
    if (!whole(draft.vacation_days, 1, 60) || !whole(draft.vacation_days_senior, 1, 60)) {
      return setError('Los días por año van de 1 a 60.');
    }
    if (!whole(draft.senior_after_years, 1, 50)) return setError('El año del cambio va de 1 a 50.');
    if (!whole(draft.proportional_from_months, 1, 11)) return setError('Los meses del proporcional van de 1 a 11.');
    if (draft.work_days.length === 0) return setError('Elige al menos un día laborable.');
    if (!(n(draft.daily_salary_divisor) >= 1 && n(draft.daily_salary_divisor) <= 31)) {
      return setError('El divisor va de 1 a 31.');
    }
    setSaving(true);
    setError('');
    try {
      const saved = await staffService.saveSettings({
        organization_id: organizationId,
        vacation_days: n(draft.vacation_days),
        vacation_days_senior: n(draft.vacation_days_senior),
        senior_after_years: n(draft.senior_after_years),
        proportional_from_months: n(draft.proportional_from_months),
        work_days: draft.work_days,
        daily_salary_divisor: n(draft.daily_salary_divisor),
      });
      toast.success('Reglas guardadas');
      onRulesSaved(saved);
    } catch (err) {
      setError(dbErrorMessage(err, 'No se pudieron guardar las reglas. Inténtalo de nuevo.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_26rem]">
      <form onSubmit={handleSave} className="sheet overflow-hidden" aria-labelledby="rules-title" noValidate>
        <div className="border-b border-rule px-5 py-3">
          <h2 id="rules-title" className="text-[15px] font-semibold text-ink">
            Reglas de vacaciones
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-2">
            {isLegal ? 'Son las del Código de Trabajo.' : 'Cambiadas por tu equipo; «Valores de ley» vuelve a las del Código de Trabajo.'}{' '}
            Valen para todo el registro, también para saldos pasados.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-x-5 gap-y-4 px-5 py-4 sm:grid-cols-2">
          <Input
            label="Días por año"
            type="number"
            inputMode="numeric"
            min={1}
            max={60}
            value={draft.vacation_days}
            onChange={(e) => set('vacation_days', e.target.value)}
            hint="Días laborables desde el primer año de servicio (art. 177)."
            disabled={saving}
          />
          <Input
            label="Proporcional desde"
            type="number"
            inputMode="numeric"
            min={1}
            max={11}
            value={draft.proportional_from_months}
            onChange={(e) => set('proportional_from_months', e.target.value)}
            hint="Meses de un año sin cumplir. Art. 180: 6 días a los 5 meses, uno más cada mes, hasta 12 a los 11."
            disabled={saving}
          />
          <Input
            label="A partir del año"
            type="number"
            inputMode="numeric"
            min={1}
            max={50}
            value={draft.senior_after_years}
            onChange={(e) => set('senior_after_years', e.target.value)}
            hint="De servicio cumplido."
            disabled={saving}
          />
          <Input
            label="Días por año desde entonces"
            type="number"
            inputMode="numeric"
            min={1}
            max={60}
            value={draft.vacation_days_senior}
            onChange={(e) => set('vacation_days_senior', e.target.value)}
            hint="Art. 177: 18 días desde el quinto año."
            disabled={saving}
          />

          <fieldset className="sm:col-span-2">
            <legend className="caption mb-1.5">Días laborables</legend>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((d) => {
                const on = draft.work_days.includes(d.day);
                return (
                  <button
                    key={d.day}
                    type="button"
                    aria-pressed={on}
                    aria-label={d.long}
                    onClick={() => toggleDay(d.day)}
                    disabled={saving}
                    className={cn(
                      'inline-flex h-8 min-w-12 items-center justify-center rounded-control border px-2.5 text-[13px] font-medium capitalize transition-colors',
                      on ? 'border-ink/70 bg-paper text-ink shadow-control' : 'border-rule text-ink-3 hover:text-ink-2'
                    )}
                  >
                    {d.short}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-ink-3">Vacaciones y licencias cuentan solo estos días, sin los feriados.</p>
          </fieldset>

          <Input
            label="Divisor del salario diario"
            type="number"
            inputMode="decimal"
            min={1}
            max={31}
            step="0.01"
            value={draft.daily_salary_divisor}
            onChange={(e) => set('daily_salary_divisor', e.target.value)}
            hint="Salario mensual ÷ este número = salario diario. En República Dominicana se usa 23.83."
            disabled={saving}
          />
        </div>

        {error && (
          <p role="alert" className="mx-5 mb-4 rounded-control border border-st-red/40 bg-st-red/[0.06] px-3 py-2 text-sm text-st-red">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rule bg-well px-5 py-3">
          <Button type="button" variant="ghost" size="sm" onClick={() => setDraft(toDraft(DEFAULT_LEAVE_RULES))} disabled={saving || isLegal}>
            Valores de ley
          </Button>
          <Button type="submit" isLoading={saving} disabled={!changed}>
            Guardar reglas
          </Button>
        </div>
      </form>

      <HolidayList holidays={holidays} onChange={onHolidaysChange} />
    </div>
  );
}

function HolidayList({ holidays, onChange }: { holidays: HrHoliday[]; onChange: (holidays: HrHoliday[]) => void }) {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const ofYear = holidays.filter((h) => h.date.startsWith(`${year}-`)).sort((a, b) => a.date.localeCompare(b.date));

  const add = async (event: FormEvent) => {
    event.preventDefault();
    if (!date || !name.trim()) return;
    setBusy(true);
    try {
      const created = await staffService.addHoliday(date, name);
      onChange([...holidays, created]);
      setYear(toDay(created.date).getFullYear());
      setDate('');
      setName('');
    } catch (err) {
      toast.error(dbErrorMessage(err, 'No se pudo agregar el feriado.'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (holiday: HrHoliday) => {
    setBusy(true);
    try {
      await staffService.removeHoliday(holiday.id);
      onChange(holidays.filter((h) => h.id !== holiday.id));
      toast.success(`${holiday.name} quitado`);
    } catch (err) {
      toast.error(dbErrorMessage(err, 'No se pudo quitar el feriado.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="sheet overflow-hidden" aria-labelledby="holidays-title">
      <div className="flex items-center justify-between gap-3 border-b border-rule px-4 py-2.5">
        <h2 id="holidays-title" className="text-[15px] font-semibold text-ink">
          Feriados <span className="font-normal tabular-nums text-ink-3">{year}</span>
        </h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Año anterior" onClick={() => setYear((y) => y - 1)}>
            <ChevronLeft size={18} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Año siguiente" onClick={() => setYear((y) => y + 1)}>
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      <form onSubmit={add} className="grid grid-cols-[9.5rem_minmax(0,1fr)] gap-2 border-b border-rule bg-well/60 px-4 py-3">
        <Input aria-label="Día del feriado" type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={busy} />
        <div className="flex gap-2">
          <Input aria-label="Nombre del feriado" placeholder="Nombre" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} disabled={busy} />
          <Button type="submit" variant="secondary" disabled={busy || !date || !name.trim()} aria-label="Agregar feriado">
            <Plus size={16} aria-hidden="true" />
            <span className="max-sm:hidden">Agregar</span>
          </Button>
        </div>
      </form>

      {ofYear.length === 0 ? (
        <p className="px-4 py-5 text-sm leading-relaxed text-ink-3">
          Sin feriados en {year}. Agrega los días libres oficiales, con la fecha en que se disfrutan si la ley los traslada. No
          cuentan como días laborables en vacaciones ni licencias.
        </p>
      ) : (
        <ul className="divide-y divide-rule">
          {ofYear.map((h) => (
            <li key={h.id} className="flex items-center gap-3 px-4 py-2">
              <span className="w-24 shrink-0 text-[13px] capitalize tabular-nums text-ink-2">
                {holidayDay.format(toDay(h.date)).replace('.', '')}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-ink">{h.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={`Quitar ${h.name}`}
                onClick={() => remove(h)}
                disabled={busy}
              >
                <X size={15} />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

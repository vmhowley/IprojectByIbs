import { FileHeart, LucideIcon, Timer, TreePalm, UserRoundX } from 'lucide-react';
import { AbsenceKind, AbsenceType, EmployeeAbsence, ExitType, LicenseType } from '../../types';
import { toDay } from '../../utils/leave';

// Spanish names of what the staff register records. The kind of an absence
// shows as its icon and word: in the calendar, color belongs to the person.

export const KIND: Record<AbsenceKind, { label: string; plural: string; article: string; saved: string; icon: LucideIcon }> = {
  vacaciones: { label: 'Vacaciones', plural: 'Vacaciones', article: 'las', saved: 'registradas', icon: TreePalm },
  licencia: { label: 'Licencia', plural: 'Licencias', article: 'la', saved: 'registrada', icon: FileHeart },
  ausencia: { label: 'Ausencia', plural: 'Ausencias', article: 'la', saved: 'registrada', icon: UserRoundX },
  permiso: { label: 'Permiso', plural: 'Permisos', article: 'el', saved: 'registrado', icon: Timer },
};

export const KIND_ORDER: AbsenceKind[] = ['vacaciones', 'licencia', 'ausencia', 'permiso'];

/** `days` is what the Labor Code (art. 54) grants, shown as a hint and never enforced. */
export const LICENSE: Record<LicenseType, { label: string; days?: number; law?: string }> = {
  medica: { label: 'Médica' },
  maternidad: { label: 'Maternidad' },
  paternidad: { label: 'Paternidad', days: 2, law: 'por el nacimiento de un hijo' },
  matrimonio: { label: 'Matrimonio', days: 5, law: 'por matrimonio' },
  duelo: { label: 'Duelo', days: 3, law: 'por la muerte de abuelos, padres, hijos, cónyuge o pareja' },
  estudios: { label: 'Estudios' },
  otra: { label: 'Otra' },
};

export const LICENSE_ORDER: LicenseType[] = ['medica', 'maternidad', 'paternidad', 'matrimonio', 'duelo', 'estudios', 'otra'];

export const ABSENCE_TYPE: Record<AbsenceType, string> = {
  justificada: 'Justificada',
  injustificada: 'Injustificada',
};

export const EXIT: Record<ExitType, { label: string; note: string }> = {
  despido: { label: 'Despido', note: 'La empresa termina el contrato por una falta del empleado.' },
  desahucio: { label: 'Desahucio', note: 'Una de las partes termina el contrato con preaviso, sin alegar causa.' },
  dimision: { label: 'Dimisión', note: 'El empleado termina el contrato por una falta de la empresa.' },
  renuncia: { label: 'Renuncia', note: 'El empleado se va por decisión propia.' },
  mutuo_acuerdo: { label: 'Mutuo acuerdo', note: 'Las dos partes acuerdan terminar.' },
  fin_contrato: { label: 'Fin de contrato', note: 'Termina el plazo o la obra del contrato.' },
  otro: { label: 'Otro motivo', note: 'Fallecimiento, jubilación u otra causa.' },
};

export const EXIT_ORDER: ExitType[] = ['despido', 'desahucio', 'dimision', 'renuncia', 'mutuo_acuerdo', 'fin_contrato', 'otro'];

/** Monday first, as the calendar reads; values are Date.getDay(). */
export const WEEKDAYS: { day: number; short: string; long: string }[] = [
  { day: 1, short: 'lun', long: 'lunes' },
  { day: 2, short: 'mar', long: 'martes' },
  { day: 3, short: 'mié', long: 'miércoles' },
  { day: 4, short: 'jue', long: 'jueves' },
  { day: 5, short: 'vie', long: 'viernes' },
  { day: 6, short: 'sáb', long: 'sábado' },
  { day: 0, short: 'dom', long: 'domingo' },
];

/** "Licencia médica", "Ausencia injustificada", "Vacaciones". */
export function absenceTitle(absence: Pick<EmployeeAbsence, 'kind' | 'leave_type'>): string {
  if (absence.kind === 'licencia' && absence.leave_type) {
    return `Licencia ${LICENSE[absence.leave_type as LicenseType]?.label.toLowerCase() ?? ''}`.trim();
  }
  if (absence.kind === 'ausencia' && absence.leave_type) {
    return `Ausencia ${ABSENCE_TYPE[absence.leave_type as AbsenceType]?.toLowerCase() ?? ''}`.trim();
  }
  return KIND[absence.kind].label;
}

const shortDay = new Intl.DateTimeFormat('es-DO', { day: 'numeric', month: 'short' });

/** "2 al 6 mar", "5 mar", "30 dic al 3 ene". */
export function absenceRange(absence: Pick<EmployeeAbsence, 'start_date' | 'end_date'>): string {
  const start = toDay(absence.start_date);
  const end = toDay(absence.end_date);
  const fmt = (d: Date) => shortDay.format(d).replace('.', '');
  if (absence.start_date === absence.end_date) return fmt(start);
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()} al ${fmt(end)}`;
  }
  return `${fmt(start)} al ${fmt(end)}`;
}

/** "Ana María Pérez" to "Ana P.", for the calendar's narrow cells. */
export function shortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return parts[0] || '';
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

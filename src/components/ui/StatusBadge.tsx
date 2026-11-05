import { cn } from '../../lib/utils';

type Ink = 'graphite' | 'ochre' | 'blue' | 'violet' | 'green' | 'red';

interface StampSpec {
  label: string;
  ink: Ink;
}

// Every status is a rubber stamp in an office ink. Waiting on someone is
// ochre, work in progress violet, approved blue, finished green.
const STAMPS: Record<string, StampSpec> = {
  pending_analysis: { label: 'Pendiente de análisis', ink: 'graphite' },
  pending_approval: { label: 'Pendiente de aprobación', ink: 'ochre' },
  in_review: { label: 'En revisión', ink: 'ochre' },
  approved: { label: 'Aprobado', ink: 'blue' },
  ongoing: { label: 'En desarrollo', ink: 'violet' },
  completed: { label: 'Completado', ink: 'green' },
  done: { label: 'Finalizado', ink: 'green' },
  active: { label: 'Activo', ink: 'violet' },
  on_hold: { label: 'En espera', ink: 'ochre' },
  archived: { label: 'Archivado', ink: 'graphite' },
  pending: { label: 'Pendiente', ink: 'graphite' },
  cancelled: { label: 'Cancelado', ink: 'red' },
  overdue: { label: 'Vencido', ink: 'red' },
};

const INK_CLASS: Record<Ink, string> = {
  graphite: 'text-st-graphite',
  ochre: 'text-st-ochre',
  blue: 'text-st-blue',
  violet: 'text-st-violet',
  green: 'text-st-green',
  red: 'text-st-red',
};

// On the stamp itself the lettering is the ink pressed deeper, so it stays legible over its own tint.
const STAMP_INK: Record<Ink, string> = {
  graphite: 'text-stamp-graphite',
  ochre: 'text-stamp-ochre',
  blue: 'text-stamp-blue',
  violet: 'text-stamp-violet',
  green: 'text-stamp-green',
  red: 'text-stamp-red',
};

export function statusLabel(status: string | null | undefined): string {
  if (!status) return '';
  return STAMPS[status]?.label ?? status.replace(/_/g, ' ');
}

export function statusInkClass(status: string | null | undefined): string {
  return INK_CLASS[(status && STAMPS[status]?.ink) || 'graphite'];
}

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  /** Plays the stamp landing on the paper. Use only right after a change. */
  animate?: boolean;
  className?: string;
}

const SIZE: Record<NonNullable<StatusBadgeProps['size']>, string> = {
  sm: 'h-[18px] px-1 text-2xs border',
  md: 'h-5 px-1.5 text-2xs border-[1.5px]',
  lg: 'h-7 px-2.5 text-xs border-2 tracking-[0.08em]',
};

/** A framed rubber stamp: double frame, condensed capitals, a trace of ink. */
export function StatusBadge({ status, size = 'md', animate = false, className }: StatusBadgeProps) {
  return (
    <span
      key={animate ? status : undefined}
      className={cn(
        'inline-flex shrink-0 select-none items-center whitespace-nowrap rounded-stamp border-current/45 font-bold uppercase leading-none tracking-[0.06em] [font-stretch:82%]',
        'bg-[color-mix(in_oklch,currentColor_12%,transparent)] shadow-[inset_0_0_0_1px_var(--paper),inset_0_0_0_1.75px_currentColor]',
        size === 'sm' && 'shadow-none',
        STAMP_INK[(STAMPS[status]?.ink) || 'graphite'],
        SIZE[size],
        animate && 'animate-stamp',
        className
      )}
    >
      {statusLabel(status)}
    </span>
  );
}

export { StatusBadge as Stamp };

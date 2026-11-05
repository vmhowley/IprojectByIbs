import { cn } from '../../lib/utils';

interface RequestTypeBadgeProps {
  type: string;
  className?: string;
}

// Legacy codes stored before request types became editable.
const knownLabels: Record<string, string> = {
  feature: 'Requerimiento de adecuación',
  bug: 'Incidencia reportada',
  enhancement: 'Solicitud de mejora',
  consult: 'Consulta',
  support: 'Soporte',
  documentation: 'Documentación',
  other: 'Otro',
};

export function requestTypeLabel(type: string | null | undefined): string {
  if (!type) return '';
  if (knownLabels[type]) return knownLabels[type];
  const text = type.replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** The "tipo de solicitud" box of the form: plain text in a ruled cell. */
export function RequestTypeBadge({ type, className }: RequestTypeBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-5 max-w-full items-center truncate whitespace-nowrap rounded-inner border border-rule bg-well px-1.5 text-xs font-medium text-ink-2',
        className
      )}
    >
      {requestTypeLabel(type)}
    </span>
  );
}

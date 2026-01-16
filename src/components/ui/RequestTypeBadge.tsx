
interface RequestTypeBadgeProps {
  type: string;
}

export function RequestTypeBadge({ type }: RequestTypeBadgeProps) {
  // Predefined known types for specific, consistent overrides if desired
  const knownLabels: Record<string, string> = {
    feature: 'Requerimiento de Adecuación',
    bug: 'Incidencia Reportada',
    enhancement: 'Solicitud de Mejora',
    consult: 'Consulta',
    support: 'Soporte',
    documentation: 'Documentación',
    other: 'Otro'
  };

  // Helper to format unknown types (e.g. "urgent_fix" -> "Urgent Fix")
  const formatLabel = (str: string) => {
    if (knownLabels[str]) return knownLabels[str];
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Deterministic color generation for any string
  const getColorClasses = (str: string) => {
    // Specific overrides
    const overrides: Record<string, string> = {
      feature: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
      bug: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
      enhancement: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
      consult: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
      support: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
      other: 'bg-gray-100 text-gray-700 dark:bg-slate-500/10 dark:text-slate-400'
    };

    if (overrides[str]) return overrides[str];

    // Palette of consistent Tailwind colors
    const palette = [
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400',
      'bg-pink-100 text-pink-700 dark:bg-pink-500/10 dark:text-pink-400',
      'bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400',
      'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
      'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400',
      'bg-lime-100 text-lime-700 dark:bg-lime-500/10 dark:text-lime-400',
      'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/10 dark:text-fuchsia-400',
      'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
      'bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
    ];

    // Simple hash function to pick a color
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Use the absolute value of hash to ensure positive index
    const index = Math.abs(hash) % palette.length;
    return palette[index];
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap ${getColorClasses(type)}`}>
      {formatLabel(type)}
    </span>
  );
}

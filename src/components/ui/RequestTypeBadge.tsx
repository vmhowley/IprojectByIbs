interface RequestTypeBadgeProps {
  type: string;
}

export function RequestTypeBadge({ type }: RequestTypeBadgeProps) {
  const getTypeStyles = (requestType: string) => {
    switch (requestType) {
      case 'feature':
        return 'bg-blue-100 text-blue-700';
      case 'bug':
        return 'bg-red-100 text-red-700';
        case 'enhancement':
        return 'bg-purple-100 text-purple-700';
      case 'other':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeLabel = (requestType: string) => {
    switch (requestType) {
      case 'feature':
        return 'Requerimiento de Adecuación';
      case 'bug':
        return 'Incidencia Reportada';
      case 'enhancement':
        return 'Solicitud de Mejora';
      case 'other':
        return 'Otro';
      default:
        return requestType;
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getTypeStyles(type)}`}>
      {getTypeLabel(type)}
    </span>
  );
}

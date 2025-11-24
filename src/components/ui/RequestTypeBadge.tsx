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
      case 'support':
        return 'bg-green-100 text-green-700';
      case 'enhancement':
        return 'bg-purple-100 text-purple-700';
      case 'documentation':
        return 'bg-yellow-100 text-yellow-700';
      case 'other':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeLabel = (requestType: string) => {
    switch (requestType) {
      case 'feature':
        return 'Feature';
      case 'bug':
        return 'Bug';
      case 'support':
        return 'Support';
      case 'enhancement':
        return 'Enhancement';
      case 'documentation':
        return 'Docs';
      case 'other':
        return 'Other';
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

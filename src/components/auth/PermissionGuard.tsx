import { ReactNode } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { Project, Ticket } from '../../types';

interface PermissionGuardProps {
  action: 'create' | 'update' | 'delete';
  resource?: Project | Ticket;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({ action, resource, children, fallback = null }: PermissionGuardProps) {
  const { canCreate, canUpdate, canDelete } = usePermissions();

  let hasPermission = false;

  switch (action) {
    case 'create':
      hasPermission = canCreate();
      break;
    case 'update':
      hasPermission = resource ? canUpdate(resource) : false;
      break;
    case 'delete':
      hasPermission = resource ? canDelete(resource) : false;
      break;
  }

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

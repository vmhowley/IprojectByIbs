import { Project, Ticket } from '../types';
import { useAuth } from './useAuth';

export function usePermissions() {
  const { user } = useAuth();

  /**
   * Check if user is admin
   */
  function isAdmin(): boolean {
    return user?.role === 'admin';
  }

  /**
   * Check if user can create resources
   */
  function canCreate(): boolean {
    if (!user) return false;
    return user.role === 'admin' || user.role === 'user';
  }

  /**
   * Check if user can update a resource
   */
  function canUpdate(resource: Project | Ticket): boolean {
    if (!user) return false;
    
    // Admins can update anything
    if (user.role === 'admin') return true;
    
    // Users can only update their own resources
    if (user.role === 'user') {
      return resource.created_by === user.id;
    }
    
    // Guests cannot update
    return false;
  }

  /**
   * Check if user can delete a resource
   */
  function canDelete(resource: Project | Ticket): boolean {
    if (!user) return false;
    
    // Admins can delete anything
    if (user.role === 'admin') return true;
    
    // Users can only delete their own resources
    if (user.role === 'user') {
      return resource.created_by === user.id;
    }
    
    // Guests cannot delete
    return false;
  }

  /**
   * Check if user has a specific role
   */
  function hasRole(role: 'admin' | 'user' | 'guest'): boolean {
    return user?.role === role;
  }

  return {
    isAdmin,
    canCreate,
    canUpdate,
    canDelete,
    hasRole,
  };
}

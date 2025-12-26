import { derived, type Readable } from 'svelte/store';
import { barista } from './auth';
import type { Barista, Bean, Bag, Roaster } from '@shared/types';

export interface PermissionContext {
  canEdit: boolean;
  canDelete: boolean;
  canCreate: boolean;
  isOwner: boolean;
  isAdmin: boolean;
}

/**
 * Permission service for managing user permissions across the application
 */
class PermissionService {
  /**
   * Check if the current user is an admin
   */
  isAdmin(currentBarista: Barista | null): boolean {
    return currentBarista?.is_admin === true;
  }

  /**
   * Check if the current user owns a specific entity
   */
  isOwner(currentBarista: Barista | null, ownerId: string): boolean {
    return currentBarista?.id === ownerId;
  }

  /**
   * Get permission context for bean operations
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
   */
  getBeanPermissions(currentBarista: Barista | null, bean?: Bean): PermissionContext {
    const isAdmin = this.isAdmin(currentBarista);
    const isAuthenticated = !!currentBarista;

    return {
      canEdit: isAuthenticated, // Any authenticated barista can edit beans (6.2)
      canDelete: isAdmin, // Only admins can delete beans (6.5)
      canCreate: isAuthenticated, // Any authenticated barista can create beans (6.1)
      isOwner: false, // Beans don't have individual owners
      isAdmin
    };
  }

  /**
   * Get permission context for roaster operations
   * Requirements: 6.3, 6.4, 6.5
   */
  getRoasterPermissions(currentBarista: Barista | null, roaster?: Roaster): PermissionContext {
    const isAdmin = this.isAdmin(currentBarista);
    const isAuthenticated = !!currentBarista;

    return {
      canEdit: isAuthenticated, // Any authenticated barista can edit roasters (6.4)
      canDelete: isAdmin, // Only admins can delete roasters (6.5)
      canCreate: isAuthenticated, // Any authenticated barista can create roasters (6.3)
      isOwner: false, // Roasters don't have individual owners
      isAdmin
    };
  }

  /**
   * Get permission context for bag operations
   * Requirements: 7.2, 7.3, 7.4, 7.5
   */
  getBagPermissions(currentBarista: Barista | null, bag?: Bag): PermissionContext {
    const isAdmin = this.isAdmin(currentBarista);
    const isAuthenticated = !!currentBarista;
    const isOwner = bag ? this.isOwner(currentBarista, bag.owner_id) : false;

    return {
      canEdit: isOwner || isAdmin, // Only bag owner and admins can edit bags (7.3)
      canDelete: isOwner || isAdmin, // Only bag owner and admins can delete bags (7.4)
      canCreate: isAuthenticated, // Any authenticated barista can create bags (7.2)
      isOwner,
      isAdmin
    };
  }

  /**
   * Handle permission errors with user-friendly messages
   */
  getPermissionErrorMessage(action: string, entityType: string): string {
    switch (action) {
      case 'edit':
        return `You don't have permission to edit this ${entityType}.`;
      case 'delete':
        return `You don't have permission to delete this ${entityType}. Only administrators can delete ${entityType}s.`;
      case 'create':
        return `You must be logged in to create a ${entityType}.`;
      default:
        return `You don't have permission to perform this action.`;
    }
  }

  /**
   * Check if an API error is a permission error
   */
  isPermissionError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return message.includes('403') || 
           message.includes('forbidden') || 
           message.includes('unauthorized') ||
           message.includes('permission denied') ||
           message.includes('access denied');
  }

  /**
   * Handle API permission errors gracefully
   */
  handlePermissionError(error: Error, action: string, entityType: string): string {
    if (this.isPermissionError(error)) {
      return this.getPermissionErrorMessage(action, entityType);
    }
    return error.message;
  }
}

// Export singleton instance
export const permissionService = new PermissionService();

// Derived stores for common permission checks
export const isAdmin: Readable<boolean> = derived(
  barista,
  ($barista) => permissionService.isAdmin($barista)
);

export const canCreateBeans: Readable<boolean> = derived(
  barista,
  ($barista) => permissionService.getBeanPermissions($barista).canCreate
);

export const canCreateRoasters: Readable<boolean> = derived(
  barista,
  ($barista) => permissionService.getRoasterPermissions($barista).canCreate
);

export const canCreateBags: Readable<boolean> = derived(
  barista,
  ($barista) => permissionService.getBagPermissions($barista).canCreate
);

// Helper functions for component use
export function getBeanPermissions(currentBarista: Barista | null, bean?: Bean): PermissionContext {
  return permissionService.getBeanPermissions(currentBarista, bean);
}

export function getRoasterPermissions(currentBarista: Barista | null, roaster?: Roaster): PermissionContext {
  return permissionService.getRoasterPermissions(currentBarista, roaster);
}

export function getBagPermissions(currentBarista: Barista | null, bag?: Bag): PermissionContext {
  return permissionService.getBagPermissions(currentBarista, bag);
}

export function handlePermissionError(error: Error, action: string, entityType: string): string {
  return permissionService.handlePermissionError(error, action, entityType);
}
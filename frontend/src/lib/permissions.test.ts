import { describe, it, expect } from 'vitest';
import { permissionService } from './permissions';
import type { Barista, Bean, Bag, Roaster } from '@shared/types';

describe('Permission Service', () => {
  const mockBarista: Barista = {
    id: 'barista-1',
    created_at: '2024-01-01T00:00:00Z',
    first_name: 'Test',
    last_name: 'User',
    display_name: 'Test User',
    email: 'test@example.com',
    is_admin: false
  };

  const mockAdmin: Barista = {
    ...mockBarista,
    id: 'admin-1',
    is_admin: true
  };

  const mockBean: Bean = {
    id: 'bean-1',
    created_at: '2024-01-01T00:00:00Z',
    roaster_id: 'roaster-1',
    name: 'Test Bean',
    roast_level: 'Medium'
  };

  const mockBag: Bag = {
    id: 'bag-1',
    created_at: '2024-01-01T00:00:00Z',
    bean_id: 'bean-1',
    owner_id: 'barista-1'
  };

  const mockRoaster: Roaster = {
    id: 'roaster-1',
    created_at: '2024-01-01T00:00:00Z',
    name: 'Test Roaster'
  };

  describe('Bean Permissions', () => {
    it('should allow authenticated users to create and edit beans', () => {
      const permissions = permissionService.getBeanPermissions(mockBarista, mockBean);
      
      expect(permissions.canCreate).toBe(true);
      expect(permissions.canEdit).toBe(true);
      expect(permissions.canDelete).toBe(false);
      expect(permissions.isAdmin).toBe(false);
    });

    it('should only allow admins to delete beans', () => {
      const adminPermissions = permissionService.getBeanPermissions(mockAdmin, mockBean);
      const userPermissions = permissionService.getBeanPermissions(mockBarista, mockBean);
      
      expect(adminPermissions.canDelete).toBe(true);
      expect(userPermissions.canDelete).toBe(false);
    });

    it('should deny all permissions to unauthenticated users', () => {
      const permissions = permissionService.getBeanPermissions(null, mockBean);
      
      expect(permissions.canCreate).toBe(false);
      expect(permissions.canEdit).toBe(false);
      expect(permissions.canDelete).toBe(false);
    });
  });

  describe('Roaster Permissions', () => {
    it('should allow authenticated users to create and edit roasters', () => {
      const permissions = permissionService.getRoasterPermissions(mockBarista, mockRoaster);
      
      expect(permissions.canCreate).toBe(true);
      expect(permissions.canEdit).toBe(true);
      expect(permissions.canDelete).toBe(false);
    });

    it('should only allow admins to delete roasters', () => {
      const adminPermissions = permissionService.getRoasterPermissions(mockAdmin, mockRoaster);
      const userPermissions = permissionService.getRoasterPermissions(mockBarista, mockRoaster);
      
      expect(adminPermissions.canDelete).toBe(true);
      expect(userPermissions.canDelete).toBe(false);
    });
  });

  describe('Bag Permissions', () => {
    it('should allow bag owners to edit and delete their bags', () => {
      const permissions = permissionService.getBagPermissions(mockBarista, mockBag);
      
      expect(permissions.canEdit).toBe(true);
      expect(permissions.canDelete).toBe(true);
      expect(permissions.isOwner).toBe(true);
    });

    it('should deny edit/delete permissions to non-owners', () => {
      const otherUser: Barista = { ...mockBarista, id: 'other-user' };
      const permissions = permissionService.getBagPermissions(otherUser, mockBag);
      
      expect(permissions.canEdit).toBe(false);
      expect(permissions.canDelete).toBe(false);
      expect(permissions.isOwner).toBe(false);
    });

    it('should allow admins to edit and delete any bag', () => {
      const permissions = permissionService.getBagPermissions(mockAdmin, mockBag);
      
      expect(permissions.canEdit).toBe(true);
      expect(permissions.canDelete).toBe(true);
      expect(permissions.isAdmin).toBe(true);
    });

    it('should allow authenticated users to create bags', () => {
      const permissions = permissionService.getBagPermissions(mockBarista);
      
      expect(permissions.canCreate).toBe(true);
    });
  });

  describe('Permission Error Handling', () => {
    it('should identify permission errors correctly', () => {
      const permissionError = new Error('HTTP 403: Forbidden');
      const networkError = new Error('Network error');
      
      expect(permissionService.isPermissionError(permissionError)).toBe(true);
      expect(permissionService.isPermissionError(networkError)).toBe(false);
    });

    it('should provide appropriate error messages', () => {
      const editMessage = permissionService.getPermissionErrorMessage('edit', 'bean');
      const deleteMessage = permissionService.getPermissionErrorMessage('delete', 'bean');
      
      expect(editMessage).toContain('edit');
      expect(editMessage).toContain('bean');
      expect(deleteMessage).toContain('delete');
      expect(deleteMessage).toContain('administrators');
    });
  });
});
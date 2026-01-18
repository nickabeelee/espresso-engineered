import { apiClient } from './api-client.js';
import type { 
  Brew, 
  Bean, 
  Bag, 
  Grinder, 
  Machine, 
  Roaster, 
  Barista,
  BrewFilters 
} from '../../../shared/types/index.js';

/**
 * Admin service for managing all entities with admin privileges
 */
export class AdminService {
  
  /**
   * Get admin dashboard data
   */
  async getDashboard(): Promise<{
    totalBrews: number;
    totalBaristas: number;
    recentBrews: Brew[];
    flaggedContent: any[];
  }> {
    const response = await apiClient.get('/admin/dashboard');
    return response.data;
  }

  /**
   * Brew management
   */
  async getAllBrews(filters?: BrewFilters): Promise<Brew[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await apiClient.get(`/admin/brews?${params.toString()}`);
    return response.data;
  }

  async getBrewById(id: string): Promise<Brew> {
    const response = await apiClient.get(`/admin/brews/${id}`);
    return response.data;
  }

  async updateBrew(id: string, data: Partial<Brew>): Promise<Brew> {
    const response = await apiClient.put(`/admin/brews/${id}`, data);
    return response.data;
  }

  async deleteBrew(id: string): Promise<void> {
    await apiClient.delete(`/admin/brews/${id}`);
  }

  async cancelGuestReflection(id: string): Promise<Brew> {
    const response = await apiClient.post(`/admin/brews/${id}/guest-cancel`);
    return response.data;
  }

  /**
   * Barista management
   */
  async getAllBaristas(): Promise<Barista[]> {
    const response = await apiClient.get('/admin/baristas');
    return response.data;
  }

  /**
   * Bean management
   */
  async getAllBeans(): Promise<Bean[]> {
    const response = await apiClient.get('/admin/beans');
    return response.data;
  }

  async updateBean(id: string, data: Partial<Bean>): Promise<Bean> {
    const response = await apiClient.put(`/admin/beans/${id}`, data);
    return response.data;
  }

  async deleteBean(id: string): Promise<void> {
    await apiClient.delete(`/admin/beans/${id}`);
  }

  /**
   * Bag management
   */
  async getAllBags(): Promise<Bag[]> {
    const response = await apiClient.get('/admin/bags');
    return response.data;
  }

  async updateBag(id: string, data: Partial<Bag>): Promise<Bag> {
    const response = await apiClient.put(`/admin/bags/${id}`, data);
    return response.data;
  }

  async deleteBag(id: string): Promise<void> {
    await apiClient.delete(`/admin/bags/${id}`);
  }

  /**
   * Name override operations
   */
  async overrideBagName(id: string, name: string, reason?: string): Promise<Bag> {
    const response = await apiClient.put(`/admin/bags/${id}/name`, { name, reason });
    return response.data;
  }

  async overrideBrewName(id: string, name: string, reason?: string): Promise<Brew> {
    const response = await apiClient.put(`/admin/brews/${id}/name`, { name, reason });
    return response.data;
  }

  /**
   * Grinder management
   */
  async getAllGrinders(): Promise<Grinder[]> {
    const response = await apiClient.get('/admin/grinders');
    return response.data;
  }

  async updateGrinder(id: string, data: Partial<Grinder>): Promise<Grinder> {
    const response = await apiClient.put(`/admin/grinders/${id}`, data);
    return response.data;
  }

  async deleteGrinder(id: string): Promise<void> {
    await apiClient.delete(`/admin/grinders/${id}`);
  }

  /**
   * Machine management
   */
  async getAllMachines(): Promise<Machine[]> {
    const response = await apiClient.get('/admin/machines');
    return response.data;
  }

  async updateMachine(id: string, data: Partial<Machine>): Promise<Machine> {
    const response = await apiClient.put(`/admin/machines/${id}`, data);
    return response.data;
  }

  async deleteMachine(id: string): Promise<void> {
    await apiClient.delete(`/admin/machines/${id}`);
  }

  /**
   * Roaster management
   */
  async getAllRoasters(): Promise<Roaster[]> {
    const response = await apiClient.get('/admin/roasters');
    return response.data;
  }

  async updateRoaster(id: string, data: Partial<Roaster>): Promise<Roaster> {
    const response = await apiClient.put(`/admin/roasters/${id}`, data);
    return response.data;
  }

  async deleteRoaster(id: string): Promise<void> {
    await apiClient.delete(`/admin/roasters/${id}`);
  }
}

export const adminService = new AdminService();

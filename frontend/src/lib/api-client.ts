import { getAuthToken } from './supabase';
import type { 
  ApiResponse, 
  ListResponse, 
  Brew, 
  BrewDraft,
  CreateBrewRequest,
  UpdateBrewRequest,
  PrefillData,
  Bean,
  Bag,
  Grinder,
  Machine,
  Roaster,
  CreateBeanRequest,
  CreateBagRequest,
  CreateGrinderRequest,
  CreateMachineRequest,
  CreateRoasterRequest,
  BrewFilters,
  PaginationParams
} from '@shared/types';

// API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

class ApiClient {
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const token = await getAuthToken();
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Brew endpoints
  async getBrews(filters?: BrewFilters, pagination?: PaginationParams): Promise<ListResponse<Brew>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    if (pagination) {
      Object.entries(pagination).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const queryString = params.toString();
    const endpoint = `/brews${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest<ListResponse<Brew>>(endpoint);
  }

  async getBrew(id: string): Promise<ApiResponse<Brew>> {
    return this.makeRequest<ApiResponse<Brew>>(`/brews/${id}`);
  }

  async createBrew(brew: CreateBrewRequest): Promise<ApiResponse<Brew>> {
    return this.makeRequest<ApiResponse<Brew>>('/brews', {
      method: 'POST',
      body: JSON.stringify(brew),
    });
  }

  async updateBrew(id: string, brew: Partial<UpdateBrewRequest>): Promise<ApiResponse<Brew>> {
    return this.makeRequest<ApiResponse<Brew>>(`/brews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(brew),
    });
  }

  async deleteBrew(id: string): Promise<ApiResponse<void>> {
    return this.makeRequest<ApiResponse<void>>(`/brews/${id}`, {
      method: 'DELETE',
    });
  }

  async completeBrew(id: string, completionData: Partial<Brew>): Promise<ApiResponse<Brew>> {
    return this.makeRequest<ApiResponse<Brew>>(`/brews/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(completionData),
    });
  }

  async getPrefillData(): Promise<ApiResponse<PrefillData>> {
    return this.makeRequest<ApiResponse<PrefillData>>('/brews/prefill');
  }

  async getDraftBrews(): Promise<ListResponse<Brew>> {
    return this.makeRequest<ListResponse<Brew>>('/brews/drafts');
  }

  async batchSyncBrews(drafts: BrewDraft[]): Promise<ApiResponse<Brew[]>> {
    return this.makeRequest<ApiResponse<Brew[]>>('/brews/batch-sync', {
      method: 'POST',
      body: JSON.stringify({ drafts }),
    });
  }

  // Entity endpoints
  async getBeans(): Promise<ListResponse<Bean>> {
    return this.makeRequest<ListResponse<Bean>>('/beans');
  }

  async createBean(bean: CreateBeanRequest): Promise<ApiResponse<Bean>> {
    return this.makeRequest<ApiResponse<Bean>>('/beans', {
      method: 'POST',
      body: JSON.stringify(bean),
    });
  }

  async getBags(): Promise<ListResponse<Bag>> {
    return this.makeRequest<ListResponse<Bag>>('/bags');
  }

  async createBag(bag: CreateBagRequest): Promise<ApiResponse<Bag>> {
    return this.makeRequest<ApiResponse<Bag>>('/bags', {
      method: 'POST',
      body: JSON.stringify(bag),
    });
  }

  async getGrinders(): Promise<ListResponse<Grinder>> {
    return this.makeRequest<ListResponse<Grinder>>('/grinders');
  }

  async createGrinder(grinder: CreateGrinderRequest): Promise<ApiResponse<Grinder>> {
    return this.makeRequest<ApiResponse<Grinder>>('/grinders', {
      method: 'POST',
      body: JSON.stringify(grinder),
    });
  }

  async getMachines(): Promise<ListResponse<Machine>> {
    return this.makeRequest<ListResponse<Machine>>('/machines');
  }

  async createMachine(machine: CreateMachineRequest): Promise<ApiResponse<Machine>> {
    return this.makeRequest<ApiResponse<Machine>>('/machines', {
      method: 'POST',
      body: JSON.stringify(machine),
    });
  }

  async getRoasters(): Promise<ListResponse<Roaster>> {
    return this.makeRequest<ListResponse<Roaster>>('/roasters');
  }

  async createRoaster(roaster: CreateRoasterRequest): Promise<ApiResponse<Roaster>> {
    return this.makeRequest<ApiResponse<Roaster>>('/roasters', {
      method: 'POST',
      body: JSON.stringify(roaster),
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export individual methods for convenience
export const {
  getBrews,
  getBrew,
  createBrew,
  updateBrew,
  deleteBrew,
  completeBrew,
  getPrefillData,
  getDraftBrews,
  batchSyncBrews,
  getBeans,
  createBean,
  getBags,
  createBag,
  getGrinders,
  createGrinder,
  getMachines,
  createMachine,
  getRoasters,
  createRoaster
} = apiClient;
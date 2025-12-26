import { getAuthToken } from './supabase';
import { getTimezoneForAPI } from './utils/timezone';
import type { 
  ApiResponse, 
  ListResponse, 
  Brew, 
  BrewDraft,
  CreateBrewRequest,
  UpdateBrewRequest,
  PrefillData,
  Bean,
  BeanWithContext,
  Bag,
  Grinder,
  Machine,
  Roaster,
  Barista,
  CreateBeanRequest,
  CreateBagRequest,
  CreateGrinderRequest,
  CreateMachineRequest,
  CreateRoasterRequest,
  CreateBeanRatingRequest,
  UpdateBeanRatingRequest,
  BrewFilters,
  BeanFilters,
  PaginationParams
} from '@shared/types';

// API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

function stripNullish<T extends Record<string, unknown>>(data: T): Partial<T> {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return data;
  }

  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== null && value !== undefined)
  ) as Partial<T>;
}

class ApiClient {
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const token = await getAuthToken();
    const hasBody = options.body !== undefined && options.body !== null;
    
    const headers: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> | undefined),
    };

    if (hasBody && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    if (!text) {
      return undefined as T;
    }

    return JSON.parse(text) as T;
  }

  // Generic HTTP methods for admin service
  async get<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'DELETE',
    });
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
    // Include timezone information for accurate time formatting
    const timezoneInfo = getTimezoneForAPI();
    
    const brewWithTimezone = {
      ...brew,
      _timezone: timezoneInfo
    };
    
    return this.makeRequest<ApiResponse<Brew>>('/brews', {
      method: 'POST',
      body: JSON.stringify(brewWithTimezone),
    });
  }

  async previewBrewName(bag_id: string): Promise<ApiResponse<{ name: string }>> {
    // Include timezone information for accurate time formatting in preview
    const timezoneInfo = getTimezoneForAPI();
    
    return this.makeRequest<ApiResponse<{ name: string }>>('/brews/preview-name', {
      method: 'POST',
      body: JSON.stringify({ 
        bag_id,
        _timezone: timezoneInfo
      }),
    });
  }

  async updateBrew(id: string, brew: Partial<UpdateBrewRequest>): Promise<ApiResponse<Brew>> {
    const sanitizedBrew = stripNullish(brew);
    return this.makeRequest<ApiResponse<Brew>>(`/brews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sanitizedBrew),
    });
  }

  async deleteBrew(id: string): Promise<ApiResponse<void>> {
    return this.makeRequest<ApiResponse<void>>(`/brews/${id}`, {
      method: 'DELETE',
    });
  }

  async completeBrew(id: string, completionData: Partial<Brew>): Promise<ApiResponse<Brew>> {
    const sanitizedCompletion = stripNullish(completionData);
    return this.makeRequest<ApiResponse<Brew>>(`/brews/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(sanitizedCompletion),
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
      body: JSON.stringify({ brews: drafts }),
    });
  }

  // Entity endpoints
  async getBeans(filters?: BeanFilters, pagination?: PaginationParams): Promise<ListResponse<BeanWithContext>> {
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
    const endpoint = `/beans${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest<ListResponse<BeanWithContext>>(endpoint);
  }

  async getBean(id: string): Promise<ApiResponse<BeanWithContext>> {
    return this.makeRequest<ApiResponse<BeanWithContext>>(`/beans/${id}`);
  }

  async createBean(bean: CreateBeanRequest): Promise<ApiResponse<Bean>> {
    return this.makeRequest<ApiResponse<Bean>>('/beans', {
      method: 'POST',
      body: JSON.stringify(bean),
    });
  }

  async createBeanRating(beanId: string, rating: CreateBeanRatingRequest): Promise<ApiResponse<void>> {
    return this.makeRequest<ApiResponse<void>>(`/beans/${beanId}/rating`, {
      method: 'POST',
      body: JSON.stringify(rating),
    });
  }

  async updateBeanRating(beanId: string, rating: UpdateBeanRatingRequest): Promise<ApiResponse<void>> {
    return this.makeRequest<ApiResponse<void>>(`/beans/${beanId}/rating`, {
      method: 'PUT',
      body: JSON.stringify(rating),
    });
  }

  async deleteBeanRating(beanId: string): Promise<ApiResponse<void>> {
    return this.makeRequest<ApiResponse<void>>(`/beans/${beanId}/rating`, {
      method: 'DELETE',
    });
  }

  async getBags(): Promise<ListResponse<Bag>> {
    return this.makeRequest<ListResponse<Bag>>('/bags');
  }

  async getBag(id: string): Promise<ApiResponse<Bag>> {
    return this.makeRequest<ApiResponse<Bag>>(`/bags/${id}`);
  }

  async createBag(bag: CreateBagRequest): Promise<ApiResponse<Bag>> {
    return this.makeRequest<ApiResponse<Bag>>('/bags', {
      method: 'POST',
      body: JSON.stringify(bag),
    });
  }

  async previewBagName(bean_id: string, roast_date?: string): Promise<ApiResponse<{ name: string }>> {
    return this.makeRequest<ApiResponse<{ name: string }>>('/bags/preview-name', {
      method: 'POST',
      body: JSON.stringify({ bean_id, roast_date }),
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

  async updateGrinder(id: string, grinder: Partial<CreateGrinderRequest>): Promise<ApiResponse<Grinder>> {
    const sanitizedGrinder = stripNullish(grinder);
    return this.makeRequest<ApiResponse<Grinder>>(`/grinders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sanitizedGrinder),
    });
  }

  async deleteGrinder(id: string): Promise<ApiResponse<void>> {
    return this.makeRequest<ApiResponse<void>>(`/grinders/${id}`, {
      method: 'DELETE',
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

  async updateMachine(id: string, machine: Partial<CreateMachineRequest>): Promise<ApiResponse<Machine>> {
    const sanitizedMachine = stripNullish(machine);
    return this.makeRequest<ApiResponse<Machine>>(`/machines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sanitizedMachine),
    });
  }

  async deleteMachine(id: string): Promise<ApiResponse<void>> {
    return this.makeRequest<ApiResponse<void>>(`/machines/${id}`, {
      method: 'DELETE',
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

  async getBaristas(): Promise<ListResponse<Barista>> {
    return this.makeRequest<ListResponse<Barista>>('/baristas');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export individual methods for convenience
export const {
  getBrews,
  getBrew,
  createBrew,
  previewBrewName,
  updateBrew,
  deleteBrew,
  completeBrew,
  getPrefillData,
  getDraftBrews,
  batchSyncBrews,
  getBeans,
  getBean,
  createBean,
  createBeanRating,
  updateBeanRating,
  deleteBeanRating,
  getBags,
  getBag,
  createBag,
  previewBagName,
  getGrinders,
  createGrinder,
  updateGrinder,
  deleteGrinder,
  getMachines,
  createMachine,
  updateMachine,
  deleteMachine,
  getRoasters,
  createRoaster,
  getBaristas
} = apiClient;

import { browser } from '$app/environment';
import { authService } from './auth';
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
  BeanWithContext,
  Bag,
  Grinder,
  Machine,
  Roaster,
  Barista,
  CreateBeanRequest,
  CreateBagRequest,
  UpdateBagRequest,
  CreateGrinderRequest,
  CreateMachineRequest,
  CreateRoasterRequest,
  CreateBeanRatingRequest,
  UpdateBeanRatingRequest,
  BrewFilters,
  BeanFilters,
  PaginationParams,
  GuestTokenResponse
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

    if (response.status === 401 && browser) {
      await authService.handleUnauthorizedSession();
    }
    
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
    return this.makeRequest<ApiResponse<Brew>>('/brews', {
      method: 'POST',
      body: JSON.stringify(brew),
    });
  }

  async updateBrew(id: string, brew: Partial<UpdateBrewRequest>): Promise<ApiResponse<Brew>> {
    const sanitizedBrew = stripNullish(brew);
    return this.makeRequest<ApiResponse<Brew>>(`/brews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sanitizedBrew),
    });
  }

  async requestGuestReflectionToken(id: string): Promise<ApiResponse<GuestTokenResponse>> {
    return this.makeRequest<ApiResponse<GuestTokenResponse>>(`/brews/${id}/guest-token`, {
      method: 'POST'
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

  async getWeekBrews(params?: { week_start?: string }): Promise<{
    data: Array<{
      barista: {
        id: string;
        display_name: string;
      };
      bean: {
        id: string;
        name: string;
        roast_level: string;
        image_path?: string | null;
        roaster: {
          id: string;
          name: string;
        };
      };
      brews: Array<Brew & {
        grinder?: {
          image_path?: string | null;
        };
        machine?: {
          image_path?: string | null;
        };
      }>;
      stackDepth: number;
    }>;
    week_start: string;
  }> {
    const searchParams = new URLSearchParams();
    if (params?.week_start) searchParams.append('week_start', params.week_start);
    
    const queryString = searchParams.toString();
    const url = queryString ? `/brews/week?${queryString}` : '/brews/week';
    return this.makeRequest<{
      data: Array<{
        barista: {
          id: string;
          display_name: string;
        };
        bean: {
          id: string;
          name: string;
          roast_level: string;
          image_path?: string | null;
          roaster: {
            id: string;
            name: string;
          };
        };
        brews: Array<Brew & {
          grinder?: {
            image_path?: string | null;
          };
          machine?: {
            image_path?: string | null;
          };
        }>;
        stackDepth: number;
      }>;
      week_start: string;
    }>(url);
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

  async updateBean(id: string, bean: Partial<CreateBeanRequest>): Promise<ApiResponse<Bean>> {
    const sanitizedBean = stripNullish(bean);
    return this.makeRequest<ApiResponse<Bean>>(`/beans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sanitizedBean),
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

  async getBags(params?: { bean_id?: string; active_only?: boolean; inventory_status?: string; include_community?: boolean }): Promise<ListResponse<Bag>> {
    const searchParams = new URLSearchParams();
    if (params?.bean_id) searchParams.append('bean_id', params.bean_id);
    if (params?.active_only) searchParams.append('active_only', 'true');
    if (params?.inventory_status) searchParams.append('inventory_status', params.inventory_status);
    if (params?.include_community) searchParams.append('include_community', 'true');
    
    const queryString = searchParams.toString();
    const url = queryString ? `/bags?${queryString}` : '/bags';
    return this.makeRequest<ListResponse<Bag>>(url);
  }

  async getBagInventory(): Promise<ListResponse<Bag> & { current_week_start: string }> {
    return this.makeRequest<ListResponse<Bag> & { current_week_start: string }>('/bags/inventory');
  }

  async getBrewAnalysis(params?: { 
    bean_id?: string; 
    bag_id?: string; 
    recency?: '2D' | 'W' | 'M' | '3M' | 'Y';
    include_community?: boolean;
  }): Promise<{
    data: Array<{
      id: string;
      barista_id: string;
      name?: string;
      x_ratio: number | null;
      x_brew_time: number | null;
      y_rating: number | null;
      bag_id: string;
      bag_name?: string;
      grind_setting?: string;
      date: string;
    }>;
    count: number;
    bean?: any;
    bag?: any;
    filters: any;
  }> {
    const searchParams = new URLSearchParams();
    if (params?.bean_id) searchParams.append('bean_id', params.bean_id);
    if (params?.bag_id) searchParams.append('bag_id', params.bag_id);
    if (params?.recency) searchParams.append('recency', params.recency);
    if (params?.include_community) searchParams.append('include_community', 'true');
    
    const queryString = searchParams.toString();
    const url = queryString ? `/brews/analysis?${queryString}` : '/brews/analysis';
    return this.makeRequest<{
      data: Array<{
        id: string;
        barista_id: string;
        name?: string;
        x_ratio: number | null;
        x_brew_time: number | null;
        y_rating: number | null;
        bag_id: string;
        bag_name?: string;
        grind_setting?: string;
        date: string;
      }>;
      count: number;
      bean?: any;
      bag?: any;
      filters: any;
    }>(url);
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

  async updateBag(id: string, bag: Partial<UpdateBagRequest>): Promise<ApiResponse<Bag>> {
    const sanitizedBag = stripNullish(bag);
    return this.makeRequest<ApiResponse<Bag>>(`/bags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sanitizedBag),
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
  updateBrew,
  deleteBrew,
  completeBrew,
  getPrefillData,
  getDraftBrews,
  batchSyncBrews,
  getBeans,
  getBean,
  createBean,
  updateBean,
  createBeanRating,
  updateBeanRating,
  deleteBeanRating,
  getBags,
  getBag,
  createBag,
  updateBag,
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

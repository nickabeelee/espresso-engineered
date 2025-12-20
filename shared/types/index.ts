// Core data model interfaces for Espresso Engineered
// These interfaces match the database schema and are shared between frontend and backend

export type RoastLevel = 'Light' | 'Medium Light' | 'Medium' | 'Medium Dark' | 'Dark';

export interface Barista {
  id: string; // Primary key used throughout the app (maps to auth.users via FK)
  created_at: string;
  email?: string;
  first_name: string;
  last_name: string;
  display_name: string;
  is_admin?: boolean; // Admin privileges flag
}

export interface Roaster {
  id: string;
  created_at: string;
  name: string;
  website_url?: string;
}

export interface Bean {
  id: string;
  created_at: string;
  roaster_id: string;
  name: string;
  roast_level: RoastLevel;
  country_of_origin?: string;
  tasting_notes?: string;
}

export interface Bag {
  id: string;
  created_at: string;
  bean_id: string;
  owner_id: string; // References barista.id, NOT auth.users.id
  roast_date?: string;
  weight_g?: number; // Weight in grams with 0.1g precision
  price?: number;
  purchase_location?: string;
}

export interface Grinder {
  id: string;
  created_at: string;
  manufacturer: string;
  model: string;
  setting_guide_chart_url?: string;
  image_path?: string;
}

export interface Machine {
  id: string;
  created_at: string;
  manufacturer: string;
  model: string;
  user_manual_link?: string;
  image_path?: string;
}

export interface Brew {
  id: string;
  created_at: string;
  modified_at: string;
  barista_id: string; // References barista.id, NOT auth.users.id
  machine_id: string;
  grinder_id: string;
  bag_id: string;
  name?: string;
  dose_g: number; // Coffee dose in grams with 0.1g precision
  yield_g?: number; // Espresso yield in grams with 0.1g precision
  brew_time_s?: number; // Brew time in seconds with 0.01s precision
  grind_setting?: string;
  flow_rate_g_per_s?: number; // Flow rate in grams per second with 0.01 precision
  ratio?: number; // Brew ratio (yield/dose) with 0.01 precision
  rating?: number;
  tasting_notes?: string;
  reflections?: string;
}

// Draft brew interface for offline storage
export interface BrewDraft extends Partial<Brew> {
  barista_id: string;
  machine_id: string;
  grinder_id: string;
  bag_id: string;
  dose_g: number;
}

// API request/response types
export interface CreateBrewRequest {
  machine_id: string;
  grinder_id: string;
  bag_id: string;
  name?: string;
  dose_g: number;
  yield_g?: number;
  brew_time_s?: number;
  grind_setting?: string;
  rating?: number;
  tasting_notes?: string;
  reflections?: string;
}

export interface UpdateBrewRequest extends Partial<CreateBrewRequest> {
  id: string;
}

export interface PrefillData {
  bag_id: string;
  machine_id: string;
  grinder_id: string;
  grind_setting?: string;
  dose_g: number;
}

// Entity creation types for inline creation
export interface CreateBeanRequest {
  roaster_id: string;
  name: string;
  roast_level: RoastLevel;
  country_of_origin?: string;
  tasting_notes?: string;
}

export interface CreateBagRequest {
  bean_id: string;
  roast_date?: string;
  weight_g?: number;
  price?: number;
  purchase_location?: string;
}

export interface CreateGrinderRequest {
  manufacturer: string;
  model: string;
  setting_guide_chart_url?: string;
  image_path?: string;
}

export interface CreateMachineRequest {
  manufacturer: string;
  model: string;
  user_manual_link?: string;
  image_path?: string;
}

export interface CreateRoasterRequest {
  name: string;
  website_url?: string;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ListResponse<T> {
  data: T[];
  count: number;
  page?: number;
  limit?: number;
}

// Filter and query types
export interface BrewFilters {
  barista_id?: string;
  machine_id?: string;
  grinder_id?: string;
  bag_id?: string;
  rating_min?: number;
  rating_max?: number;
  date_from?: string;
  date_to?: string;
  has_reflections?: boolean;
  is_draft?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

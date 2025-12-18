export type RoastLevel = 'Light' | 'Medium Light' | 'Medium' | 'Medium Dark' | 'Dark';
export interface Barista {
    id: string;
    created_at: string;
    first_name: string;
    last_name: string;
    display_name: string;
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
    owner_id: string;
    roast_date?: string;
    weight_mg?: number;
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
    barista_id: string;
    machine_id: string;
    grinder_id: string;
    bag_id: string;
    name?: string;
    dose_mg: number;
    yield_mg?: number;
    brew_time_ms?: number;
    grind_setting?: string;
    flow_rate_mg_per_s?: number;
    ratio_dec?: number;
    rating?: number;
    tasting_notes?: string;
    reflections?: string;
}
export interface BrewDraft extends Partial<Brew> {
    barista_id: string;
    machine_id: string;
    grinder_id: string;
    bag_id: string;
    dose_mg: number;
}
export interface CreateBrewRequest {
    machine_id: string;
    grinder_id: string;
    bag_id: string;
    name?: string;
    dose_mg: number;
    yield_mg?: number;
    brew_time_ms?: number;
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
    dose_mg: number;
}
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
    weight_mg?: number;
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
//# sourceMappingURL=index.d.ts.map
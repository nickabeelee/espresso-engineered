import { BaseRepository } from './base.js';
import { Bean } from '../types/index.js';
import { supabase } from '../config/supabase.js';

/**
 * Repository for bean entities
 * Beans are global entities accessible to all users
 */
export class BeanRepository extends BaseRepository<Bean> {
  constructor() {
    super('bean');
  }

  /**
   * Find beans by roaster with optional filtering
   */
  async findByRoaster(roasterId: string, filters: { roast_level?: string } = {}): Promise<Bean[]> {
    let query = supabase
      .from(this.tableName)
      .select(`
        *,
        roaster:roaster_id (
          id,
          name,
          website_url
        )
      `)
      .eq('roaster_id', roasterId);

    if (filters.roast_level) {
      query = query.eq('roast_level', filters.roast_level);
    }

    query = query.order('name');

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data as Bean[]) || [];
  }

  /**
   * Find beans with roaster information included
   */
  async findManyWithRoaster(filters: Record<string, any> = {}): Promise<Bean[]> {
    let query = supabase
      .from(this.tableName)
      .select(`
        *,
        roaster:roaster_id (
          id,
          name,
          website_url
        )
      `);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data as Bean[]) || [];
  }

  /**
   * Search beans by name (case-insensitive)
   */
  async searchByName(name: string): Promise<Bean[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        roaster:roaster_id (
          id,
          name,
          website_url
        )
      `)
      .ilike('name', `%${name}%`)
      .order('name');

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data as Bean[]) || [];
  }

  /**
   * Check if bean name already exists for a roaster
   */
  async existsByNameAndRoaster(name: string, roasterId: string, excludeId?: string): Promise<boolean> {
    let query = supabase
      .from(this.tableName)
      .select('id')
      .ilike('name', name)
      .eq('roaster_id', roasterId);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.limit(1);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data?.length || 0) > 0;
  }
}
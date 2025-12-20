import { BaseRepository } from './base.js';
import { Bag } from '../types/index.js';
import { supabase } from '../config/supabase.js';

/**
 * Repository for bag entities
 * Bags are user-owned entities with ownership validation
 */
export class BagRepository extends BaseRepository<Bag> {
  constructor() {
    super('bag');
  }

  /**
   * Bags are user-owned resources
   */
  protected isUserOwnedTable(): boolean {
    return true;
  }

  /**
   * Find bags with bean and roaster information included
   */
  async findManyWithDetails(baristaId: string, filters: Record<string, any> = {}): Promise<Bag[]> {
    let query = supabase
      .from(this.tableName)
      .select(`
        *,
        bean:bean_id (
          id,
          name,
          roast_level,
          country_of_origin,
          tasting_notes,
          roaster:roaster_id (
            id,
            name,
            website_url
          )
        )
      `)
      .eq('owner_id', baristaId);

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

    return (data as Bag[]) || [];
  }

  /**
   * Find bag by ID with bean and roaster details
   */
  async findByIdWithDetails(id: string, baristaId: string): Promise<Bag> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        bean:bean_id (
          id,
          name,
          roast_level,
          country_of_origin,
          tasting_notes,
          roaster:roaster_id (
            id,
            name,
            website_url
          )
        )
      `)
      .eq('id', id)
      .eq('owner_id', baristaId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error(`Bag with id ${id} not found or access denied`);
      }
      throw new Error(`Database error: ${error.message}`);
    }

    return data as Bag;
  }

  /**
   * Find bags by bean ID for a specific barista
   */
  async findByBean(beanId: string, baristaId: string): Promise<Bag[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        bean:bean_id (
          id,
          name,
          roast_level,
          roaster:roaster_id (
            id,
            name
          )
        )
      `)
      .eq('bean_id', beanId)
      .eq('owner_id', baristaId)
      .order('roast_date', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data as Bag[]) || [];
  }

  /**
   * Get active bags (with remaining weight) for a barista
   */
  async findActiveBags(baristaId: string): Promise<Bag[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        bean:bean_id (
          id,
          name,
          roast_level,
          roaster:roaster_id (
            id,
            name
          )
        )
      `)
      .eq('owner_id', baristaId)
      .gt('weight_g', 0) // Only bags with remaining weight
      .order('roast_date', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data as Bag[]) || [];
  }
}

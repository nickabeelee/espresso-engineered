import { BaseRepository } from './base.js';
import { Grinder } from '../types/index.js';
import { supabase } from '../config/supabase.js';

/**
 * Repository for grinder entities
 * Grinders are global entities accessible to all users
 */
export class GrinderRepository extends BaseRepository<Grinder> {
  constructor() {
    super('grinder');
  }

  /**
   * Find grinders by manufacturer
   */
  async findByManufacturer(manufacturer: string): Promise<Grinder[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .ilike('manufacturer', `%${manufacturer}%`)
      .order('manufacturer')
      .order('name');

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data as Grinder[]) || [];
  }

  /**
   * Search grinders by manufacturer or name
   */
  async search(query: string): Promise<Grinder[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .or(`manufacturer.ilike.%${query}%,name.ilike.%${query}%`)
      .order('manufacturer')
      .order('name');

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data as Grinder[]) || [];
  }

  /**
   * Check if grinder name already exists
   */
  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    let query = supabase
      .from(this.tableName)
      .select('id')
      .ilike('name', name);

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
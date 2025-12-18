import { BaseRepository } from './base.js';
import { Roaster } from '../types/index.js';
import { supabase } from '../config/supabase.js';

/**
 * Repository for roaster entities
 * Roasters are global entities accessible to all users
 */
export class RoasterRepository extends BaseRepository<Roaster> {
  constructor() {
    super('roaster');
  }

  /**
   * Find roasters by name (case-insensitive search)
   */
  async findByName(name: string): Promise<Roaster[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .ilike('name', `%${name}%`)
      .order('name');

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data as Roaster[]) || [];
  }

  /**
   * Check if roaster name already exists
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
import { BaseRepository } from './base.js';
import { Machine } from '../types/index.js';
import { supabase } from '../config/supabase.js';

/**
 * Repository for machine entities
 * Machines are global entities accessible to all users
 */
export class MachineRepository extends BaseRepository<Machine> {
  constructor() {
    super('machine');
  }

  /**
   * Find machines by manufacturer
   */
  async findByManufacturer(manufacturer: string): Promise<Machine[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .ilike('manufacturer', `%${manufacturer}%`)
      .order('manufacturer')
      .order('name');

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data as Machine[]) || [];
  }

  /**
   * Search machines by manufacturer or name
   */
  async search(query: string): Promise<Machine[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .or(`manufacturer.ilike.%${query}%,name.ilike.%${query}%`)
      .order('manufacturer')
      .order('name');

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data as Machine[]) || [];
  }

  /**
   * Check if machine name already exists
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
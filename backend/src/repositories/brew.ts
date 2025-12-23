import { BaseRepository } from './base.js';
import type { Brew, BrewFilters, PrefillData } from '../types/index.js';
import { supabase } from '../config/supabase.js';
import { NotFoundError } from '../middleware/error.js';

/**
 * Repository for brew operations with calculated fields and business logic
 */
export class BrewRepository extends BaseRepository<Brew> {
  constructor() {
    super('brew');
  }

  protected isUserOwnedTable(): boolean {
    return true;
  }

  protected getOwnerField(): string {
    return 'barista_id';
  }

  protected hasModifiedAt(): boolean {
    return true;
  }

  /**
   * Create a brew with calculated fields
   */
  async create(data: Partial<Brew>, baristaId: string): Promise<Brew> {
    const brewData = {
      ...data,
      barista_id: baristaId,
      ...this.calculateFields(data)
    };

    return super.create(brewData, baristaId);
  }

  /**
   * Update a brew with calculated fields
   */
  async update(id: string, data: Partial<Brew>, baristaId: string): Promise<Brew> {
    const brewData = {
      ...data,
      ...this.calculateFields(data)
    };

    return super.update(id, brewData, baristaId);
  }

  /**
   * Find brews with advanced filtering
   */
  async findWithFilters(filters: BrewFilters, baristaId?: string): Promise<Brew[]> {
    let query = supabase.from('brew').select('*');

    // Apply barista filter for user-owned data
    if (baristaId) {
      query = query.eq('barista_id', baristaId);
    }

    // Apply other filters
    if (filters.barista_id) {
      query = query.eq('barista_id', filters.barista_id);
    }
    if (filters.machine_id) {
      query = query.eq('machine_id', filters.machine_id);
    }
    if (filters.grinder_id) {
      query = query.eq('grinder_id', filters.grinder_id);
    }
    if (filters.bag_id) {
      query = query.eq('bag_id', filters.bag_id);
    }
    if (filters.rating_min !== undefined) {
      query = query.gte('rating', filters.rating_min);
    }
    if (filters.rating_max !== undefined) {
      query = query.lte('rating', filters.rating_max);
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }
    if (filters.has_reflections !== undefined) {
      if (filters.has_reflections) {
        query = query.not('reflections', 'is', null);
      } else {
        query = query.is('reflections', null);
      }
    }
    if (filters.is_draft !== undefined) {
      if (filters.is_draft) {
        query = query.is('yield_g', null);
      } else {
        query = query.not('yield_g', 'is', null);
      }
    }

    // Order by created_at desc (most recent first)
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data as Brew[]) || [];
  }

  /**
   * Get draft brews (missing yield_g) for a barista
   */
  async findDrafts(baristaId: string): Promise<Brew[]> {
    const { data, error } = await supabase
      .from('brew')
      .select('*')
      .eq('barista_id', baristaId)
      .is('yield_g', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data as Brew[]) || [];
  }

  /**
   * Get prefill data from the most recent brew for a barista
   */
  async getPrefillData(baristaId: string): Promise<PrefillData | null> {
    const { data, error } = await supabase
      .from('brew')
      .select('bag_id, machine_id, grinder_id, grind_setting, dose_g')
      .eq('barista_id', baristaId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No previous brews found
      }
      throw new Error(`Database error: ${error.message}`);
    }

    return data as PrefillData;
  }

  /**
   * Complete a draft brew by adding output measurements
   */
  async completeDraft(
    id: string, 
    outputData: {
      yield_g?: number;
      brew_time_s?: number;
      rating?: number;
      tasting_notes?: string;
      reflections?: string;
    },
    baristaId: string
  ): Promise<Brew> {
    // First verify this is actually a draft
    const existing = await this.findById(id, baristaId);
    if (existing.yield_g !== null) {
      throw new Error('Brew is not a draft - already has yield measurement');
    }

    return this.update(id, outputData, baristaId);
  }

  /**
   * Calculate derived fields (flow_rate_g_per_s and ratio)
   */
  private calculateFields(data: Partial<Brew>): Partial<Brew> {
    const calculated: Partial<Brew> = {};

    // Calculate flow rate: yield_g / brew_time_s
    if (data.yield_g && data.brew_time_s && data.brew_time_s > 0) {
      calculated.flow_rate_g_per_s = data.yield_g / data.brew_time_s;
    }

    // Calculate ratio: yield_g / dose_g
    if (data.yield_g && data.dose_g && data.dose_g > 0) {
      calculated.ratio = data.yield_g / data.dose_g;
    }

    return calculated;
  }
}

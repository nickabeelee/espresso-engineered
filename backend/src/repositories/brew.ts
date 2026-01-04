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
  async update(id: string, data: Partial<Brew>, baristaId?: string): Promise<Brew> {
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
        query = query.or('rating.is.null,tasting_notes.is.null,reflections.is.null');
      } else {
        query = query
          .not('rating', 'is', null)
          .not('tasting_notes', 'is', null)
          .not('reflections', 'is', null);
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
   * Get draft brews (missing rating, tasting_notes, or reflections) for a barista
   */
  async findDrafts(baristaId: string): Promise<Brew[]> {
    const { data, error } = await supabase
      .from('brew')
      .select('*')
      .eq('barista_id', baristaId)
      .or('rating.is.null,tasting_notes.is.null,reflections.is.null')
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
    baristaId?: string
  ): Promise<Brew> {
    // First verify this is actually a draft
    const existing = await this.findById(id, baristaId);
    if (existing.rating !== null && existing.tasting_notes && existing.reflections) {
      throw new Error('Brew is not a draft - reflections are already complete');
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

  /**
   * Get brews from current week starting Monday, grouped by barista and bean
   */
  async findWeekBrews(weekStart?: Date): Promise<any[]> {
    // Calculate current week start (Monday) if not provided
    const currentWeekStart = weekStart || (() => {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Days to subtract to get to Monday
      const weekStartDate = new Date(now);
      weekStartDate.setDate(now.getDate() - daysToMonday);
      weekStartDate.setHours(0, 0, 0, 0);
      return weekStartDate;
    })();

    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 7);

    const { data, error } = await supabase
      .from('brew')
      .select(`
        *,
        barista:barista_id (
          id,
          display_name
        ),
        bean:bag_id (
          bean:bean_id (
            id,
            name,
            roast_level,
            image_path,
            roaster:roaster_id (
              id,
              name
            )
          )
        ),
        bag:bag_id (
          id,
          name
        ),
        machine:machine_id (
          id,
          manufacturer,
          name,
          image_path
        ),
        grinder:grinder_id (
          id,
          manufacturer,
          name,
          image_path
        )
      `)
      .gte('created_at', currentWeekStart.toISOString())
      .lt('created_at', weekEnd.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    const brews = (data as any[]) || [];

    // Group brews by barista_id + bean_id combination
    const groups = new Map<string, any>();
    
    brews.forEach(brew => {
      const baristaId = brew.barista?.id;
      const beanId = brew.bean?.bean?.id;
      const groupKey = `${baristaId}-${beanId}`;
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          barista: brew.barista,
          bean: brew.bean?.bean,
          brews: [],
          stackDepth: 0
        });
      }
      
      groups.get(groupKey)!.brews.push(brew);
    });

    // Convert map to array and set stack depths
    const groupsArray = Array.from(groups.values());
    groupsArray.forEach(group => {
      group.stackDepth = group.brews.length;
    });

    return groupsArray;
  }

  /**
   * Get brew analysis data optimized for D3 scatter plots
   * Supports filtering by bean_id, bag_id, and recency period
   */
  async findAnalysisData(filters: {
    bean_id?: string;
    bag_id?: string;
    recency?: '2D' | 'W' | 'M' | '3M' | 'Y';
    barista_id?: string;
    include_community?: boolean;
  }): Promise<{
    brews: Array<{
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
    bean?: any;
    bag?: any;
  }> {
    let query = supabase
      .from('brew')
      .select(`
        id,
        barista_id,
        name,
        ratio,
        brew_time_s,
        rating,
        grind_setting,
        created_at,
        bag_id,
        bag:bag_id (
          id,
          name,
          bean:bean_id (
            id,
            name,
            roast_level,
            roaster:roaster_id (
              id,
              name
            )
          )
        )
      `);

    // Apply filters
    if (filters.barista_id && !filters.include_community) {
      query = query.eq('barista_id', filters.barista_id);
    }

    if (filters.bag_id) {
      query = query.eq('bag_id', filters.bag_id);
    } else if (filters.bean_id) {
      // If bean_id is provided but not bag_id, filter by bean through bag relationship
      const bagQuery = supabase
        .from('bag')
        .select('id')
        .eq('bean_id', filters.bean_id);
      
      const { data: bags } = await bagQuery;
      if (bags && bags.length > 0) {
        const bagIds = bags.map(bag => bag.id);
        query = query.in('bag_id', bagIds);
      } else {
        // No bags found for this bean, return empty result
        return { brews: [] };
      }
    }

    // Apply recency filter
    if (filters.recency) {
      const now = new Date();
      let cutoffDate: Date;

      switch (filters.recency) {
        case '2D':
          cutoffDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
          break;
        case 'W':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'M':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '3M':
          cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'Y':
          cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = new Date(0); // No filter
      }

      query = query.gte('created_at', cutoffDate.toISOString());
    }

    // Only include brews with rating (for scatter plot)
    query = query.not('rating', 'is', null);
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    const brews = (data as any[]) || [];

    // Transform data for D3 scatter plots
    const transformedBrews = brews.map(brew => ({
      id: brew.id,
      barista_id: brew.barista_id,
      name: brew.name,
      x_ratio: brew.ratio,
      x_brew_time: brew.brew_time_s,
      y_rating: brew.rating,
      bag_id: brew.bag_id,
      bag_name: brew.bag?.name,
      grind_setting: brew.grind_setting,
      date: brew.created_at
    }));

    // Get bean and bag info for response metadata
    let bean, bag;
    if (brews.length > 0) {
      const firstBrew = brews[0];
      bean = firstBrew.bag?.bean;
      if (filters.bag_id) {
        bag = firstBrew.bag;
      }
    }

    return {
      brews: transformedBrews,
      bean,
      bag
    };
  }
}

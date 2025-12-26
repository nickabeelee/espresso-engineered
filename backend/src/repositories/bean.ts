import { BaseRepository } from './base.js';
import { Bean, BeanWithContext, OwnershipStatus, RecentActivity } from '../types/index.js';
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
   * Find beans with roaster and rating context for a specific barista
   */
  async findManyWithContext(baristaId: string, filters: Record<string, any> = {}): Promise<BeanWithContext[]> {
    let query = supabase
      .from(this.tableName)
      .select(`
        *,
        roaster:roaster_id (
          id,
          name,
          website_url
        ),
        bean_rating!left (
          rating,
          barista_id
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

    if (!data) return [];

    // Process each bean to add ownership and usage context
    const beansWithContext = await Promise.all(
      data.map(async (bean: any) => {
        return await this.addOwnershipContext(bean, baristaId);
      })
    );

    return beansWithContext;
  }

  /**
   * Find bean by ID with rating context for a specific barista
   */
  async findByIdWithContext(id: string, baristaId: string): Promise<BeanWithContext> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        roaster:roaster_id (
          id,
          name,
          website_url
        ),
        bean_rating!left (
          rating,
          barista_id
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error(`Bean with id ${id} not found`);
      }
      throw new Error(`Database error: ${error.message}`);
    }

    // Add ownership and usage context
    const beanWithContext = await this.addOwnershipContext(data, baristaId);
    
    // Add recent activity for detail view
    beanWithContext.recent_activity = await this.getRecentActivity(id);

    return beanWithContext;
  }

  /**
   * Search beans by name and tasting notes (case-insensitive)
   */
  async searchByNameAndNotes(searchTerm: string, baristaId?: string): Promise<BeanWithContext[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        roaster:roaster_id (
          id,
          name,
          website_url
        ),
        bean_rating!left (
          rating,
          barista_id
        )
      `)
      .or(`name.ilike.%${searchTerm}%,tasting_notes.ilike.%${searchTerm}%`)
      .order('name');

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data || !baristaId) {
      // Return basic beans without context if no barista ID provided
      return data?.map(bean => ({
        ...bean,
        ownership_status: 'never_owned' as OwnershipStatus,
        personal_rating: null,
        average_rating: null,
        rating_count: 0,
        total_brews: 0,
        most_used_by_me: false,
        bag_count: 0,
        bean_rating: undefined
      })) || [];
    }

    // Process each bean to add ownership and usage context
    const beansWithContext = await Promise.all(
      data.map(async (bean: any) => {
        return await this.addOwnershipContext(bean, baristaId);
      })
    );

    return beansWithContext;
  }

  /**
   * Search beans by name (case-insensitive) - legacy method
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

  /**
   * Add ownership and usage context to a bean
   */
  private async addOwnershipContext(bean: any, baristaId: string): Promise<BeanWithContext> {
    // Process rating data
    const personalRating = bean.bean_rating?.find((r: any) => r.barista_id === baristaId);
    const allRatings = bean.bean_rating || [];
    const averageRating = allRatings.length > 0 
      ? allRatings.reduce((sum: number, r: any) => sum + r.rating, 0) / allRatings.length 
      : null;

    // Calculate ownership status
    const ownershipStatus = await this.calculateOwnershipStatus(bean.id, baristaId);
    
    // Calculate usage statistics
    const usageStats = await this.calculateUsageStats(bean.id, baristaId);
    
    // Calculate bag count for this barista
    const bagCount = await this.getBagCount(bean.id, baristaId);

    return {
      ...bean,
      personal_rating: personalRating?.rating || null,
      average_rating: averageRating,
      rating_count: allRatings.length,
      ownership_status: ownershipStatus,
      total_brews: usageStats.totalBrews,
      most_used_by_me: usageStats.mostUsedByMe,
      bag_count: bagCount,
      bean_rating: undefined // Remove the raw rating data
    };
  }

  /**
   * Calculate ownership status based on bag ownership history
   */
  private async calculateOwnershipStatus(beanId: string, baristaId: string): Promise<OwnershipStatus> {
    const { data, error } = await supabase
      .from('bag')
      .select('id, inventory_status')
      .eq('bean_id', beanId)
      .eq('owner_id', baristaId);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return 'never_owned';
    }

    // Check if any bags are not empty (owned or previously owned with remaining inventory)
    const hasActiveBags = data.some(bag => 
      bag.inventory_status !== 'empty'
    );

    return hasActiveBags ? 'owned' : 'previously_owned';
  }

  /**
   * Calculate usage statistics for a bean and barista
   */
  private async calculateUsageStats(beanId: string, baristaId: string): Promise<{
    totalBrews: number;
    mostUsedByMe: boolean;
  }> {
    // Get total brews for this bean across all baristas (community-wide)
    const { data: allBags, error: allBagsError } = await supabase
      .from('bag')
      .select('id')
      .eq('bean_id', beanId);

    if (allBagsError) {
      throw new Error(`Database error: ${allBagsError.message}`);
    }

    if (!allBags || allBags.length === 0) {
      return { totalBrews: 0, mostUsedByMe: false };
    }

    const allBagIds = allBags.map(bag => bag.id);

    // Get total brew count for this bean (community-wide)
    const { data: allBrews, error: allBrewsError } = await supabase
      .from('brew')
      .select('id')
      .in('bag_id', allBagIds);

    if (allBrewsError) {
      throw new Error(`Database error: ${allBrewsError.message}`);
    }

    const totalBrews = allBrews?.length || 0;

    // Calculate "most used by me" by comparing this barista's usage with other beans
    // First get bags for this bean owned by this barista
    const { data: myBags, error: myBagsError } = await supabase
      .from('bag')
      .select('id')
      .eq('bean_id', beanId)
      .eq('owner_id', baristaId);

    if (myBagsError) {
      throw new Error(`Database error: ${myBagsError.message}`);
    }

    if (!myBags || myBags.length === 0) {
      return { totalBrews, mostUsedByMe: false };
    }

    const myBagIds = myBags.map(bag => bag.id);

    // Get brew count for this bean by this barista
    const { data: myBrews, error: myBrewsError } = await supabase
      .from('brew')
      .select('id')
      .eq('barista_id', baristaId)
      .in('bag_id', myBagIds);

    if (myBrewsError) {
      throw new Error(`Database error: ${myBrewsError.message}`);
    }

    const myBrewCount = myBrews?.length || 0;

    // Determine if this is "most used by me" by comparing with other beans
    // Get brew counts for all beans used by this barista
    const { data: allBrewCounts, error: allBrewCountsError } = await supabase
      .rpc('get_barista_bean_brew_counts', { barista_id_param: baristaId });

    if (allBrewCountsError) {
      // If RPC doesn't exist, fall back to simple logic
      const mostUsedByMe = myBrewCount >= 3; // Simple threshold
      return { totalBrews, mostUsedByMe };
    }

    // Find the maximum brew count for this barista
    const maxBrewCount = Math.max(...(allBrewCounts?.map((item: any) => item.brew_count) || [0]));
    const mostUsedByMe = myBrewCount > 0 && myBrewCount === maxBrewCount && myBrewCount >= 3;

    return { totalBrews, mostUsedByMe };
  }

  /**
   * Get bag count for a bean and barista
   */
  private async getBagCount(beanId: string, baristaId: string): Promise<number> {
    // Get total bag count for this bean across all baristas (community-wide)
    const { data, error } = await supabase
      .from('bag')
      .select('id')
      .eq('bean_id', beanId);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data?.length || 0;
  }

  /**
   * Get recent activity for a bean (for detail view)
   */
  private async getRecentActivity(beanId: string): Promise<RecentActivity[]> {
    const activities: RecentActivity[] = [];

    // First get all bags for this bean
    const { data: bags, error: bagError } = await supabase
      .from('bag')
      .select('id')
      .eq('bean_id', beanId);

    if (bagError) {
      throw new Error(`Database error: ${bagError.message}`);
    }

    if (bags && bags.length > 0) {
      const bagIds = bags.map(bag => bag.id);

      // Get recent brews (last 5)
      const { data: recentBrews, error: brewError } = await supabase
        .from('brew')
        .select(`
          id,
          name,
          created_at,
          barista:barista_id (display_name)
        `)
        .in('bag_id', bagIds)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!brewError && recentBrews) {
        activities.push(...recentBrews.map((brew: any) => ({
          barista_display_name: brew.barista?.display_name || 'Unknown',
          activity_type: 'brew' as const,
          created_at: brew.created_at,
          brew_id: brew.id,
          brew_name: brew.name
        })));
      }
    }

    // Get recent ratings (last 3)
    const { data: recentRatings, error: ratingError } = await supabase
      .from('bean_rating')
      .select(`
        created_at,
        barista:barista_id (display_name)
      `)
      .eq('bean_id', beanId)
      .order('created_at', { ascending: false })
      .limit(3);

    if (!ratingError && recentRatings) {
      activities.push(...recentRatings.map((rating: any) => ({
        barista_display_name: rating.barista?.display_name || 'Unknown',
        activity_type: 'rating' as const,
        created_at: rating.created_at
      })));
    }

    // Sort all activities by date and return top 5
    return activities
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }
}
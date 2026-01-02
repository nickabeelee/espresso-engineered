import { BaseRepository } from './base.js';
import { Bag, BagWithBarista } from '../types/index.js';
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
   * Bag table has modified_at field
   */
  protected hasModifiedAt(): boolean {
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
          image_path,
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
   * Find all bags with bean and roaster information included
   * Community view (no ownership filter)
   */
  async findAllWithDetails(filters: Record<string, any> = {}): Promise<Bag[]> {
    let query = supabase
      .from(this.tableName)
      .select(`
        *,
        bean:bean_id (
          id,
          name,
          image_path,
          roast_level,
          country_of_origin,
          tasting_notes,
          roaster:roaster_id (
            id,
            name,
            website_url
          )
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

    return (data as Bag[]) || [];
  }

  /**
   * Find bag by ID with bean and roaster details
   */
  async findByIdWithDetails(
    id: string,
    baristaId?: string,
    requireOwnership = true
  ): Promise<Bag> {
    let query = supabase
      .from(this.tableName)
      .select(`
        *,
        bean:bean_id (
          id,
          name,
          image_path,
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
      .eq('id', id);

    if (requireOwnership && baristaId) {
      query = query.eq('owner_id', baristaId);
    }

    const { data, error } = await query.single();

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
          image_path,
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
   * Find all bags by bean ID (public view for bean detail pages)
   * Returns all bags for a bean regardless of ownership, relying on RLS for access control
   */
  async findAllByBean(beanId: string): Promise<BagWithBarista[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        bean:bean_id (
          id,
          name,
          image_path,
          roast_level,
          roaster:roaster_id (
            id,
            name
          )
        ),
        brews:brew!brew_bag_id_fkey (
          rating
        ),
        barista:owner_id (
          id,
          display_name
        )
      `)
      .eq('bean_id', beanId)
      .order('roast_date', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    const bags = (data as any[]) || [];
    return bags.map((bag) => {
      const { brews, ...cleanBag } = bag;
      const brewsList = brews || [];
      const ratings = brewsList
        .map((entry: { rating: number | null }) => entry.rating)
        .filter((rating: number | null): rating is number => rating !== null && rating !== undefined);
      const ratingCount = ratings.length;
      const brewCount = brewsList.length;
      const averageRating = ratingCount > 0
        ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratingCount
        : null;
      return {
        ...cleanBag,
        average_rating: averageRating ?? undefined,
        rating_count: ratingCount,
        brew_count: brewCount
      } as BagWithBarista;
    });
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
          image_path,
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

  /**
   * Get inventory bags for dashboard - non-empty bags + recently emptied bags
   * Sorted by most recent brew date (calculated from brews table)
   */
  async findInventoryBags(baristaId: string): Promise<Bag[]> {
    // Calculate current week start (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Days to subtract to get to Monday
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - daysToMonday);
    currentWeekStart.setHours(0, 0, 0, 0);

    // Query bags with their most recent brew date for sorting
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        bean:bean_id (
          id,
          name,
          image_path,
          roast_level,
          country_of_origin,
          tasting_notes,
          roaster:roaster_id (
            id,
            name,
            website_url
          )
        ),
        brews:brew!brew_bag_id_fkey (
          created_at,
          rating
        )
      `)
      .eq('owner_id', baristaId)
      .or(`inventory_status.neq.empty,and(inventory_status.eq.empty,emptied_on_date.gte.${currentWeekStart.toISOString()})`)
      .order('created_at', { ascending: false }); // Fallback ordering by bag creation

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    const bags = (data as any[]) || [];

    // Sort by most recent brew date, then by bag creation date
    bags.sort((a, b) => {
      const aLastBrew = a.brews?.reduce((latest: string | null, brew: { created_at?: string | null }) => {
        if (!brew?.created_at) return latest;
        if (!latest) return brew.created_at;
        return new Date(brew.created_at).getTime() > new Date(latest).getTime() ? brew.created_at : latest;
      }, null);
      const bLastBrew = b.brews?.reduce((latest: string | null, brew: { created_at?: string | null }) => {
        if (!brew?.created_at) return latest;
        if (!latest) return brew.created_at;
        return new Date(brew.created_at).getTime() > new Date(latest).getTime() ? brew.created_at : latest;
      }, null);
      
      if (aLastBrew && bLastBrew) {
        return new Date(bLastBrew).getTime() - new Date(aLastBrew).getTime();
      } else if (aLastBrew) {
        return -1; // a has brews, b doesn't - a comes first
      } else if (bLastBrew) {
        return 1; // b has brews, a doesn't - b comes first
      } else {
        // Neither has brews, sort by bag creation date (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    // Clean up the response to remove the temporary last_brew field
    return bags.map(bag => {
      const { brews, ...cleanBag } = bag;
      const brewsList = brews || [];
      const ratings = brewsList
        .map((entry: { rating: number | null }) => entry.rating)
        .filter((rating: number | null): rating is number => rating !== null && rating !== undefined);
      const ratingCount = ratings.length;
      const brewCount = brewsList.length;
      const averageRating = ratingCount > 0
        ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratingCount
        : null;
      return {
        ...cleanBag,
        average_rating: averageRating ?? undefined,
        rating_count: ratingCount,
        brew_count: brewCount
      } as Bag;
    });
  }
}

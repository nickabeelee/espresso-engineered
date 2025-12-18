import { supabase } from '../config/supabase.js';
import { NotFoundError, ValidationError } from '../middleware/error.js';
import type { 
  Brew, 
  Bean, 
  Bag, 
  Grinder, 
  Machine, 
  Roaster, 
  Barista,
  BrewFilters 
} from '../types/index.js';

/**
 * Admin repository providing full CRUD access to all entities
 * Bypasses RLS policies using service role key
 */
export class AdminRepository {
  
  /**
   * Get all brews with optional filtering (admin override)
   */
  async getAllBrews(filters: BrewFilters = {}): Promise<Brew[]> {
    let query = supabase
      .from('brew')
      .select(`
        *,
        barista:barista_id (
          id,
          display_name,
          first_name,
          last_name
        ),
        machine:machine_id (
          id,
          name,
          manufacturer
        ),
        grinder:grinder_id (
          id,
          name,
          manufacturer
        ),
        bag:bag_id (
          id,
          bean:bean_id (
            id,
            name,
            roaster:roaster_id (
              id,
              name
            )
          )
        )
      `);

    // Apply filters
    if (filters.barista_id) query = query.eq('barista_id', filters.barista_id);
    if (filters.machine_id) query = query.eq('machine_id', filters.machine_id);
    if (filters.grinder_id) query = query.eq('grinder_id', filters.grinder_id);
    if (filters.bag_id) query = query.eq('bag_id', filters.bag_id);
    if (filters.rating_min !== undefined) query = query.gte('rating', filters.rating_min);
    if (filters.rating_max !== undefined) query = query.lte('rating', filters.rating_max);
    if (filters.date_from) query = query.gte('created_at', filters.date_from);
    if (filters.date_to) query = query.lte('created_at', filters.date_to);
    if (filters.has_reflections !== undefined) {
      if (filters.has_reflections) {
        query = query.not('reflections', 'is', null);
      } else {
        query = query.is('reflections', null);
      }
    }
    if (filters.is_draft !== undefined) {
      if (filters.is_draft) {
        query = query.is('yield_mg', null);
      } else {
        query = query.not('yield_mg', 'is', null);
      }
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data as Brew[]) || [];
  }

  /**
   * Get brew by ID (admin override)
   */
  async getBrewById(id: string): Promise<Brew> {
    const { data, error } = await supabase
      .from('brew')
      .select(`
        *,
        barista:barista_id (
          id,
          display_name,
          first_name,
          last_name
        ),
        machine:machine_id (
          id,
          name,
          manufacturer
        ),
        grinder:grinder_id (
          id,
          name,
          manufacturer
        ),
        bag:bag_id (
          id,
          bean:bean_id (
            id,
            name,
            roaster:roaster_id (
              id,
              name
            )
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError(`Brew with id ${id} not found`);
      }
      throw new Error(`Database error: ${error.message}`);
    }

    return data as Brew;
  }

  /**
   * Update brew (admin override)
   */
  async updateBrew(id: string, data: Partial<Brew>): Promise<Brew> {
    const updateData = { ...data };
    delete (updateData as any).id;
    delete (updateData as any).created_at;
    (updateData as any).modified_at = new Date().toISOString();

    // Calculate derived fields if needed
    if (data.yield_mg && data.brew_time_ms && data.brew_time_ms > 0) {
      updateData.flow_rate_mg_per_s = data.yield_mg / (data.brew_time_ms / 1000);
    }
    if (data.yield_mg && data.dose_mg && data.dose_mg > 0) {
      updateData.ratio_dec = data.yield_mg / data.dose_mg;
    }

    const { data: updated, error } = await supabase
      .from('brew')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError(`Brew with id ${id} not found`);
      }
      throw new Error(`Database error: ${error.message}`);
    }

    return updated as Brew;
  }

  /**
   * Delete brew (admin override)
   */
  async deleteBrew(id: string): Promise<void> {
    const { error } = await supabase
      .from('brew')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Get all baristas
   */
  async getAllBaristas(): Promise<Barista[]> {
    const { data, error } = await supabase
      .from('barista')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data as Barista[]) || [];
  }

  /**
   * Get all beans with roaster info
   */
  async getAllBeans(): Promise<Bean[]> {
    const { data, error } = await supabase
      .from('bean')
      .select(`
        *,
        roaster:roaster_id (
          id,
          name,
          website_url
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data as Bean[]) || [];
  }

  /**
   * Update bean (admin override)
   */
  async updateBean(id: string, data: Partial<Bean>): Promise<Bean> {
    const updateData = { ...data };
    delete (updateData as any).id;
    delete (updateData as any).created_at;
    (updateData as any).modified_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('bean')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError(`Bean with id ${id} not found`);
      }
      throw new Error(`Database error: ${error.message}`);
    }

    return updated as Bean;
  }

  /**
   * Delete bean (admin override)
   */
  async deleteBean(id: string): Promise<void> {
    const { error } = await supabase
      .from('bean')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === '23503') {
        throw new ValidationError('Cannot delete bean: it is referenced by existing bags');
      }
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Get all bags with details
   */
  async getAllBags(): Promise<Bag[]> {
    const { data, error } = await supabase
      .from('bag')
      .select(`
        *,
        owner:owner_id (
          id,
          display_name,
          first_name,
          last_name
        ),
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
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data as Bag[]) || [];
  }

  /**
   * Update bag (admin override)
   */
  async updateBag(id: string, data: Partial<Bag>): Promise<Bag> {
    const updateData = { ...data };
    delete (updateData as any).id;
    delete (updateData as any).created_at;
    (updateData as any).modified_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('bag')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError(`Bag with id ${id} not found`);
      }
      throw new Error(`Database error: ${error.message}`);
    }

    return updated as Bag;
  }

  /**
   * Delete bag (admin override)
   */
  async deleteBag(id: string): Promise<void> {
    const { error } = await supabase
      .from('bag')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === '23503') {
        throw new ValidationError('Cannot delete bag: it is referenced by existing brews');
      }
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Get all grinders
   */
  async getAllGrinders(): Promise<Grinder[]> {
    const { data, error } = await supabase
      .from('grinder')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data as Grinder[]) || [];
  }

  /**
   * Update grinder (admin override)
   */
  async updateGrinder(id: string, data: Partial<Grinder>): Promise<Grinder> {
    const updateData = { ...data };
    delete (updateData as any).id;
    delete (updateData as any).created_at;
    (updateData as any).modified_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('grinder')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError(`Grinder with id ${id} not found`);
      }
      throw new Error(`Database error: ${error.message}`);
    }

    return updated as Grinder;
  }

  /**
   * Delete grinder (admin override)
   */
  async deleteGrinder(id: string): Promise<void> {
    const { error } = await supabase
      .from('grinder')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === '23503') {
        throw new ValidationError('Cannot delete grinder: it is referenced by existing brews');
      }
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Get all machines
   */
  async getAllMachines(): Promise<Machine[]> {
    const { data, error } = await supabase
      .from('machine')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data as Machine[]) || [];
  }

  /**
   * Update machine (admin override)
   */
  async updateMachine(id: string, data: Partial<Machine>): Promise<Machine> {
    const updateData = { ...data };
    delete (updateData as any).id;
    delete (updateData as any).created_at;
    (updateData as any).modified_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('machine')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError(`Machine with id ${id} not found`);
      }
      throw new Error(`Database error: ${error.message}`);
    }

    return updated as Machine;
  }

  /**
   * Delete machine (admin override)
   */
  async deleteMachine(id: string): Promise<void> {
    const { error } = await supabase
      .from('machine')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === '23503') {
        throw new ValidationError('Cannot delete machine: it is referenced by existing brews');
      }
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Get all roasters
   */
  async getAllRoasters(): Promise<Roaster[]> {
    const { data, error } = await supabase
      .from('roaster')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data as Roaster[]) || [];
  }

  /**
   * Update roaster (admin override)
   */
  async updateRoaster(id: string, data: Partial<Roaster>): Promise<Roaster> {
    const updateData = { ...data };
    delete (updateData as any).id;
    delete (updateData as any).created_at;
    (updateData as any).modified_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('roaster')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError(`Roaster with id ${id} not found`);
      }
      throw new Error(`Database error: ${error.message}`);
    }

    return updated as Roaster;
  }

  /**
   * Delete roaster (admin override)
   */
  async deleteRoaster(id: string): Promise<void> {
    const { error } = await supabase
      .from('roaster')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === '23503') {
        throw new ValidationError('Cannot delete roaster: it is referenced by existing beans');
      }
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Get content moderation dashboard data
   */
  async getModerationDashboard(): Promise<{
    totalBrews: number;
    totalBaristas: number;
    recentBrews: Brew[];
    flaggedContent: any[];
  }> {
    // Get total counts
    const [brewsCount, baristasCount] = await Promise.all([
      supabase.from('brew').select('*', { count: 'exact', head: true }),
      supabase.from('barista').select('*', { count: 'exact', head: true })
    ]);

    // Get recent brews
    const { data: recentBrews } = await supabase
      .from('brew')
      .select(`
        *,
        barista:barista_id (
          id,
          display_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      totalBrews: brewsCount.count || 0,
      totalBaristas: baristasCount.count || 0,
      recentBrews: (recentBrews as Brew[]) || [],
      flaggedContent: [] // Placeholder for future flagging system
    };
  }
}
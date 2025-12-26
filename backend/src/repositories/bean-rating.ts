import { BaseRepository } from './base.js';
import { BeanRating } from '../types/index.js';
import { supabase } from '../config/supabase.js';

/**
 * Repository for bean rating entities
 * Bean ratings are user-owned entities with ownership validation
 */
export class BeanRatingRepository extends BaseRepository<BeanRating> {
  constructor() {
    super('bean_rating');
  }

  /**
   * Bean ratings are user-owned resources
   */
  protected isUserOwnedTable(): boolean {
    return true;
  }

  /**
   * Find rating by bean and barista
   */
  async findByBeanAndBarista(beanId: string, baristaId: string): Promise<BeanRating | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('bean_id', beanId)
      .eq('barista_id', baristaId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rating found
      }
      throw new Error(`Database error: ${error.message}`);
    }

    return data as BeanRating;
  }

  /**
   * Find all ratings for a bean
   */
  async findByBean(beanId: string): Promise<BeanRating[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('bean_id', beanId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data as BeanRating[]) || [];
  }

  /**
   * Calculate average rating for a bean
   */
  async getAverageRating(beanId: string): Promise<number | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('rating')
      .eq('bean_id', beanId);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return null;
    }

    const sum = data.reduce((acc, rating) => acc + rating.rating, 0);
    return sum / data.length;
  }

  /**
   * Create or update a rating (upsert)
   */
  async upsert(beanId: string, baristaId: string, rating: number): Promise<BeanRating> {
    const { data, error } = await supabase
      .from(this.tableName)
      .upsert({
        bean_id: beanId,
        barista_id: baristaId,
        rating: rating,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'bean_id,barista_id'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data as BeanRating;
  }

  /**
   * Delete rating by bean and barista
   */
  async deleteByBeanAndBarista(beanId: string, baristaId: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('bean_id', beanId)
      .eq('barista_id', baristaId);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }
}
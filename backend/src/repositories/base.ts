import { supabase } from '../config/supabase.js';
import { NotFoundError, ValidationError } from '../middleware/error.js';

/**
 * Base repository class providing common database operations
 * Enforces RLS policies and provides consistent error handling
 */
export abstract class BaseRepository<T> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Find a single record by ID
   */
  async findById(id: string, baristaId?: string): Promise<T> {
    const query = supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id);

    // For user-owned resources, add barista filter for RLS
    if (baristaId && this.isUserOwnedTable()) {
      query.eq(this.getOwnerField(), baristaId);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError(`${this.tableName} with id ${id} not found`);
      }
      throw new Error(`Database error: ${error.message}`);
    }

    return data as T;
  }

  /**
   * Find multiple records with optional filtering
   */
  async findMany(filters: Record<string, any> = {}, baristaId?: string): Promise<T[]> {
    let query = supabase.from(this.tableName).select('*');

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    // For user-owned resources, add barista filter for RLS
    if (baristaId && this.isUserOwnedTable()) {
      query = query.eq(this.getOwnerField(), baristaId);
    }

    // Default ordering by created_at desc
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data as T[]) || [];
  }

  /**
   * Create a new record
   */
  async create(data: Partial<T>, baristaId?: string): Promise<T> {
    // Add owner_id for user-owned tables
    if (baristaId && this.isUserOwnedTable()) {
      (data as any)[this.getOwnerField()] = baristaId;
    }

    const { data: created, error } = await supabase
      .from(this.tableName)
      .insert(data)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new ValidationError(`${this.tableName} already exists`);
      }
      if (error.code === '23503') { // Foreign key constraint violation
        throw new ValidationError('Referenced resource does not exist');
      }
      throw new Error(`Database error: ${error.message}`);
    }

    return created as T;
  }

  /**
   * Update an existing record
   */
  async update(id: string, data: Partial<T>, baristaId?: string): Promise<T> {
    // Remove fields that shouldn't be updated
    const updateData = { ...data };
    delete (updateData as any).id;
    delete (updateData as any).created_at;

    // Add modified_at timestamp if the table supports it
    if (this.hasModifiedAt()) {
      (updateData as any).modified_at = new Date().toISOString();
    }

    const query = supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', id);

    // For user-owned resources, add barista filter for RLS
    if (baristaId && this.isUserOwnedTable()) {
      query.eq(this.getOwnerField(), baristaId);
    }

    const { data: updated, error } = await query.select().single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError(`${this.tableName} with id ${id} not found or access denied`);
      }
      if (error.code === '23503') { // Foreign key constraint violation
        throw new ValidationError('Referenced resource does not exist');
      }
      throw new Error(`Database error: ${error.message}`);
    }

    return updated as T;
  }

  /**
   * Delete a record
   */
  async delete(id: string, baristaId?: string): Promise<void> {
    const query = supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    // For user-owned resources, add barista filter for RLS
    if (baristaId && this.isUserOwnedTable()) {
      query.eq(this.getOwnerField(), baristaId);
    }

    const { error } = await query;

    if (error) {
      if (error.code === '23503') { // Foreign key constraint violation
        throw new ValidationError('Cannot delete: resource is referenced by other records');
      }
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Count records with optional filtering
   */
  async count(filters: Record<string, any> = {}, baristaId?: string): Promise<number> {
    let query = supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    // For user-owned resources, add barista filter for RLS
    if (baristaId && this.isUserOwnedTable()) {
      query = query.eq(this.getOwnerField(), baristaId);
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Check if this table is user-owned (requires barista filtering)
   * Override in subclasses for user-owned tables
   */
  protected isUserOwnedTable(): boolean {
    return false;
  }

  /**
   * Get the owner field name for user-owned tables
   * Override in subclasses if different from 'owner_id'
   */
  protected getOwnerField(): string {
    return 'owner_id';
  }

  /**
   * Check if this table has a modified_at field
   * Override in subclasses if the table supports modified_at
   */
  protected hasModifiedAt(): boolean {
    return false;
  }
}
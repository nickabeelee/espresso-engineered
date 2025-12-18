import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock Supabase - must be defined before the mock
const mockSupabase = {
  from: jest.fn()
};

jest.mock('../config/supabase', () => ({
  supabase: mockSupabase
}));

import { BaseRepository } from './base';
import { NotFoundError, ValidationError } from '../middleware/error';

// Test implementation of BaseRepository
class TestRepository extends BaseRepository<{ id: string; name: string; owner_id?: string }> {
  constructor() {
    super('test_table');
  }

  protected isUserOwnedTable(): boolean {
    return true;
  }
}

describe('BaseRepository', () => {
  let repository: TestRepository;
  let mockQuery: any;

  beforeEach(() => {
    repository = new TestRepository();
    
    mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis()
    };

    mockSupabase.from.mockReturnValue(mockQuery);

    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should find record by id with barista filter', async () => {
      const mockData = { id: 'test-id', name: 'Test Item', owner_id: 'barista-123' };
      mockQuery.single.mockResolvedValue({ data: mockData, error: null });

      const result = await repository.findById('test-id', 'barista-123');

      expect(result).toEqual(mockData);
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'test-id');
      expect(mockQuery.eq).toHaveBeenCalledWith('owner_id', 'barista-123');
    });

    it('should throw NotFoundError when record not found', async () => {
      mockQuery.single.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116', message: 'Not found' } 
      });

      await expect(repository.findById('nonexistent-id', 'barista-123'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('should create record with owner_id for user-owned tables', async () => {
      const inputData = { name: 'New Item' };
      const mockCreated = { id: 'new-id', name: 'New Item', owner_id: 'barista-123' };
      
      mockQuery.single.mockResolvedValue({ data: mockCreated, error: null });

      const result = await repository.create(inputData, 'barista-123');

      expect(result).toEqual(mockCreated);
      expect(mockQuery.insert).toHaveBeenCalledWith({
        name: 'New Item',
        owner_id: 'barista-123'
      });
    });

    it('should throw ValidationError for duplicate key violation', async () => {
      mockQuery.single.mockResolvedValue({ 
        data: null, 
        error: { code: '23505', message: 'Duplicate key' } 
      });

      await expect(repository.create({ name: 'Duplicate' }, 'barista-123'))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for foreign key constraint violation', async () => {
      mockQuery.single.mockResolvedValue({ 
        data: null, 
        error: { code: '23503', message: 'Foreign key constraint' } 
      });

      await expect(repository.create({ name: 'Invalid FK' }, 'barista-123'))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('findMany', () => {
    it('should find multiple records with filters and barista constraint', async () => {
      const mockData = [
        { id: '1', name: 'Item 1', owner_id: 'barista-123' },
        { id: '2', name: 'Item 2', owner_id: 'barista-123' }
      ];
      
      // For findMany, the query chain ends with the query object itself being awaited
      Object.assign(mockQuery, {
        then: jest.fn((resolve: any) => resolve({ data: mockData, error: null }))
      });

      const result = await repository.findMany({ name: 'Item' }, 'barista-123');

      expect(result).toEqual(mockData);
      expect(mockQuery.eq).toHaveBeenCalledWith('name', 'Item');
      expect(mockQuery.eq).toHaveBeenCalledWith('owner_id', 'barista-123');
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });
  });

  describe('update', () => {
    it('should update record with barista constraint', async () => {
      const updateData = { name: 'Updated Item' };
      const mockUpdated = { id: 'test-id', name: 'Updated Item', owner_id: 'barista-123' };
      
      mockQuery.single.mockResolvedValue({ data: mockUpdated, error: null });

      const result = await repository.update('test-id', updateData, 'barista-123');

      expect(result).toEqual(mockUpdated);
      expect(mockQuery.update).toHaveBeenCalledWith(updateData);
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'test-id');
      expect(mockQuery.eq).toHaveBeenCalledWith('owner_id', 'barista-123');
    });
  });

  describe('delete', () => {
    it('should delete record with barista constraint', async () => {
      // For delete, the query chain ends with the query object itself being awaited
      Object.assign(mockQuery, {
        then: jest.fn((resolve: any) => resolve({ error: null }))
      });

      await repository.delete('test-id', 'barista-123');

      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'test-id');
      expect(mockQuery.eq).toHaveBeenCalledWith('owner_id', 'barista-123');
    });

    it('should throw ValidationError for foreign key constraint violation', async () => {
      Object.assign(mockQuery, {
        then: jest.fn((resolve: any) => resolve({ 
          error: { code: '23503', message: 'Foreign key constraint' } 
        }))
      });

      await expect(repository.delete('test-id', 'barista-123'))
        .rejects.toThrow(ValidationError);
    });
  });
});
import { BeanRepository } from './bean.js';
import { supabase } from '../config/supabase.js';

// Mock supabase for testing
jest.mock('../config/supabase.js', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn()
  }
}));

describe('BeanRepository - Ownership Context', () => {
  let beanRepository: BeanRepository;
  const mockSupabase = supabase as jest.Mocked<typeof supabase>;

  beforeEach(() => {
    beanRepository = new BeanRepository();
    jest.clearAllMocks();
  });

  describe('findManyWithContext', () => {
    it('should return beans with ownership context', async () => {
      const mockBeanData = [
        {
          id: 'bean-1',
          name: 'Test Bean',
          roaster_id: 'roaster-1',
          roaster: { id: 'roaster-1', name: 'Test Roaster' },
          bean_rating: [
            { rating: 4, barista_id: 'barista-1' },
            { rating: 5, barista_id: 'barista-2' }
          ]
        }
      ];

      const mockBagData = [
        { id: 'bag-1', inventory_status: 'plenty' }
      ];

      const mockBrewData = [
        { id: 'brew-1' },
        { id: 'brew-2' }
      ];

      // Mock the main bean query
      const mockSelect = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockReturnValue({
        data: mockBeanData,
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect.mockReturnValue({
          order: mockOrder
        })
      } as any);

      // Mock bag ownership query
      mockSupabase.from
        .mockReturnValueOnce({
          select: mockSelect.mockReturnValue({
            order: mockOrder
          })
        } as any)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                data: mockBagData,
                error: null
              })
            })
          })
        } as any)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                data: mockBagData,
                error: null
              })
            })
          })
        } as any)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                data: mockBrewData,
                error: null
              })
            })
          })
        } as any)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                data: mockBagData,
                error: null
              })
            })
          })
        } as any);

      // Mock RPC call for brew counts
      mockSupabase.rpc.mockResolvedValue({
        data: [{ bean_id: 'bean-1', brew_count: 2 }],
        error: null,
        count: null,
        status: 200,
        statusText: 'OK'
      });

      const result = await beanRepository.findManyWithContext('barista-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'bean-1',
        name: 'Test Bean',
        ownership_status: 'owned',
        personal_rating: 4,
        average_rating: 4.5,
        rating_count: 2,
        total_brews: 2,
        bag_count: 1
      });
    });

    it('should handle beans with no ownership', async () => {
      const mockBeanData = [
        {
          id: 'bean-1',
          name: 'Test Bean',
          roaster_id: 'roaster-1',
          roaster: { id: 'roaster-1', name: 'Test Roaster' },
          bean_rating: []
        }
      ];

      // Mock the main bean query
      const mockSelect = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockReturnValue({
        data: mockBeanData,
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect.mockReturnValue({
          order: mockOrder
        })
      } as any);

      // Mock empty bag ownership query
      mockSupabase.from
        .mockReturnValueOnce({
          select: mockSelect.mockReturnValue({
            order: mockOrder
          })
        } as any)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                data: [],
                error: null
              })
            })
          })
        } as any)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                data: [],
                error: null
              })
            })
          })
        } as any)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                data: [],
                error: null
              })
            })
          })
        } as any);

      const result = await beanRepository.findManyWithContext('barista-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'bean-1',
        name: 'Test Bean',
        ownership_status: 'never_owned',
        personal_rating: null,
        average_rating: null,
        rating_count: 0,
        total_brews: 0,
        bag_count: 0,
        most_used_by_me: false
      });
    });
  });

  describe('searchByNameAndNotes', () => {
    it('should search beans by name and tasting notes', async () => {
      const mockBeanData = [
        {
          id: 'bean-1',
          name: 'Ethiopian Yirgacheffe',
          tasting_notes: 'Floral, citrus, bright acidity',
          roaster: { id: 'roaster-1', name: 'Test Roaster' },
          bean_rating: []
        }
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockOr = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockReturnValue({
        data: mockBeanData,
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect.mockReturnValue({
          or: mockOr.mockReturnValue({
            order: mockOrder
          })
        })
      } as any);

      // Mock empty ownership queries for simplicity
      mockSupabase.from
        .mockReturnValueOnce({
          select: mockSelect.mockReturnValue({
            or: mockOr.mockReturnValue({
              order: mockOrder
            })
          })
        } as any)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                data: [],
                error: null
              })
            })
          })
        } as any)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                data: [],
                error: null
              })
            })
          })
        } as any)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                data: [],
                error: null
              })
            })
          })
        } as any);

      const result = await beanRepository.searchByNameAndNotes('citrus', 'barista-1');

      expect(mockOr).toHaveBeenCalledWith('name.ilike.%citrus%,tasting_notes.ilike.%citrus%');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Ethiopian Yirgacheffe');
    });
  });
});
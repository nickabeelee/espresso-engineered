import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./api-client', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

import { adminService } from './admin-service';
import { apiClient } from './api-client';

describe('AdminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requests admin bags without a double /api prefix', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

    await adminService.getAllBags();

    expect(apiClient.get).toHaveBeenCalledWith('/admin/bags');
  });
});

import { describe, it, expect } from 'vitest';
import { getImageUploadUrl } from './image-utils';

describe('image-utils', () => {
  describe('getImageUploadUrl', () => {
    it('avoids double /api when base already includes it', () => {
      const url = getImageUploadUrl('machine', '123', 'http://localhost:8080/api');
      expect(url).toBe('http://localhost:8080/api/machines/123/image');
    });

    it('builds entity upload paths when base is host-only', () => {
      const url = getImageUploadUrl('grinder', 'abc', 'http://localhost:8080');
      expect(url).toBe('http://localhost:8080/grinders/abc/image');
    });
  });
});

import { validateImageFile, generateImageFilename, SUPPORTED_IMAGE_TYPES } from './image-upload';

describe('Image Upload Utils', () => {
  describe('validateImageFile', () => {
    it('should validate supported image types', () => {
      // Create a mock JPEG file buffer with proper signature
      const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
      const result = validateImageFile(jpegBuffer, 'test.jpg');
      
      expect(result.isValid).toBe(true);
      expect(result.mimeType).toBe('image/jpeg');
      expect(result.extension).toBe('.jpg');
    });

    it('should reject unsupported file types', () => {
      const buffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);
      const result = validateImageFile(buffer, 'test.txt');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Unsupported file type');
    });

    it('should reject files that are too large', () => {
      // Create a buffer larger than 5MB
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024);
      const result = validateImageFile(largeBuffer, 'test.jpg');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('File size exceeds maximum limit');
    });

    it('should reject files with invalid signatures', () => {
      // Create a buffer with wrong signature for JPEG
      const invalidBuffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);
      const result = validateImageFile(invalidBuffer, 'test.jpg');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid file format');
    });
  });

  describe('generateImageFilename', () => {
    it('should generate unique filenames for grinders', () => {
      const filename1 = generateImageFilename('test.jpg', 'grinder');
      const filename2 = generateImageFilename('test.jpg', 'grinder');
      
      expect(filename1).not.toBe(filename2);
      expect(filename1).toMatch(/^[a-f0-9-]+\.jpg$/);
      expect(filename2).toMatch(/^[a-f0-9-]+\.jpg$/);
    });

    it('should generate unique filenames for machines', () => {
      const filename1 = generateImageFilename('test.png', 'machine');
      const filename2 = generateImageFilename('test.png', 'machine');
      
      expect(filename1).not.toBe(filename2);
      expect(filename1).toMatch(/^[a-f0-9-]+\.png$/);
      expect(filename2).toMatch(/^[a-f0-9-]+\.png$/);
    });

    it('should preserve file extensions', () => {
      const jpegFilename = generateImageFilename('test.jpeg', 'grinder');
      const pngFilename = generateImageFilename('test.png', 'machine');
      const webpFilename = generateImageFilename('test.webp', 'grinder');
      
      expect(jpegFilename).toMatch(/\.jpeg$/);
      expect(pngFilename).toMatch(/\.png$/);
      expect(webpFilename).toMatch(/\.webp$/);
    });
  });

  describe('SUPPORTED_IMAGE_TYPES', () => {
    it('should contain expected MIME types', () => {
      expect(SUPPORTED_IMAGE_TYPES).toHaveProperty('image/jpeg');
      expect(SUPPORTED_IMAGE_TYPES).toHaveProperty('image/png');
      expect(SUPPORTED_IMAGE_TYPES).toHaveProperty('image/webp');
      expect(SUPPORTED_IMAGE_TYPES).toHaveProperty('image/gif');
    });

    it('should map MIME types to correct extensions', () => {
      expect(SUPPORTED_IMAGE_TYPES['image/jpeg']).toEqual(['.jpg', '.jpeg']);
      expect(SUPPORTED_IMAGE_TYPES['image/png']).toEqual(['.png']);
      expect(SUPPORTED_IMAGE_TYPES['image/webp']).toEqual(['.webp']);
      expect(SUPPORTED_IMAGE_TYPES['image/gif']).toEqual(['.gif']);
    });
  });
});

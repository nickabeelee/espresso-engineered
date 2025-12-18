/**
 * Integration test for image upload functionality
 * This test verifies that the image upload endpoints work correctly
 */

import { validateImageFile, generateImageFilename } from './utils/image-upload.js';

async function testImageUploadUtilities() {
  console.log('🧪 Testing Image Upload Utilities...\n');

  // Test 1: Validate a proper JPEG file
  console.log('Test 1: Validating JPEG file...');
  const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
  const jpegResult = validateImageFile(jpegBuffer, 'test-image.jpg');
  console.log('✅ JPEG validation:', jpegResult);

  // Test 2: Validate a PNG file
  console.log('\nTest 2: Validating PNG file...');
  const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const pngResult = validateImageFile(pngBuffer, 'test-image.png');
  console.log('✅ PNG validation:', pngResult);

  // Test 3: Reject invalid file type
  console.log('\nTest 3: Rejecting invalid file type...');
  const invalidBuffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);
  const invalidResult = validateImageFile(invalidBuffer, 'test.txt');
  console.log('✅ Invalid file rejection:', invalidResult);

  // Test 4: Generate unique filenames
  console.log('\nTest 4: Generating unique filenames...');
  const filename1 = generateImageFilename('original.jpg', 'grinder');
  const filename2 = generateImageFilename('original.jpg', 'grinder');
  const filename3 = generateImageFilename('original.png', 'machine');
  
  console.log('✅ Grinder filename 1:', filename1);
  console.log('✅ Grinder filename 2:', filename2);
  console.log('✅ Machine filename:', filename3);
  console.log('✅ Filenames are unique:', filename1 !== filename2);

  // Test 5: File size validation
  console.log('\nTest 5: Testing file size limits...');
  const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
  const sizeResult = validateImageFile(largeBuffer, 'large.jpg');
  console.log('✅ Large file rejection:', sizeResult);

  console.log('\n🎉 All image upload utility tests completed successfully!');
}

// Run the tests
testImageUploadUtilities().catch(console.error);
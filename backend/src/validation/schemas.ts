import { z } from 'zod';

// Roast level enum validation
export const roastLevelSchema = z.enum(['Light', 'Medium Light', 'Medium', 'Medium Dark', 'Dark']);

// Inventory status enum validation
export const inventoryStatusSchema = z.enum(['unopened', 'plenty', 'getting_low', 'empty']);

// UUID validation helper
const uuidSchema = z.string().uuid('Invalid UUID format');

// Positive number validation helpers
const positiveNumber = z.number().positive('Must be a positive number');
const nonNegativeNumber = z.number().min(0, 'Must be non-negative');

// Brew validation schemas
export const createBrewSchema = z.object({
  machine_id: uuidSchema,
  grinder_id: uuidSchema,
  bag_id: uuidSchema,
  name: z.string().min(1).max(255).optional(),
  dose_g: positiveNumber,
  yield_g: positiveNumber.optional(),
  brew_time_s: positiveNumber.optional(),
  grind_setting: z.string().max(50).optional(),
  rating: z.number().int().min(1).max(10).optional(),
  tasting_notes: z.string().max(1000).optional(),
  reflections: z.string().max(2000).optional()
});

export const updateBrewSchema = createBrewSchema.partial();

export const completeDraftSchema = z.object({
  yield_g: positiveNumber.optional(),
  brew_time_s: positiveNumber.optional(),
  rating: z.number().int().min(1).max(10).optional(),
  tasting_notes: z.string().max(1000).optional(),
  reflections: z.string().max(2000).optional()
});

// Entity creation schemas
export const createBeanSchema = z.object({
  roaster_id: uuidSchema,
  name: z.string().min(1).max(255),
  roast_level: roastLevelSchema.optional(),
  country_of_origin: z.string().max(100).optional(),
  tasting_notes: z.string().max(1000).optional()
});

export const createBagSchema = z.object({
  bean_id: uuidSchema,
  name: z.string().min(1).max(255).optional(),
  roast_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  weight_g: positiveNumber.optional(),
  price: nonNegativeNumber.optional(),
  purchase_location: z.string().max(255).optional(),
  inventory_status: inventoryStatusSchema.optional(),
  emptied_on_date: z.string().datetime().nullable().optional()
});

export const createGrinderSchema = z.object({
  manufacturer: z.string().min(1).max(100),
  model: z.string().min(1).max(255),
  image_path: z.string().max(500).optional(),
  setting_guide_chart_url: z.string().url().optional()
});

export const createMachineSchema = z.object({
  manufacturer: z.string().min(1).max(100),
  model: z.string().min(1).max(255),
  user_manual_link: z.string().url().optional(),
  image_path: z.string().max(500).optional()
});

export const createRoasterSchema = z.object({
  name: z.string().min(1).max(255),
  website_url: z.string().url().optional()
});

export const createBeanRatingSchema = z.object({
  rating: z.number().int().min(1).max(5)
});

export const updateBeanRatingSchema = createBeanRatingSchema;

// Query parameter schemas
export const brewFiltersSchema = z.object({
  barista_id: uuidSchema.optional(),
  machine_id: uuidSchema.optional(),
  grinder_id: uuidSchema.optional(),
  bag_id: uuidSchema.optional(),
  rating_min: z.number().int().min(1).max(10).optional(),
  rating_max: z.number().int().min(1).max(10).optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  has_reflections: z.boolean().optional(),
  is_draft: z.boolean().optional()
});

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sort_by: z.string().max(50).optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// Batch operations
export const batchSyncSchema = z.object({
  brews: z.array(createBrewSchema).max(50) // Limit batch size
});

// Name override schemas
export const nameOverrideSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').max(255, 'Name too long'),
  reason: z.string().max(500, 'Reason too long').optional()
});

// Validation helper function
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    throw result.error;
  }
  
  return result.data;
}

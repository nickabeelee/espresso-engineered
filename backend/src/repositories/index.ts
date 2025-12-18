// Repository exports for easy importing
export { BaseRepository } from './base.js';
export { BrewRepository } from './brew.js';

// Repository instances - singleton pattern for consistent database connections
import { BrewRepository } from './brew.js';
export const brewRepository = new BrewRepository();
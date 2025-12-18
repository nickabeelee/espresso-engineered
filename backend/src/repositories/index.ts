// Repository exports for easy importing
export { BaseRepository } from './base.js';
export { BrewRepository } from './brew.js';
export { RoasterRepository } from './roaster.js';
export { BeanRepository } from './bean.js';
export { GrinderRepository } from './grinder.js';
export { MachineRepository } from './machine.js';
export { BagRepository } from './bag.js';

// Repository instances - singleton pattern for consistent database connections
import { BrewRepository } from './brew.js';
export const brewRepository = new BrewRepository();
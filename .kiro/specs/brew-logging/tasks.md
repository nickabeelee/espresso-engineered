# Implementation Plan

- [x] 1. Set up project structure and core interfaces
  - Create directory structure for backend (Fastify) and frontend (SvelteKit) components
  - Set up TypeScript interfaces for all data models (Brew, Barista, Bean, Bag, Grinder, Machine, Roaster)
  - Configure testing framework (Jest for backend, Vitest for frontend, fast-check for property-based testing)
  - Set up Supabase client configuration for both frontend and backend
  - _Requirements: 7.1, 9.5_

- [ ]* 1.1 Write property test for authentication token resolution
  - **Property 10: Authentication and Authorization Consistency**
  - **Validates: Requirements 7.5, 9.1, 9.5**

- [x] 2. Implement backend API foundation
  - Set up Fastify server with authentication middleware
  - Create JWT token validation and barista resolution logic
  - Implement error handling middleware with proper HTTP status codes
  - Set up database connection utilities with RLS policy enforcement
  - Create base repository pattern for data access
  - _Requirements: 7.1, 7.3, 9.1, 9.5_

- [ ]* 2.1 Write property test for input validation and error handling
  - **Property 2: Input Validation and Error Handling**
  - **Validates: Requirements 1.4, 7.2, 7.3**

- [ ]* 2.2 Write property test for access control enforcement
  - **Property 7: Access Control Enforcement**
  - **Validates: Requirements 4.3, 4.4, 6.1, 9.2, 9.3**

- [ ] 3. Implement core entity management APIs
  - Create CRUD endpoints for roasters (GET /api/roasters, POST /api/roasters)
  - Create CRUD endpoints for beans with roaster association (GET /api/beans, POST /api/beans)
  - Create CRUD endpoints for grinders and machines (GET /api/grinders, POST /api/grinders, GET /api/machines, POST /api/machines)
  - Create CRUD endpoints for bags with ownership validation (GET /api/bags, POST /api/bags)
  - Implement proper foreign key validation and referential integrity checks
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.4, 6.5_

- [ ]* 3.1 Write property test for entity creation and association
  - **Property 8: Entity Creation and Association**
  - **Validates: Requirements 3.2, 3.3, 3.4**

- [ ]* 3.2 Write property test for referential integrity maintenance
  - **Property 9: Referential Integrity Maintenance**
  - **Validates: Requirements 6.3, 6.5, 9.4**

- [ ] 4. Implement brew management APIs
  - Create brew CRUD endpoints (POST /api/brews, GET /api/brews, GET /api/brews/:id, PUT /api/brews/:id, DELETE /api/brews/:id)
  - Implement calculated field logic (flow_rate_mg/s and ratio_dec)
  - Create pre-fill endpoint (GET /api/brews/prefill) to get data from most recent brew
  - Create draft completion endpoint (POST /api/brews/:id/complete)
  - Create drafts listing endpoint (GET /api/brews/drafts)
  - Implement batch sync endpoint (POST /api/brews/batch-sync)
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.3, 2.4, 4.1, 4.2, 4.5_

- [ ]* 4.1 Write property test for pre-fill data consistency
  - **Property 1: Pre-fill Data Consistency**
  - **Validates: Requirements 1.2**

- [ ]* 4.2 Write property test for data persistence and integrity
  - **Property 3: Data Persistence and Integrity**
  - **Validates: Requirements 1.3, 5.1, 5.4**

- [ ]* 4.3 Write property test for draft state management
  - **Property 4: Draft State Management**
  - **Validates: Requirements 2.1, 2.2**

- [ ]* 4.4 Write property test for calculated field accuracy
  - **Property 5: Calculated Field Accuracy**
  - **Validates: Requirements 2.4**

- [ ] 5. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Set up frontend project structure
  - Initialize SvelteKit project with TypeScript configuration
  - Set up Supabase client for frontend authentication and data access
  - Create shared TypeScript interfaces matching backend models
  - Set up offline storage utilities (localStorage/IndexedDB for drafts)
  - Configure routing structure for brew management pages
  - _Requirements: 8.1, 5.2_

- [ ] 7. Implement authentication and barista management
  - Create authentication service using Supabase Auth
  - Implement barista profile resolution from JWT tokens
  - Create login/logout components and flows
  - Set up authentication guards for protected routes
  - Create barista profile display and management components
  - _Requirements: 9.5, 7.5_

- [ ] 8. Implement core UI components
  - Create BrewForm component with validation and pre-fill functionality
  - Create BrewList component with chronological ordering and filtering
  - Create AwaitingReflection component for incomplete brews
  - Create entity selection components (BeanSelector, BagSelector, GrinderSelector, MachineSelector)
  - Implement inline entity creation components (InlineBeanCreator, InlineBagCreator, etc.)
  - _Requirements: 8.2, 4.1, 4.2, 2.2, 3.1_

- [ ]* 8.1 Write property test for user interface feedback consistency
  - **Property 11: User Interface Feedback Consistency**
  - **Validates: Requirements 8.2, 8.5**

- [ ]* 8.2 Write property test for chronological ordering consistency
  - **Property 12: Chronological Ordering Consistency**
  - **Validates: Requirements 4.1, 4.2**

- [ ] 9. Implement brew creation and editing workflows
  - Create new brew page with pre-fill option from previous brew
  - Implement draft saving functionality with offline support
  - Create brew editing page with ownership validation
  - Implement brew deletion with confirmation dialog
  - Add calculated field display and automatic updates
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.3, 4.3, 4.5_

- [ ] 10. Implement offline synchronization
  - Create offline draft storage using localStorage/IndexedDB
  - Implement connectivity detection and sync triggers
  - Create sync queue management for pending changes
  - Add conflict resolution for offline-online data synchronization
  - Implement background sync when connectivity is restored
  - _Requirements: 2.5, 5.2, 5.3, 5.5_

- [ ]* 10.1 Write property test for offline synchronization consistency
  - **Property 6: Offline Synchronization Consistency**
  - **Validates: Requirements 2.5, 5.2, 5.3**

- [ ] 11. Implement admin functionality
  - Create admin portal with authentication checks
  - Implement admin CRUD operations for all entities
  - Add admin override capabilities for brew editing/deletion
  - Create admin dashboard for content moderation
  - Implement proper admin access control validation
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 12. Add image upload and management
  - Implement image upload functionality for grinders and machines
  - Create image validation and processing utilities
  - Add image display components with proper fallbacks
  - Implement image storage path management
  - Add image deletion and replacement capabilities
  - _Requirements: 3.5_

- [ ] 13. Final integration and testing
  - Integrate all frontend and backend components
  - Test complete user workflows end-to-end
  - Validate all API endpoints with proper authentication
  - Test offline functionality and synchronization
  - Verify admin functionality and access controls
  - _Requirements: All requirements validation_

- [ ] 14. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
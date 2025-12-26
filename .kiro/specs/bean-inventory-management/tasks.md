# Implementation Plan: Bean Inventory Management

## Overview

This implementation plan transforms the existing bean and bag data model into a comprehensive inventory management system. The approach leverages existing backend routes and frontend patterns while adding new functionality for inventory status tracking, bean ratings, and enhanced discovery features.

## Tasks

- [x] 1. Database Schema Setup and Migration
  - Use Supabase power to inspect current schema and RLS policies
  - Create inventory_status enum type for bag status tracking
  - Add inventory_status field to bag table with default value
  - Create bean_rating table for individual barista ratings
  - Implement RLS policies for bean_rating table
  - _Requirements: 11.1, 11.2, 11.4, 10.5_

- [ ]* 1.1 Write property test for schema migration
  - **Property 11: Schema Migration Integrity**
  - **Validates: Requirements 11.1, 11.2, 11.4**

- [x] 2. Backend API Extensions
  - [x] 2.1 Extend bag routes for inventory status support
    - Add inventory_status field to bag creation and update operations
    - Update bag filtering to support status-based queries
    - Modify bag response objects to include inventory_status
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 2.2 Write property test for bag status operations
    - **Property 4: Inventory Status Management**
    - **Validates: Requirements 5.1, 5.2, 5.3**

  - [x] 2.3 Implement bean rating API routes
    - Create POST /api/beans/:id/rating for rating creation
    - Create PUT /api/beans/:id/rating for rating updates
    - Create DELETE /api/beans/:id/rating for rating removal
    - Add rating context to bean list and detail responses
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 2.4 Write property test for rating system
    - **Property 6: Rating System Integrity**
    - **Validates: Requirements 10.2, 10.3, 10.4, 10.5**

- [x] 3. Enhanced Bean API with Ownership Context
  - [x] 3.1 Add ownership and usage context to bean responses
    - Calculate ownership status (owned, previously owned, never owned)
    - Add "most used by me" indicators based on brew history
    - Include personal and community ratings in responses
    - Add social signals for recent activity
    - _Requirements: 2.2, 2.4, 2.5, 8.1_

  - [ ]* 3.2 Write property test for ownership status calculation
    - **Property 2: Ownership Status Accuracy**
    - **Validates: Requirements 2.2, 2.4, 7.5**

  - [x] 3.3 Enhance bean search and filtering capabilities
    - Extend search to include tasting notes and descriptive fields
    - Add "My Beans" filter option to existing roaster/roast level filters
    - Implement filter combination logic using AND operations
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]* 3.4 Write property test for filter combination logic
    - **Property 3: Filter Combination Logic**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

- [x] 4. Checkpoint - Backend API Validation
  - ✅ Ensure all new API endpoints are functional
  - ✅ Verify database migrations are applied correctly
  - ✅ Test permission enforcement for new operations
  - ✅ Ask the user if questions arise

- [-] 5. Frontend Navigation Integration
  - [x] 5.1 Add "Beans" navigation item to main layout
    - Insert "Beans" link before "Equipment" in navigation
    - Implement active state styling consistent with existing patterns
    - Create route handler for /beans path
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ]* 5.2 Write unit test for navigation integration
    - Test navigation item presence and positioning
    - Test route navigation behavior
    - _Requirements: 1.1, 1.2_

- [x] 6. Bean List Component Implementation
  - [x] 6.1 Create BeanList component based on BrewList patterns
    - Implement search functionality across bean names and tasting notes
    - Add filter controls for roaster, roast level, and "My Beans" toggle
    - Display beans with ownership indicators and usage statistics
    - Show personal ratings prominently with community average fallback
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.6, 10.2, 10.3_

  - [ ]* 6.2 Write property test for bean display completeness
    - **Property 1: Bean Display Completeness**
    - **Validates: Requirements 2.1, 2.3, 2.4, 4.2, 4.3**

  - [x] 6.3 Implement BeanCard component for list items
    - Display bean name, roaster, roast level, and ratings
    - Show ownership status and "most used by me" indicators
    - Include ambient social signals as secondary metadata
    - Reuse existing chip and icon button components
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 8.1, 9.1, 9.3_

  - [ ]* 6.4 Write property test for social signal display
    - **Property 7: Social Signal Display**
    - **Validates: Requirements 8.1, 4.4**

- [x] 7. Bean Detail Page Implementation
  - [x] 7.1 Create BeanDetail component and route
    - Display comprehensive bean information and statistics
    - Show recent activity by other baristas
    - List all associated bags with ownership indicators
    - Implement navigation from bean list to detail page
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 7.2 Write property test for bag visibility
    - **Property 10: Bag Visibility Completeness**
    - **Validates: Requirements 7.1, 4.5**

  - [x] 7.3 Integrate bean rating interface in detail view
    - Add 5-star rating component for personal ratings
    - Display current personal rating and community average
    - Handle rating creation, updates, and removal
    - _Requirements: 10.1, 10.2, 10.3_

- [-] 8. Bag Status Management Integration
  - [x] 8.1 Update bag components for inventory status
    - Add inventory_status field to bag creation and editing forms
    - Implement quick status update controls without full form navigation
    - Remove weight-based tracking displays and calculations
    - Display current status in bag lists and detail views
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 8.2 Write property test for weight tracking elimination
    - **Property 9: Weight Tracking Elimination**
    - **Validates: Requirements 5.5, 11.5**

- [ ] 9. Permission Enforcement and Security
  - [ ] 9.1 Implement frontend permission checks
    - Show/hide edit and delete controls based on user permissions
    - Handle permission errors gracefully with clear messaging
    - Ensure admin-only delete operations are properly restricted
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.2, 7.3, 7.4_

  - [ ]* 9.2 Write property test for permission enforcement
    - **Property 5: Permission Enforcement**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 7.2, 7.3, 7.4**

- [ ] 10. Component Reuse and UI Consistency
  - [ ] 10.1 Ensure consistent component usage across bean features
    - Reuse IconButton, chip, and list card components from existing sections
    - Maintain "most used by me" indicator patterns from Equipment section
    - Follow layout hierarchy guidance from system definition document
    - _Requirements: 9.1, 9.3, 9.4_

  - [ ]* 10.2 Write property test for component reuse consistency
    - **Property 8: Component Reuse Consistency**
    - **Validates: Requirements 9.1, 9.3**

- [ ] 11. Integration and Error Handling
  - [ ] 11.1 Implement comprehensive error handling
    - Add network error handling with retry mechanisms
    - Implement validation error feedback for forms
    - Handle permission errors with appropriate user messaging
    - Add loading states and empty state handling
    - _Requirements: All requirements (error handling support)_

  - [ ]* 11.2 Write integration tests for error scenarios
    - Test network failure recovery
    - Test validation error display
    - Test permission error handling

- [ ] 12. Final Integration and Testing
  - [ ] 12.1 Wire all components together
    - Connect navigation to bean list page
    - Link bean cards to detail pages
    - Integrate rating system across all views
    - Ensure bag status updates reflect immediately
    - _Requirements: All requirements (integration)_

  - [ ]* 12.2 Write end-to-end integration tests
    - Test complete user workflows from navigation to rating
    - Test cross-component data consistency
    - Test permission boundaries across system

- [ ] 13. Final Checkpoint - Complete System Validation
  - Ensure all tests pass and functionality works end-to-end
  - Verify that weight-based features are completely removed
  - Confirm that social signals enhance rather than compete with personal features
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout development
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
- The Supabase power should be used for all database schema inspection and migration tasks
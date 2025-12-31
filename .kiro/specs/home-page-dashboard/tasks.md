# Implementation Plan: Home Page Dashboard

## Overview

This implementation transforms Espresso Engineered from a brews-first application to a comprehensive home dashboard. The approach prioritizes core functionality first, then adds animations and visualizations. Each task builds incrementally to ensure a working system at every checkpoint.

## Tasks

- [x] 1. Install and integrate required dependencies
  - Install GSAP animation library in frontend
  - Install D3 visualization library in frontend
  - Set up GSAP integration within UI framework structure
  - _Requirements: 2.1, 9.1_

- [x] 2. Extend database schema and API for bag lifecycle tracking
  - [x] 2.1 Add emptied_on_date field to bags table in Supabase
    - Create migration to add TIMESTAMPTZ column
    - Update TypeScript schemas in shared/types
    - _Requirements: 7.1, 7.2, 7.4_

  - [ ]* 2.2 Write property test for bag emptying timestamp
    - **Property 10: Bag emptying timestamp**
    - **Validates: Requirements 4.5, 7.1**

  - [x] 2.3 Update bag API endpoints to handle emptied_on_date
    - Modify PATCH /api/bags/{id} to set emptied_on_date when status changes to empty
    - Update bag repository methods
    - _Requirements: 7.3_

  - [ ]* 2.4 Write property test for emptied date API handling
    - **Property 26: Emptied date API handling**
    - **Validates: Requirements 7.3**

  - [ ]* 2.5 Write property test for backward compatibility
    - **Property 27: Backward compatibility preservation**
    - **Validates: Requirements 7.5**

- [x] 3. Create new API endpoints for dashboard data
  - [x] 3.1 Implement bean inventory API endpoint
    - Create GET /api/bags/inventory endpoint
    - Filter bags by ownership and current week logic
    - Sort by last_used_date descending
    - _Requirements: 4.2, 4.3_

  - [ ]* 3.2 Write property test for inventory filtering and sorting
    - **Property 8: Inventory filtering and sorting**
    - **Validates: Requirements 4.2, 4.3**

  - [x] 3.3 Implement week in brewing API endpoint
    - Create GET /api/brews/week endpoint
    - Group brews by barista and bean combination
    - Filter to current week starting Monday
    - _Requirements: 5.1, 5.3_

  - [ ]* 3.4 Write property test for current week filtering
    - **Property 11: Current week filtering**
    - **Validates: Requirements 5.1**

  - [ ]* 3.5 Write property test for brew grouping
    - **Property 12: Brew grouping by barista and bean**
    - **Validates: Requirements 5.3**

  - [x] 3.6 Implement brew analysis API endpoint
    - Create GET /api/brews/analysis endpoint
    - Support bean_id, bag_id, and recency filtering
    - Return data optimized for D3 scatter plots
    - _Requirements: 8.1, 8.3, 8.4_

  - [ ]* 3.7 Write property test for brew data API filtering
    - **Property 23: Brew data API filtering**
    - **Validates: Requirements 8.1, 8.3**

  - [ ]* 3.8 Write property test for D3-optimized data format
    - **Property 24: D3-optimized data format**
    - **Validates: Requirements 8.4**

  - [ ]* 3.9 Write property test for API empty result handling
    - **Property 25: API empty result handling**
    - **Validates: Requirements 8.5**

- [x] 4. Checkpoint - Ensure all API tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Set up GSAP animation framework integration
  - [x] 5.1 Create animation module in UI framework
    - Create ui/animations directory with index.ts, transitions.ts, gestures.ts
    - Define animation configuration interfaces
    - Implement core animation functions (horizontalScroll, cardStack, fadeInUp)
    - _Requirements: 2.2, 2.3_

  - [ ]* 5.2 Write property test for animation configuration inheritance
    - **Property 4: Animation configuration inheritance**
    - **Validates: Requirements 2.3**

  - [ ]* 5.3 Write property test for animation scope independence
    - **Property 5: Animation scope independence**
    - **Validates: Requirements 2.5**

- [x] 6. Update navigation system for home-first approach
  - [x] 6.1 Create home page route and component
    - Create frontend/src/routes/+page.svelte for home dashboard
    - Set up basic page structure with sections
    - _Requirements: 1.1_

  - [x] 6.2 Update navigation links and redirects
    - Modify header logo to link to home page
    - Add "Go back home" links throughout application
    - Update authentication redirects to point to home
    - _Requirements: 1.2, 1.3, 1.4_

  - [ ]* 6.3 Write property test for logo navigation consistency
    - **Property 1: Logo navigation consistency**
    - **Validates: Requirements 1.2**

  - [ ]* 6.4 Write property test for home navigation availability
    - **Property 2: Home navigation availability**
    - **Validates: Requirements 1.3**

  - [ ]* 6.5 Write property test for browser history preservation
    - **Property 3: Browser history preservation**
    - **Validates: Requirements 1.5**

- [-] 7. Implement voice greeting system
  - [x] 7.1 Create VoiceGreeting component
    - Implement contextual greeting logic based on time and user activity
    - Follow UI execution standard typography requirements
    - Support different greeting patterns for various contexts
    - _Requirements: 3.1, 3.5_

  - [ ]* 7.2 Write property test for contextual greeting variation
    - **Property 6: Contextual greeting variation**
    - **Validates: Requirements 3.1, 3.5**

  - [ ]* 7.3 Write property test for voice typography compliance
    - **Property 7: Voice typography compliance**
    - **Validates: Requirements 3.2, 3.3, 3.4**

- [x] 8. Implement bean inventory section
  - [x] 8.1 Create BeanInventorySection component
    - Implement horizontal scrollable bag list
    - Integrate with existing EditableBagCard components
    - Add horizontal navigation controls
    - _Requirements: 4.1, 4.6_

  - [ ]* 8.2 Write property test for horizontal bag navigation
    - **Property 9: Horizontal bag navigation**
    - **Validates: Requirements 4.1, 4.6**

  - [x] 8.3 Add GSAP animations to inventory section
    - Implement smooth horizontal scrolling animations
    - Add card interaction animations
    - _Requirements: 2.3, 2.5_

- [x] 9. Implement week in brewing section
  - [x] 9.1 Create WeekInBrewingSection component
    - Implement horizontally scrollable layout
    - Create layered card grouping system
    - Integrate with existing BrewCard components
    - _Requirements: 5.2, 5.3_

  - [x] 9.2 Add layered navigation functionality
    - Implement navigation within card groups
    - Implement navigation between card groups
    - _Requirements: 5.4, 5.5_

  - [x]* 9.3 Write property test for layered navigation functionality
    - **Property 13: Layered navigation functionality**
    - **Validates: Requirements 5.4, 5.5**

  - [x] 9.4 Add GSAP animations to week section
    - Implement card stacking/unstacking animations
    - Add smooth horizontal navigation transitions
    - _Requirements: 5.6_

  - [ ]* 9.5 Write property test for brew card animations
    - **Property 14: Brew card animations**
    - **Validates: Requirements 5.6**

  - [x] 9.6 Add brew detail navigation
    - Implement click handlers for navigation to individual brews
    - _Requirements: 5.7_

  - [ ]* 9.7 Write property test for brew detail navigation
    - **Property 15: Brew detail navigation**
    - **Validates: Requirements 5.7**

- [x] 10. Checkpoint - Ensure core sections work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Set up D3 visualization framework
  - [x] 11.1 Create scatter plot component infrastructure
    - Create ScatterPlot class with D3 integration
    - Integrate with UI framework's viz system (theme, palette)
    - Implement responsive design patterns
    - _Requirements: 6.3, 9.2_

  - [ ]* 11.2 Write property test for responsive chart behavior
    - **Property 29: Responsive chart behavior**
    - **Validates: Requirements 9.4**

  - [ ]* 11.3 Write property test for chart styling consistency
    - **Property 30: Chart styling consistency**
    - **Validates: Requirements 9.6**

- [x] 12. Implement bean analysis section
  - [x] 12.1 Create BeanAnalysisSection component
    - Implement bean and bag selector controls
    - Set up default selection to user's last used bag
    - Create container for dual scatter plots
    - _Requirements: 6.1, 6.2_

  - [ ]* 12.2 Write property test for default bag selection
    - **Property 16: Default bag selection**
    - **Validates: Requirements 6.1**

  - [ ]* 12.3 Write property test for dual scatter plot display
    - **Property 17: Dual scatter plot display**
    - **Validates: Requirements 6.2**

  - [x] 12.4 Implement scatter plot charts
    - Create rating vs ratio scatter plot
    - Create rating vs brew time scatter plot
    - Align vertical axes and omit labels
    - _Requirements: 6.6, 6.7_

  - [ ]* 12.5 Write property test for chart axis alignment
    - **Property 20: Chart axis alignment**
    - **Validates: Requirements 6.6, 6.7**

  - [x] 12.6 Add data filtering functionality
    - Implement single bag data filtering
    - Implement multi-bag visual differentiation
    - _Requirements: 6.4, 6.5_

  - [ ]* 12.7 Write property test for single bag data filtering
    - **Property 18: Single bag data filtering**
    - **Validates: Requirements 6.4**

  - [ ]* 12.8 Write property test for multi-bag visual differentiation
    - **Property 19: Multi-bag visual differentiation**
    - **Validates: Requirements 6.5**

  - [x] 12.9 Add recency filtering controls
    - Implement recency filter component (2D, W, M, 3M, Y)
    - Connect filters to chart data updates
    - _Requirements: 6.8_

  - [ ]* 12.10 Write property test for recency filtering functionality
    - **Property 21: Recency filtering functionality**
    - **Validates: Requirements 6.8**

  - [x] 12.11 Add chart interactivity
    - Implement hover interactions for data points
    - Add tooltip details for individual brews
    - _Requirements: 9.5_

  - [ ]* 12.12 Write property test for interactive scatter plot rendering
    - **Property 28: Interactive scatter plot rendering**
    - **Validates: Requirements 9.3, 9.5**

  - [x] 12.13 Add empty state handling
    - Implement voice system integration for no data scenarios
    - _Requirements: 6.10_

  - [ ]* 12.14 Write property test for analysis empty state handling
    - **Property 22: Analysis empty state handling**
    - **Validates: Requirements 6.10**

- [x] 13. Integrate all sections into home page
  - [x] 13.1 Wire all components together in home page
    - Import and integrate VoiceGreeting, BeanInventorySection, WeekInBrewingSection, BeanAnalysisSection
    - Set up data loading and state management
    - Implement error handling and loading states
    - _Requirements: All sections integration_

  - [x] 13.2 Add progressive loading and performance optimization
    - Implement skeleton screens for loading states
    - Set up priority loading (inventory → week → analysis)
    - Add smooth transitions between states
    - _Requirements: Performance and UX_

- [x] 14. Final checkpoint - Complete integration testing
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- GSAP and D3 integrations follow existing UI framework patterns
- All components reuse existing design system and patterns where possible
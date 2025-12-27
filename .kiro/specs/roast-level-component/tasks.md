# Implementation Plan: Roast Level Component

## Overview

This implementation plan creates a reusable visual roast level component using coffee bean icons, then integrates it throughout the application to replace text-based roast level displays. The approach focuses on building the core component first, then systematically replacing existing implementations.

## Tasks

- [x] 1. Create core RoastLevel component
  - Create RoastLevel.svelte component with props interface
  - Implement roast level to bean count mapping logic
  - Add size variant support (small/medium/large with corresponding icon components)
  - Implement basic styling with design token colors
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 1.1 Write property test for component structure
  - **Property 1: Component Structure Consistency**
  - **Validates: Requirements 1.1**

- [ ]* 1.2 Write property test for roast level mapping
  - **Property 2: Roast Level Visual Mapping**
  - **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6**

- [ ]* 1.3 Write property test for color token compliance
  - **Property 3: Design Token Color Compliance**
  - **Validates: Requirements 2.1, 2.2, 2.3**

- [ ]* 1.4 Write property test for size variants
  - **Property 4: Size Variant Support**
  - **Property 5: Default Size Behavior**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

- [x] 2. Add interactive editing functionality
  - Implement hover state management and preview
  - Add click handlers for roast level selection
  - Implement editable/view-only mode switching
  - Add visual differentiation between current and hover states
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 6.2, 6.3, 6.4_

- [ ]* 2.1 Write property test for hover interactions
  - **Property 6: Hover Response in Editable Mode**
  - **Property 8: Hover State Cleanup**
  - **Property 9: Visual State Differentiation**
  - **Validates: Requirements 4.1, 4.2, 4.4, 4.5**

- [ ]* 2.2 Write property test for click interactions
  - **Property 7: Click Interaction Value Setting**
  - **Validates: Requirements 4.3**

- [ ]* 2.3 Write property test for view-only mode
  - **Property 11: View-Only Mode Behavior**
  - **Property 12: Default Interaction Mode**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

- [x] 3. Add optional text label support
  - Implement showLabel prop functionality
  - Add text label positioning and styling
  - Ensure text uses correct design tokens (muted color, small size)
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ]* 3.1 Write property test for text label display
  - **Property 10: Optional Text Label Display**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

- [x] 4. Add basic accessibility support
  - Add title attributes for visual elements
  - Implement focus management for editable mode
  - _Requirements: 8.1, 8.2_

- [ ]* 4.1 Write property test for accessibility attributes
  - **Property 13: Basic Accessibility Attributes**
  - **Validates: Requirements 8.1, 8.2**

- [ ] 5. Checkpoint - Core component complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Replace roast level in BeanCard component
  - Update BeanCard.svelte to use RoastLevel component instead of text
  - Configure appropriate size and view-only mode
  - Test visual integration and spacing
  - _Requirements: 7.1_

- [ ] 7. Replace roast level in BagSelector component
  - Update BagSelector.svelte to use RoastLevel component
  - Ensure proper sizing for selector context
  - Maintain existing layout and spacing
  - _Requirements: 7.2_

- [ ] 8. Replace roast level in bean edit forms
  - Update bean detail page edit form to use editable RoastLevel component
  - Replace select dropdown with interactive bean component
  - Implement proper event handling for form submission
  - _Requirements: 7.3_

- [ ] 9. Replace roast level in brew detail pages
  - Update brew detail page to show RoastLevel component for bean information
  - Use view-only mode with appropriate sizing
  - _Requirements: 7.4_

- [ ] 10. Replace roast level filter in BeanList
  - Update BeanList.svelte filter section to use RoastLevel component
  - Implement filter selection using editable mode
  - Add "All levels" state handling (no beans active)
  - Maintain existing filter functionality and state management
  - _Requirements: 7.5_

- [ ]* 10.1 Write integration tests for BeanList filtering
  - Test roast level filter integration with existing search and roaster filters
  - Test filter state management and URL synchronization

- [ ] 11. Final integration testing
  - Test component across all integration points
  - Verify consistent sizing and styling
  - Ensure all interactive functionality works correctly
  - Test responsive behavior on different screen sizes
  - _Requirements: 7.6_

- [ ] 12. Final checkpoint - Complete implementation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Integration tests validate component behavior in real application contexts
- The implementation follows a build-then-integrate approach to minimize disruption
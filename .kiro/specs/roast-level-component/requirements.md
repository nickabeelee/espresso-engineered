# Requirements Document

## Introduction

A visual roast level component that uses coffee bean icons to represent roast intensity levels. This component will replace text-based roast level displays throughout the application with an intuitive visual indicator that can function in both view-only and editable modes.

## Glossary

- **Roast_Level_Component**: The visual component that displays roast level using coffee bean icons
- **Bean_Icon**: The coffee bean SVG icon in various sizes (micro, mini, solid)
- **Active_Bean**: A coffee bean icon filled with dark brown color to indicate roast level
- **Inactive_Bean**: A coffee bean icon filled with light brown color
- **Hover_State**: Interactive state when user hovers over editable component
- **Roast_Level_Enum**: Database enum with values: "Light", "Medium Light", "Medium", "Medium Dark", "Dark"

## Requirements

### Requirement 1: Visual Roast Level Display

**User Story:** As a user, I want to see roast levels represented visually with coffee bean icons, so that I can quickly understand roast intensity without reading text.

#### Acceptance Criteria

1. THE Roast_Level_Component SHALL display exactly 5 coffee bean icons in a horizontal row
2. WHEN roast level is "Light", THE Roast_Level_Component SHALL show 1 active bean and 4 inactive beans
3. WHEN roast level is "Medium Light", THE Roast_Level_Component SHALL show 2 active beans and 3 inactive beans
4. WHEN roast level is "Medium", THE Roast_Level_Component SHALL show 3 active beans and 2 inactive beans
5. WHEN roast level is "Medium Dark", THE Roast_Level_Component SHALL show 4 active beans and 1 inactive bean
6. WHEN roast level is "Dark", THE Roast_Level_Component SHALL show 5 active beans and 0 inactive beans

### Requirement 2: Color Token Compliance

**User Story:** As a designer, I want the roast level component to use only approved color tokens, so that it maintains visual consistency with the design system.

#### Acceptance Criteria

1. THE Active_Bean SHALL use a dark brown color token from the UI execution standard
2. THE Inactive_Bean SHALL use a light brown color token from the UI execution standard
3. THE Roast_Level_Component SHALL NOT introduce any custom colors outside the design token system

### Requirement 3: Size Variability

**User Story:** As a developer, I want the roast level component to support different sizes, so that I can use it consistently across various UI contexts.

#### Acceptance Criteria

1. THE Roast_Level_Component SHALL support small, medium, and large size variants
2. WHEN size is "small", THE Roast_Level_Component SHALL use CoffeeBeanMicro icons
3. WHEN size is "medium", THE Roast_Level_Component SHALL use CoffeeBeanMini icons
4. WHEN size is "large", THE Roast_Level_Component SHALL use CoffeeBeanSolid icons
5. THE Roast_Level_Component SHALL default to medium size when no size is specified

### Requirement 4: Interactive Editing Mode

**User Story:** As a user, I want to edit roast levels by interacting with the coffee bean icons, so that I can set roast levels intuitively.

#### Acceptance Criteria

1. WHEN editable mode is enabled, THE Roast_Level_Component SHALL respond to mouse hover events
2. WHEN user hovers over a bean icon, THE Roast_Level_Component SHALL show preview state with beans filled up to the hovered position
3. WHEN user clicks on a bean icon, THE Roast_Level_Component SHALL set the roast level corresponding to that bean position
4. WHEN user hovers away from the component, THE Roast_Level_Component SHALL return to the current selected state
5. THE Roast_Level_Component SHALL provide visual feedback to distinguish between current state and hover preview

### Requirement 5: Optional Text Label

**User Story:** As a user, I want to optionally see the text description of the roast level, so that I can confirm the exact roast level when needed.

#### Acceptance Criteria

1. THE Roast_Level_Component SHALL support an optional text label display
2. WHEN text label is enabled, THE Roast_Level_Component SHALL display the roast level name below the icons
3. THE text label SHALL use muted text color and small font size
4. THE text label SHALL display the exact enum value ("Light", "Medium Light", etc.)

### Requirement 6: View-Only Mode

**User Story:** As a user, I want to see roast levels in read-only contexts, so that I can understand roast intensity without accidentally changing values.

#### Acceptance Criteria

1. THE Roast_Level_Component SHALL support a view-only mode
2. WHEN in view-only mode, THE Roast_Level_Component SHALL NOT respond to hover or click events
3. WHEN in view-only mode, THE Roast_Level_Component SHALL display static roast level visualization
4. THE Roast_Level_Component SHALL default to view-only mode when editable prop is not specified

### Requirement 7: Integration Points

**User Story:** As a developer, I want to replace existing text-based roast level displays, so that the application has consistent visual roast level representation.

#### Acceptance Criteria

1. THE Roast_Level_Component SHALL replace roast level text in BeanCard components
2. THE Roast_Level_Component SHALL replace roast level text in BagSelector components
3. THE Roast_Level_Component SHALL replace roast level select input in bean edit forms
4. THE Roast_Level_Component SHALL replace roast level text in brew detail pages
5. THE Roast_Level_Component SHALL replace roast level filter dropdown in BeanList component
6. WHEN replacing existing implementations, THE Roast_Level_Component SHALL maintain all current functionality

### Requirement 8: Basic Accessibility

**User Story:** As a user, I want the roast level component to have basic accessibility support, so that it works with standard browser functionality.

#### Acceptance Criteria

1. THE Roast_Level_Component SHALL provide basic alt text or title attributes for the visual elements
2. THE Roast_Level_Component SHALL be focusable when in editable mode
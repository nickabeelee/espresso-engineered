# Design Document

## Overview

The Roast Level Component is a reusable Svelte component that provides visual representation of coffee roast levels using a series of coffee bean icons. The component supports both view-only and interactive editing modes, with size variants for different UI contexts. It replaces text-based roast level displays throughout the application with an intuitive visual indicator.

## Architecture

The component follows a single-file Svelte component architecture with clear separation between visual presentation and interaction logic. The design leverages the existing coffee bean icon components and integrates with the established design token system.

### Component Structure

```
RoastLevel.svelte
├── Props Interface
├── Visual State Management
├── Interaction Handlers
├── Icon Rendering Logic
└── Styling (CSS)
```

## Components and Interfaces

### Primary Component: RoastLevel.svelte

**Props Interface:**
```typescript
interface RoastLevelProps {
  value: RoastLevel | null;           // Current roast level value
  editable?: boolean;                 // Enable interactive editing (default: false)
  size?: 'small' | 'medium' | 'large'; // Icon size variant (default: 'medium')
  showLabel?: boolean;                // Display text label (default: false)
  onChange?: (value: RoastLevel) => void; // Callback for value changes
}
```

**Events:**
```typescript
// Dispatched when roast level changes in editable mode
createEventDispatcher<{
  change: RoastLevel;
}>();
```

### Icon Size Mapping

| Size Prop | Icon Component | Default Size |
|-----------|----------------|--------------|
| 'small'   | CoffeeBeanMicro | 16px |
| 'medium'  | CoffeeBeanMini  | 20px |
| 'large'   | CoffeeBeanSolid | 24px |

### Roast Level Mapping

| Roast Level | Active Beans | Inactive Beans |
|-------------|--------------|----------------|
| "Light"     | 1            | 4              |
| "Medium Light" | 2         | 3              |
| "Medium"    | 3            | 2              |
| "Medium Dark" | 4          | 1              |
| "Dark"      | 5            | 0              |

## Data Models

### RoastLevel Type
```typescript
type RoastLevel = 'Light' | 'Medium Light' | 'Medium' | 'Medium Dark' | 'Dark';
```

### Internal State Model
```typescript
interface ComponentState {
  currentValue: RoastLevel | null;
  hoverValue: RoastLevel | null;
  isHovering: boolean;
}
```

### Color Token Mapping
```typescript
interface ColorTokens {
  activeBeanColor: string;   // --text-ink-primary (#2B2118) - Dark brown for filled beans
  inactiveBeanColor: string; // --text-ink-muted (#6A5A4A) - Light brown for empty beans
  hoverColor: string;        // --accent-primary (#B08A5A) - Accent color for hover preview
}
```

**Specific Token Usage:**
- **Active Beans**: `var(--text-ink-primary)` (#2B2118) - Darkest brown for filled roast level
- **Inactive Beans**: `var(--text-ink-muted)` (#6A5A4A) - Muted brown for unfilled roast level  
- **Hover Preview**: `var(--accent-primary)` (#B08A5A) - Accent color to distinguish hover state
- **Text Label**: `var(--text-ink-muted)` (#6A5A4A) - Consistent with muted text styling

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Component Structure Consistency
*For any* roast level component instance, the component should always render exactly 5 coffee bean icons in a horizontal row
**Validates: Requirements 1.1**

### Property 2: Roast Level Visual Mapping
*For any* valid roast level value, the component should display the correct number of active and inactive beans according to the roast intensity mapping (Light=1 active, Medium Light=2 active, Medium=3 active, Medium Dark=4 active, Dark=5 active)
**Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6**

### Property 3: Design Token Color Compliance
*For any* rendered bean icon, the color used should be from the approved design token system (--text-ink-primary for active beans, --text-ink-muted for inactive beans, --accent-primary for hover preview)
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 4: Size Variant Support
*For any* size prop value ('small', 'medium', 'large'), the component should render the corresponding icon component (CoffeeBeanMicro, CoffeeBeanMini, CoffeeBeanSolid respectively)
**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 5: Default Size Behavior
*For any* component instance without a size prop, the component should default to medium size using CoffeeBeanMini icons
**Validates: Requirements 3.5**

### Property 6: Hover Response in Editable Mode
*For any* component in editable mode, hovering over a bean icon should trigger a visual preview state showing beans filled up to the hovered position
**Validates: Requirements 4.1, 4.2**

### Property 7: Click Interaction Value Setting
*For any* component in editable mode, clicking on a bean icon should set the roast level value corresponding to that bean's position (1st bean=Light, 2nd=Medium Light, etc.)
**Validates: Requirements 4.3**

### Property 8: Hover State Cleanup
*For any* component in editable mode, when the mouse leaves the component area, the visual state should return to the current selected value (not the hover preview)
**Validates: Requirements 4.4**

### Property 9: Visual State Differentiation
*For any* component in editable mode during hover, there should be visual distinction between the current selected state and the hover preview state
**Validates: Requirements 4.5**

### Property 10: Optional Text Label Display
*For any* component with showLabel=true, a text label displaying the exact roast level enum value should appear below the icons using muted text styling
**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 11: View-Only Mode Behavior
*For any* component in view-only mode (editable=false), the component should display static roast level visualization without responding to hover or click events
**Validates: Requirements 6.1, 6.2, 6.3**

### Property 12: Default Interaction Mode
*For any* component without an editable prop specified, the component should default to view-only mode
**Validates: Requirements 6.4**

### Property 13: Basic Accessibility Attributes
*For any* rendered component, basic accessibility attributes (alt text or title) should be present on visual elements, and the component should be focusable when in editable mode
**Validates: Requirements 8.1, 8.2**

## Error Handling

### Invalid Roast Level Values
- Component should handle null or undefined roast level values gracefully
- Invalid roast level strings should default to showing no active beans
- Component should not crash when receiving unexpected prop values

### Missing Icon Components
- Component should fail gracefully if coffee bean icon components are not available
- Fallback behavior should maintain component structure even without icons

### Color Token Availability
- Component should have fallback colors if design tokens are not loaded
- Should not break layout if CSS custom properties are unavailable

## Testing Strategy

### Unit Testing Approach
The component will be tested using Vitest with Svelte Testing Library for DOM manipulation and event simulation. Unit tests will focus on:

- Prop validation and default values
- Roast level to visual state mapping
- Event handling and state changes
- Accessibility attribute presence
- Error boundary behavior

### Property-Based Testing Configuration
Property-based tests will use fast-check library with minimum 100 iterations per test. Each property test will be tagged with the format:
**Feature: roast-level-component, Property {number}: {property_text}**

Property tests will validate:
- Roast level mapping across all valid enum values
- Size variant behavior across all size options
- Interactive behavior with generated user interactions
- Color token compliance across different states
- Component structure consistency across different prop combinations

### Integration Testing
Integration tests will verify:
- Component integration with existing forms and displays
- Event propagation to parent components
- CSS styling integration with design system
- Responsive behavior across different screen sizes

The testing approach balances comprehensive property validation with practical unit tests for specific examples and edge cases, ensuring both correctness and maintainability.
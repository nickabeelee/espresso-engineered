# Design Document: Bean Inventory Management

## Overview

The Bean Inventory Management feature transforms the existing bean and bag data model into a comprehensive inventory management system. This feature enables baristas to manage their personal coffee collections while discovering beans from the broader community. The design emphasizes personal ownership with ambient social discovery, following the established patterns of the Espresso Engineered application.

The feature introduces a new "Beans" section in the main navigation, positioned before Equipment, providing access to bean browsing, bag management, and inventory tracking through qualitative status indicators rather than precise weight calculations.

## Architecture

### Component Hierarchy

```
Beans Navigation Item
├── Beans Index Page (/beans)
│   ├── Bean List Component
│   │   ├── Search and Filter Controls
│   │   ├── "My Beans" Toggle
│   │   └── Bean Cards with Ownership Indicators
│   └── Bean Detail Page (/beans/:id)
│       ├── Bean Information Display
│       ├── Aggregate Statistics
│       ├── Social Activity Indicators
│       └── Associated Bags Section
└── Bag Management (Integrated)
    ├── Bag Status Controls
    ├── Bag Creation Forms
    └── Bag Edit Interfaces
```

### Data Flow Architecture

The feature leverages existing backend routes with minimal modifications:
- **Bean Routes**: Already implemented with search, filtering, and CRUD operations
- **Bag Routes**: Requires extension for inventory status field and enhanced querying
- **Frontend State**: Utilizes existing patterns from BrewList component for filtering and pagination

## Components and Interfaces

### Navigation Integration

**Component**: Main Layout Navigation
- Add "Beans" navigation item before "Equipment"
- Follow existing navigation patterns with active state indicators
- Route: `/beans` (primary entry point)

### Beans Index Page

**Primary Component**: `BeanList.svelte`
- Reuses patterns from `BrewList.svelte` for consistency
- Implements search, filtering, and pagination
- Displays beans with ownership context and social signals

**Key Features**:
- Search across bean names, tasting notes, and descriptive fields
- Filter by roaster and roast level
- "My Beans" toggle filter (similar to "Only my brews")
- Visual distinction between owned, previously owned, and never owned beans
- "Most used by me" indicators (reusing Equipment section patterns)

**Bean Card Content**:
```typescript
interface BeanCardData {
  id: string;
  name: string;
  roaster: RoasterInfo;
  roast_level: RoastLevel;
  average_rating: number;
  total_brews: number;
  personal_rating?: number;
  ownership_status: 'owned' | 'previously_owned' | 'never_owned';
  most_used_by_me: boolean;
  social_signals: {
    recent_activity?: string;
    usage_count?: number;
  };
}
```

### Bean Detail Page

**Component**: `BeanDetail.svelte`
- Displays comprehensive bean information
- Shows aggregate statistics and social context
- Lists associated bags with ownership indicators
- Provides navigation to bag management

**Content Sections**:
1. **Bean Information**: Name, roaster, roast level, tasting notes, origin
2. **Statistics**: Average rating, total brews, personal rating
3. **Social Context**: Recent activity by other baristas (non-competitive)
4. **Bags Section**: All bags for this bean with ownership distinction

### Bag Management Integration

**Status Management**: 
- Replace weight-based tracking with qualitative status enum
- Quick status update controls without full form navigation
- Status values: `unopened`, `plenty`, `getting_low`, `empty`

**Bag Display**:
- Clear ownership indicators
- Status-based visual cues
- Integration with existing bag creation/editing flows

### Bean Rating System

**Component**: `BeanRating.svelte`
- 5-star rating interface
- Displays personal rating prominently in lists
- Shows community average when personal rating unavailable
- Stores individual ratings separately from aggregates

## Data Models

### Enhanced Bag Schema

```sql
-- Add inventory_status enum
CREATE TYPE inventory_status AS ENUM (
  'unopened',
  'plenty', 
  'getting_low',
  'empty'
);

-- Add inventory_status to bag table
ALTER TABLE bag ADD COLUMN inventory_status inventory_status DEFAULT 'unopened';

-- Remove weight-based tracking (if desired)
-- ALTER TABLE bag DROP COLUMN weight_grams;
```

### Bean Rating Schema

```sql
-- Create bean_rating table for individual ratings
CREATE TABLE bean_rating (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bean_id uuid NOT NULL REFERENCES bean(id) ON DELETE CASCADE,
  barista_id uuid NOT NULL REFERENCES barista(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(bean_id, barista_id)
);

-- Enable RLS
ALTER TABLE bean_rating ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Bean ratings are viewable by everyone" ON bean_rating
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own bean ratings" ON bean_rating
  FOR ALL USING (auth.uid() = barista_id);
```

### Supabase Integration Requirements

**Schema Discovery and Management**:
- Use Supabase power to inspect current RLS policies on existing tables
- Verify existing bag table structure and constraints
- Understand current bean and roaster table permissions
- Implement new fields and tables using Supabase migration patterns

**RLS Policy Analysis**:
- Review existing RLS policies on bag, bean, and roaster tables
- Ensure new bean_rating table follows established RLS patterns
- Validate that bag inventory_status field respects existing ownership rules
- Confirm admin override capabilities are maintained

**Migration Strategy**:
- Use Supabase power to create migration files for schema changes
- Test migrations in development environment before production
- Ensure backward compatibility with existing data
- Validate that new enum type is properly created and referenced

### API Extensions

**Bean Routes Enhancement**:
```typescript
// GET /api/beans - Add ownership and rating context
interface BeanWithContext extends Bean {
  ownership_status: 'owned' | 'previously_owned' | 'never_owned';
  personal_rating?: number;
  average_rating: number;
  total_brews: number;
  most_used_by_me: boolean;
  bag_count: number;
}

// GET /api/beans/:id - Add social context and bags
interface BeanDetailResponse extends BeanWithContext {
  recent_activity: RecentActivity[];
  bags: BagWithOwnership[];
}
```

**Bag Routes Enhancement**:
```typescript
// Add inventory_status to all bag operations
interface BagWithStatus extends Bag {
  inventory_status: 'unopened' | 'plenty' | 'getting_low' | 'empty';
}

// GET /api/bags - Add filtering by status
interface BagFilters {
  bean_id?: string;
  inventory_status?: string;
  owner_only?: boolean;
}
```

**New Bean Rating Routes**:
```typescript
// POST /api/beans/:id/rating - Rate a bean
// PUT /api/beans/:id/rating - Update rating
// DELETE /api/beans/:id/rating - Remove rating
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Bean Display Completeness
*For any* bean in the system, when displayed in lists or detail views, the system should show all required information including name, roaster, roast level, aggregate statistics, and ownership indicators
**Validates: Requirements 2.1, 2.3, 2.4, 4.2, 4.3**

### Property 2: Ownership Status Accuracy
*For any* bean and barista combination, the ownership status (owned, previously owned, never owned) should accurately reflect the barista's relationship to that bean based on their bag ownership history
**Validates: Requirements 2.2, 2.4, 7.5**

### Property 3: Filter Combination Logic
*For any* combination of search terms, roaster filters, roast level filters, and "My Beans" toggle, the system should return only beans that match all applied criteria using logical AND operations
**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

### Property 4: Inventory Status Management
*For any* bag, the inventory_status field should accept only the enumerated values (unopened, plenty, getting_low, empty) and should be displayed consistently across all bag views
**Validates: Requirements 5.1, 5.2, 5.3**

### Property 5: Permission Enforcement
*For any* user action on beans, bags, or roasters, the system should enforce the correct permissions: authenticated users can create/edit beans and roasters, only admins can delete beans and roasters, and only bag owners and admins can edit/delete bags
**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 7.2, 7.3, 7.4**

### Property 6: Rating System Integrity
*For any* bean rating operation, personal ratings should be stored separately from community aggregates, and displays should show personal ratings when available or community averages as fallback
**Validates: Requirements 10.2, 10.3, 10.4, 10.5**

### Property 7: Social Signal Display
*For any* bean with community activity, social signals should be displayed as secondary metadata without competing with personal ownership indicators
**Validates: Requirements 8.1, 4.4**

### Property 8: Component Reuse Consistency
*For any* UI component implementation, the system should reuse existing components (icon buttons, chips, list cards) and maintain pattern consistency with existing sections like Equipment
**Validates: Requirements 9.1, 9.3**

### Property 9: Weight Tracking Elimination
*For any* bag-related interface or calculation, the system should not display or calculate weight-based tracking features, relying instead on status-based tracking
**Validates: Requirements 5.5, 11.5**

### Property 10: Bag Visibility Completeness
*For any* bean detail view, all associated bags should be displayed with clear ownership indicators, ensuring community visibility while maintaining ownership context
**Validates: Requirements 7.1, 4.5**

## Error Handling

### Frontend Error Handling

**Network Errors**:
- Display user-friendly error messages for API failures
- Implement retry mechanisms for transient failures
- Graceful degradation when backend services are unavailable

**Validation Errors**:
- Real-time validation feedback for form inputs
- Clear error messages for invalid enum values (inventory_status)
- Prevent submission of invalid data

**Permission Errors**:
- Clear messaging when users attempt unauthorized actions
- Graceful handling of 403/404 responses
- Redirect to appropriate pages when access is denied

### Backend Error Handling

**Data Validation**:
- Strict validation of inventory_status enum values
- Foreign key constraint validation for bean/roaster relationships
- Input sanitization for search queries

**Permission Validation**:
- Row Level Security (RLS) enforcement for all database operations
- Admin privilege verification for delete operations
- Ownership validation for bag modifications

**Conflict Resolution**:
- Handle concurrent rating updates gracefully
- Prevent deletion of beans/roasters referenced by existing bags/brews
- Manage duplicate bean names within the same roaster

## Testing Strategy

### Dual Testing Approach

The Bean Inventory Management feature requires both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests**:
- Specific examples of navigation behavior (clicking "Beans" link)
- Edge cases for inventory status transitions
- Error conditions and permission boundaries
- Integration points between components
- Database migration validation

**Property-Based Tests**:
- Universal properties across all inputs using fast-check library
- Minimum 100 iterations per property test
- Each test tagged with feature and property reference
- Comprehensive input coverage through randomization

### Property-Based Testing Configuration

**Library**: fast-check (JavaScript/TypeScript property-based testing)
**Test Configuration**:
- Minimum 100 iterations per property test
- Custom generators for domain objects (beans, bags, baristas)
- Shrinking enabled for minimal counterexamples

**Test Tagging Format**:
```typescript
// Feature: bean-inventory-management, Property 1: Bean Display Completeness
// Feature: bean-inventory-management, Property 2: Ownership Status Accuracy
```

### Test Categories

**Frontend Component Tests**:
- Bean list filtering and search functionality
- Navigation and routing behavior
- Rating interface interactions
- Status update controls

**Backend API Tests**:
- CRUD operations with proper permission enforcement
- Search and filtering logic
- Rating system operations
- Database schema validation

**Integration Tests**:
- End-to-end user workflows
- Cross-component data flow
- Permission enforcement across system boundaries
- Social signal generation and display

### Testing Focus Areas

**Core Functionality**:
- Bean discovery and browsing
- Bag inventory management
- Rating system accuracy
- Permission enforcement

**User Experience**:
- Search and filter responsiveness
- Navigation consistency
- Error message clarity
- Loading state management

**Data Integrity**:
- Rating calculation accuracy
- Ownership status consistency
- Inventory status transitions
- Social signal reliability

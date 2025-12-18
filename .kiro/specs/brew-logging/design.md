# Brew Logging Feature Design

## Overview

The brew logging feature is the core functionality of Espresso Engineered, enabling baristas to create, manage, and track espresso brew records. This feature implements a three-layer architecture with a SvelteKit frontend, Fastify backend API, and Supabase PostgreSQL database with Row Level Security.

The design prioritizes speed and minimal friction during the brewing moment while supporting detailed reflection afterward. The system supports offline-capable drafts that sync automatically and provides intelligent pre-filling from previous brews to minimize data entry.

## Architecture

### System Architecture

```
SvelteKit Frontend (Netlify)
    ↓ HTTP/REST API calls
Fastify Backend (Fly.io)
    ↓ PostgreSQL queries with RLS
Supabase Database (PostgreSQL + Auth)
```

### Component Interaction Flow

1. **Frontend (SvelteKit)**: Handles UI rendering, form validation, offline draft storage, and user interactions
2. **Backend (Fastify)**: Provides REST API endpoints, business logic, data validation, and calculated field generation
3. **Database (Supabase)**: Stores all brew data with RLS policies, handles authentication, and maintains referential integrity

### Authentication Flow

- Users authenticate through Supabase Auth (manages `auth.users` table)
- JWT tokens contain the `auth.users.id` which maps to `barista.id` via foreign key
- Frontend and Backend primarily work with the `barista` table for all application logic
- The `auth.users` table is only used by Supabase Auth for login/session management
- RLS policies and application queries reference `barista.id`, not `auth.users.id`
- Backend validates JWT tokens and resolves to barista records for all operations

## Components and Interfaces

### Frontend Components (SvelteKit)

#### BrewForm Component
- **Purpose**: Primary interface for creating and editing brews
- **Features**: 
  - Pre-fill from previous brew option
  - Inline entity creation (beans, bags, equipment)
  - Real-time validation and feedback
  - Offline draft storage
- **Props**: `brewId?: string`, `prefillFromLast?: boolean`
- **Events**: `on:save`, `on:draft`, `on:cancel`

#### BrewList Component
- **Purpose**: Display list of brews with filtering and sorting
- **Features**:
  - Chronological ordering
  - Draft vs completed brew filtering
  - Search and filter capabilities
- **Props**: `barista_id?: string`, `showDrafts?: boolean`

#### AwaitingReflection Component
- **Purpose**: Shows incomplete brews needing output data
- **Features**:
  - Quick completion interface
  - Batch operations for multiple drafts
- **Props**: `barista_id: string`

#### EntityCreation Components
- **InlineBeanCreator**: Quick bean creation during brew logging
- **InlineBagCreator**: Quick bag creation with bean association
- **InlineEquipmentCreator**: Quick grinder/machine creation

### Backend API Endpoints (Fastify)

**Authentication Pattern**: All API endpoints receive JWT tokens from Supabase Auth. The backend extracts the `auth.users.id` from the token and resolves it to the corresponding `barista.id` for all application logic. The `auth.users` table is never directly queried by application code.

#### Brew Management
- `POST /api/brews` - Create new brew
- `GET /api/brews` - List brews with filtering
- `GET /api/brews/:id` - Get specific brew
- `PUT /api/brews/:id` - Update brew
- `DELETE /api/brews/:id` - Delete brew
- `POST /api/brews/:id/complete` - Complete draft brew

#### Entity Management
- `GET /api/beans` - List available beans
- `POST /api/beans` - Create new bean
- `GET /api/bags` - List user's bags
- `POST /api/bags` - Create new bag
- `GET /api/grinders` - List available grinders
- `POST /api/grinders` - Create new grinder
- `GET /api/machines` - List available machines
- `POST /api/machines` - Create new machine
- `GET /api/roasters` - List available roasters
- `POST /api/roasters` - Create new roaster

#### Utility Endpoints
- `GET /api/brews/prefill` - Get data for pre-filling from last brew
- `POST /api/brews/batch-sync` - Sync multiple draft brews
- `GET /api/brews/drafts` - Get incomplete brews for reflection

## Data Models

### Core Database Schema

The system uses the existing Supabase schema with the following key tables:

#### Brew Table
```sql
Table brew {
  id uuid [pk]
  created_at timestamptz [default: now()]
  modified_at timestamptz [default: now()]
  barista_id uuid [ref: > barista.id, not null]
  machine_id uuid [ref: > machine.id, not null]
  grinder_id uuid [ref: > grinder.id, not null]
  bag_id uuid [ref: > bag.id, not null]
  name text
  dose_mg numeric [not null]
  yield_mg numeric [nullable]
  brew_time_ms numeric [nullable]
  grind_setting varchar [nullable]
  flow_rate_mg/s numeric [nullable, calculated]
  ratio_dec numeric [nullable, calculated]
  rating integer [nullable]
  tasting_notes text [nullable]
  reflections text [nullable]
}
```

#### Supporting Entity Tables
- **barista**: User profiles linked to auth.users
- **bean**: Global bean definitions with roast_level enum
- **bag**: User-owned bean inventory with weight_mg and roast_date
- **grinder**: Global grinder equipment with setting_guide_chart_url
- **machine**: Global espresso machine equipment
- **roaster**: Coffee roasting companies

### TypeScript Interfaces

#### Frontend Data Models
```typescript
interface Brew {
  id: string;
  created_at: string;
  modified_at: string;
  barista_id: string; // References barista.id, NOT auth.users.id
  machine_id: string;
  grinder_id: string;
  bag_id: string;
  name?: string;
  dose_mg: number;
  yield_mg?: number;
  brew_time_ms?: number;
  grind_setting?: string;
  flow_rate_mg_per_s?: number;
  ratio_dec?: number;
  rating?: number;
  tasting_notes?: string;
  reflections?: string;
}

interface Barista {
  id: string; // This is the primary key used throughout the app
  created_at: string;
  first_name: string;
  last_name: string;
  display_name: string;
  // Note: auth.users.id is handled by Supabase Auth, not exposed in app logic
}

interface BrewDraft extends Partial<Brew> {
  barista_id: string;
  machine_id: string;
  grinder_id: string;
  bag_id: string;
  dose_mg: number;
}

interface Bean {
  id: string;
  roaster_id: string;
  roast_level: 'Light' | 'Medium Light' | 'Medium' | 'Medium Dark' | 'Dark';
  country_of_origin?: string;
  tasting_notes?: string;
}

interface Bag {
  id: string;
  bean_id: string;
  owner_id: string; // References barista.id, NOT auth.users.id
  roast_date?: string;
  weight_mg?: number;
  price?: number;
  purchase_location?: string;
}
```

### Calculated Fields Logic

The system automatically calculates derived fields:

- **flow_rate_mg_per_s**: `yield_mg / (brew_time_ms / 1000)` when both values exist
- **ratio_dec**: `yield_mg / dose_mg` when both values exist

## Error Handling

### Frontend Error Handling
- **Network Errors**: Graceful degradation with offline draft storage
- **Validation Errors**: Real-time field validation with clear error messages
- **Authentication Errors**: Automatic redirect to login with return path
- **Server Errors**: User-friendly error messages with retry options

### Backend Error Handling
- **Database Errors**: Proper HTTP status codes with descriptive messages
- **Validation Errors**: Detailed field-level error responses
- **Authentication Errors**: JWT validation with appropriate 401/403 responses
- **Foreign Key Violations**: Clear messages about missing referenced entities

### Database Error Handling
- **RLS Policy Violations**: Proper access denied responses
- **Constraint Violations**: Meaningful error messages for unique/foreign key violations
- **Connection Issues**: Automatic retry logic with exponential backoff

## Testing Strategy

The testing approach combines unit tests for specific functionality with property-based tests for universal correctness properties.

### Unit Testing
- **Frontend Components**: Svelte Testing Library for component behavior
- **Backend Endpoints**: Fastify test framework for API functionality
- **Database Operations**: Supabase client testing with test database
- **Validation Logic**: Jest tests for input validation and calculated fields

### Property-Based Testing Framework
The system will use **fast-check** for JavaScript/TypeScript property-based testing, configured to run a minimum of 100 iterations per property test.

Each property-based test will be tagged with comments explicitly referencing the correctness property from this design document using the format: `**Feature: brew-logging, Property {number}: {property_text}**`

### Integration Testing
- **End-to-End Workflows**: Playwright tests for complete user journeys
- **API Integration**: Tests covering frontend-backend-database interactions
- **Offline Sync**: Tests for draft creation and synchronization scenarios

### Test Data Management
- **Test Fixtures**: Predefined test data for consistent testing
- **Database Seeding**: Automated test data setup and teardown
- **Mock Services**: Mocked external dependencies for isolated testing

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis and property reflection to eliminate redundancy, the following correctness properties ensure the brew logging system behaves correctly across all valid inputs and scenarios:

### Property 1: Pre-fill Data Consistency
*For any* barista with existing brews, when pre-fill is accepted during new brew creation, the system should copy exactly the fields bag_id, machine_id, grinder_id, grind_setting, and dose_mg from the most recent brew
**Validates: Requirements 1.2**

### Property 2: Input Validation and Error Handling
*For any* API request or form submission, when required fields are missing or invalid, the system should reject the request with appropriate error messages and suggest corrections or data from previous brews
**Validates: Requirements 1.4, 7.2, 7.3**

### Property 3: Data Persistence and Integrity
*For any* valid brew data (containing required fields barista_id, machine_id, grinder_id, bag_id, dose_mg), when saved to the system, the data should be immediately persisted to the database and remain consistent across all subsequent retrievals
**Validates: Requirements 1.3, 5.1, 5.4**

### Property 4: Draft State Management
*For any* brew created with only input parameters, the system should save it with null values for all output fields (yield_mg, rating, tasting_notes, reflections) and display it in the "Awaiting Reflection" section
**Validates: Requirements 2.1, 2.2**

### Property 5: Calculated Field Accuracy
*For any* brew with valid yield_mg, dose_mg, and brew_time_ms values, when output fields are updated, the system should automatically calculate flow_rate_mg/s as (yield_mg / (brew_time_ms / 1000)) and ratio_dec as (yield_mg / dose_mg)
**Validates: Requirements 2.4**

### Property 6: Offline Synchronization Consistency
*For any* draft data created while offline, when connectivity is restored, the system should sync all pending changes to the server without data loss and maintain consistency across all devices
**Validates: Requirements 2.5, 5.2, 5.3**

### Property 7: Access Control Enforcement
*For any* data access attempt, the system should enforce that baristas can only view and modify their own bags and brews, while allowing read access to global entities (beans, grinders, machines, roasters) for all authenticated users, and providing full access to administrators
**Validates: Requirements 4.3, 4.4, 6.1, 9.2, 9.3**

### Property 8: Entity Creation and Association
*For any* entity creation (bean, bag, grinder, machine, roaster), the system should create the record with proper foreign key associations, make global entities available to all users, and set correct ownership for user-specific entities
**Validates: Requirements 3.2, 3.3, 3.4**

### Property 9: Referential Integrity Maintenance
*For any* deletion attempt on referenced entities, the system should prevent deletion when foreign key constraints would be violated and maintain referential integrity across all database operations
**Validates: Requirements 6.3, 6.5, 9.4**

### Property 10: Authentication and Authorization Consistency
*For any* API endpoint or database operation, the system should require valid authentication tokens, enforce Row Level Security policies, and return appropriate HTTP status codes for unauthorized access attempts
**Validates: Requirements 7.5, 9.1, 9.5**

### Property 11: User Interface Feedback Consistency
*For any* user action (form submission, navigation, data modification), the system should provide immediate visual feedback indicating success, failure, or validation errors with clear and actionable messages
**Validates: Requirements 8.2, 8.5**

### Property 12: Chronological Ordering Consistency
*For any* brew list display, the system should order brews chronologically by created_at timestamp and display all required fields (inputs, outputs, reflections) when viewing individual brew details
**Validates: Requirements 4.1, 4.2**
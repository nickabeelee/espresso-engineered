# Backend API Foundation Implementation

## Overview
This document describes the implementation of the backend API foundation for the Espresso Engineered brew logging feature (Task 2).

## Implemented Components

### 1. Fastify Server Setup (`src/index.ts`)
- Configured Fastify server with logging
- Registered CORS middleware for frontend communication
- Set up global error handler
- Created health check and API info endpoints
- Configured for deployment on Fly.io

### 2. Authentication Middleware (`src/middleware/auth.ts`)
- **JWT Token Validation**: Validates Supabase JWT tokens from Authorization headers
- **Barista Resolution**: Resolves `auth.users.id` from JWT to `barista` records
- **Request Enhancement**: Attaches authenticated barista data to requests
- **Optional Authentication**: Supports endpoints that work with or without authentication
- **Error Handling**: Proper 401/404 responses for authentication failures

Key Features:
- Extracts Bearer tokens from Authorization headers
- Validates tokens with Supabase Auth
- Resolves to barista profiles for application logic
- Supports both required and optional authentication patterns

### 3. Error Handling Middleware (`src/middleware/error.ts`)
- **Global Error Handler**: Centralized error handling for all endpoints
- **Custom Error Classes**: ValidationError, NotFoundError, ForbiddenError, ConflictError
- **HTTP Status Codes**: Proper status codes for different error types
- **Zod Integration**: Special handling for validation errors with field details
- **Database Errors**: Handles PostgreSQL constraint violations and RLS policy errors
- **Environment-Aware**: Different error messages for production vs development

Supported Error Types:
- 400 Bad Request (validation errors, invalid input)
- 401 Unauthorized (authentication failures)
- 403 Forbidden (RLS policy violations)
- 404 Not Found (resource not found)
- 409 Conflict (duplicate keys)
- 500 Internal Server Error (unexpected errors)

### 4. Database Connection Utilities (`src/config/database.ts`)
- **Connection Testing**: Verifies database connectivity on startup
- **RLS Verification**: Checks Row Level Security policies
- **Query Execution**: Helper functions for consistent error handling
- **Batch Operations**: Support for multiple operations with rollback logic
- **Initialization**: Database setup and verification on server start

### 5. Supabase Configuration (`src/config/supabase.ts`)
- Service role key configuration for backend operations
- JWT payload type definitions
- Barista resolution helper function
- Proper authentication context management

### 6. Base Repository Pattern (`src/repositories/base.ts`)
- **Generic CRUD Operations**: findById, findMany, create, update, delete, count
- **RLS Enforcement**: Automatic barista filtering for user-owned tables
- **Error Handling**: Consistent error responses with custom error classes
- **Flexible Filtering**: Support for complex query filters
- **Ownership Management**: Automatic owner_id assignment for user-owned resources
- **Timestamp Management**: Automatic modified_at updates

Key Features:
- Abstract base class for all repositories
- Configurable for user-owned vs global tables
- Proper foreign key constraint handling
- Consistent error messages and status codes

### 7. Brew Repository (`src/repositories/brew.ts`)
- **Calculated Fields**: Automatic calculation of flow_rate_g_per_s and ratio
- **Draft Management**: Support for incomplete brews (drafts)
- **Prefill Data**: Retrieves data from most recent brew for quick entry
- **Advanced Filtering**: Complex queries with multiple filter criteria
- **Draft Completion**: Special endpoint for completing draft brews

Calculated Fields:
- `flow_rate_g_per_s = yield_g / (brew_time_s / 1000)`
- `ratio = yield_g / dose_g`

### 8. Validation Schemas (`src/validation/schemas.ts`)
- **Zod Integration**: Type-safe validation using Zod
- **Brew Validation**: Complete validation for brew creation and updates
- **Entity Validation**: Schemas for beans, bags, grinders, machines, roasters
- **Query Validation**: Filters and pagination parameters
- **Batch Operations**: Validation for batch sync operations

Validation Features:
- UUID format validation
- Positive number constraints
- Rating bounds (1-10)
- String length limits
- Enum validation (roast levels)
- Optional field handling

### 9. Type Definitions (`src/types/index.ts`)
- Complete TypeScript interfaces for all data models
- Request/response types for API endpoints
- Filter and pagination types
- Shared types between frontend and backend

## Architecture Decisions

### Authentication Flow
1. Frontend sends JWT token in Authorization header
2. Backend validates token with Supabase Auth
3. Extracts `auth.users.id` from token
4. Resolves to `barista` record for application logic
5. All queries use `barista.id`, not `auth.users.id`

### Repository Pattern
- Separates data access logic from business logic
- Provides consistent interface for all database operations
- Enforces RLS policies at the repository level
- Supports both user-owned and global resources

### Error Handling Strategy
- Custom error classes with status codes
- Centralized error handler for consistency
- Detailed validation errors with field information
- Environment-aware error messages

### Validation Strategy
- Schema validation at API boundary
- Type-safe validation with Zod
- Reusable validation schemas
- Clear error messages for invalid input

## Testing

### Validation Tests (`src/test-validation.ts`)
- Valid and invalid brew data
- UUID format validation
- Negative number rejection
- Bean data validation
- Roast level enum validation
- Rating bounds checking

### Server Tests (`src/test-server.ts`)
- Server startup and shutdown
- Health endpoint functionality
- API info endpoint
- CORS configuration

### Error Handling Tests (`src/test-error-handling.ts`)
- ValidationError (400)
- NotFoundError (404)
- ForbiddenError (403)
- ConflictError (409)
- ZodError with details (400)
- Generic errors (500)

### Complete Foundation Tests (`src/test-complete.ts`)
- All validation scenarios
- Error class behavior
- Calculated fields logic
- Authentication token handling
- Data model validation

All tests pass successfully! ✅

## Requirements Validation

This implementation satisfies the following requirements from the design document:

- **Requirement 7.1**: RESTful API endpoints foundation ✓
- **Requirement 7.3**: Error handling with proper HTTP status codes ✓
- **Requirement 9.1**: Row Level Security policy enforcement ✓
- **Requirement 9.5**: Authentication and authorization for all endpoints ✓

## Next Steps

The backend API foundation is now complete and ready for:
1. Implementing specific API endpoints (Task 3: Core entity management)
2. Implementing brew management endpoints (Task 4: Brew management)
3. Adding property-based tests for correctness properties
4. Integration with frontend SvelteKit application

## File Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts          # Database utilities and RLS verification
│   │   └── supabase.ts          # Supabase client configuration
│   ├── middleware/
│   │   ├── auth.ts              # JWT authentication middleware
│   │   └── error.ts             # Global error handler
│   ├── repositories/
│   │   ├── base.ts              # Base repository pattern
│   │   ├── brew.ts              # Brew-specific repository
│   │   └── index.ts             # Repository exports
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   ├── validation/
│   │   └── schemas.ts           # Zod validation schemas
│   ├── index.ts                 # Main server entry point
│   ├── test-validation.ts       # Validation tests
│   ├── test-server.ts           # Server tests
│   ├── test-error-handling.ts   # Error handling tests
│   └── test-complete.ts         # Complete foundation tests
├── package.json
├── tsconfig.json
└── README-IMPLEMENTATION.md     # This file
```

## Build and Run

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run validation tests
npx tsx src/test-validation.ts

# Run server tests
npx tsx src/test-server.ts

# Run error handling tests
npx tsx src/test-error-handling.ts

# Run complete tests
npx tsx src/test-complete.ts

# Build for production
npm run build

# Start development server
npm run dev

# Start production server
npm start
```

## Environment Variables Required

```env
# Supabase Configuration
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server Configuration
PORT=8080
HOST=0.0.0.0
NODE_ENV=production
LOG_LEVEL=info

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173
```
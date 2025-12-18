# Requirements Document

## Introduction

The brew logging feature enables baristas to create, manage, and track espresso brew records within the Espresso Engineered system. This feature serves as the foundation for capturing structured brew data that supports community learning and future intelligent suggestions. The system prioritizes speed and minimal friction during the brewing moment while allowing for detailed reflection afterward.

## Glossary

- **Barista**: A registered user profile (barista table) mapped 1:1 with Supabase auth.users who logs and shares espresso brews
- **Brew**: A record (brew table) representing a single espresso extraction with input parameters, output measurements, and optional reflections
- **Draft_Brew**: A brew record that contains required inputs but may be missing output measurements like yield_mg, rating, or reflections
- **Bean**: A communal roast definition (bean table) from a roaster, shared globally across all users with roast_level and tasting_notes
- **Bag**: A user-owned inventory record (bag table) representing a specific purchase of beans with roast_date, weight_mg, and price
- **Grinder**: Coffee grinding equipment record (grinder table) shared globally with manufacturer details and setting_guide_chart_url
- **Machine**: Espresso machine equipment record (machine table) shared globally with manufacturer details and user_manual_link
- **Roaster**: A coffee roasting company record (roaster table) that produces beans with name and website_url
- **Brew_System**: The backend Fastify API and frontend SvelteKit interface that manages brew operations
- **Auth_User**: Supabase authentication user record (auth.users) that maps to barista profiles via foreign key
- **Roast_Levels**: Enum defining coffee roast levels (Light, Medium Light, Medium, Medium Dark, Dark)

## Requirements

### Requirement 1

**User Story:** As a barista, I want to quickly create a new brew record during my brewing session, so that I can capture my brewing parameters without disrupting my workflow.

#### Acceptance Criteria

1. WHEN a barista initiates brew creation, THE Brew_System SHALL offer to pre-fill inputs from the most recent brew record
2. WHEN a barista accepts pre-filling, THE Brew_System SHALL populate bag_id, machine_id, grinder_id, grind_setting, dose_mg, and current timestamp in the brew table
3. WHEN a barista enters required brew inputs (barista_id, machine_id, grinder_id, bag_id, dose_mg), THE Brew_System SHALL save the record immediately
4. WHEN a barista saves a brew with missing required foreign key references, THE Brew_System SHALL prompt for the missing data or offer to pull from previous brews
5. THE Brew_System SHALL complete brew creation in under 60 seconds from initiation

### Requirement 2

**User Story:** As a barista, I want to manage my brew drafts and complete them later, so that I can focus on brewing in the moment and add reflections afterward.

#### Acceptance Criteria

1. WHEN a barista creates a brew with only input parameters (dose_mg, grind_setting), THE Brew_System SHALL save it with null values for yield_mg, rating, tasting_notes, and reflections
2. WHEN a barista has brews with missing output data, THE Brew_System SHALL display them in an "Awaiting Reflection" section
3. WHEN a barista opens an incomplete brew, THE Brew_System SHALL allow completion of yield_mg, brew_time_ms, rating, tasting_notes, and reflections fields
4. WHEN a barista updates brew output fields, THE Brew_System SHALL calculate and store flow_rate_mg/s and ratio_dec automatically
5. WHEN draft data exists, THE Brew_System SHALL sync it to the brew table immediately when connectivity is available

### Requirement 3

**User Story:** As a barista, I want to create and reference brewing equipment and coffee beans, so that I can accurately track the components used in my brews.

#### Acceptance Criteria

1. WHEN a barista needs to add a new bean during brew creation, THE Brew_System SHALL allow inline creation of bean records with roaster_id association without navigation to separate forms
2. WHEN a barista creates a new bag, THE Brew_System SHALL associate it with an existing or newly created bean_id and set the barista as owner_id
3. WHEN a barista adds equipment (grinder or machine), THE Brew_System SHALL create global records in grinder or machine tables available for all users
4. WHEN a barista creates a roaster, THE Brew_System SHALL create a roaster record with name and website_url available for bean associations
5. THE Brew_System SHALL support image_path storage for grinder and machine records and validate image uploads

### Requirement 4

**User Story:** As a barista, I want to view and edit my brew records, so that I can review my brewing history and make corrections when needed.

#### Acceptance Criteria

1. WHEN a barista views their brew list, THE Brew_System SHALL display brews in chronological order with key parameters visible
2. WHEN a barista selects a brew, THE Brew_System SHALL display all brew details including inputs, outputs, and reflections
3. WHEN a barista owns a brew, THE Brew_System SHALL allow editing of all brew fields
4. WHEN a barista does not own a brew, THE Brew_System SHALL prevent editing access
5. WHEN a barista deletes a brew, THE Brew_System SHALL remove it permanently after confirmation

### Requirement 5

**User Story:** As a barista, I want my brew data to be stored reliably and sync across devices, so that I can access my brewing history from anywhere.

#### Acceptance Criteria

1. WHEN a barista creates or modifies brew data, THE Brew_System SHALL persist it to the database immediately
2. WHEN a barista loses connectivity during brew creation, THE Brew_System SHALL maintain draft data locally until sync is possible
3. WHEN connectivity is restored, THE Brew_System SHALL automatically sync all pending changes to the server
4. WHEN a barista accesses the system from different devices, THE Brew_System SHALL display consistent brew data across all devices
5. THE Brew_System SHALL ensure data integrity during offline-online synchronization

### Requirement 6

**User Story:** As a system administrator, I want to manage all brew-related entities, so that I can maintain data quality and moderate inappropriate content.

#### Acceptance Criteria

1. WHEN an administrator accesses the admin portal, THE Brew_System SHALL provide full CRUD access to all brew records regardless of barista_id ownership
2. WHEN an administrator modifies any entity, THE Brew_System SHALL validate the action against Row Level Security policies
3. WHEN an administrator deletes inappropriate content, THE Brew_System SHALL remove it immediately while maintaining referential integrity
4. THE Brew_System SHALL allow administrators to edit or delete records in bean, bag, grinder, machine, and roaster tables
5. THE Brew_System SHALL maintain foreign key constraints and prevent deletion of referenced entities without proper cascade handling

### Requirement 7

**User Story:** As a developer, I want a clean API interface for brew operations, so that the frontend can efficiently manage brew data and provide a responsive user experience.

#### Acceptance Criteria

1. THE Brew_System SHALL provide RESTful API endpoints for all brew CRUD operations
2. WHEN API requests are made, THE Brew_System SHALL validate input data against defined schemas
3. WHEN API operations fail, THE Brew_System SHALL return appropriate HTTP status codes and error messages
4. THE Brew_System SHALL support batch operations for efficient data synchronization
5. THE Brew_System SHALL implement proper authentication and authorization for all API endpoints

### Requirement 8

**User Story:** As a barista, I want a responsive and intuitive interface for brew management, so that I can efficiently log and review my brewing data.

#### Acceptance Criteria

1. WHEN a barista accesses the brew interface, THE Brew_System SHALL display a clean, fast-loading user interface
2. WHEN a barista interacts with forms, THE Brew_System SHALL provide immediate feedback and validation
3. WHEN a barista navigates between brew records, THE Brew_System SHALL maintain smooth transitions and quick load times
4. THE Brew_System SHALL optimize the interface for both desktop and mobile brewing workflows
5. WHEN a barista performs actions, THE Brew_System SHALL provide clear visual confirmation of success or failure states

### Requirement 9

**User Story:** As a system architect, I want proper data security and access control, so that user data is protected and the system maintains data integrity.

#### Acceptance Criteria

1. WHEN any database operation occurs, THE Brew_System SHALL enforce Row Level Security policies on all tables
2. WHEN a barista accesses data, THE Brew_System SHALL ensure they can only view and modify their own bags and brews
3. WHEN global entities (beans, grinders, machines, roasters) are accessed, THE Brew_System SHALL allow read access to all authenticated users
4. WHEN foreign key relationships are established, THE Brew_System SHALL validate referential integrity before committing transactions
5. THE Brew_System SHALL use proper authentication tokens for all database operations and API calls
# Requirements Document

## Introduction

The Bean Inventory Management feature enables baristas to manage their personal coffee bean collections while discovering and exploring beans from the broader community. This feature transforms the existing bean and bag data model into a comprehensive inventory management system that balances personal ownership with community discovery.

## Glossary

- **Bean**: A shared reference entity representing a specific roast from a roaster (e.g., "Blue Bottle Hayes Valley Espresso")
- **Bag**: A personal, time-bound instance of a bean owned by a specific barista
- **Roaster**: A shared reference entity representing a coffee roasting company
- **Barista**: The authenticated user managing their bean inventory
- **Inventory_Status**: An enumerated field indicating the current state of a bag (unopened, plenty, getting_low, empty)
- **Bean_Inventory_System**: The complete system for managing beans, bags, and roasters

## Requirements

### Requirement 1: Navigation and Access

**User Story:** As a barista, I want to access bean inventory management from the main navigation, so that I can quickly manage my coffee collection.

#### Acceptance Criteria

1. WHEN a barista views the main navigation, THE Bean_Inventory_System SHALL display a "Beans" navigation item positioned before the Equipment section
2. WHEN a barista clicks the "Beans" navigation item, THE Bean_Inventory_System SHALL navigate to the Beans Index page
3. THE Bean_Inventory_System SHALL maintain consistent navigation patterns with existing application sections

### Requirement 2: Bean Discovery and Browsing

**User Story:** As a barista, I want to browse all available beans with clear ownership indicators, so that I can discover new beans while easily identifying my own collection.

#### Acceptance Criteria

1. WHEN a barista views the Beans Index, THE Bean_Inventory_System SHALL display all beans in the system
2. WHEN displaying beans, THE Bean_Inventory_System SHALL visually distinguish beans owned by the current barista from other beans
3. WHEN displaying beans, THE Bean_Inventory_System SHALL show aggregate statistics including average rating and total brews
4. WHEN displaying beans, THE Bean_Inventory_System SHALL show ownership indicators (owned, previously owned, never owned)
5. WHEN displaying beans, THE Bean_Inventory_System SHALL show a "most used by me" indicator for frequently used beans

### Requirement 3: Bean Filtering and Search

**User Story:** As a barista, I want to filter and search beans by various criteria, so that I can quickly find specific beans or discover beans with particular characteristics.

#### Acceptance Criteria

1. WHEN a barista uses the filter controls, THE Bean_Inventory_System SHALL filter beans by roaster
2. WHEN a barista uses the filter controls, THE Bean_Inventory_System SHALL filter beans by roast level
3. WHEN a barista uses the search functionality, THE Bean_Inventory_System SHALL search across bean names, tasting notes, and descriptive fields
4. WHEN multiple filters are applied, THE Bean_Inventory_System SHALL combine filters using logical AND operations
5. WHEN search and filters are combined, THE Bean_Inventory_System SHALL apply both criteria simultaneously
6. WHEN a barista uses the "My Beans" toggle filter, THE Bean_Inventory_System SHALL show only beans owned or previously owned by the current barista
7. THE Bean_Inventory_System SHALL provide a "My Beans" toggle button similar to the "My Brews" filter pattern in the brew list page

### Requirement 4: Bean Detail Information

**User Story:** As a barista, I want to view comprehensive details about a specific bean, so that I can make informed decisions about brewing and purchasing.

#### Acceptance Criteria

1. WHEN a barista selects a bean, THE Bean_Inventory_System SHALL navigate to a dedicated Bean Detail page
2. WHEN displaying bean details, THE Bean_Inventory_System SHALL show complete bean information including name, roaster, roast level, tasting notes, and origin
3. WHEN displaying bean details, THE Bean_Inventory_System SHALL show aggregate statistics including average rating and total brews
4. WHEN displaying bean details, THE Bean_Inventory_System SHALL show recent activity by other baristas
5. WHEN displaying bean details, THE Bean_Inventory_System SHALL list all associated bags with clear ownership indicators

### Requirement 5: Bag Status Management

**User Story:** As a barista, I want to track the status of my coffee bags using qualitative indicators, so that I can manage my inventory without precise weight calculations.

#### Acceptance Criteria

1. WHEN creating or editing a bag, THE Bean_Inventory_System SHALL provide an inventory_status field with enumerated values
2. THE Bean_Inventory_System SHALL support inventory_status values: unopened, plenty, getting_low, empty
3. WHEN displaying bags, THE Bean_Inventory_System SHALL show the current inventory_status
4. WHEN updating bag status, THE Bean_Inventory_System SHALL provide quick update controls without requiring full form navigation
5. THE Bean_Inventory_System SHALL remove all weight-based calculations and displays in favor of status-based tracking

### Requirement 6: Bean and Roaster Management

**User Story:** As a barista, I want to create and edit bean and roaster information, so that I can contribute to the community database and ensure accurate information.

#### Acceptance Criteria

1. WHEN creating beans, THE Bean_Inventory_System SHALL allow any authenticated barista to create new bean records
2. WHEN editing beans, THE Bean_Inventory_System SHALL allow any authenticated barista to edit existing bean records
3. WHEN creating roasters, THE Bean_Inventory_System SHALL allow any authenticated barista to create new roaster records
4. WHEN editing roasters, THE Bean_Inventory_System SHALL allow any authenticated barista to edit existing roaster records
5. WHEN attempting to delete beans or roasters, THE Bean_Inventory_System SHALL restrict deletion to admin users only

### Requirement 7: Bag Ownership and Permissions

**User Story:** As a barista, I want to manage my own bags while viewing others' bags for reference, so that I can maintain my inventory while learning from the community.

#### Acceptance Criteria

1. WHEN viewing bags, THE Bean_Inventory_System SHALL display all bags for community visibility
2. WHEN creating bags, THE Bean_Inventory_System SHALL allow any authenticated barista to create new bag records
3. WHEN editing bags, THE Bean_Inventory_System SHALL restrict editing to the bag owner and admin users
4. WHEN deleting bags, THE Bean_Inventory_System SHALL restrict deletion to the bag owner and admin users
5. WHEN displaying bags, THE Bean_Inventory_System SHALL clearly indicate ownership and edit permissions

### Requirement 8: Social Context and Discovery

**User Story:** As a barista, I want to see subtle social signals about bean usage, so that I can discover popular beans and learn from community activity without feeling competitive pressure.

#### Acceptance Criteria

1. WHEN displaying beans, THE Bean_Inventory_System SHALL show ambient social signals such as recent usage by other baristas
2. WHEN displaying social signals, THE Bean_Inventory_System SHALL present them as secondary metadata that doesn't compete with personal ownership indicators
3. WHEN displaying social signals, THE Bean_Inventory_System SHALL avoid competitive or gamified presentations
4. WHEN displaying social signals, THE Bean_Inventory_System SHALL focus on discovery and curiosity rather than persuasion
5. THE Bean_Inventory_System SHALL maintain visual restraint in social features to preserve the personal inventory focus

### Requirement 9: Component Reuse and UI Consistency

**User Story:** As a barista, I want the bean inventory interface to feel consistent with the rest of the application, so that I can navigate efficiently using familiar patterns.

#### Acceptance Criteria

1. WHEN implementing UI components, THE Bean_Inventory_System SHALL reuse existing components including icon buttons, chips, and list cards
2. WHEN implementing layouts, THE Bean_Inventory_System SHALL follow hierarchy guidance from the system definition document
3. WHEN implementing "most used by me" indicators, THE Bean_Inventory_System SHALL reuse patterns from the Equipment section
4. WHEN implementing visual distinctions, THE Bean_Inventory_System SHALL maintain consistency with existing design patterns
5. THE Bean_Inventory_System SHALL avoid creating dashboard-like interfaces that compete with the main application structure

### Requirement 10: Bean Rating System

**User Story:** As a barista, I want to rate beans on a 5-star scale, so that I can track my personal preferences and see how beans compare in my collection.

#### Acceptance Criteria

1. WHEN viewing or editing bean information, THE Bean_Inventory_System SHALL provide a 5-star rating interface for baristas to rate beans
2. WHEN displaying beans in lists and cards, THE Bean_Inventory_System SHALL prominently show the barista's personal rating for beans they have rated
3. WHEN displaying beans the barista hasn't rated, THE Bean_Inventory_System SHALL show an unrated state or community average rating
4. WHEN calculating aggregate statistics, THE Bean_Inventory_System SHALL include both personal ratings and community average ratings
5. THE Bean_Inventory_System SHALL store individual barista ratings separately from aggregate community ratings

### Requirement 11: Data Migration and Schema Updates

**User Story:** As a system administrator, I want the inventory status field to be properly implemented in the database schema, so that the feature functions correctly and can be extended in the future.

#### Acceptance Criteria

1. WHEN implementing the inventory_status field, THE Bean_Inventory_System SHALL add the field to the bag table schema
2. WHEN implementing the inventory_status field, THE Bean_Inventory_System SHALL use an enumerated type or equivalent abstraction
3. WHEN implementing the inventory_status field, THE Bean_Inventory_System SHALL allow for future status additions with minimal migration complexity
4. WHEN migrating existing data, THE Bean_Inventory_System SHALL handle existing bags gracefully with appropriate default status values
5. THE Bean_Inventory_System SHALL remove weight-based tracking features from the user interface and backend logic
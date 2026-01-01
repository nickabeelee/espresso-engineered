# Requirements Document

## Introduction

The Home Page Dashboard feature transforms the default landing experience from the current brews page to a comprehensive, contextually-aware dashboard. This dashboard provides baristas with immediate access to their bean inventory, recent brewing activity, and analytical insights through animated, interactive components powered by GSAP animations and D3 visualizations.

## Glossary

- **Barista**: A user of the Espresso Engineered application
- **Bean_Inventory_System**: The component managing user's current bean stock
- **Week_in_Brewing_System**: The component displaying recent community brewing activity
- **Bean_Analysis_System**: The component providing scatter plot analytics
- **Navigation_System**: The routing and navigation infrastructure
- **GSAP_Framework**: The animation library integration within the UI framework
- **Voice_System**: The contextual greeting and messaging system
- **Bag**: A time-bound instance of beans owned by a user
- **Brew_Card**: An existing component for displaying brew information
- **Editable_Bag_Card**: An existing component for managing bag information

## Requirements

### Requirement 1: Navigation and Default Landing

**User Story:** As a barista, I want the home page to be my default landing destination, so that I can quickly access my brewing context and community activity.

#### Acceptance Criteria

1. WHEN a barista logs into the application, THE Navigation_System SHALL redirect them to the home page dashboard
2. WHEN a barista clicks the logo or title in the header, THE Navigation_System SHALL navigate them to the home page dashboard
3. WHEN a barista is on any page, THE Navigation_System SHALL provide a "Go back home" link or button
4. THE Navigation_System SHALL update all existing routes and redirects to make the home page the default destination
5. WHEN navigation occurs to the home page, THE Navigation_System SHALL maintain proper browser history and back button functionality

### Requirement 2: GSAP Animation Framework Integration

**User Story:** As a developer, I want GSAP integrated into the UI framework, so that components can inherit consistent animation configurations.

#### Acceptance Criteria

1. THE GSAP_Framework SHALL be installed in the frontend application if not already present
2. THE GSAP_Framework SHALL be integrated into the existing UI framework architecture
3. WHEN components need animations, THE GSAP_Framework SHALL provide inherited animation configurations
4. THE GSAP_Framework SHALL follow animation principles defined in the ee-ui-execution-standard.md
5. THE GSAP_Framework SHALL support component-level and page-level animation controls

### Requirement 3: Contextual Voice Greeting

**User Story:** As a barista, I want to receive a relevant and contextually aware greeting, so that I feel welcomed and informed about my brewing context.

#### Acceptance Criteria

1. WHEN the home page loads, THE Voice_System SHALL display a contextually aware greeting
2. THE Voice_System SHALL follow voice text specifications from ee-ui-execution-standard.md
3. THE Voice_System SHALL use Libre Baskerville font with text.ink.muted color
4. THE Voice_System SHALL never apply italic font styling
5. THE Voice_System SHALL provide different greetings based on user context and time of day

### Requirement 4: Bean Inventory Management Section

**User Story:** As a barista, I want to easily see and manage my current bean inventory, so that I can quickly update bag statuses and see what's available for brewing.

#### Acceptance Criteria

1. THE Bean_Inventory_System SHALL display bags in a single, horizontally navigable row
2. THE Bean_Inventory_System SHALL sort bags by date last used
3. THE Bean_Inventory_System SHALL show only non-empty bags or bags emptied within the current week
4. THE Bean_Inventory_System SHALL use existing editable bag card components
5. WHEN a bag status changes to empty, THE Bean_Inventory_System SHALL record the emptied_on_date
6. THE Bean_Inventory_System SHALL provide horizontal navigation controls for the bag list
7. THE Bean_Inventory_System SHALL integrate with existing bag management best practices from the Bean Detail page

### Requirement 5: Week in Brewing Community Activity

**User Story:** As a barista, I want to see what other baristas are brewing this week, so that I can discover new approaches and stay connected with the community.

#### Acceptance Criteria

1. THE Week_in_Brewing_System SHALL display brews from the current week starting Monday
2. THE Week_in_Brewing_System SHALL use existing brew card components in a horizontally scrollable layout
3. WHEN multiple brews share the same barista and bean, THE Week_in_Brewing_System SHALL stack them into layered card groups
4. THE Week_in_Brewing_System SHALL provide navigation through layered brew cards within a group
5. THE Week_in_Brewing_System SHALL provide horizontal navigation between different brew card groups
6. THE Week_in_Brewing_System SHALL use GSAP animations for card transitions and interactions
7. THE Week_in_Brewing_System SHALL allow navigation to individual brew details

### Requirement 6: Bean Analysis Visualization System

**User Story:** As a barista, I want to analyze the relationship between ratings, ratios, and brew times for my beans, so that I can optimize my brewing technique.

#### Acceptance Criteria

1. THE Bean_Analysis_System SHALL provide bean and bag selector controls that default to the user's last used bag
2. THE Bean_Analysis_System SHALL display two identical scatter plot charts: rating vs ratio and rating vs brew time
3. THE Bean_Analysis_System SHALL use D3 for chart implementation within the UI framework's viz components
4. WHEN a single bag is selected, THE Bean_Analysis_System SHALL show data points for that bag only
5. WHEN a bean is selected without a specific bag, THE Bean_Analysis_System SHALL differentiate between bags using visual channels
6. THE Bean_Analysis_System SHALL align vertical axes between the two charts
7. THE Bean_Analysis_System SHALL omit vertical axis labels as users focus on relative high and low points
8. THE Bean_Analysis_System SHALL provide a recency filter with options: 2D (2 days), W (week), M (month), 3M (3 months), Y (year)
9. THE Bean_Analysis_System SHALL use a control format similar to the machine/grinder selector from the equipment page
10. WHEN no applicable data exists, THE Bean_Analysis_System SHALL display a clear message via the Voice_System

### Requirement 7: Database Schema Extensions

**User Story:** As a system administrator, I want proper data tracking for bag lifecycle events, so that inventory management features work correctly.

#### Acceptance Criteria

1. WHEN a bag status changes to empty, THE system SHALL record the emptied_on_date timestamp
2. THE system SHALL update Supabase database schema to include emptied_on_date field
3. THE system SHALL update relevant API routes to handle the emptied_on_date field
4. THE system SHALL update TypeScript schemas to include the new field
5. THE system SHALL maintain backward compatibility with existing bag records

### Requirement 8: Backend API Extensions

**User Story:** As a frontend developer, I want efficient API endpoints for brew data retrieval, so that the analysis charts load quickly.

#### Acceptance Criteria

1. THE system SHALL provide Fastify endpoints for retrieving brew data filtered by bean and bag
2. THE system SHALL optimize brew data queries for chart rendering performance
3. THE system SHALL support filtering brew data by recency periods
4. THE system SHALL return brew data in a format optimized for D3 scatter plot rendering
5. THE system SHALL handle cases where no brew data exists for the selected filters

### Requirement 9: D3 Integration and Chart Implementation

**User Story:** As a barista, I want interactive and visually appealing charts, so that I can easily understand my brewing patterns.

#### Acceptance Criteria

1. THE system SHALL install D3 library if not already present
2. THE Bean_Analysis_System SHALL implement scatter plots using D3 within the UI framework's viz system
3. THE charts SHALL render individual brews as interactive data points
4. THE charts SHALL handle responsive design for different screen sizes
5. THE charts SHALL provide hover interactions for data point details
6. THE charts SHALL use consistent styling from the UI framework's viz palette and theme
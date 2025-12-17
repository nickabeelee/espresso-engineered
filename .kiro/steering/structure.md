# Project Structure

## Repository Organization
This is a monorepo containing documentation and will expand to include frontend and backend applications.

## Current Structure
```
/
├── .git/                 # Git repository
├── .kiro/               # Kiro AI assistant configuration
│   └── steering/        # AI guidance documents
├── .vscode/             # VS Code workspace settings
├── docs/                # Project documentation
│   ├── ee-architecture-v1.md      # System architecture spec
│   ├── ee-data-model-v1.md        # Database schema and relationships
│   └── ee-system-definition-document-v1.md  # Detailed system requirements
└── README.md            # MVP goals and scope definition
```

## Planned Structure (Future)
Based on the architecture, the project will expand to include:

```
/
├── frontend/            # SvelteKit application
│   ├── src/
│   ├── static/
│   └── package.json
├── backend/             # Node.js/Fastify API
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── shared/              # Shared TypeScript types and utilities
└── supabase/           # Database migrations and schemas
    ├── migrations/
    └── seed.sql
```

## Data Model Structure
The system is built around these core entities:

### Community-Shared Entities
- **Beans** - Named roasts from suppliers (global)
- **Bags** - Time-bound instances of beans (user-owned)
- **Grinders** - Coffee grinder equipment (global)
- **Machines** - Espresso machine equipment (global)
- **Roasters** - Coffee roasting companies (global)

### User-Generated Records
- **Baristas** - User profiles (1:1 with auth users)
- **Brews** - Primary record type for espresso extractions
- **Brew Interactions** - Likes and comments on brews
- **Brew Comparisons** - Explicit pairwise brew comparisons
- **Grinder Suggestions** - Community-driven grind recommendations

### System Tables
- **Admin Action Log** - Audit trail for admin actions

## Key Conventions
- All database tables use Row Level Security (RLS)
- TypeScript throughout the stack
- Public-by-default content model
- Offline-capable drafts that sync online
- Inline entity creation (avoid separate forms)
- Community-shared equipment database
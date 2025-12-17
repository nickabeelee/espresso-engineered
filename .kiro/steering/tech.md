# Technology Stack

## Architecture Overview
Three-layer architecture with clear separation of concerns:
- **Frontend**: SvelteKit (TypeScript) on Netlify
- **Backend**: Node.js (TypeScript) with Fastify on Fly.io
- **Data & Auth**: Supabase (PostgreSQL + Auth + Realtime)

## Frontend Stack
- **Framework**: SvelteKit with TypeScript
- **Hosting**: Netlify with preview deployments
- **Responsibilities**: UI rendering, animation, auth token management
- **Characteristics**: Fast perceived performance, animation-heavy UI

## Backend Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Fastify
- **Hosting**: Fly.io (container-based, always-on)
- **Responsibilities**: Business logic, analytical computation, suggestion engines, BFF API
- **Characteristics**: Persistent processes, no cold starts, horizontally scalable

## Data Layer
- **Platform**: Supabase
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Auth**: JWT-based authentication
- **Features**: Realtime subscriptions
- **Rules**: All tables must use RLS, authorization logic lives in data layer

## Development Tools
- **AI Assistant**: Kiro for code generation and scaffolding
- **Source Control**: GitHub
- **Workflow**: Feature branches → Main branch (production)

## Key Architectural Principles
- Rendering and computation are separate concerns
- Persistent backend compute (not serverless-first)
- Authentication and authorization enforced at the data layer
- Backend owns business logic and analytics
- Frontend remains thin and presentation-focused

## Common Commands
*Note: Specific build/test commands will be added as the project develops*

## Deployment
- **Frontend**: Auto-deploy from main branch via Netlify
- **Backend**: Container deployment to Fly.io
- **Data**: Supabase project per environment
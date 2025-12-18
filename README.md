# Espresso Engineered

Community-driven espresso brewing companion focused on **recording brews**, **learning from shared data**, and **surfacing practical grind and recipe suggestions** based on real-world usage.

## Project Structure

This is a monorepo containing three main packages:

- **frontend/** - SvelteKit application (TypeScript)
- **backend/** - Fastify API server (TypeScript)  
- **shared/** - Shared TypeScript types and utilities

## Quick Start

### Install Dependencies

```bash
npm install
```

This will install dependencies for all workspaces.

### Development

Run frontend and backend in development mode:

```bash
# Frontend (SvelteKit)
npm run dev:frontend

# Backend (Fastify)
npm run dev:backend
```

### Testing

Run tests for all packages:

```bash
npm run test:all
```

Or test individual packages:

```bash
npm run test:frontend
npm run test:backend
npm run test:shared
```

### Building

Build all packages:

```bash
npm run build:all
```

## Documentation

- [Architecture](docs/ee-architecture-v1.md)
- [Data Model](docs/ee-data-model-v1.md)
- [System Definition](docs/ee-system-definition-document-v1.md)
- [Frontend README](frontend/README.md)
- [Backend README](backend/README.md)

## Technology Stack

- **Frontend**: SvelteKit with TypeScript on Netlify
- **Backend**: Node.js with Fastify on Fly.io
- **Database**: Supabase (PostgreSQL + Auth + Realtime)
- **Testing**: Jest (backend), Vitest (frontend), fast-check (property-based testing)

## MVP Goals & Scope

This README defines:
- The **Minimum Viable Product (MVP) goals**
- The **explicit V1 scope**
- What is **intentionally out of scope** to keep execution fast and focused

This document is meant to guide development decisions and prevent scope creep.

---

## MVP Goals

The MVP exists to validate three core assumptions:

1. **People want to record espresso brews quickly and cleanly**
2. **Shared brew data is more valuable than isolated notes**
3. **Community-driven suggestions (grind, recipe) are useful even before advanced ML**

To support those assumptions, the MVP must:
- Feel fast and pleasant to use
- Make brew logging frictionless
- Enable basic social interaction around brews
- Establish a clean data foundation for future intelligence

---

## Core User Concept

Users are called **Baristas**.

A Barista:
- Logs espresso brews using beans, grinder, and machine
- Publishes brews publicly by default
- Learns by browsing and comparing brews from others
- Contributes implicitly to communal suggestions

---

## V1 Feature Scope (In Scope)

### Authentication & Identity
- Supabase-based authentication
- Username + password login
- Apple Sign-In
- Each user maps to a Barista record

---

### Brew Logging
Users can create a brew with:
- Beans
- Grinder
- Machine
- Core brew parameters (dose, yield, time, grind setting, notes)

Requirements:
- Offline-capable drafts
- Drafts sync online as soon as data is entered
- Brews are public by default

---

### Brew Visibility & Interaction
- Public brew pages
- View counts
- Likes
- Comments
- Brew-to-brew comparison views

Rules:
- Users cannot edit brews they do not own
- Admins can edit or delete any brew

---

### Community Suggestions (V1 Rules-Based)
Suggestions are based on:
- Beans + Grinder + Machine  
  OR  
- Bag (beans) + Grinder + Machine

Notes:
- Suggestions are communal, not personalized
- No machine learning in V1
- Logic is deterministic and explainable

---

### Admin Capabilities
- Admin portal
- Full CRUD access to all entities
- Ability to remove inappropriate content

---

## Explicitly Out of Scope for V1

The following are intentionally excluded to protect MVP velocity:

- Push notifications
- Advanced personalization
- Machine learning or recommendation models
- Data import/export
- Private brews or follower-only visibility
- Messaging or direct user-to-user communication
- Monetization or subscriptions
- Multi-language support

---

## Non-Goals (Important)

- This is **not** a social network launch
- This is **not** a professional cafe workflow tool
- This is **not** a complete brew science platform (yet)

V1 prioritizes **learning, validation, and extensibility** over completeness.

---

## Technical Philosophy (High-Level)

- Clean data model first
- Simple rules before intelligence
- UI/UX quality over feature count
- Architecture must support future expansion without rewrites

---

## Success Criteria for MVP

The MVP is successful if:
- Users can log brews in under 60 seconds
- Users return to view or compare brews
- Community suggestions feel “good enough” to be helpful
- The system captures high-quality, structured data

---

## Next Phase (Post-V1 Preview)

Future iterations may include:
- Personalized suggestions
- Smarter grind tuning
- Notifications
- Private brews
- Richer social graphs
- Advanced analytics

None of these are required for MVP completion.

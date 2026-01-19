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

- [Architecture](docs/ee-architecture.md)
- [Data Model](docs/ee-data-model.md)
- [System Definition](docs/ee-system-definition-document.md)
- [Frontend README](frontend/README.md)
- [Backend README](backend/README.md)

## Technology Stack

- **Frontend**: SvelteKit with TypeScript on Netlify, Tailwind v4 (token-driven utilities), shadcn-svelte primitives
- **Backend**: Node.js with Fastify on Fly.io
- **Database**: Supabase (PostgreSQL + Auth + Realtime)
- **Testing**: Jest (backend), Vitest (frontend), fast-check (property-based testing)

## Supabase Auth Email Links

Use the backend callback endpoints in Supabase email templates so the API can redirect into the
SvelteKit confirmation screens.

- **Confirm signup email**: `{{ .SiteURL }}/auth/new-account?token_hash={{ .TokenHash }}&type=signup`
- **Reset password email**: `{{ .SiteURL }}/auth/new-password?token_hash={{ .TokenHash }}&type=recovery`

Make sure `Site URL` in Supabase is set to your backend base URL, and set `FRONTEND_BASE_URL`
in the backend environment so redirects land on the correct frontend domain.

### URL Sources (Fly.io + Netlify + Supabase)

- **Backend base URL (Fly.io)**: Use the Fly.io app hostname for your Fastify service, e.g.
  `https://your-app.fly.dev`. This is the value to set in Supabase **Auth → URL Configuration → Site URL**
  because it must reach the `/auth/*` redirect routes on the backend.
- **Frontend base URL (Netlify)**: Use your Netlify site URL from the Netlify dashboard, e.g.
  `https://your-site.netlify.app` (or your custom domain if configured). This is the value to set
  in the backend `FRONTEND_BASE_URL` environment variable so redirect routes land in the UI.
- **Supabase project URL**: Found in the Supabase project settings under **API → Project URL**.
  This value is not used in email templates, but it is the `VITE_SUPABASE_URL` the frontend uses.

If you are using custom domains, substitute the custom domain for the Fly.io or Netlify URLs above.

## Product Goals & Scope

This README defines:
- The core product goals
- The current scope
- What is intentionally out of scope to keep execution focused

This document guides development decisions and prevents scope creep.

---

## Product Goals

The product is designed to validate three core assumptions:

1. **People want to record espresso brews quickly and cleanly**
2. **Shared brew data is more valuable than isolated notes**
3. **Community-driven suggestions (grind, recipe) are useful even before advanced ML**

To support those assumptions, the product must:
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

## Feature Scope (In Scope)

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

### Community Suggestions (Rules-Based)
Suggestions are based on:
- Beans + Grinder + Machine  
  OR  
- Bag (beans) + Grinder + Machine

Notes:
- Suggestions are communal, not personalized
- No machine learning in the current scope
- Logic is deterministic and explainable

---

### Admin Capabilities
- Admin portal
- Full CRUD access to all entities
- Ability to remove inappropriate content

---

## Explicitly Out of Scope

The following are intentionally excluded to protect delivery velocity:

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

The current scope prioritizes **learning, validation, and extensibility** over completeness.

---

## Technical Philosophy (High-Level)

- Clean data model first
- Simple rules before intelligence
- UI/UX quality over feature count
- Architecture must support future expansion without rewrites

---

## Success Criteria

Success is defined by:
- Users can log brews in under 60 seconds
- Users return to view or compare brews
- Community suggestions feel “good enough” to be helpful
- The system captures high-quality, structured data

---

## Future Enhancements

Future iterations may include:
- Personalized suggestions
- Smarter grind tuning
- Notifications
- Private brews
- Richer social graphs
- Advanced analytics

None of these are required for production operation.

# Espresso Engineered Frontend

SvelteKit-based frontend for the Espresso Engineered brew logging system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your Supabase and API URLs

## Development

Start the development server:
```bash
npm run dev
```

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Building

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Code Quality

Check TypeScript and Svelte:
```bash
npm run check
```

Run linting:
```bash
npm run lint
```

Format code:
```bash
npm run format
```

## Deployment

This project is configured for deployment on Netlify using the SvelteKit Netlify adapter.

## Architecture

- **Framework**: SvelteKit with TypeScript
- **Authentication**: Supabase Auth
- **Data**: Supabase client for direct database access
- **API**: Calls to Fastify backend for business logic
- **Styling**: Token-driven CSS in `src/app.css` and `src/lib/ui/**`, Tailwind v4 as an optional utility layer
- **shadcn-svelte**: Primitives live in `src/lib/shadcn` (no replacements of existing UI)
- **Testing**: Vitest with Svelte Testing Library and fast-check
- **Deployment**: Netlify with automatic deployments

## Frontend Layout

- **Tokens**: `src/app.css` and `src/lib/ui/**` are authoritative
- **Tailwind**: `tailwind.config.ts` + `postcss.config.cjs` (utilities consume CSS variables)
- **shadcn**: `src/lib/shadcn/**` for primitives and `src/lib/shadcn/utils`
